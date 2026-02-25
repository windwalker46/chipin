import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeNextPath } from "@/lib/navigation";

const otpTypes: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function asOtpType(value: string | null) {
  if (!value) return null;
  return otpTypes.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = asOtpType(requestUrl.searchParams.get("type"));
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  try {
    if (tokenHash && otpType) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
      return NextResponse.redirect(new URL("/auth/sign-in?error=magic-link", requestUrl.origin));
    }

    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    }
  } catch {}

  return NextResponse.redirect(new URL("/auth/sign-in?error=oauth", requestUrl.origin));
}
