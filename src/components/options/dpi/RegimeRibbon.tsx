// Regime ribbon: long-Γ vs short-Γ classification with confidence + interpretation.
import { fmtUsd } from "../shared/mockSeries";

interface Props { regime: "long" | "short"; confidence: number; netGex: number; redact?: boolean }

export default function RegimeRibbon({ regime, confidence, netGex, redact }: Props) {
  const isLong = regime === "long";
  const tone = isLong ? "bg-up/15 border-up/40" : "bg-down/15 border-down/40";
  const tag = isLong ? "LONG Γ" : "SHORT Γ";
  const tagTone = isLong ? "text-up" : "text-down";
  const interp = isLong
    ? "Dealers buy dips / sell rips. Realized < implied. Pinning likely."
    : "Dealers chase trends. Realized > implied. Vol expansion risk.";
  const hitRate = isLong ? 64 : 58;

  return (
    <div className={`border ${tone} px-3 py-2 flex items-center gap-3`}>
      <div className={`text-[13px] font-mono font-bold ${tagTone}`}>{tag}</div>
      <div className="text-[10px] font-mono text-foreground flex-1">{interp}</div>
      <div className="text-[9px] font-mono text-muted-foreground">NET GEX <span className="text-foreground">{redact ? "••" : fmtUsd(netGex)}</span></div>
      <div className="text-[9px] font-mono text-muted-foreground">CONF <span className="text-accent font-bold">{redact ? "••" : `${confidence}%`}</span></div>
      <div className="text-[9px] font-mono text-muted-foreground">90d HIT <span className="text-foreground">{redact ? "••" : `${hitRate}%`}</span></div>
    </div>
  );
}
