import { useCrypto } from '@/hooks/useCrypto';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function fmtUsd(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(4)}`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function pctClass(v: number | null): string {
  if (v == null) return 'text-muted-foreground';
  return v >= 0 ? 'text-positive' : 'text-negative';
}

export default function Crypto() {
  const { coins, loading, error, ts } = useCrypto();

  const totalMcap = coins.reduce((s, c) => s + (c.marketCap || 0), 0);
  const totalVol = coins.reduce((s, c) => s + (c.volume24h || 0), 0);
  const btc = coins.find((c) => c.id === 'bitcoin');
  const eth = coins.find((c) => c.id === 'ethereum');
  const btcDom = btc && totalMcap ? (btc.marketCap / totalMcap) * 100 : 0;
  const gainers = [...coins].sort((a, b) => (b.change24hPct ?? 0) - (a.change24hPct ?? 0)).slice(0, 5);
  const losers = [...coins].sort((a, b) => (a.change24hPct ?? 0) - (b.change24hPct ?? 0)).slice(0, 5);
  const top10 = coins.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="border border-accent/40 bg-accent/5 px-2 py-1.5 flex items-center gap-3 font-mono text-[10px]">
        <span className="text-accent font-bold uppercase tracking-wider">LIVE · COINGECKO {loading && !ts ? '…' : ''}</span>
        {error && <span className="text-negative">err: {error}</span>}
        {!error && (
          <>
            <span className="text-muted-foreground">TOTAL MCAP</span>
            <span className="font-bold">{fmtUsd(totalMcap)}</span>
            <span className="text-muted-foreground ml-2">24H VOL</span>
            <span className="font-bold">{fmtUsd(totalVol)}</span>
            <span className="text-muted-foreground ml-2">BTC.D</span>
            <span className="font-bold">{btcDom.toFixed(1)}%</span>
            {btc && (
              <>
                <span className="text-muted-foreground ml-2">BTC</span>
                <span className="font-bold">{fmtUsd(btc.price)}</span>
                <span className={pctClass(btc.change24hPct)}>({fmtPct(btc.change24hPct)})</span>
              </>
            )}
            {eth && (
              <>
                <span className="text-muted-foreground ml-2">ETH</span>
                <span className="font-bold">{fmtUsd(eth.price)}</span>
                <span className={pctClass(eth.change24hPct)}>({fmtPct(eth.change24hPct)})</span>
              </>
            )}
          </>
        )}
        {ts && (
          <span className="ml-auto text-muted-foreground/50">
            upd {new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">₿ Crypto Markets</span>
        <span className="text-muted-foreground font-mono text-[9px]">CRYP &lt;GO&gt;</span>
      </div>

      {/* Top 10 strip */}
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-1">
        {top10.map((c) => (
          <div key={c.id} className="border border-border p-1.5 hover:bg-accent/5">
            <div className="flex items-center gap-1">
              <img src={c.image} alt={c.symbol} className="w-3 h-3" loading="lazy" />
              <span className="text-[9px] font-mono font-bold text-foreground">{c.symbol}</span>
            </div>
            <div className="text-[10px] font-mono font-bold text-foreground truncate">{fmtUsd(c.price)}</div>
            <div className={`text-[9px] font-mono font-bold ${pctClass(c.change24hPct)}`}>
              {fmtPct(c.change24hPct)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 24h % chart for top 15 */}
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Top 15 — 24h % Change</div>
          <ExpandableResponsiveContainer width="100%" height={220}>
            <BarChart data={coins.slice(0, 15).map((c) => ({ name: c.symbol, pct: c.change24hPct ?? 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                formatter={(v: number) => [`${v.toFixed(2)}%`]}
              />
              <Bar dataKey="pct">
                {coins.slice(0, 15).map((c, i) => (
                  <rect key={i} fill={(c.change24hPct ?? 0) >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />
                ))}
              </Bar>
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>

        {/* Market cap distribution */}
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Market Cap — Top 15 ($B)</div>
          <ExpandableResponsiveContainer width="100%" height={220}>
            <BarChart data={coins.slice(0, 15).map((c) => ({ name: c.symbol, mcap: c.marketCap / 1e9 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={(v) => `$${v.toFixed(0)}B`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                formatter={(v: number) => [`$${v.toFixed(2)}B`]}
              />
              <Bar dataKey="mcap" fill="hsl(var(--accent))" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-positive font-mono font-bold text-[10px] uppercase">▲ Top Gainers (24h)</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <tbody>
              {gainers.map((c) => (
                <tr key={c.id} className="border-b border-grid-line last:border-0 hover:bg-accent/5">
                  <td className="px-2 py-1 flex items-center gap-1.5">
                    <img src={c.image} alt={c.symbol} className="w-3 h-3" loading="lazy" />
                    <span className="font-bold text-foreground">{c.symbol}</span>
                    <span className="text-muted-foreground">{c.name}</span>
                  </td>
                  <td className="px-2 py-1 text-right text-foreground">{fmtUsd(c.price)}</td>
                  <td className="px-2 py-1 text-right font-bold text-positive">{fmtPct(c.change24hPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-negative font-mono font-bold text-[10px] uppercase">▼ Top Losers (24h)</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <tbody>
              {losers.map((c) => (
                <tr key={c.id} className="border-b border-grid-line last:border-0 hover:bg-accent/5">
                  <td className="px-2 py-1 flex items-center gap-1.5">
                    <img src={c.image} alt={c.symbol} className="w-3 h-3" loading="lazy" />
                    <span className="font-bold text-foreground">{c.symbol}</span>
                    <span className="text-muted-foreground">{c.name}</span>
                  </td>
                  <td className="px-2 py-1 text-right text-foreground">{fmtUsd(c.price)}</td>
                  <td className="px-2 py-1 text-right font-bold text-negative">{fmtPct(c.change24hPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full table */}
      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">All Coins · Top {coins.length}</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">#</th>
              <th className="text-left px-2 py-1 text-muted-foreground">COIN</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PRICE</th>
              <th className="text-right px-2 py-1 text-muted-foreground">24H %</th>
              <th className="text-right px-2 py-1 text-muted-foreground">7D %</th>
              <th className="text-right px-2 py-1 text-muted-foreground">MCAP</th>
              <th className="text-right px-2 py-1 text-muted-foreground">24H VOL</th>
              <th className="text-right px-2 py-1 text-muted-foreground">ATH Δ</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((c, i) => (
              <tr key={c.id} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-muted-foreground">{c.marketCapRank}</td>
                <td className="px-2 py-1 flex items-center gap-1.5">
                  <img src={c.image} alt={c.symbol} className="w-3 h-3" loading="lazy" />
                  <span className="font-bold text-foreground">{c.symbol}</span>
                  <span className="text-muted-foreground truncate max-w-[120px]">{c.name}</span>
                </td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{fmtUsd(c.price)}</td>
                <td className={`px-2 py-1 text-right font-bold ${pctClass(c.change24hPct)}`}>{fmtPct(c.change24hPct)}</td>
                <td className={`px-2 py-1 text-right ${pctClass(c.change7dPct)}`}>{fmtPct(c.change7dPct)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{fmtUsd(c.marketCap)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{fmtUsd(c.volume24h)}</td>
                <td className={`px-2 py-1 text-right ${pctClass(c.athChangePct)}`}>{fmtPct(c.athChangePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
