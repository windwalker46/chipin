import { redirect } from "next/navigation";
import { startStripeConnectAction } from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { requireSessionUser } from "@/lib/auth";
import { hasUsableStripeSecretKey, stripe } from "@/lib/stripe";
import { updateOrganizerStripeState } from "@/lib/pools";

export default async function StripeOnboardingPage() {
  const { user, profile } = await requireSessionUser();
  let configError: string | null = null;

  if (!hasUsableStripeSecretKey()) {
    configError = "Stripe is not configured yet. Add a valid STRIPE_SECRET_KEY in deployment environment variables.";
  } else if (profile.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      await updateOrganizerStripeState({
        userId: user.id,
        stripeAccountId: profile.stripe_account_id,
        stripeOnboardingComplete: !!account.details_submitted,
        chargesEnabled: !!account.charges_enabled,
        payoutsEnabled: !!account.payouts_enabled,
      });

      if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
        redirect("/dashboard");
      }
    } catch {
      configError = "Stripe account lookup failed. Verify STRIPE_SECRET_KEY and try again.";
    }
  }

  return (
    <ScreenContainer>
      <section className="chip-card space-y-5 p-6">
        <h1 className="text-3xl font-black">Connect Stripe</h1>
        <p className="text-sm text-[#475569]">To receive payments, connect your Stripe account.</p>
        {configError ? <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">{configError}</p> : null}
        <form action={startStripeConnectAction}>
          <button className="chip-button" type="submit" disabled={!!configError}>
            Connect with Stripe
          </button>
        </form>
      </section>
    </ScreenContainer>
  );
}
