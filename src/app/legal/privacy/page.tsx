import Link from "next/link";
import { ScreenContainer } from "@/components/screen-container";

export default function PrivacyPage() {
  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6 text-sm">
        <h1 className="text-2xl font-black">Privacy</h1>
        <p>ChipIn stores account profile info, chip metadata, participant records, and objective completion events.</p>
        <p>No card or banking information is collected in this product direction.</p>
        <p>Participant names and objective status are displayed inside each chip for transparency.</p>
        <p>Contact support to request data deletion where legally permitted.</p>
        <Link href="/" className="text-[#155e75]">
          Back
        </Link>
      </section>
    </ScreenContainer>
  );
}
