import { useEffect } from 'react';
import { fxTabs, type FxTab } from '@/config/fx';
import { BridgeProvider } from '@/contexts/BridgeContext';
import { useFxBase, FX_BASES, FxBase } from '@/contexts/FxBaseContext';
import CmdHeaderStrip from '@/components/shared/CmdHeaderStrip';
import WFXMonitor from '@/components/macro/WFXMonitor';
import CrossRateMatrix from '@/components/macro/CrossRateMatrix';
import FXInfoPortal from '@/components/macro/FXInfoPortal';
import FXForecast from '@/components/macro/FXForecast';
import FXCalculator from '@/components/macro/FXCalculator';
import CurrencyTKC from '@/components/macro/CurrencyTKC';
import WorldCurrencyRates from '@/components/macro/WorldCurrencyRates';
import ForwardCurve from '@/components/macro/ForwardCurve';
import WCRSPerformance from '@/components/macro/WCRSPerformance';
import InternationalReserves from '@/components/macro/InternationalReserves';
import FXHome from '@/components/forex/FXHome';
import FXVolSurface from '@/components/forex/FXVolSurface';
import FXOptionsQuick from '@/components/forex/FXOptionsQuick';
import FXCarryMonitor from '@/components/forex/FXCarryMonitor';
import FXHistory from '@/components/forex/FXHistory';
import FXNews from '@/components/forex/FXNews';
import FXFundamentals from '@/components/forex/FXFundamentals';
import FXTechChart from '@/components/forex/FXTechChart';

interface Props { activeTab: FxTab; onTabChange?: (t: FxTab) => void }

const FKEY_MAP: { key: string; id: FxTab }[] = [
  { key: 'F1', id: 'home' },
  { key: 'F2', id: 'wfx' },
  { key: 'F3', id: 'fxc' },
  { key: 'F4', id: 'fxip' },
  { key: 'F5', id: 'fxfa' },
  { key: 'F6', id: 'fxtf' },
  { key: 'F7', id: 'frd' },
  { key: 'F8', id: 'carry' },
  { key: 'F9', id: 'fxv' },
  { key: 'F10', id: 'fxop' },
];

function renderTab(activeTab: FxTab) {
  switch (activeTab) {
    case 'home':  return <FXHome />;
    case 'wfx':   return <WFXMonitor />;
    case 'fxc':   return <CrossRateMatrix />;
    case 'fxip':  return <FXInfoPortal />;
    case 'fxfa':  return <FXFundamentals />;
    case 'fxtf':  return <FXTechChart />;
    case 'fxfc':  return <FXForecast />;
    case 'fxca':  return <FXCalculator />;
    case 'tkc':   return <CurrencyTKC />;
    case 'wcr':   return <WorldCurrencyRates />;
    case 'frd':   return <ForwardCurve />;
    case 'wcrs':  return <WCRSPerformance />;
    case 'wira':  return <InternationalReserves />;
    case 'fxv':   return <FXVolSurface />;
    case 'fxop':  return <FXOptionsQuick />;
    case 'carry': return <FXCarryMonitor />;
    case 'fxh':   return <FXHistory />;
    case 'fxnw':  return <FXNews />;
    default:      return <FXHome />;
  }
}


function ForexViewInner({ activeTab, onTabChange }: Props) {
  const { base, setBase } = useFxBase();
  const meta = fxTabs.find(t => t.id === activeTab) ?? fxTabs[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable);
      if (inField) return;
      const match = FKEY_MAP.find(m => m.key === e.key);
      if (!match) return;
      e.preventDefault();
      onTabChange?.(match.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTabChange]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-2 min-w-0">
        {renderTab(activeTab)}
      </div>

      {/* Bloomberg footer bar — Forex F-key shortcuts */}
      <div className="flex items-center gap-3 border-t border-border bg-surface-deep px-2 py-0.5 flex-shrink-0 text-[9px] font-mono text-muted-foreground overflow-x-auto uppercase tracking-wider">
        <span className="text-accent font-bold">FOREX TERMINAL</span>
        <span className="text-muted-foreground/60">{meta.code} &lt;GO&gt;</span>
        <span className="text-muted-foreground/40">·</span>
        {FKEY_MAP.map(({ key, id }) => {
          const m = fxTabs.find(t => t.id === id);
          if (!m) return null;
          return (
            <button key={key} onClick={() => onTabChange?.(id)} className="hover:text-accent whitespace-nowrap">
              <span className="text-accent">{key}</span> {m.code}
            </button>
          );
        })}
        <span className="ml-auto text-muted-foreground/60 whitespace-nowrap">BASE: <span className="text-accent">{base}</span> · F1–F10 = MODULES</span>
      </div>
    </div>
  );
}

export default function ForexView({ activeTab, onTabChange }: Props) {
  return (
    <BridgeProvider>
      <ForexViewInner activeTab={activeTab} onTabChange={onTabChange} />
    </BridgeProvider>
  );
}
