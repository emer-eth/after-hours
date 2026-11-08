"use client";

import { useNow } from "./use-now";
import { until } from "./session-pill";

export function Countdown({ to }: { to: string }) {
  const now = useNow();
  return <b className="font-medium text-ink tnum">{now ? until(new Date(to), now) : "…"}</b>;
}
