// ALRT — Lightweight price/news alerts for Trading Tools popout.
// Stored locally for v1; cloud-persisted later.
import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell } from 'lucide-react';

interface AlertRule {
  id: string;
  symbol: string;
  cond: '>' | '<';
  price: number;
  hits: number;
  created: number;
}

const KEY = 'tools-alerts-v1';

function load(): AlertRule[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export default function AlertsTile() {
  const [alerts, setAlerts] = useState<AlertRule[]>(load);
  const [sym, setSym] = useState('');
  const [cond, setCond] = useState<'>' | '<'>('>');
  const [price, setPrice] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(alerts));
  }, [alerts]);

  const add = () => {
    const p = parseFloat(price);
    if (!sym || !p) return;
    setAlerts(a => [
      { id: crypto.randomUUID(), symbol: sym.toUpperCase(), cond, price: p, hits: 0, created: Date.now() },
      ...a,
    ]);
    setSym('');
    setPrice('');
  };

  const remove = (id: string) => setAlerts(a => a.filter(x => x.id !== id));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_36px_1fr_28px] gap-1">
        <input
          value={sym}
          onChange={e => setSym(e.target.value.toUpperCase())}
          placeholder="SYM"
          className="px-1.5 py-1 bg-surface-elevated border border-border text-[10px] font-mono text-foreground uppercase focus:outline-none focus:border-accent"
        />
        <select
          value={cond}
          onChange={e => setCond(e.target.value as '>' | '<')}
          className="px-1 py-1 bg-surface-elevated border border-border text-[10px] font-mono text-foreground focus:outline-none focus:border-accent"
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
        </select>
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="PRICE"
          type="number"
          step="0.01"
          className="px-1.5 py-1 bg-surface-elevated border border-border text-[10px] font-mono text-foreground focus:outline-none focus:border-accent"
        />
        <button
          onClick={add}
          className="bg-accent text-accent-foreground font-mono text-[10px] font-bold hover:opacity-90 flex items-center justify-center"
          title="Add alert"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="py-2 text-center text-[9px] font-mono text-muted-foreground uppercase">No alerts set</div>
      ) : (
        <div className="space-y-0">
          {alerts.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 py-1 border-b border-border/40 last:border-0">
              <Bell className="w-2.5 h-2.5 text-accent flex-shrink-0" />
              <span className="text-[10px] font-mono font-bold text-foreground w-12 truncate">{a.symbol}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{a.cond}</span>
              <span className="text-[10px] font-mono tabular-nums text-foreground flex-1">{a.price.toFixed(2)}</span>
              {a.hits > 0 && (
                <span className="text-[8px] font-mono font-bold text-accent px-1 bg-accent/10 border border-accent/30">
                  {a.hits}
                </span>
              )}
              <button
                onClick={() => remove(a.id)}
                className="p-0.5 hover:bg-surface-elevated text-muted-foreground hover:text-negative"
                title="Remove"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
