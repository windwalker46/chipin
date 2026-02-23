"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { requireSessionUser } from "@/lib/auth";
import {
  createPendingContribution,
  createPool,
  getPoolByCode,
  insertPoolEvent,
  setPoolStatus,
  updateOrganizerStripeState,
  upsertContributionPayment,
} from "@/lib/pools";
import { hasUsableStripeSecretKey, stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const env = getServerEnv();

const createPoolSchema = z.object({
  title: z.string().trim().min(1).max(100),
  restaurantName: z.string().trim().max(100).optional(),
  goalAmount: z.coerce.number().min(0).optional(),
  deadlineMinutes: z.coerce.number().int().min(5).max(180),
  tipPercent: z.coerce.number().min(0).max(35).optional(),
});

export async function createPoolAction(formData: FormData) {
  const { user, profile } = await requireSessionUser();

  if (!profile.stripe_account_id || !profile.stripe_onboarding_complete || !profile.payouts_enabled) {
    redirect("/onboarding/stripe");
  }

  const parsed = createPoolSchema.parse({
    title: formData.get("title"),
    restaurantName: formData.get("restaurantName") ?? undefined,
    goalAmount: formData.get("goalAmount") ?? undefined,
    deadlineMinutes: formData.get("deadlineMinutes"),
    tipPercent: formData.get("tipPercent") ?? undefined,
  });

  const goalAmountCents =
    parsed.goalAmount && parsed.goalAmount > 0 ? Math.round(parsed.goalAmount * 100) : undefined;

  const pool = await createPool({
    organizerId: user.id,
    title: parsed.title,
    restaurantName: parsed.restaurantName || undefined,
    goalAmountCents,
    tipPercent: parsed.tipPercent ?? 0,
    deadlineAt: new Date(Date.now() + parsed.deadlineMinutes * 60 * 1000),
  });

  await insertPoolEvent({
    poolId: pool.id,
    eventType: "pool_created",
    metadata: { by: user.id },
  });

  redirect(`/pools/${pool.public_code}`);
}

export async function startStripeConnectAction() {
  const { user, profile } = await requireSessionUser();
  if (!hasUsableStripeSecretKey()) {
    redirect("/onboarding/stripe?error=stripe-not-configured");
  }

  try {
    let accountId = profile.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { chipin_user_id: user.id },
      });
      accountId = account.id;
    }

    const account = await stripe.accounts.retrieve(accountId);
    await updateOrganizerStripeState({
      userId: user.id,
      stripeAccountId: accountId,
      stripeOnboardingComplete: !!account.details_submitted,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
    });

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${env.APP_URL}/onboarding/stripe`,
      return_url: `${env.APP_URL}/dashboard?stripe=connected`,
      type: "account_onboarding",
    });

    redirect(accountLink.url);
  } catch (error) {
    // Next.js redirect() throws internally; never convert that into an API error redirect.
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("responsibilities of managing losses")) {
      redirect("/onboarding/stripe?error=platform-profile");
    }
    if (message.includes("invalid api key")) {
      redirect("/onboarding/stripe?error=stripe-invalid-key");
    }
    if (message.includes("test mode key") || message.includes("live mode key")) {
      redirect("/onboarding/stripe?error=stripe-mode-mismatch");
    }
    if (message.includes("connect")) {
      redirect("/onboarding/stripe?error=stripe-connect-config");
    }

    console.error("startStripeConnectAction failed", error);
    redirect("/onboarding/stripe?error=stripe-api");
  }
}

const contributorSchema = z.object({
  contributorName: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive().max(500),
});

export async function createCheckoutAction(publicCode: string, formData: FormData) {
  if (!hasUsableStripeSecretKey()) {
    redirect(`/join/${publicCode}?unavailable=1`);
  }

  const parsed = contributorSchema.parse({
    contributorName: formData.get("contributorName"),
    amount: formData.get("amount"),
  });

  const pool = await getPoolByCode(publicCode);
  if (!pool) {
    redirect("/");
  }
  if (pool.status !== "active") {
    const statusRoute = pool.status === "funded" ? "funded" : "expired";
    redirect(`/join/${publicCode}/${statusRoute}`);
  }
  if (new Date(pool.deadline_at).getTime() <= Date.now()) {
    redirect(`/join/${publicCode}/expired`);
  }
  if (!pool.organizer_stripe_account_id || !pool.organizer_stripe_connected) {
    redirect(`/join/${publicCode}?unavailable=1`);
  }

  const amountCents = Math.round(parsed.amount * 100);
  const descriptorSuffix = pool.title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16)
    .toUpperCase();

  const contribution = await createPendingContribution({
    poolId: pool.id,
    contributorName: parsed.contributorName,
    amountCents,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${env.APP_URL}/join/${pool.public_code}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/join/${pool.public_code}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `ChipIn: ${pool.title}`,
            description: pool.restaurant_name || "Shared food pool contribution",
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: contribution.platform_fee_cents,
      transfer_data: { destination: pool.organizer_stripe_account_id },
      statement_descriptor_suffix: descriptorSuffix || "CHIPIN",
      metadata: {
        pool_id: pool.id,
        pool_public_code: pool.public_code,
        contribution_id: contribution.id,
      },
    },
    metadata: {
      pool_id: pool.id,
      pool_public_code: pool.public_code,
      contribution_id: contribution.id,
    },
    submit_type: "pay",
  });

  await upsertContributionPayment({
    contributionId: contribution.id,
    stripeCheckoutSessionId: session.id,
    stripeDestinationAccountId: pool.organizer_stripe_account_id,
  });

  await insertPoolEvent({
    poolId: pool.id,
    contributionId: contribution.id,
    eventType: "checkout_session_created",
    metadata: { session_id: session.id },
  });

  if (!session.url) {
    throw new Error("Stripe session did not include a redirect URL.");
  }

  redirect(session.url);
}

export async function cancelPoolAction(poolId: string) {
  const { user } = await requireSessionUser();
  await setPoolStatus({ poolId, fromStatus: "active", toStatus: "canceled" });
  await insertPoolEvent({
    poolId,
    eventType: "pool_canceled",
    metadata: { by: user.id },
  });
  revalidatePath("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
