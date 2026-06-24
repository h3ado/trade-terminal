import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

// Mock IV term structure (DTE buckets) + IV rank gauges.
const termData = [
  { dte: "0",  iv: 16.2, hv: 14.1 },
  { dte: "1",  iv: 17.1, hv: 14.5 },
  { dte: "5",  iv: 18.4, hv: 15.2 },
  { dte: "14", iv: 19.1, hv: 15.8 },
  { dte: "30", iv: 19.8, hv: 16.4 },
  { dte: "60", iv: 20.6, hv: 17.0 },
  { dte: "90", iv: 21.3, hv: 17.6 },
  { dte: "180", iv: 22.4, hv: 18.1 },
  { dte: "365", iv: 23.6, hv: 18.7 },
];

interface Props { ticker?: string; redact?: boolean }

const Tooltip2 = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border p-2 shadow-lg font-mono text-[10px]">
      <p className="text-muted-foreground mb-1">DTE: {label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }}>{e.name}: {e.value.toFixed(1)}%</p>
      ))}
    </div>
  );
};

const Gauge = ({ label, value, max = 100, redact }: { label: string; value: number; max?: number; redact?: boolean }) => {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "hsl(var(--negative))" : pct >= 40 ? "hsl(40, 100%, 55%)" : "hsl(var(--positive))";
  return (
    <div className="border border-border bg-surface-elevated p-2">
      <div className="flex items-center justify-between text-[9px] font-mono uppercase text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums" style={{ color }}>{redact ? "••" : value.toFixed(1)}</span>
      </div>
      <div className="h-1 mt-1 bg-grid-line">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default function IVTermStructure({ ticker = "SPY", redact = false }: Props) {
  // Mock state metrics
  const ivRank = 42.5;
  const ivPercentile = 38.2;
  const realizedVol = 14.1;
  const ivPremium = ((19.8 - realizedVol) / realizedVol) * 100;
  const skew25d = 4.8;
  const contango = "Contango";

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">IV Term Structure — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Forward-curve IV vs realized · {contango}</p>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 border border-accent/40 text-accent uppercase">{contango}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <Gauge label="IV Rank" value={ivRank} redact={redact} />
        <Gauge label="IV %ile" value={ivPercentile} redact={redact} />
        <Gauge label="IV Prem" value={ivPremium} max={50} redact={redact} />
        <Gauge label="25Δ Skew" value={skew25d} max={15} redact={redact} />
      </div>

      <div className="h-56">
        <ExpandableResponsiveContainer width="100%" height="100%">
          <LineChart data={termData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--grid-line))" strokeDasharray="2 2" />
            <XAxis dataKey="dte" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9, fontFamily: "monospace" }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9, fontFamily: "monospace" }} domain={["auto", "auto"]} />
            <Tooltip content={<Tooltip2 />} />
            <ReferenceLine y={realizedVol} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "RV", fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
            <Line type="monotone" dataKey="iv" name="Implied" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="hv" name="Historical" stroke="hsl(var(--positive))" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono">
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Front Month IV</div>
          <div className="text-foreground tabular-nums font-bold">{redact ? "••" : "19.8%"}</div>
        </div>
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Back Month IV</div>
          <div className="text-foreground tabular-nums font-bold">{redact ? "••" : "23.6%"}</div>
        </div>
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Curve Slope</div>
          <div className="text-positive tabular-nums font-bold">{redact ? "••" : "+3.8 vol pts"}</div>
        </div>
      </div>
    </div>
  );
}
