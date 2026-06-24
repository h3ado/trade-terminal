/**
 * Situation Overlays — bottom-center docked panel inspired by
 * monitor-the-situation.com. Category checkboxes (with live counts), Min.
 * Severity S1..S5 buttons, and a time-window selector.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  type SitEvent, type SitCategory, type SitSeverity,
  SIT_CATEGORY_COLOR, SIT_CATEGORY_LABEL,
} from '@/hooks/useSituationEvents';

const ALL_CATS: SitCategory[] = ['conflict', 'political', 'humanitarian', 'economic', 'disaster'];
const SEV_COLOR: Record<SitSeverity, string> = {
  1: 'hsl(140 60% 45%)',
  2: 'hsl(80 70% 50%)',
  3: 'hsl(45 95% 55%)',
  4: 'hsl(25 95% 55%)',
  5: 'hsl(0 90% 55%)',
};

export type SitRegionPreset = {
  id: string; label: string; lat: number; lng: number; zoom: number;
};

export const SIT_REGION_PRESETS: SitRegionPreset[] = [
  { id: 'eu-east', label: 'E. Europe', lat: 49, lng: 32, zoom: 4.2 },
  { id: 'mena',    label: 'MENA',      lat: 28, lng: 40, zoom: 3.4 },
  { id: 'sahel',   label: 'Sahel',     lat: 14, lng: 5,  zoom: 3.6 },
  { id: 'easia',   label: 'E. Asia',   lat: 28, lng: 118, zoom: 3.4 },
  { id: 'global',  label: 'Global',    lat: 15, lng: 10, zoom: 1.6 },
];

type Props = {
  events: SitEvent[];
  enabled: boolean;
  enabledCategories: Set<SitCategory>;
  onToggleCategory: (c: SitCategory) => void;
  minSeverity: SitSeverity;
  onMinSeverity: (s: SitSeverity) => void;
  windowH: 1 | 6 | 24 | 168;
  onWindowH: (h: 1 | 6 | 24 | 168) => void;
  onRegionPreset: (p: SitRegionPreset) => void;
};

export function SituationOverlaysPanel({
  events, enabled, enabledCategories, onToggleCategory,
  minSeverity, onMinSeverity, windowH, onWindowH, onRegionPreset,
}: Props) {
  const [open, setOpen] = useState(true);

  const counts = useMemo(() => {
    const cutoff = Date.now() - windowH * 3_600_000;
    const out: Record<SitCategory, number> = {
      conflict: 0, political: 0, humanitarian: 0, economic: 0, disaster: 0,
    };
    for (const e of events) {
      if (e.ts < cutoff) continue;
      if (e.severity < minSeverity) continue;
      out[e.category] = (out[e.category] ?? 0) + 1;
    }
    return out;
  }, [events, windowH, minSeverity]);

  if (!enabled) return null;

  return (
    <div
      data-no-drag
      className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 border border-border bg-background/95 backdrop-blur font-mono text-[11px]"
      style={{ width: 280 }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between border-b border-border px-2 py-1.5 text-[10px] uppercase tracking-wider text-foreground hover:bg-accent/30"
      >
        <span>OVERLAYS · {windowH}H</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
      {open && (
        <div className="space-y-2 p-2">
          <div className="flex items-center gap-1">
            {([1, 6, 24, 168] as const).map(h => (
              <button
                key={h}
                onClick={() => onWindowH(h)}
                className={`flex-1 px-1 py-1 text-[10px] uppercase tracking-wider ${
                  windowH === h ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {h === 168 ? '7D' : `${h}H`}
              </button>
            ))}
          </div>
          <div className="border-t border-border pt-2">
            <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">CATEGORIES</div>
            {ALL_CATS.map(c => {
              const on = enabledCategories.has(c);
              return (
                <label
                  key={c}
                  className="flex cursor-pointer items-center gap-2 py-0.5 hover:bg-accent/20"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: SIT_CATEGORY_COLOR[c] }}
                  />
                  <span className="flex-1 text-[11px]">{SIT_CATEGORY_LABEL[c]}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{counts[c] ?? 0}</span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggleCategory(c)}
                    className="h-3 w-3 accent-primary"
                  />
                </label>
              );
            })}
          </div>
          <div className="border-t border-border pt-2">
            <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">MIN. SEVERITY</div>
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onMinSeverity(s)}
                  className={`flex-1 py-1 text-[10px] font-bold ${
                    minSeverity === s ? 'text-background' : 'text-foreground/70 hover:text-foreground'
                  }`}
                  style={{
                    background: minSeverity === s ? SEV_COLOR[s] : `${SEV_COLOR[s]}22`,
                  }}
                >
                  S{s}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-2">
            <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">REGION PRESETS</div>
            <div className="grid grid-cols-3 gap-1">
              {SIT_REGION_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => onRegionPreset(p)}
                  className="px-1 py-1 text-[10px] uppercase tracking-wider text-foreground/80 border border-border hover:bg-accent/30 hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
