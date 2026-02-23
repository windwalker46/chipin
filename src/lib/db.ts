import { Pool } from "pg";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();

const globalForDb = globalThis as unknown as { db?: Pool };

export const db =
  globalForDb.db ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
