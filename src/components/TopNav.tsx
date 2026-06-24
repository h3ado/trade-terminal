import { ViewType, calcTotalPnl } from '@/types/trade';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTrades } from '@/contexts/TradeContext';
import { ChevronDown, X, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type MacroTab = 'overview' | 'markets' | 'yields' | 'fx' | 'commodities' | 'central' | 'calendar' | 'sectors' | 'fedwatch' | 'volatility' | 'credit' | 'pmi' | 'labor' | 'housing' | 'money' | 'gdp' | 'inflation' | 'tradeflow' | 'sovereign' | 'globalrates' | 'supplychain' | 'sentiment' | 'fiscal' | 'debt' | 'crypto' | 'realrates' | 'bop' | 'energy' | 'mfg' | 'consumer' | 'fci' | 'wei' | 'weif' | 'wpe';

const tradingNavItems: { view: ViewType; label: string; code: string }[] = [
  { view: 'dashboard', label: 'Dashboard', code: 'DASH' },
  { view: 'trades', label: 'All Trades', code: 'TRD' },
  { view: 'analytics', label: 'Analytics', code: 'ANLT' },
  { view: 'calendar', label: 'Calendar', code: 'CAL' },
  { view: 'performance', label: 'Performance', code: 'PERF' },
  { view: 'journal', label: 'Journal', code: 'JRNL' },
  { view: 'playbooks', label: 'Playbooks', code: 'PLAY' },
  { view: 'mistakes', label: 'Mistakes', code: 'MSTK' },
  { view: 'goals', label: 'Goals', code: 'GOAL' },
];

export const macroTabs: { id: MacroTab; label: string; code: string }[] = [
  { id: 'overview', label: 'Econ Data', code: 'ECST' },
  { id: 'markets', label: 'World Mkts', code: 'WMKT' },
  { id: 'wei', label: 'Global Equities', code: 'WEI' },
  { id: 'weif', label: 'Index Futures', code: 'WEIF' },
  { id: 'wpe', label: 'P/E & Valuation', code: 'WPE' },
  { id: 'yields', label: 'Yield Curve', code: 'YCRV' },
  { id: 'fx', label: 'FX', code: 'FXCR' },
  { id: 'commodities', label: 'Commod.', code: 'CMDM' },
  { id: 'crypto', label: 'Crypto', code: 'CRYP' },
  { id: 'central', label: 'Central Banks', code: 'CBRT' },
  { id: 'fedwatch', label: 'Rate Watch', code: 'WIRP' },
  { id: 'calendar', label: 'Econ Cal', code: 'ECO' },
  { id: 'sectors', label: 'Sectors', code: 'SECT' },
  { id: 'volatility', label: 'Volatility', code: 'VOLM' },
  { id: 'credit', label: 'Credit', code: 'CRDM' },
  { id: 'pmi', label: 'Global PMI', code: 'GPMI' },
  { id: 'labor', label: 'Labor', code: 'LABR' },
  { id: 'housing', label: 'Housing', code: 'HOUS' },
  { id: 'money', label: 'Money Mkts', code: 'MMKT' },
  { id: 'gdp', label: 'Global GDP', code: 'WGDP' },
  { id: 'inflation', label: 'Inflation', code: 'INFL' },
  { id: 'tradeflow', label: 'Trade Flow', code: 'TRFL' },
  { id: 'sovereign', label: 'Sov Risk', code: 'SOVR' },
  { id: 'globalrates', label: 'Global Rates', code: 'RATD' },
  { id: 'supplychain', label: 'Supply Chain', code: 'SPLC' },
  { id: 'sentiment', label: 'Sentiment', code: 'SENT' },
  { id: 'fiscal', label: 'Fiscal', code: 'FISC' },
  { id: 'debt', label: 'Debt/Issuance', code: 'DDIS' },
  { id: 'realrates', label: 'Real Rates', code: 'REAL' },
  { id: 'bop', label: 'Balance of Pay', code: 'BOP' },
  { id: 'energy', label: 'Energy Bal', code: 'NRGY' },
  { id: 'mfg', label: 'Mfg & Orders', code: 'MFG' },
  { id: 'consumer', label: 'Consumer', code: 'CONS' },
  { id: 'fci', label: 'Fin Conditions', code: 'FCI' },
];

interface Props {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  activeMacroTab: MacroTab;
  onMacroTabChange: (tab: MacroTab) => void;
}

function AccountBadge() {
  const { trades, getTradesForAccount } = useTrades();
  const { privacyMode, accounts, activeAccount, activeAccountId, setActiveAccount, addAccount, removeAccount, updateAccount, formatMoneyOrPct, getAccountLiveBalance } = usePrivacy();
  const totalPnl = calcTotalPnl(trades);
  const [showPanel, setShowPanel] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
        setAddingAccount(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddAccount = () => {
    if (!newName.trim()) return;
    addAccount(newName.trim(), parseFloat(newBalance) || 0);
    setNewName('');
    setNewBalance('');
    setAddingAccount(false);
  };

  const handleEditSave = (id: string) => {
    updateAccount(id, { name: editName, balance: parseFloat(editBalance) || 0 });
    setEditingId(null);
  };

  return (
    <div className="relative ml-auto flex-shrink-0" ref={panelRef}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity px-3 py-2"
      >
        <div className="w-2 h-2 rounded-full bg-positive animate-pulse-dot" />
        <span className="text-[10px] font-mono text-muted-foreground">{activeAccount.name}</span>
        <span className={`font-mono font-bold text-sm ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
          {privacyMode
            ? formatMoneyOrPct(totalPnl, activeAccount.balance, { showSign: true })
            : `$${getAccountLiveBalance(activeAccountId, totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-0.5 w-72 bg-card border border-border shadow-lg z-[60]">
          <div className="px-3 py-2 border-b border-accent/30 flex justify-between items-center bg-surface-elevated">
            <span className="text-[10px] font-mono text-accent uppercase font-bold">Accounts</span>
            <button onClick={() => setShowPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {accounts.map(acc => (
              <div key={acc.id} className={`px-3 py-2 border-b border-grid-line last:border-0 ${acc.id === activeAccountId ? 'bg-accent/5 border-l-2 border-l-accent' : ''}`}>
                {editingId === acc.id ? (
                  <div className="flex flex-col gap-1.5">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent" />
                    <div className="flex gap-1.5">
                      <input value={editBalance} onChange={e => setEditBalance(e.target.value)} type="number" placeholder="Balance"
                        className="flex-1 px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent" />
                      <button onClick={() => handleEditSave(acc.id)} className="px-2 py-1 bg-accent text-accent-foreground text-[10px] font-mono">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 border border-border text-muted-foreground text-[10px] font-mono">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button onClick={() => setActiveAccount(acc.id)} className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${acc.id === activeAccountId ? 'bg-positive' : 'bg-muted-foreground/30'}`} />
                        <span className="text-[11px] font-mono font-bold text-foreground">{acc.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground ml-3">
                        {(() => {
                          const accTrades = getTradesForAccount(acc.id);
                          const accPnl = calcTotalPnl(accTrades);
                          const liveBalance = getAccountLiveBalance(acc.id, accPnl);
                          return (
                            <div className="flex items-center gap-2">
                              <span>{privacyMode ? '•••••' : `$${liveBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                              {accTrades.length > 0 && !privacyMode && (
                                <span className={`text-[9px] ${accPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                                  ({accPnl >= 0 ? '+' : ''}${accPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </span>
                              )}
                              <span className="text-[8px] text-muted-foreground/60">{accTrades.length} trades</span>
                            </div>
                          );
                        })()}
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(acc.id); setEditName(acc.name); setEditBalance(String(acc.balance)); }}
                        className="p-1 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3 h-3" />
                      </button>
                      {accounts.length > 1 && (
                        <button onClick={() => removeAccount(acc.id)}
                          className="p-1 text-muted-foreground hover:text-negative">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {addingAccount ? (
            <div className="px-3 py-2 border-t border-border">
              <div className="flex flex-col gap-1.5">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Account name"
                  className="px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" autoFocus />
                <div className="flex gap-1.5">
                  <input value={newBalance} onChange={e => setNewBalance(e.target.value)} type="number" placeholder="Balance"
                    className="flex-1 px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
                  <button onClick={handleAddAccount} className="px-2 py-1 bg-accent text-accent-foreground text-[10px] font-mono font-bold">Add</button>
                  <button onClick={() => setAddingAccount(false)} className="px-2 py-1 border border-border text-muted-foreground text-[10px] font-mono">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingAccount(true)}
              className="w-full px-3 py-2 text-[10px] font-mono text-accent hover:bg-accent/5 border-t border-border flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ activeView, onViewChange, activeMacroTab, onMacroTabChange }: Props) {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const isMacro = activeView === 'macro';
  const isOptions = activeView === 'options';

  if (isOptions) return null;

  if (isMacro) {
    return (
      <nav className="bg-surface-deep border-b border-border px-2 py-0.5 flex gap-0.5 overflow-x-auto items-center">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-muted-foreground flex-shrink-0">
          <span className="text-sm">{countryInfo.flag}</span>
          <span className="font-mono font-bold text-accent">{selectedCountry}</span>
        </div>
        <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
        {macroTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onMacroTabChange(tab.id)}
            className={`relative px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition-colors duration-150 flex-shrink-0
              after:content-[''] after:absolute after:left-1 after:right-1 after:bottom-0 after:h-px after:bg-accent after:origin-center after:transition-transform after:duration-200
              ${activeMacroTab === tab.id
                ? 'bg-accent text-accent-foreground font-bold after:scale-x-0'
                : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground after:scale-x-0 hover:after:scale-x-100'
              }`}
          >
            <span className="text-[8px] opacity-60">{tab.code}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="bg-background border-b border-border px-2 flex gap-3 overflow-x-auto items-center h-6 flex-shrink-0">
      {tradingNavItems.map((item) => {
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            title={item.label}
            className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors flex-shrink-0
              ${isActive
                ? 'text-accent border-accent font-bold'
                : 'text-muted-foreground border-transparent hover:text-foreground'}`}
          >
            {item.code}
          </button>
        );
      })}
    </nav>
  );
}
