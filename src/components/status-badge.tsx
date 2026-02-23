import type { PoolStatus } from "@/lib/types";

const styles: Record<PoolStatus, string> = {
  active: "bg-[#cffafe] text-[#155e75]",
  funded: "bg-[#dcfce7] text-[#14532d]",
  refunding: "bg-[#ffedd5] text-[#7c2d12]",
  expired: "bg-[#e5e7eb] text-[#1f2937]",
  canceled: "bg-[#fee2e2] text-[#7f1d1d]",
};

export function StatusBadge({ status }: { status: PoolStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}
