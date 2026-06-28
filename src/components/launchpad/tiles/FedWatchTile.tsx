// FED — Fed Watch: real FOMC dates from CB calendar + real Fed Funds rate from FRED.
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar, applyFilters } from '@/hooks/useEconCalendar';

// Implied probability bars are illustrative (CME FedWatch requires a paid feed).
const PROBS = [
  { range: '500–525', pct: 8 },
  { range: '525–550', pct: 62 },
  { range: '550–575', pct: 27 },
  { range: '575–600', pct: 3 },
];

export default function FedWatchTile() {
  const { byKey, loading: fredLoading } = useFRED();
  const { events, loading: calLoading } = useEconCalendar();

  const fedFunds = byKey['fed_funds'];
  const rateVal  = fedFunds?.value;

  const cbEvents = applyFilters(events, { kinds: ['cb'] });
  const now = Date.now();
  const nextFomc = cbEvents
    .filter(e => new Date(e.ts).getTime() > now)
    .sort((a, b) => a.ts.localeCompare(b.ts))[0];

  const nextDateStr = nextFomc
    ? new Date(nextFomc.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : (calLoading ? '···' : 'TBD');

  const currentStr = rateVal != null
    ? `${(rateVal * 100).toFixed(0)} bps (${rateVal.toFixed(2)}%)`
    : (fredLoading ? '···' : '—');

  const estChange = nextFomc?.est_change_bps;

  return (
    <div className="h-full p-2 space-y-2 overflow-y-auto">
      <div className="grid grid-cols-2 gap-[1px] bg-border">
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[8px] font-mono uppercase text-muted-foreground">Next FOMC</div>
          <div className="text-[10px] font-mono font-bold text-accent">{nextDateStr}</div>
          {estChange != null && (
            <div className={`text-[9px] font-mono ${estChange < 0 ? 'text-positive' : estChange > 0 ? 'text-negative' : 'text-muted-foreground'}`}>
              {estChange > 0 ? '+' : ''}{estChange} bps implied
            </div>
          )}
        </div>
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[8px] font-mono uppercase text-muted-foreground">Fed Funds Rate</div>
          <div className="text-[10px] font-mono font-bold text-foreground">{currentStr}</div>
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1 flex justify-between">
          <span>Implied Probabilities</span>
          <span className="text-[8px] opacity-50">indicative</span>
        </div>
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
        <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Upcoming CB Events</div>
        {cbEvents.slice(0, 4).map(e => {
          const d = new Date(e.ts);
          const label = e.label.length > 28 ? e.label.slice(0, 28) + '…' : e.label;
          return (
            <div key={e.id} className="flex items-center gap-2 h-5 border-b border-border/30">
              <span className="text-[9px] font-mono text-muted-foreground w-14">
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[9px] font-mono text-foreground truncate flex-1">{label}</span>
            </div>
          );
        })}
        {cbEvents.length === 0 && !calLoading && (
          <div className="text-[9px] font-mono text-muted-foreground italic">No CB events loaded</div>
        )}
      </div>
    </div>
  );
}
