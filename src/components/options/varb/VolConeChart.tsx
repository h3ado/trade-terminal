// Volatility cone: IV vs realized vol percentiles across windows.
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getVolCone } from "../shared/mockVol";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker: string; redact?: boolean; }

export default function VolConeChart({ ticker, redact = false }: Props) {
  const data = getVolCone(ticker);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">VOL CONE</span>
        <span className="text-[9px] font-mono text-muted-foreground">IV vs realized vol percentiles · {ticker}</span>
      </div>
      <ExpandableResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis dataKey="window" tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "Days", fill: "hsl(var(--muted-foreground))", fontSize: 9, position: "insideBottom", offset: -2 }} />
          <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => redact ? "••" : `${v}`} />
          <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
          <Area type="monotone" dataKey="p90" stroke="none" fill="hsl(var(--accent) / 0.08)" />
          <Area type="monotone" dataKey="p10" stroke="none" fill="hsl(var(--surface-deep))" />
          <Area type="monotone" dataKey="p75" stroke="none" fill="hsl(var(--accent) / 0.12)" />
          <Area type="monotone" dataKey="p25" stroke="none" fill="hsl(var(--surface-deep))" />
          <Line type="monotone" dataKey="p50" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="iv" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ExpandableResponsiveContainer>
      <div className="flex gap-3 text-[9px] font-mono text-muted-foreground mt-1">
        <span><span className="inline-block w-2 h-2 bg-accent mr-1" />IV</span>
        <span><span className="inline-block w-2 h-2 bg-muted-foreground mr-1" />Realized median</span>
        <span>Shaded: 10-90 percentile cone</span>
      </div>
    </div>
  );
}
