import { useState, useEffect, useCallback } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { useCrypto } from '@/hooks/useCrypto';
import { useFXRates } from '@/hooks/useFXRates';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { MiniLine } from '@/components/terminal/MiniLine';

// ─── Navigation ───────────────────────────────────────────────────────────────

const fire = (code: string) =>
  window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } }));

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1000)  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (n >= 1)     return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toFixed(4);
}
function fmtCrypto(n: number) {
  if (n >= 10000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n >= 1)     return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(4)}`;
}
function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch { return '—'; }
}

function PctCell({ n, cls = '' }: { n: number | null; cls?: string }) {
  if (n == null) return <span className={`text-muted-foreground ${cls}`}>—</span>;
  return (
    <span className={`tabular-nums font-semibold ${n >= 0 ? 'text-positive' : 'text-negative'} ${cls}`}>
      {n >= 0 ? '+' : ''}{n.toFixed(2)}%
    </span>
  );
}

// Section header — flat Bloomberg-style, no elevation. Optional drill-down link.
function Ph({ label, right, onDrillDown }: { label: string; right?: React.ReactNode; onDrillDown?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-[2px] border-b border-border shrink-0 sticky top-0 bg-surface-deep z-10">
      <span className="text-[7px] text-accent font-bold uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        {right && <span className="text-[7px] text-muted-foreground">{right}</span>}
        {onDrillDown && (
          <button
            onClick={onDrillDown}
            className="text-[7px] text-accent/50 hover:text-accent uppercase tracking-wider transition-colors"
          >
            ALL →
          </button>
        )}
      </div>
    </div>
  );
}

// Sub-group label — left accent bar, no bg
function SubPh({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-[2px] border-b border-border border-l-2 border-l-accent shrink-0 sticky top-0 bg-surface-deep z-10">
      <span className="text-[7px] text-accent font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Static config ────────────────────────────────────────────────────────────

const EQUITY_GROUPS = [
  { label: 'Americas', abbrs: ['SPX', 'NDX', 'DJI', 'RUT', 'TSX', 'BOVESPA'] },
  { label: 'Europe',   abbrs: ['FTSE', 'DAX', 'CAC', 'IBEX', 'SMI', 'MIB'] },
  { label: 'Asia',     abbrs: ['NKY', 'HSI', 'SHCOMP', 'KOSPI', 'ASX', 'SENSEX'] },
];

const FX_PAIRS = [
  { label: 'EUR/USD', ccy: 'EUR', invert: true },
  { label: 'GBP/USD', ccy: 'GBP', invert: true },
  { label: 'USD/JPY', ccy: 'JPY', invert: false },
  { label: 'USD/CHF', ccy: 'CHF', invert: false },
  { label: 'AUD/USD', ccy: 'AUD', invert: true },
  { label: 'USD/CAD', ccy: 'CAD', invert: false },
  { label: 'NZD/USD', ccy: 'NZD', invert: true },
  { label: 'USD/CNY', ccy: 'CNY', invert: false },
  { label: 'USD/MXN', ccy: 'MXN', invert: false },
  { label: 'USD/BRL', ccy: 'BRL', invert: false },
];

const IMP_COLOR: Record<number, string> = {
  3: 'text-negative',
  2: 'text-orange-400',
  1: 'text-muted-foreground',
};

// ─── F&G helpers ──────────────────────────────────────────────────────────────

interface FGData { current: { value: string; value_classification: string } | null }

function fgColor(cls: string) {
  const l = cls.toLowerCase();
  if (l.includes('extreme fear'))  return 'text-negative';
  if (l.includes('fear'))          return 'text-orange-400';
  if (l.includes('neutral'))       return 'text-muted-foreground';
  if (l.includes('extreme greed')) return 'text-positive';
  if (l.includes('greed'))         return 'text-green-500';
  return 'text-foreground';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OverviewView() {
  const { indices, loading: idxLoading } = useIndices();
  const { coins, loading: cryptoLoading } = useCrypto();
  const { rates, loading: fxLoading } = useFXRates();
  const { events, loading: calLoading } = useEconCalendar();
  const [fg, setFg] = useState<FGData | null>(null);

  const loadFg = useCallback(() => {
    apiGet<FGData>('/api/market/crypto/fear-greed').then(setFg).catch(() => {});
  }, []);

  useEffect(() => { loadFg(); }, [loadFg]);

  const byAbbr = Object.fromEntries(indices.map(i => [i.abbr, i]));
  const byRate  = Object.fromEntries(rates.map(r => [r.ccy, r]));

  const spx = byAbbr['SPX'];
  const ndx = byAbbr['NDX'];
  const btc = coins.find(c => c.symbol === 'BTC');
  const eth = coins.find(c => c.symbol === 'ETH');

  const totalCap = coins.reduce((s, c) => s + (c.marketCap ?? 0), 0);
  const btcDom   = btc ? (btc.marketCap / totalCap * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents   = events.filter(e => e.ts.startsWith(today) && e.importance >= 2).sort((a, b) => a.ts.localeCompare(b.ts));
  const todayEarnings = events.filter(e => e.ts.startsWith(today) && e.kind === 'earnings').sort((a, b) => a.ts.localeCompare(b.ts));

  const loading = idxLoading && cryptoLoading && fxLoading;

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* ── Flat terminal header strip ── */}
      <div className="shrink-0 border-b border-border flex items-center px-3 py-[4px] gap-3 overflow-x-auto">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest shrink-0 border-r border-border pr-3">OVER</span>

        {[
          { label: 'SPX', price: spx?.close, pct: spx?.change_pct ?? null, code: 'SPX' },
          { label: 'NDX', price: ndx?.close, pct: ndx?.change_pct ?? null, code: 'NDX' },
          { label: 'BTC', price: btc?.price, pct: btc?.change24hPct ?? null, prefix: '$', code: 'BTC' },
          { label: 'ETH', price: eth?.price, pct: eth?.change24hPct ?? null, prefix: '$', code: 'ETH' },
        ].map(k => k.price != null && (
          <button
            key={k.label}
            onClick={() => fire(k.code)}
            className="flex items-baseline gap-1.5 border-r border-border pr-3 shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-[8px] text-muted-foreground">{k.label}</span>
            <span className="text-[11px] font-bold tabular-nums text-foreground">
              {k.prefix}{fmtPrice(k.price)}
            </span>
            <PctCell n={k.pct} cls="text-[9px]" />
          </button>
        ))}

        {fg?.current && (
          <button
            onClick={() => fire('CRYS')}
            className="flex items-baseline gap-1.5 border-r border-border pr-3 shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="text-[8px] text-muted-foreground">F&amp;G</span>
            <span className={`text-[11px] font-bold tabular-nums ${fgColor(fg.current.value_classification)}`}>
              {fg.current.value}
            </span>
            <span className={`text-[8px] ${fgColor(fg.current.value_classification)}`}>
              {fg.current.value_classification}
            </span>
          </button>
        )}

        <button onClick={loadFg} className="ml-auto text-muted-foreground hover:text-accent">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-[10px] animate-pulse">
          Loading market data…
        </div>
      )}

      {/* ── 4-column grid ── */}
      {!loading && (
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* ── COL 1: Global Equities ── */}
          <div className="w-[27%] shrink-0 border-r border-border flex flex-col min-h-0">
            <Ph label="Global Equities" right="~1min" onDrillDown={() => fire('WEI')} />

            {/* column headers */}
            <div className="shrink-0 flex text-[7px] text-muted-foreground border-b border-border px-2 py-[2px]">
              <span className="w-14">SYM</span>
              <span className="flex-1 text-right">PRICE</span>
              <span className="w-16 text-right">CHG</span>
              <span className="w-12 shrink-0" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {EQUITY_GROUPS.map(g => {
                const rows = g.abbrs.map(a => byAbbr[a]).filter(Boolean);
                if (!rows.length) return null;
                return (
                  <div key={g.label}>
                    <SubPh label={g.label} />
                    {rows.map(idx => (
                      <div
                        key={idx.abbr}
                        className="flex items-center px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                        onClick={() => fire(idx.abbr)}
                      >
                        <span className="text-[9px] font-bold text-foreground group-hover:text-accent w-14 shrink-0 transition-colors">{idx.abbr}</span>
                        <span className="text-[9px] tabular-nums text-foreground flex-1 text-right">
                          {idx.close != null ? fmtPrice(idx.close) : '—'}
                        </span>
                        <PctCell n={idx.change_pct ?? null} cls="text-[9px] w-16 text-right shrink-0" />
                        <div className="ml-2 shrink-0">
                          <MiniLine seed={idx.abbr} trend={idx.change_pct ?? 0} width={48} height={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── COL 2: Crypto ── */}
          <div className="w-[25%] shrink-0 border-r border-border flex flex-col min-h-0">
            <Ph label="Crypto Markets" right="~1min" onDrillDown={() => fire('CRYP')} />

            {/* Flat market cap summary strip — no background elevation */}
            <div className="shrink-0 border-b border-border px-2 py-[4px] flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[7px] text-muted-foreground uppercase">Total Mcap</span>
                <span className="text-[9px] font-bold tabular-nums text-foreground">{fmtBig(totalCap)}</span>
              </div>
              <div className="flex flex-col border-l border-border pl-3">
                <span className="text-[7px] text-muted-foreground uppercase">BTC Dom</span>
                <span className="text-[9px] font-bold tabular-nums text-orange-400">{btcDom.toFixed(1)}%</span>
              </div>
              {fg?.current && (
                <button
                  onClick={() => fire('CRYS')}
                  className="flex flex-col border-l border-border pl-3 hover:opacity-80 transition-opacity"
                >
                  <span className="text-[7px] text-muted-foreground uppercase">F&amp;G</span>
                  <span className={`text-[9px] font-bold tabular-nums ${fgColor(fg.current.value_classification)}`}>
                    {fg.current.value} · {fg.current.value_classification}
                  </span>
                </button>
              )}
            </div>

            {/* Column headers — flat, no bg */}
            <div className="shrink-0 flex text-[7px] text-muted-foreground border-b border-border px-2 py-[2px]">
              <span className="w-5">#</span>
              <span className="w-10">SYM</span>
              <span className="flex-1 text-right">PRICE</span>
              <span className="w-14 text-right">24H</span>
              <span className="w-10 shrink-0" />
              <span className="w-14 text-right">MCAP</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {coins.slice(0, 15).map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                  onClick={() => fire(c.symbol.toUpperCase())}
                >
                  <span className="text-[8px] text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <span className="text-[9px] font-bold text-foreground group-hover:text-accent w-10 shrink-0 transition-colors">{c.symbol}</span>
                  <span className="text-[9px] tabular-nums text-foreground flex-1 text-right">{fmtCrypto(c.price)}</span>
                  <PctCell n={c.change24hPct} cls="text-[9px] w-14 text-right shrink-0" />
                  <div className="w-10 shrink-0 flex justify-center">
                    <MiniLine seed={c.symbol} trend={c.change24hPct ?? 0} width={40} height={10} />
                  </div>
                  <span className="text-[8px] tabular-nums text-muted-foreground w-14 text-right shrink-0">{fmtBig(c.marketCap)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── COL 3: FX Majors ── */}
          <div className="w-[24%] shrink-0 border-r border-border flex flex-col min-h-0">
            <Ph label="FX Majors" right="~1min" onDrillDown={() => fire('FXC')} />

            {/* Column headers */}
            <div className="shrink-0 flex text-[7px] text-muted-foreground border-b border-border px-2 py-[2px]">
              <span className="flex-1">PAIR</span>
              <span className="w-16 text-right">RATE</span>
              <span className="w-14 text-right">24H</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {FX_PAIRS.map(p => {
                const r = byRate[p.ccy];
                if (!r) return null;
                const rate = p.invert ? r.usd : (1 / r.usd);
                const chg  = p.invert ? (r.change_pct ?? null) : (r.change_pct != null ? -r.change_pct : null);
                return (
                  <div
                    key={p.label}
                    className="flex items-center px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                    onClick={() => fire('FX')}
                  >
                    <span className="text-[9px] font-bold text-foreground group-hover:text-accent flex-1 transition-colors">{p.label}</span>
                    <span className="text-[9px] tabular-nums text-foreground w-16 text-right">{rate.toFixed(4)}</span>
                    <PctCell n={chg} cls="text-[9px] w-14 text-right shrink-0" />
                  </div>
                );
              })}

              {/* DXY component weights — inline sub-section */}
              <SubPh label="DXY Components" />
              {(() => {
                const eur = byRate['EUR'];
                const gbp = byRate['GBP'];
                const jpy = byRate['JPY'];
                return [
                  { label: 'EUR  57.6%', r: eur, invert: true },
                  { label: 'GBP  11.9%', r: gbp, invert: true },
                  { label: 'JPY  13.6%', r: jpy, invert: false },
                ].map(row => row.r && (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                    onClick={() => fire('FXC')}
                  >
                    <span className="text-[8px] text-muted-foreground group-hover:text-foreground transition-colors">{row.label}</span>
                    <PctCell n={row.invert ? (row.r.change_pct ?? null) : (row.r.change_pct != null ? -row.r.change_pct : null)} cls="text-[8px]" />
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ── COL 4: Today's Schedule ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <Ph label="Today's Schedule" right={today} onDrillDown={() => fire('ECO')} />

            {/* Econ releases */}
            <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
              <SubPh label="Economic Releases" />
              <div className="flex-1 min-h-0 overflow-y-auto">
                {calLoading ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground animate-pulse">Loading…</div>
                ) : todayEvents.filter(e => e.kind === 'econ').length === 0 ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground">No high-importance events today</div>
                ) : (
                  todayEvents.filter(e => e.kind === 'econ').slice(0, 12).map(e => (
                    <div
                      key={e.id}
                      className="flex items-start gap-2 px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                      onClick={() => fire('ECO')}
                    >
                      <span className={`text-[7px] shrink-0 w-8 tabular-nums ${IMP_COLOR[e.importance] ?? 'text-muted-foreground'}`}>
                        {fmtTime(e.ts)}
                      </span>
                      <span className="text-[7px] text-muted-foreground shrink-0 w-5 uppercase">{e.country}</span>
                      <span className="text-[8px] text-foreground group-hover:text-accent flex-1 leading-tight transition-colors">{e.label}</span>
                      {e.actual != null && (
                        <span className={`text-[8px] tabular-nums shrink-0 font-bold ${e.forecast != null && e.actual > e.forecast ? 'text-positive' : e.forecast != null && e.actual < e.forecast ? 'text-negative' : 'text-foreground'}`}>
                          {e.actual}{e.unit ?? ''}
                        </span>
                      )}
                      {e.actual == null && e.forecast != null && (
                        <span className="text-[8px] tabular-nums shrink-0 text-muted-foreground">
                          exp {e.forecast}{e.unit ?? ''}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Earnings */}
            <div className="flex-[2] min-h-0 flex flex-col">
              <SubPh label="Earnings Today" />
              <div className="flex-1 min-h-0 overflow-y-auto">
                {todayEarnings.length === 0 ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground">No earnings scheduled today</div>
                ) : (
                  todayEarnings.slice(0, 8).map(e => (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                      onClick={() => e.ticker && fire(e.ticker)}
                    >
                      <span className="text-[8px] font-bold text-accent group-hover:text-foreground w-12 shrink-0 transition-colors">{e.ticker}</span>
                      <span className="text-[7px] text-muted-foreground flex-1 truncate">{e.label}</span>
                      <span className="text-[7px] text-muted-foreground shrink-0">{e.when ?? ''}</span>
                      {e.eps_est != null && (
                        <span className="text-[7px] tabular-nums text-muted-foreground shrink-0">
                          est ${e.eps_est.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
