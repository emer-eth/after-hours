// The night around the hero: twinkling stars and a glowing moon behind it, and a dark financial-district skyline with a few
// late windows as a full-width strip below it. Deterministic (seeded) so server and browser render the same thing.

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const r = rand(42);
const STARS = Array.from({ length: 80 }, () => ({ x: r() * 100, y: r() * 100, s: r() < 0.85 ? 1 : 2, t: 3 + r() * 5, d: r() * 6 }));

const BUILDINGS = [
  [0, 70, 120], [64, 54, 165], [112, 80, 110], [186, 46, 190], [226, 90, 140], [310, 60, 205], [364, 74, 128], [432, 50, 172],
  [476, 96, 150], [566, 58, 214], [618, 84, 132], [696, 52, 182], [742, 92, 118], [828, 64, 196], [886, 78, 140], [958, 48, 170],
  [1000, 88, 124], [1082, 60, 188], [1136, 64, 146],
] as const;

/** Stars and moon, behind the hero. */
export function Sky() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(80rem_40rem_at_70%_-10%,#1b2340_0%,transparent_60%)]" />
      {STARS.map((s, i) => (
        <span key={i} className="star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, ["--t" as string]: `${s.t}s`, ["--d" as string]: `${s.d}s` }} />
      ))}
      <div className="absolute top-24 right-[6%] sm:right-[10%]">
        <div className="moon-glow absolute -inset-16 rounded-full bg-[radial-gradient(circle,#f5b54433_0%,transparent_65%)]" />
        <svg viewBox="0 0 100 100" className="relative size-16 sm:size-20">
          <defs>
            <radialGradient id="moon" cx="40%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#fff6dc" />
              <stop offset="60%" stopColor="#f4dc9c" />
              <stop offset="100%" stopColor="#d9b764" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="url(#moon)" />
          <circle cx="36" cy="40" r="6" fill="#d9b764" opacity=".35" />
          <circle cx="60" cy="62" r="9" fill="#d9b764" opacity=".28" />
          <circle cx="62" cy="34" r="4" fill="#d9b764" opacity=".3" />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />
    </div>
  );
}

/** Wall Street at night: a full-width skyline strip, mostly dark, a few windows still lit. */
export function Skyline() {
  const rw = rand(7);
  return (
    <div aria-hidden className="pointer-events-none relative left-1/2 -mt-6 h-[170px] w-screen -translate-x-1/2 overflow-hidden sm:h-[200px]">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="bld" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#151b2e" />
            <stop offset="100%" stopColor="#0a0d16" />
          </linearGradient>
        </defs>
        {BUILDINGS.map(([x, w, h], i) => {
          const windows = [];
          for (let wy = 220 - h + 14; wy < 206; wy += 16)
            for (let wx = x + 9; wx < x + w - 10; wx += 13) {
              const v = rw();
              if (v < 0.035) windows.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width="5" height="7" fill="#f5b544" className="lit" style={{ ["--d" as string]: `${(v * 300) % 7}s` }} />);
              else if (v < 0.2) windows.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width="5" height="7" fill="#1d2540" />);
            }
          return (
            <g key={i}>
              <rect x={x} y={220 - h} width={w} height={h} fill="url(#bld)" />
              {windows}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-night to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-night to-transparent" />
    </div>
  );
}
