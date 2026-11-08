import { FAIR, WAIT } from "@/lib/verdict";

const money = (x: number) => `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Where this trade's cost falls: fair (green), worth a limit (amber), worth waiting (red). */
export function CostMeter({ cost }: { cost: number }) {
  const max = Math.max(0.02, Math.min(0.25, Math.abs(cost) * 1.3));
  const at = (x: number) => `${(Math.max(0, Math.min(max, x)) / max) * 100}%`;
  const c = Math.max(0, cost);
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-panel-2" aria-hidden>
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-good/70" style={{ width: at(FAIR) }} />
        <div className="absolute inset-y-0 bg-warn/70" style={{ left: at(FAIR), width: `calc(${at(WAIT)} - ${at(FAIR)})` }} />
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-bad/70" style={{ left: at(WAIT) }} />
        <div className="pop absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-night bg-ink shadow-[0_0_0_4px_#e9ebf322]" style={{ left: at(c), ["--d" as string]: ".6s" }} />
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-faint tnum">
        <span className="absolute left-0">0%</span>
        {/* Threshold labels only where they won't collide (on a wide scale they sit almost on top of 0%). */}
        {FAIR / max > 0.12 && <span className="absolute -translate-x-1/2" style={{ left: at(FAIR) }}>0.3%</span>}
        {(WAIT - FAIR) / max > 0.12 && <span className="absolute -translate-x-1/2" style={{ left: at(WAIT) }}>0.75%</span>}
        <span className="absolute right-0">{(max * 100).toFixed(max < 0.1 ? 1 : 0)}%</span>
      </div>
      <div className="mt-1 flex gap-4 text-[11px] text-faint">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-good/70" />fair</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warn/70" />use a limit</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-bad/70" />worth waiting</span>
      </div>
    </div>
  );
}

type Mark = { label: string; value: number; dot: string; text: string; row: 0 | 1 | 2 | 3 };

/** The prices that matter for this trade on one line, so the gap is something you can see. */
export function PriceLadder({ side, last, onchain, yours, limit }: { side: "buy" | "sell"; last: number; onchain: number | null; yours: number; limit: number }) {
  const marks: Mark[] = [
    { label: "Last real price", value: last, dot: "bg-lamp", text: "text-lamp", row: 0 },
    { label: side === "buy" ? "Your limit (max)" : "Your limit (min)", value: limit, dot: "bg-soft", text: "text-soft", row: 1 },
    ...(onchain ? [{ label: "Onchain price now", value: onchain, dot: "bg-cool", text: "text-cool", row: 2 as const }] : []),
    { label: side === "buy" ? "You'd pay" : "You'd get", value: yours, dot: yours === last ? "bg-good" : "bg-ink", text: "text-ink", row: 3 },
  ];
  const vals = marks.map((m) => m.value);
  const lo0 = Math.min(...vals), hi0 = Math.max(...vals);
  const pad = Math.max((hi0 - lo0) * 0.15, last * 0.002);
  const lo = lo0 - pad, hi = hi0 + pad;
  const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const top = (row: number) => [0, 26, 78, 104][row];
  const yourLeft = at(Math.min(last, yours)), yourRight = at(Math.max(last, yours));
  const worse = side === "buy" ? yours > last : yours < last;

  return (
    <div className="relative h-[136px]" role="img" aria-label={`Last real price ${money(last)}; you'd ${side === "buy" ? "pay" : "get"} ${money(yours)} per share; your protective limit is ${money(limit)}.`}>
      <div className="absolute inset-x-0 top-[66px] h-px bg-line" />
      <div className={`grow absolute top-[64px] h-[5px] rounded-full ${worse ? "bg-bad/60" : "bg-good/60"}`} style={{ left: `${yourLeft}%`, width: `${yourRight - yourLeft}%`, ["--d" as string]: ".5s" }} />
      {marks.map((m, i) => {
        const left = at(m.value);
        const above = m.row < 2;
        const align = left > 80 ? "right-0 text-right" : left < 20 ? "left-0" : "left-1/2 -translate-x-1/2 text-center";
        return (
          <div key={m.label} className="absolute" style={{ left: `${left}%`, top: 0, bottom: 0 }}>
            <span className="absolute w-px bg-line" style={above ? { top: top(m.row) + 18, height: 66 - top(m.row) - 18 } : { top: 70, height: top(m.row) - 70 }} />
            <span className={`pop absolute top-[61px] size-3 -translate-x-1/2 rounded-full ring-4 ring-panel ${m.dot}`} style={{ ["--d" as string]: `${0.15 + i * 0.12}s` }} />
            <span className={`fade-in absolute ${align} text-[11px] whitespace-nowrap`} style={{ top: top(m.row), ["--d" as string]: `${0.3 + i * 0.12}s` }}>
              <span className="text-faint">{m.label} · </span>
              <span className={`tnum ${m.text}`}>{money(m.value)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
