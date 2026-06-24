// Drop-in replacement for Recharts ResponsiveContainer that adds a
// Bloomberg-style expand affordance (full-screen modal). Same props/usage —
// just import this instead of ResponsiveContainer.
import { ReactNode, useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

interface Props {
  width?: string | number;
  height?: string | number;
  minHeight?: number;
  minWidth?: number;
  aspect?: number;
  debounce?: number;
  className?: string;
  children: ReactNode;
}

export function ExpandableResponsiveContainer({ height = 200, width = '100%', children, ...rest }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setOpen(true)}
          title="Expand"
          className="absolute top-0 right-0 z-10 p-0.5 text-muted-foreground hover:text-accent bg-card/60 hover:bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 size={11} />
        </button>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ResponsiveContainer width={width as any} height={height as any} {...(rest as any)}>
          {children as any}
        </ResponsiveContainer>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-sm flex items-stretch justify-center p-2">
          <div className="w-full h-full border border-accent bg-surface-deep flex flex-col">
            <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-2 h-6 flex-shrink-0 text-[10px] font-mono uppercase tracking-wider">
              <span className="text-accent font-bold">CHART · EXPANDED</span>
              <button onClick={() => setOpen(false)} title="Close (ESC)" className="ml-auto px-1 py-0.5 text-muted-foreground hover:text-accent">
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-surface-primary p-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ResponsiveContainer width="100%" height="100%">
                {children as any}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExpandableResponsiveContainer;
