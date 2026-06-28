import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { useCrypto } from '@/hooks/useCrypto';
import { apiGet } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FGData { current: { value: string; value_classification: string } | null }
interface NewsArticle { id: string; url: string; title: string; domain: string; seendate: string; tone: number }

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}
function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return iso.slice(0, 10); }
}

function PanelHdr({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 py-[3px] border-b border-border/60 bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{children}</span>
      {right && <span className="text-[8px] text-muted-foreground">{right}</span>}
    </div>
  );
}

function FgBadge({ val, cls }: { val: number; cls: string }) {
  const c = cls.toLowerCase();
  const color = c.includes('extreme fear') ? 'text-negative border-negative/40 bg-negative/10'
    : c.includes('fear')  ? 'text-orange-400 border-orange-400/40 bg-orange-400/10'
    : c.includes('neutral') ? 'text-muted-foreground border-border bg-surface-elevated'
    : c.includes('extreme greed') ? 'text-positive border-positive/40 bg-positive/10'
    : 'text-green-500 border-green-500/40 bg-green-500/10';
  return (
    <div className={`flex flex-col items-center justify-center border px-3 py-2 ${color}`}>
      <span className="text-[26px] font-bold tabular-nums leading-none">{val}</span>
      <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">{cls}</span>
      <span className="text-[7px] mt-0.5 opacity-60">Fear &amp; Greed</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CryptoHome() {
  const { coins, loading: coinsLoading } = useCrypto();
  const [fg, setFg] = useState<FGData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const loadFg = useCallback(async () => {
    try { const d = await apiGet<FGData>('/api/market/crypto/fear-greed'); setFg(d); } catch { /* silent */ }
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try { const d = await apiGet<{ articles: NewsArticle[] }>('/api/market/news/crypto'); setNews((d.articles ?? []).slice(0, 8)); }
    catch { setNews([]); } finally { setNewsLoading(false); }
  }, []);

  useEffect(() => { loadFg(); loadNews(); }, [loadFg, loadNews]);

  const TOP_COINS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 'cardano', 'avalanche-2', 'dogecoin'];
  const tickerCoins = useMemo(() => TOP_COINS.map(id => coins.find(c => c.id === id)).filter(Boolean), [coins]);

  const totalMcap  = useMemo(() => coins.reduce((s, c) => s + (c.marketCap ?? 0), 0), [coins]);
  const totalVol   = useMemo(() => coins.reduce((s, c) => s + (c.volume24h ?? 0), 0), [coins]);
  const btc        = coins.find(c => c.id === 'bitcoin');
  const eth        = coins.find(c => c.id === 'ethereum');
  const btcDom     = btc ? ((btc.marketCap / totalMcap) * 100).toFixed(1) : '—';

  const sorted = [...coins].sort((a, b) => a.marketCapRank - b.marketCapRank);
  const gainers = [...coins].filter(c => c.change24hPct != null).sort((a, b) => (b.change24hPct ?? 0) - (a.change24hPct ?? 0)).slice(0, 7);
  const losers  = [...coins].filter(c => c.change24hPct != null).sort((a, b) => (a.change24hPct ?? 0) - (b.change24hPct ?? 0)).slice(0, 7);

  const fgVal = fg?.current ? parseInt(fg.current.value) : null;
  const fgCls = fg?.current?.value_classification ?? '';

  // 7D heatmap: top 20 coins
  const heatCoins = sorted.slice(0, 20);
  const heatExtreme = Math.max(...heatCoins.map(c => Math.abs(c.change7dPct ?? 0)), 0.1);
  const heatColor = (v: number | null) => {
    if (v == null) return 'hsl(var(--border))';
    const cap = Math.max(-heatExtreme, Math.min(heatExtreme, v));
    return cap >= 0
      ? `hsl(var(--positive) / ${0.1 + (cap / heatExtreme) * 0.6})`
      : `hsl(var(--negative) / ${0.1 + (-cap / heatExtreme) * 0.6})`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* Ticker strip */}
      <div className="shrink-0 border-b border-border flex overflow-x-auto">
        {/* Coin prices */}
        {tickerCoins.map(c => c && (
          <div key={c.id} className="flex flex-col justify-center px-3 py-1 border-r border-border/40 shrink-0">
            <div className="text-[8px] text-muted-foreground uppercase">{c.symbol}</div>
            <div className="text-[13px] font-bold text-foreground tabular-nums leading-tight">{fmtPrice(c.price)}</div>
            <div className={`text-[8px] font-semibold tabular-nums ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
              {(c.change24hPct ?? 0) >= 0 ? '▲' : '▼'}{Math.abs(c.change24hPct ?? 0).toFixed(2)}%
            </div>
          </div>
        ))}
        {/* Market stats */}
        <div className="ml-auto flex shrink-0 border-l border-border">
          {[
            { l: 'Total Mkt Cap', v: fmtBig(totalMcap) },
            { l: '24h Volume',    v: fmtBig(totalVol)  },
            { l: 'BTC Dominance', v: `${btcDom}%`      },
          ].map(s => (
            <div key={s.l} className="flex flex-col justify-center px-3 py-1 border-r border-border/40 shrink-0">
              <div className="text-[8px] text-muted-foreground">{s.l}</div>
              <div className="text-[11px] font-bold text-accent tabular-nums">{s.v}</div>
            </div>
          ))}
          {coinsLoading && <div className="flex items-center px-3 text-[8px] text-muted-foreground animate-pulse">Loading…</div>}
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Left: Top 10 + Gainers/Losers */}
        <div className="w-[28%] shrink-0 border-r border-border flex flex-col min-h-0">
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <PanelHdr>Top 10 by Market Cap</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {sorted.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-2 py-[3px] border-b border-border/20 hover:bg-surface-elevated">
                  <span className="text-[8px] text-muted-foreground w-4 shrink-0">{c.marketCapRank}</span>
                  {c.image && <img src={c.image} alt={c.symbol} className="w-3.5 h-3.5 rounded-full shrink-0" />}
                  <span className="text-[9px] font-semibold text-foreground flex-1 truncate">{c.symbol.toUpperCase()}</span>
                  <span className="text-[9px] tabular-nums font-bold">{fmtPrice(c.price)}</span>
                  <span className={`text-[8px] tabular-nums font-semibold w-12 text-right shrink-0 ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(c.change24hPct ?? 0) >= 0 ? '+' : ''}{(c.change24hPct ?? 0).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-[2] min-h-0 flex flex-col">
            <PanelHdr>Gainers &amp; Losers · 24h</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 divide-x divide-border/40">
              <div>
                <div className="px-1 py-0.5 text-[7px] text-positive font-bold uppercase border-b border-border/30">Top Gainers</div>
                {gainers.map(c => (
                  <div key={c.id} className="flex justify-between px-1 py-[2px] border-b border-border/20">
                    <span className="text-[8px] font-semibold text-foreground">{c.symbol.toUpperCase()}</span>
                    <span className="text-[8px] text-positive font-bold">+{(c.change24hPct ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="px-1 py-0.5 text-[7px] text-negative font-bold uppercase border-b border-border/30">Top Losers</div>
                {losers.map(c => (
                  <div key={c.id} className="flex justify-between px-1 py-[2px] border-b border-border/20">
                    <span className="text-[8px] font-semibold text-foreground">{c.symbol.toUpperCase()}</span>
                    <span className="text-[8px] text-negative font-bold">{(c.change24hPct ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Heatmap */}
        <div className="flex-1 min-w-0 border-r border-border flex flex-col min-h-0">
          <div className="flex-1 min-h-0 border-b border-border flex flex-col">
            <PanelHdr right="7D %">Performance Heatmap · Top 20</PanelHdr>
            <div className="flex-1 min-h-0 overflow-hidden p-2">
              <div className="grid grid-cols-4 gap-1 h-full">
                {heatCoins.map(c => (
                  <div key={c.id}
                    className="flex flex-col items-center justify-center border border-border/30 p-1 text-center"
                    style={{ backgroundColor: heatColor(c.change7dPct) }}>
                    {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full mb-0.5" />}
                    <span className="text-[8px] font-bold text-foreground">{c.symbol.toUpperCase()}</span>
                    <span className={`text-[8px] font-semibold tabular-nums ${(c.change7dPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(c.change7dPct ?? 0) >= 0 ? '+' : ''}{(c.change7dPct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Market cap bar chart */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PanelHdr>Market Cap Distribution · Top 10</PanelHdr>
            <div className="flex-1 min-h-0 overflow-hidden p-2 space-y-0.5">
              {sorted.slice(0, 10).map(c => {
                const pct = (c.marketCap / (sorted[0]?.marketCap ?? 1)) * 100;
                return (
                  <div key={c.id} className="flex items-center gap-1.5 py-[1px]">
                    <span className="text-[8px] text-foreground font-bold w-12 shrink-0">{c.symbol.toUpperCase()}</span>
                    <div className="flex-1 h-2 bg-surface-elevated rounded-sm overflow-hidden">
                      <div className="h-full bg-accent/60 rounded-sm" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[8px] tabular-nums text-muted-foreground w-14 text-right shrink-0">{fmtBig(c.marketCap)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Fear & Greed + News */}
        <div className="w-[26%] shrink-0 flex flex-col min-h-0">
          <div className="shrink-0 border-b border-border flex flex-col">
            <PanelHdr>Sentiment · Fear &amp; Greed</PanelHdr>
            <div className="p-3 flex items-center justify-around">
              {fgVal != null
                ? <FgBadge val={fgVal} cls={fgCls} />
                : <div className="text-[8px] text-muted-foreground animate-pulse">Loading…</div>
              }
              {btc && (
                <div className="text-center">
                  <div className="text-[8px] text-muted-foreground mb-0.5">BTC</div>
                  <div className="text-[13px] font-bold text-foreground">{fmtPrice(btc.price)}</div>
                  <div className={`text-[8px] font-semibold ${(btc.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(btc.change24hPct ?? 0) >= 0 ? '+' : ''}{(btc.change24hPct ?? 0).toFixed(2)}%
                  </div>
                </div>
              )}
              {eth && (
                <div className="text-center">
                  <div className="text-[8px] text-muted-foreground mb-0.5">ETH</div>
                  <div className="text-[13px] font-bold text-foreground">{fmtPrice(eth.price)}</div>
                  <div className={`text-[8px] font-semibold ${(eth.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(eth.change24hPct ?? 0) >= 0 ? '+' : ''}{(eth.change24hPct ?? 0).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <PanelHdr>Crypto News</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {newsLoading && (
                <div className="space-y-px p-1">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-surface-elevated animate-pulse rounded mb-1" />)}
                </div>
              )}
              {!newsLoading && news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-2 px-2 py-1.5 border-b border-border/20 hover:bg-surface-elevated group">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-foreground group-hover:text-accent leading-snug line-clamp-2">{n.title}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[7px] text-muted-foreground">{n.domain}</span>
                      <span className="text-[7px] text-muted-foreground">{fmtDate(n.seendate)}</span>
                      {n.tone != null && (
                        <span className={`text-[7px] font-bold ${n.tone > 1 ? 'text-positive' : n.tone < -1 ? 'text-negative' : 'text-muted-foreground'}`}>
                          {n.tone > 1 ? '▲' : n.tone < -1 ? '▼' : '●'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={9} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 text-accent" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
