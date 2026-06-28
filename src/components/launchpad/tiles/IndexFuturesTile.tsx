// INDX — live index futures via batch-quotes (Yahoo Finance futures notation).
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import Sparkline from '@/components/tools/widgets/Sparkline';

const FUTURES = [
  { sym: 'ES=F',  disp: 'ES',  name: 'S&P 500' },
  { sym: 'NQ=F',  disp: 'NQ',  name: 'Nasdaq 100' },
  { sym: 'YM=F',  disp: 'YM',  name: 'Dow' },
  { sym: 'RTY=F', disp: 'RTY', name: 'Russell 2K' },
  { sym: 'CL=F',  disp: 'CL',  name: 'WTI Crude' },
  { sym: 'GC=F',  disp: 'GC',  name: 'Gold' },
];

type Quote = { ticker: string; price: number | null; prevClose: number | null; changePct: number | null };

function makeSpark(prev: number | null, cur: number | null): number[] {
  if (prev == null || cur == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => prev + (cur - prev) * t);
}

const SYMS = FUTURES.map(f => f.sym).join(',');

export default function IndexFuturesTile() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ quotes?: Quote[] }>(`/api/market/security/batch-quotes?symbols=${SYMS}`);
        if (!cancelled) {
          const map: Record<string, Quote> = {};
          for (const q of data?.quotes ?? []) map[q.ticker] = q;
          setQuotes(map);
          setLoading(false);
        }
      } catch { if (!cancelled) setLoading(false); }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      {loading && Object.keys(quotes).length === 0 && (
        <div className="flex items-center justify-center h-8 text-[9px] font-mono text-muted-foreground animate-pulse">LOADING…</div>
      )}
      {FUTURES.map(f => {
        const q = quotes[f.sym];
        const pct = q?.changePct ?? 0;
        const price = q?.price;
        const spark = makeSpark(q?.prevClose ?? null, price ?? null);
        const tone = pct >= 0 ? 'text-positive' : 'text-negative';
        return (
          <div key={f.sym} className="flex items-center gap-2 h-6 px-1 border-b border-border/40 hover:bg-surface-elevated">
            <span className="text-[10px] font-mono font-bold text-accent w-8">{f.disp}</span>
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-16 truncate">{f.name}</span>
            <span className="text-[10px] font-mono tabular-nums text-foreground w-16 text-right">
              {price != null ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
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
