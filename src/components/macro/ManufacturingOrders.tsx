// MFG — Manufacturing & Orders. Durable goods, core capex, ISM, Empire/Philly, capacity util.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const ismHist = [
  { m: 'Jul', mfg: 46.8, svc: 51.4, neword: 47.1 }, { m: 'Aug', mfg: 47.2, svc: 51.5, neword: 46.8 },
  { m: 'Sep', mfg: 47.8, svc: 51.7, neword: 49.2 }, { m: 'Oct', mfg: 46.7, svc: 52.0, neword: 49.4 },
  { m: 'Nov', mfg: 46.6, svc: 52.5, neword: 50.4 }, { m: 'Dec', mfg: 47.1, svc: 50.5, neword: 47.2 },
  { m: 'Jan', mfg: 47.8, svc: 53.4, neword: 50.5 }, { m: 'Feb', mfg: 47.8, svc: 52.6, neword: 49.2 },
  { m: 'Mar', mfg: 50.3, svc: 51.4, neword: 51.4 }, { m: 'Apr', mfg: 49.2, svc: 49.4, neword: 49.1 },
  { m: 'May', mfg: 48.7, svc: 53.8, neword: 45.4 }, { m: 'Jun', mfg: 48.5, svc: 48.8, neword: 49.3 },
];

const regional = [
  { fed: 'Empire NY',    curr: -15.6, prev:  -2.4, y1:   -6.4, threshold: 0 },
  { fed: 'Philly Fed',   curr:   1.3, prev:  -5.2, y1:  -13.7, threshold: 0 },
  { fed: 'Richmond',     curr: -10.0, prev:  -7.0, y1:  -10.0, threshold: 0 },
  { fed: 'Dallas',       curr: -14.5, prev: -11.3, y1:  -16.1, threshold: 0 },
  { fed: 'Kansas City',  curr:  -8.0, prev:  -7.0, y1:   -5.0, threshold: 0 },
  { fed: 'Chicago PMI',  curr:  41.2, prev:  37.9, y1:   44.2, threshold: 50 },
];

const orders = [
  { item: 'Durable Goods Orders',         curr:  0.2, prev: -6.2, y1: -1.8, unit: '% m/m' },
  { item: 'Ex-Transportation',            curr:  0.3, prev:  0.1, y1:  0.4, unit: '% m/m' },
  { item: 'Core Capex (NDCGXA)',          curr:  0.2, prev: -0.4, y1:  0.6, unit: '% m/m' },
  { item: 'Factory Orders',               curr: -0.1, prev: -3.8, y1: -1.4, unit: '% m/m' },
  { item: 'Capacity Utilization',         curr: 78.4, prev: 78.2, y1: 78.9, unit: '%' },
  { item: 'Industrial Production',        curr:  0.0, prev:  0.1, y1: -0.4, unit: '% m/m' },
  { item: 'Industrial Production YoY',    curr: -0.4, prev: -0.7, y1:  0.4, unit: '%' },
  { item: 'Manufacturing PMI (S&P)',      curr: 50.4, prev: 51.6, y1: 51.0, unit: 'idx' },
];

export default function ManufacturingOrders() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="ISM MFG" value="48.5" delta="-0.2 m/m" />
        <Stat label="ISM NEW ORDERS" value="49.3" delta="+3.9 m/m" up />
        <Stat label="CAP UTIL" value="78.4%" delta="+0.2" up />
        <Stat label="CORE CAPEX" value="+0.2%" delta="m/m" up />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">ISM Manufacturing — Headline & New Orders</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={ismHist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={[40, 60]} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: '50 = expansion', fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
              <Line type="monotone" dataKey="mfg" stroke="hsl(var(--accent))" strokeWidth={2} name="ISM Mfg" />
              <Line type="monotone" dataKey="svc" stroke="hsl(var(--positive))" strokeWidth={1.5} name="ISM Services" />
              <Line type="monotone" dataKey="neword" stroke="hsl(var(--negative))" strokeWidth={1.5} strokeDasharray="4 4" name="New Orders" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Regional Fed Manufacturing Surveys</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <BarChart data={regional} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis type="category" dataKey="fed" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} width={80} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="curr" fill="hsl(var(--accent))" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Orders & Production</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">METRIC</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">UNIT</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.item} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground">{o.item}</td>
                <td className={`px-2 py-1 text-right font-bold ${o.curr > 0 ? 'text-positive' : o.curr < 0 ? 'text-negative' : 'text-foreground'}`}>{o.curr > 0 ? '+' : ''}{o.curr.toFixed(1)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{o.prev > 0 ? '+' : ''}{o.prev.toFixed(1)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{o.y1 > 0 ? '+' : ''}{o.y1.toFixed(1)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground/60">{o.unit}</td>
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
      <div className={`text-[9px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>{delta}</div>
    </div>
  );
}
