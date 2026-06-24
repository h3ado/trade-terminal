// Reusable right-side drill-down drawer for options modules.
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ReactNode } from "react";

interface KPI { label: string; value: string; tone?: "up" | "down" | "neutral" | "accent" }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  title: string;
  subtitle?: string;
  kpis?: KPI[];
  children?: ReactNode;
}

const toneClass = (t?: KPI["tone"]) => {
  switch (t) {
    case "up": return "text-up";
    case "down": return "text-down";
    case "accent": return "text-accent";
    default: return "text-foreground";
  }
};

export default function OptionDetailDrawer({ open, onOpenChange, code, title, subtitle, kpis, children }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] bg-surface-deep border-l border-border p-0 overflow-y-auto">
        <SheetHeader className="border-b border-border p-3 space-y-1 text-left">
          <SheetTitle className="font-mono text-[11px] flex items-baseline gap-2">
            <span className="text-accent font-bold">{code}</span>
            <span className="text-foreground uppercase tracking-wider">{title}</span>
          </SheetTitle>
          {subtitle && <SheetDescription className="font-mono text-[10px] text-muted-foreground">{subtitle}</SheetDescription>}
        </SheetHeader>

        {kpis && kpis.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 p-3 border-b border-border">
            {kpis.map((k) => (
              <div key={k.label} className="border border-border bg-surface-elevated px-2 py-1.5">
                <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">{k.label}</div>
                <div className={`text-[12px] font-mono font-bold tabular-nums ${toneClass(k.tone)}`}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 space-y-3">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
