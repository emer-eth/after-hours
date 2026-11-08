import { cacheLife } from "next/cache";
import { stats } from "@/lib/track";

async function cachedStats() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  return stats();
}

/** "1,204 trades checked · 87 today · 41 protected swaps stopped", once there's anything to count. */
export async function Stats() {
  const s = await cachedStats();
  if (!s || s.checks < 10) return null;
  const n = (x: number) => x.toLocaleString("en-US");
  return (
    <p className="mt-10 flex flex-wrap gap-x-6 gap-y-1 text-sm text-soft tnum">
      <span><b className="font-medium text-ink">{n(s.checks)}</b> trades checked</span>
      <span><b className="font-medium text-ink">{n(s.checksToday)}</b> in the last 24 hours</span>
      <span><b className="font-medium text-ink">{n(s.tokens)}</b> stocks</span>
      {s.blocked > 0 && <span><b className="font-medium text-ink">{n(s.blocked)}</b> protected swaps stopped</span>}
    </p>
  );
}
