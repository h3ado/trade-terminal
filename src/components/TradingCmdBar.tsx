import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CmdItem { code: string; label: string; }

const TRADING_CMDS: CmdItem[] = [
  { code: 'DASH', label: 'Dashboard' },
  { code: 'TRDS', label: 'All Trades' },
  { code: 'ANLY', label: 'Analytics' },
  { code: 'CAL',  label: 'Calendar' },
  { code: 'PERF', label: 'Performance' },
  { code: 'NOTE', label: 'Journal' },
  { code: 'PLAY', label: 'Playbooks' },
  { code: 'MIST', label: 'Mistakes' },
  { code: 'GOAL', label: 'Goals' },
  { code: 'NEW',  label: 'New Trade' },
  { code: 'PRIV', label: 'Toggle Privacy' },
  { code: 'ACCT', label: 'Account Manager' },
  { code: 'NEWS', label: 'News Terminal' },
  { code: 'QUIZ', label: 'Weekly Quiz' },
  { code: 'OPT',  label: 'Options Workspace' },
  { code: 'GLOB', label: 'Markets Globe' },
];

interface Props {
  onCommand: (code: string) => void;
}

export default function TradingCmdBar({ onCommand }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-deep border-b border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-2 py-1 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span>Trading CMDs</span>
        <span className="text-muted-foreground/50">({TRADING_CMDS.length})</span>
        <span className="ml-auto text-muted-foreground/50 normal-case tracking-normal">
          Press <span className="text-accent">/</span> to focus CLI
        </span>
      </button>
      {open && (
        <div className="px-2 pb-1.5 pt-0.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-0.5 animate-fade-in">
          {TRADING_CMDS.map(c => (
            <button
              key={c.code}
              onClick={() => onCommand(c.code)}
              className="flex items-center gap-1.5 px-1 py-0.5 text-left hover:bg-surface-elevated transition-colors group"
            >
              <span className="text-[10px] font-mono font-bold text-accent w-10 group-hover:text-accent">{c.code}</span>
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground truncate">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
