export function formatPercent(numerator: number, denominator: number | null) {
  if (!denominator || denominator <= 0) return null;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}
