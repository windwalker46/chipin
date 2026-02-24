import { redirect } from "next/navigation";

export default async function PoolLegacyRedirect({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  redirect(`/chips/${publicCode}`);
}
