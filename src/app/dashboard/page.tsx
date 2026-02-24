import Link from "next/link";
import { cancelPoolAction, signOutAction, startStripeConnectAction } from "@/app/actions";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { formatPercent, formatUsd } from "@/lib/format";
import { listOrganizerPools } from "@/lib/pools";
import { requireSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user, profile } = await requireSessionUser();
  const stripeReady =
    !!profile.stripe_account_id &&
    profile.stripe_onboarding_complete &&
    profile.charges_enabled &&
    profile.payouts_enabled;

  const pools = await listOrganizerPools(user.id);
  const active = pools.filter((p) => p.status === "active");
  const past = pools.filter((p) => p.status !== "active");

  return (
    <ScreenContainer>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#155e75]">Organizer Dashboard</p>
          <h1 className="text-2xl font-black">Your Pools</h1>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold">
            Sign Out
          </button>
        </form>
      </header>

      <Link href="/pools/new" className="chip-button mb-6">
        Create New Pool
      </Link>

      {!stripeReady ? (
        <section className="chip-card mb-6 space-y-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Enable Payments</h2>
          <p className="text-sm text-[#475569]">
            One-time Stripe setup takes about 2 minutes. You can keep creating pools while this is pending.
          </p>
          <form action={startStripeConnectAction}>
            <input type="hidden" name="returnPath" value="/dashboard" />
            <button type="submit" className="chip-button">
              Enable Stripe Payouts
            </button>
          </form>
        </section>
      ) : (
        <section className="chip-card mb-6 p-4 text-sm text-[#14532d]">Stripe connected. Contributors can pay your pools.</section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Active Pools</h2>
        {active.length === 0 ? (
          <div className="chip-card p-4 text-sm text-[#475569]">No active pools.</div>
        ) : (
          active.map((pool) => {
            const percent = formatPercent(pool.collected_amount_cents, pool.goal_amount_cents);
            return (
              <article className="chip-card space-y-3 p-4" key={pool.id}>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/pools/${pool.public_code}`} className="text-lg font-bold">
                    {pool.title}
                  </Link>
                  <StatusBadge status={pool.status} />
                </div>
                <p className="text-sm text-[#475569]">
                  {formatUsd(pool.collected_amount_cents)}
                  {pool.goal_amount_cents ? ` / ${formatUsd(pool.goal_amount_cents)}` : ""}
                </p>
                <ProgressBar value={percent ?? 0} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#475569]">{pool.contribution_count} contributors</span>
                  <Countdown deadlineAt={pool.deadline_at} />
                </div>
                <form action={cancelPoolAction.bind(null, pool.id)}>
                  <button type="submit" className="w-full rounded-lg border border-[#fecaca] py-2 text-sm font-semibold text-[#991b1b]">
                    Cancel Pool
                  </button>
                </form>
              </article>
            );
          })
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Past Pools</h2>
        {past.length === 0 ? (
          <div className="chip-card p-4 text-sm text-[#475569]">No past pools.</div>
        ) : (
          past.map((pool) => (
            <article className="chip-card flex items-center justify-between p-4" key={pool.id}>
              <Link href={`/pools/${pool.public_code}`} className="font-semibold">
                {pool.title}
              </Link>
              <StatusBadge status={pool.status} />
            </article>
          ))
        )}
      </section>
    </ScreenContainer>
  );
}
