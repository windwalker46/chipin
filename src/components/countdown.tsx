"use client";

import { useEffect, useMemo, useState } from "react";

function formatMs(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function Countdown({ deadlineAt }: { deadlineAt: string }) {
  const deadline = useMemo(() => new Date(deadlineAt).getTime(), [deadlineAt]);
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setLeft(Math.max(0, deadline - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return <span className="font-mono text-sm font-semibold">{formatMs(left)}</span>;
}
