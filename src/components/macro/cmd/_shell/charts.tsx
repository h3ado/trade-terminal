// Tiny SVG primitives used inline in dense tables. Kept dependency-free so
// thousands can render without recharts overhead. For drawer/overview panels
// switch to recharts which is already in the project.

interface SparkProps { data: number[]; w?: number; h?: number; stroke?: string; fill?: string; }
export function Sparkline({ data, w = 80, h = 18, stroke = 'currentColor', fill }: SparkProps) {
  if (!data.length) return <svg width={w} height={h} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`);
  const path = `M${pts.join(' L')}`;
  const area = fill ? `${path} L${w},${h} L0,${h} Z` : null;
  return (
    <svg width={w} height={h} className="block">
      {area && <path d={area} fill={fill} opacity={0.25} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.2} />
    </svg>
  );
}

interface BarsProps { data: number[]; w?: number; h?: number; positiveClass?: string; negativeClass?: string; }
export function MiniBars({ data, w = 80, h = 18, positiveClass = 'fill-positive', negativeClass = 'fill-negative' }: BarsProps) {
  if (!data.length) return <svg width={w} height={h} />;
  const max = Math.max(...data.map(v => Math.abs(v))) || 1;
  const bw = w / data.length;
  const mid = h / 2;
  return (
    <svg width={w} height={h} className="block">
      {data.map((v, i) => {
        const bh = (Math.abs(v) / max) * (h / 2);
        const y = v >= 0 ? mid - bh : mid;
        return <rect key={i} x={i * bw} y={y} width={Math.max(1, bw - 1)} height={Math.max(1, bh)} className={v >= 0 ? positiveClass : negativeClass} />;
      })}
    </svg>
  );
}

interface HistProps { data: number[]; bins?: number; w?: number; h?: number; markValue?: number; }
export function Histogram({ data, bins = 10, w = 120, h = 32, markValue }: HistProps) {
  if (!data.length) return <svg width={w} height={h} />;
  const min = Math.min(...data), max = Math.max(...data), range = (max - min) || 1;
  const counts = new Array(bins).fill(0);
  for (const v of data) {
    const b = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
    counts[b]++;
  }
  const maxC = Math.max(...counts) || 1;
  const bw = w / bins;
  return (
    <svg width={w} height={h} className="block">
      {counts.map((c, i) => {
        const bh = (c / maxC) * h;
        return <rect key={i} x={i * bw} y={h - bh} width={Math.max(1, bw - 1)} height={bh} className="fill-accent/70" />;
      })}
      {markValue != null && (
        <line
          x1={((markValue - min) / range) * w}
          x2={((markValue - min) / range) * w}
          y1={0} y2={h}
          className="stroke-negative" strokeWidth={1.5} strokeDasharray="2,2"
        />
      )}
    </svg>
  );
}

interface SurpProps { value: number | null; w?: number; h?: number; max?: number; }
/** -100 to +100 % surprise bar centered on zero. */
export function SurpriseBar({ value, w = 60, h = 8, max = 50 }: SurpProps) {
  if (value == null) return <span className="text-muted-foreground/60 text-[9px]">—</span>;
  const clip = Math.max(-max, Math.min(max, value));
  const pct = clip / max;
  const mid = w / 2;
  const bw = Math.abs(pct) * mid;
  const x = pct >= 0 ? mid : mid - bw;
  return (
    <svg width={w} height={h} className="block">
      <rect x={0} y={h / 2 - 0.5} width={w} height={1} className="fill-border" />
      <rect x={x} y={1} width={Math.max(1, bw)} height={h - 2} className={pct >= 0 ? 'fill-positive' : 'fill-negative'} />
      <rect x={mid - 0.5} y={0} width={1} height={h} className="fill-muted-foreground/50" />
    </svg>
  );
}

interface HeatProps { value: number | null; min: number; max: number; w?: number; h?: number; label?: string; invert?: boolean; }
/** 0..1 mapped to red→neutral→green. Set invert for "lower is better" metrics. */
export function Heatcell({ value, min, max, w = 40, h = 16, label, invert }: HeatProps) {
  if (value == null) return <span className="text-muted-foreground/60 text-[10px]">—</span>;
  const t = Math.max(0, Math.min(1, (value - min) / ((max - min) || 1)));
  const score = invert ? 1 - t : t;
  // Red (#7f1d1d at 0) → neutral (#0a0a0a at 0.5) → green (#14532d at 1)
  const r = score < 0.5 ? 127 - (score / 0.5) * 117 : 10;
  const g = score > 0.5 ? ((score - 0.5) / 0.5) * 83 : 10;
  const b = 10;
  return (
    <div style={{ width: w, height: h, backgroundColor: `rgb(${r},${g},${b})` }} className="flex items-center justify-center text-[10px] font-mono tabular-nums text-foreground">
      {label ?? value.toFixed(2)}
    </div>
  );
}
