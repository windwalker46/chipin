import type { ChipStatus } from "@/lib/types";

const styles: Record<ChipStatus, string> = {
  pending: "bg-[#fef9c3] text-[#713f12]",
  active: "bg-[#cffafe] text-[#155e75]",
  completed: "bg-[#dcfce7] text-[#14532d]",
  expired: "bg-[#e5e7eb] text-[#1f2937]",
  canceled: "bg-[#fee2e2] text-[#7f1d1d]",
};

export function StatusBadge({ status }: { status: ChipStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}
