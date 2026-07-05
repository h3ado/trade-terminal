import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useCrypto } from '@/hooks/useCrypto';
import { apiGet } from '@/lib/api';

// ─── Navigation ───────────────────────────────────────────────────────────────

const fire = (code: string) =>
  window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } }));

interface FGData { current: { value: string; value_classification: string } | null }
interface NewsArticle { id: string; url: string; title: string; domain: string; seendate: string; tone: number }

function fmtPrice(n: number) {
  if (n >= 10000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n >= 1000)  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1)     return `$${n.toFixed(4)}`;
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

function fgColor(cls: string) {
  const l = cls.toLowerCase();
  if (l.includes('extreme fear'))  return 'text-negative';
  if (l.includes('fear'))          return 'text-orange-400';
  if (l.includes('neutral'))       return 'text-muted-foreground';
  if (l.includes('extreme greed')) return 'text-positive';
  if (l.includes('greed'))         return 'text-green-500';
  return 'text-foreground';
}

// ─── Bloomberg-style flat section header ──────────────────────────────────────
function Ph({ children, right, onDrillDown }: { children: React.ReactNode; right?: React.ReactNode; onDrillDown?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-[2px] border-b border-border shrink-0 sticky top-0 bg-surface-deep z-10">
      <span className="text-[7px] text-accent font-bold uppercase tracking-widest">{children}</span>
      <div className="flex items-center gap-2">
        {right && <span className="text-[7px] text-muted-foreground">{right}</span>}
        {onDrillDown && (
          <button
            onClick={onDrillDown}
            className="text-[7px] text-accent/50 hover:text-accent uppercase tracking-wider transition-colors"
          >
            MORE →
          </button>
        )}
      </div>
    </div>
  );
}

function Pct({ n }: { n: number | null }) {
  if (n == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`tabular-nums font-bold ${n >= 0 ? 'text-positive' : 'text-negative'}`}>
      {n >= 0 ? '+' : ''}{n.toFixed(2)}%
    </span>
  );
}

export default function CryptoHome() {
  const { coins, loading: coinsLoading } = useCrypto();
  const [fg, setFg] = useState<FGData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const reload = useCallback(async () => {
    try { setFg(await apiGet<FGData>('/api/market/crypto/fear-greed')); } catch { /**/ }
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try { const d = await apiGet<{ articles: NewsArticle[] }>('/api/market/news/crypto'); setNews((d.articles ?? []).slice(0, 12)); }
    catch { setNews([]); } finally { setNewsLoading(false); }
  }, []);

  useEffect(() => { reload(); loadNews(); }, [reload, loadNews]);

  const TOP_TICKER_IDS = ['bitcoin','ethereum','binancecoin','solana','ripple','cardano','avalanche-2','dogecoin'];
  const tickerCoins = useMemo(() => TOP_TICKER_IDS.map(id => coins.find(c => c.id === id)).filter(Boolean), [coins]);

  const totalMcap = useMemo(() => coins.reduce((s, c) => s + (c.marketCap ?? 0), 0), [coins]);
  const totalVol  = useMemo(() => coins.reduce((s, c) => s + (c.volume24h ?? 0), 0), [coins]);
  const btc       = coins.find(c => c.id === 'bitcoin');
  const eth       = coins.find(c => c.id === 'ethereum');
  const btcDom    = btc && totalMcap ? (btc.marketCap / totalMcap * 100) : 0;

  const sorted  = [...coins].sort((a, b) => a.marketCapRank - b.marketCapRank);
  const gainers = [...coins].filter(c => c.change24hPct != null).sort((a, b) => (b.change24hPct ?? 0) - (a.change24hPct ?? 0)).slice(0, 8);
  const losers  = [...coins].filter(c => c.change24hPct != null).sort((a, b) => (a.change24hPct ?? 0) - (b.change24hPct ?? 0)).slice(0, 8);

  const fgVal = fg?.current ? parseInt(fg.current.value) : null;
  const fgCls = fg?.current?.value_classification ?? '';

  // Heatmap: top 20 coins, colored by 7D
  const heatCoins   = sorted.slice(0, 20);
  const heatExtreme = Math.max(...heatCoins.map(c => Math.abs(c.change7dPct ?? 0)), 0.1);
  const heatBg = (v: number | null) => {
    if (v == null) return 'transparent';
    const t = Math.max(-1, Math.min(1, v / heatExtreme));
    return t >= 0
      ? `hsl(var(--positive) / ${0.08 + t * 0.45})`
      : `hsl(var(--negative) / ${0.08 + (-t) * 0.45})`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-[10px] bg-background">

      {/* ── Ticker strip ── */}
      <div className="shrink-0 border-b border-border flex overflow-x-auto">
        {tickerCoins.map(c => c && (
          <button
            key={c.id}
            onClick={() => fire(c.symbol.toUpperCase())}
            className="flex items-baseline gap-2 px-3 py-1.5 border-r border-border shrink-0 cursor-pointer hover:bg-white/[0.04] transition-colors group"
          >
            <span className="text-[8px] text-accent font-bold uppercase group-hover:text-foreground transition-colors">{c.symbol}</span>
            <span className="text-[12px] font-bold tabular-nums text-foreground">{fmtPrice(c.price)}</span>
            <span className={`text-[9px] font-bold tabular-nums ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
              {(c.change24hPct ?? 0) >= 0 ? '▲' : '▼'}{Math.abs(c.change24hPct ?? 0).toFixed(2)}%
            </span>
          </button>
        ))}
        {/* Market stats — right side */}
        <div className="ml-auto flex border-l border-border shrink-0">
          {[
            { l: 'MCAP',   v: fmtBig(totalMcap), code: 'CRYP' },
            { l: 'VOL24',  v: fmtBig(totalVol),  code: 'MKTD' },
            { l: 'BTCDOM', v: `${btcDom.toFixed(1)}%`, code: 'BTC' },
          ].map(s => (
            <button
              key={s.l}
              onClick={() => fire(s.code)}
              className="flex items-baseline gap-1.5 px-3 py-1.5 border-r border-border/60 shrink-0 hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-[7px] text-muted-foreground uppercase">{s.l}</span>
              <span className="text-[10px] font-bold text-accent tabular-nums">{s.v}</span>
            </button>
          ))}
          <button onClick={() => { reload(); loadNews(); }} className="px-2 text-muted-foreground hover:text-accent">
            <RefreshCw size={9} className={coinsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* COL 1: Top 10 + Gainers/Losers */}
        <div className="w-[26%] shrink-0 border-r border-border flex flex-col min-h-0">

          {/* Top 10 */}
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <Ph right="by Mkt Cap" onDrillDown={() => fire('MKTD')}>Top 10</Ph>
            <div className="shrink-0 flex text-[7px] text-muted-foreground border-b border-border px-2 py-[2px]">
              <span className="w-5">#</span>
              <span className="w-10">SYM</span>
              <span className="flex-1 text-right">PRICE</span>
              <span className="w-14 text-right">24H</span>
              <span className="w-14 text-right pr-1">MCAP</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {sorted.slice(0, 10).map(c => (
                <div
                  key={c.id}
                  className="flex items-center px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                  onClick={() => fire(c.symbol.toUpperCase())}
                >
                  <span className="text-[8px] text-muted-foreground w-5 shrink-0">{c.marketCapRank}</span>
                  <span className="text-[9px] font-bold text-foreground group-hover:text-accent w-10 shrink-0 transition-colors">{c.symbol.toUpperCase()}</span>
                  <span className="text-[9px] tabular-nums text-foreground flex-1 text-right">{fmtPrice(c.price)}</span>
                  <span className={`text-[9px] tabular-nums font-bold w-14 text-right shrink-0 ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {(c.change24hPct ?? 0) >= 0 ? '+' : ''}{(c.change24hPct ?? 0).toFixed(2)}%
                  </span>
                  <span className="text-[8px] tabular-nums text-muted-foreground w-14 text-right pr-1 shrink-0">{fmtBig(c.marketCap)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gainers / Losers */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <Ph right="24h">Movers</Ph>
            <div className="flex-1 min-h-0 overflow-y-auto flex">
              <div className="flex-1 border-r border-border flex flex-col min-w-0">
                <div className="px-2 py-[2px] border-b border-border">
                  <span className="text-[7px] text-positive font-bold uppercase">Gainers</span>
                </div>
                {gainers.map(c => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center px-2 py-[2px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                    onClick={() => fire(c.symbol.toUpperCase())}
                  >
                    <span className="text-[9px] font-bold text-foreground group-hover:text-accent transition-colors">{c.symbol.toUpperCase()}</span>
                    <span className="text-[9px] text-positive font-bold tabular-nums">+{(c.change24hPct ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="px-2 py-[2px] border-b border-border">
                  <span className="text-[7px] text-negative font-bold uppercase">Losers</span>
                </div>
                {losers.map(c => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center px-2 py-[2px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors"
                    onClick={() => fire(c.symbol.toUpperCase())}
                  >
                    <span className="text-[9px] font-bold text-foreground group-hover:text-accent transition-colors">{c.symbol.toUpperCase()}</span>
                    <span className="text-[9px] text-negative font-bold tabular-nums">{(c.change24hPct ?? 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COL 2: Heatmap + Mkt Cap bars */}
        <div className="flex-1 min-w-0 border-r border-border flex flex-col min-h-0">

          {/* 7D Performance heatmap */}
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <Ph right="7D %" onDrillDown={() => fire('MKTD')}>Performance Heatmap · Top 20</Ph>
            <div className="flex-1 min-h-0 p-1">
              <div className="grid grid-cols-4 gap-px h-full">
                {heatCoins.map(c => (
                  <div
                    key={c.id}
                    className="flex flex-col items-center justify-center border border-border text-center cursor-pointer hover:border-accent/50 transition-colors"
                    style={{ backgroundColor: heatBg(c.change7dPct) }}
                    onClick={() => fire(c.symbol.toUpperCase())}
                  >
                    <span className="text-[9px] font-bold text-foreground leading-none">{c.symbol.toUpperCase()}</span>
                    <span className={`text-[8px] font-bold tabular-nums leading-none mt-0.5 ${(c.change7dPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(c.change7dPct ?? 0) >= 0 ? '+' : ''}{(c.change7dPct ?? 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market cap distribution — text bar chart */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <Ph right="relative to BTC" onDrillDown={() => fire('MKTD')}>Mkt Cap Distribution · Top 10</Ph>
            <div className="flex-1 min-h-0 overflow-hidden px-2 py-1 flex flex-col justify-around">
              {sorted.slice(0, 10).map(c => {
                const pct = (c.marketCap / (sorted[0]?.marketCap ?? 1)) * 100;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
                    onClick={() => fire(c.symbol.toUpperCase())}
                  >
                    <span className="text-[8px] text-foreground font-bold group-hover:text-accent w-10 shrink-0 transition-colors">{c.symbol.toUpperCase()}</span>
                    <div className="flex-1 h-[5px] bg-border overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[8px] tabular-nums text-muted-foreground w-14 text-right shrink-0">{fmtBig(c.marketCap)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COL 3: Sentiment + News */}
        <div className="w-[27%] shrink-0 flex flex-col min-h-0">

          {/* Fear & Greed — flat terminal style */}
          <div className="shrink-0 border-b border-border">
            <Ph right="Alternative.me" onDrillDown={() => fire('CRYS')}>Crypto Sentiment</Ph>
            <div className="px-2 py-2 border-b border-border flex items-center gap-4">
              {fgVal != null ? (
                <>
                  <button
                    onClick={() => fire('CRYS')}
                    className="flex flex-col hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[7px] text-muted-foreground uppercase mb-0.5">Fear &amp; Greed</span>
                    <span className={`text-[32px] font-bold tabular-nums leading-none ${fgColor(fgCls)}`}>{fgVal}</span>
                    <span className={`text-[8px] font-bold uppercase mt-0.5 ${fgColor(fgCls)}`}>{fgCls}</span>
                  </button>
                  {/* ASCII bar */}
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex gap-px">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 ${i * 5 < fgVal
                            ? fgVal < 25 ? 'bg-negative' : fgVal < 45 ? 'bg-orange-400' : fgVal < 55 ? 'bg-muted-foreground' : fgVal < 75 ? 'bg-green-500' : 'bg-positive'
                            : 'bg-border'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[7px] text-muted-foreground">
                      <span>FEAR</span><span>NEUTRAL</span><span>GREED</span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-[8px] text-muted-foreground animate-pulse">Loading…</span>
              )}
            </div>

            {/* BTC / ETH inline — clickable */}
            <div className="flex border-b border-border">
              {[btc, eth].filter(Boolean).map(c => c && (
                <button
                  key={c.id}
                  onClick={() => fire(c.symbol.toUpperCase())}
                  className="flex-1 px-2 py-1.5 border-r border-border last:border-r-0 hover:bg-white/[0.04] transition-colors group text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[8px] text-accent font-bold uppercase group-hover:text-foreground transition-colors">{c.symbol}</span>
                    <span className="text-[12px] font-bold tabular-nums text-foreground">{fmtPrice(c.price)}</span>
                    <span className={`text-[9px] font-bold tabular-nums ml-auto ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(c.change24hPct ?? 0) >= 0 ? '▲' : '▼'}{Math.abs(c.change24hPct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[7px] text-muted-foreground mt-0.5">
                    Mkt Cap {fmtBig(c.marketCap)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* News feed */}
          <div className="flex-1 min-h-0 flex flex-col">
            <Ph right="GDELT" onDrillDown={() => fire('CRNW')}>Crypto News</Ph>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {newsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-2 py-[6px] border-b border-border animate-pulse">
                    <div className="h-2 bg-border w-3/4 mb-1" />
                    <div className="h-1.5 bg-border w-1/3" />
                  </div>
                ))
              ) : news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-2 px-2 py-[5px] border-b border-border hover:bg-white/[0.04] group">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-foreground group-hover:text-accent leading-snug line-clamp-2">{n.title}</div>
                    <div className="flex gap-2 mt-[2px] items-center">
                      {n.tone != null && (
                        <span className={`text-[8px] font-bold ${n.tone > 1 ? 'text-positive' : n.tone < -1 ? 'text-negative' : 'text-muted-foreground'}`}>
                          {n.tone > 1 ? '▲' : n.tone < -1 ? '▼' : '●'}
                        </span>
                      )}
                      <span className="text-[7px] text-muted-foreground truncate">{n.domain}</span>
                      <span className="text-[7px] text-muted-foreground shrink-0">{fmtDate(n.seendate)}</span>
                    </div>
                  </div>
                  <ExternalLink size={8} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-50 text-accent" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
