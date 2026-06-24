// Right-slide detail drawer for drill-down inside a CMD.
// Closes on ESC, outside click, or close button.
import { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const WIDTHS = { sm: 'w-[360px]', md: 'w-[520px]', lg: 'w-[680px]' };

export default function CmdDrawer({ open, onClose, title, subtitle, width = 'md', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 bg-background/40 z-30" onClick={onClose} />
      <aside className={`absolute top-0 right-0 h-full ${WIDTHS[width]} max-w-full bg-background border-l-2 border-accent z-40 flex flex-col shadow-2xl`}>
        <div className="flex items-start justify-between px-2 py-1 bg-surface-deep border-b border-accent flex-shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider truncate">{title}</div>
            {subtitle && <div className="text-[9px] font-mono text-muted-foreground uppercase truncate">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-[14px] font-mono text-muted-foreground hover:text-accent leading-none px-1">×</button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </aside>
    </>
  );
}
