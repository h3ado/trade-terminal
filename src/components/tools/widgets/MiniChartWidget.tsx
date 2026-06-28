import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/lib/api';

type Candle = { time: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null };
type Timeframe = { label: string; interval: string; outputsize: string };

const TIMEFRAMES: Timeframe[] = [
  { label: '5D', interval: '1day', outputsize: '5' },
  { label: '1M', interval: '1day', outputsize: '30' },
  { label: '3M', interval: '1day', outputsize: '90' },
  { label: '1Y', interval: '1day', outputsize: '365' },
];

function LinePath({ candles, w, h }: { candles: Candle[]; w: number; h: number }) {
  const closes = candles.map(c => c.close ?? 0).filter(v => v > 0);
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const pad = 4;
  const pts = closes.map((v, i) => {
    const x = pad + (i / (closes.length - 1)) * (w - pad * 2);
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pos = closes[closes.length - 1] >= closes[0];
  const color = pos ? 'hsl(var(--positive))' : 'hsl(var(--negative))';
  const last = pts[pts.length - 1].split(',');
  return (
    <>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </>
  );
}

export default function MiniChartWidget() {
  const [ticker, setTicker] = useState('SPY');
  const [draft, setDraft] = useState('SPY');
  const [tf, setTf] = useState<Timeframe>(TIMEFRAMES[1]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<{ candles?: Candle[] }>(`/api/market/security/${encodeURIComponent(ticker)}/chart?interval=${tf.interval}&outputsize=${tf.outputsize}`)
      .then(data => {
        if (cancelled) return;
        setCandles((data?.candles ?? []).filter(c => c.close != null));
        setLoading(false);
      })
      .catch(e => {
        if (cancelled) return;
        setError(String(e?.message ?? e));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [ticker, tf]);

  const closes = candles.map(c => c.close ?? 0).filter(v => v > 0);
  const last = closes[closes.length - 1] ?? 0;
  const first = closes[0] ?? 0;
  const chgPct = first > 0 ? ((last - first) / first) * 100 : 0;
  const pos = chgPct >= 0;

  const commit = () => {
    const t = draft.trim().toUpperCase();
    if (t) setTicker(t);
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-2 gap-2">
      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && commit()}
          onBlur={commit}
          className="flex-1 min-w-0 bg-surface-deep border border-border px-2 py-1 text-[11px] font-mono font-bold text-accent uppercase focus:outline-none focus:border-accent"
          placeholder="TICKER"
          maxLength={10}
        />
        <button
          onClick={commit}
          className="px-2 py-1 text-[9px] font-mono font-bold bg-surface-elevated border border-border text-muted-foreground hover:text-accent hover:border-accent"
        >
          GO
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-[14px] font-mono font-bold text-foreground">{last > 0 ? last.toFixed(2) : '—'}</span>
          {last > 0 && (
            <span className={`ml-2 text-[10px] font-mono font-bold ${pos ? 'text-positive' : 'text-negative'}`}>
              {pos ? '+' : ''}{chgPct.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex gap-0.5">
          {TIMEFRAMES.map(t => (
            <button
              key={t.label}
              onClick={() => setTf(t)}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold border ${
                tf.label === t.label
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-muted-foreground/60">
            Loading…
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-negative/70">
            {error}
          </div>
        )}
        {!loading && !error && candles.length > 1 && (
          <svg ref={svgRef} className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 120">
            <LinePath candles={candles} w={300} h={120} />
          </svg>
        )}
        {!loading && !error && candles.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-muted-foreground/60">
            No data
          </div>
        )}
      </div>

      <div className="text-[8px] font-mono text-muted-foreground/50 text-center">
        {ticker} · {tf.label} · {candles.length} bars
      </div>
    </div>
  );
}
