import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Exchange {
  id: string; name: string;
  openInterestBtc: number | null;
  tradeVolume24hBtc: number | null;
  numberOfPerpetualPairs: number | null;
  numberOfFuturesPairs: number | null;
}
interface FundingRow { pair: string; ex: string; rate: number; synthetic: boolean }
interface DerivData { exchanges: Exchange[]; }
interface FundingData { rows: FundingRow[]; synthetic: boolean }

function fmtBig(n: number | null) {
  if (n == null) return '—';
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)}M`;
  return `${n.toFixed(0)}`;
}

export default function CryptoDerivatives() {
  const [data, setData] = useState<DerivData | null>(null);
  const [funding, setFunding] = useState<FundingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([
        apiGet<DerivData>('/api/market/crypto/derivatives'),
        apiGet<FundingData>('/api/market/crypto/funding-rates'),
      ]);
      setData(d);
      setFunding(f);
    } catch {
      setData({ exchanges: [] });
      setFunding({ rows: [], synthetic: true });
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxOI = Math.max(...(data?.exchanges ?? []).map(e => e.openInterestBtc ?? 0), 1);

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">
      <div className="shrink-0 border-b border-border flex items-center gap-2 px-3 py-1.5 bg-surface-elevated">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Derivatives & Funding Rates</span>
        <button onClick={load} disabled={loading} className="ml-auto text-muted-foreground hover:text-accent disabled:opacity-40">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && <div className="flex items-center justify-center flex-1 text-muted-foreground text-[10px] animate-pulse">Loading derivatives data…</div>}

      {!loading && (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left: Funding rates */}
          <div className="flex-1 min-w-0 border-r border-border flex flex-col">
            <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated shrink-0 flex items-center gap-2">
              <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Perpetual Funding Rates (8h)</span>
              {funding?.synthetic && (
                <span className="text-[7px] text-orange-400 border border-orange-400/40 px-1">SYNTHETIC</span>
              )}
              {funding && !funding.synthetic && (
                <span className="text-[7px] text-positive border border-positive/40 px-1">LIVE</span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border/60">
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Pair</th>
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Exchange</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Funding Rate</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Annualized</th>
                  </tr>
                </thead>
                <tbody>
                  {(funding?.rows ?? []).map((f, i) => {
                    const annualized = f.rate * 3 * 365;
                    const isPos = f.rate >= 0;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-elevated">
                        <td className="px-2 py-1 font-semibold text-foreground">{f.pair}</td>
                        <td className="px-2 py-1 text-accent">{f.ex}</td>
                        <td className={`px-2 py-1 text-right tabular-nums font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{f.rate.toFixed(4)}%
                        </td>
                        <td className={`px-2 py-1 text-right tabular-nums ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{(annualized * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-2 pb-2 pt-1 text-[8px] text-muted-foreground">
                Positive rate = longs pay shorts · Negative = shorts pay longs · Sources: Binance, Bybit
              </p>
            </div>
          </div>

          {/* Right: Exchange OI */}
          <div className="w-56 shrink-0 flex flex-col">
            <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated shrink-0">
              <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Exchanges by Open Interest</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
              {(data?.exchanges ?? []).map(e => {
                const pct = ((e.openInterestBtc ?? 0) / maxOI) * 100;
                return (
                  <div key={e.id} className="border-b border-border/20 pb-1.5">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-semibold text-foreground truncate">{e.name}</span>
                      <span className="text-[8px] text-muted-foreground tabular-nums">{fmtBig(e.openInterestBtc)} BTC</span>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-none overflow-hidden">
                      <div className="h-full bg-accent/70 rounded-none" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[7px] text-muted-foreground">{e.numberOfPerpetualPairs ?? 0} perps · {e.numberOfFuturesPairs ?? 0} futures</span>
                      <span className="text-[7px] text-muted-foreground">${fmtBig(e.tradeVolume24hBtc)} vol</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
