import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { formatUsd } from "@/lib/format";
import { getPoolByCode, listPoolContributions } from "@/lib/pools";
import { getSessionUser } from "@/lib/auth";

export default async function FundedPoolPage({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  const pool = await getPoolByCode(publicCode);
  if (!pool) redirect("/");

  const user = await getSessionUser();
  const isOrganizer = user?.id === pool.organizer_id;
  const contributions = await listPoolContributions(pool.id);

  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6">
        <h1 className="text-3xl font-black">Fully Funded!</h1>
        <p className="text-sm text-[#475569]">Final amount: {formatUsd(pool.collected_amount_cents)}</p>
        {isOrganizer ? (
          <p className="rounded-lg bg-[#dcfce7] p-3 text-sm text-[#14532d]">Funds sent to your Stripe account.</p>
        ) : null}
        <ul className="space-y-2 text-sm">
          {contributions.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between">
              <span>{entry.contributor_name}</span>
              <span className="font-semibold">{formatUsd(entry.amount_cents)}</span>
            </li>
          ))}
        </ul>
        <Link href={`/join/${publicCode}`} className="chip-button chip-button-secondary">
          Back to pool
        </Link>
      </section>
    </ScreenContainer>
  );
}
