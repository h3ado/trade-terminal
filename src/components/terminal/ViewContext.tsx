import { useEffect, useState } from 'react';
import { ViewType } from '@/types/trade';

const VIEW_META: Record<string, { code: string; label: string }> = {
  over:        { code: 'OVER',  label: 'Global Market Overview' },
  forex:       { code: 'FXC',   label: 'FX Cross-Rate Monitor' },
  crypto:      { code: 'CRYP',  label: 'Crypto Market Terminal' },
  security:    { code: 'DES',   label: 'Security Description' },
  options:     { code: 'OMON',  label: 'Options Monitor' },
  macro:       { code: 'MACR',  label: 'Macro Terminal' },
  cot:         { code: 'COT',   label: 'CFTC Commitment of Traders' },
  globe:       { code: 'GLOB',  label: 'Global Markets Globe 3D' },
  news:        { code: 'TOP',   label: 'Top News & Wire' },
  journal:     { code: 'JRNL',  label: 'Trade Journal' },
  launchpad:   { code: 'LP',    label: 'Launchpad — Multi-Panel Workspace' },
  dashboard:   { code: 'DASH',  label: 'Trading Dashboard' },
  trades:      { code: 'BLOT',  label: 'Trade Blotter' },
  analytics:   { code: 'PERF',  label: 'Performance Analytics' },
  performance: { code: 'PERF',  label: 'Performance Analytics' },
  calendar:    { code: 'CAL',   label: 'Economic Calendar' },
  goals:       { code: 'GOAL',  label: 'Goals & Targets' },
  mistakes:    { code: 'MIST',  label: 'Mistake Journal' },
  playbooks:   { code: 'PLAY',  label: 'Trading Playbooks' },
  quiz:        { code: 'QUIZ',  label: 'Knowledge Quiz' },
  // Macro sub-views
  meco:        { code: 'ECO',   label: 'Economic Release Calendar' },
  mecst:       { code: 'ECST',  label: 'Economic Statistics Matrix' },
  mecfc:       { code: 'ECFC',  label: 'Economic Forecast Matrix' },
  mecwb:       { code: 'ECWB',  label: 'Economic Workbook' },
  mstat:       { code: 'STAT',  label: 'Statistics Directory' },
  mectr:       { code: 'ECTR',  label: 'Bilateral Trade Flows' },
  mcoun:       { code: 'COUN',  label: 'Country Dashboard' },
  moecd:       { code: 'OECD',  label: 'OECD Indicators' },
  meiu:        { code: 'EIU',   label: 'Country Risk Card' },
  mfed:        { code: 'FED',   label: 'Federal Reserve Portal' },
  mfomc:       { code: 'FOMC',  label: 'FOMC Decisions Archive' },
  mffip:       { code: 'FFIP',  label: 'Fed-Funds Implied Probabilities' },
  mcenb:       { code: 'CENB',  label: 'Global Central Bank Portal' },
  msrsk:       { code: 'SRSK',  label: 'Sovereign Risk Monitor' },
  mwlst:       { code: 'WLST',  label: 'Market Watchlist' },
  mwei:        { code: 'WEI',   label: 'World Equity Index Monitor' },
  mwb:         { code: 'WB',    label: 'World Bonds' },
  mglco:       { code: 'GLCO',  label: 'Global Commodities' },
  mtop:        { code: 'TOP',   label: 'Top News' },
  mint:        { code: 'INT',   label: 'Interest Rate Monitor' },
  mnetliq:     { code: 'NLIQ',  label: 'Net Liquidity Monitor' },
  msqzz:       { code: 'SQZZ',  label: 'Short Squeeze Monitor' },
  mrotn:       { code: 'ROTN',  label: 'Sector Rotation Monitor' },
  attr:        { code: 'ATTR',  label: 'Attribution Analysis' },
  posiz:       { code: 'POSI',  label: 'Positions Monitor' },
  mcpi:        { code: 'CPI',   label: 'Consumer Price Index' },
  mppi:        { code: 'PPI',   label: 'Producer Price Index' },
  munemp:      { code: 'UNEMP', label: 'Unemployment & Labor Market' },
  mnfp:        { code: 'NFP',   label: 'Non-Farm Payrolls' },
  mgdp:        { code: 'GDP',   label: 'Gross Domestic Product' },
  mpce:        { code: 'PCE',   label: 'PCE Deflator' },
  mjolts:      { code: 'JOLTS', label: 'JOLTS — Job Openings & Labor Turnover' },
  mism:        { code: 'ISM',   label: 'ISM Manufacturing & Services PMI' },
  yc:          { code: 'YCRV', label: 'Yield Curve & Sovereign Bonds' },
  earn:        { code: 'EARN', label: 'Earnings Terminal — IV Crush & Playbook' },
  wxtr:        { code: 'WXTR', label: 'Weather Intelligence Terminal' },
  futs:        { code: 'FUTS', label: 'Futures Curve Monitor — Term Structure' },
  short:       { code: 'SHORT', label: 'Short Interest Monitor' },
  form4:       { code: 'FORM4', label: 'Insider Trading Feed — SEC Form 4' },
  etff:        { code: 'ETFF', label: 'ETF Flow Monitor — Creations & Redemptions' },
  heat:        { code: 'HEAT', label: 'Sector Heatmap — S&P 500 Sector Performance' },
  volt:        { code: 'VOLT', label: 'Volatility Surface — IV Term Structure & Smile' },
  sent:        { code: 'SENT', label: 'Market Sentiment — Fear & Greed / Put-Call / AAII' },
  crdt:        { code: 'CRDT', label: 'Credit Markets — IG/HY Spreads & CDS' },
  chain:       { code: 'CHAIN', label: 'Crypto On-Chain Monitor — MVRV/NUPL/SOPR/NVT/Mempool' },
  port:        { code: 'PORT',  label: 'Portfolio Risk Analyzer — Sharpe/Sortino/Drawdown/Correlation' },
  chart:       { code: 'CHART', label: 'Chart Workstation — OHLCV/SMA/EMA/BB/RSI/MACD' },
  indx:        { code: 'INDX',  label: 'Market Indicators — Breadth/Momentum/Correlation/Participation' },
  rsch:        { code: 'RSCH',  label: 'AI Market Research Assistant' },
  scrn:        { code: 'SCRN',  label: 'Stock Screener — Filter, Save, Preset' },
  alrt:        { code: 'ALRT',  label: 'Alert Manager — Price & Condition Alerts' },
  corp:        { code: 'CORP',  label: 'Corporate Actions — Dividends / Splits / Buybacks' },
  surp:        { code: 'SURP',  label: 'Economic Surprise Index — Actual vs Consensus' },
  dpflo:       { code: 'DPFLO', label: 'Dark Pool Flow Monitor — Block Prints & Sweeps' },
};

interface Props {
  activeView: ViewType;
}

export default function ViewContext({ activeView }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const meta = VIEW_META[activeView] ?? { code: activeView.toUpperCase(), label: '' };
  const time = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div className="flex items-center px-2 border-b border-border bg-surface-deep h-[14px] shrink-0 gap-2 select-none">
      <span className="text-[8px] font-mono font-bold text-accent tracking-wide">[{meta.code}]</span>
      {meta.label && (
        <span className="text-[8px] font-mono text-muted-foreground">{meta.label}</span>
      )}
      <span className="ml-auto text-[8px] font-mono text-muted-foreground tabular-nums">AS OF {time}</span>
    </div>
  );
}
