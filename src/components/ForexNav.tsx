import { useFxBase, FX_BASES, FxBase } from '@/contexts/FxBaseContext';

export type FxTab =
  | 'home' | 'wfx' | 'fxc' | 'fxip' | 'fxfa' | 'fxtf' | 'fxfc' | 'fxca' | 'tkc'
  | 'wcr' | 'frd' | 'wcrs' | 'wira' | 'fxv' | 'fxop' | 'carry' | 'fxh' | 'fxnw';

export const fxTabs: { id: FxTab; label: string; code: string }[] = [
  { id: 'home',  label: 'Overview',     code: 'FX' },
  { id: 'wfx',   label: 'World FX',     code: 'WFX' },
  { id: 'fxc',   label: 'Cross Matrix', code: 'FXC' },
  { id: 'fxip',  label: 'FX Portal',    code: 'FXIP' },
  { id: 'fxfa',  label: 'Fundamentals', code: 'FXFA' },
  { id: 'fxtf',  label: 'Tech Chart',   code: 'FXTF' },
  { id: 'wcrs',  label: 'Performance',  code: 'WCRS' },
  { id: 'tkc',   label: 'Region FX',    code: 'TKC' },
  { id: 'wcr',   label: 'World Spots',  code: 'WCR' },
  { id: 'frd',   label: 'Forwards',     code: 'FRD' },
  { id: 'carry', label: 'Carry',        code: 'CARRY' },
  { id: 'fxv',   label: 'Vol Surface',  code: 'FXV' },
  { id: 'fxop',  label: 'Options',      code: 'FXOP' },
  { id: 'fxfc',  label: 'Forecasts',    code: 'FXFC' },
  { id: 'fxca',  label: 'Calculator',   code: 'FXCA' },
  { id: 'wira',  label: 'Reserves',     code: 'WIRA' },
  { id: 'fxh',   label: 'History',      code: 'FXH' },
  { id: 'fxnw',  label: 'News',         code: 'FXNW' },
];


interface Props {
  activeTab: FxTab;
  onTabChange: (t: FxTab) => void;
}

export default function ForexNav({ activeTab, onTabChange }: Props) {
  const { base, setBase } = useFxBase();
  return (
    <nav className="bg-background border-b border-border px-2 flex gap-3 overflow-x-auto items-center h-6 flex-shrink-0">
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">BASE</span>
        <select
          value={base}
          onChange={e => setBase(e.target.value as FxBase)}
          className="bg-background border border-border text-accent font-mono font-bold text-[10px] px-1 py-0 focus:outline-none focus:border-accent uppercase tracking-wider"
        >
          {FX_BASES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      {fxTabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors flex-shrink-0
              ${isActive
                ? 'text-accent border-accent font-bold'
                : 'text-muted-foreground border-transparent hover:text-foreground'}`}
          >
            {tab.code}
          </button>
        );
      })}
    </nav>
  );
}

