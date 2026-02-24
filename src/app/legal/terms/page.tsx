import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";

export default function TermsPage() {
  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6 text-sm">
        <h1 className="text-2xl font-black">Terms of Service</h1>
        <p>ChipIn helps groups commit to shared goals and execute objective-based chips together.</p>
        <p>No illegal activity, harassment, or harmful content is permitted.</p>
        <p>Creators are responsible for the legitimacy of each chip and all related outcomes.</p>
        <p>ChipIn may remove abusive chips or disable accounts that violate community rules.</p>
        <p>ChipIn does not guarantee participant attendance, completion, or specific outcomes.</p>
        <Link href="/" className="text-[#155e75]">
          Back
        </Link>
      </section>
    </ScreenContainer>
  );
}
