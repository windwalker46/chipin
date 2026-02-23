import Link from "next/link";
import { redirect } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { formatPercent, formatUsd } from "@/lib/format";
import { findContributionBySession, getPoolByCode } from "@/lib/pools";

export default async function ContributionSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { publicCode } = await params;
  const { session_id: sessionId } = await searchParams;

  const pool = await getPoolByCode(publicCode);
  if (!pool) redirect("/");

  const contribution = sessionId ? await findContributionBySession(sessionId) : undefined;
  const percent = formatPercent(pool.collected_amount_cents, pool.goal_amount_cents) ?? 0;

  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6">
        <h1 className="text-3xl font-black">You&apos;re in!</h1>
        <p className="text-sm text-[#475569]">
          {contribution ? `You contributed ${formatUsd(contribution.amount_cents)}.` : "Contribution received."}
        </p>
        <div className="rounded-xl bg-[#ecfeff] p-3">
          <p className="text-sm">
            {formatUsd(pool.collected_amount_cents)}
            {pool.goal_amount_cents ? ` / ${formatUsd(pool.goal_amount_cents)}` : ""}
          </p>
          <div className="mt-2">
            <ProgressBar value={percent} />
          </div>
          <div className="mt-2 text-sm">
            <Countdown deadlineAt={pool.deadline_at} />
          </div>
        </div>
        <Link href={`/join/${publicCode}`} className="chip-button">
          Back to pool
        </Link>
      </section>
    </ScreenContainer>
  );
}
