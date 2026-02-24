import Link from "next/link";
import { createChipAction } from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { getCreatorOpenChipCount } from "@/lib/chips";
import { requireSessionUser } from "@/lib/auth";

export default async function CreateChipPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user } = await requireSessionUser();
  const { error } = await searchParams;
  const openCount = await getCreatorOpenChipCount(user.id);
  const freeLimitHit = openCount >= 1 || error === "free-limit";

  return (
    <ScreenContainer>
      <header className="mb-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[#155e75]">
          Back to dashboard
        </Link>
      </header>
      <section className="chip-card p-6">
        <h1 className="text-3xl font-black">Create Chip</h1>
        {freeLimitHit ? (
          <p className="mt-3 rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
            Free mode allows 1 pending/active chip at a time. Complete or cancel your current chip first.
          </p>
        ) : null}
        <form action={createChipAction} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Title *</span>
            <input className="chip-input" type="text" name="title" required maxLength={120} placeholder="30-Day Fitness Chip" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              className="chip-input min-h-24"
              name="description"
              maxLength={600}
              placeholder="If 5 people commit, we start Monday and complete daily workouts."
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Required Participants</span>
            <input className="chip-input" type="number" name="thresholdCount" min="1" max="100" defaultValue={5} required />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Deadline</span>
            <select className="chip-input" name="deadlineMinutes" defaultValue="1440">
              <option value="120">2 hours</option>
              <option value="720">12 hours</option>
              <option value="1440">24 hours</option>
              <option value="4320">3 days</option>
              <option value="10080">7 days</option>
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Objectives (up to 5 in Free mode)</legend>
            <input className="chip-input" name="objective1" placeholder="Objective 1" />
            <input className="chip-input" name="objective2" placeholder="Objective 2" />
            <input className="chip-input" name="objective3" placeholder="Objective 3" />
            <input className="chip-input" name="objective4" placeholder="Objective 4" />
            <input className="chip-input" name="objective5" placeholder="Objective 5" />
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPrivate" value="true" />
            Private / invite-only (Power Chip preview)
          </label>

          <button type="submit" className="chip-button" disabled={freeLimitHit}>
            Create Chip
          </button>
        </form>
      </section>
    </ScreenContainer>
  );
}
