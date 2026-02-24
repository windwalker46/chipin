"use client";

export default function DashboardError() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-10">
      <section className="chip-card space-y-3 p-5">
        <h1 className="text-2xl font-black">Dashboard unavailable</h1>
        <p className="text-sm text-[#475569]">
          ChipIn could not load your dashboard data. This is usually a deployment configuration issue.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[#334155]">
          <li>Confirm latest deployment includes commit <code>19528f9</code> or newer.</li>
          <li>Verify `DATABASE_URL` uses your Supabase pooler connection string with password and `sslmode=require`.</li>
          <li>Run migrations against production database.</li>
        </ol>
      </section>
    </main>
  );
}
