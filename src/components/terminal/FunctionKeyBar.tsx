// Per-view function key bar (used by NewsView and other surfaces).
// A simple horizontal strip of F-keys mapped to local view actions.
import { useEffect } from 'react';

export interface FKey {
  key: string;          // e.g. "F1"
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface Props {
  keys: FKey[];
}

export default function FunctionKeyBar({ keys }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keys.find(x => x.key === e.key);
      if (!k) return;
      // Only F2-F12 to avoid hijacking browser F1
      const m = /^F(\d{1,2})$/.exec(e.key);
      if (!m) return;
      const n = parseInt(m[1], 10);
      if (n < 2 || n > 12) return;
      e.preventDefault();
      k.onClick();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keys]);

  return (
    <div className="flex items-stretch gap-[1px] bg-surface-deep border-t border-border h-[22px] text-[9px] font-mono font-bold uppercase tracking-wider select-none">
      {keys.map(k => (
        <button
          key={k.key}
          onClick={k.onClick}
          className={`flex-1 px-1 flex items-center justify-center gap-1 transition-colors ${
            k.active
              ? 'bg-accent text-accent-foreground'
              : 'bg-surface-elevated text-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <span className="opacity-60">{k.key}</span>
          <span>{k.label}</span>
        </button>
      ))}
    </div>
  );
}
