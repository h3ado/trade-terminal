import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { events as ALL_EVENTS, type EconEvent } from '@/components/macro/EconCalendar';
import { DetailSection, DetailGrid, DetailStat, DetailKV, DetailMiniChart } from '@/components/macro/MacroExpandable';
import { ECON_IMPACT_META, type EconPin } from './layers/econPins';

/**
 * Click-through detail for a globe econ pin. Reuses the same DetailSection /
 * DetailGrid primitives that the EconCalendar's expandable row uses, so the
 * surface is identical — just rehoused in a dialog so it works over the 3D
 * canvas instead of inside a table row.
 *
 * The pin's `id` is `${country}-${date}-${time}-${index}` (see buildEconPins),
 * so we recover the underlying EconEvent by parsing the trailing index.
 */

const categoryColors: Record<string, string> = {
  'Inflation': 'text-[hsl(0,75%,65%)]',
  'Labor': 'text-[hsl(45,90%,60%)]',
  'Growth': 'text-[hsl(142,71%,55%)]',
  'Central Bank': 'text-accent',
  'Sentiment': 'text-[hsl(210,80%,65%)]',
  'Consumption': 'text-[hsl(280,65%,65%)]',
  'Housing': 'text-[hsl(28,90%,60%)]',
  'Output': 'text-[hsl(180,70%,55%)]',
};

function eventForPin(pin: EconPin | null): EconEvent | null {
  if (!pin) return null;
  // pin.id format: `${country}-${date}-${time}-${index}` — strip leading
  // segments and parse the last as an index into ALL_EVENTS.
  const parts = pin.id.split('-');
  const idx = parseInt(parts[parts.length - 1], 10);
  if (!Number.isFinite(idx) || idx < 0 || idx >= ALL_EVENTS.length) return null;
  const e = ALL_EVENTS[idx];
  // Sanity check the index actually points to the right event
  if (!e || e.country !== pin.country || e.date !== pin.date || e.time !== pin.time) {
    // Fall back to a linear scan
    return ALL_EVENTS.find(x =>
      x.country === pin.country && x.date === pin.date && x.time === pin.time && x.event === pin.event
    ) ?? null;
  }
  return e;
}

function surpriseFor(e: EconEvent): number | null {
  if (!e.actual) return null;
  const a = parseFloat(e.actual);
  const f = parseFloat(e.forecast);
  if (!Number.isFinite(a) || !Number.isFinite(f)) return null;
  return a - f;
}

interface Props {
  pin: EconPin | null;
  onClose: () => void;
}

export function EconPinDetailDialog({ pin, onClose }: Props) {
  const e = useMemo(() => eventForPin(pin), [pin]);
  const open = pin !== null;
  const surprise = e ? surpriseFor(e) : null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl bg-surface-deep border border-accent/40 font-mono p-0" aria-describedby={undefined}>
        {pin && e && (
          <>
            <DialogHeader className="px-3 py-2 bg-surface-elevated border-b border-border space-y-1">
              <DialogTitle className="flex items-center gap-2 text-[11px] uppercase">
                <span
                  className="w-2 h-2 inline-block"
                  style={{ background: ECON_IMPACT_META[e.impact] }}
                />
                <span className="text-accent">{pin.country}</span>
                <span className="text-foreground">{e.event}</span>
                <span className="ml-auto text-muted-foreground text-[10px]">
                  {e.date} {e.time}
                </span>
              </DialogTitle>
              <DialogDescription className="text-[9px] font-mono text-muted-foreground flex items-center gap-3 mt-0.5">
                <span>
                  IMPACT: <span style={{ color: ECON_IMPACT_META[e.impact] }}>{e.impact}</span>
                </span>
                <span>FCST: <span className="text-foreground">{e.forecast}</span></span>
                <span>PREV: <span className="text-foreground">{e.previous}</span></span>
                {e.actual && (
                  <span>ACT: <span className="text-foreground font-bold">{e.actual}</span></span>
                )}
                <span className="ml-auto">
                  {pin.daysFromNow === 0 ? 'TODAY' : pin.daysFromNow > 0 ? `+${pin.daysFromNow}d` : `${pin.daysFromNow}d`}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 max-h-[70vh] overflow-y-auto">
              <DetailGrid cols={3}>
                {/* Left: Description & metadata */}
                <DetailSection title="Event Details">
                  <div className="text-[9px] font-mono text-foreground/80 mb-2 leading-relaxed">{e.description}</div>
                  <DetailKV items={[
                    { label: 'Source', value: e.source },
                    { label: 'Frequency', value: e.frequency },
                    { label: 'Unit', value: e.unit },
                    { label: 'Category', value: e.category, color: categoryColors[e.category] },
                    ...(e.speakerTitle ? [{ label: 'Speaker', value: e.speakerTitle }] : []),
                  ]} />
                  {e.relatedEvents && e.relatedEvents.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[8px] text-muted-foreground mb-0.5">RELATED:</div>
                      <div className="flex flex-wrap gap-1">
                        {e.relatedEvents.map(re => (
                          <span key={re} className="text-[8px] px-1.5 py-0.5 bg-surface-elevated border border-border text-muted-foreground">{re}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </DetailSection>

                {/* Center: Consensus & surprise */}
                <DetailSection title="Consensus & Forecast">
                  {e.consensus ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <DetailStat label="Median" value={e.consensus.median} color="text-accent" />
                        <DetailStat label="Estimates" value={String(e.consensus.numEstimates)} />
                        <DetailStat label="High Est." value={e.consensus.high} color="text-positive" />
                        <DetailStat label="Low Est." value={e.consensus.low} color="text-negative" />
                      </div>
                      <div className="border border-border p-1.5">
                        <div className="text-[8px] font-mono text-muted-foreground mb-1">FORECAST RANGE</div>
                        <div className="relative h-4 bg-surface-deep border border-border">
                          <div className="absolute inset-y-0 bg-accent/15" style={{ left: '15%', right: '15%' }} />
                          <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-accent" style={{ left: '50%' }} title="Median" />
                          {e.actual && (() => {
                            const lo = parseFloat(e.consensus.low);
                            const hi = parseFloat(e.consensus.high);
                            const act = parseFloat(e.actual);
                            const range = hi - lo || 1;
                            const pct = Math.max(0, Math.min(100, ((act - lo) / range) * 70 + 15));
                            return <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground border border-accent" style={{ left: `${pct}%` }} title={`Actual: ${e.actual}`} />;
                          })()}
                        </div>
                        <div className="flex justify-between text-[7px] font-mono text-muted-foreground mt-0.5">
                          <span>{e.consensus.low}</span>
                          <span className="text-accent">{e.consensus.median}</span>
                          <span>{e.consensus.high}</span>
                        </div>
                      </div>
                      {e.actual && surprise !== null && (
                        <div className="border border-border p-1.5">
                          <div className="text-[8px] font-mono text-muted-foreground mb-0.5">SURPRISE</div>
                          <div className={`text-sm font-mono font-bold ${surprise > 0 ? 'text-positive' : surprise < 0 ? 'text-negative' : 'text-foreground'}`}>
                            {surprise > 0 ? '▲ BEAT' : surprise < 0 ? '▼ MISS' : '● INLINE'} {surprise > 0 ? '+' : ''}{surprise.toFixed(2)} {e.unit}
                          </div>
                        </div>
                      )}
                      {e.revisions && e.revisions.prevRevised && (
                        <div className="text-[8px] font-mono">
                          <span className="text-muted-foreground">Prior revised: </span>
                          <span className="text-foreground">{e.previous} → {e.revisions.prevRevised}</span>
                          <span className={`ml-1 ${e.revisions.direction === 'up' ? 'text-positive' : 'text-negative'}`}>
                            ({e.revisions.direction === 'up' ? '▲' : '▼'} revised {e.revisions.direction})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[9px] text-muted-foreground">Qualitative event — no numerical forecast</div>
                  )}
                  {e.marketReaction && (
                    <div className="border border-border p-1.5 mt-2">
                      <div className="text-[8px] font-mono text-muted-foreground mb-0.5">MARKET REACTION</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-foreground">{e.marketReaction.asset}</span>
                        <span className={`text-[9px] font-mono font-bold ${e.marketReaction.direction === 'up' ? 'text-positive' : e.marketReaction.direction === 'down' ? 'text-negative' : 'text-muted-foreground'}`}>
                          {e.marketReaction.direction === 'up' ? '▲' : e.marketReaction.direction === 'down' ? '▼' : '—'} {e.marketReaction.magnitude}
                        </span>
                      </div>
                    </div>
                  )}
                </DetailSection>

                {/* Right: History chart */}
                <DetailSection title="Recent History">
                  {e.history.length > 0 ? (
                    <>
                      <DetailMiniChart
                        data={e.history.map(h => ({ label: h.date, value: h.value }))}
                        dataKey="value"
                        labelKey="label"
                        height={120}
                      />
                      <div className="space-y-0.5 mt-2">
                        {e.history.map(h => (
                          <div key={h.date} className="flex justify-between text-[8px] font-mono">
                            <span className="text-muted-foreground">{h.date}</span>
                            <span className="text-foreground font-bold">{h.value}{e.unit !== 'Index' && e.unit !== '-' && e.unit !== 'K' && e.unit !== 'M' ? e.unit : ''}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-[9px] text-muted-foreground">No historical data for this event type</div>
                  )}
                </DetailSection>
              </DetailGrid>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
