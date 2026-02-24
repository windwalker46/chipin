export type ChipStatus = "pending" | "active" | "completed" | "expired" | "canceled";

export type ChipRow = {
  id: string;
  public_code: string;
  creator_id: string;
  title: string;
  description: string | null;
  threshold_count: number;
  deadline_at: string;
  status: ChipStatus;
  is_private: boolean;
  power_unlocked: boolean;
  recurrence_rule: string | null;
  participant_count: number;
  objective_count: number;
  activated_at: string | null;
  completed_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  creator_name: string | null;
};

export type ChipParticipantRow = {
  id: string;
  chip_id: string;
  user_id: string | null;
  display_name: string;
  is_creator: boolean;
  joined_at: string;
};

export type ChipObjectiveRow = {
  id: string;
  chip_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  assigned_participant_id: string | null;
  assigned_to_name: string | null;
  completed_by_participant_id: string | null;
  completed_by_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
