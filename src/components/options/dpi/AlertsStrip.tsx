// Alert chips for DPI cockpit derived from current snapshot.
interface Snap { spot: number; zeroG: number; distPct: number; regime: "long" | "short"; flipProb: number; charm: number; }

interface Props { ticker: string; snap: Snap }

export default function AlertsStrip({ ticker, snap }: Props) {
  const alerts: { code: string; tone: "up" | "down" | "accent" | "neutral"; text: string }[] = [];
  if (Math.abs(snap.distPct) < 0.25) {
    alerts.push({ code: "ZG-PROX", tone: "down", text: `${ticker} within 0.25% of zero-Γ` });
  }
  if (snap.flipProb > 60) {
    alerts.push({ code: "FLIP-RISK", tone: "down", text: `Flip probability ${snap.flipProb}%` });
  }
  if (Math.abs(snap.charm) > 200_000_000) {
    alerts.push({ code: "CHARM-ACC", tone: "accent", text: "Charm acceleration into close" });
  }
  // OPEX week tag — third friday of month proximity (mock)
  const d = new Date();
  const dom = d.getDate();
  if (dom >= 15 && dom <= 21) alerts.push({ code: "OPEX", tone: "accent", text: "Monthly OPEX week" });

  if (alerts.length === 0) {
    alerts.push({ code: "OK", tone: "up", text: "No active alerts" });
  }

  const toneClass = (t: typeof alerts[0]["tone"]) =>
    t === "up" ? "border-up/40 text-up" :
    t === "down" ? "border-down/40 text-down" :
    t === "accent" ? "border-accent/40 text-accent" :
    "border-border text-foreground";

  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-border bg-surface-deep px-2 py-1.5">
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mr-1">Alerts</span>
      {alerts.map((a, i) => (
        <div key={i} className={`border ${toneClass(a.tone)} px-1.5 py-0.5 text-[9px] font-mono flex items-center gap-1.5`}>
          <span className="font-bold">{a.code}</span>
          <span className="opacity-80">{a.text}</span>
        </div>
      ))}
    </div>
  );
}
