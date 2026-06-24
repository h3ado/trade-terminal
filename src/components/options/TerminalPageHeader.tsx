// Bloomberg-styled header for module pages that render outside OptionsView's
// own header strip. Mirrors the macro CmdShell header.
import { ReactNode, useState } from "react";
import ConnectionIndicator from "@/components/options/ConnectionIndicator";

interface Props {
  moduleCode: string;
  moduleDescription: string;
  ticker?: string;
  onTickerChange?: (ticker: string) => void;
  rightContent?: ReactNode;
  children?: ReactNode;
}

const TerminalPageHeader = ({ moduleCode, moduleDescription, ticker, onTickerChange, rightContent, children }: Props) => {
  const [input, setInput] = useState("");
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return (
    <header className="bg-surface-deep border-b border-accent flex-shrink-0">
      <div className="flex items-center justify-between px-2 h-7">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{moduleCode}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{moduleDescription}</span>
          {ticker && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[11px] font-mono font-bold text-foreground">{ticker}</span>
            </>
          )}
          {onTickerChange && (
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  onTickerChange(input.trim().toUpperCase());
                  setInput("");
                }
              }}
              placeholder="SET TICKER"
              className="w-24 bg-background border border-border px-2 py-0.5 text-[10px] font-mono text-foreground uppercase tracking-wider placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          )}
          {children && (
            <>
              <span className="text-muted-foreground/40">·</span>
              {children}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono flex-shrink-0">
          {rightContent}
          <span className="text-muted-foreground tabular-nums">{ts}</span>
          <ConnectionIndicator />
        </div>
      </div>
    </header>
  );
};

export default TerminalPageHeader;
