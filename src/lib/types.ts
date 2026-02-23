export type PoolStatus = "active" | "funded" | "refunding" | "expired" | "canceled";

export type ContributionStatus = "pending" | "succeeded" | "refunded" | "failed";

export type PoolWithOrganizer = {
  id: string;
  public_code: string;
  organizer_id: string;
  title: string;
  restaurant_name: string | null;
  goal_amount_cents: number | null;
  tip_percent: string;
  tax_percent: string;
  currency: string;
  collected_amount_cents: number;
  contribution_count: number;
  deadline_at: string;
  status: PoolStatus;
  funded_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  organizer_name: string | null;
  organizer_stripe_account_id: string | null;
  organizer_stripe_connected: boolean;
};

export type ContributionRow = {
  id: string;
  pool_id: string;
  contributor_name: string;
  amount_cents: number;
  platform_fee_cents: number;
  status: ContributionStatus;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
};
