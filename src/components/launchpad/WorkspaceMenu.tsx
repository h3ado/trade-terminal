// Saved-workspace dropdown for the Launchpad toolbar.
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Copy, Edit3, Trash2 } from 'lucide-react';
import type { Workspace } from '@/hooks/useLaunchpadState';

interface Props {
  workspaces: Workspace[];
  activeId: string;
  onSwitch: (id: string) => void;
  onSaveAs: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function WorkspaceMenu({ workspaces, activeId, onSwitch, onSaveAs, onRename, onDelete, onDuplicate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = workspaces.find(w => w.id === activeId);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 h-5 text-[10px] font-mono font-bold text-accent uppercase border border-border bg-surface-elevated hover:bg-surface-deep transition-colors"
      >
        <span className="text-muted-foreground">WS:</span>
        <span>{active?.name || '—'}</span>
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <div className="absolute top-6 right-0 z-50 bg-card border border-accent/60 shadow-2xl min-w-[200px] animate-scale-in origin-top-right">
          <div className="max-h-[200px] overflow-y-auto">
            {workspaces.map(w => (
              <button
                key={w.id}
                onClick={() => { onSwitch(w.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-2 py-1 text-left hover:bg-surface-elevated transition-colors ${
                  w.id === activeId ? 'bg-accent/20' : ''
                }`}
              >
                <span className="text-[10px] font-mono text-foreground truncate">{w.name}</span>
                <span className="text-[8px] font-mono text-muted-foreground">{w.tiles.length}T</span>
              </button>
            ))}
          </div>
          <div className="border-t border-border">
            <button
              onClick={() => {
                const name = prompt('New workspace name:', `${active?.name || 'Workspace'} (copy)`);
                if (name) onSaveAs(name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[10px] font-mono text-foreground hover:bg-surface-elevated transition-colors"
            >
              <Plus className="w-3 h-3 text-accent" /> SAVE AS…
            </button>
            <button
              onClick={() => { onDuplicate(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[10px] font-mono text-foreground hover:bg-surface-elevated transition-colors"
            >
              <Copy className="w-3 h-3 text-accent" /> DUPLICATE
            </button>
            <button
              onClick={() => {
                const name = prompt('Rename workspace:', active?.name || '');
                if (name) onRename(name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[10px] font-mono text-foreground hover:bg-surface-elevated transition-colors"
            >
              <Edit3 className="w-3 h-3 text-accent" /> RENAME
            </button>
            <button
              onClick={() => {
                if (workspaces.length <= 1) { alert('Cannot delete the last workspace.'); return; }
                if (confirm(`Delete workspace "${active?.name}"?`)) onDelete();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[10px] font-mono text-negative hover:bg-surface-elevated transition-colors"
            >
              <Trash2 className="w-3 h-3" /> DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
