// PAY sub-panel: Greeks (Δ Γ Vega) profile across spot.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface Props { ticker?: string; redact?: boolean }

export default function GreeksVsSpot({ ticker = "SPY", redact = false }: Props) {
  const spot = 582, strike = 585;
  const data = Array.from({ length: 41 }, (_, i) => {
    const s = spot * 0.9 + (spot * 0.2 * i) / 40;
    const m = (s - strike) / strike;
    const delta = 0.5 + Math.tanh(m * 8) * 0.5;
    const gamma = Math.exp(-m * m * 60) * 0.045;
    const vega  = Math.exp(-m * m * 30) * 0.18;
    return { s: Math.round(s * 10) / 10, delta: +delta.toFixed(3), gamma: +(gamma * 10).toFixed(3), vega: +vega.toFixed(3) };
  });

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · Greeks vs Spot</h3>
        <div className="text-[9px] font-mono text-muted-foreground">585C · γ scaled ×10</div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="s" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace" }} />
            <ReferenceLine x={spot} stroke="hsl(var(--accent))" strokeDasharray="2 2" />
            <Line type="monotone" dataKey="delta" stroke="hsl(var(--accent))" strokeWidth={1.6} dot={false} name="Δ" />
            <Line type="monotone" dataKey="gamma" stroke="#60a5fa" strokeWidth={1.4} dot={false} name="Γ×10" />
            <Line type="monotone" dataKey="vega"  stroke="#a78bfa" strokeWidth={1.4} dot={false} name="Vega" />
          </LineChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
