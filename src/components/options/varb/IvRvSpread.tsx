// Rolling IV vs RV spread with z-score badge.
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { getIvRvSeries } from "../shared/mockVol";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker: string; redact?: boolean; }

export default function IvRvSpread({ ticker, redact = false }: Props) {
  const data = useMemo(() => getIvRvSeries(ticker, 90), [ticker]);
  const spreads = data.map(d => d.spread);
  const mean = spreads.reduce((s, x) => s + x, 0) / spreads.length;
  const sd = Math.sqrt(spreads.reduce((s, x) => s + (x - mean) ** 2, 0) / spreads.length) || 1;
  const last = data[data.length - 1];
  const z = (last.spread - mean) / sd;

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">IV / RV SPREAD</span>
        <span className="text-[9px] font-mono text-muted-foreground">{ticker} · 90d</span>
        <div className="ml-auto flex gap-3 text-[10px] font-mono">
          <span><span className="text-muted-foreground">IV </span><span className="text-accent font-bold">{redact ? "••" : last.iv.toFixed(1)}</span></span>
          <span><span className="text-muted-foreground">RV </span><span className="text-foreground font-bold">{redact ? "••" : last.rv.toFixed(1)}</span></span>
          <span><span className="text-muted-foreground">Spread </span><span className={`font-bold ${last.spread >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (last.spread >= 0 ? "+" : "") + last.spread.toFixed(1)}</span></span>
          <span className={`px-1.5 border ${Math.abs(z) > 1.5 ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>z {z.toFixed(2)}</span>
        </div>
      </div>
      <ExpandableResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => redact ? "••" : v} />
          <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 3" />
          <Line type="monotone" dataKey="iv" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="rv" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="spread" stroke="hsl(var(--up))" strokeWidth={2} dot={false} />
        </LineChart>
      </ExpandableResponsiveContainer>
    </div>
  );
}
