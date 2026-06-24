import { useState, useEffect, useRef, useMemo } from 'react';
import { COMMANDS } from '@/components/CommandLine';
import { countries } from '@/contexts/MacroCountryContext';

type Item = {
  key: string;
  category: 'CMD' | 'TICKER' | 'COUNTRY' | 'RECENT';
  code: string;
  label: string;
  raw: string; // what gets sent to lovable:cli-execute
  hint?: string;
};

const COMMON_TICKERS = ['SPY', 'QQQ', 'IWM', 'DIA', 'SPX', 'NDX', 'VIX', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'AMZN', 'GOOGL', 'AMD', 'NFLX', 'COIN', 'PLTR', 'GLD', 'SLV', 'USO', 'TLT', 'HYG', 'XLE', 'XLF', 'XLK', 'XLV'];

const RECENT_KEY = 'lovable:cmd-palette:recent';

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(raw: string) {
  try {
    const prev = loadRecent().filter((r) => r !== raw);
    localStorage.setItem(RECENT_KEY, JSON.stringify([raw, ...prev].slice(0, 8)));
  } catch {}
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIdx(0);
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [];

    // Recent
    if (!query.trim()) {
      for (const r of recent) {
        all.push({ key: `recent-${r}`, category: 'RECENT', code: r.split(/\s+/)[0], label: r, raw: r, hint: 'recently used' });
      }
    }

    // Commands
    for (const c of COMMANDS) {
      all.push({ key: `cmd-${c.code}`, category: 'CMD', code: c.code, label: c.label, raw: c.code });
    }

    // Tickers — quick options jump
    for (const t of COMMON_TICKERS) {
      all.push({ key: `tk-${t}`, category: 'TICKER', code: t, label: `Options Workspace · ${t}`, raw: `OPT ${t}`, hint: '→ /OPT' });
    }

    // Countries (macro)
    for (const c of countries) {
      all.push({ key: `cc-${c.code}`, category: 'COUNTRY', code: c.code, label: `${c.flag} ${c.name}`, raw: `MACR ${c.code}`, hint: c.currency });
    }

    if (!query.trim()) return all.slice(0, 60);

    const q = query.trim().toUpperCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = all
      .map((it) => {
        const hay = `${it.code} ${it.label}`.toUpperCase();
        let score = 0;
        if (it.code.toUpperCase().startsWith(q)) score += 100;
        for (const t of tokens) if (hay.includes(t)) score += 10;
        return { it, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 80)
      .map((s) => s.it);

    return scored;
  }, [query, recent]);

  useEffect(() => { setIdx(0); }, [query]);

  const run = (it: Item) => {
    pushRecent(it.raw);
    window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { raw: it.raw } }));
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[idx] || items[0];
      if (it) run(it);
      else if (query.trim()) {
        // Fallback: send raw query to CLI
        const raw = query.trim().toUpperCase();
        pushRecent(raw);
        window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { raw } }));
        setOpen(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] bg-background/70 backdrop-blur-[2px]"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-[640px] max-w-[92vw] bg-card border border-accent/40 shadow-[0_0_0_1px_hsl(var(--accent)/0.2),0_20px_60px_-10px_hsl(var(--accent)/0.25)] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-accent/30 bg-surface-elevated">
          <span className="text-accent text-[10px] font-mono font-bold tracking-wider">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands, tickers, countries…"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-foreground text-[12px] font-mono placeholder:text-muted-foreground/60 uppercase tracking-wider"
          />
          <span className="text-[9px] font-mono text-muted-foreground">{items.length}</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <div className="px-3 py-6 text-center text-[10px] font-mono text-muted-foreground">
              No matches. Press Enter to run "{query}" via CLI.
            </div>
          )}
          {items.map((it, i) => (
            <button
              key={it.key}
              onMouseEnter={() => setIdx(i)}
              onClick={() => run(it)}
              className={`w-full px-3 py-1.5 flex items-center gap-3 text-left transition-colors ${
                i === idx ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-surface-elevated'
              }`}
            >
              <span className={`text-[9px] font-mono font-bold w-14 ${i === idx ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>
                {it.category}
              </span>
              <span className={`text-[11px] font-mono font-bold w-16 ${i === idx ? 'text-accent-foreground' : 'text-accent'}`}>
                {it.code}
              </span>
              <span className="text-[10px] font-mono truncate flex-1">{it.label}</span>
              {it.hint && (
                <span className={`text-[9px] font-mono ${i === idx ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                  {it.hint}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-accent/20 bg-surface-elevated text-[9px] font-mono text-muted-foreground">
          <span>↑↓ navigate · ⏎ run · ESC close</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
