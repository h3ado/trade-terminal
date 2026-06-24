// Tiny inline-SVG sparkline used by multiple tools widgets. Zero deps.
interface Props {
  values: number[];
  width?: number;
  height?: number;
  tone?: 'pos' | 'neg' | 'accent' | 'muted' | 'auto';
  className?: string;
}

const toneStroke: Record<Exclude<Props['tone'], undefined | 'auto'>, string> = {
  pos: 'hsl(var(--positive))',
  neg: 'hsl(var(--negative))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
};

export default function Sparkline({ values, width = 40, height = 12, tone = 'auto', className }: Props) {
  if (!values || values.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ');
  const effTone = tone === 'auto' ? (values[values.length - 1] >= values[0] ? 'pos' : 'neg') : tone;
  return (
    <svg width={width} height={height} className={className} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={toneStroke[effTone]}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
