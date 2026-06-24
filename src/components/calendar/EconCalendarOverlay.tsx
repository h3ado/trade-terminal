// Fullscreen Econ + Earnings + CB calendar overlay.
// Opened via custom event 'lovable:econ-cal-open' with optional detail filters.
import { useEffect, useMemo, useState } from 'react';
import { X, Calendar as CalIcon, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useEconCalendar, applyFilters, type EconEvent, type EconKind } from '@/hooks/useEconCalendar';
import { countries } from '@/contexts/MacroCountryContext';

type Mode = 'day' | 'week' | 'month';

const KIND_LABEL: Record<EconKind, { label: string; cls: string; dot: string }> = {
  econ:     { label: 'ECON', cls: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10', dot: 'bg-cyan-400' },
  earnings: { label: 'ER',   cls: 'text-positive border-positive/40 bg-positive/10', dot: 'bg-positive' },
  cb:       { label: 'CB',   cls: 'text-violet-400 border-violet-400/40 bg-violet-400/10', dot: 'bg-violet-400' },
  geo:      { label: 'GEO',  cls: 'text-orange-400 border-orange-400/40 bg-orange-400/10', dot: 'bg-orange-400' },
};

const STAR: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★' };

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfWeek(d: Date) {
  const x = new Date(d); const dow = (x.getUTCDay() + 6) % 7; // Mon=0
  x.setUTCDate(x.getUTCDate() - dow); x.setUTCHours(0, 0, 0, 0); return x;
}
function startOfMonth(d: Date) { const x = new Date(d); x.setUTCDate(1); x.setUTCHours(0,0,0,0); return x; }

export default function EconCalendarOverlay() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('week');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [activeKinds, setActiveKinds] = useState<EconKind[]>(['econ', 'earnings', 'cb']);
  const [country, setCountry] = useState<string>('');
  const [tickerQ, setTickerQ] = useState<string>('');
  const [minImp, setMinImp] = useState<1 | 2 | 3>(1);
  const [active, setActive] = useState<EconEvent | null>(null);

  const { events, loading, fetchedAt, refetch } = useEconCalendar();

  // Listen for global open events (CLI/F-keys)
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ev = e as CustomEvent<{ mode?: Mode; ticker?: string; kind?: EconKind; country?: string; minImportance?: 1 | 2 | 3 } | undefined>;
      const d = ev.detail;
      if (d?.mode) setMode(d.mode);
      if (d?.ticker) { setTickerQ(d.ticker.toUpperCase()); setActiveKinds(['earnings']); }
      if (d?.kind) setActiveKinds([d.kind]);
      if (d?.country) setCountry(d.country.toUpperCase());
      if (d?.minImportance) setMinImp(d.minImportance);
      setOpen(true);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('lovable:econ-cal-open', onOpen);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('lovable:econ-cal-open', onOpen);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  const filtered = useMemo(() => {
    const tickers = tickerQ.trim() ? tickerQ.split(/[ ,]+/).map((t) => t.toUpperCase()).filter(Boolean) : undefined;
    return applyFilters(events, {
      kinds: activeKinds,
      countries: country ? [country] : undefined,
      tickers,
      minImportance: minImp,
    });
  }, [events, activeKinds, country, tickerQ, minImp]);

  const range = useMemo(() => {
    const start = mode === 'day' ? new Date(anchor.getTime()) : mode === 'week' ? startOfWeek(anchor) : startOfMonth(anchor);
    if (mode === 'day') start.setUTCHours(0, 0, 0, 0);
    const days = mode === 'day' ? 1 : mode === 'week' ? 7 : 35;
    const end = new Date(start.getTime() + days * 86400_000);
    return { start, end, days };
  }, [anchor, mode]);

  const inRange = useMemo(() => filtered.filter((e) => {
    const t = new Date(e.ts).getTime();
    return t >= range.start.getTime() && t < range.end.getTime();
  }), [filtered, range]);

  const byDay = useMemo(() => {
    const m: Record<string, EconEvent[]> = {};
    inRange.forEach((e) => {
      const k = isoDate(new Date(e.ts));
      (m[k] ??= []).push(e);
    });
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.ts.localeCompare(b.ts)));
    return m;
  }, [inRange]);

  if (!open) return null;

  const shiftAnchor = (dir: 1 | -1) => {
    const step = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;
    setAnchor((d) => new Date(d.getTime() + dir * step * 86400_000));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm font-mono flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-3 py-1.5 flex-shrink-0">
        <CalIcon className="w-4 h-4 text-accent" />
        <span className="text-[11px] font-bold text-accent uppercase tracking-wider">ECON · EARNINGS · CB CALENDAR</span>
        <span className="text-muted-foreground text-[10px]">·</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {isoDate(range.start)} → {isoDate(new Date(range.end.getTime() - 86400_000))}
        </span>
        {loading && <span className="text-[9px] text-accent animate-pulse ml-1">↻</span>}

        <div className="ml-auto flex items-center gap-1.5">
          {(['day', 'week', 'month'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${mode === m ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}>{m}</button>
          ))}
          <span className="text-muted-foreground text-[10px]">·</span>
          <button onClick={() => shiftAnchor(-1)} className="border border-border text-muted-foreground hover:text-accent p-0.5"><ChevronLeft className="w-3 h-3" /></button>
          <button onClick={() => setAnchor(new Date())} className="text-[9px] px-1.5 py-0.5 uppercase font-bold border border-border text-muted-foreground hover:text-accent">today</button>
          <button onClick={() => shiftAnchor(1)} className="border border-border text-muted-foreground hover:text-accent p-0.5"><ChevronRight className="w-3 h-3" /></button>
          <span className="text-muted-foreground text-[10px]">·</span>
          <button onClick={refetch} className="text-[9px] px-1.5 py-0.5 uppercase font-bold text-accent hover:underline">refresh</button>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-accent ml-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-1 text-[9px] font-mono flex-shrink-0 flex-wrap">
        <span className="text-muted-foreground uppercase">KIND</span>
        {(Object.keys(KIND_LABEL) as EconKind[]).filter((k) => k !== 'geo').map((k) => {
          const on = activeKinds.includes(k);
          return (
            <button key={k}
              onClick={() => setActiveKinds((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])}
              className={`px-1.5 py-0.5 uppercase font-bold border tabular-nums ${on ? KIND_LABEL[k].cls : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}
            >
              {KIND_LABEL[k].label}
            </button>
          );
        })}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground uppercase">IMP</span>
        {([1, 2, 3] as const).map((i) => (
          <button key={i} onClick={() => setMinImp(i)} className={`px-1.5 py-0.5 font-bold border ${minImp === i ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}>
            {STAR[i]}+
          </button>
        ))}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground uppercase">CC</span>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="bg-background border border-border text-foreground text-[9px] px-1 py-0.5">
          <option value="">ALL</option>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
        </select>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground uppercase">TICKER</span>
        <input value={tickerQ} onChange={(e) => setTickerQ(e.target.value.toUpperCase())} placeholder="AAPL,NVDA" className="bg-background border border-border text-foreground text-[9px] px-1 py-0.5 w-28 outline-none focus:border-accent" />
        <span className="text-muted-foreground ml-auto">{inRange.length} events {fetchedAt ? `· upd ${new Date(fetchedAt).toLocaleTimeString('en-GB', { hour12: false })}` : ''}</span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        {/* Grid / timeline */}
        <div className="flex-1 min-w-0 overflow-auto">
          {mode === 'day' && (
            <DayTimeline date={range.start} events={byDay[isoDate(range.start)] ?? []} onSelect={setActive} />
          )}
          {mode === 'week' && (
            <WeekGrid start={range.start} byDay={byDay} onSelect={setActive} />
          )}
          {mode === 'month' && (
            <MonthGrid start={range.start} byDay={byDay} onSelect={setActive} />
          )}
        </div>

        {/* Detail rail */}
        <aside className="w-[360px] border-l border-border bg-surface-deep flex-shrink-0 overflow-y-auto">
          {active ? <EventDetail event={active} /> : (
            <div className="p-3 text-[10px] text-muted-foreground">
              Select an event for details. <br />
              <span className="text-[9px] mt-2 block">Tip: use the CLI <span className="text-accent">/ECAL AAPL</span> or <span className="text-accent">/ECAL ★★★</span> for quick filters.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ---------- Sub-views ---------- */

function DayTimeline({ date, events, onSelect }: { date: Date; events: EconEvent[]; onSelect: (e: EconEvent) => void }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="p-2">
      <div className="text-[10px] font-mono text-accent uppercase font-bold mb-2 tabular-nums">
        {date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })} (UTC)
      </div>
      <div className="grid grid-cols-[40px_1fr] gap-0">
        {hours.map((h) => {
          const slot = events.filter((e) => new Date(e.ts).getUTCHours() === h);
          return (
            <div key={h} className="contents">
              <div className="text-[9px] font-mono text-muted-foreground border-t border-border/40 py-1 pr-1 text-right tabular-nums">{h.toString().padStart(2, '0')}:00</div>
              <div className="border-t border-border/40 py-1 pl-2 min-h-[28px] space-y-0.5">
                {slot.map((e) => <EventChip key={e.id} e={e} onClick={() => onSelect(e)} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ start, byDay, onSelect }: { start: Date; byDay: Record<string, EconEvent[]>; onSelect: (e: EconEvent) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86400_000));
  return (
    <div className="grid grid-cols-7 gap-0 h-full min-h-[600px]">
      {days.map((d) => {
        const k = isoDate(d);
        const today = isoDate(new Date()) === k;
        const list = byDay[k] ?? [];
        return (
          <div key={k} className="border-r border-border last:border-r-0 flex flex-col min-w-0">
            <div className={`px-2 py-1 border-b border-border text-[10px] font-mono uppercase tabular-nums ${today ? 'bg-accent/15 text-accent font-bold' : 'text-muted-foreground'}`}>
              {d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              <span className="ml-1 text-[8px] opacity-70">({list.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {list.map((e) => <EventChip key={e.id} e={e} onClick={() => onSelect(e)} compact />)}
              {list.length === 0 && <div className="text-[9px] text-muted-foreground/40 italic px-1 py-2">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({ start, byDay, onSelect }: { start: Date; byDay: Record<string, EconEvent[]>; onSelect: (e: EconEvent) => void }) {
  const cells = Array.from({ length: 35 }, (_, i) => new Date(start.getTime() + i * 86400_000));
  return (
    <div className="grid grid-cols-7 gap-0 h-full">
      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
        <div key={d} className="border-b border-r border-border last:border-r-0 px-2 py-1 text-[9px] font-mono uppercase font-bold text-muted-foreground">{d}</div>
      ))}
      {cells.map((d) => {
        const k = isoDate(d);
        const today = isoDate(new Date()) === k;
        const list = byDay[k] ?? [];
        return (
          <div key={k} className={`border-r border-b border-border last:border-r-0 p-1 min-h-[100px] ${today ? 'bg-accent/10' : ''}`}>
            <div className="text-[9px] font-mono text-muted-foreground mb-0.5 tabular-nums">{d.getUTCDate()}</div>
            <div className="space-y-0.5">
              {list.slice(0, 4).map((e) => <EventChip key={e.id} e={e} onClick={() => onSelect(e)} compact />)}
              {list.length > 4 && <div className="text-[8px] text-accent">+{list.length - 4} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventChip({ e, onClick, compact }: { e: EconEvent; onClick: () => void; compact?: boolean }) {
  const k = KIND_LABEL[e.kind];
  const t = new Date(e.ts);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1 py-0.5 border ${k.cls} hover:brightness-125 flex items-center gap-1 text-[9px] font-mono tabular-nums truncate`}
      title={e.label}
    >
      <span className={`w-1.5 h-1.5 ${k.dot} flex-shrink-0`} />
      <span className="opacity-70 flex-shrink-0">{formatTime(t)}</span>
      {e.country && !compact && <span className="text-muted-foreground flex-shrink-0">{e.country}</span>}
      <span className="text-accent">{STAR[e.importance]}</span>
      <span className="truncate">{e.ticker ?? e.label}</span>
    </button>
  );
}

function EventDetail({ event }: { event: EconEvent }) {
  const k = KIND_LABEL[event.kind];
  const t = new Date(event.ts);
  const surprise = event.actual != null && event.forecast != null ? (event.actual - event.forecast) : null;
  const epsSurprise = event.eps_prior != null && event.eps_est != null ? (event.eps_prior - event.eps_est) : null;
  return (
    <div className="p-3 space-y-3 text-[10px] font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`px-1 py-0.5 border ${k.cls} font-bold uppercase`}>{k.label}</span>
          <span className="text-accent">{STAR[event.importance]}</span>
          {event.country && <span className="text-muted-foreground">{event.country}</span>}
          {event.ticker && <span className="text-foreground font-bold">{event.ticker}</span>}
          <span className="text-muted-foreground ml-auto">{event.source}</span>
        </div>
        <div className="text-[12px] font-bold text-foreground leading-tight">{event.label}</div>
        <div className="text-[10px] text-muted-foreground tabular-nums">
          {t.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
          {event.when && <span className="ml-2 text-accent">[{event.when}]</span>}
        </div>
      </div>

      {(event.kind === 'econ' || event.kind === 'earnings') && (event.prior != null || event.forecast != null || event.actual != null || event.eps_est != null) && (
        <div className="grid grid-cols-3 gap-2 border border-border p-2 bg-surface-elevated/30">
          <Stat label="Prior" v={event.kind === 'earnings' ? null : event.prior} unit={event.unit} />
          <Stat label={event.kind === 'earnings' ? 'EPS Est' : 'Forecast'} v={event.kind === 'earnings' ? event.eps_est : event.forecast} unit={event.unit ?? (event.kind === 'earnings' ? '$' : null)} />
          <Stat label={event.kind === 'earnings' ? 'EPS Last' : 'Actual'} v={event.kind === 'earnings' ? event.eps_prior : event.actual} unit={event.unit ?? (event.kind === 'earnings' ? '$' : null)} highlight={(surprise ?? epsSurprise) != null} positive={(surprise ?? epsSurprise ?? 0) >= 0} />
        </div>
      )}

      {event.kind === 'cb' && (event.current_rate != null || event.est_change_bps != null) && (
        <div className="grid grid-cols-2 gap-2 border border-violet-400/40 p-2 bg-violet-400/5">
          <Stat label="Current" v={event.current_rate} unit="%" />
          <Stat label="Est Δ" v={event.est_change_bps} unit="bps" highlight positive={(event.est_change_bps ?? 0) >= 0} />
        </div>
      )}

      {event.surprise_pct != null && (
        <div className={`border p-2 ${event.surprise_pct >= 0 ? 'border-positive/40 bg-positive/10 text-positive' : 'border-negative/40 bg-negative/10 text-negative'}`}>
          <div className="text-[9px] uppercase opacity-70">Last surprise</div>
          <div className="text-[14px] font-bold tabular-nums">{event.surprise_pct >= 0 ? '+' : ''}{event.surprise_pct.toFixed(2)}%</div>
        </div>
      )}

      {event.source_url && (
        <a href={event.source_url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 text-accent hover:underline text-[10px]">
          <ExternalLink className="w-3 h-3" /> Source
        </a>
      )}

      <div className="border-t border-border pt-2 text-[9px] text-muted-foreground space-y-0.5">
        <div>id <span className="text-foreground">{event.id}</span></div>
        <div>kind <span className="text-foreground">{event.kind}</span></div>
      </div>
    </div>
  );
}

function Stat({ label, v, unit, highlight, positive }: { label: string; v?: number | null; unit?: string | null; highlight?: boolean; positive?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className={`text-[12px] font-bold tabular-nums ${highlight ? (positive ? 'text-positive' : 'text-negative') : 'text-foreground'}`}>
        {v == null ? '—' : `${unit === '$' ? '$' : ''}${v}${unit && unit !== '$' ? ' ' + unit : ''}`}
      </div>
    </div>
  );
}
