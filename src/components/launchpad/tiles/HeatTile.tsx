// HEAT — sector performance heatmap.
const SECTORS = [
  { sym: 'XLK', name: 'Technology', pct: 1.42 },
  { sym: 'XLF', name: 'Financials', pct: 0.31 },
  { sym: 'XLE', name: 'Energy', pct: -1.85 },
  { sym: 'XLV', name: 'Health Care', pct: 0.62 },
  { sym: 'XLY', name: 'Cons. Disc.', pct: 0.94 },
  { sym: 'XLP', name: 'Cons. Staples', pct: -0.18 },
  { sym: 'XLI', name: 'Industrials', pct: 0.45 },
  { sym: 'XLB', name: 'Materials', pct: -0.72 },
  { sym: 'XLRE', name: 'Real Estate', pct: -0.34 },
  { sym: 'XLU', name: 'Utilities', pct: 0.21 },
  { sym: 'XLC', name: 'Comm. Svcs', pct: 1.08 },
];

function tone(p: number) {
  if (p >= 1.5) return 'bg-positive/60 text-foreground';
  if (p >= 0.5) return 'bg-positive/35 text-positive';
  if (p > 0)    return 'bg-positive/15 text-positive';
  if (p > -0.5) return 'bg-negative/15 text-negative';
  if (p > -1.5) return 'bg-negative/35 text-negative';
  return 'bg-negative/60 text-foreground';
}

export default function HeatTile() {
  return (
    <div className="h-full p-1 grid grid-cols-3 gap-[2px] auto-rows-fr">
      {SECTORS.map(s => (
        <div key={s.sym} className={`flex flex-col items-center justify-center px-1 ${tone(s.pct)}`}>
          <div className="text-[10px] font-mono font-bold tabular-nums">{s.sym}</div>
          <div className="text-[8px] font-mono uppercase opacity-70 truncate w-full text-center">{s.name}</div>
          <div className="text-[11px] font-mono font-bold tabular-nums">{s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%</div>
        </div>
      ))}
    </div>
  );
}
