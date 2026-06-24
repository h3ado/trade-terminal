// FOMC — Decisions Archive. Sub-tabs: MEETINGS, DECISIONS, STATEMENTS,
// MINUTES. Drawer drill-down shows statement diff vs prior meeting.
import { useMemo, useState } from 'react';
import { FOMC_MEETINGS, FOMCMeeting } from '@/data/fomc';
import { useFRED } from '@/hooks/useFRED';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, MiniBars } from './_shell/charts';

type Tab = 'MEETINGS' | 'DECISIONS' | 'STATEMENTS' | 'MINUTES';
type Filter = 'all' | 'past' | 'upcoming' | 'sep';

// Stylised statement snippets per meeting for diff view
const STATEMENT_TEXT: Record<string, string> = {
  '2026-04-29': 'Recent indicators suggest economic activity has continued to expand at a moderate pace. Job gains have moderated and the unemployment rate has stabilised. Inflation has eased over the past year but remains somewhat elevated. The Committee decided to lower the target range for the federal funds rate by 1/4 percentage point.',
  '2026-03-18': 'Recent indicators suggest economic activity has continued to expand at a solid pace. Job gains have remained solid and the unemployment rate has remained low. Inflation has eased over the past year but remains somewhat elevated. In light of progress on inflation, the Committee decided to maintain the target range for the federal funds rate.',
  '2026-01-28': 'Recent indicators suggest economic activity has continued to expand at a solid pace. Job gains have remained solid and the unemployment rate has remained low. Inflation remains somewhat elevated. The Committee decided to maintain the target range for the federal funds rate.',
  '2025-12-10': 'Economic activity has continued to expand at a solid pace. Inflation has made progress toward the Committee\'s 2 percent objective but remains somewhat elevated. The Committee decided to lower the target range for the federal funds rate by 1/4 percentage point.',
  '2025-10-29': 'Economic activity has continued to expand at a solid pace. Labor market conditions remain solid. The Committee decided to maintain the target range for the federal funds rate.',
};

function diff(a: string, b: string) {
  const wa = a.split(/(\s+)/);
  const wb = b.split(/(\s+)/);
  const setB = new Set(wb);
  const setA = new Set(wa);
  const added = wb.filter(w => w.trim() && !setA.has(w));
  const removed = wa.filter(w => w.trim() && !setB.has(w));
  return { added, removed };
}

export default function FOMC() {
  const fred = useFRED();
  const [tab, setTab] = useState<Tab>('MEETINGS');
  const [filter, setFilter] = useState<Filter>('all');
  const [drill, setDrill] = useState<FOMCMeeting | null>(null);

  const liveRate = fred.byKey['fed_funds']?.value ?? null;

  const rows = useMemo(() => {
    const base = [...FOMC_MEETINGS].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === 'past') return base.filter(m => m.status === 'Past');
    if (filter === 'upcoming') return base.filter(m => m.status === 'Upcoming');
    if (filter === 'sep') return base.filter(m => m.type === 'SEP');
    return base;
  }, [filter]);

  const path = useMemo(() => FOMC_MEETINGS.filter(m => m.rateAfter != null).slice(-12), []);

  const cuts = FOMC_MEETINGS.filter(m => (m.decisionBps ?? 0) < 0).length;
  const hikes = FOMC_MEETINGS.filter(m => (m.decisionBps ?? 0) > 0).length;
  const holds = FOMC_MEETINGS.filter(m => m.status === 'Past' && (m.decisionBps ?? 0) === 0).length;

  const drillIdx = drill ? FOMC_MEETINGS.findIndex(m => m.date === drill.date) : -1;
  const drillPrior = drillIdx > 0 ? FOMC_MEETINGS[drillIdx - 1] : null;
  const drillText = drill ? STATEMENT_TEXT[drill.date] : '';
  const priorText = drillPrior ? STATEMENT_TEXT[drillPrior.date] : '';
  const drillDiff = drillText && priorText ? diff(priorText, drillText) : { added: [], removed: [] };

  return (
    <CmdShell
      code="FOMC"
      title="FOMC Decisions Archive · 2025–2026"
      headerRight={
        <div className="flex items-center gap-1">
          {(['all', 'past', 'upcoming', 'sep'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-1.5 py-0.5 text-[9px] font-mono uppercase border ${filter === f ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {f === 'sep' ? 'SEP' : f.toUpperCase()}
            </button>
          ))}
          <span className="ml-2 text-[9px] font-mono text-muted-foreground">{rows.length} MTGS</span>
        </div>
      }
      tabs={<CmdTabs tabs={[{ id: 'MEETINGS', label: 'Meetings' }, { id: 'DECISIONS', label: 'Decisions' }, { id: 'STATEMENTS', label: 'Statements' }, { id: 'MINUTES', label: 'Minutes' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1">
          <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Current Rate</div><div className="text-xl font-mono font-bold tabular-nums text-accent">{liveRate != null ? liveRate.toFixed(2) + '%' : '—'}</div><div className="text-[9px] font-mono text-muted-foreground">DFEDTARU</div></div>
          <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Cuts</div><div className="text-xl font-mono font-bold tabular-nums text-positive">{cuts}</div></div>
          <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Hikes</div><div className="text-xl font-mono font-bold tabular-nums text-negative">{hikes}</div></div>
          <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Holds</div><div className="text-xl font-mono font-bold tabular-nums text-foreground">{holds}</div></div>
        </div>
      }
      footerLeft="FOMC <GO> · SEP meetings include Summary of Economic Projections + dot plot"
      footerRight="! = dissent >1 · Source: federalreserve.gov"
    >
      <div className="h-full overflow-auto relative">

        {tab === 'MEETINGS' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['Date', 'Status', 'Type', 'Decision', 'Rate After', 'Vote', 'Stmt', 'Min'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 3 && i <= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.date} className={`border-b border-border/40 hover:bg-surface-elevated cursor-pointer ${m.status === 'Upcoming' ? 'bg-surface-elevated/30' : ''}`} onClick={() => setDrill(m)}>
                  <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{m.date}</td>
                  <td className={`px-2 py-0.5 text-[10px] font-mono uppercase ${m.status === 'Upcoming' ? 'text-accent' : 'text-muted-foreground'}`}>{m.status}</td>
                  <td className="px-2 py-0.5 text-[10px] font-mono">{m.type === 'SEP' ? <span className="text-accent">SEP</span> : <span className="text-muted-foreground">Reg</span>}</td>
                  <td className={`px-2 py-0.5 text-[11px] font-mono text-right font-bold tabular-nums ${m.status === 'Upcoming' ? 'text-accent' : (m.decisionBps ?? 0) > 0 ? 'text-negative' : (m.decisionBps ?? 0) < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                    {m.status === 'Upcoming' ? 'PENDING' : m.decisionBps === 0 ? 'HOLD' : `${m.decisionBps! > 0 ? '+' : ''}${m.decisionBps}bps`}
                  </td>
                  <td className="px-2 py-0.5 text-[11px] font-mono text-right tabular-nums">{m.rateAfter != null ? m.rateAfter.toFixed(2) + '%' : '—'}</td>
                  <td className="px-2 py-0.5 text-[11px] font-mono text-right text-muted-foreground tabular-nums">
                    {m.voteFor != null ? `${m.voteFor}-${m.voteAgainst}` : '—'}
                    {m.voteAgainst != null && m.voteAgainst > 1 && <span className="text-negative ml-1">!</span>}
                  </td>
                  <td className="px-2 py-0.5 text-[10px] font-mono">{m.statementUrl ? <a href={m.statementUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-accent hover:underline">OPEN</a> : <span className="text-muted-foreground/50">—</span>}</td>
                  <td className="px-2 py-0.5 text-[10px] font-mono">{m.minutesUrl ? <a href={m.minutesUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-accent hover:underline">OPEN</a> : <span className="text-muted-foreground/50">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'DECISIONS' && (
          <div className="p-2 space-y-1">
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Rate Path (Last 12 Meetings)</div>
              <div className="text-accent"><Sparkline data={path.map(p => p.rateAfter!)} w={920} h={80} fill="currentColor" /></div>
            </div>
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Decision Sequence (bps)</div>
              <MiniBars data={path.map(p => p.decisionBps ?? 0)} w={920} h={48} />
              <div className="mt-1 flex gap-3 text-[10px] font-mono text-muted-foreground">
                {path.map(p => <span key={p.date} className="tabular-nums">{p.date.slice(5)}: <span className={(p.decisionBps ?? 0) < 0 ? 'text-positive' : (p.decisionBps ?? 0) > 0 ? 'text-negative' : 'text-foreground'}>{p.decisionBps === 0 ? '0' : `${p.decisionBps! > 0 ? '+' : ''}${p.decisionBps}`}</span></span>)}
              </div>
            </div>
          </div>
        )}

        {tab === 'STATEMENTS' && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
            {FOMC_MEETINGS.filter(m => STATEMENT_TEXT[m.date]).slice().reverse().map(m => (
              <div key={m.date} className="border border-border bg-surface-deep p-2 cursor-pointer hover:border-accent" onClick={() => setDrill(m)}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] font-mono font-bold">{m.date}</span>
                  <span className={`text-[10px] font-mono uppercase font-bold ${(m.decisionBps ?? 0) < 0 ? 'text-positive' : (m.decisionBps ?? 0) > 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                    {m.decisionBps === 0 ? 'HOLD' : `${m.decisionBps! > 0 ? '+' : ''}${m.decisionBps}bp`}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-foreground/90 italic line-clamp-4">{STATEMENT_TEXT[m.date]}</div>
                <div className="text-[9px] font-mono text-accent mt-1">Click for diff vs prior →</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'MINUTES' && (
          <div className="p-2 space-y-1">
            {FOMC_MEETINGS.filter(m => m.minutesUrl).slice().reverse().map(m => (
              <div key={m.date} className="border border-border bg-surface-deep p-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono font-bold">{m.date} <span className="text-[9px] text-muted-foreground ml-1">{m.type}</span></div>
                  <div className="text-[10px] font-mono text-muted-foreground">Released ~3 weeks after meeting</div>
                </div>
                <a href={m.minutesUrl} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-accent hover:underline">OPEN MINUTES →</a>
              </div>
            ))}
            {FOMC_MEETINGS.filter(m => m.status === 'Past' && !m.minutesUrl).length > 0 && (
              <div className="text-[10px] font-mono text-muted-foreground italic px-2 py-1">Older meetings: minutes link not seeded. Visit federalreserve.gov/monetarypolicy/fomccalendars.htm for full archive.</div>
            )}
          </div>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `FOMC · ${drill.date}` : ''} subtitle={drill ? `${drill.type} · ${drill.status}` : ''} width="lg">
          {drill && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Decision</div><div className={`text-lg font-mono font-bold tabular-nums ${(drill.decisionBps ?? 0) < 0 ? 'text-positive' : (drill.decisionBps ?? 0) > 0 ? 'text-negative' : 'text-foreground'}`}>{drill.decisionBps == null ? 'PENDING' : drill.decisionBps === 0 ? 'HOLD' : `${drill.decisionBps > 0 ? '+' : ''}${drill.decisionBps}bp`}</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Rate After</div><div className="text-lg font-mono font-bold tabular-nums text-accent">{drill.rateAfter != null ? `${drill.rateAfter.toFixed(2)}%` : '—'}</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Vote</div><div className="text-lg font-mono font-bold tabular-nums">{drill.voteFor != null ? `${drill.voteFor}-${drill.voteAgainst}` : '—'}</div></div>
              </div>
              {drillText && (
                <div className="border border-border bg-surface-deep p-2">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Statement</div>
                  <p className="text-[11px] font-mono text-foreground/90 italic leading-relaxed">{drillText}</p>
                </div>
              )}
              {drillPrior && drillText && priorText && (
                <div className="border border-border bg-surface-deep p-2">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Diff vs {drillPrior.date}</div>
                  <div className="text-[11px] font-mono">
                    <div className="text-positive">+ {drillDiff.added.slice(0, 30).join(' ') || <span className="text-muted-foreground italic">no additions</span>}</div>
                    <div className="text-negative mt-1">− {drillDiff.removed.slice(0, 30).join(' ') || <span className="text-muted-foreground italic">no removals</span>}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-1">
                {drill.statementUrl && <a href={drill.statementUrl} target="_blank" rel="noreferrer" className="flex-1 border border-border bg-surface-deep p-2 text-[11px] font-mono text-accent hover:bg-surface-elevated text-center">📄 Statement</a>}
                {drill.minutesUrl && <a href={drill.minutesUrl} target="_blank" rel="noreferrer" className="flex-1 border border-border bg-surface-deep p-2 text-[11px] font-mono text-accent hover:bg-surface-elevated text-center">📄 Minutes</a>}
              </div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
