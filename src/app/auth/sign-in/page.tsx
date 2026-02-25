import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailPasswordAuthForm } from "@/components/email-password-auth-form";
import { ScreenContainer } from "@/components/screen-container";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getSessionUser } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; blocked?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const search = await searchParams;

  return (
    <ScreenContainer size="narrow">
      <div className="mb-6">
        <Link href="/" className="text-sm font-semibold text-[#155e75]">
          Back
        </Link>
      </div>
      <section className="chip-card space-y-5 p-6">
        <h1 className="text-3xl font-black">Creator Sign In</h1>
        <p className="text-sm text-[#475569]">Use Google or email to create chips, invite participants, and run shared objectives.</p>
        {search.error === "oauth" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
            Sign in failed. Try again with Google or email/password.
          </p>
        ) : null}
        {search.error === "email-verification" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
            Email verification failed or expired. Request a new signup confirmation email.
          </p>
        ) : null}
        {search.blocked === "1" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
            This account is currently blocked.
          </p>
        ) : null}
        <div>
          <EmailPasswordAuthForm />
        </div>
        <div className="border-t border-[#e2e8f0] pt-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#64748b]">
            Or continue with Google
          </p>
          <GoogleSignInButton />
        </div>
      </section>
    </ScreenContainer>
  );
}
