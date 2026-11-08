import { ImageResponse } from "next/og";
import { checkTrade } from "@/lib/check";
import { pct, usdFmt, type Call } from "@/lib/verdict";

// The share card for a check: the call, the trade and what it costs, live when the card is fetched.

const COLORS: Record<Call | "none", { bg: string; fg: string; label: string }> = {
  fair: { bg: "#5fd497", fg: "#0a0d16", label: "TRADE NOW" },
  bonus: { bg: "#86a8f8", fg: "#0a0d16", label: "BETTER THAN LAST PRICE" },
  limit: { bg: "#f5b544", fg: "#0a0d16", label: "SET A LIMIT" },
  split: { bg: "#f5b544", fg: "#0a0d16", label: "SPLIT IT" },
  wait: { bg: "#f2766b", fg: "#0a0d16", label: "WAIT FOR THE OPEN" },
  thin: { bg: "#f2766b", fg: "#0a0d16", label: "POOL TOO THIN" },
  none: { bg: "#f5b544", fg: "#0a0d16", label: "AFTER HOURS" },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams;
  const symbol = (q.get("symbol") || "NVDA").toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 10);
  const side = q.get("side") === "buy" ? "buy" : "sell";
  const usd = Math.min(5_000_000, Math.max(10, Math.round(Number(q.get("usd")) || 10_000)));

  let call: Call | "none" = "none";
  let title = "Check a stock-token trade before you make it";
  let line = "Wall Street is asleep. Its stocks aren't.";
  let cost = "";
  try {
    const r = await checkTrade(symbol, side, usd);
    call = r.verdict.call;
    title = r.verdict.title;
    const v = r.verdict;
    cost = v.costPct >= 0 ? `${usdFmt(Math.abs(v.costUsd))} lost · ${pct(v.costPct)}` : `${usdFmt(Math.abs(v.costUsd))} better · ${pct(-v.costPct)}`;
    line = `vs the last real price of $${r.last.price.toFixed(2)} (Chainlink)`;
  } catch {
    // Fall back to the brand card rather than a broken image.
  }
  const c = COLORS[call];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #0a0d16 0%, #111626 70%, #2a2210 100%)", color: "#e9ebf3", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f5b5442a", color: "#f5b544", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>☾</div>
            After Hours
          </div>
          <div style={{ display: "flex", background: c.bg, color: c.fg, padding: "10px 22px", borderRadius: 999, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>{c.label}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 34, color: "#98a1b7" }}>
            {side === "buy" ? "Buying" : "Selling"} {usdFmt(usd)} of <span style={{ color: "#f5b544", marginLeft: 10 }}>{symbol}</span>
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 600, maxWidth: 1000 }}>{title}</div>
          {cost && <div style={{ fontSize: 44, color: c.bg, fontWeight: 600 }}>{cost}</div>}
          <div style={{ fontSize: 28, color: "#98a1b7" }}>{line}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#636c84" }}>
          <span>Stocks, ETFs and commodities on Robinhood Chain</span>
          <span>{url.host}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=300, s-maxage=300" } },
  );
}
