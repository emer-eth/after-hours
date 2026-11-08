import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "We read the last real price",
    body: "Chainlink publishes the actual stock's price onchain. When Wall Street is closed, it holds the last price the real market agreed on. That's the fair yardstick.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
    ),
  },
  {
    n: "02",
    title: "We quote your exact trade",
    body: "Not a market average: your stock, your side, your amount. We ask every venue on Robinhood Chain at once and take the best route, the way a trader actually would.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 12h10M7 11l10-5M7 13l10 5" /></svg>
    ),
  },
  {
    n: "03",
    title: "You get one plain call",
    body: "Trade now, set a limit, split it, or wait for the open, with the dollars at stake. And if you trade, a protected swap won't fill worse than you allow.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mt-28 scroll-mt-24" aria-labelledby="how-title">
      <p className="reveal text-sm font-medium tracking-wide text-lamp uppercase">How it works</p>
      <h2 id="how-title" className="reveal mt-2 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl" style={{ ["--d" as string]: ".05s" }}>
        Three checks, about two seconds.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.n} className="panel card-hover reveal relative overflow-hidden p-6" style={{ ["--d" as string]: `${0.1 + i * 0.12}s` }}>
            <span className="absolute -top-3 right-4 font-serif text-7xl text-white/[0.04] select-none" aria-hidden>{s.n}</span>
            <span className="grid size-10 place-items-center rounded-xl bg-lamp-soft text-lamp">{s.icon}</span>
            <h3 className="mt-5 text-lg font-medium">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const VERDICTS = [
  { label: "Trade now", tone: "bg-good", body: "Within 0.3% of the last real price, about what any trade costs." },
  { label: "Set a limit", tone: "bg-warn", body: "A bit off. A limit keeps you from paying more if it moves." },
  { label: "Split it", tone: "bg-warn", body: "Your own size is moving the price. Smaller pieces cost less." },
  { label: "Wait for the open", tone: "bg-bad", body: "Wall Street's closed and the gap is wide. It usually closes by the open." },
];

export function VerdictKey() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {VERDICTS.map((v, i) => (
        <div key={v.label} className="reveal flex gap-3 rounded-xl border border-line bg-panel/60 p-4" style={{ ["--d" as string]: `${i * 0.08}s` }}>
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${v.tone}`} aria-hidden />
          <span>
            <span className="block text-sm font-medium">{v.label}</span>
            <span className="mt-0.5 block text-sm text-soft">{v.body}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

const FAQ: [string, React.ReactNode][] = [
  ["What's a stock token?", <>A token on Robinhood Chain that tracks one share of a real US stock, like NVDA or AAPL. Unlike the stock itself, it trades around the clock, including nights and weekends when Wall Street is closed.</>],
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
    <section id="faq" className="mt-28 scroll-mt-24" aria-labelledby="faq-title">
      <p className="reveal text-sm font-medium tracking-wide text-lamp uppercase">Questions</p>
      <h2 id="faq-title" className="reveal mt-2 font-serif text-4xl sm:text-5xl">Good to know</h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-panel/60">
        {FAQ.map(([q, a], i) => (
          <details key={i} className="reveal group px-5 py-1" style={{ ["--d" as string]: `${i * 0.04}s` }}>
            <summary className="flex items-center justify-between gap-4 py-4 text-left font-medium transition-colors hover:text-lamp">
              <span>{q}</span>
              <span className="chev grid size-7 shrink-0 place-items-center rounded-full border border-line text-soft" aria-hidden>+</span>
            </summary>
            <div className="pb-5 text-sm leading-relaxed text-soft">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="reveal relative mt-28 overflow-hidden rounded-3xl border border-line bg-[radial-gradient(60rem_20rem_at_50%_0%,#f5b54422,transparent),var(--panel)] px-6 py-14 text-center">
      <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">Check the trade before you make it.</h2>
      <p className="mx-auto mt-4 max-w-xl text-soft">Free, no account, two seconds. Works for every stock token on Robinhood Chain.</p>
      <Link href="#check" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lamp px-6 py-3 font-medium text-night transition hover:brightness-110">
        Check a trade <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
