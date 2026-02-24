import { redirect } from "next/navigation";

export default async function JoinExpiredLegacyRedirect({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  redirect(`/chips/${publicCode}`);
}
