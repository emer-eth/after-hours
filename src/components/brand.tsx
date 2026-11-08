/** The mark: an amber crescent on a split-flap tile, the flap's seam running through it. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="tile-top" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#24262d" />
          <stop offset="1" stopColor="#1b1d23" />
        </linearGradient>
        <linearGradient id="tile-bot" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#15161a" />
          <stop offset="1" stopColor="#101114" />
        </linearGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffb547" stopOpacity=".35" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tile">
          <rect width="32" height="32" rx="5" />
        </clipPath>
      </defs>
      <g clipPath="url(#tile)">
        <rect width="32" height="16" fill="url(#tile-top)" />
        <rect y="16" width="32" height="16" fill="url(#tile-bot)" />
        <circle cx="16" cy="16" r="12" fill="url(#moon-glow)" />
        <path d="M22.6 19.3A8.2 8.2 0 0 1 12.7 9.4a8.2 8.2 0 1 0 9.9 9.9Z" fill="#ffb547" />
        <rect y="15.5" width="32" height="1" fill="#09090b" opacity=".9" />
        <rect x=".5" y=".5" width="31" height="31" rx="4.5" fill="none" stroke="#ffffff14" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[16px] font-semibold tracking-[-0.02em] text-ink">After Hours</span>
      <span className="hidden border border-lamp/30 px-1.5 py-px font-mono text-[9px] tracking-[.16em] text-lamp uppercase sm:inline">Beta</span>
    </span>
  );
}
