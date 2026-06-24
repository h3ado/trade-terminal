// Dealer Flow Feed — header KPIs, filter chips, rich columns, smart-flag.
import { useMemo, useState } from "react";
import { genPrints, fmtUsd, DealerPrint } from "./shared/mockSeries";
import { Zap } from "lucide-react";
import StatCell from "./shared/StatCell";

interface Props { redact?: boolean }

const TICKERS = ["SPY", "QQQ", "NVDA", "AAPL", "TSLA", "META"];

export default function DealerFlowFeed({ redact = false }: Props) {
  const all: DealerPrint[] = useMemo(() => {
    return TICKERS.flatMap((t) => genPrints(t, 8))
      .sort((a, b) => a.ageSec - b.ageSec)
      .slice(0, 24);
  }, []);

  const [side, setSide] = useState<"ALL" | "C" | "P">("ALL");
  const [kind, setKind] = useState<"ALL" | "SWP" | "BLK">("ALL");
  const [smartOnly, setSmartOnly] = useState(false);

  const filtered = useMemo(() => all.filter((p) => {
    if (side !== "ALL" && !p.type.startsWith(side)) return false;
    if (kind !== "ALL" && !p.type.endsWith(kind)) return false;
    if (smartOnly && !p.smart) return false;
    return true;
  }), [all, side, kind, smartOnly]);

  // Aggregates
  const callPrem = all.filter((p) => p.type.startsWith("C")).reduce((s, p) => s + p.premium, 0);
  const putPrem  = all.filter((p) => p.type.startsWith("P")).reduce((s, p) => s + p.premium, 0);
  const blocks   = all.filter((p) => p.type.endsWith("BLK")).length;
  const sweeps   = all.filter((p) => p.type.endsWith("SWP")).length;
  const blockNot = all.filter((p) => p.type.endsWith("BLK")).reduce((s, p) => s + p.premium, 0);
  const netG     = (callPrem - putPrem) * 0.02;
  const netV     = (callPrem - putPrem) * 0.001;
  const r = (s: string | number) => redact ? "••" : String(s);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Dealer Flow Feed</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Real-time unusual options activity · {filtered.length}/{all.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-1 mb-2">
        <StatCell label="CALL $"     value={fmtUsd(callPrem)} tone="up"   redact={redact} compact />
        <StatCell label="PUT $"      value={fmtUsd(putPrem)}  tone="down" redact={redact} compact />
        <StatCell label="NET Γ FLOW" value={fmtUsd(netG)}     tone={netG >= 0 ? "up" : "down"} redact={redact} compact formula="(C$ − P$) · gamma proxy" description="Sign of inferred dealer gamma flow" />
        <StatCell label="NET VANNA"  value={fmtUsd(netV)}     tone={netV >= 0 ? "up" : "down"} redact={redact} compact />
        <StatCell label="BLOCK $"    value={fmtUsd(blockNot)} tone="accent" redact={redact} compact />
        <StatCell label="SWP / BLK"  value={`${sweeps} / ${blocks}`} tone="neutral" redact={redact} compact />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] font-mono">
        <FilterChip label="ALL"   active={side === "ALL"} onClick={() => setSide("ALL")} />
        <FilterChip label="CALL"  active={side === "C"}   onClick={() => setSide("C")} />
        <FilterChip label="PUT"   active={side === "P"}   onClick={() => setSide("P")} />
        <span className="mx-1 text-muted-foreground/40">·</span>
        <FilterChip label="ANY"   active={kind === "ALL"} onClick={() => setKind("ALL")} />
        <FilterChip label="SWEEP" active={kind === "SWP"} onClick={() => setKind("SWP")} />
        <FilterChip label="BLOCK" active={kind === "BLK"} onClick={() => setKind("BLK")} />
        <span className="mx-1 text-muted-foreground/40">·</span>
        <FilterChip label="SMART" active={smartOnly} onClick={() => setSmartOnly((s) => !s)} />
      </div>

      <div className="space-y-px">
        <div className="grid grid-cols-[46px_44px_50px_60px_44px_60px_56px_44px_44px_18px] gap-1 text-[9px] font-mono uppercase text-muted-foreground border-b border-border pb-1">
          <span>Time</span><span>Tkr</span><span>Type</span><span className="text-right">Strk</span><span className="text-right">DTE</span><span className="text-right">Prem</span><span className="text-right">Spot</span><span className="text-right">IV</span><span>Exch</span><span />
        </div>
        {filtered.map((p, i) => {
          const isCall = p.type.startsWith("C");
          return (
            <div key={i} className="grid grid-cols-[46px_44px_50px_60px_44px_60px_56px_44px_44px_18px] gap-1 items-center text-[10px] font-mono tabular-nums hover:bg-surface-elevated py-0.5">
              <span className="text-muted-foreground">{p.time.slice(0, 5)}</span>
              <span className="text-accent font-bold">{p.ticker}</span>
              <span className={`px-1 text-[9px] font-bold ${isCall ? "bg-chart-up/15 text-up" : "bg-chart-down/15 text-down"}`}>{p.type}</span>
              <span className="text-right text-foreground">{r(p.strike)}</span>
              <span className="text-right text-muted-foreground">{p.expiry}</span>
              <span className="text-right text-accent font-bold">{r(fmtUsd(p.premium))}</span>
              <span className="text-right text-foreground">{r(p.spot.toFixed(2))}</span>
              <span className="text-right text-foreground">{r(p.iv)}</span>
              <span className="text-muted-foreground">{p.exchange}</span>
              <span className="text-right">{p.smart && <Zap className="w-2.5 h-2.5 text-accent inline" />}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-2 py-0.5 border font-bold ${active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
      {label}
    </button>
  );
}
