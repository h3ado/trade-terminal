// Advanced KPI strip for DASH — clickable cells open detail drawers with history sparklines.
import { useState } from "react";
import StatCell from "./shared/StatCell";
import OptionDetailDrawer from "./shared/OptionDetailDrawer";
import Sparkline from "./shared/Sparkline";
import { seeded, sparkline, percentile, fmtPct, fmtUsd } from "./shared/mockSeries";

interface Props { ticker: string; redact?: boolean }

interface KpiDef {
  key: string;
  label: string;
  base: number;
  vol: number;
  fmt: (n: number) => string;
  description: string;
  formula: string;
  tone?: "up" | "down" | "accent" | "neutral";
  source?: string;
}

export default function DashKpiStrip({ ticker, redact = false }: Props) {
  const rnd = seeded(ticker, "dashkpi");
  const seed = (k: string, base: number, vol: number) => sparkline(ticker, k, base, vol);

  const KPIS: KpiDef[] = [
    { key: "ivr",   label: "IV RANK",   base: 35 + rnd() * 50, vol: 0.05, fmt: (n) => fmtPct(n, 0), description: "Where current IV sits in 1y range", formula: "(IV - IV.min) / (IV.max - IV.min)", tone: "accent" },
    { key: "ivp",   label: "IV %ILE",   base: 30 + rnd() * 60, vol: 0.05, fmt: (n) => fmtPct(n, 0), description: "% of days last year below current IV", formula: "rank(IV) / n", tone: "accent" },
    { key: "rv20",  label: "RV 20D",    base: 14 + rnd() * 12, vol: 0.06, fmt: (n) => fmtPct(n, 1), description: "Realized vol 20-day annualized", formula: "stdev(log returns) · √252", tone: "up" },
    { key: "ivrv",  label: "IV/RV",     base: 0.9 + rnd() * 0.6, vol: 0.05, fmt: (n) => n.toFixed(2), description: "Vol-risk premium ratio", formula: "ATM IV / RV20", tone: "neutral" },
    { key: "pcv",   label: "P/C VOL",   base: 0.7 + rnd() * 0.6, vol: 0.08, fmt: (n) => n.toFixed(2), description: "Put volume / call volume today", formula: "ΣputVol / ΣcallVol", tone: "neutral" },
    { key: "pco",   label: "P/C OI",    base: 0.8 + rnd() * 0.4, vol: 0.04, fmt: (n) => n.toFixed(2), description: "Put open interest / call OI", formula: "ΣputOI / ΣcallOI", tone: "neutral" },
    { key: "sk25",  label: "SKEW 25Δ",  base: -2 + rnd() * 6, vol: 0.1, fmt: (n) => n.toFixed(2), description: "25Δ put IV minus 25Δ call IV", formula: "IV(25ΔP) − IV(25ΔC)", tone: "down" },
    { key: "term",  label: "TERM SLOPE", base: -0.5 + rnd() * 3, vol: 0.08, fmt: (n) => n.toFixed(2), description: "Back-month IV minus front-month IV", formula: "IV(M2) − IV(M1)", tone: "neutral" },
    { key: "gflip", label: "Γ FLIP",    base: 480 + rnd() * 30, vol: 0.01, fmt: (n) => `$${n.toFixed(0)}`, description: "Strike where dealer gamma changes sign", formula: "GEX(K) = 0", tone: "accent" },
    { key: "dnetg", label: "DLR NET Γ", base: 1e8 + rnd() * 4e8, vol: 0.08, fmt: fmtUsd, description: "Total dealer gamma exposure", formula: "Σ OI · Γ · 100 · S²", tone: "up" },
    { key: "dnetv", label: "DLR NET VANNA", base: 5e6 + rnd() * 2e7, vol: 0.1, fmt: fmtUsd, description: "Total dealer vanna exposure", formula: "Σ OI · ∂Δ/∂σ", tone: "up", source: "spotgamma-style" },
    { key: "0dte",  label: "0DTE %",    base: 35 + rnd() * 30, vol: 0.05, fmt: (n) => fmtPct(n, 0), description: "0DTE share of total volume", formula: "vol(0DTE) / totalVol", tone: "accent" },
  ];

  const [active, setActive] = useState<KpiDef | null>(null);
  const activeSeries = active ? seed(active.key, active.base, active.vol) : [];
  const last = activeSeries[activeSeries.length - 1] ?? 0;

  return (
    <>
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Advanced Metrics — {ticker}</span>
          <span className="text-[9px] font-mono text-muted-foreground">click for detail</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1">
          {KPIS.map((k) => {
            const s = seed(k.key, k.base, k.vol);
            const v = s[s.length - 1];
            const prev = s[s.length - 2];
            const delta = v - prev;
            return (
              <StatCell
                key={k.key}
                label={k.label}
                value={k.fmt(v)}
                delta={`${delta >= 0 ? "+" : ""}${(delta).toFixed(Math.abs(v) > 100 ? 0 : 2)}`}
                tone={delta >= 0 ? "up" : "down"}
                spark={s.slice(-12)}
                formula={k.formula}
                description={k.description}
                source={k.source}
                redact={redact}
                onClick={() => setActive(k)}
                compact
              />
            );
          })}
        </div>
      </div>

      <OptionDetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        code={active?.label ?? ""}
        title={active?.description ?? ""}
        subtitle={active?.formula}
        kpis={active ? [
          { label: "Current", value: redact ? "••" : active.fmt(last), tone: "accent" },
          { label: "30d Avg", value: redact ? "••" : active.fmt(activeSeries.reduce((a, b) => a + b, 0) / activeSeries.length) },
          { label: "%ile", value: redact ? "••" : `${percentile(activeSeries)}%`, tone: "accent" },
          { label: "30d Min", value: redact ? "••" : active.fmt(Math.min(...activeSeries)) },
          { label: "30d Max", value: redact ? "••" : active.fmt(Math.max(...activeSeries)) },
          { label: "30d Δ", value: redact ? "••" : `${((last - activeSeries[0]) / Math.max(Math.abs(activeSeries[0]), 0.0001) * 100).toFixed(1)}%`, tone: last >= activeSeries[0] ? "up" : "down" },
        ] : []}
      >
        {active && (
          <>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">30-Day History</div>
              <div className="border border-border bg-surface-elevated p-2">
                <Sparkline data={activeSeries} width={480} height={120} color="auto" className="w-full" />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Distribution</div>
              <div className="border border-border bg-surface-elevated p-2 flex items-end gap-px h-20">
                {(() => {
                  const sorted = [...activeSeries].sort((a, b) => a - b);
                  const bins = 12;
                  const lo = sorted[0], hi = sorted[sorted.length - 1];
                  const w = (hi - lo) / bins || 1;
                  const counts = new Array(bins).fill(0);
                  sorted.forEach((v) => { const i = Math.min(bins - 1, Math.floor((v - lo) / w)); counts[i]++; });
                  const max = Math.max(...counts);
                  return counts.map((c, i) => (
                    <div key={i} className="flex-1 bg-accent/60" style={{ height: `${(c / max) * 100}%` }} title={`${(lo + i * w).toFixed(2)}-${(lo + (i + 1) * w).toFixed(2)}: ${c}`} />
                  ));
                })()}
              </div>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              <span className="text-accent">NOTE</span> · Mock series seeded by ticker. {active.source ? `Source proxy: ${active.source}.` : ""}
            </div>
          </>
        )}
      </OptionDetailDrawer>
    </>
  );
}
