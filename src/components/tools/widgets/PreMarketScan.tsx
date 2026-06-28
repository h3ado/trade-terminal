// SCAN — Pre-market scanner. Live gappers and unusual volume via backend API.
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import Sparkline from './Sparkline';

type Cat = 'GAP' | 'VOL' | 'NEWS';

interface Row {
  sym: string;
  last: number;
  pct: number;
  vol: number;
  cat: Cat;
  news: boolean;
  spark: number[];
}

const catCls: Record<Cat, string> = {
  GAP:  'text-accent border-accent/40',
  VOL:  'text-[hsl(45,100%,60%)] border-[hsl(45,100%,60%)]/40',
  NEWS: 'text-positive border-positive/40',
};

const REFRESH_MS = 2 * 60_000;

export default function PreMarketScan({ onPick }: { onPick?: (sym: string) => void } = {}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [ts, setTs] = useState<number | null>(null);
  const [filter, setFilter] = useState<'ALL' | Cat>('ALL');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ rows?: Row[]; ts?: number }>('/api/market/scanner/premarket');
        if (!cancelled) {
          setRows((data?.rows ?? []) as Row[]);
          setTs(data?.ts ?? null);
        }
      } catch {
        // keep prior rows
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const visible = useMemo(() => (filter === 'ALL' ? rows : rows.filter(r => r.cat === filter)), [filter, rows]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="text-[9px] font-mono text-muted-foreground animate-pulse">SCANNING…</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {(['ALL', 'GAP', 'VOL', 'NEWS'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
              filter === f ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted-foreground border-border hover:bg-surface-elevated'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[8px] font-mono text-muted-foreground/60">
          {visible.length} rows {ts ? `· ${new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>

      <div className="grid grid-cols-[44px_56px_50px_44px_36px_30px_14px] gap-1 px-1 py-1 border-b border-border bg-surface-deep">
        <span className="text-[8px] font-mono uppercase text-muted-foreground">Sym</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">Last</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">%Chg</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">Vol×</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground" />
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-center">Cat</span>
        <span />
      </div>

      {visible.map(r => (
        <button
          key={r.sym}
          onClick={() => onPick?.(r.sym)}
          className="w-full grid grid-cols-[44px_56px_50px_44px_36px_30px_14px] gap-1 px-1 py-1 border-b border-border/40 hover:bg-surface-elevated text-left items-center"
        >
          <span className="text-[10px] font-mono font-bold text-foreground truncate">{r.sym}</span>
          <span className="text-[10px] font-mono tabular-nums text-foreground text-right">{r.last.toFixed(2)}</span>
          <span className={`text-[10px] font-mono font-bold tabular-nums text-right ${r.pct >= 0 ? 'text-positive' : 'text-negative'}`}>
            {r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%
          </span>
          <span className={`text-[10px] font-mono tabular-nums text-right ${r.vol >= 3 ? 'text-accent font-bold' : 'text-muted-foreground'}`}>
            {r.vol.toFixed(1)}×
          </span>
          <Sparkline values={r.spark} width={36} height={12} tone="auto" />
          <span className={`text-[8px] font-mono font-bold text-center border px-0.5 ${catCls[r.cat]}`}>{r.cat}</span>
          <span className={`w-1.5 h-1.5 justify-self-center rounded-full ${r.news ? 'bg-accent' : 'bg-border'}`} />
        </button>
      ))}

      {visible.length === 0 && !loading && (
        <div className="px-2 py-3 text-[9px] font-mono text-muted-foreground text-center">
          No movers — configure TWELVE_DATA_API_KEY or FINNHUB_API_KEY for live data
        </div>
      )}
    </div>
  );
}
