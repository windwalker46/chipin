import { redirect } from "next/navigation";

export default function StripeOnboardingLegacyRedirect() {
  redirect("/dashboard");
}
