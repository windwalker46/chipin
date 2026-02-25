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

      <section className="chip-card space-y-5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155e75]">Threshold + Collective Task Engine</p>
        <h1 className="text-4xl font-black leading-tight">Activate group momentum.</h1>
        <p className="text-base text-[#334155]">If enough people commit, the chip activates. Then your group executes together.</p>
        <Link href={ctaHref} className="chip-button">
          Start a Chip
        </Link>
      </section>

      <section className="mt-8 chip-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0e7490]">How It Works</h2>
        <ol className="mt-4 space-y-3 text-base">
          <li>1. Create a chip with threshold and deadline</li>
          <li>2. Share the chip link and collect commitments</li>
          <li>3. Auto-activate and complete objectives together</li>
        </ol>
      </section>

      <section className="mt-8 chip-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0e7490]">Built For Real Groups</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-[#e2e8f0] p-3">Fitness challenges</div>
          <div className="rounded-lg border border-[#e2e8f0] p-3">Study sessions</div>
          <div className="rounded-lg border border-[#e2e8f0] p-3">Roommate tasks</div>
        </div>
      </section>

      <footer className="mt-10 flex justify-between text-sm text-[#475569]">
        <Link href="/about">About</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/contact">Contact</Link>
      </footer>
    </ScreenContainer>
  );
}
