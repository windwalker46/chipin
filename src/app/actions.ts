"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser, requireSessionUser } from "@/lib/auth";
import {
  createChip,
  getChipByCode,
  getCreatorOpenChipCount,
  getParticipantByName,
  getParticipantByUser,
  joinChip,
  setChipStatus,
  toggleObjectiveCompletion,
} from "@/lib/chips";
import { getProfile, upsertProfileFromUser } from "@/lib/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createChipSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(600).optional(),
  thresholdCount: z.coerce.number().int().min(1).max(100),
  deadlineMinutes: z.coerce.number().int().min(15).max(7 * 24 * 60),
  isPrivate: z.coerce.boolean().optional(),
});

function cleanObjective(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function safePath(path: string | null) {
  if (!path || !path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard";
  return path;
}

export async function createChipAction(formData: FormData) {
  const { user, profile } = await requireSessionUser();

  const parsed = createChipSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    thresholdCount: formData.get("thresholdCount"),
    deadlineMinutes: formData.get("deadlineMinutes"),
    isPrivate: formData.get("isPrivate") ? true : false,
  });

  const openCount = await getCreatorOpenChipCount(user.id);
  if (openCount >= 1) {
    redirect("/chips/new?error=free-limit");
  }

  const objectives = [1, 2, 3, 4, 5]
    .map((n) => ({
      title: cleanObjective(formData.get(`objective${n}`)),
      description: "",
    }))
    .filter((o) => o.title.length > 0);

  const chip = await createChip({
    creatorId: user.id,
    creatorDisplayName: profile.full_name ?? (user.email?.split("@")[0] ?? "Creator"),
    title: parsed.title,
    description: parsed.description,
    thresholdCount: parsed.thresholdCount,
    deadlineAt: new Date(Date.now() + parsed.deadlineMinutes * 60 * 1000),
    isPrivate: !!parsed.isPrivate,
    objectives,
  });

  redirect(`/chips/${chip.public_code}`);
}

export async function joinChipAction(publicCode: string, formData: FormData) {
  const chip = await getChipByCode(publicCode);
  if (!chip) redirect("/");

  if (chip.status === "expired" || chip.status === "canceled") {
    redirect(`/chips/${publicCode}`);
  }

  const user = await getSessionUser();
  if (user) {
    await upsertProfileFromUser(user);
    const profile = await getProfile(user.id);
    if (profile?.is_disabled) {
      redirect("/auth/sign-in?blocked=1");
    }
    const displayName =
      profile?.full_name?.trim() || user.user_metadata?.name || user.email?.split("@")[0] || "Member";
    await joinChip({
      chipId: chip.id,
      userId: user.id,
      displayName,
    });
    redirect(`/chips/${publicCode}?joined=1`);
  }

  const guestName = cleanObjective(formData.get("guestName"));
  if (!guestName) {
    redirect(`/chips/${publicCode}?error=guest-name`);
  }

  await joinChip({
    chipId: chip.id,
    displayName: guestName,
  });
  redirect(`/chips/${publicCode}?joined=1&guest=1`);
}

export async function toggleObjectiveAction(formData: FormData) {
  const { user } = await requireSessionUser();
  const publicCode = String(formData.get("publicCode") ?? "");
  const objectiveId = String(formData.get("objectiveId") ?? "");
  const returnPath = safePath(
    typeof formData.get("returnPath") === "string" ? String(formData.get("returnPath")) : null,
  );

  if (!publicCode || !objectiveId) redirect(returnPath);
  const chip = await getChipByCode(publicCode);
  if (!chip) redirect(returnPath);
  if (chip.status === "expired" || chip.status === "canceled" || chip.status === "completed") {
    redirect(`${returnPath}?error=not-active`);
  }

  let participant =
    (await getParticipantByUser(chip.id, user.id)) ??
    (await getParticipantByName(chip.id, user.user_metadata?.name || user.email?.split("@")[0] || ""));

  if (!participant && chip.creator_id === user.id) {
    const profile = await getProfile(user.id);
    const displayName =
      profile?.full_name?.trim() || user.user_metadata?.name || user.email?.split("@")[0] || "Creator";
    participant = await joinChip({
      chipId: chip.id,
      userId: user.id,
      displayName,
    });
  }

  if (!participant) {
    redirect(`${returnPath}?error=join-first`);
  }

  await toggleObjectiveCompletion({
    chipId: chip.id,
    objectiveId,
    participantId: participant.id,
  });
  revalidatePath(returnPath);
  redirect(returnPath);
}

export async function completeChipAction(formData: FormData) {
  const { user } = await requireSessionUser();
  const publicCode = String(formData.get("publicCode") ?? "");
  if (!publicCode) redirect("/dashboard");

  const chip = await getChipByCode(publicCode);
  if (!chip || chip.creator_id !== user.id) redirect("/dashboard");

  await setChipStatus({
    chipId: chip.id,
    toStatus: "completed",
  });
  revalidatePath(`/chips/${publicCode}`);
  revalidatePath("/dashboard");
}

export async function cancelChipAction(formData: FormData) {
  const { user } = await requireSessionUser();
  const publicCode = String(formData.get("publicCode") ?? "");
  if (!publicCode) redirect("/dashboard");

  const chip = await getChipByCode(publicCode);
  if (!chip || chip.creator_id !== user.id) redirect("/dashboard");

  await setChipStatus({
    chipId: chip.id,
    fromStatus: chip.status,
    toStatus: "canceled",
  });
  revalidatePath(`/chips/${publicCode}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
