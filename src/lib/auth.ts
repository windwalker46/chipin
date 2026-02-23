import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireSessionUser(redirectPath = "/auth/sign-in") {
  const user = await getSessionUser();
  if (!user) redirect(redirectPath);

  // Lazy import avoids forcing DB/Stripe env parsing for routes that only need session checks.
  const { upsertProfileFromUser, getOrganizerProfile } = await import("@/lib/pools");
  await upsertProfileFromUser(user);
  const profile = await getOrganizerProfile(user.id);

  if (!profile || profile.is_disabled) {
    redirect("/auth/sign-in?blocked=1");
  }

  return { user, profile };
}

export function parseAdminEmails(adminEmails: string) {
  return adminEmails
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}
