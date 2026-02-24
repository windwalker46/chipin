import { redirect } from "next/navigation";

export default async function JoinLegacyRedirect({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  redirect(`/chips/${publicCode}`);
}
