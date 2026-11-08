/**
 * A paragraph whose words light up one after another as it scrolls through the viewport (CSS scroll-driven
 * animation on a named view timeline). Browsers without support just show the text.
 */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <p className={`scroll-words ${className}`}>
      {words.map((w, i) => (
        <span key={i} className="sw" style={{ ["--a" as string]: `${10 + (i / words.length) * 45}%`, ["--b" as string]: `${14 + (i / words.length) * 45}%` }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
