import { after, connection } from "next/server";
import { checkTrade, CheckError } from "@/lib/check";
import { track } from "@/lib/track";

// Public pre-trade check API, for wallets, bots and agents:
//   GET /api/check?symbol=NVDA&side=sell&usd=10000
// Returns the call, the cost against Chainlink's last real price, the best route and the protective limit.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  await connection();
  const q = new URL(req.url).searchParams;
  const symbol = (q.get("symbol") || "").toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 10);
  const side = q.get("side") === "buy" ? "buy" : q.get("side") === "sell" ? "sell" : null;
  const usd = Math.round(Number(q.get("usd")));
  if (!symbol || !side || !(usd >= 10 && usd <= 5_000_000))
    return Response.json({ error: "Pass symbol (e.g. NVDA), side (buy or sell) and usd (10 to 5,000,000)." }, { status: 400, headers: CORS });

  try {
    const r = await checkTrade(symbol, side, usd);
    const v = r.verdict;
    after(() => track("check", { symbol, side, usd, verdict: v.call }));
    return Response.json(
      {
        symbol: r.asset.symbol,
        name: r.asset.name,
        token: r.asset.address,
        chainId: 4663,
        side,
        usd,
        session: r.session,
        nextOpen: r.nextOpen,
        call: v.call,
        title: v.title,
        lastRealPrice: { price: r.last.price, updatedAt: new Date(r.last.updatedAt).toISOString(), source: "chainlink" },
        fill: { price: r.best.price, tokens: r.best.tokens, usd: r.best.usd, via: r.best.source === "route" ? "kyberswap" : "uniswap-v3", venues: r.route?.venues ?? null },
        cost: { usd: v.costUsd, pct: v.costPct, driftPct: v.driftPct, sizeImpactPct: v.impactPct },
        protectiveLimit: v.limit,
        checkedAt: r.checkedAt,
        page: `${new URL(req.url).origin}/check/${r.asset.symbol}?side=${side}&usd=${usd}`,
      },
      { headers: { ...CORS, "cache-control": "public, s-maxage=30, stale-while-revalidate=30" } },
    );
  } catch (e) {
    const err = e instanceof CheckError ? { error: e.message, fix: e.fix, status: 422 } : { error: "Robinhood Chain didn't answer in time.", fix: "Try again in a moment.", status: 503 };
    return Response.json({ error: err.error, fix: err.fix }, { status: err.status, headers: CORS });
  }
}
