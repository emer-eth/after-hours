"use client";

import { useEffect, useState } from "react";

const TICK = 30_000;

/** The current time, refreshed every 30 seconds; null until the component has mounted, so server and browser HTML match. */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Setting state on mount is the point here: the server can't know the viewer's clock.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), TICK);
    return () => clearInterval(t);
  }, []);
  return now;
}
