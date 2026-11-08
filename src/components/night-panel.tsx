import Link from "next/link";
import { cacheLife } from "next/cache";
import { sessionCosts, worstLately } from "@/lib/history";
import { pct } from "@/lib/verdict";

async function nightData() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const [worst, sessions] = await Promise.all([worstLately(3), sessionCosts()]);
  return { worst, sessions };
}

const LABEL: Record<string, string> = { regular: "Wall Street open", pre: "Pre-market", after: "After-hours", overnight: "Overnight", weekend: "Weekend" };
const ORDER = ["regular", "pre", "after", "overnight", "weekend"];
const when = (t: number) => new Date(t).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";

/** What the logger caught while Wall Street was closed, so a daytime visitor still sees the problem. */
export async function NightPanel() {
  const { worst, sessions } = await nightData();
  if (!worst.length && !sessions.length) return null;
  const rows = ORDER.map((s) => sessions.find((x) => x.session === s)).filter((x): x is NonNullable<typeof x> => !!x && x.samples >= 20);
  const max = Math.max(0.001, ...rows.map((r) => Math.max(r.buy, r.sell)));

  return (
    <section className="mt-14" aria-labelledby="slept">
      <h2 id="slept" className="font-serif text-3xl">While Wall Street slept</h2>
      <p className="mt-2 max-w-2xl text-sm text-soft">Logged onchain every 10 minutes, around the clock. Pools too thin to trade are left out.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {worst.length > 0 && (
          <div className="panel p-5">
            <p className="text-sm text-soft">Costliest $10k trades in the last 36 hours</p>
            <ol className="mt-3 divide-y divide-line">
              {worst.map((w) => (
                <li key={w.symbol} className="flex items-baseline justify-between gap-4 py-3">
                  <Link href={`/check/${w.symbol}?side=${w.side}&usd=10000`} className="hover:text-lamp">
                    <span className="font-medium">{w.side === "sell" ? "Selling" : "Buying"} {w.symbol}</span>
                    <span className="block text-xs text-faint">{when(w.at)}</span>
                  </Link>
                  <span className="font-serif text-3xl text-bad tnum">{pct(w.cost)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {rows.length > 0 && (
          <div className="panel p-5">
            <p className="text-sm text-soft">Average cost of a $10k trade, by session (last 7 days)</p>
            <div className="mt-4 grid gap-3">
              {rows.map((r) => (
                <div key={r.session}>
                  <div className="flex justify-between text-sm">
                    <span className={r.session === "regular" ? "text-good" : "text-ink"}>{LABEL[r.session] ?? r.session}</span>
                    <span className="text-soft tnum">sell {pct(Math.max(0, r.sell))} · buy {pct(Math.max(0, r.buy))}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel-2" aria-hidden>
                    <div className={`h-full rounded-full ${r.session === "regular" ? "bg-good" : "bg-lamp"}`} style={{ width: `${(Math.max(0, (r.sell + r.buy) / 2) / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-faint">Based on {rows.reduce((t, r) => t + r.samples, 0).toLocaleString("en-US")} quotes.</p>
          </div>
        )}
      </div>
    </section>
  );
}
