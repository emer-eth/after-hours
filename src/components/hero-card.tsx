import Link from "next/link";
import { CountUp } from "./ui/count-up";

export type HeroExample = {
  symbol: string;
  name: string;
  logo: string;
  side: "buy" | "sell";
  ref: number;
  fill: number;
  costUsd: number;
  costPct: number;
  label: string;
  tone: "good" | "warn" | "bad" | "cool";
};

const TONE = {
  good: { chip: "bg-good text-night", text: "text-good", bar: "bg-good" },
  warn: { chip: "bg-warn text-night", text: "text-warn", bar: "bg-warn" },
  bad: { chip: "bg-bad text-night", text: "text-bad", bar: "bg-bad" },
  cool: { chip: "bg-cool text-night", text: "text-cool", bar: "bg-cool" },
};

const usd2 = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A real, live check shown in the hero, so the value is visible before anyone touches the form. */
export function HeroCard({ ex }: { ex: HeroExample }) {
  const t = TONE[ex.tone];
  const gap = Math.abs(ex.fill - ex.ref);
  const lo = Math.min(ex.ref, ex.fill) - gap * 0.6, hi = Math.max(ex.ref, ex.fill) + gap * 0.6;
  const at = (v: number) => `${((v - lo) / Math.max(1e-9, hi - lo)) * 100}%`;
  return (
    <div className="pop relative" style={{ ["--d" as string]: ".25s" }}>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,#f5b5441a,transparent)]" aria-hidden />
      <div className="panel overflow-hidden shadow-[0_30px_80px_-30px_#000]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="live-dot size-1.5 rounded-full bg-lamp" /> Live example · right now
          </span>
          <span>Robinhood Chain</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ex.logo} alt="" className="size-10 rounded-full bg-panel-2" />
            <div>
              <p className="font-medium">
                {ex.side === "sell" ? "Selling" : "Buying"} $10,000 of {ex.symbol}
              </p>
              <p className="text-xs text-faint">{ex.name}</p>
            </div>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${t.chip}`}>{ex.label}</span>
          </div>

          <p className="mt-6 text-sm text-soft">{ex.costPct >= 0 ? "This trade would cost you" : "This trade would gain you"}</p>
          <p className={`font-serif text-6xl leading-none tracking-tight tnum ${t.text}`}>
            <CountUp value={Math.abs(ex.costUsd)} prefix="$" />
          </p>
          <p className="mt-2 text-sm text-soft tnum">
            {(Math.abs(ex.costPct) * 100).toFixed(2)}% {ex.costPct >= 0 ? "worse" : "better"} than the stock&apos;s last real price
          </p>

          {/* The gap, drawn */}
          <div className="mt-7">
            <div className="relative h-14">
              <div className="absolute inset-x-0 top-6 h-px bg-line" />
              <div className={`grow absolute top-[22px] h-[5px] rounded-full ${t.bar} opacity-60`} style={{ left: at(Math.min(ex.ref, ex.fill)), width: `calc(${at(Math.max(ex.ref, ex.fill))} - ${at(Math.min(ex.ref, ex.fill))})`, ["--d" as string]: ".9s" }} />
              <Marker left={at(ex.ref)} label="Last real price" value={usd2(ex.ref)} dot="bg-ink" above />
              <Marker left={at(ex.fill)} label="You'd get" value={usd2(ex.fill)} dot={t.bar} />
            </div>
          </div>

          <Link href={`/check/${ex.symbol}?side=${ex.side}&usd=10000`} className="mt-6 flex items-center justify-between rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm transition-colors hover:border-lamp/50 hover:text-lamp">
            See the full check
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Marker({ left, label, value, dot, above }: { left: string; label: string; value: string; dot: string; above?: boolean }) {
  return (
    <div className="pop absolute -translate-x-1/2" style={{ left, top: above ? 0 : 18, ["--d" as string]: above ? ".7s" : "1.4s" }}>
      {above && <p className="mb-1 text-center text-[10px] whitespace-nowrap text-faint">{label} · <span className="text-soft tnum">{value}</span></p>}
      <span className={`mx-auto block size-3 rounded-full ring-4 ring-panel ${dot}`} />
      {!above && <p className="mt-1 text-center text-[10px] whitespace-nowrap text-faint">{label} · <span className="text-soft tnum">{value}</span></p>}
    </div>
  );
}
