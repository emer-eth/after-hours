import { Chapter } from "./explainers";

const ROWS: [string, boolean, boolean][] = [
  ["Finds the best venue for your trade", true, true],
  ["Compares your fill with the real stock's price", false, true],
  ["Knows whether Wall Street is open, and when it opens", false, true],
  ["Tells you to wait, split or set a limit", false, true],
  ["Swap floor set from the oracle, enforced onchain", false, true],
  ["Confirms the token is Robinhood's official contract", false, true],
  ["Keeps a log of after-hours costs, every 10 minutes", false, true],
];

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-grid size-6 place-items-center bg-good/15 text-good" aria-label="Yes">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M3 8.5l3 3 7-7" /></svg>
    </span>
  ) : (
    <span className="inline-grid size-6 place-items-center text-faint" aria-label="No">—</span>
  );
}

/** The honest answer to "couldn't an aggregator just add this?" */
export function NotAnAggregator() {
  return (
    <section className="mt-36 grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start" aria-labelledby="agg-title">
      <div>
        <Chapter n="04">Not another aggregator</Chapter>
        <h2 id="agg-title" className="display reveal mt-6 text-5xl sm:text-6xl">
          Aggregators find the best pool. <span className="text-soft">We ask if it&apos;s a fair price.</span>
        </h2>
        <p className="reveal mt-6 max-w-md leading-relaxed text-soft">
          A router compares venues with each other. At 2am they can all be wrong together. After Hours uses the router, then checks the result against the real stock, and protects you from it.
        </p>
      </div>
      <div className="reveal border-y border-line">
        <div className="grid grid-cols-[1fr_96px_96px] border-b border-line py-3 font-mono text-[10.5px] tracking-[.14em] text-faint uppercase">
          <span />
          <span className="text-center">Aggregator</span>
          <span className="text-center text-lamp">After Hours</span>
        </div>
        {ROWS.map(([label, a, b]) => (
          <div key={label} className="grid grid-cols-[1fr_96px_96px] items-center border-b border-line/60 py-3.5 text-[15px] last:border-0">
            <span className="pr-4 text-soft">{label}</span>
            <span className="text-center"><Mark on={a} /></span>
            <span className="text-center"><Mark on={b} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Public API: the check as a building block for wallets, bots and agents. */
export function ForBuilders() {
  return (
    <section className="mt-36 grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-center" aria-labelledby="api-title">
      <div>
        <Chapter n="07" id="api">For builders</Chapter>
        <h2 id="api-title" className="display reveal mt-6 text-5xl sm:text-6xl">
          One call before every trade.
        </h2>
        <p className="reveal mt-6 max-w-md leading-relaxed text-soft">
          Wallets, trading bots and AI agents can ask After Hours before they swap a stock token, on Robinhood Chain or Base. Free, public, no key while it&apos;s in beta.
        </p>
        <ul className="reveal mt-8 grid gap-3 text-[15px] text-soft">
          {["Wallets: warn before a bad after-hours fill", "Bots and agents: skip trades that cost more than they should", "Dashboards: show the real cost next to the price"].map((t) => (
            <li key={t} className="flex items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 bg-lamp" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="reveal overflow-hidden border border-line-2 bg-[#0c0d10]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-[11px] text-faint">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-line-2" /><span className="size-2 rounded-full bg-line-2" /><span className="size-2 rounded-full bg-line-2" /></span>
          <span>GET /api/check</span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-soft">
          <code>
            <span className="text-faint">$ </span>
            <span className="text-ink">curl</span> <span className="text-good">&quot;/api/check?symbol=NVDA&amp;side=sell&amp;usd=10000&amp;chain=base&quot;</span>
            {"\n\n"}
            {"{"}
            {"\n  "}<span className="text-cool">&quot;call&quot;</span>: <span className="text-warn">&quot;limit&quot;</span>,
            {"\n  "}<span className="text-cool">&quot;title&quot;</span>: <span className="text-warn">&quot;Use a limit, not a market order&quot;</span>,
            {"\n  "}<span className="text-cool">&quot;lastRealPrice&quot;</span>: {"{ "}<span className="text-cool">&quot;price&quot;</span>: <span className="text-lamp">188.24</span>, <span className="text-cool">&quot;source&quot;</span>: <span className="text-warn">&quot;chainlink&quot;</span>{" }"},
            {"\n  "}<span className="text-cool">&quot;fill&quot;</span>: {"{ "}<span className="text-cool">&quot;price&quot;</span>: <span className="text-lamp">187.32</span>, <span className="text-cool">&quot;via&quot;</span>: <span className="text-warn">&quot;kyberswap&quot;</span>{" }"},
            {"\n  "}<span className="text-cool">&quot;cost&quot;</span>: {"{ "}<span className="text-cool">&quot;usd&quot;</span>: <span className="text-lamp">48.69</span>, <span className="text-cool">&quot;pct&quot;</span>: <span className="text-lamp">0.0049</span>{" }"},
            {"\n  "}<span className="text-cool">&quot;protectiveLimit&quot;</span>: <span className="text-lamp">187.68</span>
            {"\n}"}
          </code>
        </pre>
        <div className="border-t border-line px-5 py-3 font-mono text-[11px] text-faint">
          <a href="/api/check?symbol=NVDA&side=sell&usd=10000&chain=base" target="_blank" className="text-soft underline decoration-line underline-offset-4 hover:text-lamp">Try it live ▸</a>
        </div>
      </div>
    </section>
  );
}

const PLAN = [
  { stage: "Live", tone: "text-good border-good/40", title: "Free checks for everyone", body: "Every tokenized stock, ETF and commodity fund on Robinhood Chain. Verdict, real cost, protected swap, live board and history. No account." },
  { stage: "Live", tone: "text-good border-good/40", title: "Public API", body: "One call before a trade, for wallets, bots and agents. Open while in beta." },
  { stage: "Next", tone: "text-warn border-warn/40", title: "Small fee on protected swaps", body: "A disclosed fee of around 0.1% only when you trade through After Hours, the way wallets and routers charge today. Checking stays free." },
  { stage: "Next", tone: "text-warn border-warn/40", title: "Pro API and alerts", body: "Higher limits and an SLA for wallets and trading desks. Alerts when a stock you hold drifts after hours." },
  { stage: "Later", tone: "text-soft border-line-2", title: "More chains and assets", body: "Robinhood Chain and Base today. Next, every chain where tokenized equities trade around the clock." },
];

/** How it becomes a business. */
export function WhereItsGoing() {
  return (
    <section className="mt-36" aria-labelledby="plan-title">
      <Chapter n="08">Where it&apos;s going</Chapter>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <h2 id="plan-title" className="display reveal text-5xl sm:text-6xl">
          Free to check. <span className="text-soft">Paid to trade through.</span>
        </h2>
        <p className="reveal max-w-md leading-relaxed text-soft lg:justify-self-end">
          Every after-hours trade is a moment someone needs a second opinion. The check stays free; revenue comes from the trades and integrations it earns.
        </p>
      </div>
      <ol className="reveal mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-5">
        {PLAN.map((p, i) => (
          <li key={p.title} className="flex flex-col bg-night p-5">
            <span className="flex items-center justify-between">
              <span className={`border px-2 py-0.5 font-mono text-[10px] tracking-[.14em] uppercase ${p.tone}`}>{p.stage}</span>
              <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <h3 className="mt-6 font-medium">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-soft">{p.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
