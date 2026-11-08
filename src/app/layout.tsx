import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SessionPill } from "@/components/session-pill";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "After Hours: check a stock token trade before you make it", template: "%s · After Hours" },
  description:
    "Wall Street is closed, but Robinhood Chain stock tokens still trade. After Hours shows what your trade really costs against the last real price, and tells you whether to trade now, set a limit, or wait for the open.",
};

export const viewport: Viewport = { themeColor: "#0a0d16" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-lamp-soft text-lamp">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a8.5 8.5 0 1 0 10.9 10.9Z" /></svg>
            </span>
            After Hours
          </Link>
          <SessionPill />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-sm text-faint sm:px-6">
          <p>
            Read-only and free. It shows costs, not advice: overnight news can move any stock before the open. Prices from Chainlink and Robinhood, fills quoted onchain by Uniswap on Robinhood Chain, pools found with DexScreener.
          </p>
        </footer>
      </body>
    </html>
  );
}
