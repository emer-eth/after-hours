import "server-only";
// History from the cloud logger (Supabase, read with the public anon key).
import type { ChainKey } from "./chains";

export type Point = { t: number; s: string; buy: number | null; sell: number | null }; // s = session initial
export type Worst = { symbol: string; side: "buy" | "sell"; cost: number; at: number; liq: number };
export type SessionCost = { session: string; samples: number; buy: number; sell: number };

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function rest<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!URL_ || !KEY) return null;
  try {
    const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...init?.headers }, cache: "no-store", signal: AbortSignal.timeout(6000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

const since = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

/** A token's $10k buy and sell cost over the last week, oldest first. */
export async function historyFor(symbol: string, chain: ChainKey = "robinhood"): Promise<Point[]> {
  type Row = { at: string; session: string; buy_cost: number | null; sell_cost: number | null };
  const rows = await rest<Row[]>(`ah_costs?select=at,session,buy_cost,sell_cost&chain=eq.${chain}&symbol=eq.${encodeURIComponent(symbol)}&at=gte.${since(24 * 7)}&order=at.asc&limit=1100`);
  return (rows || []).map((r) => ({ t: Date.parse(r.at), s: r.session[0], buy: r.buy_cost, sell: r.sell_cost }));
}

/** The costliest $10k trades while Wall Street was closed in the last 36 hours, one per token, thin pools left out. */
export async function worstLately(limit = 3): Promise<Worst[]> {
  type Row = { at: string; symbol: string; liq: number; buy_cost: number | null; sell_cost: number | null };
  const [sells, buys] = await Promise.all([
    rest<Row[]>(`ah_costs?select=at,symbol,liq,buy_cost,sell_cost&chain=eq.robinhood&session=neq.regular&at=gte.${since(36)}&sell_cost=lt.0.2&order=sell_cost.desc.nullslast&limit=200`),
    rest<Row[]>(`ah_costs?select=at,symbol,liq,buy_cost,sell_cost&chain=eq.robinhood&session=neq.regular&at=gte.${since(36)}&buy_cost=lt.0.2&order=buy_cost.desc.nullslast&limit=200`),
  ]);
  const all: Worst[] = [
    ...(sells || []).filter((r) => r.sell_cost !== null).map((r) => ({ symbol: r.symbol, side: "sell" as const, cost: r.sell_cost!, at: Date.parse(r.at), liq: r.liq })),
    ...(buys || []).filter((r) => r.buy_cost !== null).map((r) => ({ symbol: r.symbol, side: "buy" as const, cost: r.buy_cost!, at: Date.parse(r.at), liq: r.liq })),
  ].sort((a, b) => b.cost - a.cost);
  const seen = new Set<string>();
  return all.filter((w) => !seen.has(w.symbol) && seen.add(w.symbol)).slice(0, limit);
}

/** Average $10k cost per session over the last week. */
export async function sessionCosts(chain: ChainKey = "robinhood"): Promise<SessionCost[]> {
  type Row = { session: string; samples: number; buy_cost: number; sell_cost: number };
  const rows = await rest<Row[]>("rpc/ah_session_costs", { method: "POST", body: JSON.stringify({ days: 7, chain_key: chain }) });
  return (rows || []).map((r) => ({ session: r.session, samples: Number(r.samples), buy: r.buy_cost, sell: r.sell_cost }));
}

export type SnapshotRow = { at: string; symbol: string; ref: number; ref_at: string; liq: number; buy10k: number | null; sell10k: number | null };

/** The logger's most recent snapshot (every token, one moment), if it's under 25 minutes old. */
export async function latestSnapshot(chain: ChainKey = "robinhood"): Promise<SnapshotRow[]> {
  const rows = await rest<SnapshotRow[]>(`ah_samples?select=at,symbol,ref,ref_at,liq,buy10k,sell10k&chain=eq.${chain}&at=gte.${since(25 / 60)}&order=at.desc&limit=80`);
  if (!rows?.length) return [];
  const newest = rows[0].at;
  return rows.filter((r) => r.at === newest);
}

/** Every $10k sell quote logged while Wall Street was closed in the last `hours` (newest first, up to 1,000). */
export async function closedQuotes(hours = 48, chain: ChainKey = "robinhood"): Promise<{ symbol: string; at: number; cost: number }[]> {
  type Row = { symbol: string; at: string; sell_cost: number | null };
  const rows = await rest<Row[]>(`ah_costs?select=symbol,at,sell_cost&chain=eq.${chain}&session=neq.regular&at=gte.${since(hours)}&sell_cost=not.is.null&order=at.desc&limit=1000`);
  return (rows || []).map((r) => ({ symbol: r.symbol, at: Date.parse(r.at), cost: r.sell_cost! }));
}
