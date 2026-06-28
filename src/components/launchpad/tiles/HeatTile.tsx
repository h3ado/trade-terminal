// HEAT — live sector performance heatmap via batch-quotes.
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import Sparkline from '@/components/tools/widgets/Sparkline';

const SECTORS = [
  { sym: 'XLK', name: 'Tech' },
  { sym: 'XLF', name: 'Fins' },
  { sym: 'XLE', name: 'Energy' },
  { sym: 'XLV', name: 'Health' },
  { sym: 'XLY', name: 'Disc' },
  { sym: 'XLP', name: 'Staples' },
  { sym: 'XLI', name: 'Indust' },
  { sym: 'XLB', name: 'Matls' },
  { sym: 'XLRE', name: 'RE' },
  { sym: 'XLU', name: 'Utils' },
  { sym: 'XLC', name: 'Comm' },
];

type Quote = { ticker: string; price: number | null; prevClose: number | null; changePct: number | null };

function makeSpark(prev: number | null, cur: number | null): number[] {
  if (prev == null || cur == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => prev + (cur - prev) * t);
}

function tone(p: number) {
  if (p >= 1.5) return 'bg-positive/60 text-foreground';
  if (p >= 0.5) return 'bg-positive/35 text-positive';
  if (p > 0)    return 'bg-positive/15 text-positive';
  if (p > -0.5) return 'bg-negative/15 text-negative';
  if (p > -1.5) return 'bg-negative/35 text-negative';
  return 'bg-negative/60 text-foreground';
}

const SYMS = SECTORS.map(s => s.sym).join(',');

export default function HeatTile() {
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
    <div className="h-full p-[2px] grid grid-cols-3 gap-[2px] auto-rows-fr">
      {SECTORS.map(s => {
        const q = quotes[s.sym];
        const pct = q?.changePct ?? 0;
        const spark = makeSpark(q?.prevClose ?? null, q?.price ?? null);
        return (
          <div key={s.sym} className={`relative flex flex-col items-center justify-center px-1 overflow-hidden ${tone(pct)}`}>
            <div className="text-[10px] font-mono font-bold tabular-nums">{s.sym}</div>
            <div className="text-[8px] font-mono uppercase opacity-70 truncate w-full text-center">{s.name}</div>
            <div className="text-[11px] font-mono font-bold tabular-nums">
              {loading && !q ? '···' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
            </div>
            {q && (
              <div className="absolute bottom-0 left-0 right-0 opacity-30 pointer-events-none">
                <Sparkline values={spark} width={80} height={6} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
