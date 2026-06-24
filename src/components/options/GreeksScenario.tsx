// GRK sub-panel: shift spot/IV and see the portfolio Greek response.
import { useMemo, useState } from "react";

interface Props { redact?: boolean }

const BASE = { delta: 142, gamma: 8.4, vega: 312, theta: -94 };

export default function GreeksScenario({ redact = false }: Props) {
  const [spotShift, setSpotShift] = useState(0);     // %
  const [ivShift, setIvShift] = useState(0);         // vol pts
  const [dteShift, setDteShift] = useState(0);       // days

  const adj = useMemo(() => {
    const spotMove = spotShift / 100;
    return {
      delta: BASE.delta + BASE.gamma * spotMove * 100,
      gamma: BASE.gamma * (1 - Math.abs(spotMove) * 1.2),
      vega:  BASE.vega + ivShift * 0,
      theta: BASE.theta * (1 + dteShift / 30),
      pnl:   BASE.delta * spotMove * 100 + BASE.vega * ivShift + BASE.theta * dteShift,
    };
  }, [spotShift, ivShift, dteShift]);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Scenario Simulator</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Slider label="Spot Δ %"   value={spotShift} setValue={setSpotShift} min={-10} max={10} step={0.5} />
        <Slider label="IV Δ vol"   value={ivShift}   setValue={setIvShift}   min={-10} max={10} step={0.5} />
        <Slider label="Days Δ"     value={dteShift}  setValue={setDteShift}  min={-15} max={30} step={1} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
        <Stat label="Δ"    value={redact ? "••" : adj.delta.toFixed(0)} />
        <Stat label="Γ"    value={redact ? "••" : adj.gamma.toFixed(2)} />
        <Stat label="Vega" value={redact ? "••" : adj.vega.toFixed(0)} />
        <Stat label="Theta" value={redact ? "••" : adj.theta.toFixed(0)} accent={adj.theta < 0 ? "neg" : "pos"} />
        <Stat label="Est P&L" value={redact ? "••" : `$${adj.pnl.toFixed(0)}`} accent={adj.pnl >= 0 ? "pos" : "neg"} />
      </div>
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-foreground">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full accent-[hsl(var(--accent))]" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "pos" | "neg" }) {
  const color = accent === "pos" ? "text-emerald-400" : accent === "neg" ? "text-rose-400" : "text-foreground";
  return (
    <div className="bg-surface-elevated p-2">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
