// Central-bank registry used by CENB and CmdStub headers.
// Policy rates and last-move dates are seeded with public stances; CENB
// will overlay live FRED data where available (US fed funds via DFEDTARU).
export type CBStance = 'Hawkish' | 'Neutral' | 'Dovish';

export interface CentralBank {
  code: string;          // ISO country / bloc
  name: string;          // Long name
  bank: string;          // Bank short name
  rateLabel: string;     // Policy-rate label
  rate: number | null;   // Current policy rate (%)
  lastMoveBps: number;   // Sign indicates direction; magnitude is bps
  lastMoveDate: string;  // YYYY-MM-DD
  nextMeeting: string;   // YYYY-MM-DD
  stance: CBStance;
  flag: string;
  ccy: string;
  region: 'Americas' | 'EMEA' | 'APAC';
  fredKey?: string;      // Optional: pull live rate from useFRED().byKey[key]
}

// Seeded mid-2026 snapshot. Update via CENB live-overlay in a later pass.
export const CENTRAL_BANKS: CentralBank[] = [
  { code: 'US', name: 'United States',  bank: 'Fed',     rateLabel: 'Fed Funds Upper', rate: 4.50,  lastMoveBps: -25, lastMoveDate: '2026-04-29', nextMeeting: '2026-06-17', stance: 'Neutral',  flag: '🇺🇸', ccy: 'USD', region: 'Americas', fredKey: 'fed_funds' },
  { code: 'EU', name: 'Eurozone',       bank: 'ECB',     rateLabel: 'Deposit Rate',    rate: 2.25,  lastMoveBps: -25, lastMoveDate: '2026-04-17', nextMeeting: '2026-06-05', stance: 'Dovish',   flag: '🇪🇺', ccy: 'EUR', region: 'EMEA' },
  { code: 'UK', name: 'United Kingdom', bank: 'BoE',     rateLabel: 'Bank Rate',       rate: 4.00,  lastMoveBps: -25, lastMoveDate: '2026-05-08', nextMeeting: '2026-06-19', stance: 'Neutral',  flag: '🇬🇧', ccy: 'GBP', region: 'EMEA' },
  { code: 'JP', name: 'Japan',          bank: 'BoJ',     rateLabel: 'Policy Rate',     rate: 0.75,  lastMoveBps: +25, lastMoveDate: '2026-03-19', nextMeeting: '2026-06-13', stance: 'Hawkish',  flag: '🇯🇵', ccy: 'JPY', region: 'APAC' },
  { code: 'CN', name: 'China',          bank: 'PBoC',    rateLabel: '7D Reverse Repo', rate: 1.40,  lastMoveBps: -10, lastMoveDate: '2026-05-07', nextMeeting: '2026-06-20', stance: 'Dovish',   flag: '🇨🇳', ccy: 'CNY', region: 'APAC' },
  { code: 'CH', name: 'Switzerland',    bank: 'SNB',     rateLabel: 'Policy Rate',     rate: 0.25,  lastMoveBps: -25, lastMoveDate: '2026-03-20', nextMeeting: '2026-06-19', stance: 'Dovish',   flag: '🇨🇭', ccy: 'CHF', region: 'EMEA' },
  { code: 'CA', name: 'Canada',         bank: 'BoC',     rateLabel: 'Overnight Rate',  rate: 2.75,  lastMoveBps: -25, lastMoveDate: '2026-04-16', nextMeeting: '2026-06-04', stance: 'Neutral',  flag: '🇨🇦', ccy: 'CAD', region: 'Americas' },
  { code: 'AU', name: 'Australia',      bank: 'RBA',     rateLabel: 'Cash Rate',       rate: 3.85,  lastMoveBps: -25, lastMoveDate: '2026-05-20', nextMeeting: '2026-07-08', stance: 'Neutral',  flag: '🇦🇺', ccy: 'AUD', region: 'APAC' },
  { code: 'NZ', name: 'New Zealand',    bank: 'RBNZ',    rateLabel: 'OCR',             rate: 3.25,  lastMoveBps: -25, lastMoveDate: '2026-05-28', nextMeeting: '2026-07-09', stance: 'Dovish',   flag: '🇳🇿', ccy: 'NZD', region: 'APAC' },
  { code: 'NO', name: 'Norway',         bank: 'Norges',  rateLabel: 'Policy Rate',     rate: 4.25,  lastMoveBps: 0,   lastMoveDate: '2025-12-19', nextMeeting: '2026-06-19', stance: 'Hawkish',  flag: '🇳🇴', ccy: 'NOK', region: 'EMEA' },
  { code: 'SE', name: 'Sweden',         bank: 'Riksbank',rateLabel: 'Policy Rate',     rate: 2.00,  lastMoveBps: -25, lastMoveDate: '2026-05-08', nextMeeting: '2026-06-18', stance: 'Dovish',   flag: '🇸🇪', ccy: 'SEK', region: 'EMEA' },
  { code: 'IN', name: 'India',          bank: 'RBI',     rateLabel: 'Repo Rate',       rate: 6.00,  lastMoveBps: -25, lastMoveDate: '2026-04-09', nextMeeting: '2026-06-06', stance: 'Neutral',  flag: '🇮🇳', ccy: 'INR', region: 'APAC' },
  { code: 'BR', name: 'Brazil',         bank: 'BCB',     rateLabel: 'Selic',           rate: 14.75, lastMoveBps: +50, lastMoveDate: '2026-05-07', nextMeeting: '2026-06-18', stance: 'Hawkish',  flag: '🇧🇷', ccy: 'BRL', region: 'Americas' },
  { code: 'MX', name: 'Mexico',         bank: 'Banxico', rateLabel: 'Target Rate',     rate: 8.50,  lastMoveBps: -50, lastMoveDate: '2026-05-15', nextMeeting: '2026-06-26', stance: 'Dovish',   flag: '🇲🇽', ccy: 'MXN', region: 'Americas' },
  { code: 'CL', name: 'Chile',          bank: 'BCCh',    rateLabel: 'TPM',             rate: 4.75,  lastMoveBps: -25, lastMoveDate: '2026-05-29', nextMeeting: '2026-07-29', stance: 'Dovish',   flag: '🇨🇱', ccy: 'CLP', region: 'Americas' },
  { code: 'CO', name: 'Colombia',       bank: 'BanRep',  rateLabel: 'Policy Rate',     rate: 8.75,  lastMoveBps: -25, lastMoveDate: '2026-04-30', nextMeeting: '2026-06-27', stance: 'Dovish',   flag: '🇨🇴', ccy: 'COP', region: 'Americas' },
  { code: 'ZA', name: 'South Africa',   bank: 'SARB',    rateLabel: 'Repo Rate',       rate: 7.25,  lastMoveBps: -25, lastMoveDate: '2026-05-29', nextMeeting: '2026-07-17', stance: 'Neutral',  flag: '🇿🇦', ccy: 'ZAR', region: 'EMEA' },
  { code: 'TR', name: 'Türkiye',        bank: 'TCMB',    rateLabel: '1W Repo',         rate: 46.00, lastMoveBps: -250,lastMoveDate: '2026-04-17', nextMeeting: '2026-06-19', stance: 'Hawkish',  flag: '🇹🇷', ccy: 'TRY', region: 'EMEA' },
  { code: 'KR', name: 'South Korea',    bank: 'BoK',     rateLabel: 'Base Rate',       rate: 2.50,  lastMoveBps: -25, lastMoveDate: '2026-05-29', nextMeeting: '2026-07-10', stance: 'Dovish',   flag: '🇰🇷', ccy: 'KRW', region: 'APAC' },
  { code: 'ID', name: 'Indonesia',      bank: 'BI',      rateLabel: '7D Reverse Repo', rate: 5.50,  lastMoveBps: -25, lastMoveDate: '2026-05-21', nextMeeting: '2026-06-18', stance: 'Neutral',  flag: '🇮🇩', ccy: 'IDR', region: 'APAC' },
  { code: 'TH', name: 'Thailand',       bank: 'BoT',     rateLabel: '1D Repo',         rate: 1.75,  lastMoveBps: -25, lastMoveDate: '2026-04-30', nextMeeting: '2026-06-25', stance: 'Dovish',   flag: '🇹🇭', ccy: 'THB', region: 'APAC' },
  { code: 'PH', name: 'Philippines',    bank: 'BSP',     rateLabel: 'O/N Repo',        rate: 5.25,  lastMoveBps: -25, lastMoveDate: '2026-04-10', nextMeeting: '2026-06-19', stance: 'Neutral',  flag: '🇵🇭', ccy: 'PHP', region: 'APAC' },
  { code: 'MY', name: 'Malaysia',       bank: 'BNM',     rateLabel: 'OPR',             rate: 3.00,  lastMoveBps: 0,   lastMoveDate: '2023-05-03', nextMeeting: '2026-07-10', stance: 'Neutral',  flag: '🇲🇾', ccy: 'MYR', region: 'APAC' },
  { code: 'IL', name: 'Israel',         bank: 'BoI',     rateLabel: 'Policy Rate',     rate: 4.25,  lastMoveBps: -25, lastMoveDate: '2026-05-26', nextMeeting: '2026-07-07', stance: 'Neutral',  flag: '🇮🇱', ccy: 'ILS', region: 'EMEA' },
  { code: 'PL', name: 'Poland',         bank: 'NBP',     rateLabel: 'Ref Rate',        rate: 5.00,  lastMoveBps: -50, lastMoveDate: '2026-05-07', nextMeeting: '2026-06-04', stance: 'Dovish',   flag: '🇵🇱', ccy: 'PLN', region: 'EMEA' },
];

export const COUNTRY_TO_ISO3: Record<string, string> = {
  US: 'USA', UK: 'GBR', EU: 'EMU', JP: 'JPN', CN: 'CHN', DE: 'DEU', FR: 'FRA',
  CA: 'CAN', AU: 'AUS', IN: 'IND', BR: 'BRA', KR: 'KOR', MX: 'MEX', CH: 'CHE',
};

export const COUNTRY_TO_INDEX: Record<string, string> = {
  US: 'NYSE', UK: 'LSE', EU: 'XETR', DE: 'XETR', FR: 'PAR', JP: 'TSE',
  CN: 'SSE', CA: 'TSX', AU: 'ASX', IN: 'BSE', BR: 'B3', KR: 'KRX',
  MX: 'BMV', CH: 'SIX',
};
