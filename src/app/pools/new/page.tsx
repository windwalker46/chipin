import Link from "next/link";
import { createPoolAction } from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { requireSessionUser } from "@/lib/auth";

export default async function CreatePoolPage() {
  await requireSessionUser();

  return (
    <ScreenContainer>
      <header className="mb-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[#155e75]">
          Back to dashboard
        </Link>
      </header>
      <section className="chip-card p-6">
        <h1 className="text-3xl font-black">Create Pool</h1>
        <form action={createPoolAction} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Pool Title *</span>
            <input className="chip-input" type="text" name="title" required maxLength={100} placeholder="Friday Sushi" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Restaurant Name</span>
            <input className="chip-input" type="text" name="restaurantName" maxLength={100} placeholder="Sakura Sushi" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Target Amount (optional)</span>
            <input className="chip-input" type="number" name="goalAmount" min="0" step="0.01" inputMode="decimal" placeholder="120.00" />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Deadline</span>
            <select className="chip-input" name="deadlineMinutes" defaultValue="60">
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">90 minutes</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">Tip % (optional)</span>
            <input className="chip-input" type="number" name="tipPercent" min="0" max="35" step="0.5" placeholder="15" />
          </label>

          <button type="submit" className="chip-button">
            Create Pool
          </button>
        </form>
      </section>
    </ScreenContainer>
  );
}
