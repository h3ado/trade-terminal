import { useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';

function GreekRow({ label, value, tone, desc }: { label: string; value: string; tone: string; desc: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div>
        <div className="text-[11px] font-mono font-bold text-accent">{label}</div>
        <div className="text-[8px] font-mono text-muted-foreground">{desc}</div>
      </div>
      <span className={`text-[18px] font-mono font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function GreeksAggrWidget() {
  const { trades } = useTrades();

  const { netDelta, netTheta, openCount, contractCount } = useMemo(() => {
    const open = trades.filter(t => t.type === 'Option' && !t.exit);
    let netDelta = 0;
    let netTheta = 0;
    let contractCount = 0;
    for (const t of open) {
      const mult = t.contractMultiplier ?? 100;
      const sign = (t.side === 'SHORT' || t.side === 'PUT') ? -1 : 1;
      const size = t.size ?? 1;
      if (t.delta != null) netDelta += t.delta * size * mult * sign;
      if (t.theta != null) netTheta += t.theta * size * mult * sign;
      contractCount += size;
    }
    return { netDelta, netTheta, openCount: open.length, contractCount };
  }, [trades]);

  const fmtGreek = (v: number) => {
    if (v === 0) return '0.00';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
  };

  const deltaTone = netDelta > 50 ? 'text-positive' : netDelta < -50 ? 'text-negative' : netDelta > 0 ? 'text-positive/70' : netDelta < 0 ? 'text-negative/70' : 'text-foreground';
  const thetaTone = netTheta < 0 ? 'text-negative' : 'text-positive';

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Portfolio Greeks</div>
        <div className="text-[8px] font-mono text-muted-foreground/60">
          {openCount} positions · {contractCount} contracts
        </div>
      </div>

      {openCount === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[9px] font-mono text-muted-foreground/50 text-center px-4">
          No open option positions.<br />Add options trades to see portfolio Greeks.
        </div>
      ) : (
        <div className="flex-1">
          <GreekRow
            label="Δ NET DELTA"
            value={fmtGreek(netDelta)}
            tone={deltaTone}
            desc="$-equiv move per +$1 on underlying"
          />
          <GreekRow
            label="Θ NET THETA"
            value={fmtGreek(netTheta)}
            tone={thetaTone}
            desc="Daily time decay ($/day)"
          />
          <GreekRow
            label="Γ GAMMA"
            value="—"
            tone="text-muted-foreground"
            desc="Delta change per $1 move (not tracked)"
          />
          <GreekRow
            label="ν VEGA"
            value="—"
            tone="text-muted-foreground"
            desc="P&L per 1% IV change (not tracked)"
          />
        </div>
      )}

      <div className="text-[8px] font-mono text-muted-foreground/40 text-center">
        Based on Greeks entered at trade time · Log delta/theta per trade to populate
      </div>
    </div>
  );
}
