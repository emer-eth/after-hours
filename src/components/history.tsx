import { historyFor } from "@/lib/history";
import { pct } from "@/lib/verdict";

const W = 720, H = 180, PAD = { l: 44, r: 12, t: 12, b: 26 };

/** What a $10k trade on this side cost against the last real price, sample by sample, with Wall Street's open hours shaded. */
export async function History({ symbol, side, chain = "robinhood" }: { symbol: string; side: "buy" | "sell"; chain?: "robinhood" | "base" }) {
  const pts = (await historyFor(symbol, chain)).map(({ t, s, buy, sell }) => ({ t, s, v: side === "buy" ? buy : sell })).filter((p): p is { t: number; s: string; v: number } => p.v !== null && p.v < 0.2);
  if (pts.length < 6) return null;

  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  const vmax = Math.max(0.01, ...pts.map((p) => p.v));
  const vmin = Math.min(0, ...pts.map((p) => p.v));
  const x = (t: number) => PAD.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - vmin) / (vmax - vmin)) * (H - PAD.t - PAD.b);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const area = `${line}L${x(t1).toFixed(1)},${y(vmin)}L${x(t0).toFixed(1)},${y(vmin)}Z`;

  // Shade the stretches when Wall Street was open ("r" = regular session).
  const open: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].s !== "r") continue;
    const start = pts[i].t;
    while (i + 1 < pts.length && pts[i + 1].s === "r") i++;
    open.push([start, pts[i].t]);
  }
  const worst = pts.reduce((a, b) => (b.v > a.v ? b : a));
  const latest = pts[pts.length - 1];
  const fmt = (t: number) => new Date(t).toLocaleString("en-US", { weekday: "short", hour: "numeric", timeZone: "America/New_York" });
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => t0 + f * (t1 - t0));
  const grid = [vmin, (vmin + vmax) / 2, vmax];

  return (
    <section className="panel mt-6 p-5" aria-labelledby="hist">
      <h2 id="hist" className="font-medium">What {side === "buy" ? "buying" : "selling"} $10k of {symbol} has cost</h2>
      <p className="mt-1 text-sm text-soft">
        Logged every 10 minutes since {fmt(t0)} ET. Worst: <b className="font-medium text-ink">{pct(worst.v)}</b> on {fmt(worst.t)} ET. Latest logged: {pct(Math.max(0, latest.v))}.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={`Cost of a $10k ${side} of ${symbol} over time, peaking at ${pct(worst.v)}`}>
        {open.map(([a, b]) => (
          <rect key={a} x={x(a)} y={PAD.t} width={Math.max(2, x(b) - x(a))} height={H - PAD.t - PAD.b} fill="var(--good)" opacity="0.07" />
        ))}
        {grid.map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={PAD.l - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--faint)">{(g * 100).toFixed(1)}%</text>
          </g>
        ))}
        <path d={area} fill="var(--lamp)" opacity="0.1" />
        <path d={line} fill="none" stroke="var(--lamp)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(worst.t)} cy={y(worst.v)} r="4" fill="var(--lamp)" />
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">{fmt(t)}</text>
        ))}
      </svg>
      <p className="mt-2 flex items-center gap-2 text-xs text-faint">
        <span className="inline-block size-3 rounded-sm bg-good/20" aria-hidden /> Wall Street open
        <span className="ml-3 inline-block h-0.5 w-4 bg-lamp" aria-hidden /> Cost vs last real price
      </p>
    </section>
  );
}
