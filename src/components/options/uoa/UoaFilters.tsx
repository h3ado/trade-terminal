// Filter chips for UOA scanner.
import { Dispatch, SetStateAction } from "react";

export interface UoaFilterState {
  side: "ALL" | "BUY" | "SELL";
  cp: "ALL" | "C" | "P";
  minPremium: number;
  minSize: number;
  sweepOnly: boolean;
  repeatOnly: boolean;
  ticker: string;
}

export const defaultFilters: UoaFilterState = {
  side: "ALL", cp: "ALL", minPremium: 0, minSize: 0, sweepOnly: false, repeatOnly: false, ticker: "",
};

interface Props { state: UoaFilterState; setState: Dispatch<SetStateAction<UoaFilterState>>; }

export default function UoaFilters({ state, setState }: Props) {
  const chip = (active: boolean) =>
    `px-2 py-0.5 text-[10px] font-mono border ${active ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border bg-surface-deep px-3 py-1.5">
      <div className="flex flex-col">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Side</span>
        <div className="flex gap-0.5">
          {(["ALL", "BUY", "SELL"] as const).map(s => (
            <button key={s} className={chip(state.side === s)} onClick={() => setState(p => ({ ...p, side: s }))}>{s}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">C/P</span>
        <div className="flex gap-0.5">
          {(["ALL", "C", "P"] as const).map(s => (
            <button key={s} className={chip(state.cp === s)} onClick={() => setState(p => ({ ...p, cp: s }))}>{s}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Min Prem $</span>
        <input type="number" value={state.minPremium}
          onChange={e => setState(p => ({ ...p, minPremium: +e.target.value || 0 }))}
          className="w-24 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Min Size</span>
        <input type="number" value={state.minSize}
          onChange={e => setState(p => ({ ...p, minSize: +e.target.value || 0 }))}
          className="w-20 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:border-accent" />
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Ticker</span>
        <input value={state.ticker} placeholder="ANY"
          onChange={e => setState(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
          className="w-20 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono focus:outline-none focus:border-accent" />
      </div>
      <button className={chip(state.sweepOnly)} onClick={() => setState(p => ({ ...p, sweepOnly: !p.sweepOnly }))}>SWEEPS</button>
      <button className={chip(state.repeatOnly)} onClick={() => setState(p => ({ ...p, repeatOnly: !p.repeatOnly }))}>REPEAT</button>
    </div>
  );
}
