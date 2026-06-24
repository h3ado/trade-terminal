/**
 * IMF Annual Report on Exchange Arrangements and Exchange Restrictions (AREAER)
 * — exchange rate regime classification for ~75 countries.
 *
 * Critical for:
 *   • FX carry trade risk (pegs can break; managed floats can gap)
 *   • Capital controls severity (open → closed accounts)
 *   • Dollarization / euroization (no independent monetary policy)
 *   • Monetary union membership (ECB, WAEMU, ECCB, etc.)
 *
 * Data approximate as of mid-2026. Regime changes noted where significant.
 */

export type RegimeType =
  | 'free_float'       // No intervention; exchange rate market-determined
  | 'managed_float'    // Regular intervention without a target rate
  | 'crawling_peg'     // Rate adjusted periodically by small amounts
  | 'stabilised'       // De facto stable within narrow band
  | 'fixed'            // Hard peg to anchor currency
  | 'currency_board'   // 100% reserve-backed fixed rate
  | 'dollarized'       // Foreign currency as legal tender (no own currency)
  | 'monetary_union';  // Shared currency (ECB, WAEMU, ECCB, etc.)

export type CapitalControls = 'open' | 'partial' | 'closed';

export type CurrencyRegime = {
  regime: RegimeType;
  anchor?: string;       // Anchor currency or basket if pegged
  capitalControls: CapitalControls;
  dollarized: boolean;
  notes?: string;
};

export const CURRENCY_REGIME: Record<string, CurrencyRegime> = {

  // ── Free Float ────────────────────────────────────────────────────────────
  US:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  CA:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  GB:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  AU:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  NZ:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  JP:  { regime: 'free_float', capitalControls: 'open', dollarized: false, notes: 'BOJ YCC dismantled 2024; historical FX interventions' },
  SE:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  NO:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  IS:  { regime: 'free_float', capitalControls: 'partial', dollarized: false, notes: 'Post-2008 crisis; capital controls lifted 2017' },
  PL:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  CZ:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  RO:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  HU:  { regime: 'free_float', capitalControls: 'open', dollarized: false, notes: 'NBH managed interventions 2022-23' },
  MX:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  BR:  { regime: 'free_float', capitalControls: 'partial', dollarized: false, notes: 'BCB intervenes via FX swaps; deep capital market' },
  ZA:  { regime: 'free_float', capitalControls: 'partial', dollarized: false },
  KR:  { regime: 'free_float', capitalControls: 'open', dollarized: false, notes: 'BOK intervenes smoothing; added to WGBI 2025' },
  TR:  { regime: 'free_float', capitalControls: 'partial', dollarized: false, notes: 'Orthodox policy return 2023; prior CBRT rate suppression era over' },
  CO:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  CL:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  PE:  { regime: 'managed_float', anchor: 'USD', capitalControls: 'partial', dollarized: false, notes: 'High financial dollarization ~50%; BCRP smoothes volatility' },
  IL:  { regime: 'free_float', capitalControls: 'open', dollarized: false },
  RU:  { regime: 'managed_float', capitalControls: 'closed', dollarized: false, notes: 'Capital controls since March 2022 sanctions; soft peg to yuan corridor' },
  UA:  { regime: 'managed_float', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'Wartime controls; multi-rate system; IMF-monitored' },

  // ── Managed Float ─────────────────────────────────────────────────────────
  CN:  { regime: 'managed_float', anchor: 'USD basket', capitalControls: 'closed', dollarized: false, notes: 'Daily fixing ±2% band; PBOC daily reference rate; capital account tightly controlled' },
  IN:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'RBI smoothes; included in JPMorgan GBI-EM 2024' },
  SG:  { regime: 'managed_float', anchor: 'NEER basket', capitalControls: 'open', dollarized: false, notes: 'MAS manages NEER slope/band/centre; unique regime; inflation fighting tool' },
  TH:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  ID:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'BI intervenes triple: spot, DNDF, bond' },
  PH:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  MY:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'BNM intervenes; capital controls on ringgit non-deliverable offshore' },
  VN:  { regime: 'managed_float', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'SBV daily band; high financial dollarization; capital controls' },
  KZ:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  UZ:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  NG:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'CBN unified exchange rate 2023; prior multi-tier system' },
  EG:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: '4th devaluation Mar 2024; IMF SBA; float conditions' },
  GH:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'BOG intervenes; cedi depreciation 2022 crisis' },
  KE:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  AR:  { regime: 'crawling_peg', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'Milei crawling peg (2% monthly devaluation → FX liberation promised 2025); cepo controls partial lift; blue rate gap narrowing' },
  TZ:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false },
  MA:  { regime: 'managed_float', anchor: 'EUR/USD basket', capitalControls: 'partial', dollarized: false, notes: 'Dirham peg basket (60% EUR, 40% USD); liberalisation gradual' },
  SA:  { regime: 'fixed', anchor: 'USD', capitalControls: 'open', dollarized: false, notes: 'Hard peg 3.75 SAR/USD since 1986; oil revenue = peg defence' },
  AE:  { regime: 'fixed', anchor: 'USD', capitalControls: 'open', dollarized: false, notes: '3.6725 AED/USD since 1997; CBUAE manages' },
  QA:  { regime: 'fixed', anchor: 'USD', capitalControls: 'open', dollarized: false, notes: '3.64 QAR/USD; backed by LNG revenue' },
  KW:  { regime: 'fixed', anchor: 'USD basket', capitalControls: 'open', dollarized: false, notes: 'KD pegged to basket; not pure USD peg' },
  OM:  { regime: 'fixed', anchor: 'USD', capitalControls: 'open', dollarized: false },
  BH:  { regime: 'fixed', anchor: 'USD', capitalControls: 'open', dollarized: false },
  JO:  { regime: 'fixed', anchor: 'USD', capitalControls: 'partial', dollarized: false, notes: '0.709 JOD/USD since 1995; defended via Gulf grants + IMF' },

  // ── Crawling Peg / Band ───────────────────────────────────────────────────
  BD:  { regime: 'crawling_peg', anchor: 'USD', capitalControls: 'partial', dollarized: false, notes: 'Crawling peg since 2023; prior fixing created parallel market' },
  PK:  { regime: 'managed_float', capitalControls: 'partial', dollarized: false, notes: 'Post-2023 SBA; unified rate; reserves rebuilding' },
  IR:  { regime: 'managed_float', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'NIMA rate + open market rate; sanctions create multiple parallel rates; IRR highly devalued' },

  // ── Fixed / Currency Board ────────────────────────────────────────────────
  HK:  { regime: 'currency_board', anchor: 'USD', capitalControls: 'open', dollarized: false, notes: '7.75–7.85 HKD/USD since 1983; HKMA automatic mechanism; China capital markets conduit' },
  BG:  { regime: 'currency_board', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: '1.956 BGN/EUR since 1997; pre-eurozone' },
  BA:  { regime: 'currency_board', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: 'Convertible mark pegged to EUR; Dayton-era monetary stability tool' },
  LT:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: 'Euro since 2015' },
  LV:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: 'Euro since 2014' },
  EE:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: 'Euro since 2011' },

  // ── Monetary Union (Eurozone) ─────────────────────────────────────────────
  DE:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  FR:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  IT:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  ES:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  NL:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  BE:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  AT:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  PT:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  GR:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  FI:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  IE:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  SK:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  HR:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false, notes: 'Euro since Jan 2023' },
  LU:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  MT:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  CY:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },
  SI:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'open', dollarized: false },

  // ── Dollarized / Foreign currency ────────────────────────────────────────
  EC:  { regime: 'dollarized', anchor: 'USD', capitalControls: 'open', dollarized: true, notes: 'Full dollarization since 2000; no monetary policy lever' },
  PA:  { regime: 'dollarized', anchor: 'USD', capitalControls: 'open', dollarized: true, notes: 'USD since 1904; Balboa 1:1 with USD coins only' },
  SV:  { regime: 'dollarized', anchor: 'USD', capitalControls: 'open', dollarized: true, notes: 'USD + Bitcoin legal tender (Bukele 2021); BTC experiment scaling back' },
  ZW:  { regime: 'dollarized', anchor: 'USD', capitalControls: 'partial', dollarized: true, notes: 'Multi-currency post-2009 hyperinflation; ZiG (gold-backed) 2024 attempt' },
  KP:  { regime: 'managed_float', capitalControls: 'closed', dollarized: false, notes: 'Extreme capital controls; USD/CNY black market dominant; KPW dysfunctional' },
  CU:  { regime: 'fixed', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'MLC (convertible peso) + CUP; dollar shops; extreme distortions under US sanctions' },
  MM:  { regime: 'managed_float', anchor: 'USD', capitalControls: 'closed', dollarized: false, notes: 'Military junta controls; black-market kyat multiple; USD/THB preferred for trade' },

  // ── African monetary unions (CFA) ─────────────────────────────────────────
  CI:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'partial', dollarized: false, notes: 'WAEMU CFA franc (XOF) pegged to EUR; 8 W.African countries' },
  SN:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'partial', dollarized: false, notes: 'WAEMU CFA franc' },
  ML:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'partial', dollarized: false, notes: 'WAEMU; de facto dollarization rising in conflict zones' },
  CM:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'partial', dollarized: false, notes: 'CEMAC CFA franc (XAF)' },
  GA:  { regime: 'monetary_union', anchor: 'EUR', capitalControls: 'partial', dollarized: false, notes: 'CEMAC CFA franc' },
};

export const REGIME_COLOR: Record<RegimeType, string> = {
  free_float:      'hsl(185, 85%, 55%)',
  managed_float:   'hsl(155, 75%, 52%)',
  crawling_peg:    'hsl(45, 90%, 55%)',
  stabilised:      'hsl(55, 85%, 52%)',
  fixed:           'hsl(28, 90%, 55%)',
  currency_board:  'hsl(15, 85%, 55%)',
  dollarized:      'hsl(0, 85%, 52%)',
  monetary_union:  'hsl(220, 75%, 60%)',
};

export const REGIME_LABEL: Record<RegimeType, string> = {
  free_float:      'Free Float',
  managed_float:   'Managed Float',
  crawling_peg:    'Crawling Peg',
  stabilised:      'Stabilised Arrangement',
  fixed:           'Fixed Peg',
  currency_board:  'Currency Board',
  dollarized:      'Dollarized / Foreign CCY',
  monetary_union:  'Monetary Union (EUR/CFA)',
};

export const CAPITAL_CONTROLS_LABEL: Record<CapitalControls, string> = {
  open:    'Open capital account',
  partial: 'Partial controls',
  closed:  'Closed / capital controls',
};

export const CAPITAL_CONTROLS_COLOR: Record<CapitalControls, string> = {
  open:    'hsl(150, 80%, 55%)',
  partial: 'hsl(45, 90%, 55%)',
  closed:  'hsl(0, 85%, 55%)',
};
