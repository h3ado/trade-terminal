// Sticky countdown strip: next 3 high-importance econ/earnings/cb events.
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { EconEvent } from '@/hooks/useEconCalendar';

interface Props {
  events: EconEvent[];
  onOpen?: () => void;
}

function countdown(ms: number): string {
  if (ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const STAR: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★' };
const KIND_CLS: Record<string, string> = {
  cb: 'text-violet-400 border-violet-400/40',
  earnings: 'text-positive border-positive/40',
  econ: 'text-cyan-400 border-cyan-400/40',
  geo: 'text-orange-400 border-orange-400/40',
};

export default function CountdownStrip({ events, onOpen }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.ts).getTime() >= now - 60_000)
    .filter((e) => e.importance >= 2 || e.kind === 'cb')
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-2 py-0.5 text-[10px] font-mono flex-shrink-0">
      <button onClick={onOpen} className="flex items-center gap-1 text-accent hover:underline">
        <Clock className="w-3 h-3" />
        <span className="uppercase font-bold">CAL</span>
      </button>
      <span className="text-muted-foreground">·</span>
      <div className="flex items-center gap-3 overflow-x-auto flex-1 min-w-0">
        {upcoming.map((e) => {
          const eta = new Date(e.ts).getTime() - now;
          const cls = KIND_CLS[e.kind] ?? 'text-foreground border-border';
          const live = eta <= 0 && eta > -2 * 3600_000;
          return (
            <button
              key={e.id}
              onClick={onOpen}
              className={`flex items-center gap-1.5 border px-1 py-0.5 hover:bg-surface-elevated tabular-nums ${cls}`}
              title={e.label}
            >
              <span className="text-[8px] uppercase font-bold opacity-70">{e.kind}</span>
              <span className="text-[8px] text-accent">{STAR[e.importance]}</span>
              {e.country && <span className="text-[8px] text-muted-foreground">{e.country}</span>}
              <span className="text-foreground truncate max-w-[140px]">{e.ticker ?? e.label}</span>
              <span className={`font-bold ${live ? 'text-positive animate-pulse' : 'text-accent'}`}>{countdown(eta)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
