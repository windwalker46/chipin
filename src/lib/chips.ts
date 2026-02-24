import { db } from "@/lib/db";
import type { ChipObjectiveRow, ChipParticipantRow, ChipRow, ChipStatus } from "@/lib/types";

export async function listCreatorChips(creatorId: string) {
  const result = await db.query(
    `
      select
        c.*,
        p.full_name as creator_name
      from public.chips c
      join public.profiles p on p.id = c.creator_id
      where c.creator_id = $1
      order by c.created_at desc
    `,
    [creatorId],
  );
  return result.rows as ChipRow[];
}

export async function getCreatorOpenChipCount(creatorId: string) {
  const result = await db.query(
    `
      select count(*)::int as count
      from public.chips
      where creator_id = $1
        and status in ('pending', 'active')
    `,
    [creatorId],
  );
  return (result.rows[0]?.count as number | undefined) ?? 0;
}

export async function createChip(input: {
  creatorId: string;
  creatorDisplayName: string;
  title: string;
  description?: string;
  thresholdCount: number;
  deadlineAt: Date;
  isPrivate?: boolean;
  objectives: Array<{ title: string; description?: string }>;
}) {
  const client = await db.connect();
  try {
    await client.query("begin");

    const chipRes = await client.query(
      `
        insert into public.chips (
          creator_id,
          title,
          description,
          threshold_count,
          deadline_at,
          is_private
        )
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [
        input.creatorId,
        input.title.trim(),
        input.description?.trim() || null,
        input.thresholdCount,
        input.deadlineAt.toISOString(),
        !!input.isPrivate,
      ],
    );

    const chip = chipRes.rows[0] as ChipRow;

    const creatorParticipantRes = await client.query(
      `
        insert into public.chip_participants (chip_id, user_id, display_name, is_creator)
        values ($1, $2, $3, true)
        returning id
      `,
      [chip.id, input.creatorId, input.creatorDisplayName],
    );
    const creatorParticipantId = creatorParticipantRes.rows[0]?.id as string;

    const objectiveRows = input.objectives
      .map((o) => ({ title: o.title.trim(), description: o.description?.trim() || null }))
      .filter((o) => o.title.length > 0)
      .slice(0, 5);

    for (let i = 0; i < objectiveRows.length; i += 1) {
      const objective = objectiveRows[i];
      await client.query(
        `
          insert into public.chip_objectives (
            chip_id,
            title,
            description,
            sort_order,
            created_by
          )
          values ($1, $2, $3, $4, $5)
        `,
        [chip.id, objective.title, objective.description, i, input.creatorId],
      );
    }

    // Let creator toggles work immediately after creation.
    await client.query(
      `
        update public.chip_objectives
        set assigned_participant_id = $2
        where chip_id = $1 and assigned_participant_id is null
      `,
      [chip.id, creatorParticipantId],
    );

    await client.query("select public.refresh_chip_stats($1)", [chip.id]);
    await client.query("select public.activate_chip_if_threshold_met($1)", [chip.id]);

    await client.query("commit");
    return chip;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getChipByCode(publicCode: string) {
  const result = await db.query(
    `
      select
        c.*,
        p.full_name as creator_name
      from public.chips c
      join public.profiles p on p.id = c.creator_id
      where c.public_code = $1
      limit 1
    `,
    [publicCode],
  );
  return result.rows[0] as ChipRow | undefined;
}

export async function listChipParticipants(chipId: string) {
  const result = await db.query(
    `
      select id, chip_id, user_id, display_name, is_creator, joined_at
      from public.chip_participants
      where chip_id = $1
      order by joined_at asc
    `,
    [chipId],
  );
  return result.rows as ChipParticipantRow[];
}

export async function listChipObjectives(chipId: string) {
  const result = await db.query(
    `
      select
        o.id,
        o.chip_id,
        o.title,
        o.description,
        o.sort_order,
        o.assigned_participant_id,
        ap.display_name as assigned_to_name,
        o.completed_by_participant_id,
        cp.display_name as completed_by_name,
        o.completed_at,
        o.created_at,
        o.updated_at
      from public.chip_objectives o
      left join public.chip_participants ap on ap.id = o.assigned_participant_id
      left join public.chip_participants cp on cp.id = o.completed_by_participant_id
      where o.chip_id = $1
      order by o.sort_order asc, o.created_at asc
    `,
    [chipId],
  );
  return result.rows as ChipObjectiveRow[];
}

export async function getParticipantByUser(chipId: string, userId: string) {
  const result = await db.query(
    `
      select id, chip_id, user_id, display_name, is_creator, joined_at
      from public.chip_participants
      where chip_id = $1 and user_id = $2
      limit 1
    `,
    [chipId, userId],
  );
  return result.rows[0] as ChipParticipantRow | undefined;
}

export async function getParticipantByName(chipId: string, displayName: string) {
  const result = await db.query(
    `
      select id, chip_id, user_id, display_name, is_creator, joined_at
      from public.chip_participants
      where chip_id = $1 and lower(display_name) = lower($2)
      limit 1
    `,
    [chipId, displayName.trim()],
  );
  return result.rows[0] as ChipParticipantRow | undefined;
}

export async function joinChip(input: {
  chipId: string;
  userId?: string;
  displayName: string;
}) {
  const normalizedName = input.displayName.trim();
  if (!normalizedName) {
    throw new Error("Display name is required.");
  }

  const client = await db.connect();
  try {
    await client.query("begin");

    let existing: ChipParticipantRow | undefined;
    if (input.userId) {
      const byUser = await client.query(
        `
          select id, chip_id, user_id, display_name, is_creator, joined_at
          from public.chip_participants
          where chip_id = $1 and user_id = $2
          limit 1
        `,
        [input.chipId, input.userId],
      );
      existing = byUser.rows[0] as ChipParticipantRow | undefined;
    } else {
      const byName = await client.query(
        `
          select id, chip_id, user_id, display_name, is_creator, joined_at
          from public.chip_participants
          where chip_id = $1 and lower(display_name) = lower($2)
          limit 1
        `,
        [input.chipId, normalizedName],
      );
      existing = byName.rows[0] as ChipParticipantRow | undefined;
    }

    if (!existing) {
      const insertRes = await client.query(
        `
          insert into public.chip_participants (chip_id, user_id, display_name, is_creator)
          values ($1, $2, $3, false)
          returning id, chip_id, user_id, display_name, is_creator, joined_at
        `,
        [input.chipId, input.userId ?? null, normalizedName],
      );
      existing = insertRes.rows[0] as ChipParticipantRow;
    }

    await client.query("select public.refresh_chip_stats($1)", [input.chipId]);
    await client.query("select public.activate_chip_if_threshold_met($1)", [input.chipId]);
    await client.query("commit");
    return existing;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function toggleObjectiveCompletion(input: {
  chipId: string;
  objectiveId: string;
  participantId: string;
}) {
  const client = await db.connect();
  try {
    await client.query("begin");
    const existingRes = await client.query(
      `
        select completed_by_participant_id
        from public.chip_objectives
        where id = $1 and chip_id = $2
        limit 1
      `,
      [input.objectiveId, input.chipId],
    );
    if (existingRes.rowCount === 0) {
      throw new Error("Objective not found.");
    }

    const completedBy = existingRes.rows[0]?.completed_by_participant_id as string | null;

    if (completedBy) {
      await client.query(
        `
          update public.chip_objectives
          set completed_by_participant_id = null, completed_at = null, updated_at = now()
          where id = $1 and chip_id = $2
        `,
        [input.objectiveId, input.chipId],
      );
    } else {
      await client.query(
        `
          update public.chip_objectives
          set completed_by_participant_id = $3, completed_at = now(), updated_at = now()
          where id = $1 and chip_id = $2
        `,
        [input.objectiveId, input.chipId, input.participantId],
      );
    }

    await client.query("select public.refresh_chip_completion_status($1)", [input.chipId]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function setChipStatus(input: {
  chipId: string;
  fromStatus?: ChipStatus;
  toStatus: ChipStatus;
}) {
  const statusColumn =
    input.toStatus === "active"
      ? "activated_at"
      : input.toStatus === "completed"
        ? "completed_at"
        : input.toStatus === "expired"
          ? "expired_at"
          : input.toStatus === "canceled"
            ? "canceled_at"
            : null;

  if (input.fromStatus) {
    await db.query(
      `
        update public.chips
        set
          status = $3,
          ${statusColumn ? `${statusColumn} = now(),` : ""}
          updated_at = now()
        where id = $1 and status = $2
      `,
      [input.chipId, input.fromStatus, input.toStatus],
    );
    return;
  }

  await db.query(
    `
      update public.chips
      set
        status = $2,
        ${statusColumn ? `${statusColumn} = now(),` : ""}
        updated_at = now()
      where id = $1
    `,
    [input.chipId, input.toStatus],
  );
}

export async function listChipsPastDeadline() {
  const result = await db.query(
    `
      select id, public_code, status
      from public.chips
      where status in ('pending', 'active')
        and deadline_at <= now()
    `,
  );
  return result.rows as Array<{
    id: string;
    public_code: string;
    status: ChipStatus;
  }>;
}
