// Anonymous usage events (no IPs, wallets or ids), sent to Supabase's ah_track() with the public anon key.
// Works on the server and in the browser; never throws and never blocks the page.

export type EventKind = "check" | "protect" | "protect_blocked" | "protect_passed" | "swap" | "share_x" | "share_copy" | "share_card";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function track(kind: EventKind, f: { symbol?: string; side?: "buy" | "sell"; usd?: number; verdict?: string } = {}) {
  if (!URL_ || !KEY) return;
  try {
    await fetch(`${URL_}/rest/v1/rpc/ah_track`, {
      method: "POST",
      keepalive: true,
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ kind, symbol: f.symbol ?? null, side: f.side ?? null, usd: f.usd ? Math.round(f.usd) : null, verdict: f.verdict ?? null }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // analytics must never break anything
  }
}

/** Totals for the home page, or null if they can't be read. */
export async function stats(): Promise<{ checks: number; checksToday: number; protects: number; blocked: number; tokens: number } | null> {
  if (!URL_ || !KEY) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/ah_stats`, { method: "POST", headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" }, body: "{}", cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const [s] = (await r.json()) as { checks: number; checks_today: number; protects: number; blocked: number; tokens: number }[];
    return s ? { checks: Number(s.checks), checksToday: Number(s.checks_today), protects: Number(s.protects), blocked: Number(s.blocked), tokens: Number(s.tokens) } : null;
  } catch {
    return null;
  }
}
