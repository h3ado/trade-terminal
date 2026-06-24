// Vanna + Charm pressure gauges with end-of-day pin projection.
import { fmtUsd } from "../shared/mockSeries";

interface Props { vanna: number; charm: number; spot: number; pinClose: number; redact?: boolean }

function Gauge({ label, value, max, formula }: { label: string; value: number; max: number; formula: string }) {
  const pct = Math.max(-100, Math.min(100, (value / max) * 100));
  const isPos = pct >= 0;
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-1">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`font-bold ${isPos ? "text-up" : "text-down"}`}>{fmtUsd(value)}</span>
      </div>
      <div className="relative h-3 bg-surface-elevated border border-border">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent" />
        <div className={`absolute top-0 bottom-0 ${isPos ? "bg-up/60" : "bg-down/60"}`}
          style={{
            left: isPos ? "50%" : `${50 + pct / 2}%`,
            width: `${Math.abs(pct) / 2}%`,
          }} />
      </div>
      <div className="text-[8px] font-mono text-muted-foreground mt-1">ƒ {formula}</div>
    </div>
  );
}

export default function VannaCharmGauges({ vanna, charm, spot, pinClose, redact }: Props) {
  const drift = pinClose - spot;
  return (
    <div className="border border-border bg-surface-deep p-3 space-y-3">
      <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Vanna · Charm Pressure</div>
      {redact ? (
        <div className="text-[10px] font-mono text-muted-foreground">••</div>
      ) : (
        <>
          <Gauge label="Vanna (per 1% IV)" value={vanna} max={1_000_000_000} formula="∂Δ/∂σ" />
          <Gauge label="Charm (per day)" value={charm} max={400_000_000} formula="∂Δ/∂t" />
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground uppercase">Pin Projection (Close)</span>
              <span className="text-foreground font-bold tabular-nums">{pinClose.toFixed(2)}</span>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground mt-1">
              Charm-driven drift: <span className={drift >= 0 ? "text-up" : "text-down"}>{drift >= 0 ? "+" : ""}{drift.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
