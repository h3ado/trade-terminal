// Standard Bloomberg-style frame for every macro CMD.
// Enforces flex h-full min-h-0 so internal tables get a real scroll viewport
// instead of pushing the page below the fold.
import { ReactNode } from 'react';

interface Props {
  code: string;
  title: string;
  /** Right-side header controls (filters, search, tabs trigger). */
  headerRight?: ReactNode;
  /** Optional KPI strip directly below the header. */
  kpis?: ReactNode;
  /** Sub-tab strip below header but above body. */
  tabs?: ReactNode;
  /** Sticky footer line (commentary, sources). */
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  children: ReactNode;
}

export default function CmdShell({ code, title, headerRight, kpis, tabs, footerLeft, footerRight, children }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background border border-border overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-surface-deep border-b border-accent flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{code}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">{headerRight}</div>
      </div>

      {tabs && <div className="flex-shrink-0 bg-surface-deep border-b border-border">{tabs}</div>}
      {kpis && <div className="flex-shrink-0 border-b border-border bg-surface-deep">{kpis}</div>}

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      {(footerLeft || footerRight) && (
        <div className="px-2 py-0.5 bg-surface-deep border-t border-border flex items-center justify-between text-[9px] font-mono text-muted-foreground uppercase flex-shrink-0">
          <span className="truncate">{footerLeft}</span>
          <span className="truncate ml-2">{footerRight}</span>
        </div>
      )}
    </div>
  );
}
