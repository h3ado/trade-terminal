// MOVR — Top gainers and losers (sample data).
import Sparkline from '@/components/tools/widgets/Sparkline';

const GAINERS = [
  { sym: 'NVDA', last: 870.50, pct: 4.82, spark: [820,830,825,840,855,860,870] },
  { sym: 'COIN', last: 245.10, pct: 6.32, spark: [228,234,238,241,243,244,245] },
  { sym: 'GME',  last: 18.20,  pct: 8.91, spark: [16.5,17.0,17.4,17.8,17.9,18.0,18.2] },
  { sym: 'AMD',  last: 168.20, pct: 2.74, spark: [160,162,161,164,166,167,168] },
  { sym: 'META', last: 502.10, pct: 0.71, spark: [498,499,500,501,500,501,502] },
];
const LOSERS = [
  { sym: 'TSLA', last: 220.80, pct: -3.15, spark: [232,228,225,222,224,221,220] },
  { sym: 'MARA', last: 22.15,  pct: -5.42, spark: [23.5,23.2,22.9,22.7,22.5,22.3,22.1] },
  { sym: 'BA',   last: 178.40, pct: -2.10, spark: [184,182,181,180,179,178.5,178.4] },
  { sym: 'XOM',  last: 110.20, pct: -1.85, spark: [113,112,111.5,111,110.8,110.5,110.2] },
  { sym: 'AAPL', last: 195.30, pct: -0.18, spark: [196,195,196,195,195,195,195] },
];

function Row({ r, neg }: { r: typeof GAINERS[number]; neg?: boolean }) {
  const tone = neg ? 'text-negative' : 'text-positive';
  return (
    <div className="flex items-center gap-2 h-5 px-1 border-b border-border/40">
      <span className="text-[10px] font-mono font-bold text-foreground w-12">{r.sym}</span>
      <span className="text-[10px] font-mono tabular-nums text-foreground w-14 text-right">{r.last.toFixed(2)}</span>
      <Sparkline values={r.spark} tone={neg ? 'neg' : 'pos'} width={40} height={10} />
      <span className={`ml-auto text-[10px] font-mono font-bold tabular-nums ${tone}`}>{r.pct >= 0 ? '+' : ''}{r.pct.toFixed(2)}%</span>
    </div>
  );
}

export default function MoversTile() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-1 py-0.5 text-[8px] font-mono uppercase text-positive bg-positive/10">Top Gainers</div>
      {GAINERS.map(r => <Row key={r.sym} r={r} />)}
      <div className="px-1 py-0.5 text-[8px] font-mono uppercase text-negative bg-negative/10 mt-1">Top Losers</div>
      {LOSERS.map(r => <Row key={r.sym} r={r} neg />)}
    </div>
  );
}
