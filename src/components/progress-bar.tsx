type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#dfe6e9]">
      <div
        className="h-full rounded-full bg-[#0e7490] transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
