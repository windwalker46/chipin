import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { listCreatorChips } from "@/lib/chips";
import { formatPercent } from "@/lib/format";
import { requireSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireSessionUser();
  const chips = await listCreatorChips(user.id);
  const activeLike = chips.filter((c) => c.status === "pending" || c.status === "active");
  const past = chips.filter((c) => c.status !== "pending" && c.status !== "active");

  return (
    <ScreenContainer>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#155e75]">Creator Dashboard</p>
          <h1 className="text-2xl font-black">Your Chips</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold">
            Profile
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-semibold">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <section className="chip-card mb-6 space-y-3 p-4 text-sm">
        <p className="font-semibold text-[#0e7490]">Free Chip Mode</p>
        <p className="text-[#475569]">1 active chip at a time, public links, up to 5 objectives.</p>
      </section>

      <Link href="/chips/new" className="chip-button mb-6">
        Create New Chip
      </Link>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Pending & Active</h2>
        {activeLike.length === 0 ? (
          <div className="chip-card p-4 text-sm text-[#475569]">No active chips.</div>
        ) : (
          activeLike.map((chip) => {
            const percent = formatPercent(chip.participant_count, chip.threshold_count) ?? 0;
            return (
              <article className="chip-card space-y-3 p-4" key={chip.id}>
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/chips/${chip.public_code}`} className="text-lg font-bold">
                    {chip.title}
                  </Link>
                  <StatusBadge status={chip.status} />
                </div>
                <p className="text-sm text-[#475569]">
                  {chip.participant_count}/{chip.threshold_count} committed
                </p>
                <ProgressBar value={percent} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#475569]">{chip.objective_count} objectives</span>
                  <Countdown deadlineAt={chip.deadline_at} />
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Past Chips</h2>
        {past.length === 0 ? (
          <div className="chip-card p-4 text-sm text-[#475569]">No completed or expired chips yet.</div>
        ) : (
          past.map((chip) => (
            <article className="chip-card flex items-center justify-between p-4" key={chip.id}>
              <Link href={`/chips/${chip.public_code}`} className="font-semibold">
                {chip.title}
              </Link>
              <StatusBadge status={chip.status} />
            </article>
          ))
        )}
      </section>
    </ScreenContainer>
  );
}
