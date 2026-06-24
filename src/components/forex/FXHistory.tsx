import { useMemo, useState } from 'react';
import FxProChart from '@/components/forex/chart/FxProChart';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';

const PAIRS = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCNH', 'USDMXN', 'USDZAR', 'EURJPY', 'EURGBP'];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

export default function FXHistory() {
  const [primary, setPrimary] = useState('EURUSD');

  // Synthetic rolling vol + drawdown derived from same seeded series (1Y daily)
  const days = 252;
  const series = useMemo(() => Array.from({ length: days }, (_, i) => {
    const base = seeded(primary + 'base', 0.6, 1.5);
    const v = base * (1 + Math.sin(i / 14 + hash(primary)) * 0.06 + (i / days) * seeded(primary + 'drift', -0.08, 0.08));
    return { d: i, p: v };
  }), [primary]);

  const rolling = useMemo(() => series.map((row, i) => {
    const w = 21;
    const lo = Math.max(0, i - w);
    const win = series.slice(lo, i + 1).map(r => r.p);
    const mean = win.reduce((s, x) => s + x, 0) / Math.max(1, win.length);
    const v = Math.sqrt(win.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, win.length)) / mean * Math.sqrt(252) * 100;
    return { d: row.d, vol: +v.toFixed(2) };
  }), [series]);

  const drawdown = useMemo(() => {
    let peak = -Infinity;
    return series.map(r => {
      peak = Math.max(peak, r.p);
      return { d: r.d, dd: +((r.p / peak - 1) * 100).toFixed(2) };
    });
  }, [series]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX History</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXH &lt;GO&gt;</span>
      </div>

      <div className="border border-border bg-surface-primary p-2 flex gap-1 flex-wrap">
        {PAIRS.map(p => (
          <button key={p} onClick={() => setPrimary(p)} className={`text-[10px] font-mono px-2 py-0.5 border ${primary === p ? 'bg-accent text-accent-foreground border-accent font-bold' : 'border-border text-muted-foreground hover:text-foreground'}`}>{p}</button>
        ))}
      </div>

      <FxProChart
        symbol={primary}
        title={`· ${primary} HISTORY`}
        height={320}
        digits={primary.includes('JPY') ? 3 : 5}
        initialCfg={{ timeframe: '1D', range: '1Y', type: 'candle', ema20: true, ema50: true, ema200: true, bb: false, rsi: true }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <FxProChart
          symbol="DXY"
          title="· DOLLAR INDEX OVERLAY"
          height={200}
          digits={2}
          initialCfg={{ timeframe: '1D', range: '1Y', type: 'line', ema50: true }}
        />
        <ExpandableChartCard title={`Rolling 21D vol · ${primary}`} defaultHeight={200}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={rolling}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="vol" stroke="hsl(var(--positive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>

      <ExpandableChartCard title={`Drawdown · ${primary}`} defaultHeight={200}>
        {(h) => (
          <ExpandableResponsiveContainer width="100%" height={h}>
            <AreaChart data={drawdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="dd" stroke="hsl(var(--negative))" fill="hsl(var(--negative) / 0.25)" />
            </AreaChart>
          </ExpandableResponsiveContainer>
        )}
      </ExpandableChartCard>
    </div>
  );
}
