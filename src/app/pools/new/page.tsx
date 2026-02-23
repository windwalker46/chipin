import Link from "next/link";
import { createPoolAction, startStripeConnectAction } from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { requireSessionUser } from "@/lib/auth";

export default async function CreatePoolPage() {
  const { profile } = await requireSessionUser();
  const stripeReady =
    !!profile.stripe_account_id &&
    profile.stripe_onboarding_complete &&
    profile.charges_enabled &&
    profile.payouts_enabled;

  return (
    <ScreenContainer>
      <header className="mb-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[#155e75]">
          Back to dashboard
        </Link>
      </header>
      <section className="chip-card p-6">
        <h1 className="text-3xl font-black">Create Pool</h1>
        {!stripeReady ? (
          <div className="mt-4 space-y-2 rounded-lg bg-[#ffedd5] p-3 text-sm text-[#7c2d12]">
            <p>Create your pool first, then connect Stripe before sharing payment link.</p>
            <form action={startStripeConnectAction}>
              <button type="submit" className="rounded-lg border border-[#fdba74] bg-white px-3 py-2 text-sm font-semibold">
                Connect Stripe now
              </button>
            </form>
          </div>
        ) : null}
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
