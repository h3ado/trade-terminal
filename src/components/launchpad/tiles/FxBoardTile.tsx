// Compact FX rates board.
import { useFXRates } from '@/hooks/useFXRates';

export default function FxBoardTile() {
  const { rates, loading } = useFXRates();
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between">
        <span>FXBD · FX Board</span>
        {loading && <span className="text-accent">···</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[10px] font-mono">
          <tbody>
            {rates.map(r => (
              <tr key={r.ccy} className="border-b border-border/40 hover:bg-surface-elevated">
                <td className="px-2 py-1 font-bold text-foreground">{r.ccy}/USD</td>
                <td className="px-2 py-1 text-right text-foreground">{r.usd != null ? r.usd.toFixed(4) : '—'}</td>
                <td className={`px-2 py-1 text-right ${(r.change_pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {(r.change_pct ?? 0) >= 0 ? '+' : ''}{(r.change_pct ?? 0).toFixed(2)}%
                </td>
              </tr>
            ))}
            {rates.length === 0 && !loading && (
              <tr><td colSpan={3} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
