import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import {
  getExpirationCandidates,
  insertPoolEvent,
  listSucceededContributionsForPool,
  markContributionStatus,
  setPoolStatus,
  upsertContributionPayment,
} from "@/lib/pools";

const env = getServerEnv();

export async function POST(request: Request) {
  const sharedSecret = request.headers.get("x-cron-secret");
  if (sharedSecret !== env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await getExpirationCandidates();
  let transitioned = 0;

  for (const row of candidates) {
    if (row.target_status === "funded") {
      await setPoolStatus({ poolId: row.pool_id, fromStatus: "active", toStatus: "funded" });
      await insertPoolEvent({
        poolId: row.pool_id,
        eventType: "pool_funded_by_deadline",
      });
      transitioned += 1;
      continue;
    }

    await setPoolStatus({ poolId: row.pool_id, fromStatus: "active", toStatus: "refunding" });

    const succeeded = await listSucceededContributionsForPool(row.pool_id);
    let allRefunded = true;

    for (const contribution of succeeded) {
      if (!contribution.stripe_payment_intent_id) {
        allRefunded = false;
        continue;
      }

      try {
        const refund = await stripe.refunds.create({
          payment_intent: contribution.stripe_payment_intent_id,
          reason: "requested_by_customer",
          metadata: {
            reason: "chipin_pool_expired",
            pool_id: row.pool_id,
            contribution_id: contribution.id,
          },
        });
        await markContributionStatus({ contributionId: contribution.id, status: "refunded" });
        await upsertContributionPayment({
          contributionId: contribution.id,
          stripePaymentIntentId: contribution.stripe_payment_intent_id,
          stripeRefundId: refund.id,
        });
      } catch {
        allRefunded = false;
      }
    }

    if (allRefunded) {
      await setPoolStatus({ poolId: row.pool_id, toStatus: "expired" });
      await insertPoolEvent({
        poolId: row.pool_id,
        eventType: "pool_expired_and_refunded",
      });
      transitioned += 1;
    }
  }

  return NextResponse.json({ checked: candidates.length, transitioned });
}
