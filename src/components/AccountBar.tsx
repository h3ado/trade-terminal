import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTrades } from '@/contexts/TradeContext';
import { calcTotalPnl } from '@/types/trade';
import { Eye, EyeOff, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function AccountBar() {
  const { privacyMode, togglePrivacy, accounts, activeAccountId, activeAccount, setActiveAccount, addAccount, removeAccount, formatMoney } = usePrivacy();
  const { getTradesForAccount } = useTrades();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBal, setNewBal] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const activePnl = useMemo(() => calcTotalPnl(getTradesForAccount(activeAccountId)), [activeAccountId, getTradesForAccount]);
  const liveBalance = activeAccount.balance + activePnl;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setAdding(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = () => {
    if (newName.trim() && Number(newBal) > 0) {
      addAccount(newName.trim(), Number(newBal));
      setNewName(''); setNewBal(''); setAdding(false);
    }
  };

  const getAccountBalance = (accountId: string, startingBalance: number) => {
    const pnl = calcTotalPnl(getTradesForAccount(accountId));
    return startingBalance + pnl;
  };

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <button onClick={togglePrivacy} className="p-1 text-muted-foreground hover:text-accent transition-colors" title={privacyMode ? 'Show values' : 'Hide values'}>
        {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated border border-border text-[10px] font-mono font-bold hover:border-accent transition-colors">
          <span className="text-accent">{activeAccount.name}</span>
          <span className={`${liveBalance >= activeAccount.balance ? 'text-positive' : 'text-negative'}`}>
            {formatMoney(liveBalance)}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-0.5 w-64 bg-card border border-accent/30 shadow-lg z-50">
            <div className="px-3 py-1.5 bg-surface-elevated border-b border-accent/20">
              <span className="text-[9px] font-mono text-accent uppercase font-bold">Accounts</span>
            </div>
            {accounts.map(a => {
              const bal = getAccountBalance(a.id, a.balance);
              const pnl = bal - a.balance;
              return (
                <div key={a.id} className={`flex items-center justify-between px-3 py-2 text-[10px] font-mono cursor-pointer hover:bg-surface-elevated border-b border-grid-line last:border-0 ${a.id === activeAccountId ? 'bg-accent/5 border-l-2 border-l-accent' : ''}`}>
                  <div onClick={() => { setActiveAccount(a.id); setOpen(false); }} className="flex-1">
                    <div className="font-bold">{a.name}</div>
                    <div className="flex gap-2 text-[9px]">
                      <span className="text-muted-foreground">Bal: {formatMoney(bal)}</span>
                      <span className={pnl >= 0 ? 'text-positive' : 'text-negative'}>
                        {pnl >= 0 ? '+' : ''}{formatMoney(pnl)}
                      </span>
                    </div>
                  </div>
                  {accounts.length > 1 && (
                    <button onClick={() => removeAccount(a.id)} className="text-muted-foreground hover:text-negative ml-2"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              );
            })}
            <div className="border-t border-border">
              {!adding ? (
                <button onClick={() => setAdding(true)} className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono text-accent hover:bg-accent/5">
                  <Plus className="w-3 h-3" /> Add Account
                </button>
              ) : (
                <div className="p-2 space-y-1">
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="w-full bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono focus:border-accent focus:outline-none" />
                  <input value={newBal} onChange={e => setNewBal(e.target.value)} placeholder="Balance" type="number" className="w-full bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono focus:border-accent focus:outline-none" />
                  <button onClick={handleAdd} className="w-full bg-accent text-accent-foreground text-[10px] font-mono font-bold py-1">Add</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}