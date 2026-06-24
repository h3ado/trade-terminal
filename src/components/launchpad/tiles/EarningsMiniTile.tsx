// EARN — Compact earnings calendar.
import { useEarningsCalendar } from '@/hooks/useEarningsCalendar';

export default function EarningsMiniTile() {
  const { events, loading } = useEarningsCalendar({});
  const upcoming = events
    .filter(e => new Date(e.ts).getTime() >= Date.now() - 86_400_000)
    .slice(0, 15);

  if (loading && upcoming.length === 0) {
    return <div className="p-3 text-[9px] font-mono text-muted-foreground">Loading…</div>;
  }
  if (upcoming.length === 0) {
    return <div className="p-3 text-[9px] font-mono text-muted-foreground">No upcoming earnings</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 h-5 px-1 bg-surface-deep border-b border-border text-[8px] font-mono uppercase text-muted-foreground">
        <span className="w-14">DATE</span>
        <span className="w-12">TKR</span>
        <span className="w-10">SESS</span>
        <span className="ml-auto">EST EPS</span>
      </div>
      {upcoming.map(e => {
        const d = new Date(e.ts);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={e.id} className="flex items-center gap-2 h-5 px-1 border-b border-border/40">
            <span className="text-[9px] font-mono text-muted-foreground w-14">{date}</span>
            <span className="text-[10px] font-mono font-bold text-accent w-12">{e.ticker}</span>
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-10">{e.when || '—'}</span>
            <span className="ml-auto text-[10px] font-mono tabular-nums text-foreground">{e.eps_est != null ? e.eps_est.toFixed(2) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
