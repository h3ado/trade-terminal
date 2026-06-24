// NRGY — Energy Balance: weekly inventories vs 5y band, SPR, production, refinery util, nat-gas.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';

const crudeInv = Array.from({ length: 52 }, (_, i) => {
  const base = 420 + Math.sin(i / 6) * 28;
  return {
    wk: `W${i + 1}`,
    actual: +(base + (i > 40 ? -8 : 0)).toFixed(0),
    low5y:  +(base - 38).toFixed(0),
    high5y: +(base + 32).toFixed(0),
    avg5y:  +base.toFixed(0),
  };
});

const natgasStorage = Array.from({ length: 52 }, (_, i) => {
  const seasonal = Math.cos((i - 12) / 8) * 1100 + 2300;
  return {
    wk: `W${i + 1}`,
    actual: +(seasonal + (i > 30 ? 80 : -40)).toFixed(0),
    low5y:  +(seasonal - 350).toFixed(0),
    high5y: +(seasonal + 340).toFixed(0),
    avg5y:  +seasonal.toFixed(0),
  };
});

const production = [
  { src: 'US Crude (mbd)',     curr: 13.42, prev: 13.36, y1: 12.81, peak: 13.50 },
  { src: 'OPEC+ Quota (mbd)',  curr: 40.42, prev: 40.42, y1: 41.86, peak: 43.85 },
  { src: 'OPEC Actual (mbd)',  curr: 26.84, prev: 26.92, y1: 27.45, peak: 32.10 },
  { src: 'Saudi Arabia (mbd)', curr:  9.00, prev:  9.00, y1:  9.96, peak: 10.62 },
  { src: 'Russia (mbd)',       curr:  9.21, prev:  9.18, y1:  9.45, peak: 10.81 },
  { src: 'US Rig Count',       curr:  582,  prev:  579,  y1:  748,  peak: 1609 },
  { src: 'Refinery Util %',    curr: 91.4,  prev: 89.8,  y1: 88.6,  peak: 96.4 },
  { src: 'SPR (mmbbl)',        curr:  398,  prev:  395,  y1:  362,  peak:  727 },
];

export default function EnergyBalance() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-5 gap-2">
        <Stat label="WTI" value="$74.82" delta="-1.2%" />
        <Stat label="BRENT" value="$78.94" delta="-0.9%" />
        <Stat label="NATGAS" value="$2.84" delta="+4.1%" up />
        <Stat label="CRACK 3-2-1" value="$28.42" delta="+$1.40" up />
        <Stat label="SPR FILL" value="398M bbl" delta="+3.0M w/w" up />
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">US Crude Inventories vs 5y Band (mmbbl)</div>
        <ExpandableResponsiveContainer width="100%" height={220}>
          <AreaChart data={crudeInv}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="wk" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} interval={4} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <Area type="monotone" dataKey="high5y" stackId="b" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.0} />
            <Area type="monotone" dataKey="low5y"  stackId="b" stroke="none" fill="hsl(var(--background))" fillOpacity={0} />
            <Line type="monotone" dataKey="high5y" stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" dot={false} />
            <Line type="monotone" dataKey="low5y"  stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" dot={false} />
            <Line type="monotone" dataKey="avg5y"  stroke="hsl(var(--positive))" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--accent))"   strokeWidth={2}   dot={false} />
          </AreaChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">US Nat-Gas Storage vs 5y Band (Bcf)</div>
        <ExpandableResponsiveContainer width="100%" height={200}>
          <LineChart data={natgasStorage}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="wk" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} interval={4} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <Line type="monotone" dataKey="high5y" stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" dot={false} />
            <Line type="monotone" dataKey="low5y"  stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" dot={false} />
            <Line type="monotone" dataKey="avg5y"  stroke="hsl(var(--positive))" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--accent))"   strokeWidth={2}   dot={false} />
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Supply Indicators</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">METRIC</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREV WK</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CYCLE PEAK</th>
              <th className="text-right px-2 py-1 text-muted-foreground">Δ Y/Y</th>
            </tr>
          </thead>
          <tbody>
            {production.map((p, i) => {
              const dyy = ((p.curr - p.y1) / p.y1) * 100;
              return (
                <tr key={p.src} className={`border-b border-grid-line last:border-0 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground">{p.src}</td>
                  <td className="px-2 py-1 text-right font-bold text-foreground">{p.curr.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{p.prev.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{p.y1.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right text-negative">{p.peak.toLocaleString()}</td>
                  <td className={`px-2 py-1 text-right font-bold ${dyy >= 0 ? 'text-positive' : 'text-negative'}`}>{dyy > 0 ? '+' : ''}{dyy.toFixed(1)}%</td>
                </tr>
              );
            })}
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
      <div className={`text-[9px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>{delta}</div>
    </div>
  );
}
