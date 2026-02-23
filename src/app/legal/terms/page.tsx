import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";

export default function TermsPage() {
  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6 text-sm">
        <h1 className="text-2xl font-black">Terms of Service</h1>
        <p>ChipIn helps groups fund shared food orders. Organizers are responsible for fulfillment and distribution.</p>
        <p>No alcohol sales, illegal activity, or prohibited transactions are allowed.</p>
        <p>ChipIn is not liable for organizer-contributor disputes beyond payment processing and refunds.</p>
        <p>If a pool fails by deadline, contributions are automatically refunded.</p>
        <p>ChipIn does not store user balances or wallet credits.</p>
        <Link href="/" className="text-[#155e75]">
          Back
        </Link>
      </section>
    </ScreenContainer>
  );
}
