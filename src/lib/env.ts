import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_URL: z.string().url(),
  ADMIN_EMAILS: z.string().default(""),
  CRON_SHARED_SECRET: z.string().min(1),
});

function resolveAppUrl() {
  const rawAppUrl = process.env.APP_URL?.trim();
  if (rawAppUrl) {
    try {
      return new URL(rawAppUrl).toString().replace(/\/$/, "");
    } catch {
      return process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : "http://localhost:3000";
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  cachedServerEnv = serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_URL: resolveAppUrl(),
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    CRON_SHARED_SECRET: process.env.CRON_SHARED_SECRET,
  });

  return cachedServerEnv;
}
