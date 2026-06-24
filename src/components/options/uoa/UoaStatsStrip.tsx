// Header strip for UOA: aggregate stats across visible prints.
import { UoaPrint } from "./mockUoa";

interface Props { rows: UoaPrint[]; redact?: boolean; }

function fmt$(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export default function UoaStatsStrip({ rows, redact = false }: Props) {
  const callPrem = rows.filter(r => r.cp === "C").reduce((s, r) => s + (r.side === "BUY" ? r.premium : -r.premium), 0);
  const putPrem  = rows.filter(r => r.cp === "P").reduce((s, r) => s + (r.side === "BUY" ? r.premium : -r.premium), 0);
  const netPrem = callPrem - putPrem;
  const ratio = putPrem === 0 ? Infinity : callPrem / Math.max(1, Math.abs(putPrem));

  const topTickers = Object.entries(rows.reduce<Record<string, number>>((m, r) => {
    m[r.ticker] = (m[r.ticker] ?? 0) + r.premium; return m;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const sweepCount = rows.filter(r => r.tags.includes("SWEEP")).length;
  const blockCount = rows.filter(r => r.tags.includes("BLOCK")).length;
  const r$ = (n: number) => redact ? "••" : "$" + fmt$(n);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border border border-border">
      {[
        { label: "Prints", value: rows.length.toString(), cls: "text-foreground" },
        { label: "Net $", value: (netPrem >= 0 ? "+" : "") + r$(netPrem), cls: netPrem >= 0 ? "text-up" : "text-down" },
        { label: "Call $", value: r$(callPrem), cls: "text-up" },
        { label: "Put $", value: r$(putPrem), cls: "text-down" },
        { label: "C/P Ratio", value: isFinite(ratio) ? ratio.toFixed(2) : "∞", cls: "text-accent" },
        { label: "Sweeps / Blocks", value: `${sweepCount} / ${blockCount}`, cls: "text-foreground" },
      ].map(s => (
        <div key={s.label} className="bg-surface-deep px-3 py-1.5">
          <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
          <div className={`text-[12px] font-mono font-bold tabular-nums ${s.cls}`}>{s.value}</div>
        </div>
      ))}
      <div className="bg-surface-deep px-3 py-1.5 md:col-span-6 flex gap-3 overflow-x-auto">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider self-center">Top:</span>
        {topTickers.map(([t, p]) => (
          <span key={t} className="text-[10px] font-mono">
            <span className="text-accent font-bold">{t}</span> <span className="text-muted-foreground">{r$(p)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
