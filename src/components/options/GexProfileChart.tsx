// GEX profile by strike — signed bars (positive green / negative red) + gamma flip line.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

const data = Array.from({ length: 15 }).map((_, i) => {
  const strike = 419 + i * 2;
  const seed = Math.sin(i * 1.7) * 30 + Math.cos(i * 0.9) * 12;
  return { strike: `$${strike}`, gex: Math.round(seed * 1.2) };
});

interface Props { ticker?: string; redact?: boolean; flip?: number }

export default function GexProfileChart({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">GEX Profile — {ticker}</h3>
        <div className="text-[10px] font-mono text-muted-foreground">
          Net GEX <span className="text-up font-bold">232.0M</span> · Flip <span className="text-accent font-bold">$434</span>
        </div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="strike" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}M`} stroke="hsl(var(--border))" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }}
              formatter={(v: number) => [`${v}M`, "GEX"]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="gex" radius={0}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.gex >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"} />
              ))}
            </Bar>
          </BarChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
