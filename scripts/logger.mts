// Local backup logger: samples every stock token every 10 minutes into data/log.jsonl (one JSON line per token).
// The cloud logger (Supabase cron → /api/sample) is the main one; this keeps a local copy. Run: npx tsx scripts/logger.mts
import { appendFileSync, mkdirSync } from "node:fs";
import { sampleAll } from "../src/lib/sample";

const OUT = new URL("../data/log.jsonl", import.meta.url);
const EVERY = Number(process.env.EVERY_MIN || 10) * 60_000;
mkdirSync(new URL("../data/", import.meta.url), { recursive: true });

for (;;) {
  const started = Date.now();
  try {
    const rows = await sampleAll();
    for (const r of rows) appendFileSync(OUT, JSON.stringify(r) + "\n");
    console.log(`${new Date().toISOString()}: logged ${rows.length}`);
  } catch (e) {
    console.error(new Date().toISOString(), "sample failed:", e);
  }
  await new Promise((r) => setTimeout(r, Math.max(10_000, EVERY - (Date.now() - started))));
}
