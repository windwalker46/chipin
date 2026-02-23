import Link from "next/link";
import { redirect } from "next/navigation";
import { createCheckoutAction } from "@/app/actions";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { formatPercent, formatUsd } from "@/lib/format";
import { getPoolByCode } from "@/lib/pools";

export default async function JoinPoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ unavailable?: string }>;
}) {
  const { publicCode } = await params;
  const search = await searchParams;
  const pool = await getPoolByCode(publicCode);

  if (!pool) redirect("/");
  if (pool.status === "funded") redirect(`/join/${publicCode}/funded`);
  if (pool.status === "expired" || pool.status === "refunding" || pool.status === "canceled") {
    redirect(`/join/${publicCode}/expired`);
  }

  const percent = formatPercent(pool.collected_amount_cents, pool.goal_amount_cents) ?? 0;

  return (
    <ScreenContainer>
      <header className="mb-3">
        <Link href="/" className="text-sm font-semibold text-[#155e75]">
          ChipIn
        </Link>
      </header>

      <section className="chip-card space-y-4 p-5">
        <h1 className="text-3xl font-black">{pool.title}</h1>
        <p className="text-sm text-[#475569]">Organized by {pool.organizer_name ?? "Organizer"}</p>
        <div className="flex items-center justify-between text-sm">
          <span>
            {formatUsd(pool.collected_amount_cents)}
            {pool.goal_amount_cents ? ` / ${formatUsd(pool.goal_amount_cents)}` : ""}
          </span>
          <Countdown deadlineAt={pool.deadline_at} />
        </div>
        <ProgressBar value={percent} />

        {search.unavailable ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
            This pool is temporarily unavailable for checkout.
          </p>
        ) : null}

        <form action={createCheckoutAction.bind(null, publicCode)} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Name</span>
            <input className="chip-input" name="contributorName" maxLength={80} required placeholder="Ben" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Contribution Amount</span>
            <input
              className="chip-input"
              name="amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="18.00"
            />
          </label>
          <button className="chip-button" type="submit">
            Contribute
          </button>
          <p className="text-xs text-[#64748b]">Secure checkout powered by Stripe. No account required.</p>
        </form>
      </section>
    </ScreenContainer>
  );
}
