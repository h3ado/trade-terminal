import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const CCYS = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'CNY', 'HKD', 'SGD', 'KRW', 'TWD', 'INR', 'MXN', 'BRL', 'ZAR', 'TRY', 'PLN'];
const BASES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
const HORIZONS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y'] as const;
type Horizon = typeof HORIZONS[number];

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

const REGION: Record<string, string> = {
  EUR: 'Europe', GBP: 'Europe', CHF: 'Europe', SEK: 'Europe', NOK: 'Europe', PLN: 'Europe',
  JPY: 'Asia', CNY: 'Asia', HKD: 'Asia', SGD: 'Asia', KRW: 'Asia', TWD: 'Asia', INR: 'Asia',
  MXN: 'LatAm', BRL: 'LatAm', CAD: 'Americas', AUD: 'Oceania', NZD: 'Oceania',
  ZAR: 'Africa', TRY: 'MENA',
};

export default function WCRSPerformance() {
  const { rates } = useFXRates();
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  const [base, setBase] = useState<string>('USD');
  const [sortBy, setSortBy] = useState<Horizon>('1D');

  const data = useMemo(() => CCYS.map(c => {
    const r = rates.find(x => x.ccy === c);
    const d1 = r?.change_pct ?? seed(c + base + 'd1', -1.5, 1.5);
    return {
      ccy: c,
      region: REGION[c] ?? '—',
      '1D': d1,
      '1W': seed(c + base + 'w', -3, 3),
      '1M': seed(c + base + 'm', -5, 5),
      '3M': seed(c + base + '3m', -8, 8),
      '6M': seed(c + base + '6m', -12, 12),
      'YTD': seed(c + base + 'ytd', -15, 15),
      '1Y': seed(c + base + '1y', -20, 20),
      spark: Array.from({ length: 20 }, (_, i) => ({ x: i, v: 100 + Math.sin(i / 3 + h(c)) * 4 + seed(c + i, -1, 1) })),
    };
  }), [rates, base]);

  const sorted = [...data].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  const topBot = [...sorted.slice(0, 5), ...sorted.slice(-5).reverse()];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Performance Ranking</span>
        <span className="text-muted-foreground font-mono text-[9px]">WCRS &lt;GO&gt;</span>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-[10px] font-mono text-muted-foreground">BASE:</span>
        {BASES.map(b => (
          <button key={b} onClick={() => setBase(b)}
            className={`px-2 py-1 text-[10px] font-mono ${base === b ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>{b}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Top / Bottom 5 · {sortBy} vs {base}</div>
          <ExpandableResponsiveContainer width="100%" height={260}>
            <BarChart data={topBot} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis dataKey="ccy" type="category" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} width={36} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey={sortBy}>
                {topBot.map((p, i) => <Cell key={i} fill={(p[sortBy] as number) >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}
              </Bar>
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Regional Heat ({sortBy})</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from(new Set(Object.values(REGION))).map(r => {
              const avg = data.filter(d => d.region === r).reduce((s, d) => s + (d[sortBy] as number), 0) / Math.max(1, data.filter(d => d.region === r).length);
              const intensity = Math.min(1, Math.abs(avg) / 8);
              const bg = avg >= 0 ? `hsl(var(--positive) / ${intensity})` : `hsl(var(--negative) / ${intensity})`;
              return (
                <div key={r} className="border border-border p-2" style={{ backgroundColor: bg }}>
                  <div className="text-[9px] font-mono text-foreground/80">{r}</div>
                  <div className={`text-sm font-mono font-bold ${avg >= 0 ? 'text-positive' : 'text-negative'}`}>{avg >= 0 ? '+' : ''}{avg.toFixed(2)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="px-2 py-1.5 text-accent font-bold text-left">CCY vs {base}</th>
              <th className="px-2 py-1.5 text-accent font-bold text-left">REGION</th>
              {HORIZONS.map(hz => (
                <th key={hz} onClick={() => setSortBy(hz)} className={`px-2 py-1.5 text-right font-bold cursor-pointer ${sortBy === hz ? 'text-accent bg-accent/10' : 'text-accent'}`}>{hz}</th>
              ))}
              <th className="px-2 py-1.5 text-accent font-bold text-right">TREND</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={d.ccy} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-accent font-bold">{d.ccy}</td>
                <td className="px-2 py-1 text-muted-foreground">{d.region}</td>
                {HORIZONS.map(hz => {
                  const v = d[hz] as number;
                  return <td key={hz} className={`px-2 py-1 text-right font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>{redact((v >= 0 ? '+' : '') + v.toFixed(2) + '%')}</td>;
                })}
                <td className="px-2 py-1">
                  <ExpandableResponsiveContainer width={80} height={20}>
                    <LineChart data={d.spark}>
                      <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ExpandableResponsiveContainer>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
