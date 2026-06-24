import { Trade } from '@/types/trade';

const symbols = ['SPY', 'AAPL', 'TSLA', 'QQQ', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOGL', 'AMD', 'NFLX', 'JPM', 'BA', 'DIS', 'V'];
const futuresSymbols = ['ES', 'NQ', 'CL', 'GC', 'YM'];
const cfdSymbols = ['EURUSD', 'GBPUSD', 'US30', 'SPX500', 'XAUUSD'];
const strategies = ['Swing Trading', 'Day Trading', 'Options Trading', 'Scalping', 'Breakout', 'VWAP Reversal', 'Earnings Play', 'Momentum'];
const sectors: Record<string, string> = {
  SPY: 'Indices', QQQ: 'Indices', AAPL: 'Technology', TSLA: 'Consumer', NVDA: 'Technology',
  AMZN: 'Consumer', MSFT: 'Technology', META: 'Technology', GOOGL: 'Technology', AMD: 'Technology',
  NFLX: 'Consumer', JPM: 'Financials', BA: 'Industrials', DIS: 'Consumer', V: 'Financials',
  ES: 'Indices', NQ: 'Indices', CL: 'Commodities', GC: 'Commodities', YM: 'Indices',
  EURUSD: 'Forex', GBPUSD: 'Forex', US30: 'Indices', SPX500: 'Indices', XAUUSD: 'Commodities',
};
const contractSizes: Record<string, number> = { ES: 50, NQ: 20, CL: 1000, GC: 100, YM: 5 };
const setups: ('A+' | 'A' | 'B' | 'C')[] = ['A+', 'A', 'A', 'B', 'B', 'B', 'C'];
const mistakes = ['', '', '', '', '', '', '', '', 'FOMO Entry', 'Revenge Trading', 'Moved Stop Loss', 'Over-Sized Position', 'Early Exit', 'No Stop Loss', 'Chased Entry'];
const tagOptions = ['Swing', 'Day Trade', 'Breakout', 'Momentum', 'Reversal', 'Earnings', 'Scalp', 'Options', 'Tech', 'Hedge', 'MA Cross', 'Volatility', 'VWAP', 'Gap Fill', 'Stop Loss'];
const holdTimes = ['2m', '5m', '12m', '25m', '45m', '1h', '2h', '4h', '1d', '2d', '3d', '5d', '1w', '2w'];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateTrades(): Trade[] {
  const rng = seededRandom(42);
  const trades: Trade[] = [];
  let id = 1;

  // Generate trades from Oct 2025 to Mar 2026
  const startDate = new Date('2025-10-01T09:30:00');
  const endDate = new Date('2026-03-11T16:00:00');

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

    const numTrades = Math.floor(rng() * 5) + 1; // 1-5 trades per day
    for (let t = 0; t < numTrades; t++) {
      // Determine instrument type: ~50% Equity, ~25% Option, ~15% Futures, ~10% CFD
      const typeRoll = rng();
      let type: 'Equity' | 'Option' | 'Futures' | 'CFD';
      let symbol: string;
      let leverage: number | undefined;
      let contractSize: number | undefined;
      let contractMultiplier: number | undefined;
      let margin: number | undefined;
      let commission: number | undefined;
      let swap: number | undefined;
      let strikePrice: number | undefined;
      let expiry: string | undefined;
      let optionPremium: number | undefined;
      let iv: number | undefined;
      let delta: number | undefined;
      let theta: number | undefined;

      if (typeRoll < 0.50) {
        type = 'Equity';
        symbol = symbols[Math.floor(rng() * symbols.length)];
      } else if (typeRoll < 0.75) {
        type = 'Option';
        symbol = symbols[Math.floor(rng() * symbols.length)];
        contractMultiplier = 100;
      } else if (typeRoll < 0.90) {
        type = 'Futures';
        symbol = futuresSymbols[Math.floor(rng() * futuresSymbols.length)];
        contractSize = contractSizes[symbol] || 50;
        margin = Math.round((2000 + rng() * 12000) * 100) / 100;
        commission = Math.round((1.5 + rng() * 3) * 100) / 100;
      } else {
        type = 'CFD';
        symbol = cfdSymbols[Math.floor(rng() * cfdSymbols.length)];
        leverage = Math.floor(rng() * 4) * 25 + 25; // 25, 50, 75, 100
        swap = Math.round((rng() * 8 - 2) * 100) / 100;
        commission = Math.round((0.5 + rng() * 2) * 100) / 100;
      }

      const isLong = rng() > 0.35;
      let side: 'LONG' | 'SHORT' | 'CALL' | 'PUT';
      if (type === 'Option') side = isLong ? 'CALL' : 'PUT';
      else side = isLong ? 'LONG' : 'SHORT';

      const hour = 9 + Math.floor(rng() * 7);
      const minute = Math.floor(rng() * 60);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      let entry: number, size: number;
      if (type === 'Option') {
        entry = Math.round((1 + rng() * 8) * 100) / 100;
        size = Math.floor(rng() * 20) + 1;
        // Options-specific fields
        const basePrices: Record<string, number> = { SPY: 520, AAPL: 180, TSLA: 245, QQQ: 430, NVDA: 870, AMZN: 180, MSFT: 420, META: 510, GOOGL: 145, AMD: 165, NFLX: 680, JPM: 195, BA: 180, DIS: 110, V: 280 };
        strikePrice = Math.round((basePrices[symbol] || 200) * (0.95 + rng() * 0.1));
        const expiryDate = new Date(d);
        expiryDate.setDate(expiryDate.getDate() + Math.floor(rng() * 45) + 1);
        expiry = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;
        optionPremium = entry;
        iv = Math.round((15 + rng() * 60) * 10) / 10;
        delta = Math.round((0.1 + rng() * 0.8) * 100) / 100;
        theta = -Math.round((0.01 + rng() * 0.15) * 100) / 100;
      } else if (type === 'Futures') {
        const futuresPrices: Record<string, number> = { ES: 5200, NQ: 18500, CL: 78, GC: 2350, YM: 39000 };
        entry = Math.round((futuresPrices[symbol] || 5000) * (0.995 + rng() * 0.01) * 100) / 100;
        size = Math.floor(rng() * 5) + 1; // 1-5 contracts
      } else if (type === 'CFD') {
        const cfdPrices: Record<string, number> = { EURUSD: 1.085, GBPUSD: 1.265, US30: 39200, SPX500: 5180, XAUUSD: 2340 };
        entry = Math.round((cfdPrices[symbol] || 100) * (0.998 + rng() * 0.004) * 100000) / 100000;
        size = symbol.includes('USD') && !symbol.startsWith('XAU') && !symbol.startsWith('US') && !symbol.startsWith('SPX')
          ? Math.floor(rng() * 5 + 1) * 10000 // forex lots
          : Math.floor(rng() * 10) + 1;
      } else {
        const basePrices: Record<string, number> = { SPY: 520, AAPL: 180, TSLA: 245, QQQ: 430, NVDA: 870, AMZN: 180, MSFT: 420, META: 510, GOOGL: 145, AMD: 165, NFLX: 680, JPM: 195, BA: 180, DIS: 110, V: 280 };
        entry = Math.round((basePrices[symbol] || 200) * (0.97 + rng() * 0.06) * 100) / 100;
        size = Math.floor(rng() * 200) + 10;
      }

      // Win bias ~62%
      const isWin = rng() < 0.62;
      const strategy = strategies[Math.floor(rng() * strategies.length)];
      const setup = setups[Math.floor(rng() * setups.length)];
      const mistake = mistakes[Math.floor(rng() * mistakes.length)];

      let pnl: number;
      if (isWin) {
        if (type === 'Option') {
          const exitPrice = entry * (1.1 + rng() * 0.9);
          pnl = Math.round((exitPrice - entry) * size * (contractMultiplier || 100) * 100) / 100;
        } else if (type === 'Futures') {
          const tickMove = (2 + rng() * 20) * (contractSize! >= 100 ? 0.1 : 1);
          pnl = Math.round(tickMove * size * (contractSize || 50) * 100) / 100;
        } else if (type === 'CFD') {
          const movePercent = 0.001 + rng() * 0.008;
          pnl = Math.round(entry * movePercent * size * (leverage || 1) * 100) / 100;
        } else {
          const move = entry * (0.002 + rng() * 0.025);
          pnl = Math.round(move * size * 100) / 100;
        }
      } else {
        if (type === 'Option') {
          const exitPrice = entry * (0.3 + rng() * 0.6);
          pnl = Math.round((exitPrice - entry) * size * (contractMultiplier || 100) * 100) / 100;
        } else if (type === 'Futures') {
          const tickMove = (1 + rng() * 12) * (contractSize! >= 100 ? 0.1 : 1);
          pnl = -Math.round(tickMove * size * (contractSize || 50) * 100) / 100;
        } else if (type === 'CFD') {
          const movePercent = 0.0005 + rng() * 0.005;
          pnl = -Math.round(entry * movePercent * size * (leverage || 1) * 100) / 100;
        } else {
          const move = entry * (0.001 + rng() * 0.015);
          pnl = -Math.round(move * size * 100) / 100;
        }
      }

      // If mistake, make it worse
      if (mistake && isWin) {
        pnl = Math.round(pnl * 0.3 * 100) / 100; // reduced win
      }

      const exitPrice = type === 'Option'
        ? Math.round((entry + pnl / (size * (contractMultiplier || 100))) * 100) / 100
        : type === 'Futures'
        ? Math.round((entry + (side === 'LONG' ? pnl / (size * (contractSize || 50)) : -pnl / (size * (contractSize || 50)))) * 100) / 100
        : Math.round((entry + (side === 'LONG' || side === 'CALL' ? pnl / (size * (leverage || 1)) : -pnl / (size * (leverage || 1)))) * 100000) / 100000;

      const riskAmt = Math.abs(pnl) / (isWin ? (1 + rng() * 2) : 1);
      const rrVal = Math.round((Math.abs(pnl) / (riskAmt || 1)) * 10) / 10;

      const numTags = 1 + Math.floor(rng() * 3);
      const tags: string[] = [];
      for (let j = 0; j < numTags; j++) {
        const tag = tagOptions[Math.floor(rng() * tagOptions.length)];
        if (!tags.includes(tag)) tags.push(tag);
      }

      const fees = Math.round((0.5 + rng() * 4) * 100) / 100;
      const holdTime = holdTimes[Math.floor(rng() * holdTimes.length)];
      const stopLoss = side === 'LONG' || side === 'CALL'
        ? Math.round((entry * (1 - 0.005 - rng() * 0.02)) * 100) / 100
        : Math.round((entry * (1 + 0.005 + rng() * 0.02)) * 100) / 100;
      const takeProfit = side === 'LONG' || side === 'CALL'
        ? Math.round((entry * (1 + 0.01 + rng() * 0.04)) * 100) / 100
        : Math.round((entry * (1 - 0.01 - rng() * 0.04)) * 100) / 100;

      trades.push({
        id: String(id++),
        date: dateStr,
        symbol,
        type,
        side,
        entry,
        exit: type === 'Equity' ? Math.round(exitPrice * 100) / 100 : exitPrice,
        size,
        pnl,
        rr: `${rrVal}:1`,
        tags,
        strategy,
        notes: '',
        setup,
        mistake: mistake || undefined,
        holdTime,
        fees,
        sector: sectors[symbol] || 'Other',
        // Instrument-specific
        leverage,
        contractSize,
        contractMultiplier,
        margin,
        commission,
        swap,
        strikePrice,
        expiry,
        optionPremium,
        iv,
        delta,
        theta,
        stopLoss,
        takeProfit,
        riskAmount: Math.round(riskAmt * 100) / 100,
      });
    }
  }

  return trades.sort((a, b) => b.date.localeCompare(a.date));
}

export const sampleTrades: Trade[] = generateTrades();
