// INDX — Index futures snapshot (sample data).
import Sparkline from '@/components/tools/widgets/Sparkline';

const FUT = [
  { sym: 'ES',  name: 'S&P 500',     last: 5240.25, pct: 0.34, spark: [5215,5220,5218,5225,5230,5235,5240] },
  { sym: 'NQ',  name: 'Nasdaq 100',  last: 18420.5, pct: 0.78, spark: [18280,18310,18290,18340,18380,18400,18420] },
  { sym: 'YM',  name: 'Dow',         last: 39150,   pct: -0.12, spark: [39200,39190,39180,39170,39160,39155,39150] },
  { sym: 'RTY', name: 'Russell 2K',  last: 2085.4,  pct: 0.91, spark: [2065,2070,2068,2074,2078,2082,2085] },
  { sym: 'CL',  name: 'WTI Crude',   last: 78.45,   pct: -1.22, spark: [79.4,79.2,79.0,78.8,78.7,78.5,78.45] },
  { sym: 'GC',  name: 'Gold',        last: 2342.8,  pct: 0.42, spark: [2330,2333,2331,2335,2338,2340,2342] },
];

export default function IndexFuturesTile() {
  return (
    <div className="h-full overflow-y-auto">
      {FUT.map(f => {
        const tone = f.pct >= 0 ? 'text-positive' : 'text-negative';
        return (
          <div key={f.sym} className="flex items-center gap-2 h-6 px-1 border-b border-border/40">
            <span className="text-[10px] font-mono font-bold text-accent w-8">{f.sym}</span>
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-16 truncate">{f.name}</span>
            <span className="text-[10px] font-mono tabular-nums text-foreground w-16 text-right">{f.last.toLocaleString()}</span>
            <Sparkline values={f.spark} width={40} height={12} />
            <span className={`ml-auto text-[10px] font-mono font-bold tabular-nums ${tone}`}>{f.pct >= 0 ? '+' : ''}{f.pct.toFixed(2)}%</span>
          </div>
        );
      })}
    </div>
  );
}
