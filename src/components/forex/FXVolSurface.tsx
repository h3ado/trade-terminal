import { useMemo, useState } from 'react';
import { useFxBase } from '@/contexts/FxBaseContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import FxProChart from '@/components/forex/chart/FxProChart';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const PAIRS = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCNH', 'USDMXN', 'USDZAR'];
const TENORS = ['1W', '2W', '1M', '2M', '3M', '6M', '9M', '1Y', '2Y'];
const DELTAS = ['10P', '15P', '25P', 'ATM', '25C', '15C', '10C'];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

export default function FXVolSurface() {
  const { pair, setPair } = useFxBase();
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);

  const surface = useMemo(() => TENORS.map(t => {
    const row: Record<string, number | string> = { tenor: t };
    DELTAS.forEach(d => {
      const base = seeded(pair + t + 'atm', 6, 14);
      const skew = d === 'ATM' ? 0 : d.endsWith('P') ? seeded(pair + d, 0.4, 1.8) : seeded(pair + d, -0.2, 1.2);
      row[d] = +(base + skew).toFixed(2);
    });
    return row;
  }), [pair]);

  const rrBf = useMemo(() => TENORS.map(t => ({
    tenor: t,
    rr25: +(seeded(pair + t + 'rr', -1.5, 1.5)).toFixed(2),
    bf25: +(seeded(pair + t + 'bf', 0.1, 0.9)).toFixed(2),
  })), [pair]);

  const rvIv = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    d: i,
    rv: +(seeded(pair + 'rv' + i, 5, 14) + Math.sin(i / 8) * 0.8).toFixed(2),
    iv: +(seeded(pair + 'iv' + i, 6, 15) + Math.cos(i / 7) * 0.6).toFixed(2),
  })), [pair]);

  const cellColor = (v: number) => {
    const t = Math.min(1, Math.max(0, (v - 5) / 12));
    return `hsl(var(--accent) / ${0.1 + t * 0.55})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Vol Surface</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXV &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">PAIR</label>
          <select value={pair} onChange={e => setPair(e.target.value)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            {PAIRS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <FxProChart
        symbol={pair}
        title={`· ${pair} SPOT`}
        height={180}
        digits={pair.includes('JPY') ? 3 : 5}
        initialCfg={{ timeframe: '1D', range: '3M', type: 'candle', bb: true }}
      />

      <ExpandableChartCard title="ATM IV Surface · tenor × delta" defaultHeight={220}>
        {() => (
          <div className="overflow-x-auto">
            <table className="text-[10px] font-mono w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-muted-foreground text-left">Tenor</th>
                  {DELTAS.map(d => <th key={d} className="px-2 py-1 text-accent font-bold">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {surface.map(row => (
                  <tr key={row.tenor as string} className="border-b border-grid-line last:border-0">
                    <td className="px-2 py-1 text-accent font-bold">{row.tenor}</td>
                    {DELTAS.map(d => {
                      const v = row[d] as number;
                      return (
                        <td key={d} className="px-2 py-1 text-center text-foreground font-bold" style={{ backgroundColor: cellColor(v) }}>
                          {redact(v.toFixed(2))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ExpandableChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandableChartCard title="25Δ Risk Reversal & Butterfly · term" defaultHeight={220}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={rrBf}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
                <Line type="monotone" dataKey="rr25" stroke="hsl(var(--accent))" strokeWidth={2} dot name="25Δ RR" />
                <Line type="monotone" dataKey="bf25" stroke="hsl(var(--positive))" strokeWidth={2} dot name="25Δ BF" />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>

        <ExpandableChartCard title="Realized vs Implied · 1M, 90D" defaultHeight={220}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={rvIv}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
                <Line type="monotone" dataKey="rv" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} name="Realized" />
                <Line type="monotone" dataKey="iv" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Implied" />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>
    </div>
  );
}
