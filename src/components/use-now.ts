"use client";

import { useSyncExternalStore } from "react";

const TICK = 30_000;
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, TICK);
  return () => clearInterval(t);
};

/** The current time, rounded to 30 seconds so it stays stable between ticks; null while server rendering. */
export function useNow(): Date | null {
  const ms = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / TICK) * TICK, () => null);
  return ms === null ? null : new Date(ms);
}
