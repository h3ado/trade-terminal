import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useEarningsCalendar } from '@/hooks/useEarningsCalendar';
import { useEconCalendar, applyFilters } from '@/hooks/useEconCalendar';

type Mover = { ticker: string; price: number; changePct: number; category: string };

export default function SessionPrepWidget() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [moversLoading, setMoversLoading] = useState(true);

  const { events: earnEvents, loading: earnLoading } = useEarningsCalendar({ window: 'today' });
  const { events: econRaw, loading: econLoading } = useEconCalendar();

  const today = new Date().toISOString().slice(0, 10);
  const econToday = applyFilters(econRaw, { kinds: ['econ'], minImportance: 2 }).filter(e => e.ts.slice(0, 10) === today);

  useEffect(() => {
    let cancelled = false;
    setMoversLoading(true);
    apiGet<{ movers?: Mover[] }>('/api/market/scanner/premarket')
      .then(data => {
        if (cancelled) return;
        setMovers((data?.movers ?? []).slice(0, 5));
        setMoversLoading(false);
      })
      .catch(() => { if (!cancelled) setMoversLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-0 h-full min-h-0 overflow-auto">

      {/* Pre-Market Movers */}
      <Section title="PRE-MARKET MOVERS" loading={moversLoading}>
        {movers.length === 0 && !moversLoading && (
          <Row dim>No pre-market movers yet</Row>
        )}
        {movers.map(m => {
          const pos = m.changePct >= 0;
          return (
            <div key={m.ticker} className="flex items-center gap-1 py-1.5 border-b border-grid-line last:border-0">
              <span className="text-[10px] font-mono font-bold text-accent w-12">{m.ticker}</span>
              <span className={`text-[8px] font-mono font-bold px-1 border ${m.category === 'GAP' ? 'text-[hsl(45,100%,60%)] border-[hsl(45,100%,60%)]/30' : 'text-[hsl(210,80%,65%)] border-[hsl(210,80%,65%)]/30'}`}>
                {m.category}
              </span>
              <span className="text-[10px] font-mono text-foreground flex-1 text-right">${m.price.toFixed(2)}</span>
              <span className={`text-[9px] font-mono font-bold w-14 text-right ${pos ? 'text-positive' : 'text-negative'}`}>
                {pos ? '+' : ''}{m.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </Section>

      {/* Today's Earnings */}
      <Section title="EARNINGS TODAY" loading={earnLoading}>
        {earnEvents.length === 0 && !earnLoading && (
          <Row dim>No earnings today</Row>
        )}
        {earnEvents.slice(0, 6).map(e => {
          const timeCls = e.when === 'BMO'
            ? 'text-[hsl(45,100%,60%)] border-[hsl(45,100%,60%)]/30'
            : 'text-[hsl(270,70%,70%)] border-[hsl(270,70%,70%)]/30';
          return (
            <div key={e.id} className="flex items-center gap-1.5 py-1.5 border-b border-grid-line last:border-0">
              <span className="text-[10px] font-mono font-bold text-accent w-14 truncate">{e.ticker}</span>
              <span className="text-[8px] font-mono text-muted-foreground flex-1 truncate">{e.label}</span>
              {e.when && (
                <span className={`text-[7px] font-mono font-bold px-1 border flex-shrink-0 ${timeCls}`}>{e.when}</span>
              )}
            </div>
          );
        })}
      </Section>

      {/* Economic Events */}
      <Section title="ECON TODAY" loading={econLoading}>
        {econToday.length === 0 && !econLoading && (
          <Row dim>No high-impact events today</Row>
        )}
        {econToday.slice(0, 6).map(e => {
          const t = new Date(e.ts);
          const time = isNaN(t.getTime()) ? '' : t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          const imp = e.importance === 3 ? 'text-negative' : e.importance === 2 ? 'text-[hsl(45,100%,60%)]' : 'text-muted-foreground';
          return (
            <div key={e.id} className="flex items-center gap-1.5 py-1.5 border-b border-grid-line last:border-0">
              <span className={`text-[8px] font-mono w-14 flex-shrink-0 ${imp}`}>{time}</span>
              <span className="text-[8px] font-mono text-muted-foreground w-8 flex-shrink-0">{e.country ?? ''}</span>
              <span className="text-[8px] font-mono text-foreground truncate flex-1">{e.label}</span>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 px-2 py-1 bg-surface-deep border-b border-border">
        <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider">{title}</span>
        {loading && <span className="text-[8px] font-mono text-muted-foreground/50">…</span>}
      </div>
      <div className="px-2">{children}</div>
    </div>
  );
}

function Row({ dim, children }: { dim?: boolean; children: React.ReactNode }) {
  return (
    <div className={`py-2 text-[8px] font-mono ${dim ? 'text-muted-foreground/50' : 'text-foreground'}`}>
      {children}
    </div>
  );
}
