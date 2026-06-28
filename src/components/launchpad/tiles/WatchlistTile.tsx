import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';
import Sparkline from '@/components/tools/widgets/Sparkline';

const DEFAULT_SYMBOLS = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'];
const REFRESH_MS = 30_000;

type Quote = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  error?: string;
};

function makeSpark(prev: number | null, close: number | null): number[] {
  if (prev == null || close == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => +(prev + (close - prev) * t).toFixed(4));
}

export default function WatchlistTile() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const symbolsRef = useRef(DEFAULT_SYMBOLS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ quotes?: Quote[] }>(
          `/api/market/security/batch-quotes?symbols=${symbolsRef.current.join(',')}`
        );
        if (!cancelled) setQuotes((data?.quotes ?? []) as Quote[]);
      } catch {
        // keep prior data on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading && quotes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-[9px] font-mono text-muted-foreground animate-pulse">LOADING…</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 h-5 px-1 bg-surface-deep border-b border-border text-[8px] font-mono uppercase text-muted-foreground">
        <span className="w-12">SYM</span>
        <span className="w-16 text-right">LAST</span>
        <span className="w-10">TREND</span>
        <span className="ml-auto">%CHG</span>
      </div>
      {quotes.map(q => {
        const pct = q.changePct ?? 0;
        const tone = pct >= 0 ? 'text-positive' : 'text-negative';
        const spark = makeSpark(q.prevClose, q.price);
        return (
          <div key={q.ticker} className="flex items-center gap-2 h-6 px-1 border-b border-border/40 hover:bg-surface-elevated">
            <span className="text-[10px] font-mono font-bold text-foreground w-12">{q.ticker}</span>
            <span className="text-[10px] font-mono tabular-nums text-foreground w-16 text-right">
              {q.price != null ? q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
            </span>
            <Sparkline values={spark} width={40} height={12} />
            <span className={`ml-auto text-[10px] font-mono font-bold tabular-nums ${tone}`}>
              {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
