/**
 * Country Detail Drawer — right-side Sheet that shows everything we know
 * about a clicked country: live FX/yields/equity, macro snapshot, ACLED &
 * sanctions risk, and the next 30 days of econ events for that country.
 *
 * All data sources are existing hooks/datasets — no new edge functions.
 * Hooks are conditioned on `iso` so a closed drawer makes zero requests.
 */
import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFXRates } from '@/hooks/useFXRates';
import { useIndices } from '@/hooks/useIndices';
import { useAcledEvents } from '@/hooks/useAcledEvents';
import { useLiveSanctions } from '@/hooks/useLiveSanctions';
import { useLiveGdelt } from '@/hooks/useLiveGdelt';
import { useWorldBank } from '@/hooks/useWorldBank';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useUserPreference } from '@/hooks/useUserPreference';
import { events as ALL_ECON_EVENTS } from '@/components/macro/EconCalendar';
import { COUNTRY_META, metaFromIso, type CountryMeta } from './countryLookup';
import { SOV_YIELD_10Y, POLICY_RATE, CPI_YOY, SOV_CDS_5Y } from './markets';
import { TRAVEL_ADVISORY, ADVISORY_LABEL, advisoryColor } from './travelAdvisory';
import { FX_CARRY, ETF_FLOWS_1W, etfFlowColor } from './marketFlows';

// ISO2 → ISO3 for World Bank lookups (covers WB indicator universe).
const ISO2_TO_ISO3: Record<string, string> = {
  US: 'USA', CA: 'CAN', MX: 'MEX', BR: 'BRA', AR: 'ARG', CL: 'CHL', CO: 'COL', PE: 'PER',
  GB: 'GBR', DE: 'DEU', FR: 'FRA', IT: 'ITA', ES: 'ESP', PT: 'PRT', GR: 'GRC', IE: 'IRL',
  NL: 'NLD', BE: 'BEL', AT: 'AUT', FI: 'FIN', CH: 'CHE', SE: 'SWE', NO: 'NOR', DK: 'DNK',
  PL: 'POL', CZ: 'CZE', HU: 'HUN', RO: 'ROU', TR: 'TUR', RU: 'RUS', UA: 'UKR',
  CN: 'CHN', JP: 'JPN', KR: 'KOR', TW: 'TWN', HK: 'HKG', SG: 'SGP',
  TH: 'THA', ID: 'IDN', MY: 'MYS', PH: 'PHL', VN: 'VNM', IN: 'IND', PK: 'PAK', BD: 'BGD',
  AU: 'AUS', NZ: 'NZL', ZA: 'ZAF', NG: 'NGA', EG: 'EGY', MA: 'MAR', KE: 'KEN',
  AE: 'ARE', SA: 'SAU', QA: 'QAT', IL: 'ISR',
};

function fmtBig(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
function fmtPop(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return n.toString();
}

type Props = {
  iso: string | null;
  fallbackName?: string;
  onClose: () => void;
};

export function CountryDetailDrawer({ iso, fallbackName, onClose }: Props) {
  const open = !!iso;
  const meta: CountryMeta = iso ? (COUNTRY_META[iso] ?? metaFromIso(iso, fallbackName)) : null as any;

  const { rates: fxRates } = useFXRates();
  const { byAbbr: indices } = useIndices();
  const { events: acledEvents } = useAcledEvents(open);
  const { countries: sanctionsList } = useLiveSanctions();
  const { cells: gdeltCells } = useLiveGdelt();
  const { privacyMode } = usePrivacy();
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useUserPreference<string[]>('globe.countryWatchlist', []);
  const isPinned = !!iso && watchlist.includes(iso);
  const togglePin = () => {
    if (!iso) return;
    setWatchlist(isPinned ? watchlist.filter(x => x !== iso) : [...watchlist, iso]);
  };

  const fx = useMemo(
    () => meta?.currency ? fxRates.find(r => r.ccy === meta.currency) : undefined,
    [fxRates, meta?.currency],
  );
  const equity = meta?.equityAbbr ? indices[meta.equityAbbr] : undefined;
  const yield10 = iso ? SOV_YIELD_10Y[iso] : undefined;
  const policy = iso ? POLICY_RATE[iso] : undefined;
  const cpi = iso ? CPI_YOY[iso] : undefined;
  const cds = useMemo(() => SOV_CDS_5Y.find(c => c.iso === iso), [iso]);
  const advisory = iso ? TRAVEL_ADVISORY[iso] : undefined;

  const { byKey: wb, loading: wbLoading, error: wbError } = useWorldBank();
  const iso3 = iso ? ISO2_TO_ISO3[iso] : undefined;
  // Memoize the per-country WB bundle so re-renders during pan/zoom don't
  // re-walk all 8 indicator maps. Cache key is `wb` reference + iso3, so
  // switching countries is O(1) lookup against the already-cached payload.
  const wbCountry = useMemo(() => {
    const get = (k: string) => (iso3 && wb[k]?.byIso3[iso3]?.value) ?? null;
    const yr = (k: string) => (iso3 && wb[k]?.byIso3[iso3]?.year) ?? null;
    return {
      gdpUsd: get('gdp_usd'),
      gdpPerCap: get('gdp_per_cap'),
      gdpGrowth: get('gdp_growth'),
      wbInflation: get('inflation'),
      unemployment: get('unemployment'),
      population: get('population'),
      currentAcct: get('current_acct'),
      govtDebt: get('govt_debt'),
      wbYr: yr('gdp_usd'),
    };
  }, [wb, iso3]);
  const { gdpUsd, gdpPerCap, gdpGrowth, wbInflation, unemployment,
          population, currentAcct, govtDebt, wbYr } = wbCountry;
  // Skeletons only while the WB payload is genuinely in-flight. If the fetch
  // failed outright (no cached payload), show an inline error indicator on
  // each affected row instead of leaving them stuck on skeletons.
  const wbFailed = !!wbError && Object.keys(wb).length === 0;
  const wbPending = wbLoading && !wbFailed && Object.keys(wb).length === 0;
  const wbErrMsg = wbError ?? null;

  const carry = useMemo(() => FX_CARRY.find(c => c.iso === iso), [iso]);
  const etf = iso ? ETF_FLOWS_1W[iso] : undefined;

  const acledStats = useMemo(() => {
    if (!iso || !meta) return { count: 0, fatalities: 0, byType: [] as { t: string; n: number }[] };
    const matches = acledEvents.filter(
      e => e.country.toUpperCase() === iso || e.country.toLowerCase() === meta.name.toLowerCase(),
    );
    const byType = new Map<string, number>();
    let fatalities = 0;
    for (const e of matches) {
      byType.set(e.subType, (byType.get(e.subType) ?? 0) + 1);
      fatalities += e.fatalities;
    }
    return {
      count: matches.length,
      fatalities,
      byType: [...byType.entries()].map(([t, n]) => ({ t, n })).sort((a, b) => b.n - a.n).slice(0, 4),
    };
  }, [acledEvents, iso, meta]);

  const sanctionsRow = useMemo(
    () => iso ? sanctionsList.find(s => s.iso === iso) : undefined,
    [sanctionsList, iso],
  );

  const tone = useMemo(() => {
    if (!meta || !gdeltCells.length) return null;
    let sum = 0, w = 0;
    for (const c of gdeltCells) {
      const dLat = c.lat - meta.lat;
      const dLng = c.lng - meta.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < 8) {
        const wt = c.count / (1 + dist);
        sum += c.avgTone * wt; w += wt;
      }
    }
    return w > 0 ? sum / w : null;
  }, [gdeltCells, meta]);

  const upcomingEvents = useMemo(() => {
    if (!iso) return [];
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return ALL_ECON_EVENTS
      .filter(e => e.country === iso && e.date >= todayStr)
      .slice(0, 10);
  }, [iso]);

  const goToMacro = () => { navigate('/macro'); onClose(); };
  const redact = (s: string) => privacyMode ? '•••' : s;

  if (!iso || !meta) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[460px] bg-background border-l border-border p-0 font-mono"
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="text-3xl leading-none mt-0.5">{meta.flag}</div>
              <div>
                <SheetTitle className="text-base font-mono uppercase tracking-wide text-foreground">
                  {meta.name}
                </SheetTitle>
                <div className="text-[10px] text-muted-foreground uppercase mt-0.5">
                  {meta.iso}{meta.capital ? ` · ${meta.capital}` : ''}
                  {meta.currency ? ` · ${meta.currency}` : ''}
                  {meta.rating ? ` · ${meta.rating}` : ''}
                </div>
              </div>
            </div>
            {/* Right padding leaves room for the Sheet's built-in close (X) button */}
            <div className="flex items-center gap-1 pr-7">
              <button
                onClick={togglePin}
                className={`p-1.5 hover:bg-accent ${isPinned ? 'text-[hsl(28,95%,55%)]' : 'text-muted-foreground'}`}
                title={isPinned ? 'Unpin' : 'Pin to watchlist'}
              >
                <Star className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Live tickers strip */}
          <div className="grid grid-cols-4 gap-px bg-border text-[10px]">
            <Cell label={meta.currency ? `${meta.currency}/USD` : 'FX'}
              value={fx?.usd != null ? redact(fx.usd.toFixed(4)) : '—'}
              chg={fx?.change_pct ?? null} />
            <Cell label="10Y" value={yield10?.lvl != null ? `${yield10.lvl.toFixed(2)}%` : '—'}
              chg={yield10?.chg1m ?? null} chgLabel="1m" />
            <Cell label="CDS 5Y" value={cds?.bps != null ? `${cds.bps}bp` : '—'} />
            <Cell label={meta.equityAbbr ?? 'EQ'}
              value={equity?.close != null ? redact(equity.close.toFixed(0)) : '—'}
              chg={equity?.change_pct ?? null} />
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {/* MACRO */}
          <Section title="Macro">
            <Row k="Policy rate" v={policy ? `${policy.lvl.toFixed(2)}%` : '—'}
              delta={policy?.chg1y} deltaUnit="pp 1Y" src="FRED / CB" />
            <Row k="CPI YoY" v={cpi ? `${cpi.lvl.toFixed(1)}%` : '—'}
              delta={cpi?.chg1y} deltaUnit="pp 1Y" src="FRED" />
            <Row k="Real 10Y" v={(yield10 && cpi) ? `${(yield10.lvl - cpi.lvl).toFixed(2)}%` : '—'} src="Derived" />
            <Row k="Sov rating" v={meta.rating ?? '—'} src="S&P" />
          </Section>

          {/* ECONOMY (World Bank latest annual) */}
          <Section title={`Economy${wbYr ? ` · ${wbYr}` : wbPending ? ' · …' : wbFailed ? ' · ERR' : ''}`}>
            <Row k="GDP (nominal)" v={fmtBig(gdpUsd)} src="WB" loading={wbPending && gdpUsd == null} error={wbFailed && gdpUsd == null ? wbErrMsg : null} />
            <Row k="GDP / capita" v={fmtBig(gdpPerCap)} src="WB" loading={wbPending && gdpPerCap == null} error={wbFailed && gdpPerCap == null ? wbErrMsg : null} />
            <Row k="GDP growth" v={gdpGrowth != null ? `${gdpGrowth.toFixed(1)}%` : '—'}
              accent={gdpGrowth != null && gdpGrowth < 0 ? 'warn' : gdpGrowth != null && gdpGrowth < 1 ? 'caution' : undefined}
              src="WB" loading={wbPending && gdpGrowth == null} error={wbFailed && gdpGrowth == null ? wbErrMsg : null} />
            <Row k="Inflation (WB)" v={wbInflation != null ? `${wbInflation.toFixed(1)}%` : '—'}
              accent={wbInflation != null && wbInflation > 8 ? 'warn' : wbInflation != null && wbInflation > 4 ? 'caution' : undefined}
              src="WB" loading={wbPending && wbInflation == null} error={wbFailed && wbInflation == null ? wbErrMsg : null} />
            <Row k="Unemployment" v={unemployment != null ? `${unemployment.toFixed(1)}%` : '—'}
              accent={unemployment != null && unemployment > 10 ? 'warn' : unemployment != null && unemployment > 6 ? 'caution' : undefined}
              src="WB / ILO" loading={wbPending && unemployment == null} error={wbFailed && unemployment == null ? wbErrMsg : null} />
            <Row k="Govt debt /GDP" v={govtDebt != null ? `${govtDebt.toFixed(0)}%` : '—'}
              accent={govtDebt != null && govtDebt > 100 ? 'warn' : govtDebt != null && govtDebt > 70 ? 'caution' : undefined}
              src="WB / IMF" loading={wbPending && govtDebt == null} error={wbFailed && govtDebt == null ? wbErrMsg : null} />
            <Row k="Current acct" v={currentAcct != null ? `${currentAcct >= 0 ? '+' : ''}${currentAcct.toFixed(1)}%` : '—'}
              accent={currentAcct != null && currentAcct < -5 ? 'warn' : undefined}
              src="WB" loading={wbPending && currentAcct == null} error={wbFailed && currentAcct == null ? wbErrMsg : null} />
            <Row k="Population" v={fmtPop(population)} src="WB" loading={wbPending && population == null} error={wbFailed && population == null ? wbErrMsg : null} />
          </Section>

          {/* MARKETS — FX carry, vol, ETF flows */}
          {(carry || etf) && (
            <Section title="FX & flows">
              {carry && (
                <>
                  <Row k="Carry vs USD" v={`${carry.carryBps >= 0 ? '+' : ''}${carry.carryBps} bps`}
                    accent={carry.carryBps >= 500 ? 'caution' : undefined}
                    src="MKT" />
                  <Row k="1m FX vol" v={`${carry.vol1m.toFixed(1)}%`}
                    accent={carry.vol1m > 15 ? 'warn' : carry.vol1m > 10 ? 'caution' : undefined}
                    src="MKT · OPT" />
                </>
              )}
              {etf && (
                <>
                  <Row k={`ETF flows 1w (${etf.etf})`}
                    v={`${etf.netUsdM >= 0 ? '+' : ''}$${etf.netUsdM.toFixed(0)}M`}
                    valueColor={etfFlowColor(etf.netUsdM)}
                    src="MKT · ETF" />
                  <Row k="AUM" v={`$${etf.aumUsdB.toFixed(1)}B`} src="MKT · ETF" />
                </>
              )}
            </Section>
          )}

          {/* RISK */}
          <Section title="Risk · 7d window">
            <Row k="ACLED events" v={acledStats.count.toString()}
              accent={acledStats.count > 50 ? 'warn' : acledStats.count > 10 ? 'caution' : undefined}
              src="ACLED" />
            <Row k="Fatalities" v={acledStats.fatalities.toString()}
              accent={acledStats.fatalities > 0 ? 'warn' : undefined}
              src="ACLED" />
            <Row k="GDELT tone" v={tone != null ? tone.toFixed(2) : '—'}
              accent={tone != null && tone < -3 ? 'warn' : undefined}
              src="GDELT" />
            <Row k="OFAC entities" v={sanctionsRow ? sanctionsRow.count.toLocaleString() : '0'}
              accent={(sanctionsRow?.count ?? 0) > 100 ? 'warn' : undefined}
              src="OFAC" />
            <Row k="Travel advisory"
              v={advisory ? ADVISORY_LABEL[advisory.lvl] : '—'}
              valueColor={advisory ? advisoryColor(advisory.lvl) ?? undefined : undefined}
              src="US State" />
            {acledStats.byType.length > 0 && (
              <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1">
                {acledStats.byType.map(b => (
                  <span key={b.t} className="text-[9px] uppercase px-1.5 py-0.5 bg-muted text-muted-foreground">
                    {b.t} · {b.n}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* CALENDAR */}
          <Section title={`Calendar · next ${upcomingEvents.length || 0}`}>
            {upcomingEvents.length === 0 ? (
              <div className="px-3 py-3 text-[11px] text-muted-foreground">No scheduled events.</div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingEvents.map((e, i) => (
                  <div key={`${e.date}-${i}`} className="px-3 py-2 grid grid-cols-[60px_1fr_auto] gap-2 items-center text-[11px]">
                    <div className="text-muted-foreground">{e.date.slice(5)}</div>
                    <div className="text-foreground truncate">{e.event}</div>
                    <span
                      className="text-[9px] uppercase px-1.5 py-0.5"
                      style={{
                        background: e.impact === 'HIGH' ? 'hsl(0,85%,48%)' : e.impact === 'MED' ? 'hsl(28,95%,50%)' : 'hsl(220,15%,30%)',
                        color: 'white',
                      }}
                    >
                      {e.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-2 flex items-center justify-between">
          <button
            onClick={goToMacro}
            className="text-[10px] uppercase text-foreground hover:text-[hsl(28,95%,55%)] flex items-center gap-1"
          >
            Open Macro view <ExternalLink className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="text-[10px] uppercase text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/40">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  k, v, delta, deltaUnit, accent, valueColor, src, loading, error,
}: {
  k: string; v: string; delta?: number | null; deltaUnit?: string;
  accent?: 'warn' | 'caution'; valueColor?: string;
  /** Tiny footnote chip rendered next to the label, e.g. 'WB', 'FRED', 'ACLED'. */
  src?: string;
  /** When true, replace the value with an animated skeleton bar. */
  loading?: boolean;
  /** When set (and not loading), replace the value with an inline error chip. */
  error?: string | null;
}) {
  const accentCls =
    accent === 'warn' ? 'text-[hsl(0,85%,60%)]' :
    accent === 'caution' ? 'text-[hsl(48,90%,55%)]' : 'text-foreground';
  return (
    <div className="px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-border/50 last:border-b-0">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {k}
        {src && (
          <span
            className="text-[8px] uppercase font-mono tracking-wider px-1 py-px bg-muted/60 text-muted-foreground/80 border border-border/60"
            title={`Source: ${src}`}
          >
            {src}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        {loading ? (
          <span
            className="inline-block h-3 w-14 bg-muted/70 animate-pulse"
            aria-label="Loading"
          />
        ) : error ? (
          <span
            className="inline-flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider px-1.5 py-px bg-[hsl(0,70%,40%)]/15 text-[hsl(0,85%,65%)] border border-[hsl(0,70%,40%)]/40"
            title={`Failed to load: ${error}`}
            role="status"
          >
            <span className="w-1 h-1 rounded-full bg-[hsl(0,85%,60%)]" />
            ERR
          </span>
        ) : (
          <span className={accentCls} style={valueColor ? { color: valueColor } : undefined}>{v}</span>
        )}
        {!loading && !error && delta != null && Number.isFinite(delta) && (
          <span className={delta >= 0 ? 'text-[hsl(150,80%,55%)]' : 'text-[hsl(0,85%,60%)]'}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(2)}{deltaUnit ? ` ${deltaUnit}` : ''}
          </span>
        )}
      </span>
    </div>
  );
}

function Cell({
  label, value, chg, chgLabel,
}: { label: string; value: string; chg?: number | null; chgLabel?: string }) {
  return (
    <div className="bg-background px-2 py-1.5">
      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="text-[11px] text-foreground tabular-nums truncate">{value}</div>
      {chg != null && Number.isFinite(chg) && (
        <div className={`text-[9px] tabular-nums ${chg >= 0 ? 'text-[hsl(150,80%,55%)]' : 'text-[hsl(0,85%,60%)]'}`}>
          {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%{chgLabel ? ` ${chgLabel}` : ''}
        </div>
      )}
    </div>
  );
}
