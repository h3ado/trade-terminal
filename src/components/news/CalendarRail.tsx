import { useEffect, useState } from 'react';
import { Calendar as CalIcon } from 'lucide-react';
import type { EconEvent } from '@/hooks/useEconCalendar';

interface Props {
  next?: EconEvent;
  upcoming: EconEvent[];
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

export default function CalendarRail({ next, upcoming }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!next) return null;
  const eta = new Date(next.ts).getTime() - Date.now();
  const live = eta <= 0 && eta > -3 * 3600_000;

  return (
    <div className="flex items-center gap-2 px-2 py-0.5 border-b border-border bg-surface-deep text-[10px] font-mono">
      <CalIcon className="w-3 h-3 text-accent" />
      <span className="text-accent uppercase font-bold">CAL</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-foreground font-bold">Next: {next.label}</span>
      <span className={`uppercase font-bold ${live ? 'text-accent animate-pulse' : 'text-muted-foreground'}`}>
        {formatCountdown(eta)}
      </span>
      <div className="ml-auto flex items-center gap-2 overflow-hidden">
        {upcoming.slice(1, 5).map((r) => (
          <span key={r.id} className="text-muted-foreground truncate">
            {r.label} · {new Date(r.ts).toISOString().slice(5, 10)}
          </span>
        ))}
      </div>
    </div>
  );
}
