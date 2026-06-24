// SidePanel: lightweight slide-in right drawer for filters/detail.
// Custom (not Radix Sheet) so we can size precisely & avoid overlay blur.
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

export default function SidePanel({ open, onClose, title, width = 380, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 bottom-0 right-0 z-50 bg-background border-l border-accent/40 font-mono flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        style={{ width }}
      >
        <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-surface-deep flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-accent tracking-wider">{title}</span>
          <button
            onClick={onClose}
            className="ml-auto text-muted-foreground hover:text-accent text-[10px] uppercase font-bold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> ESC
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
