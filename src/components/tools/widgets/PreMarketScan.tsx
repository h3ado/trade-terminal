// SCAN — Pre-market scanner. Compact blotter of gappers, unusual volume, news catalysts.
import { useMemo, useState } from 'react';
import Sparkline from './Sparkline';

type Cat = 'GAP' | 'VOL' | 'NEWS';

interface Row {
  sym: string;
  last: number;
  pct: number;
  vol: number;     // ratio to average
  cat: Cat;
  news: boolean;
  spark: number[];
}

// Deterministic sample. Replace with live feed later.
const SEED: Row[] = [
  { sym: 'NVDA', last: 870.50, pct: 4.82, vol: 3.4, cat: 'NEWS', news: true,  spark: [820,830,825,840,855,860,870] },
  { sym: 'TSLA', last: 220.80, pct: -3.15, vol: 2.1, cat: 'GAP',  news: false, spark: [232,228,225,222,224,221,220] },
  { sym: 'AMD',  last: 168.20, pct: 2.74, vol: 2.8, cat: 'VOL',  news: false, spark: [160,162,161,164,166,167,168] },
  { sym: 'AAPL', last: 195.30, pct: -0.18, vol: 1.4, cat: 'NEWS', news: true,  spark: [196,195,196,195,195,195,195] },
  { sym: 'COIN', last: 245.10, pct: 6.32, vol: 4.2, cat: 'GAP',  news: true,  spark: [228,234,238,241,243,244,245] },
  { sym: 'PLTR', last:  28.45, pct: 1.92, vol: 1.9, cat: 'VOL',  news: false, spark: [27.5,27.8,28.0,28.1,28.2,28.3,28.4] },
  { sym: 'META', last: 502.10, pct: 0.71, vol: 1.1, cat: 'GAP',  news: false, spark: [498,499,500,501,500,501,502] },
  { sym: 'MARA', last:  22.15, pct: -5.42, vol: 3.1, cat: 'VOL',  news: false, spark: [23.5,23.2,22.9,22.7,22.5,22.3,22.1] },
  { sym: 'GME',  last:  18.20, pct: 8.91, vol: 5.8, cat: 'NEWS', news: true,  spark: [16.5,17.0,17.4,17.8,17.9,18.0,18.2] },
];

const catCls: Record<Cat, string> = {
  GAP:  'text-accent border-accent/40',
  VOL:  'text-[hsl(45,100%,60%)] border-[hsl(45,100%,60%)]/40',
  NEWS: 'text-positive border-positive/40',
};

export default function PreMarketScan({ onPick }: { onPick?: (sym: string) => void } = {}) {
  const [filter, setFilter] = useState<'ALL' | Cat>('ALL');
  const rows = useMemo(() => (filter === 'ALL' ? SEED : SEED.filter(r => r.cat === filter)), [filter]);

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
        <span className="ml-auto text-[8px] font-mono text-muted-foreground/60">{rows.length} rows</span>
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

      {rows.map(r => (
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
    </div>
  );
}
