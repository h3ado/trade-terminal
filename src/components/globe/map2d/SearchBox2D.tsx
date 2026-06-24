/**
 * Search/jump-to box for the 2D map. Builds a flat index of every visible
 * dataset (markets, infra points, etc.) and matches case-insensitive substrings.
 * Selecting a result calls `onJump(lat, lng)`.
 */
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

export type SearchEntry = {
  id: string;
  label: string;
  category: string;
  lat: number;
  lng: number;
};

type Props = {
  entries: SearchEntry[];
  onJump: (lat: number, lng: number, entry: SearchEntry) => void;
};

export function SearchBox2D({ entries, onJump }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as SearchEntry[];
    const out: SearchEntry[] = [];
    for (const e of entries) {
      if (e.label.toLowerCase().includes(term) || e.category.toLowerCase().includes(term)) {
        out.push(e);
        if (out.length >= 50) break;
      }
    }
    return out;
  }, [q, entries]);

  return (
    <div className="absolute top-2 left-2 z-30 flex items-center" data-no-drag style={{ marginTop: '2rem' }}>
      {open ? (
        <div className="flex flex-col bg-surface-deep/95 border border-accent/50 backdrop-blur shadow-2xl w-72">
          <div className="flex items-center px-2 py-1 border-b border-border">
            <Search className="w-3 h-3 text-muted-foreground mr-1.5" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search markets, ports, infra…"
              className="flex-1 bg-transparent text-[10px] font-mono text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onClick={() => { setOpen(false); setQ(''); }}
              className="text-muted-foreground hover:text-accent"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {results.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => { onJump(r.lat, r.lng, r); setOpen(false); setQ(''); }}
                  className="w-full text-left px-2 py-1 text-[9px] font-mono hover:bg-accent/20 border-b border-border/40 flex justify-between items-center"
                >
                  <span className="truncate">{r.label}</span>
                  <span className="text-[7px] uppercase text-muted-foreground ml-2 shrink-0">{r.category}</span>
                </button>
              ))}
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="px-2 py-2 text-[9px] text-muted-foreground font-mono">No matches.</div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2 py-1 border text-[9px] font-mono uppercase font-bold backdrop-blur bg-surface-deep/80 text-foreground border-border hover:border-accent"
          title="Search & jump-to"
        >
          <Search className="w-3 h-3" /> Search
        </button>
      )}
    </div>
  );
}
