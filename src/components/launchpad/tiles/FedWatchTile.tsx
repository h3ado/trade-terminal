// FED — Fed Watch: next FOMC + implied probabilities (sample data).
const PROBS = [
  { range: '500–525', pct: 8 },
  { range: '525–550', pct: 62 },
  { range: '550–575', pct: 27 },
  { range: '575–600', pct: 3 },
];

export default function FedWatchTile() {
  const nextFomc = 'JUL 31, 2026';
  const current = '525–550 bps';
  return (
    <div className="h-full p-2 space-y-2 overflow-y-auto">
      <div className="grid grid-cols-2 gap-[1px] bg-border">
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[8px] font-mono uppercase text-muted-foreground">Next FOMC</div>
          <div className="text-[10px] font-mono font-bold text-accent">{nextFomc}</div>
        </div>
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[8px] font-mono uppercase text-muted-foreground">Current Target</div>
          <div className="text-[10px] font-mono font-bold text-foreground">{current}</div>
        </div>
      </div>
      <div>
        <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Implied Probabilities</div>
        {PROBS.map(p => (
          <div key={p.range} className="flex items-center gap-2 h-5">
            <span className="text-[10px] font-mono text-foreground w-20">{p.range}</span>
            <div className="flex-1 h-3 bg-surface-deep border border-border/40 relative">
              <div className="absolute inset-y-0 left-0 bg-accent/60" style={{ width: `${p.pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-bold tabular-nums text-accent w-10 text-right">{p.pct}%</span>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Dot Plot Δ (vs prior)</div>
        <div className="grid grid-cols-4 gap-[1px] bg-border">
          {[
            { y: '2026', delta: '+0.25' },
            { y: '2027', delta: '-0.25' },
            { y: '2028', delta: '0.00' },
            { y: 'LR',   delta: '+0.10' },
          ].map(d => (
            <div key={d.y} className="bg-surface-deep px-2 py-1">
              <div className="text-[8px] font-mono uppercase text-muted-foreground">{d.y}</div>
              <div className={`text-[10px] font-mono font-bold tabular-nums ${d.delta.startsWith('-') ? 'text-negative' : d.delta.startsWith('+') ? 'text-positive' : 'text-foreground'}`}>{d.delta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
