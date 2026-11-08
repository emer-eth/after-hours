"use client";

import { useNow } from "./use-now";
import { nextOpen, sessionAt, SESSION_LABEL, type Session } from "@/lib/session";

export function until(target: Date, now: Date) {
  const mins = Math.max(0, Math.round((+target - +now) / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

/** The current Wall Street session and how long until it opens, ticking every 30 seconds. */
export function SessionPill() {
  const now = useNow();
  if (!now) return <span className="h-8 w-48 rounded-full bg-panel" aria-hidden />;
  const s: Session = sessionAt(now);
  const open = s === "regular";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] text-soft">
      <span className={`live-dot size-2 rounded-full ${open ? "bg-good" : "bg-lamp"}`} aria-hidden />
      <span className="text-ink">{open ? SESSION_LABEL.regular : s === "weekend" ? "Wall Street is closed" : SESSION_LABEL[s]}</span>
      {!open && <span className="hidden tnum sm:inline">· opens in {until(nextOpen(now), now)}</span>}
    </span>
  );
}
