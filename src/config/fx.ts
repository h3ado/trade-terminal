export type FxTab =
  | 'home' | 'wfx' | 'fxc' | 'fxip' | 'fxfa' | 'fxtf' | 'fxfc' | 'fxca' | 'tkc'
  | 'wcr' | 'frd' | 'wcrs' | 'wira' | 'fxv' | 'fxop' | 'carry' | 'fxh' | 'fxnw';

export const fxTabs: { id: FxTab; label: string; code: string; aliases?: string[] }[] = [
  { id: 'home',  label: 'Overview',     code: 'FX' },
  { id: 'wfx',   label: 'World FX',     code: 'WFX' },
  { id: 'fxc',   label: 'Cross Matrix', code: 'FXC' },
  { id: 'fxip',  label: 'FX Portal',    code: 'FXIP' },
  { id: 'fxfa',  label: 'Fundamentals', code: 'FXFA' },
  { id: 'fxtf',  label: 'Tech Chart',   code: 'FXTF' },
  { id: 'wcrs',  label: 'Performance',  code: 'WCRS' },
  { id: 'tkc',   label: 'Region FX',    code: 'TKC' },
  { id: 'wcr',   label: 'World Spots',  code: 'WCR' },
  { id: 'frd',   label: 'Forwards',     code: 'FRD' },
  { id: 'carry', label: 'Carry',        code: 'CARRY' },
  { id: 'fxv',   label: 'Vol Surface',  code: 'FXV' },
  { id: 'fxop',  label: 'Options',      code: 'FXOP' },
  { id: 'fxfc',  label: 'Forecasts',    code: 'FXFC' },
  { id: 'fxca',  label: 'Calculator',   code: 'FXCA' },
  { id: 'wira',  label: 'Reserves',     code: 'WIRA' },
  { id: 'fxh',   label: 'History',      code: 'FXH' },
  { id: 'fxnw',  label: 'News',         code: 'FXNW' },
];
