// CONS — Consumer Health: income, savings, credit, delinquencies, confidence.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const confidence = [
  { m: 'Jul', umich:  66.4, conf: 105.6 }, { m: 'Aug', umich: 69.5, conf: 108.7 },
  { m: 'Sep', umich:  68.1, conf: 104.3 }, { m: 'Oct', umich: 63.8, conf: 99.1 },
  { m: 'Nov', umich:  61.3, conf: 102.0 }, { m: 'Dec', umich: 69.7, conf: 110.7 },
  { m: 'Jan', umich:  79.0, conf: 114.8 }, { m: 'Feb', umich: 76.9, conf: 104.8 },
  { m: 'Mar', umich:  79.4, conf: 103.1 }, { m: 'Apr', umich: 77.2, conf: 97.5 },
  { m: 'May', umich:  69.1, conf: 102.0 }, { m: 'Jun', umich: 68.2, conf: 100.4 },
];

const delinq = [
  { q: 'Q1 23', cc: 2.40, auto: 2.20, mortg: 0.72 },
  { q: 'Q2 23', cc: 2.77, auto: 2.36, mortg: 0.66 },
  { q: 'Q3 23', cc: 3.07, auto: 2.53, mortg: 0.62 },
  { q: 'Q4 23', cc: 3.10, auto: 2.66, mortg: 0.66 },
  { q: 'Q1 24', cc: 3.16, auto: 2.78, mortg: 0.70 },
  { q: 'Q2 24', cc: 3.25, auto: 2.88, mortg: 0.78 },
  { q: 'Q3 24', cc: 3.42, auto: 2.96, mortg: 0.84 },
];

const consumer = [
  { item: 'Real Disposable Income',     curr:  1.8, prev:  1.4, y1:  4.2, unit: '% YoY' },
  { item: 'Personal Saving Rate',       curr:  3.6, prev:  3.4, y1:  4.2, unit: '%' },
  { item: 'Real PCE',                   curr:  2.4, prev:  2.6, y1:  2.2, unit: '% YoY' },
  { item: 'Retail Sales (control grp)', curr:  3.2, prev:  3.6, y1:  4.4, unit: '% YoY' },
  { item: 'Consumer Credit Outstand.',  curr:  2.1, prev:  2.4, y1:  6.8, unit: '% YoY' },
  { item: 'Revolving Credit',           curr:  5.6, prev:  6.2, y1: 11.4, unit: '% YoY' },
  { item: 'CC Delinquency 90+',         curr:  3.42, prev: 3.25, y1: 2.77, unit: '%' },
  { item: 'Auto Loan Delinq 90+',       curr:  2.96, prev: 2.88, y1: 2.36, unit: '%' },
  { item: 'Mortgage Delinq 90+',        curr:  0.84, prev: 0.78, y1: 0.66, unit: '%' },
  { item: 'Subprime Auto Delinq',       curr:  6.42, prev: 6.18, y1: 4.94, unit: '%' },
];

export default function ConsumerHealth() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="U-MICH SENT" value="68.2" delta="-1.0 m/m" />
        <Stat label="CONF BOARD" value="100.4" delta="-1.6 m/m" />
        <Stat label="SAVE RATE" value="3.6%" delta="below 8% avg" />
        <Stat label="CC DELINQ" value="3.42%" delta="+17bp q/q" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Consumer Confidence (U-Mich vs Conf Board)</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={confidence}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis yAxisId="l" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line yAxisId="l" type="monotone" dataKey="umich" stroke="hsl(var(--accent))" strokeWidth={2} name="U-Mich" />
              <Line yAxisId="r" type="monotone" dataKey="conf" stroke="hsl(var(--positive))" strokeWidth={2} name="Conf Board" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">90+ Day Delinquencies (% of balance)</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <BarChart data={delinq}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="q" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey="cc" fill="hsl(var(--negative))" name="Credit Card" />
              <Bar dataKey="auto" fill="hsl(var(--accent))" name="Auto" />
              <Bar dataKey="mortg" fill="hsl(var(--positive))" name="Mortgage" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Consumer Indicators</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">METRIC</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">UNIT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">TREND</th>
            </tr>
          </thead>
          <tbody>
            {consumer.map((c, i) => {
              const trend = c.curr > c.prev ? '↗' : c.curr < c.prev ? '↘' : '→';
              const isDelinq = c.item.includes('Delinq') || c.item.includes('Subprime');
              const trendColor = isDelinq
                ? (c.curr > c.prev ? 'text-negative' : 'text-positive')
                : (c.curr > c.prev ? 'text-positive' : 'text-negative');
              return (
                <tr key={c.item} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground">{c.item}</td>
                  <td className="px-2 py-1 text-right font-bold text-foreground">{c.curr.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{c.prev.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{c.y1.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground/60">{c.unit}</td>
                  <td className={`px-2 py-1 text-right font-bold ${trendColor}`}>{trend}</td>
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
