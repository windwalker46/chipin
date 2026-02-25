import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth";

export default async function ContactPage() {
  const user = await getSessionUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    (user?.email?.split("@")[0] ?? "Account");

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn={!!user} displayName={displayName} />
      <section className="chip-card space-y-4 p-6">
        <h1 className="text-3xl font-black">Contact</h1>
        <p className="text-[#334155]">For support, bug reports, or partnership requests, email:</p>
        <a href="mailto:help@chipin.app" className="inline-block rounded-lg border border-[#0e7490] px-4 py-2 font-semibold text-[#155e75]">
          help@chipin.app
        </a>
      </section>
    </ScreenContainer>
  );
}
