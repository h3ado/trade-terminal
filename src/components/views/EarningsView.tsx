import { useState, useEffect } from 'react';
import EarnHub from '@/components/options/earn/EarnHub';
import type { EarnFilter } from '@/hooks/useEarningsCalendar';

interface Props {
  initialTicker?: string;
  initialFilter?: EarnFilter;
}

export default function EarningsView({ initialTicker = 'AAPL', initialFilter }: Props) {
  const [ticker, setTicker] = useState(initialTicker.toUpperCase());
  const [filter, setFilter] = useState<EarnFilter>(initialFilter ?? { window: 'week' });
  const [input, setInput] = useState(initialTicker.toUpperCase());

  useEffect(() => {
    setTicker(initialTicker.toUpperCase());
    setInput(initialTicker.toUpperCase());
  }, [initialTicker]);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const commit = () => {
    const t = input.trim().toUpperCase();
    if (t) setTicker(t);
  };

  const WIN_OPTS: { id: EarnFilter['window']; label: string }[] = [
    { id: 'today', label: 'TODAY' },
    { id: 'tom',   label: 'TMR' },
    { id: 'week',  label: 'WEEK' },
    { id: 'month', label: 'MO' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Bloomberg-style header */}
      <div className="flex items-center gap-0 border-b border-border bg-surface-deep shrink-0 h-[28px]">
        <div className="flex items-center gap-2 px-3 border-r border-border h-full">
          <span className="text-[9px] font-mono font-bold text-accent tracking-widest">EARN</span>
          <span className="text-[9px] font-mono text-muted-foreground">Earnings &amp; IV Crush Terminal</span>
        </div>

        {/* Ticker search */}
        <div className="flex items-center gap-1 px-3 border-r border-border h-full">
          <span className="text-[8px] font-mono text-muted-foreground uppercase">TICKER</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') commit(); }}
            onBlur={commit}
            className="w-16 bg-transparent text-accent font-mono font-bold text-[10px] outline-none border-b border-accent/40 focus:border-accent uppercase tracking-wider text-center"
            spellCheck={false}
          />
        </div>

        {/* Window filter */}
        <div className="flex items-center h-full border-r border-border">
          {WIN_OPTS.map(w => (
            <button
              key={w.id}
              onClick={() => setFilter(f => ({ ...f, window: w.id }))}
              className={`px-2 h-full text-[8px] font-mono font-bold uppercase tracking-wide border-r border-border transition-colors ${
                filter.window === w.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              }`}
            >{w.label}</button>
          ))}
        </div>

        {/* Session filter */}
        <div className="flex items-center h-full border-r border-border">
          {(['BMO', 'AMC'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(f => ({ ...f, session: f.session === s ? undefined : s }))}
              className={`px-2 h-full text-[8px] font-mono font-bold uppercase tracking-wide border-r border-border transition-colors ${
                filter.session === s
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              }`}
            >{s}</button>
          ))}
        </div>

        {/* Stars filter */}
        <div className="flex items-center h-full border-r border-border">
          {([3, 2, 1] as const).map(n => (
            <button
              key={n}
              onClick={() => setFilter(f => ({ ...f, minImportance: f.minImportance === n ? undefined : n }))}
              className={`px-2 h-full text-[8px] font-mono border-r border-border transition-colors ${
                filter.minImportance === n
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              }`}
            >{'★'.repeat(n)}</button>
          ))}
        </div>

        <div className="ml-auto px-3 flex items-center h-full">
          <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">IV CRUSH · PLAYBOOK · SCENARIO · CALENDAR</span>
        </div>
      </div>

      {/* Hub body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <EarnHub
          ticker={ticker}
          onTickerChange={t => { setTicker(t); setInput(t); }}
          filter={filter}
        />
      </div>
    </div>
  );
}
