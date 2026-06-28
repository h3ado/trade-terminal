// Compact energy prices via useEIA with sparklines.
import { useEIA } from '@/hooks/useEIA';
import Sparkline from '@/components/tools/widgets/Sparkline';

function makeSpark(prev: number | null, cur: number | null): number[] {
  if (prev == null || cur == null) return [0, 0, 0, 0, 0, 0, 0];
  return [0, 0.15, 0.3, 0.5, 0.65, 0.8, 1].map(t => prev + (cur - prev) * t);
}

export default function EnergyTile() {
  const { byKey, loading } = useEIA();
  const list = Object.values(byKey);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between">
        <span>ENRG · Energy</span>
        {loading && <span className="text-accent">···</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[10px] font-mono">
          <tbody>
            {list.map(r => {
              const spark = makeSpark(r.prev ?? null, r.value ?? null);
              return (
                <tr key={r.key} className="border-b border-border/40 hover:bg-surface-elevated">
                  <td className="px-2 py-1 font-bold text-foreground">{r.label}</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.value !== null ? r.value.toFixed(2) : '—'}</td>
                  <td className="px-1 py-1"><Sparkline values={spark} width={40} height={10} /></td>
                  <td className={`px-2 py-1 text-right ${(r.change ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {r.change !== null ? `${r.change >= 0 ? '+' : ''}${r.change.toFixed(2)}` : ''}
                  </td>
                  <td className="px-2 py-1 text-right text-muted-foreground text-[9px]">{r.unit}</td>
                </tr>
              );
            })}
            {list.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
