// Intraday GEX time-series with secondary zero-Γ migration axis.
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { GexIntradayPoint, fmtUsd } from "../shared/mockSeries";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker: string; data: GexIntradayPoint[]; spot: number; redact?: boolean }

const T = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const m = Object.fromEntries(payload.map((p: any) => [p.dataKey, p.value]));
  return (
    <div className="bg-surface-deep border border-border p-2 font-mono text-[10px] shadow-lg">
      <div className="text-accent font-bold mb-1">{label}</div>
      <div>Net <span className={m.net >= 0 ? "text-up" : "text-down"}>{fmtUsd(m.net)}</span></div>
      <div>Call <span className="text-up">{fmtUsd(m.call)}</span></div>
      <div>Put <span className="text-down">{fmtUsd(m.put)}</span></div>
      <div className="text-accent mt-1">Zero-Γ ${m.zeroG?.toFixed(2)}</div>
    </div>
  );
};

export default function GexIntradayEvolution({ ticker, data, spot, redact }: Props) {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Intraday GEX Evolution — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Net / Call / Put GEX + zero-Γ migration</p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ background: "hsl(var(--positive))" }} />Call</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ background: "hsl(var(--negative))" }} />Put</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ background: "hsl(var(--accent))" }} />Net</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px border-t border-dashed border-accent" />Zero-Γ</span>
        </div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 40, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" interval={11} />
            <YAxis yAxisId="gex" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} stroke="hsl(var(--border))" />
            <YAxis yAxisId="zg" orientation="right" domain={[spot - 8, spot + 8]} tick={{ fontSize: 9, fill: "hsl(var(--accent))", fontFamily: "monospace" }} tickFormatter={(v) => `$${v.toFixed(0)}`} stroke="hsl(var(--accent))" />
            <Tooltip content={<T />} />
            <ReferenceLine yAxisId="gex" y={0} stroke="hsl(var(--border))" />
            <ReferenceLine yAxisId="zg" y={spot} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" />
            <Area yAxisId="gex" type="monotone" dataKey="call" stroke="hsl(var(--positive))" fill="hsl(var(--positive) / 0.25)" strokeWidth={1} />
            <Area yAxisId="gex" type="monotone" dataKey="put" stroke="hsl(var(--negative))" fill="hsl(var(--negative) / 0.25)" strokeWidth={1} />
            <Line yAxisId="gex" type="monotone" dataKey="net" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} />
            <Line yAxisId="zg" type="monotone" dataKey="zeroG" stroke="hsl(var(--accent))" strokeWidth={1} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
