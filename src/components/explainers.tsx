import Link from "next/link";

/** "▍ 03 / HOW IT WORKS" */
export function Chapter({ n, children, id }: { n: string; children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="label reveal flex items-center gap-2.5 scroll-mt-28">
      <span className="h-3 w-[3px] bg-lamp" aria-hidden />
      <b>{n}</b> <span className="text-faint">/</span> {children}
    </p>
  );
}

const STEPS = [
  {
    n: "01",
    big: "1",
    unit: "real price",
    title: "Read the last real price",
    body: "Chainlink publishes the actual stock's price onchain. When Wall Street is closed, it holds the last price the real market agreed on: the fair yardstick.",
  },
  {
    n: "02",
    big: "9+",
    unit: "venues asked",
    title: "Quote your exact trade",
    body: "Your asset, your side, your amount. Every venue on Robinhood Chain at once, best route wins, fees and price impact included. Not an average.",
  },
  {
    n: "03",
    big: "1",
    unit: "plain call",
    title: "Get a call, trade protected",
    body: "Trade now, set a limit, split it, or wait for the open, with the dollars at stake. If you trade, the swap can't fill worse than you allow.",
  },
];

export function HowItWorks() {
  return (
    <section className="mt-36" aria-labelledby="how-title">
      <Chapter n="03" id="how">How it works</Chapter>
      <h2 id="how-title" className="display reveal mt-6 max-w-3xl text-5xl sm:text-6xl">
        Three checks. <span className="text-soft">About two seconds.</span>
      </h2>
      <div className="reveal mt-14 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
        {STEPS.map((s) => (
          <div key={s.n} className="group relative py-10 md:px-8 md:first:pl-0 md:last:pr-0">
            <span className="font-mono text-[11px] tracking-[.16em] text-faint">[{s.n}]</span>
            <p className="mt-8 flex items-baseline gap-3">
              <span className="display text-7xl text-ink transition-colors group-hover:text-lamp">{s.big}</span>
              <span className="label">{s.unit}</span>
            </p>
            <h3 className="mt-8 text-lg font-medium">{s.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const VERDICTS = [
  { label: "Trade now", tone: "bg-good", text: "text-good", body: "Within 0.3% of the last real price." },
  { label: "Set a limit", tone: "bg-warn", text: "text-warn", body: "A little off. Cap what you pay." },
  { label: "Split it", tone: "bg-warn", text: "text-warn", body: "Your size moves the price." },
  { label: "Wait for the open", tone: "bg-bad", text: "text-bad", body: "Closed market, wide gap." },
];

export function VerdictKey() {
  return (
    <div className="reveal mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {VERDICTS.map((v) => (
        <div key={v.label} className="bg-night p-5">
          <p className={`flex items-center gap-2.5 font-mono text-[11.5px] tracking-[.14em] uppercase ${v.text}`}>
            <span className={`size-2 ${v.tone}`} aria-hidden /> {v.label}
          </p>
          <p className="mt-3 text-sm text-soft">{v.body}</p>
        </div>
      ))}
    </div>
  );
}

const FAQ: [string, React.ReactNode][] = [
  ["What can I check?", <>Any tokenized asset on Robinhood Chain that tracks a real US-listed security: company stocks like NVDA or AAPL, ETFs like SPY and QQQ, and commodity funds that track gold, silver and oil (GLD, SLV, USO). Each token tracks one share. Unlike the real thing, it trades around the clock, including nights and weekends when Wall Street is closed.</>],
  ["Why would the price be off at night?", <>When Wall Street closes, there&apos;s no live market to anchor the token. Liquidity near the price drops by a fifth to a third, and the same order moves the price more. Prices drift, and then usually snap back by the open.</>],
  ["What does “last real price” mean?", <>The stock&apos;s most recent price from the real market, published onchain by Chainlink. Robinhood itself points developers to these feeds. It already includes splits and dividends.</>],
  ["How is the cost worked out?", <>We quote your exact trade through the best route across every venue on Robinhood Chain (via KyberSwap), and compare what you&apos;d get with what the same trade is worth at the last real price. Fees and price impact are included.</>],
  ["What's a protected swap?", <>A normal swap only protects you against the market&apos;s <em>current</em> price, which may already have drifted. Ours sets your worst acceptable fill from the last real price, and the swap router enforces it onchain. If the market can&apos;t meet it, nothing is sent.</>],
  ["Is this financial advice?", <>No. It shows costs and a simple rule of thumb. Overnight news can move any stock before the open, and a price that looks off may be right.</>],
  ["Can I use it in the US?", <>Checking works for anyone, anywhere. Robinhood doesn&apos;t offer stock tokens to US persons, so trading is only for eligible regions, and it&apos;s your responsibility.</>],
  ["Do you see my wallet or data?", <>No accounts, no tracking of wallets. We count anonymous events (like &ldquo;a check was made&rdquo;) to know if this is useful. A wallet is only needed if you choose to trade.</>],
];

export function Faq() {
  return (
    <section className="mt-36 grid gap-12 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq-title">
      <div>
        <Chapter n="09" id="faq">Questions</Chapter>
        <h2 id="faq-title" className="display reveal mt-6 text-5xl sm:text-6xl">Good to know.</h2>
        <p className="reveal mt-5 max-w-xs text-soft">Everything about the numbers, the data and what we don&apos;t collect.</p>
      </div>
      <div className="border-t border-line">
        {FAQ.map(([q, a], i) => (
          <details key={i} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-6 py-5 text-left text-[17px] transition-colors hover:text-lamp">
              <span className="flex items-baseline gap-4">
                <span className="font-mono text-[11px] tracking-[.14em] text-faint">{String(i + 1).padStart(2, "0")}</span>
                {q}
              </span>
              <span className="chev grid size-7 shrink-0 place-items-center border border-line text-soft" aria-hidden>+</span>
            </summary>
            <div className="pb-6 pl-9 text-[15px] leading-relaxed text-soft">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="reveal relative mt-36 overflow-hidden border border-line-2 px-6 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_50%_0%,#ffb5471f,transparent_70%)]" aria-hidden />
      <p className="label relative">Free · no account · two seconds</p>
      <h2 className="display relative mx-auto mt-6 max-w-3xl text-5xl sm:text-7xl">
        Check the trade <span className="text-lamp">before</span> you make it.
      </h2>
      <div className="relative mt-10 flex justify-center">
        <Link href="#check" className="group flex items-center border border-line-2 text-[12px] font-medium tracking-[.14em] uppercase transition-colors hover:border-lamp/60">
          <span className="grid size-12 place-items-center bg-lamp text-night">→</span>
          <span className="px-5 font-mono">Check a trade</span>
        </Link>
      </div>
    </section>
  );
}
