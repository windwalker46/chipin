import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";

export default function Home() {
  return (
    <ScreenContainer>
      <header className="mb-12 flex items-center justify-between">
        <span className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-sm font-bold tracking-wide">
          CHIPIN
        </span>
        <Link href="/auth/sign-in" className="rounded-lg border border-[#0e7490] px-3 py-2 text-sm font-semibold">
          Sign In
        </Link>
      </header>

      <section className="chip-card space-y-5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155e75]">Group Orders, Zero Chasing</p>
        <h1 className="text-4xl font-black leading-tight">Split food orders instantly.</h1>
        <p className="text-base text-[#334155]">No chasing payments. No fronting money.</p>
        <Link href="/auth/sign-in" className="chip-button">
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
