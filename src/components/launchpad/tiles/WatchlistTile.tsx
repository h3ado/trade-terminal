// WATCH — Compact watchlist (sample data; editable later).
import Sparkline from '@/components/tools/widgets/Sparkline';

const WATCH = [
  { sym: 'SPY', last: 524.10, pct: 0.42, spark: [521,522,521.5,523,523.5,523.8,524.1] },
  { sym: 'QQQ', last: 448.30, pct: 0.81, spark: [444,445,444.5,446,447,447.8,448.3] },
  { sym: 'NVDA',last: 870.50, pct: 4.82, spark: [820,830,825,840,855,860,870] },
  { sym: 'TSLA',last: 220.80, pct: -3.15,spark: [232,228,225,222,224,221,220] },
  { sym: 'AAPL',last: 195.30, pct: -0.18,spark: [196,195,196,195,195,195,195] },
  { sym: 'MSFT',last: 425.10, pct: 0.62, spark: [422,423,422.5,424,424.5,424.8,425.1] },
  { sym: 'GOOG',last: 178.40, pct: 1.12, spark: [176.5,177,176.8,177.5,178,178.2,178.4] },
  { sym: 'BTC', last: 67430,  pct: 2.41, spark: [65800,66100,66000,66500,67000,67200,67430] },
];

export default function WatchlistTile() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 h-5 px-1 bg-surface-deep border-b border-border text-[8px] font-mono uppercase text-muted-foreground">
        <span className="w-12">SYM</span>
        <span className="w-16 text-right">LAST</span>
        <span className="w-10">TREND</span>
        <span className="ml-auto">%CHG</span>
      </div>
      {WATCH.map(r => {
        const tone = r.pct >= 0 ? 'text-positive' : 'text-negative';
        return (
          <div key={r.sym} className="flex items-center gap-2 h-6 px-1 border-b border-border/40 hover:bg-surface-elevated">
            <span className="text-[10px] font-mono font-bold text-foreground w-12">{r.sym}</span>
            <span className="text-[10px] font-mono tabular-nums text-foreground w-16 text-right">{r.last.toLocaleString()}</span>
            <Sparkline values={r.spark} width={40} height={12} />
            <span className={`ml-auto text-[10px] font-mono font-bold tabular-nums ${tone}`}>{r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%</span>
          </div>
        );
      })}
    </div>
  );
}
