import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";

export async function upsertProfileFromUser(user: User) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (user.email?.split("@")[0] ?? "User");

  await db.query(
    `
      insert into public.profiles (id, full_name)
      values ($1, $2)
      on conflict (id)
      do update set full_name = excluded.full_name, updated_at = now()
    `,
    [user.id, fullName],
  );
}

export async function getProfile(userId: string) {
  const result = await db.query(
    `
      select id, full_name, avatar_url, is_disabled, created_at
      from public.profiles
      where id = $1
      limit 1
    `,
    [userId],
  );

  return result.rows[0] as
    | {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        is_disabled: boolean;
        created_at: string;
      }
    | undefined;
}

export async function getProfileById(userId: string) {
  const result = await db.query(
    `
      select id, full_name, avatar_url, created_at
      from public.profiles
      where id = $1
      limit 1
    `,
    [userId],
  );

  return result.rows[0] as
    | {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        created_at: string;
      }
    | undefined;
}

export async function updateProfileName(userId: string, fullName: string) {
  await db.query(
    `
      update public.profiles
      set full_name = $2, updated_at = now()
      where id = $1
    `,
    [userId, fullName.trim()],
  );
}
