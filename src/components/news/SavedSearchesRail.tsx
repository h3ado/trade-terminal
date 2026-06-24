import { Bell, BellOff, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import type { NewsScope } from '@/hooks/useGdeltNews';

interface Props {
  currentScope: NewsScope;
  currentValue: string;
  onLoad: (scope: NewsScope, value: string) => void;
}

export default function SavedSearchesRail({ currentScope, currentValue, onLoad }: Props) {
  const { items, add, remove, toggleAlert, loading } = useSavedSearches();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    await add(name.trim(), currentScope, currentValue);
    setName('');
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono uppercase text-accent font-bold">Saved Searches</span>
        <button
          onClick={() => setAdding(!adding)}
          className="text-[9px] font-mono text-accent hover:underline flex items-center gap-1"
        >
          <Plus className="w-2.5 h-2.5" /> Save current
        </button>
      </div>

      {adding && (
        <div className="mb-2 p-1.5 border border-accent/40 bg-surface-elevated">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={`Name for ${currentScope.toUpperCase()} ${currentValue}...`}
            className="w-full bg-transparent text-[10px] font-mono text-foreground outline-none border-b border-border pb-1 mb-1"
            autoFocus
          />
          <div className="flex gap-1">
            <button onClick={handleSave} className="flex-1 text-[9px] font-mono uppercase bg-accent text-accent-foreground py-0.5 hover:opacity-90">
              Save
            </button>
            <button onClick={() => { setAdding(false); setName(''); }} className="flex-1 text-[9px] font-mono uppercase border border-border py-0.5 hover:bg-surface-elevated">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[9px] font-mono text-muted-foreground py-2">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-[9px] font-mono text-muted-foreground py-2">No saved searches yet.</div>
      ) : (
        <div className="space-y-0.5">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-1 group">
              <button
                onClick={() => onLoad(s.scope, s.value)}
                className="flex-1 text-left px-1.5 py-1 hover:bg-surface-elevated min-w-0"
              >
                <div className="text-[10px] font-mono text-foreground truncate">{s.name}</div>
                <div className="text-[8px] font-mono text-muted-foreground uppercase">
                  {s.scope}{s.value ? ` · ${s.value}` : ''}
                </div>
              </button>
              <button
                onClick={() => toggleAlert(s.id, !s.alert_enabled)}
                title={s.alert_enabled ? 'Alerts on (delivery rolling out soon)' : 'Enable alerts'}
                className={`p-1 ${s.alert_enabled ? 'text-accent' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
              >
                {s.alert_enabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              </button>
              <button
                onClick={() => remove(s.id)}
                className="p-1 text-muted-foreground/40 hover:text-negative opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
