// REAL — Real Rates & Inflation Breakevens. TIPS yields, breakeven curve, 5y5y forward.
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

const realYields = [
  { tenor: '2Y',  US: 1.62, DE: 0.42, UK: 0.88, JP: -0.18 },
  { tenor: '5Y',  US: 1.74, DE: 0.31, UK: 0.74, JP: -0.32 },
  { tenor: '10Y', US: 1.82, DE: 0.22, UK: 0.66, JP: -0.41 },
  { tenor: '30Y', US: 2.06, DE: 0.38, UK: 0.78, JP: -0.22 },
];

const breakevens = [
  { tenor: '2Y',  current: 2.42, w1: 2.48, m1: 2.36, y1: 2.18 },
  { tenor: '5Y',  current: 2.28, w1: 2.32, m1: 2.24, y1: 2.31 },
  { tenor: '10Y', current: 2.30, w1: 2.34, m1: 2.28, y1: 2.36 },
  { tenor: '30Y', current: 2.34, w1: 2.38, m1: 2.31, y1: 2.41 },
];

const fwd5y5y = [
  { m: 'Oct', val: 2.18 }, { m: 'Nov', val: 2.22 }, { m: 'Dec', val: 2.26 },
  { m: 'Jan', val: 2.31 }, { m: 'Feb', val: 2.34 }, { m: 'Mar', val: 2.36 },
  { m: 'Apr', val: 2.32 }, { m: 'May', val: 2.28 }, { m: 'Jun', val: 2.31 },
];

const tipsHist = Array.from({ length: 24 }, (_, i) => ({
  m: `M${i + 1}`,
  real10y: +(1.4 + Math.sin(i / 3) * 0.4 + i * 0.02).toFixed(2),
  nom10y:  +(3.8 + Math.sin(i / 3) * 0.35 + i * 0.015).toFixed(2),
}));

export default function RealRatesMonitor() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="US 10Y REAL" value="1.82%" delta="+4bp" up />
        <Stat label="10Y BREAKEVEN" value="2.30%" delta="-4bp" />
        <Stat label="5Y5Y FWD INF" value="2.31%" delta="+3bp" up />
        <Stat label="TIPS-NOM SPRD" value="-198bp" delta="flat" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Real Yield Curve (TIPS / linkers, %)</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={realYields}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="US" stroke="hsl(var(--accent))" strokeWidth={2} />
              <Line type="monotone" dataKey="DE" stroke="hsl(var(--positive))" strokeWidth={1.5} />
              <Line type="monotone" dataKey="UK" stroke="hsl(var(--negative))" strokeWidth={1.5} />
              <Line type="monotone" dataKey="JP" stroke="#8b5cf6" strokeWidth={1.5} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">US 10Y: Real vs Nominal (24m)</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={tipsHist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="nom10y" stroke="hsl(var(--accent))" strokeWidth={2} name="Nominal" />
              <Line type="monotone" dataKey="real10y" stroke="hsl(var(--positive))" strokeWidth={2} name="Real (TIPS)" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">5y5y Forward Inflation (market-implied long-run, %)</div>
        <ExpandableResponsiveContainer width="100%" height={160}>
          <LineChart data={fwd5y5y}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="m" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis domain={[2.0, 2.5]} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <ReferenceLine y={2.0} stroke="hsl(var(--positive))" strokeDasharray="3 3" label={{ value: 'Fed 2%', fill: 'hsl(var(--positive))', fontSize: 9 }} />
            <Line type="monotone" dataKey="val" stroke="hsl(var(--accent))" strokeWidth={2} />
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">US Breakevens — Market Inflation Expectations</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">TENOR</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1W AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1M AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">Δ vs FED 2%</th>
            </tr>
          </thead>
          <tbody>
            {breakevens.map((b, i) => (
              <tr key={b.tenor} className={`border-b border-grid-line last:border-0 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground font-bold">{b.tenor}</td>
                <td className="px-2 py-1 text-right font-bold text-foreground">{b.current.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{b.w1.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{b.m1.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{b.y1.toFixed(2)}%</td>
                <td className={`px-2 py-1 text-right font-bold ${b.current - 2 > 0.3 ? 'text-negative' : 'text-accent'}`}>
                  +{(b.current - 2).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="border border-border p-2 bg-surface-primary">
      <div className="text-[8px] font-mono text-muted-foreground uppercase">{label}</div>
      <div className="text-xl font-mono font-bold text-foreground">{value}</div>
      <div className={`text-[9px] font-mono ${up ? 'text-positive' : delta === 'flat' ? 'text-muted-foreground' : 'text-negative'}`}>{delta}</div>
    </div>
  );
}
