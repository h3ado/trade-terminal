import type { OptionsTab } from '@/types/trade';

export interface OptionsModuleDef {
  id: OptionsTab;
  code: string;
  label: string;
  group?: string;
  fkey?: string;
  aliases?: string[];
  defaultSub?: string;
  subTabs?: { id: string; label: string }[];
}

export const optionsModules: OptionsModuleDef[] = [
  { id: 'dash', code: 'DASH', label: 'Dashboard', group: 'OVERVIEW', fkey: 'F1', aliases: ['OPT'] },
  { id: 'omon', code: 'OMON', label: 'Options Matrix', group: 'CHAIN', fkey: 'F2', aliases: ['OMTX'], defaultSub: 'matrix', subTabs: [{ id: 'matrix', label: 'Matrix' }, { id: 'chain', label: 'Side-by-Side' }, { id: 'spread', label: 'Spread Builder' }] },
  { id: 'gamma', code: 'GAMMA', label: 'Gamma Levels', group: 'POSITIONING', fkey: 'F3', aliases: ['GMA'] },
  { id: 'gex', code: 'GEX', label: 'GEX Profile', group: 'POSITIONING', fkey: 'F4', aliases: ['GXP'], defaultSub: 'cockpit', subTabs: [{ id: 'cockpit', label: 'Cockpit' }, { id: 'profile', label: 'Profile' }, { id: 'intraday', label: 'Intraday' }, { id: 'oi', label: 'OI by Expiry' }, { id: 'vanna_p', label: 'Vanna Profile' }, { id: 'charm_p', label: 'Charm Profile' }, { id: 'charm', label: 'Charm Heat' }, { id: 'vanna', label: 'Vanna Heat' }] },
  { id: 'dpi', code: 'DPI', label: 'Dealer Intel', group: 'POSITIONING', fkey: 'F10' },
  { id: 'ovme', code: 'OVME', label: 'Vol Surface', group: 'VOLATILITY', fkey: 'F5', aliases: ['VOLS'], defaultSub: 'pricing', subTabs: [{ id: 'pricing', label: 'Pricing' }, { id: 'greeks', label: 'Greeks' }, { id: 'strategy', label: 'Strategy' }, { id: 'surface', label: '3D Surface' }, { id: 'matrix', label: 'Matrix' }, { id: 'skew', label: 'Skew' }, { id: 'term', label: 'Term Struct' }, { id: 'btest', label: 'Backtest' }] },
  { id: 'maxp', code: 'MAXP', label: 'Max Pain', group: 'POSITIONING', fkey: 'F6', defaultSub: 'current', subTabs: [{ id: 'current', label: 'Current' }, { id: 'drift', label: 'Drift' }] },
  { id: 'pay', code: 'PAY', label: 'Payoff Lab', group: 'STRATEGY', fkey: 'F7', defaultSub: 'single', subTabs: [{ id: 'single', label: 'Single-leg' }, { id: 'greeks', label: 'Greeks vs Spot' }, { id: 'heat', label: 'P&L Heatmap' }] },
  { id: 'flow', code: 'FLOW', label: 'Dealer Flow', group: 'FLOW', fkey: 'F8', aliases: ['DFLO'] },
  { id: 'sent', code: 'SENT', label: 'Sentiment', group: 'FLOW', fkey: 'F9', aliases: ['SENTI'] },
  { id: 'grk', code: 'GRK', label: 'Greeks Book', group: 'STRATEGY', aliases: ['GREEK'], defaultSub: 'agg', subTabs: [{ id: 'agg', label: 'Aggregate' }, { id: 'expiry', label: 'By Expiry' }, { id: 'scenario', label: 'Scenario' }] },
  { id: 'qscr', code: 'QSCR', label: 'Q-Scores', group: 'SCAN', aliases: ['QSC'] },
  { id: 'scan', code: 'SCAN', label: 'Screener', group: 'SCAN', aliases: ['OPTSC'] },
  { id: 'uoa', code: 'UOA', label: 'Unusual Flow', group: 'FLOW' },
  { id: 'earn', code: 'EARN', label: 'Earnings Play', group: 'STRATEGY' },
  { id: 'varb', code: 'VARB', label: 'Vol Arb Lab', group: 'VOLATILITY' },
];

export const optionSubTabs = Object.fromEntries(optionsModules.map(m => [m.id, m.subTabs ?? []])) as Record<OptionsTab, { id: string; label: string }[]>;
export const optionFKeyMap = Object.fromEntries(optionsModules.filter(m => m.fkey).map(m => [m.fkey!, m.id])) as Record<string, OptionsTab>;
export const optionCodeMap = Object.fromEntries(optionsModules.flatMap(m => [m.code, ...(m.aliases ?? [])].map(code => [code, { tab: m.id, sub: m.defaultSub }]))) as Record<string, { tab: OptionsTab; sub?: string }>;

Object.assign(optionCodeMap, {
  CHN: { tab: 'omon', sub: 'chain' },
  SPRD: { tab: 'omon', sub: 'spread' },
  SKEW: { tab: 'ovme', sub: 'term' },
  SMILE: { tab: 'ovme', sub: 'smile' },
  IDG: { tab: 'gex', sub: 'intraday' },
  OID: { tab: 'gex', sub: 'oi' },
  CHARM: { tab: 'gex', sub: 'charm' },
  VANNA: { tab: 'gex', sub: 'vanna' },
  SCEN: { tab: 'grk', sub: 'scenario' },
});
