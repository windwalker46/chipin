import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  try {
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
