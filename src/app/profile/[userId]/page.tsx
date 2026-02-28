import Link from "next/link";
import { notFound } from "next/navigation";
import {
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import { getFriendRelation } from "@/lib/friends";
import { requireSessionUser } from "@/lib/auth";
import { getProfileById } from "@/lib/profiles";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { user } = await requireSessionUser();
  const { userId } = await params;
  const profile = await getProfileById(userId);
  if (!profile) notFound();

  const self = user.id === profile.id;
  const relation = self ? { state: "self" as const } : await getFriendRelation(user.id, profile.id);
  const viewerName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (user.email?.split("@")[0] ?? "Account");

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn displayName={viewerName} />

      <section className="chip-card space-y-4 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#155e75]">Profile</p>
        <h1 className="text-3xl font-black">{profile.full_name || "Unnamed User"}</h1>
        <p className="text-sm text-[#64748b]">Joined {new Date(profile.created_at).toLocaleDateString()}</p>

        {self ? (
          <Link href="/profile" className="chip-button chip-button-secondary">
            Edit My Profile
          </Link>
        ) : relation.state === "none" ? (
          <form action={sendFriendRequestAction}>
            <input type="hidden" name="targetUserId" value={profile.id} />
            <FormSubmitButton idleLabel="Add Friend" pendingLabel="Sending..." className="chip-button" />
          </form>
        ) : relation.state === "outgoing" ? (
          <p className="rounded-lg bg-[#f8fafc] p-3 text-sm text-[#334155]">Friend request sent.</p>
        ) : relation.state === "incoming" ? (
          <div className="space-y-2">
            <p className="rounded-lg bg-[#f8fafc] p-3 text-sm text-[#334155]">This user sent you a friend request.</p>
            <div className="flex gap-2">
              <form action={respondFriendRequestAction} className="w-full">
                <input type="hidden" name="requestId" value={relation.requestId} />
                <input type="hidden" name="response" value="accepted" />
                <FormSubmitButton idleLabel="Accept" pendingLabel="Saving..." className="chip-button" />
              </form>
              <form action={respondFriendRequestAction} className="w-full">
                <input type="hidden" name="requestId" value={relation.requestId} />
                <input type="hidden" name="response" value="declined" />
                <FormSubmitButton
                  idleLabel="Decline"
                  pendingLabel="Saving..."
                  className="chip-button chip-button-secondary"
                />
              </form>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-[#dcfce7] p-3 text-sm text-[#14532d]">You are friends.</p>
        )}
      </section>
    </ScreenContainer>
  );
}
