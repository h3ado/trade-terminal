// MediaStrip: unified media chrome row — tape marquee + squawk + tv + next event chip.
import { Radio, Tv, CalendarClock } from 'lucide-react';
import MarqueeTape from '@/components/terminal/MarqueeTape';
import type { NewsArticle } from '@/hooks/useGdeltNews';
import type { EconEvent } from '@/hooks/useEconCalendar';

interface Props {
  articles: NewsArticle[];
  onSelect?: (id: string) => void;
  squawkOpen: boolean;
  onToggleSquawk: () => void;
  tvOpen: boolean;
  onToggleTv: () => void;
  nextEvent?: EconEvent;
  onOpenCal?: () => void;
}

function fmtCountdown(ts: string) {
  const diff = new Date(ts).getTime() - Date.now();
  if (diff <= 0) return 'NOW';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H${m % 60}M`;
  return `${Math.floor(h / 24)}D`;
}

export default function MediaStrip({
  articles, onSelect, squawkOpen, onToggleSquawk, tvOpen, onToggleTv, nextEvent, onOpenCal,
}: Props) {
  return (
    <div className="flex items-stretch border-b border-border bg-background flex-shrink-0 min-h-[24px]">
      <div className="flex-1 min-w-0">
        <MarqueeTape articles={articles} onSelect={onSelect} />
      </div>
      <button
        onClick={onToggleSquawk}
        className={`px-2 border-l border-border flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold tracking-wider transition-colors ${
          squawkOpen ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-surface-elevated hover:text-accent'
        }`}
        title="Squawk player (F4)"
      >
        <Radio className={`w-3 h-3 ${squawkOpen ? '' : 'text-accent'}`} />
        SQK
      </button>
      <button
        onClick={onToggleTv}
        className={`px-2 border-l border-border flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold tracking-wider transition-colors ${
          tvOpen ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-surface-elevated hover:text-accent'
        }`}
        title="TV clips (F5)"
      >
        <Tv className={`w-3 h-3 ${tvOpen ? '' : 'text-accent'}`} />
        TV
      </button>
      {nextEvent && (
        <button
          onClick={onOpenCal}
          className="px-2 border-l border-border flex items-center gap-1.5 text-[9px] font-mono uppercase font-bold tracking-wider text-muted-foreground hover:bg-surface-elevated hover:text-accent transition-colors max-w-[260px]"
          title={`Next: ${nextEvent.label} (F3)`}
        >
          <CalendarClock className="w-3 h-3 text-accent" />
          <span className="text-accent">T-{fmtCountdown(nextEvent.ts)}</span>
          <span className="text-foreground truncate">{nextEvent.label}</span>
          {nextEvent.importance && nextEvent.importance >= 3 && (
            <span className="text-negative animate-pulse">★</span>
          )}
        </button>
      )}
    </div>
  );
}
