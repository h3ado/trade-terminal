// ECON — Compact econ calendar (next events).
import { useEconCalendar, useNextEvents } from '@/hooks/useEconCalendar';

export default function EconMiniTile() {
  const { events, loading } = useEconCalendar();
  const next = useNextEvents(events.filter(e => e.kind === 'econ'), 12);

  if (loading && next.length === 0) {
    return <div className="p-3 text-[9px] font-mono text-muted-foreground">Loading…</div>;
  }
  if (next.length === 0) {
    return <div className="p-3 text-[9px] font-mono text-muted-foreground">No upcoming events</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      {next.map(ev => {
        const d = new Date(ev.ts);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const tone = ev.importance === 3 ? 'text-negative' : ev.importance === 2 ? 'text-accent' : 'text-muted-foreground';
        return (
          <div key={ev.id} className="flex items-center gap-2 h-6 px-1 border-b border-border/40">
            <span className="text-[9px] font-mono text-muted-foreground w-12">{date}</span>
            <span className="text-[9px] font-mono tabular-nums text-foreground w-10">{time}</span>
            <span className={`text-[9px] font-mono font-bold w-6 ${tone}`}>{(ev.country || '').slice(0,3)}</span>
            <span className="text-[10px] font-mono text-foreground truncate flex-1">{ev.label}</span>
          </div>
        );
      })}
    </div>
  );
}
