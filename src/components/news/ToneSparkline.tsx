import {
  Area,
  AreaChart,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import type { ToneTick } from '@/hooks/useGdeltNews';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props {
  data: ToneTick[];
  height?: number;
}

export default function ToneSparkline({ data, height = 80 }: Props) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-[10px] font-mono text-muted-foreground" style={{ height }}>
        No tone series available.
      </div>
    );
  }
  return (
    <ExpandableResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="toneFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(140, 70%, 50%)" stopOpacity={0.6} />
            <stop offset="50%" stopColor="hsl(45, 100%, 55%)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <XAxis dataKey="t" hide />
        <YAxis hide domain={[-10, 10]} />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          }}
          formatter={(v: number) => [v.toFixed(2), 'tone']}
        />
        <Area type="monotone" dataKey="tone" stroke="hsl(var(--accent))" strokeWidth={1.2} fill="url(#toneFill)" />
      </AreaChart>
    </ExpandableResponsiveContainer>
  );
}
