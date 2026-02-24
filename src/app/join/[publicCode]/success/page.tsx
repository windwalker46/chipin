import { redirect } from "next/navigation";

export default async function JoinSuccessLegacyRedirect({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  redirect(`/chips/${publicCode}`);
}
