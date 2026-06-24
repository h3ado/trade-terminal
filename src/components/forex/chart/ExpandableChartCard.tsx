import { ReactNode, useEffect, useState } from 'react';
import { Maximize2, Minimize2, Expand, X } from 'lucide-react';

interface Props {
  title: string;
  /** Render the inner chart given an available height. */
  children: (height: number) => ReactNode;
  defaultHeight?: number;
  code?: string;
  rightSlot?: ReactNode;
}

/**
 * Bloomberg-style chart card with title bar, inline-expand and full-screen modes.
 * Use for non-FxProChart visuals (bars, surfaces, payoffs) that still need expand affordances.
 */
export default function ExpandableChartCard({ title, children, defaultHeight = 200, code, rightSlot }: Props) {
  const [inline, setInline] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [full]);

  const effHeight = inline ? Math.max(defaultHeight, Math.floor(window.innerHeight * 0.65)) : defaultHeight;

  const head = (inModal: boolean) => (
    <div className="flex items-center gap-1.5 border-b border-border bg-surface-deep px-2 h-6 flex-shrink-0 text-[10px] font-mono uppercase tracking-wider">
      <span className="text-accent font-bold truncate">{title}</span>
      {code && <span className="text-muted-foreground/60">{code}</span>}
      <div className="ml-auto flex items-center gap-1">
        {rightSlot}
        {!inModal && (
          <>
            <button onClick={() => setInline(v => !v)} title={inline ? 'Collapse' : 'Expand inline'}
              className="px-1 py-0.5 text-muted-foreground hover:text-accent">
              {inline ? <Minimize2 size={11} /> : <Expand size={11} />}
            </button>
            <button onClick={() => setFull(true)} title="Full screen"
              className="px-1 py-0.5 text-muted-foreground hover:text-accent">
              <Maximize2 size={11} />
            </button>
          </>
        )}
        {inModal && (
          <button onClick={() => setFull(false)} title="Close (ESC)"
            className="px-1 py-0.5 text-muted-foreground hover:text-accent">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="border border-border bg-surface-deep flex flex-col">
        {head(false)}
        <div className="bg-surface-primary p-2">{children(effHeight)}</div>
      </div>
      {full && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-stretch justify-center p-2">
          <div className="w-full h-full border border-accent bg-surface-deep flex flex-col">
            {head(true)}
            <div className="bg-surface-primary p-3 flex-1 min-h-0">{children(Math.max(300, window.innerHeight - 80))}</div>
          </div>
        </div>
      )}
    </>
  );
}
