// Generic profile-by-strike chart for Vanna / Charm with crosshair tooltip.
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
import { seeded, fmtUsd } from "./shared/mockSeries";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker?: string; redact?: boolean; metric: "vanna" | "charm" }

const META = {
  vanna: { name: "Vanna Profile", color1: "hsl(280 70% 55%)", color2: "hsl(280 70% 35%)", scale: 1e7, unit: "$/σ" },
  charm: { name: "Charm Profile", color1: "hsl(180 70% 50%)", color2: "hsl(180 70% 30%)", scale: 1e6, unit: "$/day" },
};

export default function GreekProfileChart({ ticker = "SPY", redact = false, metric }: Props) {
  const rnd = seeded(ticker, metric);
  const m = META[metric];
  const data = Array.from({ length: 17 }).map((_, i) => {
    const strike = 470 + i * 1.5;
    const v = Math.round(Math.sin(i * 0.6 + rnd() * 2) * m.scale * (0.5 + rnd()));
    const oi = Math.round(8_000 + rnd() * 60_000);
    return { strike: `$${strike}`, v, oi };
  });
  const total = data.reduce((s, d) => s + d.v, 0);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{m.name} — {ticker}</h3>
        <div className="text-[10px] font-mono text-muted-foreground">
          Net <span className={`font-bold ${total >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : fmtUsd(total)}</span>
          <span className="ml-2 text-muted-foreground">({m.unit})</span>
        </div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="strike" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => fmtUsd(v)} stroke="hsl(var(--border))" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }}
              formatter={(v: number, _n, p) => [`${fmtUsd(v)} · OI ${(p.payload as { oi: number }).oi.toLocaleString()}`, metric.toUpperCase()]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="v" radius={0}>
              {data.map((d, i) => <Cell key={i} fill={d.v >= 0 ? m.color1 : m.color2} />)}
            </Bar>
          </BarChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
