// Compact FX rates board with sparklines.
import { useFXRates } from '@/hooks/useFXRates';
import Sparkline from '@/components/tools/widgets/Sparkline';

function makeSpark(prev: number | null, cur: number | null): number[] {
  if (prev == null || cur == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => prev + (cur - prev) * t);
}

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
            {rates.map(r => {
              const chg = r.change_pct ?? 0;
              const cur = r.usd;
              const prev = cur != null && chg !== 0 ? cur / (1 + chg / 100) : cur;
              const spark = makeSpark(prev ?? null, cur ?? null);
              return (
                <tr key={r.ccy} className="border-b border-border/40 hover:bg-surface-elevated">
                  <td className="px-2 py-1 font-bold text-foreground">{r.ccy}/USD</td>
                  <td className="px-2 py-1 text-right text-foreground">{cur != null ? cur.toFixed(4) : '—'}</td>
                  <td className="px-1 py-1"><Sparkline values={spark} width={40} height={10} /></td>
                  <td className={`px-2 py-1 text-right ${chg >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
            {rates.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
