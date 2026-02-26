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

      <section className="chip-card space-y-4 p-6 md:p-8">
        <h1 className="text-3xl font-black">About ChipIn</h1>
        <p className="text-[#334155]">
          ChipIn helps groups commit before starting. A chip stays pending until threshold is met, then activates for shared execution.
        </p>
        <p className="text-[#334155]">
          It is built for the specific failure mode of group plans: lots of interest, low commitment, unclear follow-through.
        </p>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="chip-card space-y-3 p-6">
          <h2 className="text-xl font-black">Why We Built It</h2>
          <p className="text-sm text-[#334155]">
            Most tools track tasks after a group already agrees. ChipIn is about the commitment moment before the plan starts.
          </p>
          <ul className="space-y-1 text-sm text-[#475569]">
            <li>No chasing responses</li>
            <li>No guessing turnout</li>
            <li>No silent drop-off before kickoff</li>
          </ul>
        </article>
        <article className="chip-card space-y-3 p-6">
          <h2 className="text-xl font-black">What Makes It Different</h2>
          <p className="text-sm text-[#334155]">Poll apps measure interest. ChipIn requires commitment and enforces activation rules.</p>
          <p className="text-sm text-[#334155]">Shared checklist apps track work. ChipIn controls when work begins.</p>
        </article>
      </section>

      <section className="mt-4 chip-card space-y-3 p-6 md:p-8">
        <h2 className="text-xl font-black">Product Principles</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Commitment First</p>
            <p className="mt-1 text-[#475569]">Nothing starts until enough people are truly in.</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Simple Mechanics</p>
            <p className="mt-1 text-[#475569]">Threshold, deadline, objectives. No feature bloat.</p>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <p className="font-bold">Visible Accountability</p>
            <p className="mt-1 text-[#475569]">Everyone can see state and completion in real time.</p>
          </div>
        </div>
      </section>

      <section className="mt-4 chip-card space-y-3 p-6 md:p-8">
        <h2 className="text-xl font-black">Roadmap Direction</h2>
        <p className="text-sm text-[#334155]">
          Next expansion focuses on Power features: recurring chips, private chips, objective assignments, and smarter reminders.
        </p>
      </section>
    </ScreenContainer>
  );
}
