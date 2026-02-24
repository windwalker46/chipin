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
        <h1 className="text-3xl font-black">Creator Sign In</h1>
        <p className="text-sm text-[#475569]">Use Google OAuth to create chips, invite participants, and run shared objectives.</p>
        <GoogleSignInButton />
        <p className="text-xs text-[#64748b]">No manual password flow in this demo.</p>
      </section>
    </ScreenContainer>
  );
}
