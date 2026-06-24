// Compact yield curve tile via useFRED.
import { useFRED } from '@/hooks/useFRED';

export default function YieldCurveTile() {
  const { byKey, loading } = useFRED();
  const list = Object.values(byKey);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between">
        <span>YLDC · Yields & Macro</span>
        {loading && <span className="text-accent">···</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-[10px] font-mono">
          <tbody>
            {list.map(r => (
              <tr key={r.key} className="border-b border-border/40 hover:bg-surface-elevated">
                <td className="px-2 py-1 font-bold text-foreground">{r.label}</td>
                <td className="px-2 py-1 text-right text-foreground">{r.value !== null ? r.value.toFixed(2) : '—'}</td>
                <td className={`px-2 py-1 text-right ${(r.change ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {r.change !== null ? `${r.change >= 0 ? '+' : ''}${r.change.toFixed(2)}` : ''}
                </td>
                <td className="px-2 py-1 text-right text-muted-foreground text-[9px]">{r.unit}</td>
              </tr>
            ))}
            {list.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-2 py-3 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
