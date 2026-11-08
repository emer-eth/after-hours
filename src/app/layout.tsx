import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionPill } from "@/components/session-pill";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { siteName: "After Hours", images: ["/api/og"] },
  twitter: { card: "summary_large_image", images: ["/api/og"] },
  title: { default: "After Hours: check a tokenized stock trade before you make it", template: "%s · After Hours" },
  description:
    "Wall Street is closed, but tokenized stocks, ETFs and commodity funds on Robinhood Chain still trade. After Hours shows what your trade really costs against the last real price, and tells you whether to trade now, set a limit, or wait for the open.",
};

export const viewport: Viewport = { themeColor: "#0a0d16" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-transparent bg-night/60 backdrop-blur-md supports-[backdrop-filter]:bg-night/40">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
              <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-lamp-soft text-lamp">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a8.5 8.5 0 1 0 10.9 10.9Z" /></svg>
              </span>
              After Hours
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-soft md:flex" aria-label="Sections">
              <Link href="/#how" className="hover:text-ink">How it works</Link>
              <Link href="/#board" className="hover:text-ink">Board</Link>
              <Link href="/#faq" className="hover:text-ink">FAQ</Link>
            </nav>
            <SessionPill />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
            <div>
              <p className="flex items-center gap-2 font-medium text-ink">
                <svg viewBox="0 0 24 24" className="size-4 text-lamp" fill="currentColor" aria-hidden><path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a8.5 8.5 0 1 0 10.9 10.9Z" /></svg>
                After Hours
              </p>
              <p className="mt-3 max-w-sm text-faint">It shows costs, not advice: overnight news can move any stock before the open. Stock tokens aren&apos;t offered to US persons.</p>
            </div>
            <div>
              <p className="font-medium text-soft">Data</p>
              <ul className="mt-3 grid gap-2 text-faint">
                <li>Prices: Chainlink, Robinhood</li>
                <li>Routes: KyberSwap, Uniswap</li>
                <li>Pools: DexScreener</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-soft">Product</p>
              <ul className="mt-3 grid gap-2 text-faint">
                <li><Link href="/#how" className="hover:text-soft">How it works</Link></li>
                <li><Link href="/#board" className="hover:text-soft">Tonight&apos;s board</Link></li>
                <li><Link href="/#faq" className="hover:text-soft">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
