// Dense Bloomberg-style stat cell: label, value, optional delta + sparkline + hover tooltip.
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import Sparkline from "./Sparkline";

interface Props {
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down" | "neutral" | "accent";
  spark?: number[];
  formula?: string;
  description?: string;
  source?: string;
  redact?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const toneClass = (t: Props["tone"]) => {
  switch (t) {
    case "up": return "text-up";
    case "down": return "text-down";
    case "accent": return "text-accent";
    default: return "text-foreground";
  }
};

export default function StatCell({
  label, value, delta, tone = "neutral", spark, formula, description, source, redact, onClick, compact,
}: Props) {
  const cell = (
    <div
      onClick={onClick}
      className={`border border-border bg-surface-elevated ${compact ? "px-2 py-1" : "px-2 py-1.5"} flex flex-col min-w-0 ${onClick ? "cursor-pointer hover:border-accent" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">{label}</span>
        {spark && <Sparkline data={spark} width={36} height={10} color="auto" />}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className={`text-[12px] font-mono font-bold tabular-nums ${toneClass(tone)}`}>{redact ? "••" : value}</span>
        {delta && !redact && (
          <span className={`text-[9px] font-mono tabular-nums ${tone === "down" ? "text-down" : tone === "up" ? "text-up" : "text-muted-foreground"}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );

  if (!formula && !description) return cell;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{cell}</TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-[10px] max-w-[260px] bg-surface-deep border-border">
          <div className="font-bold text-accent uppercase mb-1">{label}</div>
          {description && <div className="text-foreground mb-1">{description}</div>}
          {formula && <div className="text-muted-foreground"><span className="text-accent">ƒ:</span> {formula}</div>}
          {source && <div className="text-muted-foreground mt-1">src: {source}</div>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
