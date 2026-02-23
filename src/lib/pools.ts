import { randomUUID } from "crypto";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import type { ContributionRow, PoolWithOrganizer, PoolStatus } from "@/lib/types";

const env = getServerEnv();

export async function upsertProfileFromUser(user: User) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (user.email?.split("@")[0] ?? "Organizer");

  await db.query(
    `
      insert into public.profiles (id, full_name)
      values ($1, $2)
      on conflict (id)
      do update set full_name = excluded.full_name, updated_at = now()
    `,
    [user.id, fullName],
  );
}

export async function getOrganizerProfile(userId: string) {
  const result = await db.query(
    `
      select
        id,
        full_name,
        stripe_account_id,
        stripe_onboarding_complete,
        charges_enabled,
        payouts_enabled,
        is_disabled
      from public.profiles
      where id = $1
      limit 1
    `,
    [userId],
  );
  return result.rows[0] as
    | {
        id: string;
        full_name: string | null;
        stripe_account_id: string | null;
        stripe_onboarding_complete: boolean;
        charges_enabled: boolean;
        payouts_enabled: boolean;
        is_disabled: boolean;
      }
    | undefined;
}

export async function updateOrganizerStripeState(input: {
  userId: string;
  stripeAccountId: string;
  stripeOnboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}) {
  await db.query(
    `
      update public.profiles
      set
        stripe_account_id = $2,
        stripe_onboarding_complete = $3,
        charges_enabled = $4,
        payouts_enabled = $5,
        updated_at = now()
      where id = $1
    `,
    [
      input.userId,
      input.stripeAccountId,
      input.stripeOnboardingComplete,
      input.chargesEnabled,
      input.payoutsEnabled,
    ],
  );
}

export async function listOrganizerPools(organizerId: string) {
  const result = await db.query(
    `
      select
        p.*,
        pr.full_name as organizer_name,
        pr.stripe_account_id as organizer_stripe_account_id,
        (pr.stripe_onboarding_complete and pr.payouts_enabled and pr.charges_enabled) as organizer_stripe_connected
      from public.pools p
      join public.profiles pr on pr.id = p.organizer_id
      where p.organizer_id = $1
      order by p.created_at desc
    `,
    [organizerId],
  );
  return result.rows as PoolWithOrganizer[];
}

export async function createPool(input: {
  organizerId: string;
  title: string;
  restaurantName?: string;
  goalAmountCents?: number;
  deadlineAt: Date;
  tipPercent?: number;
}) {
  const result = await db.query(
    `
      insert into public.pools (
        organizer_id,
        title,
        restaurant_name,
        goal_amount_cents,
        deadline_at,
        tip_percent
      )
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    [
      input.organizerId,
      input.title.trim(),
      input.restaurantName?.trim() || null,
      input.goalAmountCents ?? null,
      input.deadlineAt.toISOString(),
      input.tipPercent ?? 0,
    ],
  );
  return result.rows[0] as PoolWithOrganizer;
}

export async function getPoolByCode(publicCode: string) {
  const result = await db.query(
    `
      select
        p.*,
        pr.full_name as organizer_name,
        pr.stripe_account_id as organizer_stripe_account_id,
        (pr.stripe_onboarding_complete and pr.payouts_enabled and pr.charges_enabled) as organizer_stripe_connected
      from public.pools p
      join public.profiles pr on pr.id = p.organizer_id
      where p.public_code = $1
      limit 1
    `,
    [publicCode],
  );
  return result.rows[0] as PoolWithOrganizer | undefined;
}

export async function listPoolContributions(poolId: string) {
  const result = await db.query(
    `
      select
        id,
        pool_id,
        contributor_name,
        amount_cents,
        platform_fee_cents,
        status,
        paid_at,
        refunded_at,
        created_at
      from public.contributions
      where pool_id = $1
        and status in ('succeeded', 'refunded')
      order by created_at asc
    `,
    [poolId],
  );
  return result.rows as ContributionRow[];
}

export async function createPendingContribution(input: {
  poolId: string;
  contributorName: string;
  amountCents: number;
}) {
  const applicationFee = Math.round((input.amountCents * env.STRIPE_PLATFORM_FEE_BPS) / 10000);
  const result = await db.query(
    `
      insert into public.contributions (
        pool_id,
        contributor_name,
        amount_cents,
        platform_fee_cents,
        status
      )
      values ($1, $2, $3, $4, 'pending')
      returning *
    `,
    [input.poolId, input.contributorName.trim(), input.amountCents, applicationFee],
  );
  return result.rows[0] as ContributionRow;
}

export async function upsertContributionPayment(input: {
  contributionId: string;
  contributorEmail?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  stripeRefundId?: string | null;
  stripeTransferId?: string | null;
  stripeDestinationAccountId?: string | null;
}) {
  await db.query(
    `
      insert into public.contribution_payments (
        contribution_id,
        contributor_email,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        stripe_charge_id,
        stripe_refund_id,
        stripe_transfer_id,
        stripe_destination_account_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (contribution_id)
      do update set
        contributor_email = coalesce(excluded.contributor_email, public.contribution_payments.contributor_email),
        stripe_checkout_session_id = coalesce(excluded.stripe_checkout_session_id, public.contribution_payments.stripe_checkout_session_id),
        stripe_payment_intent_id = coalesce(excluded.stripe_payment_intent_id, public.contribution_payments.stripe_payment_intent_id),
        stripe_charge_id = coalesce(excluded.stripe_charge_id, public.contribution_payments.stripe_charge_id),
        stripe_refund_id = coalesce(excluded.stripe_refund_id, public.contribution_payments.stripe_refund_id),
        stripe_transfer_id = coalesce(excluded.stripe_transfer_id, public.contribution_payments.stripe_transfer_id),
        stripe_destination_account_id = coalesce(excluded.stripe_destination_account_id, public.contribution_payments.stripe_destination_account_id),
        updated_at = now()
    `,
    [
      input.contributionId,
      input.contributorEmail ?? null,
      input.stripeCheckoutSessionId ?? null,
      input.stripePaymentIntentId ?? null,
      input.stripeChargeId ?? null,
      input.stripeRefundId ?? null,
      input.stripeTransferId ?? null,
      input.stripeDestinationAccountId ?? null,
    ],
  );
}

export async function getContributionById(contributionId: string) {
  const result = await db.query(
    `
      select c.*, cp.stripe_payment_intent_id, cp.stripe_checkout_session_id, cp.stripe_charge_id
      from public.contributions c
      left join public.contribution_payments cp on cp.contribution_id = c.id
      where c.id = $1
      limit 1
    `,
    [contributionId],
  );
  return result.rows[0] as
    | (ContributionRow & {
        stripe_payment_intent_id: string | null;
        stripe_checkout_session_id: string | null;
        stripe_charge_id: string | null;
      })
    | undefined;
}

export async function findContributionBySession(sessionId: string) {
  const result = await db.query(
    `
      select c.*
      from public.contributions c
      join public.contribution_payments cp on cp.contribution_id = c.id
      where cp.stripe_checkout_session_id = $1
      limit 1
    `,
    [sessionId],
  );
  return result.rows[0] as ContributionRow | undefined;
}

export async function findContributionByPaymentIntent(paymentIntentId: string) {
  const result = await db.query(
    `
      select c.*
      from public.contributions c
      join public.contribution_payments cp on cp.contribution_id = c.id
      where cp.stripe_payment_intent_id = $1
      limit 1
    `,
    [paymentIntentId],
  );
  return result.rows[0] as ContributionRow | undefined;
}

export async function findContributionByCharge(chargeId: string) {
  const result = await db.query(
    `
      select c.*
      from public.contributions c
      join public.contribution_payments cp on cp.contribution_id = c.id
      where cp.stripe_charge_id = $1
      limit 1
    `,
    [chargeId],
  );
  return result.rows[0] as ContributionRow | undefined;
}

export async function markContributionStatus(input: {
  contributionId: string;
  status: "succeeded" | "refunded" | "failed";
}) {
  const paidAt = input.status === "succeeded" ? "now()" : "paid_at";
  const refundedAt = input.status === "refunded" ? "now()" : "refunded_at";

  await db.query(
    `
      update public.contributions
      set
        status = $2,
        paid_at = ${paidAt},
        refunded_at = ${refundedAt},
        updated_at = now()
      where id = $1
    `,
    [input.contributionId, input.status],
  );
}

export async function insertPoolEvent(input: {
  poolId: string;
  contributionId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await db.query(
    `
      insert into public.pool_events (pool_id, contribution_id, event_type, metadata)
      values ($1, $2, $3, $4)
    `,
    [input.poolId, input.contributionId ?? null, input.eventType, JSON.stringify(input.metadata ?? {})],
  );
}

export async function insertWebhookEventIfNew(input: {
  id: string;
  type: string;
  livemode: boolean;
  payload: unknown;
}) {
  const result = await db.query(
    `
      insert into public.webhook_events (id, type, livemode, payload)
      values ($1, $2, $3, $4)
      on conflict (id) do nothing
      returning id
    `,
    [input.id, input.type, input.livemode, JSON.stringify(input.payload)],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markWebhookProcessed(eventId: string, processingError?: string) {
  await db.query(
    `
      update public.webhook_events
      set processed_at = now(), processing_error = $2
      where id = $1
    `,
    [eventId, processingError ?? null],
  );
}

export async function setPoolStatus(input: {
  poolId: string;
  fromStatus?: PoolStatus;
  toStatus: PoolStatus;
}) {
  const col =
    input.toStatus === "funded"
      ? "funded_at"
      : input.toStatus === "expired"
        ? "expired_at"
        : input.toStatus === "canceled"
          ? "canceled_at"
          : null;

  if (input.fromStatus) {
    await db.query(
      `
        update public.pools
        set
          status = $3,
          ${col ? `${col} = now(),` : ""}
          updated_at = now()
        where id = $1 and status = $2
      `,
      [input.poolId, input.fromStatus, input.toStatus],
    );
    return;
  }

  await db.query(
    `
      update public.pools
      set
        status = $2,
        ${col ? `${col} = now(),` : ""}
        updated_at = now()
      where id = $1
    `,
    [input.poolId, input.toStatus],
  );
}

export async function getExpirationCandidates() {
  const result = await db.query(
    `select * from public.list_pools_past_deadline(now())`,
  );
  return result.rows as Array<{
    pool_id: string;
    public_code: string;
    current_status: PoolStatus;
    target_status: PoolStatus;
    collected_amount_cents: number;
    goal_amount_cents: number | null;
  }>;
}

export async function listSucceededContributionsForPool(poolId: string) {
  const result = await db.query(
    `
      select c.id, cp.stripe_payment_intent_id
      from public.contributions c
      join public.contribution_payments cp on cp.contribution_id = c.id
      where c.pool_id = $1 and c.status = 'succeeded'
    `,
    [poolId],
  );

  return result.rows as Array<{ id: string; stripe_payment_intent_id: string | null }>;
}

export async function createPoolLinkToken() {
  return randomUUID();
}

export async function upsertDispute(input: {
  id: string;
  contributionId?: string;
  amountCents: number;
  reason?: string | null;
  status: string;
  payload: unknown;
}) {
  await db.query(
    `
      insert into public.stripe_disputes (
        id,
        contribution_id,
        amount_cents,
        reason,
        status,
        payload
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id)
      do update set
        contribution_id = coalesce(excluded.contribution_id, public.stripe_disputes.contribution_id),
        amount_cents = excluded.amount_cents,
        reason = excluded.reason,
        status = excluded.status,
        payload = excluded.payload,
        updated_at = now()
    `,
    [
      input.id,
      input.contributionId ?? null,
      input.amountCents,
      input.reason ?? null,
      input.status,
      JSON.stringify(input.payload),
    ],
  );
}
