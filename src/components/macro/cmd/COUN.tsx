// COUN — Country Dashboard with sub-tabs: OVERVIEW, MACRO, MARKETS, RISK, CALENDAR.
// Combines WB / FRED / Indices / EconCalendar live feeds with seeded macro
// history. Switch country via the CLI by typing the country code.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useFRED } from '@/hooks/useFRED';
import { useIndices } from '@/hooks/useIndices';
import { useEconCalendar, applyFilters } from '@/hooks/useEconCalendar';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { CENTRAL_BANKS, COUNTRY_TO_INDEX, COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import { ecstHistory, ECST_COUNTRIES, type EcstCountry } from '@/data/macro/ecstSeries';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, MiniBars, SurpriseBar } from './_shell/charts';

type Tab = 'OVERVIEW' | 'MACRO' | 'MARKETS' | 'RISK' | 'CALENDAR';
const TABS = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'MACRO',    label: 'Macro' },
  { id: 'MARKETS',  label: 'Markets' },
  { id: 'RISK',     label: 'Risk' },
  { id: 'CALENDAR', label: 'Calendar' },
] as const;

function fmt(v: number | null | undefined, unit = '') {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === '$T') return `$${(v / 1e12).toFixed(2)}T`;
  if (unit === '$')  return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  return v.toFixed(2) + (unit === '%' ? '%' : '');
}
function days(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400_000); }

function Kpi({ label, value, sub, tone = 'neu' }: { label: string; value: string; sub?: string; tone?: 'pos' | 'neg' | 'neu' }) {
  const t = tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-foreground';
  return (
    <div className="border border-border bg-surface-deep p-2 min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`text-base font-mono font-bold tabular-nums mt-0.5 ${t}`}>{value}</div>
      {sub && <div className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export default function COUN() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const wb = useWorldBank();
  const fred = useFRED();
  const idx = useIndices();
  const { events, loading: calLoading } = useEconCalendar();
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [drillEvent, setDrillEvent] = useState<any>(null);

  const iso3 = COUNTRY_TO_ISO3[selectedCountry];
  const cb = CENTRAL_BANKS.find(c => c.code === selectedCountry);
  const indexAbbr = COUNTRY_TO_INDEX[selectedCountry];
  const index = indexAbbr ? idx.byAbbr[indexAbbr] : null;
  const isUS = selectedCountry === 'US';

  const wbVal  = (k: string) => wb.byKey[k]?.byIso3[iso3]?.value ?? null;
  const wbYear = (k: string) => wb.byKey[k]?.byIso3[iso3]?.year ?? null;

  const cpi   = isUS ? fred.byKey['cpi_yoy']?.value ?? wbVal('inflation')   : wbVal('inflation');
  const gdpG  = isUS ? fred.byKey['gdp_growth']?.value ?? wbVal('gdp_growth'): wbVal('gdp_growth');
  const unemp = isUS ? fred.byKey['unemployment']?.value ?? wbVal('unemployment'): wbVal('unemployment');
  const rate  = cb?.fredKey ? fred.byKey[cb.fredKey]?.value ?? cb.rate : cb?.rate ?? null;

  const countryEvents = useMemo(() => applyFilters(events, { countries: [selectedCountry] }), [events, selectedCountry]);
  const upcoming  = useMemo(() => countryEvents.filter(e => new Date(e.ts).getTime() >= Date.now() - 3600_000).slice(0, 20), [countryEvents]);
  const recent    = useMemo(() => countryEvents.filter(e => new Date(e.ts).getTime() <  Date.now()).slice(-15).reverse(), [countryEvents]);

  // Helper for seeded series
  const series = (k: string): number[] => (ECST_COUNTRIES as readonly string[]).includes(selectedCountry) ? ecstHistory(k, selectedCountry as EcstCountry) : [];
  const gdpHist  = series('gdp_growth');
  const cpiHist  = series('inflation');
  const unempHist = series('unemployment');
  const pmiMfg   = series('pmi_mfg');
  const pmiSvc   = series('pmi_svc');
  const retail   = series('retail_sales');
  const indProd  = series('ind_prod');
  const m2       = series('m2_yoy');

  const surprises = recent.filter(e => e.actual != null && e.forecast != null).slice(0, 10);

  return (
    <CmdShell
      code="COUN"
      title={`${countryInfo.flag}  ${countryInfo.name.toUpperCase()}  ·  ${countryInfo.currency}  ·  ${countryInfo.centralBank}`}
      headerRight={
        <span className="text-[9px] font-mono text-muted-foreground uppercase">
          {events.length ? `${countryEvents.length} events` : '...'} · switch via CLI
        </span>
      }
      tabs={<CmdTabs tabs={TABS as any} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1 p-1">
          <Kpi label="Policy Rate" value={fmt(rate, '%')} sub={cb ? `${cb.bank} · ${cb.stance}` : '—'} tone={cb?.stance === 'Hawkish' ? 'neg' : cb?.stance === 'Dovish' ? 'pos' : 'neu'} />
          <Kpi label="CPI YoY" value={fmt(cpi, '%')} sub="Tgt ~2%" tone={cpi != null && cpi > 3 ? 'neg' : 'pos'} />
          <Kpi label="GDP YoY" value={fmt(gdpG, '%')} sub={isUS ? 'FRED' : `WB ${wbYear('gdp_growth') ?? ''}`} tone={gdpG != null && gdpG > 0 ? 'pos' : 'neg'} />
          <Kpi label="Unemployment" value={fmt(unemp, '%')} sub={isUS ? 'FRED' : `WB ${wbYear('unemployment') ?? ''}`} tone={unemp != null && unemp < 5 ? 'pos' : 'neg'} />
          <Kpi label="Debt/GDP" value={fmt(wbVal('govt_debt'), '%')} sub={`WB ${wbYear('govt_debt') ?? ''}`} tone={(wbVal('govt_debt') ?? 0) > 80 ? 'neg' : 'pos'} />
          <Kpi label="Curr Acct" value={fmt(wbVal('current_acct'), '%')} sub={`WB ${wbYear('current_acct') ?? ''}`} tone={(wbVal('current_acct') ?? 0) >= 0 ? 'pos' : 'neg'} />
        </div>
      }
      footerLeft={`COUN <GO> · CMDs: ECO ECST CENB FED FOMC EIU ECTR · Sub-tabs ${TABS.length}`}
      footerRight={`Live: WB · FRED · Indices · EconCal`}
    >
      <div className="h-full overflow-auto p-1 space-y-1 relative">

        {tab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Equity Benchmark</div>
              {index ? (
                <>
                  <div className="flex items-baseline justify-between"><span className="text-[11px] font-mono font-bold">{index.symbol}</span><span className="text-[10px] font-mono text-muted-foreground">{index.abbr}</span></div>
                  <div className="text-2xl font-mono font-bold tabular-nums">{index.close?.toLocaleString() ?? '—'}</div>
                  <div className={`text-[11px] font-mono tabular-nums ${(index.change_pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {index.change_pct != null ? `${index.change_pct >= 0 ? '+' : ''}${index.change_pct.toFixed(2)}%` : '—'}
                    <span className="text-muted-foreground"> · mcap ${index.mcap_usd_t}T</span>
                  </div>
                </>
              ) : <div className="text-[10px] font-mono text-muted-foreground">No index mapped for {selectedCountry}</div>}
            </div>

            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Central Bank</div>
              {cb ? (
                <div className="space-y-0.5 text-[11px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-bold">{cb.bank}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-bold tabular-nums">{fmt(rate, '%')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last move</span>
                    <span className={`font-bold tabular-nums ${cb.lastMoveBps > 0 ? 'text-negative' : cb.lastMoveBps < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                      {cb.lastMoveBps > 0 ? '+' : ''}{cb.lastMoveBps}bps · {cb.lastMoveDate}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next mtg</span><span className="font-bold">{cb.nextMeeting} ({days(cb.nextMeeting)}d)</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stance</span>
                    <span className={`font-bold ${cb.stance === 'Hawkish' ? 'text-negative' : cb.stance === 'Dovish' ? 'text-positive' : 'text-foreground'}`}>{cb.stance.toUpperCase()}</span>
                  </div>
                </div>
              ) : <div className="text-[10px] font-mono text-muted-foreground">No CB record</div>}
            </div>

            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Macro Snapshot</div>
              <div className="space-y-0.5 text-[11px] font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Nominal GDP</span><span className="tabular-nums">{wbVal('gdp_usd') != null ? '$' + (wbVal('gdp_usd')! / 1e12).toFixed(2) + 'T' : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GDP/Capita</span><span className="tabular-nums">{fmt(wbVal('gdp_per_cap'), '$')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Population</span><span className="tabular-nums">{wbVal('population') != null ? (wbVal('population')! / 1e6).toFixed(1) + 'M' : '—'}</span></div>
                {isUS && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">10Y</span><span className="tabular-nums">{fmt(fred.byKey['ten_year']?.value, '%')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">2Y</span><span className="tabular-nums">{fmt(fred.byKey['two_year']?.value, '%')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">2s10s</span>
                      <span className={`tabular-nums font-bold ${((fred.byKey['ten_year']?.value ?? 0) - (fred.byKey['two_year']?.value ?? 0)) < 0 ? 'text-negative' : 'text-positive'}`}>
                        {fred.byKey['ten_year']?.value != null && fred.byKey['two_year']?.value != null
                          ? ((fred.byKey['ten_year']!.value! - fred.byKey['two_year']!.value!) * 100).toFixed(0) + 'bps' : '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'MACRO' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1">
            {[
              ['GDP Growth', gdpHist, 'text-positive'],
              ['CPI YoY', cpiHist, 'text-negative'],
              ['Unemployment', unempHist, 'text-accent'],
              ['PMI Mfg', pmiMfg, 'text-foreground'],
              ['PMI Services', pmiSvc, 'text-foreground'],
              ['Retail Sales YoY', retail, 'text-positive'],
              ['Industrial Prod YoY', indProd, 'text-positive'],
              ['M2 YoY', m2, 'text-accent'],
            ].map(([label, data, tone]) => {
              const arr = data as number[];
              const last = arr.length ? arr[arr.length - 1] : null;
              const prev = arr.length > 1 ? arr[arr.length - 2] : null;
              const delta = last != null && prev != null ? last - prev : null;
              return (
                <div key={label as string} className="border border-border bg-surface-deep p-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">60M</span>
                  </div>
                  <div className={`text-xl font-mono font-bold tabular-nums ${tone}`}>{last != null ? last.toFixed(2) : '—'}</div>
                  <div className={`text-[10px] font-mono tabular-nums ${delta == null ? 'text-muted-foreground' : delta >= 0 ? 'text-positive' : 'text-negative'}`}>{delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} m/m` : '—'}</div>
                  <div className="mt-1 text-accent"><Sparkline data={arr} w={220} h={32} fill="currentColor" /></div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'MARKETS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Equity · {index?.symbol ?? '—'}</div>
              {index ? (
                <table className="w-full text-[11px] font-mono">
                  <tbody>
                    <tr><td className="text-muted-foreground py-0.5">Close</td><td className="text-right tabular-nums font-bold">{index.close?.toLocaleString()}</td></tr>
                    <tr><td className="text-muted-foreground py-0.5">Change</td><td className={`text-right tabular-nums font-bold ${(index.change_pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{index.change_pct?.toFixed(2)}%</td></tr>
                    <tr><td className="text-muted-foreground py-0.5">Market Cap</td><td className="text-right tabular-nums">${index.mcap_usd_t}T</td></tr>
                    <tr><td className="text-muted-foreground py-0.5">Exchange</td><td className="text-right">{index.abbr}</td></tr>
                  </tbody>
                </table>
              ) : <div className="text-[10px] font-mono text-muted-foreground">No data</div>}
            </div>
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Rates Snapshot</div>
              {isUS ? (
                <table className="w-full text-[11px] font-mono">
                  <tbody>
                    {['fed_funds', 'two_year', 'five_year', 'ten_year', 'thirty_year'].map(k => (
                      <tr key={k}><td className="text-muted-foreground py-0.5 uppercase">{k.replace('_', ' ')}</td><td className="text-right tabular-nums font-bold">{fmt(fred.byKey[k]?.value, '%')}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-[10px] font-mono text-muted-foreground">Detailed curve data: US only. See FFIP for global path tables.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'RISK' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {[
              ['Inflation', cpi, 3, 'invert'],
              ['Unemployment', unemp, 5, 'invert'],
              ['Debt/GDP', wbVal('govt_debt'), 80, 'invert'],
              ['Current Acct', wbVal('current_acct'), 0, 'normal'],
              ['Real Rate', rate != null && cpi != null ? rate - cpi : null, 0, 'normal'],
              ['GDP Growth', gdpG, 2, 'normal'],
            ].map(([label, v, threshold, mode]) => {
              const value = v as number | null;
              const t = threshold as number;
              const bad = value == null ? false : (mode === 'invert' ? value > t : value < t);
              return (
                <div key={label as string} className={`border p-2 ${bad ? 'border-negative bg-negative/10' : 'border-positive bg-positive/5'}`}>
                  <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
                  <div className={`text-lg font-mono font-bold tabular-nums ${bad ? 'text-negative' : 'text-positive'}`}>{fmt(value, '%')}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">Thr {t}% · {bad ? 'ALERT' : 'OK'}</div>
                </div>
              );
            })}
            <div className="border border-border bg-surface-deep p-2 col-span-2 md:col-span-3 lg:col-span-4">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Recent Surprises ({surprises.length})</div>
              {surprises.length === 0 ? <div className="text-[10px] font-mono text-muted-foreground">No actuals released for {selectedCountry} recently.</div> : (
                <table className="w-full text-[11px] font-mono">
                  <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left px-1 py-0.5">Date</th><th className="text-left px-1">Event</th><th className="text-right px-1">Fcst</th><th className="text-right px-1">Act</th><th className="text-center px-1">Surprise</th></tr></thead>
                  <tbody>
                    {surprises.map(e => {
                      const f = parseFloat(String(e.forecast ?? '')); const a = parseFloat(String(e.actual ?? ''));
                      const surp = Number.isFinite(f) && Number.isFinite(a) && f !== 0 ? ((a - f) / Math.abs(f)) * 100 : null;
                      return (
                        <tr key={e.id} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrillEvent(e)}>
                          <td className="px-1 py-0.5 text-muted-foreground">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</td>
                          <td className="px-1 py-0.5 truncate max-w-[280px]">{e.label}</td>
                          <td className="px-1 py-0.5 text-right tabular-nums text-muted-foreground">{e.forecast ?? '—'}</td>
                          <td className="px-1 py-0.5 text-right tabular-nums font-bold">{e.actual ?? '—'}</td>
                          <td className="px-1 py-0.5"><div className="flex justify-center"><SurpriseBar value={surp} /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'CALENDAR' && (
          <div className="border border-border bg-surface-deep">
            <div className="px-2 py-1 border-b border-border flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-accent">Upcoming Releases — {countryInfo.name}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{upcoming.length} EVENTS</span>
            </div>
            {calLoading && upcoming.length === 0 ? (
              <div className="px-2 py-3 text-center text-[10px] font-mono text-accent animate-pulse">LOADING CALENDAR…</div>
            ) : upcoming.length === 0 ? (
              <div className="px-2 py-3 text-center text-[10px] font-mono text-muted-foreground">No upcoming releases for {selectedCountry}.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-surface-deep z-10">
                  <tr className="border-b border-border">
                    {['Date', 'Time', 'Imp', 'Event', 'Forecast', 'Prior'].map((h, i) => (
                      <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(e => {
                    const t = new Date(e.ts);
                    return (
                      <tr key={e.id} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrillEvent(e)}>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{t.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono">{t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</td>
                        <td className={`px-2 py-0.5 text-[11px] font-mono ${e.importance === 3 ? 'text-negative' : e.importance === 2 ? 'text-accent' : 'text-muted-foreground'}`}>{'★'.repeat(e.importance)}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-foreground truncate max-w-[440px]">{e.label}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono tabular-nums text-right text-muted-foreground">{e.forecast ?? '—'}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono tabular-nums text-right text-muted-foreground">{e.prior ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <CmdDrawer open={!!drillEvent} onClose={() => setDrillEvent(null)} title={drillEvent?.label ?? ''} subtitle={drillEvent ? `${drillEvent.country} · ${new Date(drillEvent.ts).toLocaleString()}` : ''}>
          {drillEvent && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <Kpi label="Actual" value={drillEvent.actual ?? '—'} />
                <Kpi label="Forecast" value={drillEvent.forecast ?? '—'} />
                <Kpi label="Prior" value={drillEvent.prior ?? '—'} />
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">12-Month Synthetic History</div>
                <MiniBars data={Array.from({ length: 12 }, (_, i) => Math.sin((i + drillEvent.id.length) / 2) * 3)} w={400} h={48} />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground italic">Click any row in the calendar to drill into the release. ESC to close.</div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
