import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth";

export default async function PricingPage() {
  const user = await getSessionUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    (user?.email?.split("@")[0] ?? "Account");

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn={!!user} displayName={displayName} />

      <section className="chip-card mb-4 p-6">
        <h1 className="text-3xl font-black">Pricing</h1>
        <p className="mt-2 text-sm text-[#475569]">Start free. Upgrade per chip when you need more control.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="chip-card space-y-3 p-6">
          <h2 className="text-2xl font-black">Free Chip</h2>
          <p className="text-sm text-[#475569]">$0</p>
          <ul className="space-y-2 text-sm">
            <li>1 active chip</li>
            <li>Up to 5 objectives</li>
            <li>Public link sharing</li>
            <li>Threshold + deadline logic</li>
          </ul>
        </article>

        <article className="chip-card space-y-3 border-[#0e7490] p-6">
          <h2 className="text-2xl font-black">Power Upgrade</h2>
          <p className="text-sm text-[#475569]">$1.99 per chip unlock</p>
          <span className="inline-block rounded-full border border-[#0e7490] bg-[#e2f3f6] px-2 py-1 text-xs font-semibold text-[#155e75]">
            Coming Soon
          </span>
          <ul className="space-y-2 text-sm">
            <li>Unlimited objectives</li>
            <li>Recurring chips</li>
            <li>Invite-only mode</li>
            <li>Assignments + reminders</li>
          </ul>
        </article>
      </section>

      <div className="mt-6">
        <Link href={user ? "/dashboard" : "/auth/sign-in"} className="chip-button">
          {user ? "Go to Dashboard" : "Get Started"}
        </Link>
      </div>
    </ScreenContainer>
  );
}
