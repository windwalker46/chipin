import { db } from "@/lib/db";

let schemaEnsured = false;

async function ensureFriendsSchema() {
  if (schemaEnsured) return;

  await db.query(`
    do $$
    begin
      create type public.friend_request_status as enum ('pending', 'accepted', 'declined', 'canceled');
    exception
      when duplicate_object then null;
    end $$;
  `);

  await db.query(`
    create table if not exists public.friend_requests (
      id uuid primary key default gen_random_uuid(),
      sender_id uuid not null references public.profiles(id) on delete cascade,
      receiver_id uuid not null references public.profiles(id) on delete cascade,
      status public.friend_request_status not null default 'pending',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (sender_id <> receiver_id)
    );
  `);

  await db.query(`
    create unique index if not exists idx_friend_requests_pair
    on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id));
  `);

  await db.query(`
    drop trigger if exists trg_friend_requests_updated_at on public.friend_requests;
    create trigger trg_friend_requests_updated_at
    before update on public.friend_requests
    for each row execute function public.set_updated_at();
  `);

  schemaEnsured = true;
}

export type FriendProfile = {
  id: string;
  full_name: string | null;
};

export type FriendRequestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined" | "canceled";
  created_at: string;
  updated_at: string;
  sender_name: string | null;
  receiver_name: string | null;
};

export async function findProfileByEmail(email: string) {
  await ensureFriendsSchema();

  const result = await db.query(
    `
      select p.id, p.full_name
      from auth.users u
      join public.profiles p on p.id = u.id
      where lower(u.email) = lower($1)
      limit 1
    `,
    [email.trim()],
  );

  return result.rows[0] as FriendProfile | undefined;
}

export async function listFriends(userId: string) {
  await ensureFriendsSchema();

  const result = await db.query(
    `
      select
        case when fr.sender_id = $1 then fr.receiver_id else fr.sender_id end as id,
        p.full_name
      from public.friend_requests fr
      join public.profiles p
        on p.id = case when fr.sender_id = $1 then fr.receiver_id else fr.sender_id end
      where fr.status = 'accepted'
        and (fr.sender_id = $1 or fr.receiver_id = $1)
      order by p.full_name asc nulls last
    `,
    [userId],
  );

  return result.rows as FriendProfile[];
}

export async function listIncomingFriendRequests(userId: string) {
  await ensureFriendsSchema();

  const result = await db.query(
    `
      select
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        sp.full_name as sender_name,
        rp.full_name as receiver_name
      from public.friend_requests fr
      join public.profiles sp on sp.id = fr.sender_id
      join public.profiles rp on rp.id = fr.receiver_id
      where fr.receiver_id = $1
        and fr.status = 'pending'
      order by fr.created_at desc
    `,
    [userId],
  );

  return result.rows as FriendRequestRow[];
}

export async function listOutgoingFriendRequests(userId: string) {
  await ensureFriendsSchema();

  const result = await db.query(
    `
      select
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        sp.full_name as sender_name,
        rp.full_name as receiver_name
      from public.friend_requests fr
      join public.profiles sp on sp.id = fr.sender_id
      join public.profiles rp on rp.id = fr.receiver_id
      where fr.sender_id = $1
        and fr.status = 'pending'
      order by fr.created_at desc
    `,
    [userId],
  );

  return result.rows as FriendRequestRow[];
}

export async function getFriendRelation(viewerId: string, otherUserId: string) {
  await ensureFriendsSchema();

  const result = await db.query(
    `
      select id, sender_id, receiver_id, status
      from public.friend_requests
      where (sender_id = $1 and receiver_id = $2)
         or (sender_id = $2 and receiver_id = $1)
      limit 1
    `,
    [viewerId, otherUserId],
  );
  const row = result.rows[0] as
    | {
        id: string;
        sender_id: string;
        receiver_id: string;
        status: "pending" | "accepted" | "declined" | "canceled";
      }
    | undefined;

  if (!row) return { state: "none" as const };
  if (row.status === "accepted") return { state: "friends" as const, requestId: row.id };
  if (row.status !== "pending") return { state: "none" as const };
  if (row.sender_id === viewerId) return { state: "outgoing" as const, requestId: row.id };
  if (row.receiver_id === viewerId) return { state: "incoming" as const, requestId: row.id };
  return { state: "none" as const };
}

export async function sendFriendRequest(input: { senderId: string; receiverId: string }) {
  await ensureFriendsSchema();

  if (input.senderId === input.receiverId) {
    throw new Error("Cannot friend yourself.");
  }

  const existingRes = await db.query(
    `
      select id, status
      from public.friend_requests
      where (sender_id = $1 and receiver_id = $2)
         or (sender_id = $2 and receiver_id = $1)
      limit 1
    `,
    [input.senderId, input.receiverId],
  );
  const existing = existingRes.rows[0] as { id: string; status: "pending" | "accepted" | "declined" | "canceled" } | undefined;

  if (!existing) {
    await db.query(
      `
        insert into public.friend_requests (sender_id, receiver_id, status)
        values ($1, $2, 'pending')
      `,
      [input.senderId, input.receiverId],
    );
    return;
  }

  if (existing.status === "accepted") {
    throw new Error("Already friends.");
  }

  await db.query(
    `
      update public.friend_requests
      set sender_id = $2, receiver_id = $3, status = 'pending', updated_at = now()
      where id = $1
    `,
    [existing.id, input.senderId, input.receiverId],
  );
}

export async function respondToFriendRequest(input: {
  requestId: string;
  userId: string;
  response: "accepted" | "declined" | "canceled";
}) {
  await ensureFriendsSchema();

  const reqRes = await db.query(
    `
      select sender_id, receiver_id, status
      from public.friend_requests
      where id = $1
      limit 1
    `,
    [input.requestId],
  );
  const row = reqRes.rows[0] as
    | { sender_id: string; receiver_id: string; status: "pending" | "accepted" | "declined" | "canceled" }
    | undefined;
  if (!row) throw new Error("Request not found.");
  if (row.status !== "pending") return;

  if (input.response === "accepted" || input.response === "declined") {
    if (row.receiver_id !== input.userId) throw new Error("Only receiver can respond.");
  }
  if (input.response === "canceled") {
    if (row.sender_id !== input.userId) throw new Error("Only sender can cancel.");
  }

  await db.query(
    `
      update public.friend_requests
      set status = $2, updated_at = now()
      where id = $1
    `,
    [input.requestId, input.response],
  );
}
