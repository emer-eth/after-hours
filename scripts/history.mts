// Turns data/log.jsonl into src/data/history.json: for each token, what a $10k buy and sell cost against the last real price over time.
// Run before deploying: npx tsx scripts/history.mts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const src = new URL("../data/log.jsonl", import.meta.url);
const out = new URL("../src/data/history.json", import.meta.url);
mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });

type Row = { at: string; session: string; symbol: string; close?: { price: number }; fills?: Record<string, number | null> };
const series: Record<string, [number, string, number | null, number | null][]> = {};
const lines = existsSync(src) ? readFileSync(src, "utf8").split("\n").filter(Boolean) : [];
for (const line of lines) {
  let r: Row;
  try { r = JSON.parse(line); } catch { continue; }
  const ref = r.close?.price, b = r.fills?.buy10000, s = r.fills?.sell10000;
  if (!ref || (!b && !s)) continue;
  const round = (x: number) => Math.round(x * 1e5) / 1e5;
  (series[r.symbol] ||= []).push([Date.parse(r.at), r.session[0], b ? round((b - ref) / ref) : null, s ? round((ref - s) / ref) : null]);
}
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), series }));
console.log(`history: ${Object.keys(series).length} tokens, ${lines.length} samples`);
