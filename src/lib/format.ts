export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPercent(numerator: number, denominator: number | null) {
  if (!denominator || denominator <= 0) return null;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

export function msUntil(deadlineIso: string) {
  return new Date(deadlineIso).getTime() - Date.now();
}
