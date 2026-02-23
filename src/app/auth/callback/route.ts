import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(nextValue: string | null) {
  if (!nextValue || !nextValue.startsWith("/")) return "/dashboard";
  if (nextValue.startsWith("//")) return "/dashboard";
  return nextValue;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  try {
    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    }
  } catch {
    // Fall through to sign-in error redirect.
  }

  return NextResponse.redirect(new URL("/auth/sign-in?error=oauth", requestUrl.origin));
}
