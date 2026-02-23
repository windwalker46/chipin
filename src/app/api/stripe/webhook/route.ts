import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import {
  findContributionByCharge,
  getContributionById,
  findContributionByPaymentIntent,
  findContributionBySession,
  insertPoolEvent,
  insertWebhookEventIfNew,
  markContributionStatus,
  markWebhookProcessed,
  upsertContributionPayment,
  upsertDispute,
} from "@/lib/pools";

const env = getServerEnv();

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const isNew = await insertWebhookEventIfNew({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    payload: event,
  });

  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const contributionId = session.metadata?.contribution_id;
      const contribution =
        (contributionId ? await getContributionById(contributionId) : undefined) ??
        (await findContributionBySession(session.id));

      if (contribution) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        let chargeId: string | null = null;
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId =
            typeof paymentIntent.latest_charge === "string"
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge?.id ?? null;
        }

        await markContributionStatus({ contributionId: contribution.id, status: "succeeded" });
        await upsertContributionPayment({
          contributionId: contribution.id,
          contributorEmail: session.customer_details?.email ?? session.customer_email ?? null,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: chargeId,
        });
        await insertPoolEvent({
          poolId: contribution.pool_id,
          contributionId: contribution.id,
          eventType: "contribution_succeeded",
          metadata: { checkout_session_id: session.id },
        });
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null;

      const contribution =
        (paymentIntentId ? await findContributionByPaymentIntent(paymentIntentId) : undefined) ??
        (await findContributionByCharge(charge.id));

      if (contribution) {
        await markContributionStatus({ contributionId: contribution.id, status: "refunded" });
        await upsertContributionPayment({
          contributionId: contribution.id,
          stripeChargeId: charge.id,
          stripePaymentIntentId: paymentIntentId,
          stripeRefundId: charge.refunds?.data?.[0]?.id ?? null,
        });
        await insertPoolEvent({
          poolId: contribution.pool_id,
          contributionId: contribution.id,
          eventType: "contribution_refunded",
          metadata: { charge_id: charge.id },
        });
      }
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
      const contribution = chargeId ? await findContributionByCharge(chargeId) : undefined;

      await upsertDispute({
        id: dispute.id,
        contributionId: contribution?.id,
        amountCents: dispute.amount,
        reason: dispute.reason ?? null,
        status: dispute.status,
        payload: dispute,
      });

      if (contribution) {
        await insertPoolEvent({
          poolId: contribution.pool_id,
          contributionId: contribution.id,
          eventType: "charge_dispute_created",
          metadata: { dispute_id: dispute.id },
        });
      }
    }

    await markWebhookProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook failure";
    await markWebhookProcessed(event.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
