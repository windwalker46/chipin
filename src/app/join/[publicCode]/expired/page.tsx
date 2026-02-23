import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { getPoolByCode } from "@/lib/pools";

export default async function ExpiredPoolPage({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  const pool = await getPoolByCode(publicCode);
  if (!pool) redirect("/");

  return (
    <ScreenContainer>
      <section className="chip-card space-y-4 p-6 text-center">
        <h1 className="text-3xl font-black">Pool expired.</h1>
        <p className="text-sm text-[#475569]">All contributions refunded.</p>
        <Link href="/auth/sign-in" className="chip-button">
          Create new pool
        </Link>
      </section>
    </ScreenContainer>
  );
}
