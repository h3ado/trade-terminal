/**
 * Situation Feed — left-docked panel inspired by monitor-the-situation.com.
 * Lists merged events from useSituationEvents() with category/severity chips
 * and "X minutes ago" stamps. Tabs: Feed (all) / Live (last 1h) / Reports
 * (severity ≥ S3). Click an event to fly the camera to it.
 */
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { type SitEvent, type SitCategory, type SitSeverity, SIT_CATEGORY_COLOR, SIT_CATEGORY_LABEL } from '@/hooks/useSituationEvents';

const SEV_COLOR: Record<SitSeverity, string> = {
  1: 'hsl(140 60% 45%)',
  2: 'hsl(80 70% 50%)',
  3: 'hsl(45 95% 55%)',
  4: 'hsl(25 95% 55%)',
  5: 'hsl(0 90% 55%)',
};

function ago(ts: number): string {
  const m = Math.max(0, (Date.now() - ts) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

type Props = {
  events: SitEvent[];
  enabled: boolean;
  enabledCategories: Set<SitCategory>;
  minSeverity: SitSeverity;
  onSelect: (e: SitEvent) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function SituationFeedPanel({
  events, enabled, enabledCategories, minSeverity, onSelect,
  collapsed, onToggleCollapsed,
}: Props) {
  const [tab, setTab] = useState<'feed' | 'live' | 'reports'>('feed');

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter(e => {
      if (!enabledCategories.has(e.category)) return false;
      if (e.severity < minSeverity) return false;
      if (tab === 'live' && now - e.ts > 60 * 60_000) return false;
      if (tab === 'reports' && e.severity < 3) return false;
      return true;
    });
  }, [events, enabledCategories, minSeverity, tab]);

  if (!enabled) return null;

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        data-no-drag
        className="absolute left-2 top-2 z-30 flex items-center gap-2 border border-border bg-background/85 backdrop-blur px-3 py-2 font-mono text-[11px] tracking-wider text-foreground hover:bg-background"
        title="Open situation feed"
      >
        <Activity className="h-3.5 w-3.5" style={{ color: 'hsl(0 84% 55%)' }} />
        FEED · {filtered.length}
        <ChevronRight className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div
      data-no-drag
      className="absolute left-2 top-2 z-30 flex h-[calc(100%-90px)] w-[320px] flex-col border border-border bg-background/95 backdrop-blur font-mono text-[11px]"
      style={{ minWidth: 280 }}
    >
      <div className="flex items-center gap-1 border-b border-border px-1 py-1">
        {(['feed', 'live', 'reports'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2 py-1 text-[10px] uppercase tracking-wider ${
              tab === t ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-1 text-muted-foreground">
          <span>{filtered.length} events</span>
          <button
            onClick={onToggleCollapsed}
            className="hover:text-foreground"
            title="Collapse"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No events match the current filters.
          </div>
        ) : (
          filtered.slice(0, 200).map(e => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="block w-full border-b border-border/40 px-2 py-2 text-left hover:bg-accent/30"
            >
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
                <span
                  className="inline-flex items-center gap-1 px-1 py-0.5"
                  style={{ background: `${SIT_CATEGORY_COLOR[e.category]}22`, color: SIT_CATEGORY_COLOR[e.category] }}
                >
                  {SIT_CATEGORY_LABEL[e.category]}
                </span>
                <span
                  className="px-1 py-0.5 font-bold"
                  style={{ background: `${SEV_COLOR[e.severity]}22`, color: SEV_COLOR[e.severity] }}
                >
                  S{e.severity}
                </span>
                <span className="ml-auto text-muted-foreground normal-case">{ago(e.ts)}</span>
              </div>
              <div className="mt-1 text-[11px] leading-tight text-foreground line-clamp-2">
                {e.title}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>📍</span>
                <span className="truncate">{e.location || '—'}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
