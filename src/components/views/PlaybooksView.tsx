import { useMemo, useState, useEffect } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { calcWinRate, calcTotalPnl } from '@/types/trade';
import { RotateCcw, Plus, X, Trash2 } from 'lucide-react';

type GuideData = { summary: string; entry: string; exit: string; risk: string; bestFor: string; tips: string[] };

const builtInGuides: Record<string, GuideData> = {
  'Day Trading': {
    summary: 'Intraday positions opened and closed within the same session using short-term price action, volume, and momentum.',
    entry: 'Stocks gapping on volume, breaking VWAP or prior day levels. Enter on pullbacks to MAs or breakouts with volume confirmation.',
    exit: 'Target 2:1–3:1 R:R. Trail with 9 EMA or VWAP. Close all before market close.',
    risk: 'Risk 0.5–1% per trade. Hard stops only. Daily loss limit 2–3%.',
    bestFor: 'Liquid stocks with >$1 ATR. First 90 min and last 30 min of session.',
    tips: ['Focus on first 2 hours', 'Avoid 11:30–2:00 chop', 'VWAP is your anchor', 'Size down on low-volume days'],
  },
  'Swing Trading': {
    summary: 'Multi-day to multi-week positions capturing medium-term swings using daily charts for trends and 4H/1H for entries.',
    entry: 'Pullbacks to the 20/50 EMA in trending stocks. Engulfing candles, hammers, or breakouts from consolidation ranges.',
    exit: 'Target next major S/R or 2–3× risk. Trail below swing lows (longs) or above swing highs (shorts).',
    risk: 'Risk 1–2% per trade. Wider ATR-based stops for intraday noise.',
    bestFor: 'Clear trending stocks. Sector rotation and earnings follow-through plays.',
    tips: ['Scan for pullbacks on declining volume above 20 EMA', 'Weekly charts confirm the bigger picture', 'Avoid holding through earnings', 'Best entries Tues–Wed'],
  },
  'Scalping': {
    summary: 'Ultra-short trades lasting seconds to minutes, capturing small moves repeatedly with fast execution and tight spreads.',
    entry: 'Level 2 tape reading. Enter on micro-pullbacks within strong moves or bid/ask flips. 1-min and tick charts.',
    exit: 'Take 5–15 cents quickly. Use hotkeys. Never let a scalp become a day trade.',
    risk: 'Risk 0.1–0.25% per trade. Edge comes from 65%+ win rate and consistency.',
    bestFor: 'Liquid large-caps (SPY, AAPL, TSLA) with tight spreads. Open and power hour.',
    tips: ['Use hotkeys exclusively', 'Max 2–3 tickers per session', 'Ensure edge exceeds commissions', 'Take breaks every hour'],
  },
  'Options Trading': {
    summary: 'Leveraging options for directional moves, hedging, or income via premium selling. Requires Greeks and IV understanding.',
    entry: 'Directional: 30–60 DTE, 0.5–0.7 delta. Credit spreads: 0.20–0.30 delta, 30–45 DTE.',
    exit: 'Take 50–75% max gain on spreads. Directional: 2:1 target, cut at 50% loss.',
    risk: 'Max 2–5% per trade. Avoid OTM weeklies. Small sizes due to leverage.',
    bestFor: 'High IV for selling premium. Earnings, catalysts, verticals, iron condors.',
    tips: ['Check IV percentile before entering', 'Sell high IV, buy low IV', 'Spreads > naked options', 'Track theta decay'],
  },
  'Breakout': {
    summary: 'Trading the initial move when price breaks S/R with volume, capturing new trends or continuation moves.',
    entry: 'Identify flags, triangles, ranges on daily/4H. Enter on boundary break with >1.5× avg volume. Confirm with retest.',
    exit: 'Project pattern height from breakout point. Trail using breakout level.',
    risk: 'Risk 1%. Stops inside the consolidation. Wait for confirmation close to avoid fakeouts.',
    bestFor: 'Post-move consolidations, IPO bases, sector leaders at new highs. Trending markets.',
    tips: ['Volume is #1 confirmation', 'Tighter consolidation = stronger breakout', 'Wait for cash session', 'First 15-min range breakouts are high-probability'],
  },
  'VWAP Reversal': {
    summary: 'Mean reversion off VWAP — institutional anchor level where price tends to revert after overextension.',
    entry: 'Price extends >1 ATR from VWAP, shows reversal signals (hammer, exhaustion). Best on first/second touch.',
    exit: 'Target VWAP, then VWAP + extension. Stop below reversal candle low.',
    risk: 'Risk 0.5–1%. Counter-trend so keep size moderate. Only in range-bound conditions.',
    bestFor: 'Gap fades. Range-bound days. Large-caps with institutional participation.',
    tips: ['First VWAP touch = highest probability', 'Don\'t fight strong trends', 'Use Level 2 at VWAP', 'VWAP fades in last hour'],
  },
  'Earnings Play': {
    summary: 'Trading around quarterly reports — directional bets or volatility plays via premium selling into high IV.',
    entry: 'Analyze whisper numbers, options flow, sector trends. Enter 1–3 days before with defined-risk options.',
    exit: 'Close pre-report if targeting IV expansion. Post-earnings: target expected move range.',
    risk: 'Max 1–2%. Use options to define risk. Avoid naked positions. Gaps can be massive.',
    bestFor: 'High-IV stocks with history of large moves. Sector leaders reporting first.',
    tips: ['Compare expected move vs historical actual moves', 'Sell premium if expecting small moves', 'Post-earnings drift is real', 'Hedge stock positions before reports'],
  },
  'Momentum': {
    summary: 'Riding strong directional moves in stocks with unusual volume, catalysts, or relative strength.',
    entry: 'Scan for >3% moves on >2× volume. Enter first pullback using 9/21 EMA support. Confirm vs SPY.',
    exit: 'Trail with 9 EMA or 3%. Partial at 2:1, let rest ride. Exit on volume dry-up.',
    risk: 'Risk 1%. Hard stops always. Don\'t chase — wait for pullbacks.',
    bestFor: 'Small-to-mid caps with catalysts. Sector momentum days. New 52-week highs.',
    tips: ['Morning momentum is most reliable', 'Wait for the flag if you miss the move', 'Relative volume > 3× is strong', 'Never average down'],
  },
  'Gap and Go': {
    summary: 'Trading stocks that gap at the open and continue in the gap direction with pre-market preparation.',
    entry: 'Scan for >4% gaps on news with high pre-market volume. Enter on first 1-min candle breaking PM high/low.',
    exit: 'Target whole/half-dollar levels. Stop at opening range low. Take profits in first 5–15 min.',
    risk: 'Risk 0.5%. Use limit orders. Pre-market levels guide stops.',
    bestFor: 'Small-caps with catalysts. Earnings gaps. Sector momentum gaps.',
    tips: ['Watchlist ready by 9:00 AM', 'Need volume confirmation', 'Gap fills possible — tight stops', 'First 5 min reveals if gap holds'],
  },
  'Mean Reversion': {
    summary: 'Trading price returns to average after extremes using Bollinger Bands, RSI, or deviation channels.',
    entry: 'Price at 2+ std devs from 20-period mean or RSI <20/>80. Wait for reversal candle confirmation.',
    exit: 'Target the 20-period MA. Partial at mean, trail the rest.',
    risk: 'Risk 1%. Counter-trend sizing. Don\'t fight parabolic moves.',
    bestFor: 'Range-bound markets. Large-caps. Daily chart is most reliable.',
    tips: ['RSI + volume divergence = high probability', 'Fails in strong trends', 'First band touch > subsequent', 'Pair trades are a form of mean reversion'],
  },
  'Trend Following': {
    summary: 'Systematic riding of established trends using MA crossovers, higher highs/lows, and trendlines.',
    entry: '20 EMA crosses above 50 EMA or pullbacks to 20 EMA in uptrend. Higher highs/lows confirmed.',
    exit: 'Close below 50 EMA or lower low. Trail with 20 EMA. Partial at key resistance.',
    risk: 'Risk 1–2%. ATR-based stops. Expect 40–45% win rate — winners run far.',
    bestFor: 'Large-cap sector uptrends. ETFs, indices. Daily and weekly timeframes.',
    tips: ['Low win rate, large winners', 'Hold through pullbacks', 'ADX >25 confirms trend', 'Weekly + daily alignment improves odds'],
  },
  'Reversal Trading': {
    summary: 'Identifying major turning points at trend exhaustion. High reward but requires precise timing.',
    entry: 'RSI/MACD divergence at key S/R. Double bottoms/tops, H&S, exhaustion gaps with reversal candles.',
    exit: 'Target prior swing or previous leg start. Tight stops beyond reversal point. Min 3:1 R:R.',
    risk: 'Risk 0.5–1%. Lower win rate (35–40%) but high payoff. Never add to losing reversals.',
    bestFor: 'Major S/R zones. Oversold/overbought extremes. End-of-trend exhaustion.',
    tips: ['Wait for confirmation', 'Multiple confluence signals', 'Volume spike on reversal candle', 'Cut failed reversals immediately'],
  },
  'Opening Range Breakout': {
    summary: 'Trading the break of the high or low established in the first 15–30 minutes based on early session price discovery.',
    entry: 'Mark the high and low of the first 15 or 30 minutes. Enter long above range high, short below range low. Volume must confirm.',
    exit: 'Target 1–2× the opening range size. Stop at opposite side or midpoint.',
    risk: 'Risk 0.5–1%. Range width determines position size.',
    bestFor: 'Trending market days. High-volume stocks. Overnight news bias.',
    tips: ['Narrower ranges = bigger breakouts', 'Check pre-market direction', 'Avoid until after FOMC/CPI', 'Combine with VWAP slope'],
  },
  'Channel Trading': {
    summary: 'Trading within well-defined parallel price channels, buying at support and selling at resistance repeatedly.',
    entry: 'Draw parallel trendlines on 3+ touches. Buy at lower boundary with reversal signal. Short at upper boundary.',
    exit: 'Target opposite channel boundary. Stop just outside. Partial at midline.',
    risk: 'Risk 1%. Channel breaks invalidate — exit immediately.',
    bestFor: 'Established ranges. All timeframes. Non-trending, oscillating conditions.',
    tips: ['More touches = stronger channel', 'Channels eventually break', 'Ascending channels break down more', 'Volume decreases within channel'],
  },
  'Fibonacci Retracement': {
    summary: 'Using Fibonacci levels (38.2%, 50%, 61.8%) to identify pullback entry points within a larger trend.',
    entry: 'After impulse move, wait for retracement to 50% or 61.8% Fib. Enter on bounce with candle confirmation.',
    exit: 'Target 100% extension or -27.2% extension. Stop below 78.6% level.',
    risk: 'Risk 1%. 61.8% is the "golden zone." Deeper retracements = trend weakness.',
    bestFor: 'Trending stocks with impulse-correction structure. All timeframes.',
    tips: ['Combine Fibs with horizontal S/R', '61.8% + 200 EMA is powerful', 'Draw from most recent swing', 'Clustering Fibs = strong zone'],
  },
  'Volume Profile': {
    summary: 'Using volume-at-price data to identify value areas, points of control, and low-volume nodes.',
    entry: 'Enter at POC retest with reversal signal. Trade breakouts through low-volume nodes.',
    exit: 'Target next high-volume node or POC. Low-volume = acceleration zones.',
    risk: 'Risk 1%. POC rejections are high-probability. Cut failed value area breaks.',
    bestFor: 'Futures and large-caps. Intraday and multi-day profiles.',
    tips: ['POC is a magnet', 'LVN = fast price movement', 'VAH/VAL are key levels', 'Combine with VWAP'],
  },
  'Iron Condor': {
    summary: 'Neutral options strategy selling call + put spreads to collect premium in range-bound, high-IV conditions.',
    entry: 'Sell call spread above resistance, put spread below support. 30–45 DTE, 0.15–0.20 delta. IV rank >50%.',
    exit: 'Close at 50% max profit or 21 DTE. Adjust by rolling untested side.',
    risk: 'Max risk = wing width minus premium. Keep under 3% of account.',
    bestFor: 'High IV. Range-bound stocks/indices. Monthly income. Liquid underlyings.',
    tips: ['IV rank > 50% ideal', 'Wider wings = more risk', 'Manage at 21 DTE', 'Don\'t hold through earnings'],
  },
  'Pairs Trading': {
    summary: 'Market-neutral strategy trading the spread between two correlated stocks.',
    entry: 'Correlated pairs, spread deviates >2 std devs. Long laggard, short leader.',
    exit: 'Close when spread reverts to mean. Stop at 3+ std devs.',
    risk: 'Market-neutral but correlation can break. Risk 1% on the spread.',
    bestFor: 'Sector pairs (KO/PEP, V/MA). Low-correlation markets. Hedging.',
    tips: ['Verify 6+ months stable correlation', 'Sector events break correlation', 'Equal dollar sizing', 'Cointegration > correlation'],
  },
  'Pre-Market Momentum': {
    summary: 'Trading stocks with strong pre-market moves (4:00–9:30 AM) to capitalize at the open.',
    entry: 'Scan for >$1 PM range, >500K PM volume. Enter on first pullback to PM support or PM high breakout.',
    exit: 'Target next whole dollar or PM resistance. Trail with 1-min candle lows.',
    risk: 'Risk 0.5%. Thin and volatile. Use limit orders.',
    bestFor: 'Catalyst-driven stocks. Small-caps with retail interest. Gap plays.',
    tips: ['High PM volume = sustained move', 'PM levels = first S/R', 'Avoid wide spreads', 'Plan before the bell'],
  },
  'Sector Rotation': {
    summary: 'Rotating capital into the strongest sectors and out of the weakest following the economic cycle.',
    entry: 'Identify leading sector via relative strength (sector ETFs vs SPY). Enter top stocks on pullbacks.',
    exit: 'Exit when sector loses RS leadership. Rotate into new leader. Weekly charts.',
    risk: 'Risk 1–2%. Diversify 3–5 positions. Sector trends last weeks to months.',
    bestFor: 'Intermediate-term positioning. Economic cycle transitions. ETFs or sector leaders.',
    tips: ['Tech leads early expansion', 'Utilities/staples lead late cycle', 'RS charts reveal rotation early', 'Follow the money flow'],
  },
  'Covered Call': {
    summary: 'Selling call options against stock you already own to generate income and reduce cost basis. A conservative income strategy.',
    entry: 'Own 100+ shares of a stock. Sell a call at 0.20–0.30 delta with 30–45 DTE. Choose a strike above your breakeven or target exit.',
    exit: 'Let expire worthless (keep premium) or buy back at 50%+ profit. Roll up and out if stock rises through your strike.',
    risk: 'Risk is capped at stock ownership downside minus premium received. You cap upside at the strike price.',
    bestFor: 'Stocks you\'re willing to sell at the strike. Sideways to slightly bullish markets. Income generation on core holdings.',
    tips: ['Don\'t sell calls below your cost basis', 'Monthly selling generates consistent income', 'Ex-dividend dates matter — calls may be exercised early', 'Roll before expiration if ITM to keep your shares'],
  },
  'Butterfly Spread': {
    summary: 'A limited-risk, limited-reward strategy using three strike prices to profit from a stock staying near a target price.',
    entry: 'Buy 1 lower strike, sell 2 middle strikes, buy 1 upper strike. Enter with 14–21 DTE when expecting pinning action at the center strike.',
    exit: 'Max profit at center strike at expiration. Close at 50% max profit or 7 DTE. Loss is limited to the debit paid.',
    risk: 'Max risk = net debit. Very capital efficient. Position size can be larger since risk is defined and small.',
    bestFor: 'Low-volatility environments. Stocks expected to stay range-bound. Expiration week plays around round numbers.',
    tips: ['Broken wing butterflies offer directional bias with similar structure', 'Works best when you can pinpoint a target price', 'Theta accelerates rapidly in the last week', 'Use on SPY/QQQ around key levels for low-cost bets'],
  },
  'Dark Pool Prints': {
    summary: 'Tracking large institutional block trades executed in dark pools to identify hidden accumulation or distribution before price moves.',
    entry: 'Monitor dark pool print scanners for large block trades (>$1M) at or above the ask (bullish) or at/below bid (bearish). Enter in the direction of the institutional flow.',
    exit: 'Target 2–5% move in the direction of the print. Trail stops. If price doesn\'t respond within 2–3 days, the thesis is invalid.',
    risk: 'Risk 1%. Not all prints lead to moves — use as confirmation with other setups. Combine with technical levels.',
    bestFor: 'Large-cap stocks with active institutional participation. Works best when prints cluster at key levels. Pre-earnings accumulation.',
    tips: ['Prints at ask = bullish, at bid = bearish', 'Volume matters — bigger prints have more significance', 'Cluster of prints over days is stronger than a single print', 'Combine with unusual options activity for confluence'],
  },
  'Supply & Demand Zones': {
    summary: 'Identifying areas where institutional buying (demand) or selling (supply) created sharp price moves, and trading the retest of those zones.',
    entry: 'Mark the base of a sharp rally (demand zone) or the top of a sharp drop (supply zone). Enter when price returns to the zone with a reversal candle.',
    exit: 'Target the opposite zone or the most recent swing high/low. Stop just beyond the zone boundary.',
    risk: 'Risk 1%. Fresh zones (first retest) are highest probability. Zones weaken with each subsequent touch.',
    bestFor: 'All timeframes and instruments. Works best on daily and 4H charts. Clean, impulsive moves create the best zones.',
    tips: ['The sharper the move away from the zone, the stronger it is', 'Fresh zones > retested zones', 'Higher timeframe zones dominate lower timeframe zones', 'Combine with order flow for institutional confirmation'],
  },
  'Wheel Strategy': {
    summary: 'A systematic options income strategy: sell puts until assigned, then sell covered calls until shares are called away. Repeat.',
    entry: 'Step 1: Sell cash-secured puts at a strike you\'d buy the stock. 30–45 DTE, 0.25–0.30 delta. Step 2: If assigned, sell covered calls above your cost basis.',
    exit: 'Puts: buy back at 50% profit or take assignment. Calls: let expire or get called away. Reinvest premium and repeat.',
    risk: 'Risk = owning the stock at the put strike. Only wheel stocks you want to own. Keep allocation under 10% per position.',
    bestFor: 'Stable, dividend-paying stocks. Stocks with solid fundamentals at fair value. Accounts with enough capital for 100-share lots.',
    tips: ['Only wheel stocks you\'d happily own for years', 'Premium income reduces cost basis over time', 'Don\'t chase high IV on bad stocks', 'Track your effective cost basis including all premiums collected'],
  },
};

const CUSTOM_PLAYBOOKS_KEY = 'custom-playbooks';

function loadCustomPlaybooks(): Record<string, GuideData> {
  try {
    const saved = localStorage.getItem(CUSTOM_PLAYBOOKS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveCustomPlaybooks(data: Record<string, GuideData>) {
  localStorage.setItem(CUSTOM_PLAYBOOKS_KEY, JSON.stringify(data));
}

export default function PlaybooksView() {
  const { trades } = useTrades();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [customGuides, setCustomGuides] = useState<Record<string, GuideData>>(loadCustomPlaybooks);
  const [showAddModal, setShowAddModal] = useState(false);

  const allGuides = useMemo(() => ({ ...builtInGuides, ...customGuides }), [customGuides]);

  const playbooks = useMemo(() => {
    const stratMap: Record<string, typeof trades> = {};
    trades.forEach(t => { (stratMap[t.strategy] ??= []).push(t); });

    const allStrategies = new Set([...Object.keys(allGuides), ...Object.keys(stratMap)]);

    return Array.from(allStrategies)
      .map(name => {
        const ts = stratMap[name] || [];
        return {
          name,
          winRate: ts.length ? calcWinRate(ts) : 0,
          trades: ts.length,
          avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
          totalPnl: calcTotalPnl(ts),
          bestSetup: (() => {
            const setupMap: Record<string, number> = {};
            ts.forEach(t => { setupMap[t.setup] = (setupMap[t.setup] || 0) + 1; });
            return Object.entries(setupMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
          })(),
          topSymbols: (() => {
            const symMap: Record<string, number> = {};
            ts.forEach(t => { symMap[t.symbol] = (symMap[t.symbol] || 0) + 1; });
            return Object.entries(symMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
          })(),
          avgRR: ts.length ? (ts.reduce((s, t) => s + parseFloat(t.rr), 0) / ts.length).toFixed(1) : '—',
          mistakeRate: ts.length ? ((ts.filter(t => t.mistake).length / ts.length) * 100).toFixed(0) : '0',
          hasGuide: !!allGuides[name],
          isCustom: !!customGuides[name],
        };
      })
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [trades, allGuides, customGuides]);

  const toggleFlip = (name: string) => {
    setFlippedCard(flippedCard === name ? null : name);
  };

  const deleteCustom = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...customGuides };
    delete updated[name];
    setCustomGuides(updated);
    saveCustomPlaybooks(updated);
    if (flippedCard === name) setFlippedCard(null);
  };

  const addCustomPlaybook = (name: string, guide: GuideData) => {
    const updated = { ...customGuides, [name]: guide };
    setCustomGuides(updated);
    saveCustomPlaybooks(updated);
    setShowAddModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] text-muted-foreground font-mono">{playbooks.length} strategies • Click to flip</span>
        <div className="flex items-center gap-3">
          <ViewHeader />
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" /> New Playbook
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {playbooks.map(pb => {
          const isFlipped = flippedCard === pb.name;
          const guide = allGuides[pb.name];
          const wrColor = pb.trades > 0 ? (pb.winRate >= 50 ? 'text-positive' : 'text-negative') : 'text-muted-foreground';

          return (
            <div
              key={pb.name}
              className="cursor-pointer"
              style={{ perspective: '1000px', minHeight: '280px' }}
              onClick={() => guide && toggleFlip(pb.name)}
            >
              <div
                className="relative w-full h-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: '280px',
                }}
              >
                {/* FRONT */}
                <div className="absolute inset-0 bg-card border border-border flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="p-3 border-b border-border">
                    <div className="flex justify-between items-center text-accent text-[11px] uppercase font-mono">
                      <span className="font-bold flex items-center gap-1.5">
                        {pb.name}
                        {pb.isCustom && <span className="text-[8px] px-1 py-0.5 bg-accent/10 border border-accent/30 text-accent normal-case">custom</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        {pb.isCustom && (
                          <button onClick={(e) => deleteCustom(pb.name, e)} className="text-muted-foreground hover:text-negative transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className={`${wrColor} font-bold`}>
                          {pb.trades > 0 ? `${pb.winRate.toFixed(0)}% WR` : 'NO DATA'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex-1">
                    <ul className="space-y-0">
                      {[
                        { l: 'Trades', v: pb.trades || '—' },
                        { l: 'Total P&L', v: pb.trades ? `${pb.totalPnl >= 0 ? '+' : ''}$${pb.totalPnl.toFixed(0)}` : '—', c: pb.trades ? (pb.totalPnl >= 0 ? 'text-positive' : 'text-negative') : '' },
                        { l: 'Avg P&L', v: pb.trades ? `$${pb.avgPnl.toFixed(0)}` : '—', c: pb.trades ? (pb.avgPnl >= 0 ? 'text-positive' : 'text-negative') : '' },
                        { l: 'Avg R:R', v: pb.trades ? `${pb.avgRR}:1` : '—' },
                        { l: 'Best Setup', v: pb.bestSetup },
                        ...(pb.topSymbols.length > 0 ? [{ l: 'Top Symbols', v: pb.topSymbols.join(', ') }] : []),
                        ...(pb.trades > 0 ? [{ l: 'Mistake Rate', v: `${pb.mistakeRate}%`, c: parseInt(pb.mistakeRate) > 20 ? 'text-negative' : parseInt(pb.mistakeRate) > 10 ? 'text-accent' : 'text-positive' }] : []),
                      ].map(m => (
                        <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                          <span className="text-muted-foreground font-body">{m.l}</span>
                          <span className={`font-bold font-mono ${m.c || ''}`}>{m.v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {guide && (
                    <div className="px-3 py-2 border-t border-border text-[9px] font-mono text-muted-foreground text-center">
                      CLICK TO VIEW STRATEGY GUIDE ↻
                    </div>
                  )}
                </div>

                {/* BACK */}
                {guide && (
                  <div className="absolute inset-0 bg-surface-primary border border-accent/30 flex flex-col overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className="p-3 border-b border-accent/30 flex justify-between items-center">
                      <span className="text-accent text-[11px] font-mono font-bold uppercase">{pb.name}</span>
                      <RotateCcw className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="p-3 flex-1 space-y-2.5">
                      <p className="text-[11px] text-foreground font-body leading-relaxed">{guide.summary}</p>
                      {[
                        { label: '▸ Entry', content: guide.entry },
                        { label: '▸ Exit', content: guide.exit },
                        { label: '▸ Risk', content: guide.risk },
                        { label: '▸ Best For', content: guide.bestFor },
                      ].map(s => (
                        <div key={s.label}>
                          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-0.5">{s.label}</div>
                          <p className="text-[10px] text-foreground/80 font-body leading-relaxed">{s.content}</p>
                        </div>
                      ))}
                      <div>
                        <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-0.5">▸ Tips</div>
                        {guide.tips.map((tip, i) => (
                          <div key={i} className="text-[10px] text-foreground/70 font-body leading-relaxed flex gap-1 mb-0.5">
                            <span className="text-accent">•</span><span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-3 py-2 border-t border-accent/30 text-[9px] font-mono text-muted-foreground text-center">
                      CLICK TO FLIP BACK ↻
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && <AddPlaybookModal onClose={() => setShowAddModal(false)} onAdd={addCustomPlaybook} />}
    </div>
  );
}

function AddPlaybookModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, guide: GuideData) => void }) {
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [risk, setRisk] = useState('');
  const [bestFor, setBestFor] = useState('');
  const [tips, setTips] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !summary.trim()) return;
    onAdd(name.trim(), {
      summary, entry, exit, risk, bestFor,
      tips: tips.split('\n').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onClose}>
      <div className="bg-card border border-border p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-accent text-[12px] font-mono font-bold uppercase">Create Custom Playbook</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Strategy Name *" value={name} onChange={setName} placeholder="e.g. My Breakout Setup" />
          <Field label="Summary *" value={summary} onChange={setSummary} placeholder="Brief description of this strategy..." multiline />
          <Field label="Entry Criteria" value={entry} onChange={setEntry} placeholder="When and how to enter..." multiline />
          <Field label="Exit Strategy" value={exit} onChange={setExit} placeholder="When and how to exit..." multiline />
          <Field label="Risk Management" value={risk} onChange={setRisk} placeholder="Position sizing, stop loss rules..." multiline />
          <Field label="Best Market Conditions" value={bestFor} onChange={setBestFor} placeholder="When this strategy works best..." />
          <Field label="Tips (one per line)" value={tips} onChange={setTips} placeholder="Tip 1&#10;Tip 2&#10;Tip 3" multiline />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground hover:opacity-90">Create Playbook</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-body placeholder:text-muted-foreground focus:outline-none focus:border-accent";
  return (
    <div>
      <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-y`} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
