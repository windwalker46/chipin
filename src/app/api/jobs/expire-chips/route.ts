import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { listChipsPastDeadline, setChipStatus } from "@/lib/chips";

const env = getServerEnv();

export async function POST(request: Request) {
  const sharedSecret = request.headers.get("x-cron-secret");
  if (sharedSecret !== env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chips = await listChipsPastDeadline();
  for (const chip of chips) {
    await setChipStatus({
      chipId: chip.id,
      fromStatus: chip.status,
      toStatus: "expired",
    });
  }

  return NextResponse.json({
    checked: chips.length,
    expired: chips.length,
  });
}
