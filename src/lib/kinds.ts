// What each tokenized asset is. Everything not listed here is a single company's stock.

export type Kind = "stock" | "etf" | "commodity";

const KINDS: Record<string, Kind> = {
  SPY: "etf", QQQ: "etf", SGOV: "etf", EWY: "etf", EWT: "etf", BND: "etf", GDX: "etf",
  GLD: "commodity", SLV: "commodity", USO: "commodity",
};

export const kindOf = (symbol: string): Kind => KINDS[symbol] ?? "stock";

export const KIND_LABEL: Record<Kind, string> = { stock: "Stock", etf: "ETF", commodity: "Commodity" };
export const KIND_PLURAL: Record<Kind, string> = { stock: "Stocks", etf: "ETFs", commodity: "Commodities" };
