// MOVR — live top gainers & losers from the pre-market scanner.
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import Sparkline from '@/components/tools/widgets/Sparkline';

type ScanRow = { sym: string; last: number; pct: number; vol: number; cat: string; spark: number[] };

function Row({ r, neg }: { r: ScanRow; neg?: boolean }) {
  return (
    <div className="flex items-center gap-2 h-5 px-1 border-b border-border/40 hover:bg-surface-elevated">
      <span className="text-[10px] font-mono font-bold text-foreground w-12">{r.sym}</span>
      <span className="text-[10px] font-mono tabular-nums text-foreground w-14 text-right">{r.last.toFixed(2)}</span>
      <Sparkline values={r.spark} tone={neg ? 'neg' : 'pos'} width={40} height={10} />
      <span className={`ml-auto text-[10px] font-mono font-bold tabular-nums ${neg ? 'text-negative' : 'text-positive'}`}>
        {r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%
      </span>
    </div>
  );
}

export default function MoversTile() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ rows?: ScanRow[] }>('/api/market/scanner/premarket');
        if (!cancelled) { setRows(data?.rows ?? []); setLoading(false); }
      } catch { if (!cancelled) setLoading(false); }
    };
    load();
    const id = setInterval(load, 120_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading && rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[9px] font-mono text-muted-foreground animate-pulse">
        LOADING…
      </div>
    );
  }

  const gainers = rows.filter(r => r.pct > 0).slice(0, 5);
  const losers  = rows.filter(r => r.pct < 0).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-1 py-0.5 text-[8px] font-mono uppercase text-positive bg-positive/10 flex justify-between">
        <span>Top Gainers</span>
        {loading && <span className="text-accent">···</span>}
      </div>
      {gainers.length > 0
        ? gainers.map(r => <Row key={r.sym} r={r} />)
        : <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground italic">No movers · configure API key</div>}
      <div className="px-1 py-0.5 text-[8px] font-mono uppercase text-negative bg-negative/10 mt-1">Top Losers</div>
      {losers.length > 0
        ? losers.map(r => <Row key={r.sym} r={r} neg />)
        : <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground italic">No movers · configure API key</div>}
    </div>
  );
}
