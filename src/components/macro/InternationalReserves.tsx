import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

// Stylized IMF COFER share path (%).
const COFER = YEARS.map((y, i) => ({
  year: y,
  USD: 65.7 - i * 0.45,
  EUR: 19.2 + i * 0.05,
  JPY: 4.0 + i * 0.18,
  GBP: 4.7 - i * 0.02,
  CNY: 1.1 + i * 0.25,
  AUD: 1.9 + i * 0.05,
  CAD: 1.8 + i * 0.05,
  CHF: 0.3 + i * 0.01,
  Other: 1.3 + i * 0.05,
}));

const HOLDERS: { c: string; flag: string; res: number; gold: number; sdr: number; gdpPct: number; yoy: number }[] = [
  { c: 'China', flag: '🇨🇳', res: 3239, gold: 2264, sdr: 53, gdpPct: 18, yoy: 1.2 },
  { c: 'Japan', flag: '🇯🇵', res: 1232, gold: 846, sdr: 64, gdpPct: 30, yoy: -2.1 },
  { c: 'Switzerland', flag: '🇨🇭', res: 866, gold: 1040, sdr: 12, gdpPct: 95, yoy: 3.4 },
  { c: 'India', flag: '🇮🇳', res: 642, gold: 822, sdr: 18, gdpPct: 17, yoy: 4.8 },
  { c: 'Russia', flag: '🇷🇺', res: 590, gold: 2333, sdr: 24, gdpPct: 30, yoy: -1.4 },
  { c: 'Taiwan', flag: '🇹🇼', res: 575, gold: 422, sdr: 0, gdpPct: 75, yoy: 2.2 },
  { c: 'Saudi Arabia', flag: '🇸🇦', res: 458, gold: 323, sdr: 21, gdpPct: 42, yoy: -0.8 },
  { c: 'Hong Kong', flag: '🇭🇰', res: 425, gold: 2, sdr: 4, gdpPct: 115, yoy: 0.6 },
  { c: 'Korea', flag: '🇰🇷', res: 415, gold: 104, sdr: 12, gdpPct: 24, yoy: -1.1 },
  { c: 'Brazil', flag: '🇧🇷', res: 350, gold: 130, sdr: 18, gdpPct: 17, yoy: 0.4 },
  { c: 'Singapore', flag: '🇸🇬', res: 348, gold: 230, sdr: 6, gdpPct: 78, yoy: 5.6 },
  { c: 'Germany', flag: '🇩🇪', res: 305, gold: 3355, sdr: 56, gdpPct: 8, yoy: 1.0 },
  { c: 'France', flag: '🇫🇷', res: 250, gold: 2437, sdr: 41, gdpPct: 9, yoy: 1.6 },
  { c: 'Italy', flag: '🇮🇹', res: 215, gold: 2452, sdr: 33, gdpPct: 11, yoy: 2.2 },
  { c: 'UK', flag: '🇬🇧', res: 196, gold: 310, sdr: 41, gdpPct: 6, yoy: -0.4 },
  { c: 'Mexico', flag: '🇲🇽', res: 218, gold: 120, sdr: 13, gdpPct: 13, yoy: 3.1 },
  { c: 'Thailand', flag: '🇹🇭', res: 224, gold: 244, sdr: 5, gdpPct: 41, yoy: 0.2 },
  { c: 'UAE', flag: '🇦🇪', res: 165, gold: 65, sdr: 4, gdpPct: 31, yoy: 4.5 },
  { c: 'Indonesia', flag: '🇮🇩', res: 145, gold: 79, sdr: 9, gdpPct: 11, yoy: -0.6 },
  { c: 'Poland', flag: '🇵🇱', res: 195, gold: 360, sdr: 5, gdpPct: 25, yoy: 6.8 },
];

const COLORS = ['hsl(var(--accent))', 'hsl(var(--positive))', '#7dd3fc', '#fcd34d', '#f87171', '#a78bfa', '#f9a8a8', '#94a3b8', '#c084fc'];

export default function InternationalReserves() {
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  const totalRes = useMemo(() => HOLDERS.reduce((s, h) => s + h.res, 0), []);
  const totalGold = useMemo(() => HOLDERS.reduce((s, h) => s + h.gold, 0), []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">International Reserves & COFER</span>
        <span className="text-muted-foreground font-mono text-[9px]">WIRA &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { l: 'GLOBAL RESERVES', v: `$${(totalRes / 1000).toFixed(2)}T`, s: 'Top 20 holders' },
          { l: 'GOLD HOLDINGS', v: `${(totalGold / 1000).toFixed(1)}k t`, s: 'Official sector' },
          { l: 'USD SHARE', v: '58.2%', s: '↓ from 65.7% (2015)' },
          { l: 'CNY SHARE', v: '2.6%', s: '↑ from 1.1% (2015)' },
        ].map(k => (
          <div key={k.l} className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">{k.l}</div>
            <div className="text-lg font-mono font-bold text-foreground">{redact(k.v)}</div>
            <div className="text-[9px] font-mono text-muted-foreground/70">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-1">IMF COFER · Currency Composition of FX Reserves (%)</div>
        <ExpandableResponsiveContainer width="100%" height={260}>
          <AreaChart data={COFER}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis dataKey="year" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
            {['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'AUD', 'CAD', 'CHF', 'Other'].map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.7} />
            ))}
          </AreaChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border overflow-x-auto">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Top 20 Reserve Holders</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              {['#', 'COUNTRY', 'RESERVES $bn', 'GOLD (t)', 'SDR $bn', '% GDP', '1Y Δ %'].map(c => (
                <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOLDERS.map((h, i) => (
              <tr key={h.c} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-1 text-foreground font-bold">{h.flag} {h.c}</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{redact(h.res.toLocaleString())}</td>
                <td className="px-2 py-1 text-right text-accent">{h.gold.toLocaleString()}</td>
                <td className="px-2 py-1 text-right text-foreground">{h.sdr}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{h.gdpPct}%</td>
                <td className={`px-2 py-1 text-right font-bold ${h.yoy >= 0 ? 'text-positive' : 'text-negative'}`}>{h.yoy >= 0 ? '+' : ''}{h.yoy.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
