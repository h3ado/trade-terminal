import { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SecurityOverview, SecurityFundamentals, SecurityChart } from '@/hooks/useSecurityData';
import { apiGet } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: string; url: string; title: string; domain: string;
  seendate: string; tone: number; topic: string;
}

interface OptionsSnap {
  iv: { atmIv: number; ivRank: number; ivPctl: number; rv20: number };
  gex: { largestCallWall: number; largestPutWall: number; netGex: number };
  regime: { spot: number; zeroG: number; regime: string; interpretation: string; flipProb: number };
}

interface Props {
  ticker: string;
  overview: SecurityOverview | null;
  fundamentals: SecurityFundamentals | null;
  chart: SecurityChart | null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtBig(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
function fmtPct(n: number | null | undefined, isDecimal = true): string {
  if (n == null || !isFinite(n)) return '—';
  const v = isDecimal ? n * 100 : n;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}
function fmtNum(n: number | null | undefined, d = 2, suffix = ''): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(d)}${suffix}`;
}
function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso.slice(0, 10); }
}
function fmtGex(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${n >= 0 ? '+' : ''}${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${n >= 0 ? '+' : ''}${(n / 1e6).toFixed(0)}M`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border/60 bg-surface-deep flex flex-col overflow-hidden ${className}`}>
      <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated shrink-0">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-2">
        {children}
      </div>
    </div>
  );
}

function KV({ label, value, valueClass = 'text-foreground' }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-1 py-[2px] border-b border-border/20">
      <span className="text-[8px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-[9px] font-semibold tabular-nums truncate ${valueClass}`}>{value}</span>
    </div>
  );
}

function Skel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-1.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-surface-elevated rounded" style={{ width: `${60 + (i * 13) % 35}%` }} />
      ))}
    </div>
  );
}

// SVG sparkline from OHLCV candles (close prices)
function Sparkline({ chart }: { chart: SecurityChart | null }) {
  if (!chart?.candles.length) {
    return <div className="flex items-center justify-center h-full text-muted-foreground text-[9px]">Chart loading…</div>;
  }
  const closes = chart.candles.map(c => c.close);
  const lo = Math.min(...closes);
  const hi = Math.max(...closes);
  const range = hi - lo || 1;
  const W = 200; const H = 60;
  const pts = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * W;
    const y = H - ((c - lo) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const isUp = closes[closes.length - 1] >= closes[0];
  const col = isUp ? '#38a838' : '#d63333';
  const pct = ((closes[closes.length - 1] - closes[0]) / closes[0] * 100);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-muted-foreground">{chart.candles[0]?.time}</span>
        <span className={`text-[8px] font-bold ${isUp ? 'text-positive' : 'text-negative'}`}>
          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
        <span className="text-[8px] text-muted-foreground">{chart.candles[chart.candles.length - 1]?.time}</span>
      </div>
      <div className="flex-1 min-h-0">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.2" />
              <stop offset="100%" stopColor={col} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#spark-fill)" />
          <polyline points={pts} fill="none" stroke={col} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-muted-foreground">${lo.toFixed(2)}</span>
        <span className="text-[8px] text-muted-foreground">${hi.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Mini bar chart for earnings beat/miss history
function EarningsChart({ history }: { history: { quarter: string; epsEstimate: number | null; epsActual: number | null; surprise: number | null }[] }) {
  if (!history.length) return <div className="text-muted-foreground text-[8px]">No earnings data</div>;
  const recent = history.slice(0, 6).reverse();
  const maxSurp = Math.max(...recent.map(h => Math.abs(h.surprise ?? 0)), 0.01);
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-end gap-1 flex-1 min-h-0">
        {recent.map((h, i) => {
          const beat = (h.surprise ?? 0) >= 0;
          const pct = Math.abs(h.surprise ?? 0) / maxSurp;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1" title={`${h.quarter}: ${beat ? '+' : ''}${((h.surprise ?? 0) * 100).toFixed(1)}%`}>
              <div className="w-full flex flex-col justify-end" style={{ height: '40px' }}>
                <div
                  className={beat ? 'bg-positive' : 'bg-negative'}
                  style={{ height: `${Math.max(4, pct * 40)}px`, minHeight: '4px' }}
                />
              </div>
              <span className={`text-[7px] font-bold ${beat ? 'text-positive' : 'text-negative'}`}>
                {beat ? '✓' : '✗'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {recent.map((h, i) => (
          <div key={i} className="flex-1 text-center text-[7px] text-muted-foreground truncate">{h.quarter?.slice(-5)}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OvrTab({ ticker, overview, fundamentals, chart }: Props) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [opts, setOpts] = useState<OptionsSnap | null>(null);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const d = await apiGet<{ articles: NewsArticle[] }>('/api/market/news/gdelt', { keyword: ticker, timespan: '24h' });
      setNews((d.articles ?? []).slice(0, 6));
    } catch { setNews([]); }
    finally { setNewsLoading(false); }
  }, [ticker]);

  const loadOpts = useCallback(async () => {
    try {
      const d = await apiGet<OptionsSnap>(`/api/market/options/snapshot/${encodeURIComponent(ticker)}`);
      setOpts(d);
    } catch { /* silent */ }
  }, [ticker]);

  useEffect(() => { loadNews(); loadOpts(); }, [loadNews, loadOpts]);

  const ks = fundamentals?.keyStats;
  const f  = fundamentals?.financials;
  const p  = fundamentals?.profile;
  const a  = fundamentals?.analyst;
  const est = fundamentals?.estimates;
  const ins = fundamentals?.insiders?.transactions ?? [];

  const totalAnalysts = a?.recommendations
    ? (a.recommendations.strongBuy + a.recommendations.buy + a.recommendations.hold + a.recommendations.sell + a.recommendations.strongSell)
    : 0;
  const bullishPct = totalAnalysts
    ? ((a!.recommendations!.strongBuy + a!.recommendations!.buy) / totalAnalysts) * 100
    : 0;

  return (
    <div className="h-full overflow-y-auto font-mono text-xs bg-background">
      {/* ── Row 1: Sparkline | Key Stats | Analyst ── */}
      <div className="grid grid-cols-3 gap-px border-b border-border/40" style={{ minHeight: '180px' }}>

        {/* Sparkline */}
        <Panel title={`Price Chart — 3M`} className="row-span-1">
          <Sparkline chart={chart} />
        </Panel>

        {/* Key Stats */}
        <Panel title="Key Statistics">
          {!fundamentals ? <Skel lines={8} /> : (
            <div className="space-y-0">
              <KV label="Market Cap"    value={fmtBig(ks?.marketCap)} />
              <KV label="Enterprise Val" value={fmtBig(ks?.enterpriseValue)} />
              <KV label="P/E (Trailing)" value={ks?.trailingPE != null ? `${ks.trailingPE.toFixed(1)}x` : '—'} />
              <KV label="P/E (Forward)"  value={ks?.forwardPE != null ? `${ks.forwardPE.toFixed(1)}x` : '—'} />
              <KV label="PEG Ratio"      value={ks?.pegRatio != null ? `${ks.pegRatio.toFixed(2)}x` : '—'} />
              <KV label="Price / Book"   value={ks?.priceToBook != null ? `${ks.priceToBook.toFixed(2)}x` : '—'} />
              <KV label="Beta"           value={fmtNum(ks?.beta)} />
              <KV label="Div Yield"      value={ks?.dividendYield != null ? `${(ks.dividendYield * 100).toFixed(2)}%` : '—'} />
              <KV label="Short Float"    value={ks?.shortPercentFloat != null ? `${(ks.shortPercentFloat * 100).toFixed(1)}%` : '—'} />
            </div>
          )}
        </Panel>

        {/* Analyst */}
        <Panel title="Analyst Consensus">
          {!fundamentals ? <Skel lines={6} /> : !a?.recommendations ? (
            <div className="text-muted-foreground text-[8px]">No analyst data</div>
          ) : (
            <div className="space-y-2">
              {/* Rating bar */}
              <div>
                <div className="flex h-2 rounded overflow-hidden mb-1">
                  {[
                    { key: 'strongBuy',  color: 'bg-positive' },
                    { key: 'buy',        color: 'bg-green-600' },
                    { key: 'hold',       color: 'bg-yellow-600' },
                    { key: 'sell',       color: 'bg-orange-600' },
                    { key: 'strongSell', color: 'bg-negative' },
                  ].map(({ key, color }) => {
                    const val = (a.recommendations as any)[key] as number;
                    const pct = totalAnalysts ? (val / totalAnalysts) * 100 : 0;
                    return pct > 0 ? <div key={key} className={color} style={{ width: `${pct}%` }} title={`${key}: ${val}`} /> : null;
                  })}
                </div>
                <div className="flex justify-between text-[7px] text-muted-foreground">
                  <span>Bearish</span>
                  <span className={bullishPct >= 50 ? 'text-positive font-bold' : 'text-negative font-bold'}>
                    {bullishPct.toFixed(0)}% bullish
                  </span>
                  <span>Bullish</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="border border-border/40 py-1">
                  <div className="text-[8px] text-muted-foreground">S.Buy</div>
                  <div className="text-[10px] font-bold text-positive">{a.recommendations.strongBuy}</div>
                </div>
                <div className="border border-border/40 py-1">
                  <div className="text-[8px] text-muted-foreground">Buy</div>
                  <div className="text-[10px] font-bold text-positive">{a.recommendations.buy}</div>
                </div>
                <div className="border border-border/40 py-1">
                  <div className="text-[8px] text-muted-foreground">Hold</div>
                  <div className="text-[10px] font-bold text-yellow-500">{a.recommendations.hold}</div>
                </div>
              </div>
              {a.targetMean != null && (
                <div className="border-t border-border/40 pt-1 space-y-0">
                  <KV label="Target (Mean)"  value={`$${a.targetMean.toFixed(2)}`} valueClass="text-accent" />
                  <KV label="Target Range"   value={`$${a.targetLow?.toFixed(0) ?? '—'} – $${a.targetHigh?.toFixed(0) ?? '—'}`} />
                  <KV label="# Analysts"     value={String(a.numAnalysts ?? '—')} />
                  {overview?.price && a.targetMean && (
                    <KV
                      label="Upside"
                      value={`${(((a.targetMean - overview.price) / overview.price) * 100).toFixed(1)}%`}
                      valueClass={(a.targetMean > overview.price) ? 'text-positive' : 'text-negative'}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Row 2: Profile | Financials | Earnings ── */}
      <div className="grid grid-cols-3 gap-px border-b border-border/40" style={{ minHeight: '160px' }}>

        {/* Company Profile */}
        <Panel title="Company Profile">
          {!fundamentals ? <Skel lines={5} /> : (
            <div className="space-y-0">
              <KV label="Sector"    value={p?.sector ?? '—'} />
              <KV label="Industry"  value={p?.industry ?? '—'} />
              <KV label="Employees" value={p?.employees?.toLocaleString() ?? '—'} />
              <KV label="Country"   value={p?.country ?? '—'} />
              {p?.website && (
                <KV
                  label="Website"
                  value={
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-0.5">
                      {p.website.replace(/^https?:\/\/(www\.)?/, '')}
                      <ExternalLink size={8} />
                    </a>
                  }
                />
              )}
              {p?.description && (
                <p className="text-[8px] text-muted-foreground leading-relaxed mt-1.5 line-clamp-4">
                  {p.description}
                </p>
              )}
            </div>
          )}
        </Panel>

        {/* Key Financials TTM */}
        <Panel title="Financials (TTM)">
          {!fundamentals ? <Skel lines={7} /> : (
            <div className="space-y-0">
              <KV label="Rev Growth YoY"  value={fmtPct(f?.revenueGrowth)}  valueClass={f?.revenueGrowth != null ? (f.revenueGrowth >= 0 ? 'text-positive' : 'text-negative') : ''} />
              <KV label="EPS Growth YoY"  value={fmtPct(f?.earningsGrowth)} valueClass={f?.earningsGrowth != null ? (f.earningsGrowth >= 0 ? 'text-positive' : 'text-negative') : ''} />
              <KV label="Gross Margin"    value={fmtPct(f?.grossMargins)} />
              <KV label="Op Margin"       value={fmtPct(f?.operatingMargins)} />
              <KV label="Net Margin"      value={fmtPct(f?.profitMargins)} />
              <KV label="ROE"             value={fmtPct(f?.returnOnEquity)} />
              <KV label="ROA"             value={fmtPct(f?.returnOnAssets)} />
              <KV label="Free Cash Flow"  value={fmtBig(f?.freeCashflow)} />
              <KV label="Total Debt"      value={fmtBig(f?.totalDebt)} />
              <KV label="Cash & Eq."      value={fmtBig(f?.totalCash)} />
            </div>
          )}
        </Panel>

        {/* Earnings History */}
        <Panel title="Earnings History">
          {!fundamentals ? <Skel lines={4} /> : !est?.history?.length ? (
            <div className="text-muted-foreground text-[8px]">No earnings data</div>
          ) : (
            <div className="h-full flex flex-col">
              <EarningsChart history={est.history} />
              <div className="border-t border-border/40 pt-1 mt-1 space-y-0">
                {est.history.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex justify-between text-[8px] py-[1px]">
                    <span className="text-muted-foreground">{h.quarter}</span>
                    <span className={h.surprise != null && h.surprise >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.surprise != null ? `${h.surprise >= 0 ? '+' : ''}${(h.surprise * 100).toFixed(1)}%` : '—'}
                    </span>
                    <span className={h.surprise != null && h.surprise >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}>
                      {h.surprise != null && h.surprise >= 0 ? '✓ BEAT' : '✗ MISS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Row 3: News | Options + Insiders ── */}
      <div className="grid grid-cols-[1fr_auto] gap-px" style={{ minHeight: '180px' }}>

        {/* News */}
        <Panel title={`Recent News — ${ticker}`}>
          {newsLoading ? <Skel lines={5} /> : news.length === 0 ? (
            <div className="text-muted-foreground text-[8px]">No recent news found</div>
          ) : (
            <div className="space-y-0">
              {news.map((n, i) => (
                <div key={i} className="flex gap-2 py-1 border-b border-border/20 group">
                  <div className="flex-1 min-w-0">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-foreground hover:text-accent leading-snug line-clamp-2 block"
                    >
                      {n.title}
                    </a>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[7px] text-muted-foreground">{n.domain}</span>
                      <span className="text-[7px] text-muted-foreground">{fmtDate(n.seendate)}</span>
                      {n.tone != null && (
                        <span className={`text-[7px] font-bold ${n.tone > 1 ? 'text-positive' : n.tone < -1 ? 'text-negative' : 'text-muted-foreground'}`}>
                          {n.tone > 1 ? '▲' : n.tone < -1 ? '▼' : '●'} {n.tone.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Options + Insiders stacked */}
        <div className="flex flex-col gap-px w-56">
          {/* Options Snapshot */}
          <Panel title="Options Snapshot" className="flex-1">
            {!opts ? <Skel lines={5} /> : (
              <div className="space-y-0">
                <KV label="ATM IV"     value={`${opts.iv.atmIv.toFixed(1)}%`} />
                <KV
                  label="IV Rank"
                  value={<span className={opts.iv.ivRank > 75 ? 'text-positive' : opts.iv.ivRank > 25 ? 'text-accent' : 'text-negative'}>{opts.iv.ivRank} / 100</span>}
                />
                <KV label="IV Pctl"    value={`${opts.iv.ivPctl}th`} />
                <KV label="HV 20"      value={`${opts.iv.rv20.toFixed(1)}%`} />
                <KV label="IV vs HV"   value={`${(opts.iv.atmIv - opts.iv.rv20) >= 0 ? '+' : ''}${(opts.iv.atmIv - opts.iv.rv20).toFixed(1)}%`}
                  valueClass={(opts.iv.atmIv - opts.iv.rv20) >= 0 ? 'text-positive' : 'text-negative'}
                />
                <div className="border-t border-border/40 pt-1 mt-1">
                  <div className={`text-[8px] font-bold px-1 py-0.5 inline-block border rounded mb-1 ${opts.regime.regime === 'long-gamma' ? 'bg-positive/20 text-positive border-positive/30' : 'bg-negative/20 text-negative border-negative/30'}`}>
                    {opts.regime.regime === 'long-gamma' ? 'LONG GAMMA' : 'SHORT GAMMA'}
                  </div>
                  <KV label="Call Wall" value={<span className="text-positive">${opts.gex.largestCallWall}</span>} />
                  <KV label="Put Wall"  value={<span className="text-negative">${opts.gex.largestPutWall}</span>} />
                  <KV label="Net GEX"   value={<span className={opts.gex.netGex >= 0 ? 'text-positive' : 'text-negative'}>{fmtGex(opts.gex.netGex)}</span>} />
                </div>
              </div>
            )}
          </Panel>

          {/* Insider Activity */}
          <Panel title="Insider Activity" className="flex-1">
            {!fundamentals ? <Skel lines={3} /> : ins.length === 0 ? (
              <div className="text-muted-foreground text-[8px]">No recent insider data</div>
            ) : (
              <div className="space-y-0">
                {ins.slice(0, 5).map((t, i) => {
                  const isBuy = /buy|purchase/i.test(t.description);
                  const isSell = /sale|sell/i.test(t.description);
                  return (
                    <div key={i} className="flex gap-1 py-[2px] border-b border-border/20">
                      <span className={`text-[7px] font-bold w-6 shrink-0 ${isBuy ? 'text-positive' : isSell ? 'text-negative' : 'text-muted-foreground'}`}>
                        {isBuy ? 'BUY' : isSell ? 'SEL' : 'OTH'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] text-foreground truncate">{t.name}</div>
                        <div className="text-[7px] text-muted-foreground">{t.date} · {t.relation}</div>
                      </div>
                      {t.value != null && (
                        <div className="text-[8px] tabular-nums text-right shrink-0">
                          {fmtBig(t.value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
