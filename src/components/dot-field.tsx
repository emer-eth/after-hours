import { cacheLife } from "next/cache";
import { closedQuotes } from "@/lib/history";
import { pct } from "@/lib/verdict";

async function data() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return closedQuotes(48);
}

const band = (c: number) => (c >= 0.2 ? "thin" : c >= 0.0075 ? "wait" : c >= 0.003 ? "limit" : "fair");
const COLOR = { fair: "bg-good", limit: "bg-warn", wait: "bg-bad", thin: "bg-line-2" } as const;

/** Real data as the picture: one dot per $10k sell quote the logger took while Wall Street was closed. */
export async function DotField() {
  const quotes = (await data()).slice(0, 600).reverse(); // oldest first, so the field fills in time order
  if (quotes.length < 60) return null;
  const counts = quotes.reduce<Record<string, number>>((c, q) => ((c[band(q.cost)] = (c[band(q.cost)] || 0) + 1), c), {});
  const tradeable = quotes.filter((q) => q.cost < 0.2);
  const avg = tradeable.reduce((t, q) => t + Math.max(0, q.cost), 0) / Math.max(1, tradeable.length);
  const over = (counts.wait || 0) + (counts.limit || 0);
  return (
    <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
      <div className="panel reveal p-5 sm:p-6">
        <div className="grid gap-[6px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(13px, 1fr))" }} aria-hidden>
          {quotes.map((q, i) => (
            <span
              key={i}
              title={`${q.symbol} · ${pct(Math.max(0, q.cost))}`}
              className={`dot aspect-square rounded-full ${COLOR[band(q.cost)]}`}
              style={{ ["--i" as string]: i }}
            />
          ))}
        </div>
      </div>
      <div className="reveal">
        <p className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Each dot is one $10k sale we priced while Wall Street was closed.{" "}
          <span className="text-soft">The red ones cost more than 0.75%.</span>
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-night p-4">
            <dt className="label">Quotes</dt>
            <dd className="mt-2 font-serif text-3xl tracking-tight tnum">{quotes.length.toLocaleString("en-US")}</dd>
          </div>
          <div className="bg-night p-4">
            <dt className="label">Average cost</dt>
            <dd className="mt-2 font-serif text-3xl tracking-tight tnum">{pct(avg)}</dd>
          </div>
          <div className="bg-night p-4">
            <dt className="label">Worth a limit or waiting</dt>
            <dd className="mt-2 font-serif text-3xl tracking-tight tnum">{Math.round((over / quotes.length) * 100)}%</dd>
          </div>
          <div className="bg-night p-4">
            <dt className="label">Window</dt>
            <dd className="mt-2 font-serif text-3xl tracking-tight">48h</dd>
          </div>
        </dl>
        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] tracking-[.12em] text-soft uppercase">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-good" />Fair {counts.fair || 0}</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-warn" />Limit {counts.limit || 0}</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-bad" />Wait {counts.wait || 0}</span>
          {counts.thin ? <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-line-2" />Too thin {counts.thin}</span> : null}
        </p>
      </div>
    </div>
  );
}
