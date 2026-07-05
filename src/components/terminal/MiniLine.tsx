// Tiny deterministic SVG sparkline for table rows. No network calls, no deps.
// Uses a seeded hash so the same ticker always renders the same shape.
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
function seeded(s: string, lo: number, hi: number) {
  return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo);
}

interface Props {
  seed: string;
  trend?: number; // positive = trending up, negative = down, 0 = flat
  width?: number;
  height?: number;
}

export function MiniLine({ seed, trend = 0, width = 48, height = 10 }: Props) {
  const N = 8;
  const pts: number[] = [];
  let base = 50;
  for (let i = 0; i < N - 1; i++) {
    base = Math.max(10, Math.min(90, base + seeded(`${seed}-${i}`, -6, 6)));
    pts.push(base);
  }
  // Last point direction driven by actual trend
  const last = trend > 0
    ? Math.min(95, base + seeded(`${seed}-e`, 4, 10))
    : trend < 0
    ? Math.max(5,  base - seeded(`${seed}-e`, 4, 10))
    : base + seeded(`${seed}-e`, -2, 2);
  pts.push(last);

  const lo    = Math.min(...pts);
  const hi    = Math.max(...pts);
  const range = Math.max(hi - lo, 1);
  const pad   = height * 0.1;

  const toX = (i: number) => (i / (N - 1)) * width;
  const toY = (v: number) => height - pad - ((v - lo) / range) * (height - 2 * pad);

  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const color = trend > 0
    ? 'hsl(var(--positive))'
    : trend < 0
    ? 'hsl(var(--negative))'
    : 'hsl(var(--muted-foreground))';

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
