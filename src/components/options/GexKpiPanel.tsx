// GEX side-panel KPIs (Net/Call/Put/Zero-Γ/Largest strike) with formulas in tooltips.
import StatCell from "./shared/StatCell";
import { seeded, sparkline, fmtUsd } from "./shared/mockSeries";

interface Props { ticker: string; redact?: boolean }

export default function GexKpiPanel({ ticker, redact = false }: Props) {
  const rnd = seeded(ticker, "gexkpi");
  const net = (rnd() - 0.3) * 6e8;
  const callG = rnd() * 5e8;
  const putG = -rnd() * 5e8;
  const zero = +(478 + rnd() * 12).toFixed(2);
  const largest = Math.round(480 + (rnd() - 0.5) * 20);
  const flip = +(zero + (rnd() - 0.5) * 2).toFixed(2);
  const regime = net > 0 ? "LONG Γ" : "SHORT Γ";

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">GEX Positioning — {ticker}</span>
        <span className={`text-[9px] font-mono font-bold ${net > 0 ? "text-up" : "text-down"}`}>{regime}</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
        <StatCell label="NET GEX"   value={fmtUsd(net)}   tone={net >= 0 ? "up" : "down"} spark={sparkline(ticker, "ngex", Math.abs(net), 0.1).slice(-12)} formula="Σ OI · Γ · 100 · S²" description="Total dealer gamma exposure" redact={redact} compact />
        <StatCell label="CALL GEX"  value={fmtUsd(callG)} tone="up" spark={sparkline(ticker, "cgex", callG, 0.1).slice(-12)} formula="Σ callOI · Γ · 100 · S²" description="Long call gamma supply" redact={redact} compact />
        <StatCell label="PUT GEX"   value={fmtUsd(putG)}  tone="down" spark={sparkline(ticker, "pgex", Math.abs(putG), 0.1).slice(-12)} formula="−Σ putOI · Γ · 100 · S²" description="Short put gamma demand" redact={redact} compact />
        <StatCell label="ZERO-Γ"    value={`$${zero}`}    tone="accent" formula="GEX(K) = 0" description="Strike where dealer Γ flips" redact={redact} compact />
        <StatCell label="Γ FLIP"    value={`$${flip}`}    tone="accent" formula="∂GEX/∂S = 0" description="Inflection of dealer hedge" redact={redact} compact />
        <StatCell label="MAX Γ"     value={`$${largest}`} tone="accent" formula="argmax(|GEX(K)|)" description="Strike with largest absolute GEX" redact={redact} compact />
      </div>
    </div>
  );
}
