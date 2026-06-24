// CFTC — Compact COT net positioning (sample bars).
const ROWS = [
  { sym: 'ES',  name: 'S&P 500 Mini', net: 42_310,  chg:  3_120 },
  { sym: 'NQ',  name: 'Nasdaq Mini',  net: 18_540,  chg: -1_240 },
  { sym: 'CL',  name: 'WTI Crude',    net: 215_400, chg:  8_300 },
  { sym: 'GC',  name: 'Gold',         net: 142_800, chg:   980 },
  { sym: 'SI',  name: 'Silver',       net:  38_410, chg: -2_410 },
  { sym: 'ZB',  name: 'US 30Y Bonds', net: -84_120, chg: -3_410 },
  { sym: 'ZN',  name: 'US 10Y Notes', net: -212_400,chg:  4_120 },
  { sym: '6E',  name: 'Euro FX',      net:  31_240, chg:  1_120 },
  { sym: '6J',  name: 'Yen',          net: -98_200, chg: -2_810 },
];

const MAX = 250_000;

export default function CftcTile() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 h-5 px-1 bg-surface-deep border-b border-border text-[8px] font-mono uppercase text-muted-foreground">
        <span className="w-10">SYM</span>
        <span className="w-20">NAME</span>
        <span className="flex-1 text-center">NET POSITION</span>
        <span className="w-16 text-right">CHG W/W</span>
      </div>
      {ROWS.map(r => {
        const w = Math.min(100, (Math.abs(r.net) / MAX) * 100);
        const pos = r.net >= 0;
        return (
          <div key={r.sym} className="flex items-center gap-2 h-6 px-1 border-b border-border/40">
            <span className="text-[10px] font-mono font-bold text-accent w-10">{r.sym}</span>
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-20 truncate">{r.name}</span>
            <div className="flex-1 h-3 relative bg-surface-deep border border-border/40 flex">
              <div className="w-1/2 flex justify-end">
                {!pos && <div className="h-full bg-negative/60" style={{ width: `${w}%` }} />}
              </div>
              <div className="w-px bg-border" />
              <div className="w-1/2">
                {pos && <div className="h-full bg-positive/60" style={{ width: `${w}%` }} />}
              </div>
            </div>
            <span className={`w-16 text-right text-[10px] font-mono tabular-nums ${r.chg >= 0 ? 'text-positive' : 'text-negative'}`}>{r.chg >= 0 ? '+' : ''}{r.chg.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
