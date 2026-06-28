import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';
import CryptoPriceChart from './CryptoPriceChart';

interface CoinDetail {
  id: string; symbol: string; name: string; image: string; description: string;
  categories: string[];
  links: { homepage?: string; whitepaper?: string; github?: string; reddit?: string; twitter?: string };
  market: {
    price: number | null; marketCap: number | null; marketCapRank: number | null;
    totalVolume: number | null; high24h: number | null; low24h: number | null;
    change24h: number | null; change7d: number | null; change30d: number | null; change1y: number | null;
    ath: number | null; athDate: string | null; athChangePercent: number | null;
    atl: number | null; circulatingSupply: number | null; totalSupply: number | null; maxSupply: number | null;
    fullyDilutedValuation: number | null;
  };
  community: { twitterFollowers: number | null; redditSubscribers: number | null; redditAccountsActive: number | null };
  developer: { forks: number | null; stars: number | null; commitCount4Weeks: number | null; pullRequestsMerged: number | null };
  sparkline7d: number[];
}

interface Props { coinId: string; title: string; extra?: React.ReactNode }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBig(n: number | null) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}
function fmtNum(n: number | null | undefined, d = 2): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}
function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return n >= 1 ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;
}

function PctVal({ n }: { n: number | null }) {
  if (n == null) return <span className="text-muted-foreground">—</span>;
  return <span className={n >= 0 ? 'text-positive font-semibold' : 'text-negative font-semibold'}>{n >= 0 ? '+' : ''}{n.toFixed(2)}%</span>;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline7d({ prices }: { prices: number[] }) {
  if (!prices.length) return <div className="flex items-center justify-center h-full text-muted-foreground text-[8px]">No chart data</div>;
  const lo = Math.min(...prices); const hi = Math.max(...prices); const range = hi - lo || 1;
  const W = 200; const H = 60;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - lo) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const isUp = prices[prices.length - 1] >= prices[0];
  const col = isUp ? '#38a838' : '#d63333';
  const pct = ((prices[prices.length - 1] - prices[0]) / prices[0] * 100);
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-0.5 text-[7px] text-muted-foreground">
        <span>7D</span>
        <span className={isUp ? 'text-positive font-bold' : 'text-negative font-bold'}>
          {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`cg-${coinId}-${isUp}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.2" />
              <stop offset="100%" stopColor={col} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#cg-${coinId}-${isUp})`} />
          <polyline points={pts} fill="none" stroke={col} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between mt-0.5 text-[7px] text-muted-foreground">
        <span>${fmtNum(lo)}</span>
        <span>${fmtNum(hi)}</span>
      </div>
    </div>
  );
}

// Workaround: coinId not in scope inside SVG — pass as prop
let coinId = 'coin';

// ─── Panel building blocks ─────────────────────────────────────────────────────

function Ph({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
      {right && <span className="text-[7px] text-muted-foreground">{right}</span>}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-1 py-[2px] border-b border-border/20">
      <span className="text-[8px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[9px] font-semibold tabular-nums truncate max-w-[55%] text-right">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CryptoCoinDetail({ coinId: cid, title, extra }: Props) {
  coinId = cid; // set module-level for sparkline gradient id
  const [data, setData] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiGet<CoinDetail>(`/api/market/crypto/coin/${cid}`);
      setData(d);
    } catch (e: any) { setError(e.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [cid]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] font-mono animate-pulse">
      Loading {title} data…
    </div>
  );
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-[10px] font-mono">
      <span>{error ?? 'No data'}</span>
      <button onClick={load} className="text-accent hover:underline">Retry</button>
    </div>
  );

  const m = data.market;
  const isUp = (m.change24h ?? 0) >= 0;

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* ── Compact header bar ── */}
      <div className="shrink-0 border-b border-border bg-surface-elevated flex items-center gap-0 overflow-x-auto">
        {/* Coin identity */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-border shrink-0">
          {data.image && <img src={data.image} alt={data.symbol} className="w-5 h-5 shrink-0" />}
          <span className="text-accent font-bold text-[13px] tracking-widest">{data.symbol?.toUpperCase()}</span>
          <span className="text-muted-foreground text-[9px]">{data.name}</span>
          <span className="text-[8px] text-muted-foreground border border-border/60 px-1">Rank #{m.marketCapRank ?? '—'}</span>
        </div>
        {/* Price block */}
        <div className="flex items-baseline gap-2 px-3 py-1.5 border-r border-border shrink-0">
          <span className="text-foreground font-bold text-[16px] tabular-nums">{fmtPrice(m.price)}</span>
          <span className={`text-[11px] font-bold tabular-nums ${isUp ? 'text-positive' : 'text-negative'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(m.change24h ?? 0).toFixed(2)}%
          </span>
          <span className="text-[8px] text-muted-foreground">24h</span>
        </div>
        {/* Quick stats */}
        {[
          { l: 'Mkt Cap',   v: fmtBig(m.marketCap) },
          { l: 'Volume',    v: fmtBig(m.totalVolume) },
          { l: 'ATH',       v: fmtPrice(m.ath) },
          { l: '7D',        v: null, pct: m.change7d },
          { l: '30D',       v: null, pct: m.change30d },
        ].map(s => (
          <div key={s.l} className="flex flex-col justify-center px-3 py-1 border-r border-border/40 shrink-0">
            <span className="text-[7px] text-muted-foreground uppercase">{s.l}</span>
            {s.pct !== undefined
              ? <span className={`text-[10px] font-bold tabular-nums ${(s.pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {(s.pct ?? 0) >= 0 ? '+' : ''}{(s.pct ?? 0).toFixed(2)}%
                </span>
              : <span className="text-[10px] font-bold text-foreground tabular-nums">{s.v}</span>
            }
          </div>
        ))}
        <button onClick={load} className="ml-auto px-3 text-muted-foreground hover:text-accent transition-colors">
          <RefreshCw size={10} />
        </button>
      </div>

      {/* ── Three-column main grid (no scroll) ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* LEFT: Price chart + Supply/ATH */}
        <div className="w-[28%] shrink-0 border-r border-border flex flex-col min-h-0">

          {/* Interactive price chart */}
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <CryptoPriceChart coinId={cid} symbol={data.symbol ?? cid.toUpperCase()} />
          </div>

          {/* Supply & ATH */}
          <div className="flex-[4] min-h-0 border-b border-border flex flex-col">
            <Ph label="Supply & ATH" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <KV label="Circulating"    value={m.circulatingSupply != null ? fmtNum(m.circulatingSupply, 0) : '—'} />
              <KV label="Total Supply"   value={m.totalSupply != null ? fmtNum(m.totalSupply, 0) : '—'} />
              <KV label="Max Supply"     value={m.maxSupply != null ? fmtNum(m.maxSupply, 0) : '∞'} />
              <KV label="ATH"            value={fmtPrice(m.ath)} />
              <KV label="ATH Date"       value={m.athDate ? m.athDate.slice(0, 10) : '—'} />
              <KV label="ATH Change"     value={<PctVal n={m.athChangePercent} />} />
              <KV label="FDV"            value={fmtBig(m.fullyDilutedValuation)} />
            </div>
          </div>

          {/* Links */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <Ph label="Links" />
            <div className="flex-1 min-h-0 px-2 py-1 space-y-0">
              {data.links.homepage && (
                <KV label="Website" value={<a href={data.links.homepage} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-0.5 justify-end">{data.links.homepage.replace(/^https?:\/\/(www\.)?/, '').slice(0, 22)}<ExternalLink size={7} /></a>} />
              )}
              {data.links.whitepaper && (
                <KV label="Whitepaper" value={<a href={data.links.whitepaper} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-0.5 justify-end">PDF<ExternalLink size={7} /></a>} />
              )}
              {data.links.github && (
                <KV label="GitHub" value={<a href={data.links.github} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-0.5 justify-end">Source<ExternalLink size={7} /></a>} />
              )}
              {data.links.twitter && (
                <KV label="Twitter" value={<a href={`https://twitter.com/${data.links.twitter}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-0.5 justify-end">@{data.links.twitter}<ExternalLink size={7} /></a>} />
              )}
              <div className="flex flex-wrap gap-0.5 mt-1">
                {(data.categories ?? []).slice(0, 4).map(c => (
                  <span key={c} className="px-1 py-0.5 text-[7px] border border-border/50 text-muted-foreground bg-surface-elevated">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Market data + performance + community */}
        <div className="flex-1 min-w-0 border-r border-border flex flex-col min-h-0">

          {/* Market data */}
          <div className="flex-[4] min-h-0 border-b border-border flex flex-col">
            <Ph label="Market Data" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <KV label="Market Cap"     value={fmtBig(m.marketCap)} />
              <KV label="Volume 24h"     value={fmtBig(m.totalVolume)} />
              <KV label="High 24h"       value={fmtPrice(m.high24h)} />
              <KV label="Low 24h"        value={fmtPrice(m.low24h)} />
            </div>
          </div>

          {/* Performance returns */}
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <Ph label="Price Returns" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <KV label="Change 24h"  value={<PctVal n={m.change24h} />} />
              <KV label="Change 7d"   value={<PctVal n={m.change7d} />} />
              <KV label="Change 30d"  value={<PctVal n={m.change30d} />} />
              <KV label="Change 1y"   value={<PctVal n={m.change1y} />} />
              <KV label="vs ATH"      value={<PctVal n={m.athChangePercent} />} />
            </div>
          </div>

          {/* Community */}
          <div className="flex-[2] min-h-0 border-b border-border flex flex-col">
            <Ph label="Community" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <KV label="Twitter"       value={m != null && data.community.twitterFollowers != null ? fmtNum(data.community.twitterFollowers, 0) + ' flw' : '—'} />
              <KV label="Reddit Subs"   value={data.community.redditSubscribers != null ? fmtNum(data.community.redditSubscribers, 0) : '—'} />
              <KV label="Reddit Active" value={data.community.redditAccountsActive != null ? fmtNum(data.community.redditAccountsActive, 0) : '—'} />
            </div>
          </div>

          {/* Developer */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <Ph label="Developer Activity" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <KV label="GitHub Stars"  value={fmtNum(data.developer.stars, 0)} />
              <KV label="Forks"         value={fmtNum(data.developer.forks, 0)} />
              <KV label="Commits 4w"    value={fmtNum(data.developer.commitCount4Weeks, 0)} />
              <KV label="PRs Merged"    value={fmtNum(data.developer.pullRequestsMerged, 0)} />
            </div>
          </div>
        </div>

        {/* RIGHT: Description + extra */}
        <div className="w-[32%] shrink-0 flex flex-col min-h-0">

          {/* Description */}
          <div className="flex-[3] min-h-0 border-b border-border flex flex-col">
            <Ph label="Description" />
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              <p className="text-[8px] text-muted-foreground leading-relaxed">
                {data.description || 'No description available.'}
              </p>
            </div>
          </div>

          {/* Extra slot (halvings for BTC, L2 for ETH) */}
          {extra && (
            <div className="flex-[5] min-h-0 flex flex-col overflow-hidden">
              {extra}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
