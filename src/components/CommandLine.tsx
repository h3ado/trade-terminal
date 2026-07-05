import { useState, useRef, useEffect, useCallback } from 'react';
import { ViewType } from '@/types/trade';
import type { MacroTab } from '@/config/views';
import type { FxTab } from '@/config/fx';
import { optionCodeMap } from '@/config/options';
import { countries, MacroCountry } from '@/contexts/MacroCountryContext';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { applyGlobePreset, saveGlobeView, loadGlobeView, listGlobeViews } from '@/components/globe/AdvancedGlobe';
import { toast } from 'sonner';
import { CryptoTab } from '@/components/CryptoNav';

interface CommandDef {
  code: string;
  label: string;
  action: 'navigate' | 'function';
  view?: ViewType;
  macroTab?: MacroTab;
  fxTab?: FxTab;
  cryptoTab?: CryptoTab;
  skipCountry?: boolean;
}

interface Props {
  onNavigate: (view: ViewType) => void;
  onAddTrade: () => void;
  onTogglePrivacy: () => void;
  onMacroTab?: (tab: MacroTab) => void;
  onFxTab?: (tab: FxTab) => void;
  onCryptoTab?: (tab: CryptoTab) => void;
}

export const COMMANDS: CommandDef[] = [
  { code: 'GLOB', label: 'Global Markets Globe (3D)', action: 'navigate', view: 'globe' },
  { code: 'MAP',  label: 'Global Markets Map (2D)',   action: 'function' },
  { code: 'MACR', label: 'Macro Terminal (legacy tabs)', action: 'navigate', view: 'macro' },
  // Bloomberg-style macro CMDs
  { code: 'ECO',  label: 'Economic Release Calendar',     action: 'navigate', view: 'meco',  skipCountry: true },
  { code: 'ECST', label: 'Economic Statistics Matrix',    action: 'navigate', view: 'mecst', skipCountry: true },
  { code: 'ECFC', label: 'Economic Forecast Matrix',      action: 'navigate', view: 'mecfc', skipCountry: true },
  { code: 'ECWB', label: 'Economic Workbook',             action: 'navigate', view: 'mecwb', skipCountry: true },
  { code: 'STAT', label: 'Statistics Directory',          action: 'navigate', view: 'mstat', skipCountry: true },
  { code: 'ECTR', label: 'Bilateral Trade Flows',         action: 'navigate', view: 'mectr', skipCountry: true },
  { code: 'COUN', label: 'Country Dashboard',             action: 'navigate', view: 'mcoun', skipCountry: true },
  { code: 'OECD', label: 'OECD Indicators',               action: 'navigate', view: 'moecd', skipCountry: true },
  { code: 'EIU',  label: 'Country Risk Card',             action: 'navigate', view: 'meiu',  skipCountry: true },
  { code: 'FED',  label: 'Federal Reserve Portal',        action: 'navigate', view: 'mfed',  skipCountry: true },
  { code: 'FOMC', label: 'FOMC Decisions Archive',        action: 'navigate', view: 'mfomc', skipCountry: true },
  { code: 'FFIP', label: 'Fed-Funds Implied Probabilities', action: 'navigate', view: 'mffip', skipCountry: true },
  { code: 'CENB', label: 'Global Central Bank Portal',    action: 'navigate', view: 'mcenb', skipCountry: true },
  { code: 'SRSK', label: 'Sovereign Risk Monitor',        action: 'navigate', view: 'msrsk', skipCountry: true },
  { code: 'WLST', label: 'Market Watchlist',              action: 'navigate', view: 'mwlst', skipCountry: true },
  { code: 'CPI',   label: 'Consumer Price Index — Inflation Overview',    action: 'navigate', view: 'mcpi',   skipCountry: true },
  { code: 'PPI',   label: 'Producer Price Index — Cost Pipeline',         action: 'navigate', view: 'mppi',   skipCountry: true },
  { code: 'UNEMP', label: 'Unemployment & Labor Market Overview',         action: 'navigate', view: 'munemp', skipCountry: true },
  { code: 'NFP',   label: 'Non-Farm Payrolls — Employment Situation',     action: 'navigate', view: 'mnfp',   skipCountry: true },
  { code: 'GDP',   label: 'Gross Domestic Product — Growth Overview',     action: 'navigate', view: 'mgdp',   skipCountry: true },
  { code: 'PCE',   label: 'PCE Deflator — Fed Preferred Inflation Gauge', action: 'navigate', view: 'mpce',   skipCountry: true },
  { code: 'JOLTS', label: 'JOLTS — Job Openings & Labor Turnover',        action: 'navigate', view: 'mjolts', skipCountry: true },
  { code: 'ISM',   label: 'ISM Manufacturing & Services PMI',             action: 'navigate', view: 'mism',   skipCountry: true },
  { code: 'REAL', label: 'Real Rates & Breakevens',   action: 'navigate', view: 'macro', macroTab: 'realrates' },
  { code: 'BOP',  label: 'Balance of Payments',       action: 'navigate', view: 'macro', macroTab: 'bop' },
  { code: 'NRGY', label: 'Energy Balance',            action: 'navigate', view: 'macro', macroTab: 'energy' },
  { code: 'MFG',  label: 'Manufacturing & Orders',    action: 'navigate', view: 'macro', macroTab: 'mfg' },
  { code: 'CONS', label: 'Consumer Health',           action: 'navigate', view: 'macro', macroTab: 'consumer' },
  { code: 'FCI',  label: 'Financial Conditions',      action: 'navigate', view: 'macro', macroTab: 'fci' },
  { code: 'WEI',  label: 'World Equity Indices Monitor', action: 'navigate', view: 'mwei',  skipCountry: true },
  { code: 'WEIF', label: 'World Equity Index Futures',action: 'navigate', view: 'macro', macroTab: 'weif', skipCountry: true },
  { code: 'WPE',  label: 'World P/E & Valuations',    action: 'navigate', view: 'macro', macroTab: 'wpe',  skipCountry: true },
  { code: 'WB',   label: 'World Sovereign Yields Monitor', action: 'navigate', view: 'mwb',   skipCountry: true },
  { code: 'YCRV', label: 'Yield Curve — Spreads, Tenors, Inversion', action: 'navigate', view: 'yc', skipCountry: true },
  { code: 'YC',   label: 'Yield Curve (alias YCRV)',      action: 'navigate', view: 'yc',   skipCountry: true },
  { code: 'WXTR', label: 'Weather Intelligence Terminal', action: 'navigate', view: 'wxtr', skipCountry: true },
  { code: 'WX',   label: 'Weather Terminal (alias WXTR)', action: 'navigate', view: 'wxtr', skipCountry: true },
  { code: 'GLCO', label: 'Global Commodities Monitor',     action: 'navigate', view: 'mglco', skipCountry: true },
  { code: 'TOP',    label: 'Top News Firehose Monitor',      action: 'navigate', view: 'mtop',    skipCountry: true },
  { code: 'MINT',   label: 'Market Internals (TICK/TRIN/Breadth)', action: 'navigate', view: 'mint',   skipCountry: true },
  { code: 'NETLIQ', label: 'Net Liquidity Model (Fed BST−TGA−RRP)', action: 'navigate', view: 'mnetliq', skipCountry: true },
  { code: 'SQZZ',  label: 'Squeeze Scanner (TTM Squeeze)',  action: 'navigate', view: 'msqzz',  skipCountry: true },
  { code: 'HEAT',  label: 'Sector Heatmap — S&P 500 Sectors by % Change',           action: 'navigate', view: 'heat',  skipCountry: true },
  { code: 'VOLT',  label: 'Volatility Surface — IV Term Structure & Smile',          action: 'navigate', view: 'volt',  skipCountry: true },
  { code: 'SENT',  label: 'Market Sentiment — Fear & Greed / Put-Call / AAII',       action: 'navigate', view: 'sent',  skipCountry: true },
  { code: 'CRDT',  label: 'Credit Markets — IG/HY Spreads, CDS, Conditions',         action: 'navigate', view: 'crdt',  skipCountry: true },
  { code: 'FUTS',  label: 'Futures Curve — Contango/Backwardation Term Structure',   action: 'navigate', view: 'futs',  skipCountry: true },
  { code: 'CURV',  label: 'Futures Curve (alias FUTS)',     action: 'navigate', view: 'futs',  skipCountry: true },
  { code: 'SHORT', label: 'Short Interest Monitor — SI%, DTC, Borrow Fee, Squeeze', action: 'navigate', view: 'short', skipCountry: true },
  { code: 'SI',    label: 'Short Interest (alias SHORT)',   action: 'navigate', view: 'short', skipCountry: true },
  { code: 'FORM4', label: 'Insider Trading Feed — SEC Form 4 Buys/Sells/Clusters', action: 'navigate', view: 'form4', skipCountry: true },
  { code: 'INSD',  label: 'Insider Feed (alias FORM4)',     action: 'navigate', view: 'form4', skipCountry: true },
  { code: 'ETFF',  label: 'ETF Flow Monitor — Creations & Redemptions', action: 'navigate', view: 'etff', skipCountry: true },
  { code: 'ETFL',  label: 'ETF Flows (alias ETFF)',         action: 'navigate', view: 'etff', skipCountry: true },
  { code: 'CHAIN', label: 'Crypto On-Chain Monitor — MVRV/NUPL/SOPR/NVT/Mempool', action: 'navigate', view: 'chain', skipCountry: true },
  { code: 'OCHN',  label: 'On-Chain (alias CHAIN)',         action: 'navigate', view: 'chain', skipCountry: true },
  { code: 'PORT',  label: 'Portfolio Risk Analyzer — Sharpe/Sortino/VaR/Correlation', action: 'navigate', view: 'port', skipCountry: true },
  { code: 'RISK',  label: 'Portfolio Risk (alias PORT)',    action: 'navigate', view: 'port', skipCountry: true },
  { code: 'CHART', label: 'Chart Workstation — CHART {TICKER} for any symbol', action: 'function', skipCountry: true },
  { code: 'G',     label: 'Quick Chart — G {TICKER} (alias CHART)', action: 'function', skipCountry: true },
  { code: 'INDX',  label: 'Market Indicators — Breadth/Momentum/Correlation/Participation', action: 'navigate', view: 'indx', skipCountry: true },
  { code: 'BRDTH', label: 'Market Breadth (alias INDX)', action: 'navigate', view: 'indx', skipCountry: true },
  { code: 'MKTIND',label: 'Market Indicators (alias INDX)', action: 'navigate', view: 'indx', skipCountry: true },
  { code: 'RSCH',   label: 'AI Research Assistant — ask market questions', action: 'function', skipCountry: true },
  { code: 'AIDE',   label: 'AI Research (alias RSCH)', action: 'function', skipCountry: true },
  { code: 'SCRN',   label: 'Stock Screener — filter by sector/P/E/RSI/SI%', action: 'navigate', view: 'scrn', skipCountry: true },
  { code: 'SCREEN', label: 'Stock Screener (alias SCRN)', action: 'navigate', view: 'scrn', skipCountry: true },
  { code: 'ALRT',   label: 'Alert Manager — price & condition alerts', action: 'function', skipCountry: true },
  { code: 'ALERT',  label: 'Alert Manager (alias ALRT)', action: 'function', skipCountry: true },
  { code: 'CORP',   label: 'Corporate Actions — dividends, splits, buybacks', action: 'navigate', view: 'corp', skipCountry: true },
  { code: 'DIVS',   label: 'Dividends (alias CORP)', action: 'navigate', view: 'corp', skipCountry: true },
  { code: 'SURP',   label: 'Economic Surprise Index — actual vs consensus', action: 'navigate', view: 'surp', skipCountry: true },
  { code: 'ESURP',  label: 'Economic Surprise (alias SURP)', action: 'navigate', view: 'surp', skipCountry: true },
  { code: 'DPFLO',  label: 'Dark Pool Flow Monitor — block prints & sweeps', action: 'function', skipCountry: true },
  { code: 'DARK',   label: 'Dark Pool (alias DPFLO)', action: 'function', skipCountry: true },
  { code: 'ROTN',  label: 'Sector Rotation (RRG)',          action: 'navigate', view: 'mrotn',  skipCountry: true },
  { code: 'ATTR',  label: 'P&L Attribution (Clock/Grade/Hold/Sector)', action: 'navigate', view: 'attr',  skipCountry: true },
  { code: 'POSIZ', label: 'Position Sizer (Kelly/Fixed/% Risk)',        action: 'navigate', view: 'posiz', skipCountry: true },
  { code: 'OVER',  label: 'Market Overview (Cross-Asset)',   action: 'navigate', view: 'over',      skipCountry: true },
  { code: 'LAUN',  label: 'Launchpad (Multi-Panel)',        action: 'navigate', view: 'launchpad', skipCountry: true },
  { code: 'LP',   label: 'Launchpad (alias)',              action: 'navigate', view: 'launchpad', skipCountry: true },
  { code: 'FX',    label: 'Forex Terminal',             action: 'navigate', view: 'forex', fxTab: 'home' },
  { code: 'WFX',   label: 'World FX Monitor',           action: 'navigate', view: 'forex', fxTab: 'wfx' },
  { code: 'FXC',   label: 'FX Cross-Rate Matrix',       action: 'navigate', view: 'forex', fxTab: 'fxc' },
  { code: 'FXIP',  label: 'FX Information Portal',      action: 'navigate', view: 'forex', fxTab: 'fxip' },
  { code: 'FXFC',  label: 'FX Consensus Forecasts',     action: 'navigate', view: 'forex', fxTab: 'fxfc' },
  { code: 'FXCA',  label: 'FX Calculator',              action: 'navigate', view: 'forex', fxTab: 'fxca' },
  { code: 'TKC',   label: 'Regional Currency Overview', action: 'navigate', view: 'forex', fxTab: 'tkc' },
  { code: 'WCR',   label: 'World Currency Spot Rates',  action: 'navigate', view: 'forex', fxTab: 'wcr' },
  { code: 'FRD',   label: 'FX Forwards & Carry',        action: 'navigate', view: 'forex', fxTab: 'frd' },
  { code: 'WCRS',  label: 'FX Performance Ranking',     action: 'navigate', view: 'forex', fxTab: 'wcrs' },
  { code: 'WIRA',  label: 'International Reserves',     action: 'navigate', view: 'forex', fxTab: 'wira' },
  { code: 'FXV',   label: 'FX Vol Surface',             action: 'navigate', view: 'forex', fxTab: 'fxv' },
  { code: 'FXOP',  label: 'FX Options Quick-Look',      action: 'navigate', view: 'forex', fxTab: 'fxop' },
  { code: 'CARRY', label: 'FX Carry Trade Monitor',     action: 'navigate', view: 'forex', fxTab: 'carry' },
  { code: 'FXH',   label: 'FX History',                 action: 'navigate', view: 'forex', fxTab: 'fxh' },
  { code: 'FXNW',  label: 'FX News & Wires',            action: 'navigate', view: 'forex', fxTab: 'fxnw' },
  // Crypto Terminal
  { code: 'CRYP', label: 'Crypto Terminal — Overview',      action: 'navigate', view: 'crypto', cryptoTab: 'home'    },
  { code: 'MKTD', label: 'Crypto Markets — Top 50',         action: 'navigate', view: 'crypto', cryptoTab: 'markets' },
  { code: 'BTC',  label: 'Bitcoin In-Depth',                action: 'navigate', view: 'crypto', cryptoTab: 'btc'     },
  { code: 'ETH',  label: 'Ethereum In-Depth',               action: 'navigate', view: 'crypto', cryptoTab: 'eth'     },
  { code: 'DEFI', label: 'DeFi TVL Dashboard',              action: 'navigate', view: 'crypto', cryptoTab: 'defi'    },
  { code: 'FRAT', label: 'Crypto Derivatives & Funding',    action: 'navigate', view: 'crypto', cryptoTab: 'deriv'   },
  { code: 'CRYS', label: 'Crypto Sentiment / Fear & Greed', action: 'navigate', view: 'crypto', cryptoTab: 'sent'    },
  { code: 'CRNW', label: 'Crypto News Feed',                action: 'navigate', view: 'crypto', cryptoTab: 'news'    },
  { code: 'COT',  label: 'Commitments of Traders',    action: 'navigate', view: 'cot' },
  { code: 'JRNL', label: 'Trading Journal Dashboard', action: 'navigate', view: 'dashboard' },
  { code: 'TRDS', label: 'Trades',                    action: 'navigate', view: 'trades' },
  { code: 'PERF', label: 'Performance',               action: 'navigate', view: 'performance' },
  { code: 'ANLY', label: 'Analytics',                 action: 'navigate', view: 'analytics' },
  { code: 'CAL',  label: 'Calendar',                  action: 'navigate', view: 'calendar' },
  { code: 'GOAL', label: 'Goals',                     action: 'navigate', view: 'goals' },
  { code: 'PLAY', label: 'Playbooks',                 action: 'navigate', view: 'playbooks' },
  { code: 'MIST', label: 'Mistakes',                  action: 'navigate', view: 'mistakes' },
  { code: 'NOTE', label: 'Journal Notes',             action: 'navigate', view: 'journal' },
  { code: 'NEWS', label: 'News Terminal (GDELT + AI)', action: 'function' },
  { code: 'QUIZ', label: 'Weekly News Quiz',            action: 'navigate', view: 'quiz', skipCountry: true },
  { code: 'SQUAWK', label: 'Audio Squawk Player (T1 headlines)', action: 'function' },
  { code: 'TV',   label: 'TV Clips Drawer (CNBC/Bloomberg)', action: 'function' },
  { code: 'ECAL', label: 'Econ + Earnings + CB Calendar', action: 'function' },
  { code: 'EARN', label: 'Earnings Hub (IV crush, playbook, calendar)', action: 'function' },
  // Trading actions
  { code: 'NEW',  label: 'New Trade (open modal)',     action: 'function' },
  { code: 'PRIV', label: 'Toggle Privacy Mode',        action: 'function' },
  { code: 'ACCT', label: 'Account Manager',            action: 'function' },
  { code: 'BACK', label: 'Navigate Back',              action: 'function' },
  { code: 'FWD',  label: 'Navigate Forward',           action: 'function' },
  // OPTIONS workspace modules (Bloomberg-style mnemonics)
  { code: 'DASH', label: 'Options Dashboard',          action: 'function' },
  { code: 'OMON', label: 'Options Matrix / Chain',     action: 'function' },
  { code: 'GAMMA', label: 'Gamma Levels',              action: 'function' },
  { code: 'GEX',  label: 'GEX Profile / Intraday / OI', action: 'function' },
  { code: 'OVME', label: 'Vol Surface / Term / Smile', action: 'function' },
  { code: 'MAXP', label: 'Max Pain (current + drift)', action: 'function' },
  { code: 'PAY',  label: 'Payoff Lab',                 action: 'function' },
  { code: 'FLOW', label: 'Dealer Flow Feed',           action: 'function' },
  { code: 'SENT', label: 'Options Sentiment',          action: 'function' },
  { code: 'GRK',  label: 'Greeks Book + Scenario',     action: 'function' },
  { code: 'QSCR', label: 'Q-Scores',                   action: 'function' },
  { code: 'SCAN', label: 'Options Screener',           action: 'function' },
  // Security page
  { code: 'DES',  label: 'Security Page — DES {TICKER}',      action: 'function' },
  { code: 'EQ',   label: 'Equity Security  — EQ {TICKER}',    action: 'function' },
  // legacy short codes
  { code: 'OPT',  label: 'Options Workspace (alias DASH)', action: 'function' },
  { code: 'SPRD', label: 'Spread Builder',             action: 'function' },
  { code: 'SKEW', label: 'IV Term Structure',          action: 'function' },
  { code: 'SMILE', label: 'Volatility Smile',          action: 'function' },
  { code: 'CHARM', label: 'Charm Heatmap',             action: 'function' },
  { code: 'VANNA', label: 'Vanna Heatmap',             action: 'function' },
  { code: 'SCEN', label: 'Greeks Scenario',            action: 'function' },
];


export default function CommandLine({ onNavigate, onAddTrade, onTogglePrivacy, onMacroTab, onFxTab, onCryptoTab }: Props) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingCmd, setPendingCmd] = useState<CommandDef | null>(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bb-cmd-history') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedCountry, setSelectedCountry, countryInfo } = useMacroCountry();

  const isMacroCmd = (cmd: CommandDef) => cmd.view === 'macro' && !cmd.skipCountry;

  // Country selection step
  const filteredCountries = pendingCmd
    ? countries.filter(c =>
        countryFilter === '' ||
        c.code.includes(countryFilter.toUpperCase()) ||
        c.name.toUpperCase().includes(countryFilter.toUpperCase()) ||
        c.currency.toUpperCase().includes(countryFilter.toUpperCase())
      )
    : [];

  // Match against the first token so commands that take an argument
  // (e.g. `SAVE 1`, `LOAD oil-watch`) still surface in the dropdown.
  const firstToken = value.trim().split(/\s+/)[0]?.toUpperCase() ?? '';
  const filtered = !pendingCmd && value.trim()
    ? COMMANDS.filter(c =>
        c.code.startsWith(firstToken) ||
        c.label.toUpperCase().includes(value.toUpperCase())
      )
    : [];

  const showHistory = focused && !value.trim() && !pendingCmd && !showHelp && cmdHistory.length > 0;
  const showDropdown = (focused && (filtered.length > 0 || showHelp || pendingCmd)) || showHistory;

  const finalize = useCallback((cmd: CommandDef, country?: MacroCountry) => {
    if (country) setSelectedCountry(country);
    if (cmd.action === 'navigate' && cmd.view) {
      onNavigate(cmd.view);
      if (cmd.macroTab && onMacroTab) onMacroTab(cmd.macroTab);
      if (cmd.fxTab && onFxTab) onFxTab(cmd.fxTab);
      if (cmd.cryptoTab && onCryptoTab) onCryptoTab(cmd.cryptoTab);
      if (cmd.code === 'GLOB') {
        try { localStorage.setItem('lovable:userpref:globe.viewMode', JSON.stringify('3D')); } catch {}
        window.dispatchEvent(new CustomEvent('lovable:globe-set-view-mode', { detail: '3D' }));
      }
    } else if (cmd.code === 'MAP') {
      // Open the 2D Mercator map view of the global markets globe.
      try { localStorage.setItem('lovable:userpref:globe.viewMode', JSON.stringify('2D')); } catch {}
      onNavigate('globe');
      window.dispatchEvent(new CustomEvent('lovable:globe-set-view-mode', { detail: '2D' }));
    }
    setValue('');
    setCountryFilter('');
    setPendingCmd(null);
    setShowHelp(false);
    inputRef.current?.blur();
  }, [onNavigate, onMacroTab, onFxTab, setSelectedCountry]);

  const execute = useCallback((cmd: CommandDef, rawOverride?: string) => {
    const raw = rawOverride ?? value;
    if (!['HELP', 'BACK', 'FWD'].includes(cmd.code)) {
      setCmdHistory(prev => {
        const next = [cmd.code, ...prev.filter(h => h !== cmd.code)].slice(0, 15);
        try { localStorage.setItem('bb-cmd-history', JSON.stringify(next)); } catch {}
        return next;
      });
    }
    if (cmd.code === 'HELP') {
      setShowHelp(true);
      setValue('');
      return;
    }
    if (cmd.code === 'NEW') {
      onAddTrade();
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'PRIV') {
      onTogglePrivacy();
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'ACCT') {
      window.dispatchEvent(new CustomEvent('lovable:account-panel-toggle'));
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'BACK') {
      window.dispatchEvent(new CustomEvent('lovable:nav-back'));
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'FWD') {
      window.dispatchEvent(new CustomEvent('lovable:nav-forward'));
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'NEWS') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ai = tokens.includes('AI');
      const argTokens = tokens.filter((t) => t !== 'AI');
      const arg = argTokens[0] ?? '';
      const knownCC = countries.find((c) => c.code === arg);
      const TOPIC_MAP: Record<string, string> = {
        CB: 'central-bank', FED: 'central-bank', EARN: 'earnings', ENERGY: 'energy', OIL: 'energy',
        CRYPTO: 'crypto', GEO: 'geopolitics', GEOPOL: 'geopolitics', REG: 'regulation', POTUS: 'potus',
        CMDTY: 'energy', LEGAL: 'regulation', ALT: 'alt-data',
      };

      let scope: 'global' | 'country' | 'ticker' | 'keyword' = 'global';
      let val = '';
      let topic: string | undefined;
      let pinOnly = false;
      let sort: 'recent' | 'velocity' = 'recent';
      let source: 'all' | 'x' | 'potus' | 'fed' = 'all';
      let rightPane: 'detail' | 'map' | 'heat' | 'thesis' | 'wrap' | 'deep' = 'detail';

      if (!arg || arg === 'TOP') { scope = 'global'; }
      else if (arg === 'HOT') { scope = 'global'; sort = 'velocity'; }
      else if (arg === 'PIN') { scope = 'global'; pinOnly = true; }
      else if (arg === 'X') { scope = 'global'; source = 'x'; }
      else if (arg === 'POTUS') { scope = 'global'; source = 'potus'; topic = 'potus'; }
      else if (arg === 'FED') { scope = 'global'; source = 'fed'; topic = 'central-bank'; }
      else if (arg === 'MAP') { scope = 'global'; rightPane = 'map'; }
      else if (arg === 'HEAT') { scope = 'global'; rightPane = 'heat'; }
      else if (arg === 'THESIS') { scope = 'global'; rightPane = 'thesis'; }
      else if (arg === 'WRAP') { scope = 'global'; rightPane = 'wrap'; }
      else if (arg === 'DEEP' || arg === 'ASK') { scope = 'global'; rightPane = 'deep'; val = argTokens.slice(1).join(' '); }
      else if (arg === 'SEC' || arg === '8K' || arg === '13F') { scope = 'global'; topic = 'filings'; }
      else if (arg === 'CONGRESS') { scope = 'global'; topic = 'congress'; }
      else if (arg === 'RATINGS') { scope = 'global'; topic = 'ratings'; }
      else if (TOPIC_MAP[arg]) { scope = 'global'; topic = TOPIC_MAP[arg]; }
      else if (knownCC) { scope = 'country'; val = arg; }
      else if (/^[A-Z]{1,5}$/.test(arg)) { scope = 'ticker'; val = arg; }
      else { scope = 'keyword'; val = argTokens.join(' '); }

      window.dispatchEvent(new CustomEvent('lovable:news-args', { detail: { scope, value: val, ai, topic, pinOnly, sort, source, rightPane } }));
      onNavigate('news');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'SQUAWK') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const arg = tokens[0] ?? '';
      window.dispatchEvent(new CustomEvent('lovable:squawk-toggle', { detail: { open: true } }));
      if (arg === 'ON') window.dispatchEvent(new CustomEvent('lovable:squawk', { detail: { action: 'on' } }));
      else if (arg === 'OFF') window.dispatchEvent(new CustomEvent('lovable:squawk', { detail: { action: 'off' } }));
      else if (arg === 'T1' || arg === 'ALL') window.dispatchEvent(new CustomEvent('lovable:squawk', { detail: { action: 'filter', filter: arg } }));
      else if (arg === 'T1+SEC' || arg === 'SEC') window.dispatchEvent(new CustomEvent('lovable:squawk', { detail: { action: 'filter', filter: 'T1+SEC' } }));
      onNavigate('news');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'TV') {
      window.dispatchEvent(new CustomEvent('lovable:tv-toggle'));
      onNavigate('news');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'ECAL') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const detail: { mode?: 'day' | 'week' | 'month'; ticker?: string; kind?: 'econ' | 'earnings' | 'cb'; country?: string; minImportance?: 1 | 2 | 3 } = {};
      for (const t of tokens) {
        if (t === 'DAY' || t === 'D') detail.mode = 'day';
        else if (t === 'WEEK' || t === 'W') detail.mode = 'week';
        else if (t === 'MONTH' || t === 'M') detail.mode = 'month';
        else if (t === 'CB' || t === 'FED') detail.kind = 'cb';
        else if (t === 'ER' || t === 'EARN' || t === 'EARNINGS') detail.kind = 'earnings';
        else if (t === 'ECON') detail.kind = 'econ';
        else if (t === '★' || t === '*') detail.minImportance = 1;
        else if (t === '★★' || t === '**') detail.minImportance = 2;
        else if (t === '★★★' || t === '***' || t === 'HOT') detail.minImportance = 3;
        else if (countries.find((c) => c.code === t)) detail.country = t;
        else if (/^[A-Z]{1,5}$/.test(t)) detail.ticker = t;
      }
      window.dispatchEvent(new CustomEvent('lovable:econ-cal-open', { detail }));
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'EARN') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      let win: 'today' | 'tom' | 'week' | 'month' | undefined;
      let session: 'BMO' | 'AMC' | undefined;
      let minImportance: 1 | 2 | 3 | undefined;
      let earnTicker: string | undefined;
      for (const t of tokens) {
        if (t === 'TODAY' || t === 'TDY') win = 'today';
        else if (t === 'TOM' || t === 'TOMORROW') win = 'tom';
        else if (t === 'WEEK' || t === 'WK') win = 'week';
        else if (t === 'MONTH' || t === 'MO') win = 'month';
        else if (t === 'BMO') session = 'BMO';
        else if (t === 'AMC') session = 'AMC';
        else if (t === '***' || t === 'HOT' || t === '★★★') minImportance = 3;
        else if (t === '**' || t === '★★') minImportance = 2;
        else if (t === '*' || t === '★') minImportance = 1;
        else if (/^[A-Z]{1,6}$/.test(t)) earnTicker = t;
      }
      const earnFilter = { window: win ?? 'week', session, minImportance, ticker: earnTicker };
      window.dispatchEvent(new CustomEvent('lovable:earn-args', {
        detail: { ticker: earnTicker ?? 'AAPL', filter: earnFilter },
      }));
      onNavigate('earn');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }

    if (optionCodeMap[cmd.code]) {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find((t) => /^[A-Z]{1,6}$/.test(t)) ?? 'SPY';
      const mapped = optionCodeMap[cmd.code];
      window.dispatchEvent(new CustomEvent('lovable:options-args', { detail: { tab: mapped.tab, sub: mapped.sub, ticker } }));
      onNavigate('options');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'CHART' || cmd.code === 'G') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find(t => /^[A-Z]{1,6}$/.test(t)) ?? 'AAPL';
      window.dispatchEvent(new CustomEvent('lovable:chart-args', { detail: { ticker } }));
      onNavigate('chart');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'RSCH' || cmd.code === 'AIDE') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find(t => /^[A-Z]{1,6}$/.test(t));
      const query = tokens.filter(t => !/^[A-Z]{1,6}$/.test(t)).join(' ').toLowerCase();
      window.dispatchEvent(new CustomEvent('lovable:rsch-args', { detail: { ticker, query } }));
      onNavigate('rsch');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'ALRT' || cmd.code === 'ALERT') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find(t => /^[A-Z]{1,6}$/.test(t));
      const price = tokens.find(t => /^\d+(\.\d+)?$/.test(t));
      window.dispatchEvent(new CustomEvent('lovable:alrt-args', { detail: { ticker, price: price ? parseFloat(price) : undefined } }));
      onNavigate('alrt');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'DPFLO' || cmd.code === 'DARK') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find(t => /^[A-Z]{1,6}$/.test(t));
      window.dispatchEvent(new CustomEvent('lovable:dpflo-args', { detail: { ticker } }));
      onNavigate('dpflo');
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (cmd.code === 'DES' || cmd.code === 'EQ') {
      const tokens = raw.trim().toUpperCase().split(/\s+/).slice(1);
      const ticker = tokens.find(t => /^[A-Z]{1,6}$/.test(t));
      if (ticker) {
        window.dispatchEvent(new CustomEvent('lovable:security-args', { detail: { ticker } }));
        onNavigate('security');
      }
      setValue(''); setShowHelp(false); inputRef.current?.blur();
      return;
    }
    if (isMacroCmd(cmd)) {
      setPendingCmd(cmd);
      setValue('');
      setCountryFilter('');
      setSelectedIndex(0);
      inputRef.current?.focus();
      return;
    }
    finalize(cmd);
  }, [finalize, value, onNavigate, onAddTrade, onTogglePrivacy]);

  const selectCountry = useCallback((code: MacroCountry) => {
    if (pendingCmd) finalize(pendingCmd, code);
  }, [pendingCmd, finalize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (pendingCmd) {
      const list = filteredCountries;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, list.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (list.length > 0) selectCountry(list[selectedIndex]?.code || list[0].code);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPendingCmd(null);
        setCountryFilter('');
        setValue('');
        inputRef.current?.blur();
      }
      return;
    }

    const list = showHelp ? COMMANDS : filtered;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (list.length > 0) {
        execute(list[selectedIndex] || list[0]);
      } else if (value.trim()) {
        const tok = value.trim().split(/\s+/)[0].toUpperCase();
        const exact = COMMANDS.find(c => c.code === tok);
        if (exact) execute(exact);
        else if (/^[A-Z]{1,6}$/.test(tok)) {
          window.dispatchEvent(new CustomEvent('lovable:security-args', { detail: { ticker: tok } }));
          onNavigate('security');
          setValue(''); setShowHelp(false); inputRef.current?.blur();
        }
        else { setValue(''); setShowHelp(true); }
      }
    } else if (e.key === 'Escape') {
      setValue('');
      setShowHelp(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => { setSelectedIndex(0); }, [value, countryFilter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const runner = (e: Event) => {
      const detail = (e as CustomEvent).detail as { raw?: string; code?: string } | undefined;
      const raw = (detail?.raw ?? detail?.code ?? '').trim();
      if (!raw) return;
      const tok = raw.split(/\s+/)[0].toUpperCase();
      const cmd = COMMANDS.find((c) => c.code === tok);
      if (cmd) {
        execute(cmd, raw.toUpperCase());
      } else if (/^[A-Z]{1,6}$/.test(tok)) {
        window.dispatchEvent(new CustomEvent('lovable:security-args', { detail: { ticker: tok } }));
        onNavigate('security');
      }
    };
    window.addEventListener('lovable:cli-execute', runner);
    return () => window.removeEventListener('lovable:cli-execute', runner);
  }, [execute]);

  const displayList = showHelp ? COMMANDS : filtered;

  const inputValue = pendingCmd ? countryFilter : value;
  const placeholder = pendingCmd
    ? `${pendingCmd.code} → Select country (${countryInfo.flag} ${selectedCountry})...`
    : focused ? 'Type command...' : 'CMD /';

  return (
    <div className="relative">
      <div className={`flex items-center gap-1 border transition-colors ${
        focused ? 'border-accent-foreground/30 bg-accent-foreground/20' : 'border-accent-foreground/10 bg-accent-foreground/10'
      }`}>
        <span className="text-accent-foreground text-[10px] font-mono font-bold pl-2 select-none">
          {pendingCmd ? `${pendingCmd.code}>` : '>'}
        </span>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => {
            if (pendingCmd) {
              setCountryFilter(e.target.value.toUpperCase());
            } else {
              setValue(e.target.value.toUpperCase());
              setShowHelp(false);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setShowHelp(false); setPendingCmd(null); setCountryFilter(''); }, 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className={`bg-transparent text-accent-foreground text-[11px] font-mono font-bold py-1 pr-2 outline-none placeholder:text-accent-foreground/40 uppercase tracking-wider ${
            pendingCmd ? 'w-56' : 'w-28'
          }`}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-0.5 w-64 bg-card border border-accent/30 shadow-lg z-[100] max-h-72 overflow-y-auto animate-scale-in origin-top-left">
          {showHistory ? (
            <>
              <div className="px-2 py-1 border-b border-accent/20 bg-surface-elevated flex items-center justify-between">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent Commands</span>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setCmdHistory([]); try { localStorage.removeItem('bb-cmd-history'); } catch {} }}
                  className="text-[8px] text-muted-foreground hover:text-foreground"
                >CLR</button>
              </div>
              {cmdHistory.slice(0, 8).map((code, i) => {
                const cmd = COMMANDS.find(c => c.code === code);
                return (
                  <button
                    key={`hist-${code}-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const found = COMMANDS.find(c => c.code === code);
                      if (found) execute(found);
                    }}
                    className="w-full px-2 py-1.5 flex items-center gap-2 text-left hover:bg-surface-elevated transition-colors"
                  >
                    <span className="text-[9px] text-muted-foreground shrink-0">↵</span>
                    <span className="text-[11px] font-mono font-bold w-12 text-accent">{code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">{cmd?.label ?? ''}</span>
                  </button>
                );
              })}
            </>
          ) : pendingCmd ? (
            <>
              <div className="px-2 py-1 border-b border-accent/20 bg-surface-elevated flex items-center gap-2">
                <span className="text-[9px] font-mono text-accent uppercase font-bold">{pendingCmd.code}</span>
                <span className="text-[9px] font-mono text-muted-foreground">→ Pick Region</span>
              </div>
              {filteredCountries.map((c, i) => (
                <button
                  key={c.code}
                  onMouseDown={(e) => { e.preventDefault(); selectCountry(c.code); }}
                  className={`w-full px-2 py-1.5 flex items-center gap-2 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  <span className="text-sm">{c.flag}</span>
                  <span className="text-[11px] font-mono font-bold w-8 text-accent">{c.code}</span>
                  <span className="text-[10px] font-mono text-muted-foreground truncate">{c.name}</span>
                  <span className="text-[9px] font-mono text-muted-foreground ml-auto">{c.currency}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              {showHelp && (
                <div className="px-2 py-1 border-b border-accent/20 bg-surface-elevated">
                  <span className="text-[9px] font-mono text-accent uppercase font-bold">All Commands ({COMMANDS.length})</span>
                </div>
              )}
              {displayList.map((cmd, i) => (
                <button
                  key={`${cmd.code}-${i}`}
                  onMouseDown={(e) => { e.preventDefault(); execute(cmd); }}
                  className={`w-full px-2 py-1.5 flex items-center gap-2 text-left transition-colors ${
                    i === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  <span className={`text-[11px] font-mono font-bold w-12 ${i === selectedIndex ? 'text-accent-foreground' : 'text-accent'}`}>{cmd.code}</span>
                  <span className="text-[10px] font-mono truncate">{cmd.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
