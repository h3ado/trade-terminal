export interface Trade {
  id: string;
  accountId?: string;
  date: string;
  symbol: string;
  type: 'Equity' | 'Option' | 'Futures' | 'CFD';
  side: 'LONG' | 'SHORT' | 'CALL' | 'PUT';
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  rr: string;
  tags: string[];
  strategy: string;
  notes: string;
  setup: 'A+' | 'A' | 'B' | 'C';
  mistake?: string;
  holdTime: string;
  fees: number;
  sector: string;

  // Instrument-specific fields
  leverage?: number;           // CFD / Futures leverage multiplier
  contractSize?: number;       // Futures contract size (e.g., 50 for ES, 20 for NQ)
  margin?: number;             // Required margin for position
  commission?: number;         // Per-contract or per-share commission
  swap?: number;               // Overnight swap/funding cost (CFD)
  
  // Options-specific
  strikePrice?: number;
  expiry?: string;             // Expiration date
  optionPremium?: number;      // Premium paid/received per contract
  iv?: number;                 // Implied volatility at entry
  delta?: number;              // Greeks at entry
  theta?: number;
  contractMultiplier?: number; // Default 100 for equity options

  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number;         // Dollar amount risked
  riskPercent?: number;        // % of account risked

  // Execution details
  slippage?: number;           // Entry slippage in price
  executionSpeed?: string;     // e.g. "instant", "1s", "5s"
  partialFills?: number;       // Number of fills
  
  // Outcome analysis
  maxDrawdown?: number;        // Max adverse excursion
  maxRunup?: number;           // Max favorable excursion
  emotionalState?: string;     // e.g. "calm", "anxious", "confident"
  marketCondition?: string;    // e.g. "trending", "ranging", "volatile"
}

export type ViewType = 'dashboard' | 'trades' | 'analytics' | 'calendar' | 'performance' | 'journal' | 'playbooks' | 'mistakes' | 'goals' | 'macro' | 'cot' | 'globe' | 'news' | 'options' | 'forex' | 'crypto' | 'quiz' | 'launchpad' | 'security' | 'over' | 'mwei' | 'mwb' | 'mglco' | 'mtop' | 'meco' | 'mecst' | 'mecfc' | 'mecwb' | 'mstat' | 'mectr' | 'mcoun' | 'moecd' | 'meiu' | 'mfed' | 'mfomc' | 'mffip' | 'mcenb' | 'msrsk' | 'mwlst' | 'mint' | 'mnetliq' | 'msqzz' | 'mrotn' | 'attr' | 'posiz' | 'mcpi' | 'mppi' | 'munemp' | 'mnfp' | 'mgdp' | 'mpce' | 'mjolts' | 'mism';

// Consolidated Bloomberg-style module ids for the Options workspace.
export type OptionsTab =
  | 'dash'   // Dashboard
  | 'omon'   // Options Matrix / Chain / Spread Builder
  | 'gamma'  // Gamma Levels
  | 'gex'    // GEX Profile / Intraday / OI / Charm-Vanna
  | 'dpi'    // Dealer Positioning Intelligence
  | 'ovme'   // Vol Surface / Term / Smile / Skew Delta
  | 'maxp'   // Max Pain
  | 'pay'    // Payoff Lab
  | 'flow'   // Dealer Flow
  | 'sent'   // Sentiment
  | 'grk'    // Greeks Book
  | 'qscr'   // Q-Scores
  | 'scan'   // Screener
  | 'uoa'    // Unusual Options Activity
  | 'earn'   // Earnings & Event Playbook
  | 'varb';  // Volatility Arbitrage Lab

export type OptionsSubTab = string;

// ── P&L Calculation Helpers ──
export function calcPnlForTrade(t: {
  side: string; entry: number; exit: number; size: number;
  type: string; leverage?: number; contractSize?: number; contractMultiplier?: number;
}): number {
  const direction = (t.side === 'LONG' || t.side === 'CALL') ? 1 : -1;
  const diff = (t.exit - t.entry) * direction;
  
  let multiplier = 1;
  if (t.type === 'Option') {
    multiplier = t.contractMultiplier || 100;
  } else if (t.type === 'Futures') {
    multiplier = t.contractSize || 1;
  } else if (t.type === 'CFD') {
    multiplier = t.leverage || 1;
  }
  
  return Math.round(diff * t.size * multiplier * 100) / 100;
}

// Computed helpers
export function calcWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  return (trades.filter(t => t.pnl > 0).length / trades.length) * 100;
}

export function calcTotalPnl(trades: Trade[]): number {
  return trades.reduce((s, t) => s + t.pnl, 0);
}

export function calcAvgWin(trades: Trade[]): number {
  const wins = trades.filter(t => t.pnl > 0);
  return wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
}

export function calcAvgLoss(trades: Trade[]): number {
  const losses = trades.filter(t => t.pnl < 0);
  return losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
}

export function calcProfitFactor(trades: Trade[]): number {
  const grossWin = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  return grossLoss === 0 ? grossWin > 0 ? Infinity : 0 : grossWin / grossLoss;
}

export function calcExpectancy(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wr = calcWinRate(trades) / 100;
  const avgW = calcAvgWin(trades);
  const avgL = Math.abs(calcAvgLoss(trades));
  return wr * avgW - (1 - wr) * avgL;
}

export function calcMaxDrawdown(trades: Trade[]): number {
  let peak = 0, maxDD = 0, cumPnl = 0;
  for (const t of trades) {
    cumPnl += t.pnl;
    if (cumPnl > peak) peak = cumPnl;
    const dd = peak - cumPnl;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

// Percentage-based drawdown from a starting balance
export function calcMaxDrawdownPct(trades: Trade[], startBalance = 100000): number {
  let running = startBalance;
  let peak = startBalance;
  let maxDD = 0;
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const byDate: Record<string, number> = {};
  sorted.forEach(t => {
    const d = t.date.split(' ')[0];
    byDate[d] = (byDate[d] || 0) + t.pnl;
  });
  Object.values(byDate).forEach(pnl => {
    running += pnl;
    if (running > peak) peak = running;
    const dd = ((running - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
  });
  return maxDD;
}

// Consistent total fees calculation (fees + commission + swap)
export function calcTotalFees(trades: Trade[]): number {
  return trades.reduce((s, t) => s + (t.fees || 0) + (t.commission || 0) + (t.swap || 0), 0);
}

export function calcSharpeRatio(trades: Trade[]): number {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => t.pnl);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  return std === 0 ? 0 : mean / std;
}

export function calcAvgRR(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const rrs = trades.map(t => parseFloat(t.rr) || 0);
  return rrs.reduce((s, r) => s + r, 0) / rrs.length;
}

export function groupBySymbol(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  trades.forEach(t => { (map[t.symbol] ??= []).push(t); });
  return Object.entries(map).map(([symbol, ts]) => ({
    symbol,
    trades: ts.length,
    winRate: calcWinRate(ts),
    totalPnl: calcTotalPnl(ts),
    avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
    bestTrade: Math.max(...ts.map(t => t.pnl)),
    worstTrade: Math.min(...ts.map(t => t.pnl)),
  })).sort((a, b) => b.totalPnl - a.totalPnl);
}

export function groupByStrategy(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  trades.forEach(t => { (map[t.strategy] ??= []).push(t); });
  return Object.entries(map).map(([strategy, ts]) => ({
    strategy,
    trades: ts.length,
    winRate: calcWinRate(ts),
    totalPnl: calcTotalPnl(ts),
    avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
  })).sort((a, b) => b.totalPnl - a.totalPnl);
}

export function groupBySector(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  trades.forEach(t => { (map[t.sector] ??= []).push(t); });
  return Object.entries(map).map(([sector, ts]) => ({
    sector,
    trades: ts.length,
    pct: 0,
    totalPnl: calcTotalPnl(ts),
  })).sort((a, b) => b.trades - a.trades).map((s, _, arr) => ({
    ...s,
    pct: Math.round((s.trades / trades.length) * 100),
  }));
}

export function groupByDay(trades: Trade[]) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const map: Record<string, Trade[]> = {};
  trades.forEach(t => {
    const d = new Date(t.date.replace(' ', 'T'));
    const name = dayNames[d.getDay()];
    (map[name] ??= []).push(t);
  });
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
    const ts = map[day] || [];
    return {
      day,
      wins: ts.filter(t => t.pnl > 0).length,
      losses: ts.filter(t => t.pnl < 0).length,
      winRate: calcWinRate(ts),
    };
  });
}

export function getDatePnl(trades: Trade[]) {
  const map: Record<string, number> = {};
  trades.forEach(t => {
    const d = t.date.split(' ')[0];
    map[d] = (map[d] || 0) + t.pnl;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => ({ date, pnl }));
}

export function groupByType(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  trades.forEach(t => { (map[t.type] ??= []).push(t); });
  return Object.entries(map).map(([type, ts]) => ({
    type,
    trades: ts.length,
    winRate: calcWinRate(ts),
    totalPnl: calcTotalPnl(ts),
    avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
    profitFactor: calcProfitFactor(ts),
    avgLeverage: ts.filter(t => t.leverage).length > 0
      ? ts.filter(t => t.leverage).reduce((s, t) => s + (t.leverage || 0), 0) / ts.filter(t => t.leverage).length
      : undefined,
    totalFees: ts.reduce((s, t) => s + t.fees + (t.commission || 0) + (t.swap || 0), 0),
  })).sort((a, b) => b.trades - a.trades);
}
