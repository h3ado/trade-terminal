// Categorized module picker popover used by LaunchTile and the +ADD button.
import { useMemo, useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface ModuleEntry {
  code: string;
  label: string;
  category: 'MARKETS' | 'NEWS/EVT' | 'TRADING' | 'ANALYTICS' | 'VIEWS';
}

export const MODULES: ModuleEntry[] = [
  // Markets
  { code: 'WEI',  label: 'World Equity Indices',  category: 'MARKETS' },
  { code: 'WB',   label: 'World Sovereign Yields', category: 'MARKETS' },
  { code: 'GLCO', label: 'Global Commodities',    category: 'MARKETS' },
  { code: 'HEAT',   label: 'Sector Heatmap',          category: 'MARKETS' },
  { code: 'ROTN',  label: 'Sector Rotation (RRG)',   category: 'MARKETS' },
  { code: 'MOVR',  label: 'Top Movers',              category: 'MARKETS' },
  { code: 'INDX',  label: 'Index Futures',           category: 'MARKETS' },
  { code: 'CRYP',  label: 'Crypto Prices',           category: 'MARKETS' },
  { code: 'FXBD',  label: 'FX Board',                category: 'MARKETS' },
  { code: 'ENRG',  label: 'Energy Prices',           category: 'MARKETS' },
  { code: 'YLDC',  label: 'Yields & Macro',          category: 'MARKETS' },
  { code: 'MINT',  label: 'Market Internals',        category: 'MARKETS' },
  { code: 'NETLIQ',label: 'Net Liquidity Model',     category: 'MARKETS' },
  { code: 'SQZZ',  label: 'Squeeze Scanner',         category: 'MARKETS' },
  // News / Events
  { code: 'TOP',  label: 'Top News',               category: 'NEWS/EVT' },
  { code: 'NEWS', label: 'News Terminal',          category: 'NEWS/EVT' },
  { code: 'ECON', label: 'Econ Calendar',          category: 'NEWS/EVT' },
  { code: 'EARN', label: 'Earnings Calendar',      category: 'NEWS/EVT' },
  { code: 'FED',  label: 'Fed Watch',              category: 'NEWS/EVT' },
  { code: 'CFTC', label: 'COT Positioning',        category: 'NEWS/EVT' },
  { code: 'CBNK', label: 'Central Bank Speeches',  category: 'NEWS/EVT' },
  { code: 'GEO',  label: 'Geopolitics Feed',       category: 'NEWS/EVT' },
  { code: 'WIRE', label: 'News Wires',             category: 'NEWS/EVT' },
  { code: 'QUIZ', label: 'Weekly Quiz',            category: 'NEWS/EVT' },
  // Trading
  { code: 'DASH', label: 'Trading Dashboard',      category: 'TRADING' },
  { code: 'TRDS', label: 'Trades Blotter',         category: 'TRADING' },
  { code: 'POS',  label: 'Open Positions',         category: 'TRADING' },
  { code: 'RISK', label: 'Risk Monitor',           category: 'TRADING' },
  { code: 'ALRT', label: 'Alerts',                 category: 'TRADING' },
  { code: 'WATCH',label: 'Watchlist',              category: 'TRADING' },
  { code: 'PERF', label: 'Performance',            category: 'TRADING' },
  { code: 'JRNL', label: 'Journal',                category: 'TRADING' },
  { code: 'GOAL', label: 'Goals',                  category: 'TRADING' },
  { code: 'PLAY', label: 'Playbooks',              category: 'TRADING' },
  { code: 'MIST', label: 'Mistakes',               category: 'TRADING' },
  // Analytics
  { code: 'CALC', label: 'Calculator Hub',         category: 'ANALYTICS' },
  { code: 'CORR', label: 'Correlation Matrix',     category: 'ANALYTICS' },
  { code: 'OPRA', label: 'Options Pricer',         category: 'ANALYTICS' },
  { code: 'SCAN', label: 'Pre-Market Scanner',     category: 'ANALYTICS' },
  { code: 'ATTR', label: 'P&L Attribution',        category: 'ANALYTICS' },
  { code: 'POSIZ',label: 'Position Sizer',         category: 'ANALYTICS' },
  { code: 'ANLY', label: 'Analytics View',         category: 'ANALYTICS' },
  { code: 'EQTY', label: 'Equity Curve',           category: 'ANALYTICS' },
  { code: 'DDWN', label: 'Drawdown Chart',         category: 'ANALYTICS' },
  { code: 'DIST', label: 'P&L Distribution',       category: 'ANALYTICS' },
  { code: 'DAYP', label: 'Daily P&L',              category: 'ANALYTICS' },
  // Views
  { code: 'FX',   label: 'Forex View',             category: 'VIEWS' },
  { code: 'OPT',  label: 'Options View',           category: 'VIEWS' },
  { code: 'MACR', label: 'Macro View',             category: 'VIEWS' },
  { code: 'GLOB', label: 'Globe View',             category: 'VIEWS' },
  { code: 'CAL',  label: 'Calendar View',          category: 'VIEWS' },
  { code: 'COT',  label: 'COT Data',               category: 'VIEWS' },
];

export const MODULE_BY_CODE: Record<string, ModuleEntry> =
  MODULES.reduce((acc, m) => { acc[m.code] = m; return acc; }, {} as Record<string, ModuleEntry>);

const CATS: ModuleEntry['category'][] = ['MARKETS', 'NEWS/EVT', 'TRADING', 'ANALYTICS', 'VIEWS'];

interface Props {
  selected?: string;
  onPick: (code: string) => void;
  onClose: () => void;
}

export default function ModulePicker({ selected, onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ModuleEntry['category']>(MODULES.find(m => m.code === selected)?.category || 'MARKETS');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return MODULES.filter(m => {
      if (ql) return m.code.toLowerCase().includes(ql) || m.label.toLowerCase().includes(ql);
      return m.category === cat;
    });
  }, [q, cat]);

  return (
    <div
      ref={ref}
      className="absolute top-5 left-0 z-50 bg-card border border-accent/60 shadow-2xl w-[380px] animate-scale-in origin-top-left"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-2 h-7 border-b border-border bg-surface-deep">
        <Search className="w-3 h-3 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search modules…"
          className="flex-1 min-w-0 bg-transparent text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none uppercase"
        />
        <span className="text-[9px] font-mono text-muted-foreground">{filtered.length}</span>
      </div>
      <div className="flex">
        {!q && (
          <div className="flex-shrink-0 w-[110px] border-r border-border bg-surface-deep">
            {CATS.map(c => (
              <button
                key={c}
                onMouseEnter={() => setCat(c)}
                onClick={() => setCat(c)}
                className={`w-full px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider transition-colors ${
                  cat === c ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 max-h-[280px] overflow-y-auto">
          {filtered.map(m => (
            <button
              key={m.code}
              onClick={() => { onPick(m.code); onClose(); }}
              className={`w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-surface-elevated transition-colors ${
                m.code === selected ? 'bg-accent/20' : ''
              }`}
            >
              <span className="text-[10px] font-mono font-bold text-accent w-12 flex-shrink-0">{m.code}</span>
              <span className="text-[10px] font-mono text-foreground truncate">{m.label}</span>
              <span className="ml-auto text-[8px] font-mono text-muted-foreground uppercase">{m.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-[9px] font-mono text-muted-foreground text-center">No matches</div>
          )}
        </div>
      </div>
    </div>
  );
}
