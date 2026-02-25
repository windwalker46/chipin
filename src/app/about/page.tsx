import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth";

export default async function AboutPage() {
  const user = await getSessionUser();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    (user?.email?.split("@")[0] ?? "Account");

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn={!!user} displayName={displayName} />
      <section className="chip-card space-y-4 p-6">
        <h1 className="text-3xl font-black">About ChipIn</h1>
        <p className="text-[#334155]">
          ChipIn helps groups commit before starting. When enough people join, the chip activates and everyone executes the objective list together.
        </p>
        <p className="text-[#334155]">
          The product is designed for accountability loops: clear threshold, clear deadline, clear completion state.
        </p>
      </section>
    </ScreenContainer>
  );
}
