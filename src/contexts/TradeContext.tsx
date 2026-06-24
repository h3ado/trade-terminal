import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Trade } from '@/types/trade';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface TradeContextType {
  trades: Trade[];
  allTrades: Trade[];
  loading: boolean;
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getTradesForAccount: (accountId: string) => Trade[];
  setAccountFilter: (accountId: string | null) => void;
}

const TradeContext = createContext<TradeContextType | null>(null);

// Map DB row -> Trade. Most extra fields live in the JSONB `extra` column.
function rowToTrade(r: any): Trade {
  const extra = r.extra || {};
  return {
    id: r.id,
    accountId: r.account_id,
    date: r.entry_date ? new Date(r.entry_date).toISOString().replace('T', ' ').slice(0, 19) : (extra.date || ''),
    symbol: r.symbol,
    type: (r.instrument_type as any) || 'Equity',
    side: r.side as any,
    entry: Number(r.entry_price) || 0,
    exit: Number(r.exit_price) || 0,
    size: Number(r.quantity) || 0,
    pnl: Number(r.pnl) || 0,
    rr: extra.rr || '',
    tags: r.tags || [],
    strategy: r.strategy || '',
    notes: r.notes || '',
    setup: (r.setup as any) || 'B',
    mistake: r.mistakes?.[0],
    holdTime: extra.holdTime || '',
    fees: Number(r.fees) || 0,
    sector: extra.sector || '',
    leverage: extra.leverage,
    contractSize: extra.contractSize,
    margin: extra.margin,
    commission: extra.commission,
    swap: extra.swap,
    strikePrice: extra.strikePrice,
    expiry: extra.expiry,
    optionPremium: extra.optionPremium,
    iv: extra.iv,
    delta: extra.delta,
    theta: extra.theta,
    contractMultiplier: extra.contractMultiplier,
    stopLoss: r.stop_loss != null ? Number(r.stop_loss) : undefined,
    takeProfit: r.take_profit != null ? Number(r.take_profit) : undefined,
    riskAmount: extra.riskAmount,
    riskPercent: extra.riskPercent,
    slippage: extra.slippage,
    executionSpeed: extra.executionSpeed,
    partialFills: extra.partialFills,
    maxDrawdown: extra.maxDrawdown,
    maxRunup: extra.maxRunup,
    emotionalState: extra.emotionalState,
    marketCondition: extra.marketCondition,
  };
}

function tradeToRow(t: Omit<Trade, 'id'> & { id?: string }) {
  const {
    id, accountId, date, symbol, type, side, entry, exit, size, pnl, rr, tags,
    strategy, notes, setup, mistake, holdTime, fees, sector,
    stopLoss, takeProfit, ...rest
  } = t;
  return {
    account_id: accountId,
    symbol,
    side,
    instrument_type: type,
    quantity: size,
    entry_price: entry,
    exit_price: exit,
    entry_date: date ? new Date(date.replace(' ', 'T')).toISOString() : null,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    fees,
    pnl,
    strategy,
    setup,
    notes,
    tags,
    mistakes: mistake ? [mistake] : [],
    extra: { rr, holdTime, sector, ...rest },
  };
}

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  // Load from cloud
  useEffect(() => {
    if (!user) { setAllTrades([]); setLoading(false); return; }
    setLoading(true);
    apiGet('/api/trades')
      .then((data: any) => {
        setAllTrades((data as any[]).map(rowToTrade));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
    if (!user) return;
    const row = tradeToRow(trade);
    const data = await apiPost('/api/trades', row);
    setAllTrades(prev => [rowToTrade(data), ...prev]);
  }, [user]);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    if (!user) return;
    const current = allTrades.find(t => t.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    const row = tradeToRow(merged);
    const data = await apiPatch('/api/trades/' + id, row);
    setAllTrades(prev => prev.map(t => t.id === id ? rowToTrade(data) : t));
  }, [allTrades, user]);

  const deleteTrade = useCallback(async (id: string) => {
    if (!user) return;
    await apiDelete('/api/trades/' + id);
    setAllTrades(prev => prev.filter(t => t.id !== id));
  }, [user]);

  const getTradesForAccount = useCallback((accountId: string) => {
    return allTrades.filter(t => t.accountId === accountId);
  }, [allTrades]);

  const trades = useMemo(() => {
    if (!accountFilter) return allTrades;
    return allTrades.filter(t => t.accountId === accountFilter);
  }, [allTrades, accountFilter]);

  return (
    <TradeContext.Provider value={{ trades, allTrades, loading, addTrade, updateTrade, deleteTrade, getTradesForAccount, setAccountFilter }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrades must be used within TradeProvider');
  return ctx;
}

export function useAccountTrades() {
  return useTrades();
}
