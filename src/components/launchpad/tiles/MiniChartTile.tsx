// Thin wrapper that gives any internal chart component a sized container.
import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export default function MiniChartTile({ title, children }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep">
        {title}
      </div>
      <div className="flex-1 min-h-0 relative">{children}</div>
    </div>
  );
}
