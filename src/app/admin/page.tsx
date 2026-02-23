import { notFound } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { requireSessionUser, parseAdminEmails } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

export default async function AdminPage() {
  const { user } = await requireSessionUser();
  const env = getServerEnv();
  const adminEmails = parseAdminEmails(env.ADMIN_EMAILS);
  const email = (user.email ?? "").toLowerCase();

  if (!adminEmails.includes(email)) {
    notFound();
  }

  type AdminPoolRow = {
    public_code: string;
    title: string;
    status: string;
    collected_amount_cents: number;
    created_at: string;
  };
  type AdminDisputeRow = {
    id: string;
    status: string;
    amount_cents: number;
    reason: string | null;
    updated_at: string;
  };
  type AdminEventRow = {
    id: string;
    type: string;
    received_at: string;
    processing_error: string | null;
  };

  const [pools, disputes, events] = await Promise.all([
    db.query<AdminPoolRow>(
      `
      select public_code, title, status, collected_amount_cents, created_at
      from public.pools
      order by created_at desc
      limit 50
    `,
    ),
    db.query<AdminDisputeRow>(
      `
      select id, status, amount_cents, reason, updated_at
      from public.stripe_disputes
      order by updated_at desc
      limit 50
    `,
    ),
    db.query<AdminEventRow>(
      `
      select id, type, received_at, processing_error
      from public.webhook_events
      order by received_at desc
      limit 50
    `,
    ),
  ]);
  const poolRows = pools.rows as AdminPoolRow[];
  const disputeRows = disputes.rows as AdminDisputeRow[];
  const eventRows = events.rows as AdminEventRow[];

  return (
    <ScreenContainer>
      <h1 className="mb-4 text-2xl font-black">Admin Panel</h1>

      <section className="chip-card mb-5 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#0e7490]">Pools</h2>
        <ul className="space-y-2 text-sm">
          {poolRows.map((pool) => (
            <li key={pool.public_code} className="flex items-center justify-between">
              <span>
                {pool.title} ({pool.public_code})
              </span>
              <span>{pool.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="chip-card mb-5 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#0e7490]">Disputes</h2>
        <ul className="space-y-2 text-sm">
          {disputeRows.length === 0 ? (
            <li>No disputes</li>
          ) : (
            disputeRows.map((row) => (
              <li key={row.id} className="flex items-center justify-between">
                <span>{row.id}</span>
                <span>{row.status}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="chip-card p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#0e7490]">Webhook Logs</h2>
        <ul className="space-y-2 text-sm">
          {eventRows.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-2">
              <span className="truncate">{event.type}</span>
              <span>{event.processing_error ? "error" : "ok"}</span>
            </li>
          ))}
        </ul>
      </section>
    </ScreenContainer>
  );
}
