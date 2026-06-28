import { useState, useEffect, useCallback } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { useCrypto } from '@/hooks/useCrypto';
import { useFXRates } from '@/hooks/useFXRates';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';

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
function fmtPct(n: number | null) {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
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

function Ph({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
      {right && <span className="text-[7px] text-muted-foreground">{right}</span>}
    </div>
  );
}

// ─── Index groups ─────────────────────────────────────────────────────────────

const EQUITY_GROUPS = [
  { label: 'Americas', abbrs: ['SPX', 'NDX', 'DJI', 'RUT', 'TSX', 'BOVESPA'] },
  { label: 'Europe',   abbrs: ['FTSE', 'DAX', 'CAC', 'IBEX', 'SMI', 'MIB'] },
  { label: 'Asia',     abbrs: ['NKY', 'HSI', 'SHCOMP', 'KOSPI', 'ASX', 'SENSEX'] },
];

// Major FX pairs (quote: ccy per USD unless noted)
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

const IMPORTANCE_COLOR: Record<number, string> = {
  3: 'text-negative',
  2: 'text-orange-400',
  1: 'text-muted-foreground',
};

// ─── Top KPI strip ────────────────────────────────────────────────────────────

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

  const spx  = byAbbr['SPX'];
  const ndx  = byAbbr['NDX'];
  const btc  = coins.find(c => c.symbol === 'BTC');
  const eth  = coins.find(c => c.symbol === 'ETH');

  const totalCap = coins.reduce((s, c) => s + (c.marketCap ?? 0), 0);
  const btcDom   = btc ? (btc.marketCap / totalCap * 100) : 0;

  // Today's high-importance events
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events
    .filter(e => e.ts.startsWith(today) && e.importance >= 2)
    .sort((a, b) => a.ts.localeCompare(b.ts));
  const todayEarnings = events
    .filter(e => e.ts.startsWith(today) && e.kind === 'earnings')
    .sort((a, b) => a.ts.localeCompare(b.ts));

  const loading = idxLoading && cryptoLoading && fxLoading;

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* ── Top header ── */}
      <div className="shrink-0 border-b border-border bg-surface-elevated flex items-center px-3 py-1.5 gap-3 overflow-x-auto">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest shrink-0">OVER</span>
        <span className="text-[8px] text-muted-foreground shrink-0">Global Market Overview</span>

        {/* Key index KPIs */}
        {[
          { label: 'SPX',   q: spx,  price: spx?.close,  pct: spx?.change_pct },
          { label: 'NDX',   q: ndx,  price: ndx?.close,  pct: ndx?.change_pct },
        ].map(k => k.price != null && (
          <div key={k.label} className="flex items-baseline gap-1.5 border-l border-border pl-3 shrink-0">
            <span className="text-[8px] text-muted-foreground">{k.label}</span>
            <span className="text-[11px] font-bold tabular-nums">{fmtPrice(k.price)}</span>
            <PctCell n={k.pct ?? null} cls="text-[9px]" />
          </div>
        ))}

        {/* BTC/ETH */}
        {btc && (
          <div className="flex items-baseline gap-1.5 border-l border-border pl-3 shrink-0">
            <span className="text-[8px] text-muted-foreground">BTC</span>
            <span className="text-[11px] font-bold tabular-nums">{fmtCrypto(btc.price)}</span>
            <PctCell n={btc.change24hPct} cls="text-[9px]" />
          </div>
        )}
        {eth && (
          <div className="flex items-baseline gap-1.5 border-l border-border pl-3 shrink-0">
            <span className="text-[8px] text-muted-foreground">ETH</span>
            <span className="text-[11px] font-bold tabular-nums">{fmtCrypto(eth.price)}</span>
            <PctCell n={eth.change24hPct} cls="text-[9px]" />
          </div>
        )}

        {/* Fear & Greed */}
        {fg?.current && (
          <div className="flex items-center gap-1.5 border-l border-border pl-3 shrink-0">
            <span className="text-[8px] text-muted-foreground">F&G</span>
            <span className={`text-[11px] font-bold tabular-nums ${fgColor(fg.current.value_classification)}`}>
              {fg.current.value}
            </span>
            <span className={`text-[8px] font-semibold ${fgColor(fg.current.value_classification)}`}>
              {fg.current.value_classification}
            </span>
          </div>
        )}

        <button onClick={loadFg} className="ml-auto text-muted-foreground hover:text-accent">
          <RefreshCw size={10} />
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
            <Ph label="Global Equities" right="~1min" />
            <div className="flex-1 min-h-0 overflow-y-auto">
              {EQUITY_GROUPS.map(g => {
                const rows = g.abbrs.map(a => byAbbr[a]).filter(Boolean);
                if (!rows.length) return null;
                return (
                  <div key={g.label}>
                    <div className="px-2 py-[3px] bg-surface-deep border-b border-border/40">
                      <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">{g.label}</span>
                    </div>
                    {rows.map(idx => (
                      <div key={idx.abbr} className="flex items-center justify-between px-2 py-[4px] border-b border-border/20 hover:bg-surface-elevated">
                        <span className="text-[9px] font-bold text-foreground w-16 shrink-0">{idx.abbr}</span>
                        <span className="text-[9px] tabular-nums text-foreground flex-1 text-right pr-2">
                          {idx.close != null ? fmtPrice(idx.close) : '—'}
                        </span>
                        <PctCell n={idx.change_pct} cls="text-[9px] w-16 text-right" />
                        {/* mini bar */}
                        <div className="w-12 h-1.5 bg-surface-elevated ml-2 shrink-0">
                          {idx.change_pct != null && (
                            <div
                              className={`h-full ${idx.change_pct >= 0 ? 'bg-positive' : 'bg-negative'}`}
                              style={{ width: `${Math.min(100, Math.abs(idx.change_pct) * 20)}%`, marginLeft: idx.change_pct < 0 ? 'auto' : 0 }}
                            />
                          )}
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
            <Ph label="Crypto Markets" right="~1min" />

            {/* Market cap summary strip */}
            <div className="shrink-0 border-b border-border/60 px-2 py-1 flex items-center gap-3 bg-surface-deep">
              <div className="flex flex-col">
                <span className="text-[7px] text-muted-foreground uppercase">Total Mkt Cap</span>
                <span className="text-[9px] font-bold tabular-nums">{fmtBig(totalCap)}</span>
              </div>
              <div className="flex flex-col border-l border-border/40 pl-3">
                <span className="text-[7px] text-muted-foreground uppercase">BTC Dom</span>
                <span className="text-[9px] font-bold tabular-nums text-orange-400">{btcDom.toFixed(1)}%</span>
              </div>
              {fg?.current && (
                <div className="flex flex-col border-l border-border/40 pl-3 ml-auto">
                  <span className="text-[7px] text-muted-foreground uppercase">F&G</span>
                  <span className={`text-[9px] font-bold tabular-nums ${fgColor(fg.current.value_classification)}`}>
                    {fg.current.value} · {fg.current.value_classification}
                  </span>
                </div>
              )}
            </div>

            {/* Top coins table */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border">
                    <th className="text-left px-2 py-1 text-[7px] text-muted-foreground font-normal">#</th>
                    <th className="text-left px-2 py-1 text-[7px] text-muted-foreground font-normal">Coin</th>
                    <th className="text-right px-2 py-1 text-[7px] text-muted-foreground font-normal">Price</th>
                    <th className="text-right px-2 py-1 text-[7px] text-muted-foreground font-normal">24h</th>
                    <th className="text-right px-2 py-1 text-[7px] text-muted-foreground font-normal">Mkt Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.slice(0, 15).map((c, i) => (
                    <tr key={c.id} className="border-b border-border/20 hover:bg-surface-elevated">
                      <td className="px-2 py-[4px] text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-[4px]">
                        <div className="flex items-center gap-1">
                          {c.image && <img src={c.image} alt={c.symbol} className="w-3.5 h-3.5 shrink-0" />}
                          <span className="font-bold text-foreground">{c.symbol}</span>
                        </div>
                      </td>
                      <td className="px-2 py-[4px] text-right tabular-nums">{fmtCrypto(c.price)}</td>
                      <td className="px-2 py-[4px] text-right"><PctCell n={c.change24hPct} /></td>
                      <td className="px-2 py-[4px] text-right tabular-nums text-muted-foreground">{fmtBig(c.marketCap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── COL 3: FX & Rates ── */}
          <div className="w-[24%] shrink-0 border-r border-border flex flex-col min-h-0">
            <Ph label="FX Majors" right="~1min" />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border">
                    <th className="text-left px-2 py-1 text-[7px] text-muted-foreground font-normal">Pair</th>
                    <th className="text-right px-2 py-1 text-[7px] text-muted-foreground font-normal">Rate</th>
                    <th className="text-right px-2 py-1 text-[7px] text-muted-foreground font-normal">24h</th>
                  </tr>
                </thead>
                <tbody>
                  {FX_PAIRS.map(p => {
                    const r = byRate[p.ccy];
                    if (!r) return null;
                    const rate = p.invert ? r.usd : (1 / r.usd);
                    const chg  = p.invert ? (r.change_pct ?? null) : (r.change_pct != null ? -r.change_pct : null);
                    return (
                      <tr key={p.label} className="border-b border-border/20 hover:bg-surface-elevated">
                        <td className="px-2 py-[4px] font-bold text-foreground">{p.label}</td>
                        <td className="px-2 py-[4px] text-right tabular-nums">{rate.toFixed(4)}</td>
                        <td className="px-2 py-[4px] text-right"><PctCell n={chg} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Divider for rates section */}
              <div className="px-2 py-[3px] bg-surface-deep border-y border-border/40 mt-0">
                <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">DXY Proxy</span>
              </div>
              {(() => {
                const eur = byRate['EUR'];
                const gbp = byRate['GBP'];
                const jpy = byRate['JPY'];
                return (
                  <div className="px-2 py-1 space-y-[2px]">
                    {[
                      { label: 'EUR weight (57.6%)', r: eur, invert: true },
                      { label: 'GBP weight (11.9%)', r: gbp, invert: true },
                      { label: 'JPY weight (13.6%)', r: jpy, invert: false },
                    ].map(row => row.r && (
                      <div key={row.label} className="flex justify-between border-b border-border/10 py-[2px]">
                        <span className="text-[7px] text-muted-foreground">{row.label}</span>
                        <PctCell n={row.invert ? (row.r.change_pct ?? null) : (row.r.change_pct != null ? -row.r.change_pct : null)} cls="text-[8px]" />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── COL 4: Today's Schedule ── */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <Ph label="Today's Schedule" right={today} />

            {/* Econ events */}
            <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
              <div className="px-2 py-[3px] bg-surface-deep border-b border-border/40 shrink-0">
                <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">Economic Releases</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {calLoading ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground animate-pulse">Loading…</div>
                ) : todayEvents.filter(e => e.kind === 'econ').length === 0 ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground">No high-importance events today</div>
                ) : (
                  todayEvents.filter(e => e.kind === 'econ').slice(0, 12).map(e => (
                    <div key={e.id} className="flex items-start gap-2 px-2 py-[4px] border-b border-border/20 hover:bg-surface-elevated">
                      <span className={`text-[7px] shrink-0 w-8 tabular-nums font-mono ${IMPORTANCE_COLOR[e.importance]}`}>
                        {fmtTime(e.ts)}
                      </span>
                      <span className="text-[7px] text-muted-foreground shrink-0 w-5 uppercase">{e.country}</span>
                      <span className="text-[8px] text-foreground flex-1 leading-tight">{e.label}</span>
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

            {/* Earnings today */}
            <div className="flex-[2] min-h-0 flex flex-col">
              <div className="px-2 py-[3px] bg-surface-deep border-b border-border/40 shrink-0">
                <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">Earnings Today</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {todayEarnings.length === 0 ? (
                  <div className="px-2 py-2 text-[8px] text-muted-foreground">No earnings scheduled today</div>
                ) : (
                  todayEarnings.slice(0, 8).map(e => (
                    <div key={e.id} className="flex items-center gap-2 px-2 py-[4px] border-b border-border/20 hover:bg-surface-elevated">
                      <span className="text-[8px] font-bold text-accent w-12 shrink-0">{e.ticker}</span>
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
