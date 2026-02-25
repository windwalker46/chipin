import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth";
import { normalizeNextPath } from "@/lib/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const next = normalizeNextPath(params.next);
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=${encodeURIComponent(next)}`);
  }

  const user = await getSessionUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    (user?.email?.split("@")[0] ?? "Account");
  const ctaHref = user ? "/dashboard" : "/auth/sign-in";

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn={!!user} displayName={displayName} />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="chip-card space-y-5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155e75]">Threshold + Collective Task Engine</p>
          <h1 className="text-4xl font-black leading-tight md:text-5xl">Activate group momentum.</h1>
          <p className="text-base text-[#334155]">
            Set a threshold. Share one link. When enough people commit, the chip activates and your group executes together.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={ctaHref} className="chip-button">
              Start a Chip
            </Link>
            <Link href="/about" className="chip-button chip-button-secondary">
              Learn More
            </Link>
          </div>
        </article>

        <article className="chip-card p-6 md:p-8">
          <div className="rounded-xl border border-[#d5e8ee] bg-[#f8fcfd] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#155e75]">Live Chip Preview</p>
            <h3 className="mt-2 text-xl font-black">Saturday Deep Clean</h3>
            <p className="mt-1 text-sm text-[#475569]">3 of 4 committed</p>
            <div className="mt-3 h-2 rounded-full bg-[#d9edf2]">
              <div className="h-2 w-3/4 rounded-full bg-[#0e7490]" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
                <span>Kitchen</span>
                <span className="text-[#166534]">Done</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
                <span>Bathroom</span>
                <span className="text-[#475569]">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
                <span>Vacuum</span>
                <span className="text-[#475569]">Pending</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-[#64748b]">Fast setup, clear commitments, visible progress.</p>
        </article>
      </section>

      <section className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[#dbe7eb] bg-white px-3 py-2 text-sm font-semibold text-[#155e75]">No app download</div>
        <div className="rounded-xl border border-[#dbe7eb] bg-white px-3 py-2 text-sm font-semibold text-[#155e75]">Real-time status</div>
        <div className="rounded-xl border border-[#dbe7eb] bg-white px-3 py-2 text-sm font-semibold text-[#155e75]">Built for accountability</div>
      </section>

      <section className="mt-8 chip-card p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0e7490]">How It Works</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#155e75]">Step 1</p>
            <h3 className="mt-1 font-bold">Create</h3>
            <p className="mt-1 text-sm text-[#475569]">Set title, threshold, deadline, and objectives.</p>
          </article>
          <article className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#155e75]">Step 2</p>
            <h3 className="mt-1 font-bold">Commit</h3>
            <p className="mt-1 text-sm text-[#475569]">Share one link and collect participant commitments.</p>
          </article>
          <article className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#155e75]">Step 3</p>
            <h3 className="mt-1 font-bold">Execute</h3>
            <p className="mt-1 text-sm text-[#475569]">Chip activates and objectives are completed together.</p>
          </article>
        </div>
      </section>

      <section className="mt-8 chip-card p-6 md:p-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0e7490]">Built For Real Groups</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Fitness challenges</p>
            <p className="mt-1 text-[#475569]">Activate when enough people commit.</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Study sessions</p>
            <p className="mt-1 text-[#475569]">Run focused sessions with shared objectives.</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Roommate tasks</p>
            <p className="mt-1 text-[#475569]">Coordinate chores with visible completion status.</p>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-[#dbe7eb] pt-5 text-sm text-[#475569]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium">© 2026 / ChipIn</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </ScreenContainer>
  );
}
