// Dealer Positioning Intelligence cockpit — composes all DPI sub-panels.
import { useMemo, useState } from "react";
import { seeded, fmtUsd, fmtPct } from "../shared/mockSeries";
import StatCell from "../shared/StatCell";
import OptionDetailDrawer from "../shared/OptionDetailDrawer";
import ZeroGammaRadar from "./ZeroGammaRadar";
import RegimeRibbon from "./RegimeRibbon";
import HedgeFlowReplay from "./HedgeFlowReplay";
import PriceMagnets, { Magnet } from "./PriceMagnets";
import VannaCharmGauges from "./VannaCharmGauges";
import AlertsStrip from "./AlertsStrip";

interface Props { ticker: string; redact?: boolean }

export default function DpiCockpit({ ticker, redact }: Props) {
  const [drawer, setDrawer] = useState<Magnet | null>(null);

  const snap = useMemo(() => {
    const r = seeded(ticker, "dpi-snap");
    const spot = 480 + r() * 60;
    const zeroG = spot + (r() - 0.5) * 8;
    const netGex = (r() - 0.45) * 4_500_000_000;
    const regime: "long" | "short" = netGex >= 0 ? "long" : "short";
    return {
      spot: +spot.toFixed(2),
      zeroG: +zeroG.toFixed(2),
      distPct: +(((zeroG - spot) / spot) * 100).toFixed(2),
      netGex,
      regime,
      regimeConf: Math.round(55 + r() * 40),
      flipProb: Math.round(20 + r() * 65),
      vanna: (r() - 0.5) * 850_000_000,
      charm: (r() - 0.5) * 320_000_000,
      pinClose: +(spot + (r() - 0.5) * 4).toFixed(2),
    };
  }, [ticker]);

  return (
    <div className="space-y-3">
      <AlertsStrip ticker={ticker} snap={snap} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
        <StatCell label="SPOT" value={snap.spot.toFixed(2)} tone="accent" redact={redact} />
        <StatCell label="ZERO-Γ" value={snap.zeroG.toFixed(2)} delta={`${snap.distPct >= 0 ? "+" : ""}${snap.distPct}%`}
          tone={Math.abs(snap.distPct) < 0.25 ? "down" : "neutral"} redact={redact}
          description="Strike where aggregate dealer gamma flips sign." formula="Σ Γ_i · OI_i · 100 · S² = 0" />
        <StatCell label="NET GEX" value={fmtUsd(snap.netGex)} tone={snap.netGex >= 0 ? "up" : "down"} redact={redact}
          description="Aggregate dealer gamma exposure. >0 = long Γ regime (mean-revert)." />
        <StatCell label="FLIP PROB" value={`${snap.flipProb}%`} tone={snap.flipProb > 50 ? "down" : "neutral"} redact={redact}
          description="Mock prob. of crossing zero-gamma intraday." />
        <StatCell label="NET VANNA" value={fmtUsd(snap.vanna)} tone={snap.vanna >= 0 ? "up" : "down"} redact={redact}
          description="Dealer Δ-hedge demand per 1% IV change." formula="∂Δ/∂σ" />
        <StatCell label="NET CHARM" value={fmtUsd(snap.charm)} tone={snap.charm >= 0 ? "up" : "down"} redact={redact}
          description="Dealer Δ-hedge demand per day of decay." formula="∂Δ/∂t" />
      </div>

      <RegimeRibbon regime={snap.regime} confidence={snap.regimeConf} netGex={snap.netGex} redact={redact} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ZeroGammaRadar ticker={ticker} spot={snap.spot} zeroG={snap.zeroG} flipProb={snap.flipProb} redact={redact} />
        <VannaCharmGauges vanna={snap.vanna} charm={snap.charm} spot={snap.spot} pinClose={snap.pinClose} redact={redact} />
        <div className="lg:col-span-2">
          <HedgeFlowReplay ticker={ticker} spot={snap.spot} redact={redact} />
        </div>
        <div className="lg:col-span-2">
          <PriceMagnets ticker={ticker} spot={snap.spot} onSelect={setDrawer} redact={redact} />
        </div>
      </div>

      <OptionDetailDrawer
        open={!!drawer}
        onOpenChange={(o) => !o && setDrawer(null)}
        code="MAGNET"
        title={drawer ? `${ticker} ${drawer.strike} ${drawer.side}` : ""}
        subtitle={drawer ? `Gravitational score ${drawer.score.toFixed(1)} · ${drawer.dominantExpiry}` : ""}
        kpis={drawer ? [
          { label: "$GEX", value: fmtUsd(drawer.gex), tone: drawer.gex >= 0 ? "up" : "down" },
          { label: "DIST", value: fmtPct(drawer.distPct, 2), tone: "neutral" },
          { label: "SCORE", value: drawer.score.toFixed(1), tone: "accent" },
        ] : []}
      >
        {drawer && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Contributing Strikes</div>
            <div className="border border-border bg-surface-elevated">
              <table className="w-full text-[10px] font-mono">
                <thead className="bg-surface-deep">
                  <tr className="text-muted-foreground">
                    <th className="px-2 py-1 text-left">Expiry</th>
                    <th className="px-2 py-1 text-right">OI</th>
                    <th className="px-2 py-1 text-right">$GEX</th>
                    <th className="px-2 py-1 text-right">Δ-Hedge</th>
                  </tr>
                </thead>
                <tbody>
                  {drawer.contributors.map((c, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1">{c.expiry}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{c.oi.toLocaleString()}</td>
                      <td className={`px-2 py-1 text-right tabular-nums ${c.gex >= 0 ? "text-up" : "text-down"}`}>{fmtUsd(c.gex)}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{c.hedge >= 0 ? "+" : ""}{c.hedge.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </OptionDetailDrawer>
    </div>
  );
}
