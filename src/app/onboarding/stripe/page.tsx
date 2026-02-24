import { redirect } from "next/navigation";
import { startStripeConnectAction } from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { requireSessionUser } from "@/lib/auth";
import { hasUsableStripeSecretKey, stripe } from "@/lib/stripe";
import { updateOrganizerStripeState } from "@/lib/pools";

export default async function StripeOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, profile } = await requireSessionUser();
  const { error } = await searchParams;
  let configError: string | null = null;

  if (!hasUsableStripeSecretKey()) {
    configError = "Stripe is not configured yet. Add a valid STRIPE_SECRET_KEY in deployment environment variables.";
  } else if (profile.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      await updateOrganizerStripeState({
        userId: user.id,
        stripeAccountId: profile.stripe_account_id,
        stripeOnboardingComplete: !!account.details_submitted,
        chargesEnabled: !!account.charges_enabled,
        payoutsEnabled: !!account.payouts_enabled,
      });

      if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
        redirect("/dashboard");
      }
    } catch {
      configError = "Stripe account lookup failed. Verify STRIPE_SECRET_KEY and try again.";
    }
  }

  if (!configError && error === "platform-profile") {
    configError =
      "Stripe setup required: complete your Connect Platform Profile and accept loss responsibilities in Stripe Dashboard -> Settings -> Connect -> Platform profile.";
  }

  if (!configError && error === "stripe-invalid-key") {
    configError = "Invalid Stripe secret key. Set a valid STRIPE_SECRET_KEY in Vercel and redeploy.";
  }

  if (!configError && error === "stripe-mode-mismatch") {
    configError =
      "Stripe mode mismatch. Your key mode (test/live) does not match existing Stripe account resources.";
  }

  if (!configError && error === "stripe-connect-config") {
    configError = "Stripe Connect setup is incomplete in your Stripe dashboard. Review Connect settings and retry.";
  }

  if (!configError && error === "stripe-api") {
    configError = "Stripe request failed. Check Stripe dashboard settings and API keys, then try again.";
  }

  const disableConnect =
    !hasUsableStripeSecretKey() ||
    error === "stripe-not-configured" ||
    error === "stripe-invalid-key";

  return (
    <ScreenContainer>
      <section className="chip-card space-y-5 p-6">
        <h1 className="text-3xl font-black">Enable Stripe Payouts</h1>
        <p className="text-sm text-[#475569]">
          One-time setup so ChipIn can route contributions directly to your Stripe account.
        </p>
        <ul className="rounded-lg bg-[#ecfeff] p-3 text-xs text-[#155e75]">
          <li>1. Review account details</li>
          <li>2. Confirm payout info</li>
          <li>3. Return to your pool dashboard</li>
        </ul>
        {configError ? <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">{configError}</p> : null}
        <form action={startStripeConnectAction}>
          <input type="hidden" name="returnPath" value="/dashboard" />
          <button className="chip-button" type="submit" disabled={disableConnect}>
            Continue to Stripe
          </button>
        </form>
      </section>
    </ScreenContainer>
  );
}
