import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SessionPill } from "@/components/session-pill";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
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

function Mark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a8.5 8.5 0 1 0 10.9 10.9Z" />
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-night/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-display text-[15px] font-semibold tracking-tight">
              <span className="grid size-7 place-items-center border border-lamp/30 bg-lamp-soft text-lamp">
                <Mark className="size-3.5" />
              </span>
              After Hours
            </Link>
            <nav className="hidden items-center gap-7 text-[13.5px] text-soft md:flex" aria-label="Sections">
              <Link href="/#problem" className="transition-colors hover:text-ink">Why</Link>
              <Link href="/#how" className="transition-colors hover:text-ink">How it works</Link>
              <Link href="/#board" className="transition-colors hover:text-ink">Board</Link>
              <Link href="/#api" className="transition-colors hover:text-ink">API</Link>
              <Link href="/#faq" className="transition-colors hover:text-ink">FAQ</Link>
            </nav>
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
              <p className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
                <Mark className="size-4 text-lamp" /> After Hours
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
              </ul>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-6xl justify-between border-t border-line px-4 py-5 font-mono text-[11px] tracking-[.14em] text-faint uppercase sm:px-6">
            <span>Robinhood Chain · 4663</span>
            <span>Built with Claude Code</span>
          </div>
        </footer>
        <SmoothScroll />
        <Analytics />
      </body>
    </html>
  );
}
