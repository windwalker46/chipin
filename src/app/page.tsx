import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { getSessionUser } from "@/lib/auth";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const next = params.next && params.next.startsWith("/") ? params.next : "/dashboard";
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
      <header className="mb-12 flex items-center justify-between">
        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-sm font-bold tracking-wide">
          CHIPIN
        </span>
        {user ? (
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-[#0e7490] px-3 py-2 text-sm font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0e7490] text-xs font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[8rem] truncate">{displayName}</span>
          </Link>
        ) : (
          <Link href="/auth/sign-in" className="rounded-lg border border-[#0e7490] px-3 py-2 text-sm font-semibold">
            Sign In
          </Link>
        )}
      </header>

      <section className="chip-card space-y-5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155e75]">Group Orders, Zero Chasing</p>
        <h1 className="text-4xl font-black leading-tight">Split food orders instantly.</h1>
        <p className="text-base text-[#334155]">No chasing payments. No fronting money.</p>
        <Link href={ctaHref} className="chip-button">
          Start a Food Pool
        </Link>
      </section>

      <section className="mt-8 chip-card p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0e7490]">How It Works</h2>
        <ol className="mt-4 space-y-3 text-base">
          <li>1. Create pool</li>
          <li>2. Share link</li>
          <li>3. Everyone pays directly</li>
        </ol>
      </section>

      <footer className="mt-10 flex justify-between text-sm text-[#475569]">
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <a href="mailto:help@chipin.app">Contact</a>
      </footer>
    </ScreenContainer>
  );
}
