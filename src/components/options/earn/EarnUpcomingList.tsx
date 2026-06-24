import { useEarningsCalendar, EarnFilter } from '@/hooks/useEarningsCalendar';

interface Props {
  filter: EarnFilter;
  activeTicker: string;
  onPick: (t: string) => void;
}

function fmt(ts: string) {
  const d = new Date(ts);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export default function EarnUpcomingList({ filter, activeTicker, onPick }: Props) {
  const { events, loading } = useEarningsCalendar(filter);

  return (
    <div className="card-terminal flex flex-col h-full min-h-0">
      <div className="px-2 py-1 border-b border-border flex items-baseline gap-2 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold text-accent">UPCOMING</span>
        <span className="text-[9px] font-mono text-muted-foreground">
          {loading ? 'loading…' : `${events.length} prints`}
        </span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        {events.length === 0 && !loading && (
          <div className="px-2 py-3 text-[10px] font-mono text-muted-foreground">No matches.</div>
        )}
        {events.slice(0, 200).map((ev) => {
          const active = ev.ticker === activeTicker;
          return (
            <button
              key={ev.id}
              onClick={() => onPick(ev.ticker)}
              className={`w-full text-left px-2 py-1 border-b border-border/40 hover:bg-surface-elevated flex items-center gap-2 ${
                active ? 'bg-surface-elevated' : ''
              }`}
            >
              <span className={`text-[10px] font-mono font-bold ${active ? 'text-accent' : 'text-foreground'} w-14 truncate`}>
                {ev.ticker}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground w-10">{fmt(ev.ts)}</span>
              <span className={`text-[8px] font-mono px-1 border ${ev.when === 'BMO' ? 'border-up text-up' : ev.when === 'AMC' ? 'border-down text-down' : 'border-border text-muted-foreground'}`}>
                {ev.when ?? 'TNS'}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground ml-auto">
                {'★'.repeat(ev.importance)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
