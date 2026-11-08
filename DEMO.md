# After Hours: demo video shot list (about 80 seconds)

Record in a desktop browser at 1280px wide, full screen, on the live site. Hide bookmarks.
Best time to record: Sunday night or before Monday's open (Wall Street closed), so the verdicts are dramatic. If you record during market hours, lean on the history chart to show the weekend (end of shot 4).

| # | Time | On screen | Do | Say (voice-over or caption) |
|---|---|---|---|---|
| 1 | 0–8s | Home page, top | Hold on the headline and the split-flap "Wall Street is closed · opens in …" clock | "Wall Street is closed. But onchain, its stocks still trade, and 59% of that trading happens after the bell." |
| 2 | 8–18s | 06 · Tonight's board | Click **Board** in the nav. Scroll the Robinhood Chain table, then click the **Base** tab | "When the market's closed, pools get thin and nobody checks the price against the real stock. This board does it for every stock token, on Robinhood Chain and on Base, every ten minutes." |
| 3 | 18–30s | 05 · Check a trade → NVDA answer | Pick Robinhood Chain, NVDA, Sell, $10k, press **Check trade →**. The new page opens with the form at the top, the four-step loader, then the verdict card | "Say I want to sell ten thousand dollars of Nvidia right now. After Hours quotes my exact trade and compares it with Chainlink's last real price. Here's what it costs me, and its call." |
| 4 | 30–40s | Same page, below the verdict | Scroll slowly: the cost meter and price ladder, **Where it fills best**, the official-token check, then the history chart | "It shows where the cost comes from, where the trade fills best across every venue, and that this is Robinhood's real NVDA contract, not a copycat. And how this trade has cost over the past week." |
| 5 | 40–50s | Form at the top of the same page | Scroll back up. Switch the chain to **Base** and press **Check trade →**. Only the answer below swaps; the form stays put | "Change anything and check again, right here. The same trade on Base, with Coinbase's token, costs a fraction of that, because Base is much deeper." |
| 6 | 50–62s | Protected sell | Switch back to Robinhood Chain, check again, scroll to **Protected sell**. Leave it on 0.3%, press it. Show "Stopped. Nothing was sent." | "A normal swap only protects you against the pool's own price. This one uses the real price, and the router enforces it onchain. If even the best route can't meet it, nothing is sent. No wallet needed to try it." |
| 7 | 62–70s | Share buttons | Click **Download card** (or **Share on X** to show the preview) | "Every check makes a share card, so you can warn your followers before they trade." |
| 8 | 70–76s | Home page, 07 · For builders | Click **API** in the nav, hold on the curl example | "And it's a public API, so wallets, bots and agents can run the same check before every trade." |
| 9 | 76–80s | Home page headline | Hold | "After Hours. Check the trade before you make it. Built with Claude Code." |

## Before recording
- Open each page once first (NVDA on both chains included), so it's warm and loads instantly.
- Numbers change all the time. Say "about", and don't put exact figures in captions you prepare in advance. If the Base and Robinhood Chain costs come out close in shot 5, drop "a fraction of that" and say "compare the two".
- Don't connect a real wallet on camera. Shot 6 doesn't need one.
- Don't say "safe", "guaranteed", or give advice. Say "shows the cost" and "its call".

## Fallback
If a chain is slow while you record, use screenshots of the same pages and the share cards (`/api/og?symbol=NVDA&side=sell&usd=10000`, add `&chain=base` for Base) as stills, with the same voice-over.
