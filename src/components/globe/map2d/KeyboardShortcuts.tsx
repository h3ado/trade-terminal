/**
 * Bloomberg-style keyboard cheat sheet. Toggled by '?' (handled in Map2D).
 * Pure presentation — no state.
 */
import { X } from 'lucide-react';

const ROWS: { key: string; desc: string }[] = [
  { key: '/',         desc: 'Focus command line' },
  { key: '+ / =',     desc: 'Zoom in (cursor / center)' },
  { key: '− / _',     desc: 'Zoom out' },
  { key: '0',         desc: 'Reset view' },
  { key: '?',         desc: 'Toggle this help' },
  { key: 'Esc',       desc: 'Clear selection / close panels' },
  { key: 'M',         desc: 'Toggle measure tool' },
  { key: 'L',         desc: 'Open layers drawer' },
  { key: 'P',         desc: 'Toggle privacy mode' },
  { key: 'Drag',      desc: 'Pan' },
  { key: 'Wheel',     desc: 'Zoom at cursor' },
  { key: 'Shift+drag',desc: 'Box select (planned)' },
];

export function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-no-drag
    >
      <div
        className="bg-surface-deep border border-accent/60 shadow-2xl w-[420px] max-w-[90vw] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/10">
          <div className="text-[10px] uppercase font-bold tracking-wider text-accent">
            Keyboard Shortcuts
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-3 grid grid-cols-1 gap-1">
          {ROWS.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between gap-3 px-2 py-1 text-[10px] hover:bg-accent/5"
            >
              <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border text-[9px] text-foreground font-bold min-w-[60px] text-center">
                {r.key}
              </kbd>
              <span className="flex-1 text-right text-muted-foreground">{r.desc}</span>
            </div>
          ))}
        </div>
        <div className="px-3 py-1.5 border-t border-border text-[8px] uppercase text-muted-foreground tracking-wider">
          Press '?' anywhere on the map to reopen
        </div>
      </div>
    </div>
  );
}
