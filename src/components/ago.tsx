"use client";

import { useNow } from "./use-now";

export function ago(at: number, now: number) {
  const m = Math.max(0, Math.round((now - at) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/** "3 h ago", rendered on the client so server and browser clocks can't disagree. */
export function Ago({ at }: { at: number }) {
  const d = useNow();
  const now = d ? +d : null;
  return <time dateTime={new Date(at).toISOString()}>{now ? ago(at, now) : new Date(at).toISOString().slice(11, 16) + " UTC"}</time>;
}
