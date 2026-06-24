// BOP — Balance of Payments, FX reserves, COFER reserve currency composition.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const cofer = [
  { ccy: 'USD',   pct: 58.4, color: 'hsl(var(--accent))' },
  { ccy: 'EUR',   pct: 19.8, color: 'hsl(var(--positive))' },
  { ccy: 'JPY',   pct:  5.7, color: '#8b5cf6' },
  { ccy: 'GBP',   pct:  4.9, color: 'hsl(var(--negative))' },
  { ccy: 'CNY',   pct:  2.4, color: '#f59e0b' },
  { ccy: 'GOLD',  pct:  4.1, color: '#fbbf24' },
  { ccy: 'OTHER', pct:  4.7, color: 'hsl(var(--muted-foreground))' },
];

type Row = { country: string; flag: string; ca: number; trade: number; fdi: number; reserves: number; rsv5yΔ: number };
const rows: Row[] = [
  { country: 'China',        flag: '🇨🇳', ca:  1.4, trade:  823, fdi:  189, reserves: 3245, rsv5yΔ:  -2.1 },
  { country: 'Japan',        flag: '🇯🇵', ca:  3.6, trade:  -22, fdi: -184, reserves: 1241, rsv5yΔ:   1.2 },
  { country: 'Switzerland',  flag: '🇨🇭', ca:  9.8, trade:   58, fdi:  -12, reserves:  834, rsv5yΔ:   8.4 },
  { country: 'India',        flag: '🇮🇳', ca: -1.2, trade: -242, fdi:   28, reserves:  682, rsv5yΔ:  18.2 },
  { country: 'Saudi Arabia', flag: '🇸🇦', ca:  3.4, trade:  151, fdi:   31, reserves:  478, rsv5yΔ:  -4.8 },
  { country: 'Russia',       flag: '🇷🇺', ca:  2.5, trade:  118, fdi:  -42, reserves:  624, rsv5yΔ:   2.4 },
  { country: 'Korea',        flag: '🇰🇷', ca:  4.6, trade:   42, fdi:   -8, reserves:  421, rsv5yΔ:   1.6 },
  { country: 'Brazil',       flag: '🇧🇷', ca: -1.4, trade:   88, fdi:   62, reserves:  362, rsv5yΔ:  -2.2 },
  { country: 'Singapore',    flag: '🇸🇬', ca: 18.2, trade:   84, fdi:  104, reserves:  348, rsv5yΔ:  21.4 },
  { country: 'Germany',      flag: '🇩🇪', ca:  6.8, trade:  248, fdi: -148, reserves:  314, rsv5yΔ:   8.2 },
  { country: 'Mexico',       flag: '🇲🇽', ca: -0.4, trade:  -22, fdi:   36, reserves:  226, rsv5yΔ:  18.4 },
  { country: 'France',       flag: '🇫🇷', ca: -0.9, trade:  -82, fdi:  -42, reserves:  248, rsv5yΔ:  12.1 },
  { country: 'UK',           flag: '🇬🇧', ca: -3.2, trade: -224, fdi:   24, reserves:  186, rsv5yΔ:  -4.2 },
  { country: 'US',           flag: '🇺🇸', ca: -3.4, trade: -942, fdi: -218, reserves:  168, rsv5yΔ:  -3.8 },
  { country: 'Turkey',       flag: '🇹🇷', ca: -1.8, trade:  -82, fdi:   12, reserves:  142, rsv5yΔ:  46.2 },
];

const cofer5yTrend = [
  { y: '2019', USD: 60.7, EUR: 20.6, JPY: 5.9, GBP: 4.6, CNY: 1.9 },
  { y: '2020', USD: 58.9, EUR: 21.3, JPY: 6.0, GBP: 4.7, CNY: 2.3 },
  { y: '2021', USD: 58.8, EUR: 20.6, JPY: 5.6, GBP: 4.8, CNY: 2.8 },
  { y: '2022', USD: 58.4, EUR: 20.5, JPY: 5.5, GBP: 4.9, CNY: 2.6 },
  { y: '2023', USD: 58.4, EUR: 20.0, JPY: 5.7, GBP: 4.8, CNY: 2.4 },
  { y: '2024', USD: 58.4, EUR: 19.8, JPY: 5.7, GBP: 4.9, CNY: 2.4 },
];

export default function BalanceOfPayments() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="USD RSV SHARE" value="58.4%" delta="-23bp y/y" />
        <Stat label="GLOBAL RSV (US$ T)" value="$12.4T" delta="+1.2%" up />
        <Stat label="LARGEST CA (CHE)" value="9.8%" delta="of GDP" />
        <Stat label="LARGEST DEFICIT (US)" value="-$942B" delta="trade" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">COFER — Reserve Currency Composition</div>
          <ExpandableResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={cofer} dataKey="pct" nameKey="ccy" innerRadius={50} outerRadius={90} stroke="hsl(var(--background))">
                {cofer.map((c) => <Cell key={c.ccy} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ExpandableResponsiveContainer>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {cofer.map(c => (
              <div key={c.ccy} className="flex items-center gap-1 text-[9px] font-mono">
                <div className="w-2 h-2" style={{ background: c.color }} />
                <span className="text-muted-foreground">{c.ccy}</span>
                <span className="font-bold ml-auto">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">USD Reserve Share — 5y Trend</div>
          <ExpandableResponsiveContainer width="100%" height={220}>
            <BarChart data={cofer5yTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="y" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey="USD" fill="hsl(var(--accent))" />
              <Bar dataKey="EUR" fill="hsl(var(--positive))" />
              <Bar dataKey="CNY" fill="#f59e0b" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border flex items-center justify-between">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">External Balances — Top Economies</span>
          <span className="text-[8px] text-muted-foreground font-mono">CA % GDP · Trade $B · FDI $B · Rsv $B</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">COUNTRY</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CA % GDP</th>
              <th className="text-right px-2 py-1 text-muted-foreground">TRADE BAL</th>
              <th className="text-right px-2 py-1 text-muted-foreground">FDI (NET)</th>
              <th className="text-right px-2 py-1 text-muted-foreground">FX RESERVES</th>
              <th className="text-right px-2 py-1 text-muted-foreground">5Y RSV Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.country} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground"><span className="mr-1">{r.flag}</span>{r.country}</td>
                <td className={`px-2 py-1 text-right font-bold ${r.ca >= 0 ? 'text-positive' : 'text-negative'}`}>{r.ca > 0 ? '+' : ''}{r.ca.toFixed(1)}%</td>
                <td className={`px-2 py-1 text-right ${r.trade >= 0 ? 'text-positive' : 'text-negative'}`}>{r.trade > 0 ? '+' : ''}${r.trade}B</td>
                <td className={`px-2 py-1 text-right ${r.fdi >= 0 ? 'text-positive' : 'text-negative'}`}>{r.fdi > 0 ? '+' : ''}${r.fdi}B</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">${r.reserves}B</td>
                <td className={`px-2 py-1 text-right ${r.rsv5yΔ >= 0 ? 'text-positive' : 'text-negative'}`}>{r.rsv5yΔ > 0 ? '+' : ''}{r.rsv5yΔ.toFixed(1)}%</td>
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
      <div className={`text-[9px] font-mono ${up ? 'text-positive' : 'text-muted-foreground'}`}>{delta}</div>
    </div>
  );
}
