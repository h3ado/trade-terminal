import { useEffect, useState, ReactNode } from "react";
import ConnectionIndicator from "@/components/shared/ConnectionIndicator";
import AlertsButton from "@/components/shared/AlertsButton";

interface Props {
  code: string;
  label: string;
  context?: ReactNode;
  right?: ReactNode;
  showAlerts?: boolean;
  showConnection?: boolean;
  showClock?: boolean;
}

export default function CmdHeaderStrip({
  code,
  label,
  context,
  right,
  showAlerts = true,
  showConnection = true,
  showClock = true,
}: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!showClock) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [showClock]);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 border-b border-accent bg-surface-deep px-2 h-7 flex-shrink-0">
      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{code}</span>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      {context !== undefined && context !== null && context !== "" && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[11px] font-mono font-bold text-foreground tracking-wider truncate">{context}</span>
        </>
      )}

      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        {right}
        {showAlerts && <AlertsButton />}
        {showConnection && <ConnectionIndicator />}
        {showClock && (
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider tabular-nums">
            {hh}:{mm}:{ss}
          </span>
        )}
      </div>
    </div>
  );
}
