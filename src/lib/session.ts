// Which US stock market session it is right now, in New York time.
// Regular 9:30–16:00 ET; pre-market 4:00–9:30; after-hours 16:00–20:00; overnight 20:00–4:00 (Sun night to Fri morning).
// Weekend: Fri 20:00 to Sun 20:00 ET, nothing trades on Wall Street. Exchange holidays are not modelled.

export type Session = "regular" | "pre" | "after" | "overnight" | "weekend";

export const SESSION_LABEL: Record<Session, string> = {
  regular: "Wall Street is open",
  pre: "Pre-market",
  after: "After-hours",
  overnight: "Overnight",
  weekend: "Weekend: Wall Street is closed",
};

function nyParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, mins: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function sessionAt(d = new Date()): Session {
  const { day, mins } = nyParts(d);
  const t = (h: number, m = 0) => h * 60 + m;
  if (day === 6) return "weekend";
  if (day === 0) return mins >= t(20) ? "overnight" : "weekend";
  if (day === 5 && mins >= t(20)) return "weekend";
  if (mins >= t(9, 30) && mins < t(16)) return "regular";
  if (mins >= t(4) && mins < t(9, 30)) return "pre";
  if (mins >= t(16) && mins < t(20)) return "after";
  return "overnight";
}

/** The next time the regular session opens (9:30 ET on a weekday), found by stepping forward in quarter hours. */
export function nextOpen(d = new Date()): Date {
  const step = 15 * 60_000; // 9:30 ET is always on a quarter-hour boundary in UTC
  let x = new Date(Math.ceil(+d / step) * step);
  for (let i = 0; i < 4 * 24 * 5; i++) {
    if (sessionAt(x) === "regular" && sessionAt(new Date(+x - step)) !== "regular") return x;
    x = new Date(+x + step);
  }
  return x;
}

export const isClosed = (s: Session) => s !== "regular";
