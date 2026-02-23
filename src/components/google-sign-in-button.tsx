"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();

  async function handleGoogle() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const next = params.get("next") || "/dashboard";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setLoading(false);
      alert(error.message);
    }
  }

  return (
    <button type="button" onClick={handleGoogle} className="chip-button" disabled={loading}>
      {loading ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
