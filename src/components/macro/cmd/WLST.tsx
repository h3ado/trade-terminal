import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'market-watchlist-v1';
const REFRESH_MS = 60_000;
const DEFAULT_TICKERS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'MSFT'];

interface Quote {
  ticker: string;
  name?: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  isMarketOpen?: boolean;
  loading: boolean;
  error?: boolean;
}

function loadTickers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TICKERS;
  } catch { return DEFAULT_TICKERS; }
}

function saveTickers(tickers: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers)); } catch { /* ignore */ }
}

function RangeBar({ low, high, current }: { low: number | null; high: number | null; current: number | null }) {
  if (!low || !high || !current || high <= low) return <span className="text-muted-foreground">—</span>;
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));
  return (
    <div className="flex items-center gap-1 w-full">
      <span className="text-[8px] text-muted-foreground w-10 text-right">{low.toFixed(0)}</span>
      <div className="flex-1 h-1 bg-surface-elevated rounded-full relative">
        <div className="absolute top-0 left-0 h-1 bg-accent/40 rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-[-1px] h-[6px] w-[2px] bg-accent rounded-full" style={{ left: `${pct}%` }} />
      </div>
      <span className="text-[8px] text-muted-foreground w-10">{high.toFixed(0)}</span>
    </div>
  );
}

export default function WLST() {
  const [tickers, setTickers] = useState<string[]>(loadTickers);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [input, setInput] = useState('');
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuote = useCallback(async (ticker: string) => {
    setQuotes(prev => ({ ...prev, [ticker]: { ...(prev[ticker] ?? {}), ticker, loading: true } as Quote }));
    try {
      const r = await fetch(`/api/market/security/${encodeURIComponent(ticker)}/overview`);
      const d = r.ok ? await r.json() : null;
      if (d?.error) throw new Error(d.error);
      setQuotes(prev => ({
        ...prev,
        [ticker]: {
          ticker,
          name: d?.name ?? undefined,
          price: d?.price ?? null,
          change: d?.change ?? null,
          changePct: d?.changePct ?? null,
          volume: d?.volume ?? null,
          fiftyTwoWeekHigh: d?.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: d?.fiftyTwoWeekLow ?? null,
          isMarketOpen: d?.isMarketOpen ?? undefined,
          loading: false,
        },
      }));
    } catch {
      setQuotes(prev => ({ ...prev, [ticker]: { ...(prev[ticker] ?? {}), ticker, loading: false, error: true } as Quote }));
    }
  }, []);

  const refreshAll = useCallback((list: string[]) => {
    list.forEach(fetchQuote);
    setLastRefresh(Date.now());
  }, [fetchQuote]);

  useEffect(() => {
    refreshAll(tickers);
    timerRef.current = setInterval(() => refreshAll(tickers), REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tickers, refreshAll]);

  const addTicker = () => {
    const t = input.trim().toUpperCase().replace(/[^A-Z0-9.^=-]/g, '');
    if (!t || tickers.includes(t)) { setInput(''); return; }
    const next = [...tickers, t];
    setTickers(next);
    saveTickers(next);
    setInput('');
  };

  const removeTicker = (t: string) => {
    const next = tickers.filter(x => x !== t);
    setTickers(next);
    saveTickers(next);
    setQuotes(prev => { const n = { ...prev }; delete n[t]; return n; });
  };

  const fmt = (n: number | null, decimals = 2, prefix = '') =>
    n != null ? `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : '—';

  return (
    <div className="h-full flex flex-col bg-background font-mono text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-surface-deep flex-shrink-0">
        <span className="text-[10px] uppercase font-bold text-accent tracking-wider">WLST</span>
        <span className="text-muted-foreground text-[9px]">·</span>
        <span className="text-[9px] text-muted-foreground">Market Watchlist · {tickers.length} tickers</span>
        <button
          onClick={() => refreshAll(tickers)}
          className="ml-auto text-muted-foreground hover:text-accent p-0.5"
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        {lastRefresh > 0 && (
          <span className="text-[8px] text-muted-foreground">
            {Math.floor((Date.now() - lastRefresh) / 1000)}s ago
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-[10px] border-collapse">
          <thead className="sticky top-0 bg-surface-deep border-b border-border z-10">
            <tr className="text-muted-foreground text-[9px] uppercase tracking-wider">
              <th className="text-left px-3 py-1 font-bold w-20">Ticker</th>
              <th className="text-left px-2 py-1 font-bold">Name</th>
              <th className="text-right px-2 py-1 font-bold w-20">Price</th>
              <th className="text-right px-2 py-1 font-bold w-16">Chg</th>
              <th className="text-right px-2 py-1 font-bold w-16">Chg%</th>
              <th className="text-right px-2 py-1 font-bold w-20">Volume</th>
              <th className="px-2 py-1 font-bold w-48">52W Range</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {tickers.map(ticker => {
              const q = quotes[ticker];
              const up = (q?.changePct ?? 0) >= 0;
              const chgCls = up ? 'text-green-400' : 'text-red-400';
              return (
                <tr
                  key={ticker}
                  className="border-b border-border/30 hover:bg-surface-elevated/30 transition-colors"
                >
                  <td className="px-3 py-1.5">
                    <span className="text-accent font-bold">{ticker}</span>
                    {q?.isMarketOpen && <span className="ml-1 text-[7px] text-green-400">●</span>}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[160px]">
                    {q?.loading ? <span className="animate-pulse bg-surface-elevated rounded w-24 h-2 inline-block" /> : (q?.name ?? '—')}
                  </td>
                  <td className="px-2 py-1.5 text-right font-bold tabular-nums">
                    {q?.loading ? <span className="animate-pulse bg-surface-elevated rounded w-12 h-2 inline-block" /> : fmt(q?.price ?? null)}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${chgCls}`}>
                    {q?.loading ? '—' : fmt(q?.change ?? null, 2, (q?.change ?? 0) >= 0 ? '+' : '')}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${chgCls}`}>
                    {q?.loading ? '—' : q?.changePct != null ? `${up ? '+' : ''}${q.changePct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                    {q?.volume != null ? (q.volume >= 1e6 ? `${(q.volume / 1e6).toFixed(1)}M` : `${(q.volume / 1e3).toFixed(0)}K`) : '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <RangeBar low={q?.fiftyTwoWeekLow ?? null} high={q?.fiftyTwoWeekHigh ?? null} current={q?.price ?? null} />
                  </td>
                  <td className="px-1 py-1.5">
                    <button onClick={() => removeTicker(ticker)} className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add ticker input */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border bg-surface-deep flex-shrink-0">
        <span className="text-[9px] text-muted-foreground uppercase">Add:</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') addTicker(); }}
          placeholder="TICKER"
          className="flex-1 bg-transparent text-[10px] font-mono text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/40 focus:border-accent pb-0.5 max-w-[100px]"
        />
        <button
          onClick={addTicker}
          className="text-accent hover:text-accent/80 flex items-center gap-1 text-[9px] uppercase font-bold"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
        <span className="ml-auto text-[8px] text-muted-foreground">Persists across sessions · refreshes every 60s</span>
      </div>
    </div>
  );
}
