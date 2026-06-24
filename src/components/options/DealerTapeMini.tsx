// Compact dealer / sweep tape — last N prints with smart-flag.
import { genPrints, fmtUsd } from "./shared/mockSeries";
import { Zap } from "lucide-react";

interface Props { ticker: string; redact?: boolean; limit?: number }

export default function DealerTapeMini({ ticker, redact = false, limit = 8 }: Props) {
  const prints = genPrints(ticker, limit);
  const r = (s: string | number) => redact ? "••" : String(s);
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[11px] font-mono font-bold text-foreground uppercase tracking-wider">Tape · Sweeps & Blocks</h3>
          <p className="text-[9px] font-mono text-muted-foreground">unusual activity · last {limit}</p>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">LIVE-MOCK</span>
      </div>
      <div className="space-y-px">
        <div className="grid grid-cols-[44px_56px_46px_46px_64px_44px_18px] gap-1 text-[9px] font-mono uppercase text-muted-foreground border-b border-border pb-1">
          <span>Time</span><span>Type</span><span className="text-right">Strike</span><span className="text-right">DTE</span><span className="text-right">Prem</span><span className="text-right">IV</span><span />
        </div>
        {prints.map((p, i) => {
          const isCall = p.type.startsWith("C");
          return (
            <div key={i} className="grid grid-cols-[44px_56px_46px_46px_64px_44px_18px] gap-1 items-center text-[10px] font-mono tabular-nums hover:bg-surface-elevated py-0.5">
              <span className="text-muted-foreground">{p.time.slice(0, 5)}</span>
              <span className={`px-1 text-[9px] font-bold ${isCall ? "bg-chart-up/15 text-up" : "bg-chart-down/15 text-down"}`}>{p.type}</span>
              <span className="text-right text-foreground">{r(p.strike)}</span>
              <span className="text-right text-muted-foreground">{p.expiry}</span>
              <span className="text-right text-accent font-bold">{r(fmtUsd(p.premium))}</span>
              <span className="text-right text-foreground">{r(`${p.iv}`)}</span>
              <span className="text-right">{p.smart && <Zap className="w-2.5 h-2.5 text-accent inline" />}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
