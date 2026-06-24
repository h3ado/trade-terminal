import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  accounts: Account[];
  activeAccountId: string;
  activeAccount: Account;
  loading: boolean;
  addAccount: (name: string, balance: number) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => Promise<void>;
  setActiveAccount: (id: string) => void;
  formatMoney: (value: number, opts?: { showSign?: boolean }) => string;
  formatMoneyOrPct: (value: number, base: number, opts?: { showSign?: boolean }) => string;
  getAccountLiveBalance: (accountId: string, tradePnl: number) => number;
}

const PRIVACY_KEY = 'privacy-mode';
const ACTIVE_KEY = 'active-account-id';

const PrivacyContext = createContext<PrivacyContextType | null>(null);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem(PRIVACY_KEY) === 'true');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load accounts from cloud; create a default account if user has none
  useEffect(() => {
    if (!user) { setAccounts([]); setActiveAccountId(''); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        let data: any[] = await apiGet('/api/trading-accounts');
        let accs = data.map(r => ({ id: r.id, name: r.name, balance: Number(r.balance) }));

        if (accs.length === 0) {
          const created = await apiPost('/api/trading-accounts', { name: 'Main Account', balance: 25000 });
          accs = [{ id: created.id, name: created.name, balance: Number(created.balance) }];
        }

        setAccounts(accs);
        const saved = localStorage.getItem(ACTIVE_KEY);
        const initial = saved && accs.some(a => a.id === saved) ? saved : accs[0]?.id || '';
        setActiveAccountId(initial);
      } catch {
        // ignore load errors
      }
      setLoading(false);
    })();
  }, [user]);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode(p => {
      localStorage.setItem(PRIVACY_KEY, String(!p));
      return !p;
    });
  }, []);

  const addAccount = useCallback(async (name: string, balance: number) => {
    if (!user) return;
    const data = await apiPost('/api/trading-accounts', { name, balance });
    setAccounts(prev => [...prev, { id: data.id, name: data.name, balance: Number(data.balance) }]);
  }, [user]);

  const removeAccount = useCallback(async (id: string) => {
    if (accounts.length <= 1) return;
    await apiDelete('/api/trading-accounts/' + id);
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next);
    if (activeAccountId === id) {
      setActiveAccountId(next[0].id);
      localStorage.setItem(ACTIVE_KEY, next[0].id);
    }
  }, [accounts, activeAccountId]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Omit<Account, 'id'>>) => {
    await apiPatch('/api/trading-accounts/' + id, updates);
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const setActiveAccount = useCallback((id: string) => {
    setActiveAccountId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || { id: '', name: '—', balance: 0 };

  const getAccountLiveBalance = useCallback((accountId: string, tradePnl: number) => {
    const acc = accounts.find(a => a.id === accountId);
    return (acc?.balance || 0) + tradePnl;
  }, [accounts]);

  const formatMoney = useCallback((value: number, opts?: { showSign?: boolean }) => {
    if (privacyMode) return '•••••';
    const sign = opts?.showSign && value >= 0 ? '+' : '';
    return `${sign}$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [privacyMode]);

  const formatMoneyOrPct = useCallback((value: number, base: number, opts?: { showSign?: boolean }) => {
    if (privacyMode) {
      const pct = base !== 0 ? (value / base) * 100 : 0;
      const sign = opts?.showSign && pct >= 0 ? '+' : '';
      return `${sign}${pct.toFixed(2)}%`;
    }
    const sign = opts?.showSign && value >= 0 ? '+' : '';
    return `${sign}$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [privacyMode]);

  return (
    <PrivacyContext.Provider value={{
      privacyMode, togglePrivacy,
      accounts, activeAccountId, activeAccount, loading,
      addAccount, removeAccount, updateAccount, setActiveAccount,
      formatMoney, formatMoneyOrPct, getAccountLiveBalance,
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
  return ctx;
}
