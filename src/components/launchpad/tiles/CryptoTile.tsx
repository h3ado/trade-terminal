// Compact crypto price tile with sparklines.
import { useCrypto } from '@/hooks/useCrypto';
import Sparkline from '@/components/tools/widgets/Sparkline';

function makeSpark(prev: number | null, cur: number | null): number[] {
  if (prev == null || cur == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => prev + (cur - prev) * t);
}

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
            {coins.slice(0, 30).map(c => {
              const chg = c.change24hPct ?? 0;
              const prev = chg !== 0 ? c.price / (1 + chg / 100) : c.price;
              const spark = makeSpark(prev, c.price);
              return (
                <tr key={c.id} className="border-b border-border/40 hover:bg-surface-elevated">
                  <td className="px-2 py-1 font-bold text-foreground uppercase">{c.symbol}</td>
                  <td className="px-2 py-1 text-right text-foreground">${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-1 py-1"><Sparkline values={spark} width={40} height={10} /></td>
                  <td className={`px-2 py-1 text-right ${chg >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
            {coins.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
