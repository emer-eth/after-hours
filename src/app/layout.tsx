import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionPill } from "@/components/session-pill";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { LogoMark, Wordmark } from "@/components/brand";
import { NavLinks } from "@/components/nav-links";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700"] });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { siteName: "After Hours", images: ["/api/og"] },
  twitter: { card: "summary_large_image", images: ["/api/og"] },
  title: { default: "After Hours: check a tokenized stock trade before you make it", template: "%s · After Hours" },
  description:
    "Wall Street is closed, but tokenized stocks, ETFs and commodity funds on Robinhood Chain still trade. After Hours shows what your trade really costs against the last real price, and tells you whether to trade now, set a limit, or wait for the open.",
};

export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-night/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Link href="/" aria-label="After Hours, home">
              <Wordmark />
            </Link>
            <NavLinks />
            <div className="flex items-center gap-2">
              <span className="hidden lg:block"><SessionPill /></span>
              <Link href="/#check" className="group flex items-center border border-line-2 text-[12px] font-medium tracking-[.14em] text-ink uppercase transition-colors hover:border-lamp/60">
                <span className="grid size-9 place-items-center bg-ink text-night transition-colors group-hover:bg-lamp">→</span>
                <span className="px-3.5 font-mono">Check a trade</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 text-sm sm:grid-cols-[1.6fr_1fr_1fr] sm:px-6">
            <div>
              <p className="flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-ink">
                <LogoMark size={28} /> After Hours
              </p>
              <p className="mt-4 max-w-sm leading-relaxed text-faint">Check a stock-token trade before you make it. It shows costs, not advice: overnight news can move any stock before the open. Stock tokens aren&apos;t offered to US persons.</p>
            </div>
            <div>
              <p className="label">Data</p>
              <ul className="mt-4 grid gap-2.5 text-faint">
                <li>Prices · Chainlink, Robinhood</li>
                <li>Routes · KyberSwap, Uniswap</li>
                <li>Pools · DexScreener</li>
              </ul>
            </div>
            <div>
              <p className="label">Product</p>
              <ul className="mt-4 grid gap-2.5 text-faint">
                <li><Link href="/#how" className="hover:text-soft">How it works</Link></li>
                <li><Link href="/#board" className="hover:text-soft">Tonight&apos;s board</Link></li>
                <li><Link href="/#faq" className="hover:text-soft">FAQ</Link></li>
                <li><a href="https://github.com/emer-eth/after-hours" target="_blank" rel="noreferrer" className="hover:text-soft">Source on GitHub ↗</a></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-6xl justify-between border-t border-line px-4 py-5 font-mono text-[11px] tracking-[.14em] text-faint uppercase sm:px-6">
            <span>Robinhood Chain · 4663</span>
            <a href="https://github.com/emer-eth/after-hours" target="_blank" rel="noreferrer" className="transition-colors hover:text-soft">Open source · Built with Claude Code</a>
          </div>
        </footer>
        <SmoothScroll />
        <Analytics />
      </body>
    </html>
  );
}
