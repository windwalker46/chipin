import Link from "next/link";
import {
  respondFriendRequestAction,
  sendFriendRequestAction,
  updateProfileNameAction,
} from "@/app/actions";
import { ScreenContainer } from "@/components/screen-container";
import { SiteHeader } from "@/components/site-header";
import {
  listFriends,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
} from "@/lib/friends";
import { requireSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/profiles";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; sent?: string; error?: string }>;
}) {
  const { user } = await requireSessionUser();
  const profile = await getProfile(user.id);
  const search = await searchParams;

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncomingFriendRequests(user.id),
    listOutgoingFriendRequests(user.id),
  ]);

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Account";

  return (
    <ScreenContainer>
      <SiteHeader isSignedIn displayName={displayName} />

      <section className="chip-card space-y-4 p-6 md:p-8">
        <h1 className="text-3xl font-black">Profile</h1>
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-sm text-[#64748b]">Display Name</p>
          <p className="text-xl font-bold">{displayName}</p>
          <p className="mt-1 text-xs text-[#64748b]">{user.email}</p>
        </div>

        {search.saved ? <p className="rounded-lg bg-[#dcfce7] p-3 text-sm text-[#14532d]">Profile updated.</p> : null}
        {search.sent ? <p className="rounded-lg bg-[#dcfce7] p-3 text-sm text-[#14532d]">Friend request sent.</p> : null}
        {search.error === "friend-not-found" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">No account found with that email.</p>
        ) : null}
        {search.error === "friend-exists" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">You are already friends or already requested.</p>
        ) : null}
        {search.error === "friend-self" ? (
          <p className="rounded-lg bg-[#fee2e2] p-3 text-sm text-[#991b1b]">You cannot add yourself.</p>
        ) : null}

        <form action={updateProfileNameAction} className="space-y-2">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Display Name</span>
            <input
              className="chip-input"
              name="fullName"
              defaultValue={profile?.full_name ?? ""}
              required
              maxLength={80}
            />
          </label>
          <button type="submit" className="chip-button chip-button-secondary">
            Save Profile
          </button>
        </form>
      </section>

      <section className="mt-4 chip-card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Add Friend</h2>
        <form action={sendFriendRequestAction} className="space-y-2">
          <input className="chip-input" name="email" type="email" placeholder="Friend email" required />
          <button type="submit" className="chip-button">
            Send Friend Request
          </button>
        </form>
      </section>

      <section className="mt-4 chip-card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Incoming Requests</h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-[#64748b]">No incoming requests.</p>
        ) : (
          <ul className="space-y-2">
            {incoming.map((request) => (
              <li key={request.id} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] p-3">
                <span className="font-medium">{request.sender_name || "Unknown User"}</span>
                <div className="flex gap-2">
                  <form action={respondFriendRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="response" value="accepted" />
                    <button className="rounded-lg bg-[#166534] px-2 py-1 text-xs font-semibold text-white" type="submit">
                      Accept
                    </button>
                  </form>
                  <form action={respondFriendRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="response" value="declined" />
                    <button className="rounded-lg bg-[#e2e8f0] px-2 py-1 text-xs font-semibold" type="submit">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 chip-card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Outgoing Requests</h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-[#64748b]">No outgoing requests.</p>
        ) : (
          <ul className="space-y-2">
            {outgoing.map((request) => (
              <li key={request.id} className="rounded-lg border border-[#e2e8f0] p-3 text-sm">
                Pending: {request.receiver_name || "Unknown User"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 chip-card space-y-3 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0e7490]">Friends</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-[#64748b]">No friends added yet.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li key={friend.id} className="rounded-lg border border-[#e2e8f0] p-3">
                <Link href={`/profile/${friend.id}`} className="font-medium hover:underline">
                  {friend.full_name || "Unnamed User"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ScreenContainer>
  );
}
