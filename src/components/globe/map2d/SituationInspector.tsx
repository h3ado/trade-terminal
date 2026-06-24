/**
 * Situation Inspector — detail card for a selected SitEvent.
 * Anchored top-right; shows title, location, category/severity chips,
 * source badge, timestamp, coordinates, and a source-link button.
 */
import { X, ExternalLink, MapPin, Clock } from 'lucide-react';
import {
  type SitEvent, type SitSeverity,
  SIT_CATEGORY_COLOR, SIT_CATEGORY_LABEL,
} from '@/hooks/useSituationEvents';

const SEV_COLOR: Record<SitSeverity, string> = {
  1: 'hsl(140 60% 45%)',
  2: 'hsl(80 70% 50%)',
  3: 'hsl(45 95% 55%)',
  4: 'hsl(25 95% 55%)',
  5: 'hsl(0 90% 55%)',
};
const SEV_LABEL: Record<SitSeverity, string> = {
  1: 'Minor', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical',
};

function ago(ts: number) {
  const m = Math.max(0, (Date.now() - ts) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)}h ago`;
  return `${(h / 24).toFixed(1)}d ago`;
}

type Props = {
  event: SitEvent | null;
  onClose: () => void;
};

export function SituationInspector({ event, onClose }: Props) {
  if (!event) return null;
  const cat = SIT_CATEGORY_COLOR[event.category];
  const sev = SEV_COLOR[event.severity];

  return (
    <div
      data-no-drag
      className="absolute right-2 top-2 z-40 w-[320px] border border-border bg-background/95 backdrop-blur font-mono text-[11px] shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          SITUATION · {event.source.toUpperCase()}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" title="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <span
            className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
            style={{ background: `${cat}22`, color: cat }}
          >
            {SIT_CATEGORY_LABEL[event.category]}
          </span>
          <span
            className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `${sev}22`, color: sev }}
          >
            S{event.severity} · {SEV_LABEL[event.severity]}
          </span>
        </div>
        <div className="text-[12px] font-bold leading-tight text-foreground">
          {event.title}
        </div>
        <div className="space-y-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">{event.location || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{ago(event.ts)} · {new Date(event.ts).toUTCString().slice(5, 22)} UTC</span>
          </div>
          <div className="tabular-nums">
            {event.lat.toFixed(3)}°, {event.lng.toFixed(3)}°
          </div>
        </div>
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-1.5 border border-border px-2 py-1.5 text-[10px] uppercase tracking-wider text-foreground hover:bg-accent/30"
          >
            <ExternalLink className="h-3 w-3" />
            Open Source
          </a>
        )}
      </div>
    </div>
  );
}
