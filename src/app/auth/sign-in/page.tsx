import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getSessionUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <ScreenContainer>
      <div className="mb-6">
        <Link href="/" className="text-sm font-semibold text-[#155e75]">
          Back
        </Link>
      </div>
      <section className="chip-card space-y-5 p-6">
        <h1 className="text-3xl font-black">Organizer Sign In</h1>
        <p className="text-sm text-[#475569]">Use Google OAuth to create and manage pools. No manual passwords.</p>
        <GoogleSignInButton />
        <p className="text-xs text-[#64748b]">Optional email magic link can be added after launch.</p>
      </section>
    </ScreenContainer>
  );
}
