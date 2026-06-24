import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  trail: string[];
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export default function NavBreadcrumb({ trail, canBack, canForward, onBack, onForward }: Props) {
  return (
    <div className="bg-surface-deep border-b border-border px-2 h-6 flex items-center gap-2 text-[10px] font-mono">
      <button
        onClick={onBack}
        disabled={!canBack}
        title="Back (Alt+←)"
        className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
      </button>
      <button
        onClick={onForward}
        disabled={!canForward}
        title="Forward (Alt+→)"
        className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
      >
        <ChevronRight className="w-3 h-3" />
      </button>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5 overflow-hidden">
        {trail.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-muted-foreground/60">›</span>}
            <span
              className={`uppercase tracking-wider truncate ${
                i === trail.length - 1 ? 'text-accent font-bold' : 'text-muted-foreground'
              }`}
            >
              {seg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
