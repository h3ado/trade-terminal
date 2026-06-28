// Yield curve tile — Recharts line chart + spread KPIs.
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiGet } from '@/lib/api';

interface Tenor {
  label: string;
  years: number;
  current: number | null;
  wk1: number | null;
  mo1: number | null;
}

interface CurveData {
  tenors: Tenor[];
  spreads: { s2s10: number | null; s3m10y: number | null; s5s30: number | null };
  inverted: boolean;
}

let cache: { ts: number; data: CurveData } | null = null;
const TTL = 3_600_000;

function fmt(v: number | null, dp = 2) {
  return v != null ? v.toFixed(dp) : '—';
}

export default function YieldCurveTile() {
  const [data, setData] = useState<CurveData | null>(cache?.data ?? null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    if (cache && Date.now() - cache.ts < TTL) { setData(cache.data); setLoading(false); return; }
    setLoading(true);
    apiGet<CurveData>('/api/market/macro/yield-curve')
      .then(d => {
        cache = { ts: Date.now(), data: d };
        if (!cancelled) { setData(d); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const chartData = (data?.tenors ?? [])
    .filter(t => t.current != null)
    .map(t => ({ label: t.label, Now: t.current, '1M Ago': t.mo1 }));

  const { s2s10, s3m10y, s5s30 } = data?.spreads ?? { s2s10: null, s3m10y: null, s5s30: null };
  const inverted = data?.inverted ?? false;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between">
        <span>YLDC · Yield Curve</span>
        {loading && <span className="text-accent">···</span>}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Chart */}
        <div className="flex-1 min-h-0 px-1 pt-1">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}
                  stroke="hsl(var(--border))"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}
                  stroke="none"
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    fontFamily: 'monospace',
                    fontSize: 9,
                    padding: '4px 8px',
                  }}
                  formatter={(v: number) => [`${v?.toFixed(2)}%`]}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                />
                <Line
                  type="monotone"
                  dataKey="Now"
                  stroke="hsl(var(--accent))"
                  strokeWidth={1.8}
                  dot={false}
                  activeDot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="1M Ago"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  dot={false}
                  activeDot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[9px] font-mono text-muted-foreground">
              {loading ? 'Loading…' : 'No data'}
            </div>
          )}
        </div>

        {/* Spread KPIs */}
        <div className="grid grid-cols-3 border-t border-border">
          {[
            { label: '2s10s', value: s2s10 },
            { label: '3m10y', value: s3m10y },
            { label: '5s30s', value: s5s30 },
          ].map(({ label, value }) => (
            <div key={label} className="px-2 py-1.5 border-r border-border last:border-r-0 text-center">
              <div className="text-[8px] font-mono text-muted-foreground uppercase">{label}</div>
              <div className={`text-[10px] font-mono font-bold tabular-nums ${
                value == null ? 'text-muted-foreground' : value >= 0 ? 'text-positive' : 'text-negative'
              }`}>
                {value != null ? `${value >= 0 ? '+' : ''}${fmt(value)}` : '—'}
              </div>
            </div>
          ))}
        </div>
        <div className={`px-2 py-0.5 text-center text-[8px] font-mono font-bold border-t border-border ${inverted ? 'text-negative' : 'text-positive'}`}>
          {inverted ? '▼ INVERTED' : '▲ NORMAL'}
        </div>
      </div>
    </div>
  );
}
