import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startStripeConnectAction } from "@/app/actions";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { ShareLink } from "@/components/share-link";
import { StatusBadge } from "@/components/status-badge";
import { formatPercent, formatUsd } from "@/lib/format";
import { listPoolContributions, getPoolByCode } from "@/lib/pools";
import { requireSessionUser } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";

export default async function OrganizerPoolView({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { user } = await requireSessionUser();
  const { publicCode } = await params;
  const pool = await getPoolByCode(publicCode);

  if (!pool) notFound();
  if (pool.organizer_id !== user.id) redirect(`/join/${publicCode}`);

  const contributions = await listPoolContributions(pool.id);
  const percent = formatPercent(pool.collected_amount_cents, pool.goal_amount_cents) ?? 0;
  const env = getServerEnv();
  const shareUrl = `${env.APP_URL}/join/${pool.public_code}`;
  const stripeReady = !!pool.organizer_stripe_connected;

  return (
    <ScreenContainer>
      <header className="mb-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[#155e75]">
          Back to dashboard
        </Link>
      </header>

      <section className="chip-card space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-black">{pool.title}</h1>
          <StatusBadge status={pool.status} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>{pool.restaurant_name || "Restaurant TBD"}</span>
          <Countdown deadlineAt={pool.deadline_at} />
        </div>
        <p className="font-semibold">
          {formatUsd(pool.collected_amount_cents)}
          {pool.goal_amount_cents ? ` / ${formatUsd(pool.goal_amount_cents)}` : ""}
        </p>
        <ProgressBar value={percent} />
      </section>

      <section className="chip-card mt-5 space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Share</h2>
        {!stripeReady ? (
          <div className="space-y-2 rounded-lg bg-[#ffedd5] p-3 text-sm text-[#7c2d12]">
            <p>Connect Stripe before sharing. Contributors can view this pool but cannot pay yet.</p>
            <form action={startStripeConnectAction}>
              <button type="submit" className="rounded-lg border border-[#fdba74] bg-white px-3 py-2 text-sm font-semibold">
                Connect with Stripe
              </button>
            </form>
          </div>
        ) : null}
        <ShareLink url={shareUrl} />
        <p className="truncate text-xs text-[#64748b]">{shareUrl}</p>
      </section>

      <section className="chip-card mt-5 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Contributors</h2>
        <ul className="mt-3 space-y-2">
          {contributions.length === 0 ? (
            <li className="text-sm text-[#64748b]">No contributions yet.</li>
          ) : (
            contributions.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between text-sm">
                <span>{entry.contributor_name}</span>
                <span className="font-semibold">{formatUsd(entry.amount_cents)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </ScreenContainer>
  );
}
