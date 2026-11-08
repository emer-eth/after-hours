# After Hours

**Wall Street is asleep. Its stocks aren't.**

Live: https://after-hours-rouge.vercel.app

Covers Robinhood Chain and Base (Coinbase tokenized stocks). 59% of stock-token trading on Robinhood Chain happens outside US market hours, when pools are thin and there's no live market to check against. After Hours checks a stock-token trade before you make it:

- **What it really costs.** Your fill through the best route across every venue on Robinhood Chain (KyberSwap), next to a single Uniswap v3 pool (QuoterV2), against Chainlink's last real price for the stock. The cost is split into pool drift and your own size.
- **One plain call.** Trade now, set a limit, split it, wait for the open, or the pool's too thin.
- **Is it the real token?** Checked against Robinhood's official asset list, because anyone can launch a token called NVDA.
- **Protected swap.** The worst acceptable fill is set from Chainlink's price, not from the pool's own (possibly drifted) price. If the pool can't meet it, nothing is sent. The check runs without a wallet.
- **Tonight's board.** Every stock token with a pool: drift, and what $10k costs each way, refreshed every 5 minutes.
- **History.** A cloud logger (Supabase cron → `/api/sample`) records every token's best-route cost every 10 minutes, so you can see what trading cost at night and on weekends compared with market hours.

Read-only data needs no keys: Robinhood's public `rhj` API, Chainlink feeds and Uniswap v3 on Robinhood Chain (chain 4663), and DexScreener for pool discovery.

## Public API

```
GET /api/check?symbol=NVDA&side=sell&usd=10000            # Robinhood Chain
GET /api/check?symbol=NVDA&side=sell&usd=10000&chain=base  # Base
```

Returns the call (`fair`, `limit`, `split`, `wait`, `bonus`, `thin`), Chainlink's last real price, the best fill and venues, the cost (USD and %, split into drift and size impact) and a protective limit. CORS open, cached 30 s, no key while in beta.

## Business model

Checks stay free. Planned: a small disclosed fee on protected swaps, and a Pro API with alerts for wallets and trading desks.

## Run

```bash
npm install
npm run dev                      # http://localhost:3000
npx tsx scripts/logger.mts       # sample every 10 min into data/log.jsonl
npx tsx --test tests/*.test.ts   # verdict and market-session tests
```

## Contracts used (Robinhood Chain)

| | Address |
|---|---|
| Uniswap v3 Factory | `0x1f7d7550b1b028f7571e69a784071f0205fd2efa` |
| QuoterV2 | `0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7` |
| SwapRouter02 | `0xcaf681a66d020601342297493863e78c959e5cb2` |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |

Chainlink feed addresses are in `src/lib/feeds.json`, taken from Chainlink's directory for `robinhood-mainnet`.

Not financial advice. Stock tokens aren't offered to US persons.

Built with Claude Code.
