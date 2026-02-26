import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  cancelChipAction,
  completeChipAction,
  joinChipAction,
  toggleObjectiveAction,
} from "@/app/actions";
import { Countdown } from "@/components/countdown";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { ShareLink } from "@/components/share-link";
import { StatusBadge } from "@/components/status-badge";
import {
  getChipByCode,
  getParticipantByName,
  getParticipantByUser,
  listChipObjectives,
  listChipParticipants,
} from "@/lib/chips";
import { getSessionUser } from "@/lib/auth";
import { formatPercent } from "@/lib/format";
import { getServerEnv } from "@/lib/env";

export default async function ChipPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicCode: string }>;
  searchParams: Promise<{ joined?: string; error?: string }>;
}) {
  const { publicCode } = await params;
  const search = await searchParams;
  const chip = await getChipByCode(publicCode);
  if (!chip) notFound();

  const [participants, objectives, user] = await Promise.all([
    listChipParticipants(chip.id),
    listChipObjectives(chip.id),
    getSessionUser(),
  ]);

  const userParticipant = user
    ? ((await getParticipantByUser(chip.id, user.id)) ??
      (await getParticipantByName(chip.id, user.user_metadata?.name || user.email?.split("@")[0] || "")))
    : undefined;
  const isCreator = user?.id === chip.creator_id;
  const percent = formatPercent(chip.participant_count, chip.threshold_count) ?? 0;
  const env = getServerEnv();
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : env.APP_URL;
  const shareUrl = `${origin}/chips/${chip.public_code}`;
  const canJoin = chip.status === "pending" || chip.status === "active";
  const canToggle = (chip.status === "pending" || chip.status === "active") && (!!userParticipant || isCreator);

  return (
    <ScreenContainer>
      <header className="mb-4">
        <Link href="/dashboard" className="text-sm font-semibold text-[#155e75]">
          Back to dashboard
        </Link>
      </header>

      <section className="chip-card space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-black">{chip.title}</h1>
          <StatusBadge status={chip.status} />
        </div>
        <p className="text-sm text-[#475569]">{chip.description || "No description provided."}</p>
        <div className="flex items-center justify-between text-sm">
          <span>
            {chip.participant_count}/{chip.threshold_count} committed
          </span>
          <Countdown deadlineAt={chip.deadline_at} />
        </div>
        <ProgressBar value={percent} />
      </section>

      <section className="chip-card mt-5 space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Commitment</h2>
        {search.joined ? <p className="rounded-lg bg-[#dcfce7] p-3 text-sm text-[#14532d]">You are in.</p> : null}
        {search.error === "guest-name" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">Enter your name before joining.</p>
        ) : null}
        {search.error === "join-first" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">Join this chip before updating objectives.</p>
        ) : null}
        {search.error === "not-active" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">Objectives cannot be edited on completed, expired, or canceled chips.</p>
        ) : null}
        {canJoin ? (
          userParticipant ? (
            <p className="rounded-lg bg-[#ecfeff] p-3 text-sm text-[#155e75]">
              Committed as {userParticipant.display_name}.
            </p>
          ) : (
            <form action={joinChipAction.bind(null, chip.public_code)} className="space-y-2">
              {user ? null : (
                <input className="chip-input" name="guestName" maxLength={80} required placeholder="Your name" />
              )}
              <button className="chip-button" type="submit">
                I&apos;m In
              </button>
            </form>
          )
        ) : (
          <p className="rounded-lg bg-[#e2e8f0] p-3 text-sm text-[#334155]">This chip is no longer accepting new participants.</p>
        )}
      </section>

      <section className="chip-card mt-5 space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Objectives</h2>
        {chip.status === "completed" || chip.status === "expired" || chip.status === "canceled" ? (
          <p className="text-sm text-[#64748b]">This chip is read-only.</p>
        ) : null}
        {objectives.length === 0 ? (
          <p className="text-sm text-[#64748b]">No objectives yet.</p>
        ) : (
          <ul className="space-y-2">
            {objectives.map((objective) => {
              const completed = !!objective.completed_at;
              return (
                <li key={objective.id} className="rounded-lg border border-[#e2e8f0] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${completed ? "text-[#065f46] line-through" : "text-[#0f172a]"}`}>
                        {objective.title}
                      </p>
                      {objective.description ? <p className="mt-1 text-sm text-[#64748b]">{objective.description}</p> : null}
                      <p className="mt-1 text-xs text-[#64748b]">
                        {objective.completed_by_name
                          ? `Completed by ${objective.completed_by_name}`
                          : objective.assigned_to_name
                            ? `Assigned to ${objective.assigned_to_name}`
                            : "Unassigned"}
                      </p>
                    </div>
                    {canToggle ? (
                      <form action={toggleObjectiveAction}>
                        <input type="hidden" name="publicCode" value={chip.public_code} />
                        <input type="hidden" name="objectiveId" value={objective.id} />
                        <input type="hidden" name="returnPath" value={`/chips/${chip.public_code}`} />
                        <button
                          type="submit"
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                            completed ? "bg-[#e2e8f0] text-[#1f2937]" : "bg-[#0e7490] text-white"
                          }`}
                        >
                          {completed ? "Undo" : "Complete"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="chip-card mt-5 space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Participants</h2>
        <ul className="space-y-2 text-sm">
          {participants.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between">
              <span>{entry.display_name}</span>
              <span className="text-[#64748b]">{entry.is_creator ? "Creator" : "Participant"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="chip-card mt-5 space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Share</h2>
        <ShareLink url={shareUrl} />
        <p className="truncate text-xs text-[#64748b]">{shareUrl}</p>
      </section>

      {isCreator ? (
        <section className="chip-card mt-5 space-y-3 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Creator Controls</h2>
          <div className="flex gap-2">
            <form action={completeChipAction} className="w-full">
              <input type="hidden" name="publicCode" value={chip.public_code} />
              <button type="submit" className="chip-button chip-button-secondary">
                Mark Completed
              </button>
            </form>
            <form action={cancelChipAction} className="w-full">
              <input type="hidden" name="publicCode" value={chip.public_code} />
              <button type="submit" className="chip-button bg-[#b91c1c] hover:bg-[#991b1b]">
                Cancel
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </ScreenContainer>
  );
}
