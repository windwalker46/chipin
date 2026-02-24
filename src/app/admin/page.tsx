import { notFound } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { parseAdminEmails, requireSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

export default async function AdminPage() {
  const { user } = await requireSessionUser();
  const env = getServerEnv();
  const adminEmails = parseAdminEmails(env.ADMIN_EMAILS);
  const email = (user.email ?? "").toLowerCase();

  if (!adminEmails.includes(email)) notFound();

  type AdminChipRow = {
    id: string;
    public_code: string;
    title: string;
    status: string;
    participant_count: number;
    threshold_count: number;
    created_at: string;
  };

  type AdminObjectiveRow = {
    chip_id: string;
    count: number;
    completed: number;
  };

  const [chipsResult, objectiveStatsResult] = await Promise.all([
    db.query<AdminChipRow>(
      `
        select id, public_code, title, status, participant_count, threshold_count, created_at
        from public.chips
        order by created_at desc
        limit 100
      `,
    ),
    db.query<AdminObjectiveRow>(
      `
        select
          chip_id,
          count(*)::int as count,
          count(completed_at)::int as completed
        from public.chip_objectives
        group by chip_id
      `,
    ),
  ]);

  const objectiveStats = new Map(
    objectiveStatsResult.rows.map((row) => [row.chip_id, { total: row.count, completed: row.completed }]),
  );

  return (
    <ScreenContainer>
      <h1 className="mb-4 text-2xl font-black">Admin Panel</h1>

      <section className="chip-card p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#0e7490]">Chips</h2>
        <ul className="space-y-2 text-sm">
          {chipsResult.rows.map((chip) => {
            const stats = objectiveStats.get(chip.id) ?? { total: 0, completed: 0 };
            return (
              <li key={chip.public_code} className="rounded-lg border border-[#e2e8f0] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {chip.title} ({chip.public_code})
                  </span>
                  <span className="uppercase">{chip.status}</span>
                </div>
                <p className="mt-1 text-xs text-[#64748b]">
                  Participants: {chip.participant_count}/{chip.threshold_count}
                </p>
                <p className="text-xs text-[#64748b]">
                  Objectives: {stats.completed}/{stats.total} completed
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </ScreenContainer>
  );
}
