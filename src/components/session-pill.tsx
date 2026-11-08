"use client";

import { useEffect, useMemo, useState } from "react";
import { nextClose, nextOpen, sessionAt } from "@/lib/session";

export function until(target: Date, now: Date) {
  const mins = Math.max(0, Math.round((+target - +now) / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

/** Ticks every second, aligned to the wall clock. Null until mounted, so server and browser HTML match. */
function useSecond() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now());
      t = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Digits({ value, tone }: { value: string; tone: string }) {
  return (
    <span className="flex gap-px">
      {value.split("").map((c, i) => (
        <span key={i} className={`clock-cell ${tone}`}>{c}</span>
      ))}
    </span>
  );
}

/**
 * The market clock in the header: "● NYSE CLOSED · OPENS IN 1D 06:12:45" in split-flap cells, ticking every second.
 * While the regular session is open it turns green and counts down to the close instead.
 */
export function SessionPill() {
  const now = useSecond();
  const minute = now === null ? null : Math.floor(now / 60_000);
  // Recompute the target only once a minute; the seconds tick off it.
  const state = useMemo(() => {
    if (minute === null) return null;
    const d = new Date(minute * 60_000);
    const open = sessionAt(d) === "regular";
    return { open, target: +(open ? nextClose(d) : nextOpen(d)) };
  }, [minute]);

  if (now === null || !state) return <span className="block h-9 w-[300px] border border-line bg-panel" aria-hidden />;

  const left = Math.max(0, Math.floor((state.target - now) / 1000));
  const days = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  const tone = state.open ? "text-good" : "text-lamp";
  const spoken = `${state.open ? "Wall Street is open, closes" : "Wall Street is closed, opens"} in ${days ? `${days} days ` : ""}${h} hours ${m} minutes`;

  return (
    <span className="flex h-9 items-center border border-line bg-panel/80 pr-1.5 pl-3 font-mono text-[10.5px] tracking-[.14em] uppercase" role="timer" aria-label={spoken}>
      <span className={`live-dot mr-2 size-1.5 rounded-full ${state.open ? "bg-good" : "bg-lamp"}`} aria-hidden />
      <span className="text-ink" aria-hidden>NYSE {state.open ? "open" : "closed"}</span>
      <span className="mx-2.5 h-4 w-px bg-line-2" aria-hidden />
      <span className="mr-2 text-faint" aria-hidden>{state.open ? "closes" : "opens"}</span>
      <span className="flex items-center gap-1" aria-hidden>
        {days > 0 && (
          <>
            <span className="mr-1"><Digits value={`${days}D`} tone={tone} /></span>
          </>
        )}
        <Digits value={pad(h)} tone={tone} />
        <span className="text-faint">:</span>
        <Digits value={pad(m)} tone={tone} />
        <span className="text-faint">:</span>
        <span key={s} className="clock-tick"><Digits value={pad(s)} tone={tone} /></span>
      </span>
    </span>
  );
}
