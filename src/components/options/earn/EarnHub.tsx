// Earnings Hub — opened via `EARN` CLI command.
import { useEffect, useMemo, useState } from 'react';
import EarnPlaybook from './EarnPlaybook';
import EarnHistoryTable from './EarnHistoryTable';
import EarnCalendarRail from './EarnCalendarRail';
import EarnStructureSuggest from './EarnStructureSuggest';
import EarnUpcomingList from './EarnUpcomingList';
import EarnCrushPanel from './EarnCrushPanel';
import EarnScenarioGrid from './EarnScenarioGrid';
import EarnNewsList from './EarnNewsList';
import type { EarnFilter } from '@/hooks/useEarningsCalendar';

interface Props {
  ticker: string;
  onTickerChange: (t: string) => void;
  filter?: EarnFilter;
  redact?: boolean;
}

const HUB_TABS = [
  { id: 'play', label: 'Playbook' },
  { id: 'hist', label: 'History' },
  { id: 'crush', label: 'IV Crush' },
  { id: 'scen', label: 'Scenarios' },
  { id: 'news', label: 'News' },
] as const;

type HubTab = (typeof HUB_TABS)[number]['id'];

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export default function EarnHub({ ticker, onTickerChange, filter, redact = false }: Props) {
  const [tab, setTab] = useState<HubTab>('play');

  // Deterministic header context for ticker.
  const ctx = useMemo(() => {
    const r = rng(hash(ticker + ':earn'));
    const dte = Math.floor(r() * 30) + 2;
    const date = new Date(Date.now() + dte * 86400000);
    const spot = +(50 + r() * 600).toFixed(2);
    const im = +(2.5 + r() * 6).toFixed(2);
    const straddle = +((spot * im) / 100).toFixed(2);
    const ivr = Math.round(20 + r() * 75);
    const hist = +(im * (0.7 + r() * 0.6)).toFixed(2);
    const session: 'BMO' | 'AMC' = r() > 0.5 ? 'AMC' : 'BMO';
    return { dte, date, spot, im, straddle, ivr, hist, session };
  }, [ticker]);

  // Countdown ticker
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-2">
      {/* Header strip */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-px bg-border border border-border">
        {[
          { l: 'Ticker', v: ticker, c: 'text-accent' },
          { l: 'Next print', v: `${ctx.date.getUTCMonth() + 1}/${ctx.date.getUTCDate()} ${ctx.session}` },
          { l: 'DTE', v: `${ctx.dte}d`, c: 'text-accent' },
          { l: 'Spot', v: redact ? '••' : ctx.spot.toFixed(2) },
          { l: 'Implied move', v: redact ? '••' : `±${ctx.im}%`, c: 'text-accent' },
          { l: '8q avg', v: redact ? '••' : `±${ctx.hist}%` },
          { l: 'IV Rank', v: redact ? '••' : `${ctx.ivr}` },
        ].map((s) => (
          <div key={s.l} className="bg-surface-deep px-3 py-1.5">
            <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{s.l}</div>
            <div className={`text-[12px] font-mono font-bold tabular-nums ${s.c ?? 'text-foreground'}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Hub tabs */}
      <div className="flex items-center gap-px border-b border-border bg-surface-deep">
        {HUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider border-r border-border ${
              tab === t.id ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Three-column body */}
      <div className="grid grid-cols-12 gap-2" style={{ minHeight: 'calc(100vh - 360px)' }}>
        <aside className="col-span-12 md:col-span-3 lg:col-span-2 min-h-[420px]">
          <EarnUpcomingList filter={filter ?? { window: 'week' }} activeTicker={ticker} onPick={onTickerChange} />
        </aside>

        <main className="col-span-12 md:col-span-6 lg:col-span-7 space-y-2 min-w-0">
          {tab === 'play' && <EarnPlaybook ticker={ticker} redact={redact} />}
          {tab === 'hist' && <EarnHistoryTable ticker={ticker} redact={redact} />}
          {tab === 'crush' && <EarnCrushPanel ticker={ticker} redact={redact} />}
          {tab === 'scen' && (
            <EarnScenarioGrid ticker={ticker} spot={ctx.spot} impliedMovePct={ctx.im} straddle={ctx.straddle} redact={redact} />
          )}
          {tab === 'news' && <EarnNewsList ticker={ticker} />}
        </main>

        <aside className="col-span-12 md:col-span-3 space-y-2">
          <EarnStructureSuggest
            ticker={ticker}
            ivRank={ctx.ivr}
            expectedMove={ctx.im}
            histMove={ctx.hist}
            spot={ctx.spot}
            dte={ctx.dte}
          />
          <EarnHistoryTable ticker={ticker} redact={redact} />
        </aside>
      </div>

      <EarnCalendarRail ticker={ticker} />
    </div>
  );
}
