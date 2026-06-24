// Shared KPI strip primitive for Options modules — mirrors the macro
// CmdShell KPI block. Renders a dense grid of label / value / sub-line
// cells separated by 1px borders.
import { ReactNode } from "react";

export type KpiTone = "neu" | "pos" | "neg" | "accent";

export interface KpiItem {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: KpiTone;
}

interface Props {
  items: KpiItem[];
  /** Tailwind grid-cols-* override. Defaults to auto-fit by count. */
  cols?: string;
}

const TONE: Record<KpiTone, string> = {
  neu: "text-foreground",
  pos: "text-positive",
  neg: "text-negative",
  accent: "text-accent",
};

export default function OptionsKpiStrip({ items, cols }: Props) {
  const n = items.length;
  const auto =
    n <= 4 ? `grid-cols-2 md:grid-cols-${n}` :
    n <= 6 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" :
    n <= 8 ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-8" :
             "grid-cols-2 md:grid-cols-4 lg:grid-cols-6";
  return (
    <div
      className={`grid ${cols ?? auto} gap-[1px] bg-border border-b border-border flex-shrink-0`}
    >
      {items.map((k, i) => (
        <div key={i} className="bg-surface-deep px-2 py-1 min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">
            {k.label}
          </div>
          <div
            className={`text-sm font-mono font-bold tabular-nums ${TONE[k.tone ?? "neu"]} truncate`}
          >
            {k.value}
          </div>
          {k.sub && (
            <div className="text-[9px] font-mono text-muted-foreground truncate">
              {k.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
