import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface OhlcCandle { t: number; o: number; h: number; l: number; c: number }

const TIMEFRAMES = [
  { label: '7D',  days: '7'   },
  { label: '30D', days: '30'  },
  { label: '90D', days: '90'  },
  { label: '1Y',  days: '365' },
] as const;

function fmtDate(ts: number, days: string) {
  const d = new Date(ts);
  if (days === '7') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPrice(v: number) {
  return v >= 1 ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${v.toFixed(4)}`;
}

interface Props {
  coinId: string;
  symbol: string;
}

export default function CryptoPriceChart({ coinId, symbol }: Props) {
  const [days, setDays] = useState<string>('30');
  const [candles, setCandles] = useState<OhlcCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(`/api/market/crypto/coin/${coinId}/ohlc?days=${days}`);
      const d = await r.json() as { candles: OhlcCandle[] };
      setCandles(d.candles ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [coinId, days]);

  useEffect(() => { load(); }, [load]);

  const chartData = candles.map(c => ({
    date: fmtDate(c.t, days),
    close: c.c,
    high: c.h,
    low: c.l,
    open: c.o,
  }));

  const prices = candles.map(c => c.c);
  const isUp = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;
  const color = isUp ? '#38a838' : '#d63333';
  const pct = prices.length > 1
    ? ((prices[prices.length - 1] - prices[0]) / prices[0] * 100)
    : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Timeframe bar */}
      <div className="shrink-0 flex items-center gap-0 border-b border-border px-2 py-[3px]">
        <span className="text-[7px] text-muted-foreground uppercase mr-2">{symbol}</span>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.days}
            onClick={() => setDays(tf.days)}
            className={`px-1.5 py-0.5 text-[8px] font-mono transition-colors ${days === tf.days ? 'text-accent border-b border-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tf.label}
          </button>
        ))}
        {!loading && prices.length > 1 && (
          <span className={`ml-auto text-[8px] font-bold tabular-nums ${pct >= 0 ? 'text-positive' : 'text-negative'}`}>
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[8px] animate-pulse">Loading…</div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[8px]">Chart unavailable</div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={`crypto-grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => fmtPrice(v)}
                domain={['auto', 'auto']}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--surface-elevated))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 0,
                  fontSize: 9,
                  padding: '4px 8px',
                }}
                formatter={(v: number) => [fmtPrice(v), 'Close']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 8 }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={1.2}
                fill={`url(#crypto-grad-${coinId})`}
                dot={false}
                activeDot={{ r: 2, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
