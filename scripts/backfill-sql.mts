// Turns the local log (data/log.jsonl, old and new formats) into an SQL file that loads it into ah_samples.
// Run: npx tsx scripts/backfill-sql.mts > /path/to/backfill.sql
import { readFileSync } from "node:fs";

type Old = { at: string; session: string; symbol: string; close?: { price: number; updatedAt: number }; h24?: { price: number } | null; pools?: { liq: number }[]; fills?: Record<string, number | null> };
type New = { at: string; session: string; symbol: string; ref: number; ref_at: string; h24: number | null; liq: number } & Record<string, unknown>;

const rows: Record<string, unknown>[] = [];
for (const line of readFileSync(new URL("../data/log.jsonl", import.meta.url), "utf8").split("\n")) {
  if (!line.trim()) continue;
  let r: Old & Partial<New>;
  try { r = JSON.parse(line); } catch { continue; }
  if (typeof r.ref === "number") { rows.push(r); continue; }
  if (!r.close?.price || !r.fills) continue;
  const f = r.fills;
  rows.push({
    at: r.at, symbol: r.symbol, session: r.session, ref: r.close.price, ref_at: new Date(r.close.updatedAt).toISOString(),
    h24: r.h24?.price ?? null, liq: (r.pools || []).reduce((t, p) => t + (p.liq || 0), 0),
    buy1k: f.buy1000 ?? null, sell1k: f.sell1000 ?? null, buy10k: f.buy10000 ?? null, sell10k: f.sell10000 ?? null, buy50k: f.buy50000 ?? null, sell50k: f.sell50000 ?? null,
  });
}
const json = JSON.stringify(rows).replace(/'/g, "''");
console.log(`insert into public.ah_samples select * from jsonb_populate_recordset(null::public.ah_samples, '${json}'::jsonb) on conflict do nothing;`);
console.error(`backfill: ${rows.length} rows`);
