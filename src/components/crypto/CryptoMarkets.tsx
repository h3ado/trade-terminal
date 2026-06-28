import { useState, useMemo } from 'react';
import { useCrypto, Coin } from '@/hooks/useCrypto';
import { RefreshCw } from 'lucide-react';

type SortKey = 'rank' | 'price' | '24h' | '7d' | 'cap' | 'vol' | 'ath';
type SortDir = 'asc' | 'desc';

function fmtPrice(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}
function fmtBig(n: number | null) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}
function PctCell({ v }: { v: number | null }) {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  return <span className={v >= 0 ? 'text-positive font-semibold' : 'text-negative font-semibold'}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</span>;
}

export default function CryptoMarkets() {
  const { coins, loading } = useCrypto();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir(k === 'rank' ? 'asc' : 'desc'); }
  };

  const sorted = useMemo(() => {
    let list = coins.filter(c =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case 'rank':  av = a.marketCapRank; bv = b.marketCapRank; break;
        case 'price': av = a.price; bv = b.price; break;
        case '24h':   av = a.change24hPct ?? -999; bv = b.change24hPct ?? -999; break;
        case '7d':    av = a.change7dPct ?? -999;  bv = b.change7dPct ?? -999; break;
        case 'cap':   av = a.marketCap; bv = b.marketCap; break;
        case 'vol':   av = a.volume24h; bv = b.volume24h; break;
        case 'ath':   av = a.athChangePct ?? -999; bv = b.athChangePct ?? -999; break;
        default: return 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [coins, search, sortKey, sortDir]);

  const Th = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => (
    <th onClick={() => toggleSort(k)}
      className={`${right ? 'text-right' : 'text-left'} px-2 py-1 text-[8px] font-normal cursor-pointer whitespace-nowrap select-none
        ${sortKey === k ? 'text-accent font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">
      <div className="shrink-0 border-b border-border flex items-center gap-3 px-3 py-1.5 bg-surface-elevated">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Crypto Markets</span>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or symbol…"
          className="border border-border bg-background text-foreground text-[9px] px-2 py-0.5 font-mono w-44 focus:outline-none focus:border-accent"
        />
        <span className="text-[8px] text-muted-foreground">{sorted.length} coins</span>
        {loading && <RefreshCw size={10} className="text-accent animate-spin ml-auto" />}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[9px] min-w-[700px]">
          <thead className="sticky top-0 bg-surface-deep z-10">
            <tr className="border-b border-border">
              <Th label="#"          k="rank" />
              <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Coin</th>
              <Th label="Price"      k="price"  right />
              <Th label="24h %"      k="24h"    right />
              <Th label="7d %"       k="7d"     right />
              <Th label="Market Cap" k="cap"    right />
              <Th label="Volume 24h" k="vol"    right />
              <Th label="ATH Chg"    k="ath"    right />
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} className="border-b border-border/20 hover:bg-surface-elevated">
                <td className="px-2 py-1 text-muted-foreground tabular-nums">{c.marketCapRank}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                    <span className="font-semibold text-foreground">{c.name}</span>
                    <span className="text-[8px] text-muted-foreground uppercase">{c.symbol}</span>
                  </div>
                </td>
                <td className="px-2 py-1 text-right tabular-nums font-semibold">{fmtPrice(c.price)}</td>
                <td className="px-2 py-1 text-right tabular-nums"><PctCell v={c.change24hPct} /></td>
                <td className="px-2 py-1 text-right tabular-nums"><PctCell v={c.change7dPct} /></td>
                <td className="px-2 py-1 text-right tabular-nums text-muted-foreground">{fmtBig(c.marketCap)}</td>
                <td className="px-2 py-1 text-right tabular-nums text-muted-foreground">{fmtBig(c.volume24h)}</td>
                <td className="px-2 py-1 text-right tabular-nums"><PctCell v={c.athChangePct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
