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
interface DerivData { exchanges: Exchange[]; }

// Deterministic mock funding rates (no free real-time endpoint without auth)
const FUNDING = [
  { pair: 'BTC-PERP',  ex: 'Binance',  rate: 0.0082, oi: 8.4e9  },
  { pair: 'ETH-PERP',  ex: 'Binance',  rate: 0.0065, oi: 3.1e9  },
  { pair: 'BTC-PERP',  ex: 'Bybit',    rate: 0.0091, oi: 5.2e9  },
  { pair: 'ETH-PERP',  ex: 'Bybit',    rate: 0.0071, oi: 2.0e9  },
  { pair: 'BTC-PERP',  ex: 'OKX',      rate: -0.0031, oi: 3.8e9 },
  { pair: 'ETH-PERP',  ex: 'OKX',      rate: -0.0018, oi: 1.5e9 },
  { pair: 'SOL-PERP',  ex: 'Binance',  rate: 0.0120, oi: 0.9e9  },
  { pair: 'XRP-PERP',  ex: 'Binance',  rate: 0.0043, oi: 0.4e9  },
  { pair: 'DOGE-PERP', ex: 'Binance',  rate: 0.0155, oi: 0.3e9  },
  { pair: 'BNB-PERP',  ex: 'Binance',  rate: 0.0102, oi: 0.5e9  },
];

function fmtBig(n: number | null) {
  if (n == null) return '—';
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)}M`;
  return `${n.toFixed(0)}`;
}

export default function CryptoDerivatives() {
  const [data, setData] = useState<DerivData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<DerivData>('/api/market/crypto/derivatives');
      setData(d);
    } catch { setData({ exchanges: [] }); }
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
            <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated shrink-0">
              <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Perpetual Funding Rates (8h)</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border/60">
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Pair</th>
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Exchange</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Funding Rate</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Annualized</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Open Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNDING.map((f, i) => {
                    const annualized = f.rate * 3 * 365; // 3 × daily (8h period)
                    const isPos = f.rate >= 0;
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-elevated">
                        <td className="px-2 py-1 font-semibold text-foreground">{f.pair}</td>
                        <td className="px-2 py-1 text-accent">{f.ex}</td>
                        <td className={`px-2 py-1 text-right tabular-nums font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{(f.rate).toFixed(4)}%
                        </td>
                        <td className={`px-2 py-1 text-right tabular-nums ${isPos ? 'text-positive' : 'text-negative'}`}>
                          {isPos ? '+' : ''}{(annualized * 100).toFixed(1)}%
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-muted-foreground">${fmtBig(f.oi)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-2 pb-2 pt-1 text-[8px] text-muted-foreground">
                Positive rate = longs pay shorts · Negative = shorts pay longs
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
