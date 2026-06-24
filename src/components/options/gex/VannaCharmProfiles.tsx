// Side-by-side Vanna & Charm profiles by strike.
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
import { fmtUsd } from "../shared/mockSeries";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Row { strike: number; vanna: number; charm: number }
interface Props { ticker: string; data: Row[]; spot: number; redact?: boolean }

function Panel({ title, dataKey, data, spot, formula, hint }: { title: string; dataKey: "vanna" | "charm"; data: Row[]; spot: number; formula: string; hint: string }) {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5"><span className="text-accent">ƒ</span> {formula} · {hint}</p>
        </div>
      </div>
      <ExpandableResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="strike" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}`} stroke="hsl(var(--border))" interval={1} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} stroke="hsl(var(--border))" />
          <Tooltip
            contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }}
            formatter={(v: number) => [fmtUsd(v), title.split(" ")[0]]}
            labelFormatter={(l) => `Strike $${l}`}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <ReferenceLine x={Math.round(spot / 2) * 2} stroke="hsl(var(--accent))" strokeDasharray="4 4" />
          <Bar dataKey={dataKey}>
            {data.map((d, i) => (
              <Cell key={i} fill={d[dataKey] >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ExpandableResponsiveContainer>
    </div>
  );
}

export default function VannaCharmProfiles({ data, spot, redact }: Props) {
  if (redact) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-terminal p-2 h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
        <div className="card-terminal p-2 h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Panel title="Vanna Profile" dataKey="vanna" data={data} spot={spot} formula="∂Δ/∂σ" hint="hedge demand per 1% IV" />
      <Panel title="Charm Profile" dataKey="charm" data={data} spot={spot} formula="∂Δ/∂t" hint="hedge demand per day of decay" />
    </div>
  );
}
