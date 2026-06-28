import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Protocol { name: string; chain: string; category: string; tvl: number; change1d: number | null; change7d: number | null; }
interface ChainEntry { chain: string; tvl: number; }
interface CatEntry  { category: string; tvl: number; }
interface DefiData  { protocols: Protocol[]; chains: ChainEntry[]; categories: CatEntry[]; totalTvl: number; }

function fmtBig(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function PctCell({ v }: { v: number | null }) {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  return <span className={v >= 0 ? 'text-positive font-semibold' : 'text-negative font-semibold'}>{v >= 0 ? '+' : ''}{v.toFixed(1)}%</span>;
}

export default function CryptoDeFi() {
  const [data, setData] = useState<DefiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'tvl' | '1d' | '7d'>('tvl');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<DefiData>('/api/market/crypto/defi');
      setData(d);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...(data?.protocols ?? [])].sort((a, b) => {
    if (sort === '1d') return (b.change1d ?? -999) - (a.change1d ?? -999);
    if (sort === '7d') return (b.change7d ?? -999) - (a.change7d ?? -999);
    return b.tvl - a.tvl;
  });

  const maxChainTvl = Math.max(...(data?.chains ?? []).map(c => c.tvl), 1);

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">
      <div className="shrink-0 border-b border-border flex items-center gap-3 px-3 py-1.5 bg-surface-elevated">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">DeFi TVL</span>
        {data && <span className="text-[10px] font-bold text-foreground">{fmtBig(data.totalTvl)} Total TVL</span>}
        <button onClick={load} disabled={loading} className="ml-auto text-muted-foreground hover:text-accent disabled:opacity-40">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-[10px] animate-pulse">Loading DeFiLlama data…</div>
      )}

      {!loading && data && (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Main protocols table */}
          <div className="flex-1 min-w-0 border-r border-border flex flex-col">
            <div className="shrink-0 border-b border-border/60">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="bg-surface-elevated">
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">#</th>
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Protocol</th>
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Chain</th>
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Category</th>
                    <th onClick={() => setSort('tvl')} className={`text-right px-2 py-1 text-[8px] font-normal cursor-pointer ${sort==='tvl'?'text-accent font-bold':'text-muted-foreground hover:text-foreground'}`}>TVL</th>
                    <th onClick={() => setSort('1d')} className={`text-right px-2 py-1 text-[8px] font-normal cursor-pointer ${sort==='1d'?'text-accent font-bold':'text-muted-foreground hover:text-foreground'}`}>1D%</th>
                    <th onClick={() => setSort('7d')} className={`text-right px-2 py-1 text-[8px] font-normal cursor-pointer ${sort==='7d'?'text-accent font-bold':'text-muted-foreground hover:text-foreground'}`}>7D%</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <tbody>
                  {sorted.map((p, i) => (
                    <tr key={p.name} className="border-b border-border/20 hover:bg-surface-elevated">
                      <td className="px-2 py-1 text-muted-foreground w-6">{i + 1}</td>
                      <td className="px-2 py-1 font-semibold text-foreground">{p.name}</td>
                      <td className="px-2 py-1 text-[8px] text-accent">{p.chain}</td>
                      <td className="px-2 py-1 text-[8px] text-muted-foreground">{p.category}</td>
                      <td className="px-2 py-1 text-right font-bold tabular-nums">{fmtBig(p.tvl)}</td>
                      <td className="px-2 py-1 text-right tabular-nums"><PctCell v={p.change1d} /></td>
                      <td className="px-2 py-1 text-right tabular-nums"><PctCell v={p.change7d} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Chain + Category breakdown */}
          <div className="w-52 shrink-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 border-b border-border overflow-y-auto">
              <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated">
                <span className="text-[8px] text-accent font-bold uppercase tracking-widest">By Chain</span>
              </div>
              <div className="p-2 space-y-0.5">
                {data.chains.map(c => {
                  const pct = (c.tvl / maxChainTvl) * 100;
                  return (
                    <div key={c.chain} className="flex items-center gap-1.5 py-[2px]">
                      <span className="w-20 text-[8px] text-foreground font-semibold truncate shrink-0">{c.chain}</span>
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-none overflow-hidden">
                        <div className="h-full bg-accent/60 rounded-none" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[8px] tabular-nums text-muted-foreground w-12 text-right shrink-0">{fmtBig(c.tvl)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-2 py-1 border-b border-border/60 bg-surface-elevated">
                <span className="text-[8px] text-accent font-bold uppercase tracking-widest">By Category</span>
              </div>
              <div className="p-2 space-y-0.5">
                {data.categories.map(c => {
                  const pct = (c.tvl / (data.categories[0]?.tvl ?? 1)) * 100;
                  return (
                    <div key={c.category} className="flex items-center gap-1.5 py-[2px]">
                      <span className="w-20 text-[8px] text-foreground font-semibold truncate shrink-0">{c.category}</span>
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-none overflow-hidden">
                        <div className="h-full bg-positive/50 rounded-none" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[8px] tabular-nums text-muted-foreground w-12 text-right shrink-0">{fmtBig(c.tvl)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
