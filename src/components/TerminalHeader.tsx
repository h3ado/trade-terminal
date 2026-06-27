import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import CommandLine from '@/components/CommandLine';
import AccountMenu from '@/components/AccountMenu';
import type { MacroTab } from '@/config/views';
import type { FxTab } from '@/config/fx';
import { ViewType } from '@/types/trade';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface Props {
  onAddTrade?: () => void;
  onNavigate?: (view: ViewType) => void;
  onMacroTab?: (tab: MacroTab) => void;
  onFxTab?: (tab: FxTab) => void;
}

function getMarketCountdown() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = et.getHours(), m = et.getMinutes(), s = et.getSeconds();
  const day = et.getDay();
  const totalSec = h * 3600 + m * 60 + s;
  const openSec = 9 * 3600 + 30 * 60;
  const closeSec = 16 * 3600;

  const fmtCountdown = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const sec = secs % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${sec}s`;
    return `${sec}s`;
  };

  if (day === 0 || day === 6) {
    return { isOpen: false, label: 'CLOSED', sub: 'Weekend' };
  }
  if (totalSec < openSec) {
    return { isOpen: false, label: 'PRE-MKT', sub: `Opens ${fmtCountdown(openSec - totalSec)}` };
  }
  if (totalSec < closeSec) {
    return { isOpen: true, label: 'OPEN', sub: `Closes ${fmtCountdown(closeSec - totalSec)}` };
  }
  let nextOpenSecs = (24 * 3600 - totalSec) + openSec;
  if (day === 5) nextOpenSecs += 2 * 24 * 3600;
  return { isOpen: false, label: 'AFTER-HRS', sub: `Opens ${fmtCountdown(nextOpenSecs)}` };
}

export default function TerminalHeader({ onAddTrade, onNavigate, onMacroTab, onFxTab }: Props) {
  const { togglePrivacy } = usePrivacy();
  const [time, setTime] = useState('');
  const [market, setMarket] = useState(getMarketCountdown);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }));
      setMarket(getMarketCountdown());
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="bg-accent px-3 py-1 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <CommandLine
          onNavigate={(view) => onNavigate?.(view)}
          onAddTrade={() => onAddTrade?.()}
          onTogglePrivacy={togglePrivacy}
          onMacroTab={(tab) => onMacroTab?.(tab)}
          onFxTab={(tab) => onFxTab?.(tab)}
        />
        <div className="h-4 w-px bg-accent-foreground/20" />
        <span className="text-accent-foreground/80 text-[10px] font-mono font-medium">{time}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${market.isOpen ? 'bg-positive animate-pulse-dot' : 'bg-accent-foreground/40'}`} />
          <span className={`text-[10px] font-mono font-bold ${market.isOpen ? 'text-accent-foreground' : 'text-accent-foreground/60'}`}>{market.label}</span>
          <span className="text-[9px] font-mono text-accent-foreground/50">{market.sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onAddTrade}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-accent-foreground/90 text-accent text-[10px] font-mono uppercase font-bold hover:bg-accent-foreground transition-colors"
        >
          <Plus className="w-3 h-3" /> ADD
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
