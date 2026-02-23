import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";

export default function PrivacyPage() {
  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6 text-sm">
        <h1 className="text-2xl font-black">Privacy</h1>
        <p>ChipIn stores organizer account info, pool metadata, contribution records, and Stripe transaction identifiers.</p>
        <p>Card details are handled by Stripe Checkout and are never stored by ChipIn.</p>
        <p>Contributor names and amounts are displayed for pool transparency.</p>
        <p>Contact support to request data deletion where legally permitted.</p>
        <Link href="/" className="text-[#155e75]">
          Back
        </Link>
      </section>
    </ScreenContainer>
  );
}
