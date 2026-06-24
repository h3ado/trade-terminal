// Compact crypto price tile.
import { useCrypto } from '@/hooks/useCrypto';

export default function CryptoTile() {
  const { coins, loading } = useCrypto();
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between">
        <span>CRYP · Crypto</span>
        {loading && <span className="text-accent">···</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[10px] font-mono">
          <tbody>
            {coins.slice(0, 30).map(c => (
              <tr key={c.id} className="border-b border-border/40 hover:bg-surface-elevated">
                <td className="px-2 py-1 font-bold text-foreground uppercase">{c.symbol}</td>
                <td className="px-2 py-1 text-right text-foreground">${c.price.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                <td className={`px-2 py-1 text-right ${(c.change24hPct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {(c.change24hPct ?? 0) >= 0 ? '+' : ''}{(c.change24hPct ?? 0).toFixed(2)}%
                </td>
              </tr>
            ))}
            {coins.length === 0 && !loading && (
              <tr><td colSpan={3} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
