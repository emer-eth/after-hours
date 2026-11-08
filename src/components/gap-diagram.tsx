// An illustration of one weekend: Wall Street's price stops at Friday's close, the token keeps trading in thin pools and
// wanders off, and the two meet again around Monday's open. The shaded space between them is what a trader pays.

const W = 720, H = 260;
// Token price path (y in px; 130 = last real price). Drifts below over the weekend, snaps back at the open.
const TOKEN = [
  [70, 130], [110, 134], [150, 141], [190, 138], [230, 152], [270, 160], [310, 156], [350, 170], [390, 165], [430, 176],
  [470, 168], [510, 172], [550, 158], [590, 140], [620, 128], [650, 118], [690, 122],
];
const path = TOKEN.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
const gap = `M70,130 ${TOKEN.map(([x, y]) => `L${x},${Math.max(130, y)}`).join(" ")} L620,130 Z`;

export function GapDiagram() {
  return (
    <figure className="panel reveal overflow-hidden p-4 sm:p-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Illustration: after Friday's close the token's onchain price drifts below the last real price over the weekend, then converges at Monday's open.">
        {/* Closed band */}
        <rect x="70" y="20" width="540" height="200" fill="#ffffff" opacity="0.025" />
        <text x="340" y="40" textAnchor="middle" fontSize="12" fill="var(--faint)" letterSpacing="2">WALL STREET CLOSED</text>
        <line x1="70" x2="70" y1="20" y2="220" stroke="var(--line)" />
        <line x1="610" x2="610" y1="20" y2="220" stroke="var(--line)" />
        <text x="70" y="240" textAnchor="middle" fontSize="12" fill="var(--soft)">Fri 4pm close</text>
        <text x="610" y="240" textAnchor="middle" fontSize="12" fill="var(--soft)">Mon 9:30 open</text>

        {/* What a trader pays */}
        <path d={gap} fill="var(--bad)" fillOpacity="0.16" className="fade-in" style={{ ["--d" as string]: "1.6s" }} />

        {/* Last real price: frozen */}
        <line x1="20" x2="700" y1="130" y2="130" stroke="var(--lamp)" strokeWidth="2" strokeDasharray="6 6" />
        <text x="24" y="120" fontSize="12" fill="var(--lamp)">Last real price (Chainlink)</text>

        {/* Token price: keeps trading */}
        <path d={path} fill="none" stroke="var(--cool)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="draw" style={{ ["--len" as string]: "900" }} />
        <circle cx="430" cy="176" r="5" fill="var(--cool)" className="pop" style={{ ["--d" as string]: "1.8s" }} />
        <text x="440" y="198" fontSize="12" fill="var(--cool)" className="fade-in" style={{ ["--d" as string]: "1.9s" }}>Token price onchain, thin pools</text>

        <g className="fade-in" style={{ ["--d" as string]: "2.2s" }}>
          <line x1="350" x2="350" y1="134" y2="166" stroke="var(--bad)" strokeWidth="1.5" />
          <text x="358" y="154" fontSize="12" fill="var(--bad)">what selling now costs</text>
        </g>
      </svg>
      <figcaption className="mt-2 text-xs text-faint">Illustration of a typical weekend. After Hours measures the real gap for your exact trade, live.</figcaption>
    </figure>
  );
}
