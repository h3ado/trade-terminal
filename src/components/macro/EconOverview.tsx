import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMacroCountry, MacroCountry } from '@/contexts/MacroCountryContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailGrid, DetailSection, DetailStat, DetailMiniChart, DetailKV } from './MacroExpandable';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Indicator {
  name: string;
  code: string;
  value: string;
  prev: string;
  change: number;
  unit: string;
  frequency: string;
  nextRelease: string;
  source: string;
  history?: { label: string; value: number }[];
  details?: { label: string; value: string; color?: string }[];
  description?: string;
}

// Generate synthetic history for an indicator
const genHistory = (current: number, months = 6): { label: string; value: number }[] => {
  const labels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return labels.slice(0, months).map((label, i) => ({
    label,
    value: +(current + (Math.random() - 0.5) * Math.abs(current * 0.15)).toFixed(2),
  }));
};

const countryData: Record<string, Indicator[]> = {
  US: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '2.80', prev: '3.00', change: -0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-04-30', source: 'BEA', description: 'Annualized quarterly real GDP growth rate. Key measure of economic expansion.', details: [{ label: 'Nominal GDP', value: '$28.78T' }, { label: 'Real GDP QoQ SAAR', value: '2.8%' }, { label: 'GDP Price Index', value: '1.7%' }, { label: 'Consumer Spending', value: '+3.1%', color: 'text-positive' }, { label: 'Business Investment', value: '+2.4%', color: 'text-positive' }, { label: 'Govt Spending', value: '+4.2%', color: 'text-positive' }, { label: 'Net Exports', value: '-0.8%', color: 'text-negative' }] },
    { name: 'CPI YoY', code: 'CPI', value: '3.20', prev: '3.40', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-14', source: 'BLS', description: 'Consumer Price Index year-over-year change. Primary inflation gauge.', details: [{ label: 'CPI MoM', value: '0.4%' }, { label: 'Core CPI MoM', value: '0.4%' }, { label: 'Core CPI YoY', value: '3.6%' }, { label: 'Shelter YoY', value: '5.8%', color: 'text-negative' }, { label: 'Food YoY', value: '2.2%' }, { label: 'Energy YoY', value: '-1.4%', color: 'text-positive' }, { label: 'Supercore', value: '4.3%', color: 'text-negative' }] },
    { name: 'Core CPI YoY', code: 'CCPI', value: '3.60', prev: '3.80', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-14', source: 'BLS', description: 'CPI excluding food and energy. Fed\'s preferred stickiness gauge.', details: [{ label: 'Core Goods', value: '-0.3%', color: 'text-positive' }, { label: 'Core Services', value: '5.2%', color: 'text-negative' }, { label: 'Trimmed Mean CPI', value: '3.4%' }, { label: 'Median CPI', value: '4.8%', color: 'text-negative' }] },
    { name: 'PCE Price Index', code: 'PCE', value: '2.50', prev: '2.60', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'BEA', description: 'Personal Consumption Expenditures price index. The Fed\'s preferred inflation measure.', details: [{ label: 'Core PCE YoY', value: '2.8%' }, { label: 'PCE MoM', value: '0.3%' }, { label: 'Core PCE MoM', value: '0.3%' }, { label: 'Services PCE', value: '3.9%', color: 'text-negative' }, { label: 'Goods PCE', value: '0.2%', color: 'text-positive' }] },
    { name: 'Core PCE', code: 'CPCE', value: '2.80', prev: '2.90', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'BEA', description: 'Core PCE excludes food and energy. Fed\'s 2% target measure.' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '3.90', prev: '3.80', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'BLS', description: 'U-3 official unemployment rate from the household survey.', details: [{ label: 'U-6 Rate', value: '7.3%' }, { label: 'Labor Force Part.', value: '62.5%' }, { label: 'Prime-Age LFPR', value: '83.5%' }, { label: 'Long-Term Unemp', value: '1.2%' }, { label: 'Employment/Pop', value: '60.1%' }] },
    { name: 'Non-Farm Payrolls', code: 'NFP', value: '275', prev: '229', change: 46, unit: 'K', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'BLS', description: 'Monthly change in non-farm employment. Most watched labor market indicator.', details: [{ label: 'Private Payrolls', value: '+248K', color: 'text-positive' }, { label: 'Government', value: '+27K' }, { label: 'Manufacturing', value: '-4K', color: 'text-negative' }, { label: 'Services', value: '+252K', color: 'text-positive' }, { label: 'Revisions (Net)', value: '-12K', color: 'text-negative' }, { label: 'Avg Hourly Earnings', value: '4.1% YoY' }] },
    { name: 'ISM Manufacturing', code: 'ISMM', value: '50.30', prev: '49.10', change: 1.20, unit: '', frequency: 'Monthly', nextRelease: '2026-05-01', source: 'ISM', description: 'ISM Manufacturing PMI. Above 50 = expansion.', details: [{ label: 'New Orders', value: '51.4' }, { label: 'Production', value: '52.1' }, { label: 'Employment', value: '48.4', color: 'text-negative' }, { label: 'Supplier Deliv.', value: '50.8' }, { label: 'Inventories', value: '48.2', color: 'text-negative' }, { label: 'Prices Paid', value: '55.8', color: 'text-negative' }] },
    { name: 'ISM Services', code: 'ISMS', value: '52.60', prev: '53.40', change: -0.80, unit: '', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'ISM', description: 'ISM Non-Manufacturing PMI covering ~80% of the economy.', details: [{ label: 'Business Activity', value: '55.2', color: 'text-positive' }, { label: 'New Orders', value: '54.8', color: 'text-positive' }, { label: 'Employment', value: '50.4' }, { label: 'Prices Paid', value: '58.2', color: 'text-negative' }] },
    { name: 'Consumer Confidence', code: 'CONC', value: '104.70', prev: '106.70', change: -2.0, unit: '', frequency: 'Monthly', nextRelease: '2026-04-29', source: 'Conf Board', description: 'Conference Board Consumer Confidence Index.', details: [{ label: 'Present Situation', value: '147.2' }, { label: 'Expectations', value: '76.3' }, { label: 'Jobs Plentiful', value: '39.8%' }, { label: 'Jobs Hard to Get', value: '14.2%' }] },
    { name: 'Retail Sales MoM', code: 'RTSL', value: '0.60', prev: '0.30', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-16', source: 'Census', description: 'Monthly change in retail and food services sales.' },
    { name: 'Industrial Production', code: 'INDP', value: '0.10', prev: '-0.20', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'Fed' },
    { name: 'Housing Starts', code: 'HSTR', value: '1.52', prev: '1.46', change: 0.06, unit: 'M', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'Census' },
    { name: 'Building Permits', code: 'BPMT', value: '1.49', prev: '1.47', change: 0.02, unit: 'M', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'Census' },
    { name: 'Initial Jobless Claims', code: 'IJCL', value: '212', prev: '220', change: -8, unit: 'K', frequency: 'Weekly', nextRelease: '2026-04-17', source: 'DOL', description: 'Weekly initial unemployment insurance claims.', details: [{ label: 'Continuing Claims', value: '1.82M' }, { label: '4-Week Average', value: '218K' }, { label: 'Insured Unemp Rate', value: '1.2%' }] },
    { name: 'Michigan Consumer Sent.', code: 'MICH', value: '76.90', prev: '79.40', change: -2.50, unit: '', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'UMich', details: [{ label: 'Current Conditions', value: '82.4' }, { label: 'Expectations', value: '73.2' }, { label: '1Y Inflation Exp', value: '3.0%' }, { label: '5Y Inflation Exp', value: '2.9%' }] },
    { name: 'Trade Balance', code: 'TRBL', value: '-68.90', prev: '-65.20', change: -3.70, unit: '$B', frequency: 'Monthly', nextRelease: '2026-05-06', source: 'Census' },
    { name: 'Fed Funds Rate', code: 'FFRT', value: '5.50', prev: '5.50', change: 0, unit: '%', frequency: 'FOMC', nextRelease: '2026-05-07', source: 'Fed', details: [{ label: 'Target Range', value: '5.25–5.50%' }, { label: 'Effective FFR', value: '5.33%' }, { label: 'SOFR', value: '5.31%' }, { label: 'Next FOMC', value: 'May 7, 2026' }] },
    { name: 'M2 Money Supply YoY', code: 'M2MS', value: '3.70', prev: '3.50', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-22', source: 'Fed' },
    { name: 'US 10Y Treasury', code: 'US10', value: '4.28', prev: '4.32', change: -0.04, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'Treasury', details: [{ label: '2Y Yield', value: '4.72%' }, { label: '5Y Yield', value: '4.28%' }, { label: '30Y Yield', value: '4.45%' }, { label: '2s10s Spread', value: '-44bp', color: 'text-negative' }, { label: 'Real 10Y (TIPS)', value: '2.08%' }, { label: '10Y Breakeven', value: '2.20%' }] },
    { name: 'Capacity Utilization', code: 'CAPU', value: '78.30', prev: '78.50', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'Fed' },
    { name: 'Current Account', code: 'CACT', value: '-194.80', prev: '-196.40', change: 1.60, unit: '$B', frequency: 'Quarterly', nextRelease: '2026-06-18', source: 'BEA' },
    { name: 'Budget Deficit (12M)', code: 'BDEF', value: '-1842', prev: '-1695', change: -147, unit: '$B', frequency: 'Monthly', nextRelease: '2026-05-12', source: 'Treasury' },
    { name: 'Productivity QoQ', code: 'PROD', value: '3.20', prev: '2.80', change: 0.40, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-02', source: 'BLS' },
    { name: 'Unit Labor Costs', code: 'ULC', value: '0.40', prev: '1.80', change: -1.40, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-02', source: 'BLS' },
  ],
  UK: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '0.60', prev: '0.40', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-15', source: 'ONS' },
    { name: 'CPI YoY', code: 'CPI', value: '3.40', prev: '3.20', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-16', source: 'ONS' },
    { name: 'Core CPI YoY', code: 'CCPI', value: '4.20', prev: '4.00', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-16', source: 'ONS' },
    { name: 'RPI YoY', code: 'RPI', value: '4.80', prev: '4.60', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-16', source: 'ONS' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '4.20', prev: '4.10', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'ONS' },
    { name: 'Employment Change', code: 'EMPC', value: '48', prev: '72', change: -24, unit: 'K', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'ONS' },
    { name: 'Avg Earnings ex-Bonus', code: 'EARN', value: '6.10', prev: '6.20', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'ONS' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '47.50', prev: '47.00', change: 0.50, unit: '', frequency: 'Monthly', nextRelease: '2026-05-01', source: 'S&P' },
    { name: 'PMI Services', code: 'PMIS', value: '53.80', prev: '53.20', change: 0.60, unit: '', frequency: 'Monthly', nextRelease: '2026-05-03', source: 'S&P' },
    { name: 'Retail Sales MoM', code: 'RTSL', value: '0.20', prev: '0.40', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-18', source: 'ONS' },
    { name: 'Industrial Production', code: 'INDP', value: '0.10', prev: '-0.20', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-11', source: 'ONS' },
    { name: 'BoE Bank Rate', code: 'BOER', value: '5.25', prev: '5.25', change: 0, unit: '%', frequency: 'MPC', nextRelease: '2026-05-09', source: 'BoE' },
    { name: 'GfK Consumer Confidence', code: 'GFKC', value: '-21', prev: '-22', change: 1, unit: '', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'GfK' },
    { name: 'Gilt 10Y Yield', code: 'UK10', value: '4.12', prev: '4.18', change: -0.06, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'BoE' },
    { name: 'Trade Balance', code: 'TRBL', value: '-4.82', prev: '-5.24', change: 0.42, unit: '£B', frequency: 'Monthly', nextRelease: '2026-04-11', source: 'ONS' },
  ],
  EU: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '0.30', prev: '0.10', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-04-30', source: 'Eurostat' },
    { name: 'HICP YoY', code: 'HICP', value: '2.60', prev: '2.80', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'Eurostat' },
    { name: 'Core HICP YoY', code: 'CHICP', value: '3.10', prev: '3.30', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'Eurostat' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '6.40', prev: '6.40', change: 0, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-30', source: 'Eurostat' },
    { name: 'PMI Composite', code: 'PMIC', value: '49.80', prev: '49.40', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'S&P' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '46.80', prev: '46.50', change: 0.30, unit: '', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'S&P' },
    { name: 'ECB Deposit Rate', code: 'ECBR', value: '4.00', prev: '4.00', change: 0, unit: '%', frequency: 'ECB', nextRelease: '2026-04-17', source: 'ECB' },
    { name: 'Retail Sales MoM', code: 'RTSL', value: '0.10', prev: '0.30', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-06', source: 'Eurostat' },
    { name: 'Industrial Production', code: 'INDP', value: '-0.40', prev: '-0.80', change: 0.40, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-14', source: 'Eurostat' },
    { name: 'ZEW Sentiment (DE)', code: 'ZEW', value: '19.90', prev: '17.50', change: 2.40, unit: '', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'ZEW' },
    { name: 'Bund 10Y Yield', code: 'DE10', value: '2.42', prev: '2.48', change: -0.06, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'Buba' },
    { name: 'Trade Balance', code: 'TRBL', value: '28.40', prev: '24.80', change: 3.60, unit: '€B', frequency: 'Monthly', nextRelease: '2026-05-15', source: 'Eurostat' },
  ],
  JP: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '1.90', prev: '2.00', change: -0.10, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-16', source: 'Cabinet' },
    { name: 'CPI YoY', code: 'CPI', value: '2.80', prev: '2.60', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-18', source: 'MIC' },
    { name: 'Core CPI YoY', code: 'CCPI', value: '2.80', prev: '2.60', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-18', source: 'MIC' },
    { name: 'Core-Core CPI', code: 'CCCPI', value: '3.50', prev: '3.30', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-18', source: 'MIC' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '2.50', prev: '2.40', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-29', source: 'MIC' },
    { name: 'Tankan Large Mfg', code: 'TANK', value: '12', prev: '13', change: -1, unit: '', frequency: 'Quarterly', nextRelease: '2026-07-01', source: 'BoJ' },
    { name: 'Industrial Production', code: 'INDP', value: '-0.80', prev: '2.40', change: -3.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-28', source: 'METI' },
    { name: 'BoJ Policy Rate', code: 'BOJR', value: '0.10', prev: '-0.10', change: 0.20, unit: '%', frequency: 'BoJ', nextRelease: '2026-04-26', source: 'BoJ' },
    { name: 'Machine Orders MoM', code: 'MORD', value: '-1.20', prev: '2.70', change: -3.90, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-19', source: 'Cabinet' },
    { name: 'JGB 10Y Yield', code: 'JP10', value: '0.78', prev: '0.74', change: 0.04, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'MoF' },
    { name: 'Trade Balance', code: 'TRBL', value: '-0.42', prev: '-0.18', change: -0.24, unit: '¥T', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'MoF' },
    { name: 'Household Spending YoY', code: 'HSPE', value: '-0.50', prev: '-2.50', change: 2.00, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-10', source: 'MIC' },
  ],
  CN: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '5.20', prev: '5.00', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-07-15', source: 'NBS' },
    { name: 'CPI YoY', code: 'CPI', value: '0.70', prev: '0.80', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-11', source: 'NBS' },
    { name: 'PPI YoY', code: 'PPI', value: '-2.80', prev: '-2.50', change: -0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-11', source: 'NBS' },
    { name: 'PMI Manufacturing (NBS)', code: 'PMIM', value: '50.80', prev: '50.40', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-04-30', source: 'NBS' },
    { name: 'Caixin PMI Mfg', code: 'CXPM', value: '51.10', prev: '50.80', change: 0.30, unit: '', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'Caixin' },
    { name: 'Industrial Production', code: 'INDP', value: '7.00', prev: '6.80', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-17', source: 'NBS' },
    { name: 'Retail Sales YoY', code: 'RTSL', value: '5.50', prev: '5.20', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-17', source: 'NBS' },
    { name: 'Fixed Asset Inv. YTD', code: 'FAI', value: '4.20', prev: '4.00', change: 0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-17', source: 'NBS' },
    { name: 'PBOC LPR 1Y', code: 'LPR1', value: '3.45', prev: '3.55', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-20', source: 'PBOC' },
    { name: 'Trade Balance', code: 'TRBL', value: '88.20', prev: '75.40', change: 12.80, unit: '$B', frequency: 'Monthly', nextRelease: '2026-05-09', source: 'GAC' },
    { name: 'FX Reserves', code: 'FXRS', value: '3.22', prev: '3.24', change: -0.02, unit: '$T', frequency: 'Monthly', nextRelease: '2026-05-07', source: 'PBOC' },
    { name: 'Youth Unemployment', code: 'YUEM', value: '14.90', prev: '15.30', change: -0.40, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-17', source: 'NBS' },
  ],
  IN: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '7.80', prev: '7.60', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-31', source: 'MoSPI' },
    { name: 'CPI YoY', code: 'CPI', value: '5.40', prev: '5.10', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-13', source: 'MoSPI' },
    { name: 'WPI YoY', code: 'WPI', value: '0.20', prev: '-0.10', change: 0.30, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-14', source: 'DIPP' },
    { name: 'RBI Repo Rate', code: 'RBIR', value: '6.50', prev: '6.50', change: 0, unit: '%', frequency: 'RBI', nextRelease: '2026-06-06', source: 'RBI' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '56.80', prev: '56.20', change: 0.60, unit: '', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'S&P' },
    { name: 'Industrial Production', code: 'INDP', value: '3.80', prev: '3.20', change: 0.60, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-12', source: 'MoSPI' },
    { name: 'Trade Balance', code: 'TRBL', value: '-18.40', prev: '-20.20', change: 1.80, unit: '$B', frequency: 'Monthly', nextRelease: '2026-05-15', source: 'MoC' },
    { name: '10Y Govt Bond', code: 'IN10', value: '7.12', prev: '7.18', change: -0.06, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'RBI' },
  ],
  DE: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '-0.10', prev: '-0.30', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-04-30', source: 'Destatis' },
    { name: 'CPI YoY', code: 'CPI', value: '2.40', prev: '2.60', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-29', source: 'Destatis' },
    { name: 'HICP YoY', code: 'HICP', value: '2.70', prev: '2.90', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-29', source: 'Destatis' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '5.90', prev: '5.80', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-30', source: 'BA' },
    { name: 'IFO Business Climate', code: 'IFO', value: '87.80', prev: '86.40', change: 1.40, unit: '', frequency: 'Monthly', nextRelease: '2026-04-24', source: 'IFO' },
    { name: 'ZEW Expectations', code: 'ZEW', value: '19.90', prev: '17.50', change: 2.40, unit: '', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'ZEW' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '42.60', prev: '42.20', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'S&P' },
    { name: 'PMI Services', code: 'PMIS', value: '49.80', prev: '49.20', change: 0.60, unit: '', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'S&P' },
    { name: 'Industrial Production', code: 'INDP', value: '-1.20', prev: '-2.40', change: 1.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-08', source: 'Destatis' },
    { name: 'Trade Balance', code: 'TRBL', value: '22.20', prev: '20.40', change: 1.80, unit: '€B', frequency: 'Monthly', nextRelease: '2026-05-09', source: 'Destatis' },
    { name: 'GfK Consumer Confidence', code: 'GFKC', value: '-27.40', prev: '-28.80', change: 1.40, unit: '', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'GfK' },
    { name: 'Bund 10Y Yield', code: 'DE10', value: '2.42', prev: '2.48', change: -0.06, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'Buba' },
  ],
  FR: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '0.90', prev: '0.70', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-04-30', source: 'INSEE' },
    { name: 'CPI YoY', code: 'CPI', value: '2.20', prev: '2.40', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'INSEE' },
    { name: 'HICP YoY', code: 'HICP', value: '2.60', prev: '2.80', change: -0.20, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-15', source: 'INSEE' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '7.30', prev: '7.30', change: 0, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-16', source: 'INSEE' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '46.20', prev: '45.80', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-02', source: 'S&P' },
    { name: 'PMI Services', code: 'PMIS', value: '48.40', prev: '48.00', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'S&P' },
    { name: 'Industrial Production', code: 'INDP', value: '0.20', prev: '-0.80', change: 1.00, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-10', source: 'INSEE' },
    { name: 'Consumer Confidence', code: 'CONC', value: '89', prev: '91', change: -2, unit: '', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'INSEE' },
    { name: 'Trade Balance', code: 'TRBL', value: '-7.80', prev: '-8.20', change: 0.40, unit: '€B', frequency: 'Monthly', nextRelease: '2026-05-07', source: 'Customs' },
    { name: 'Budget Balance', code: 'BDGT', value: '-154.20', prev: '-142.80', change: -11.40, unit: '€B', frequency: 'Monthly', nextRelease: '2026-04-24', source: 'DGFiP' },
    { name: 'OAT 10Y Yield', code: 'FR10', value: '2.92', prev: '2.98', change: -0.06, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'AFT' },
  ],
  MX: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '3.40', prev: '3.20', change: 0.20, unit: '%', frequency: 'Quarterly', nextRelease: '2026-04-30', source: 'INEGI' },
    { name: 'CPI YoY', code: 'CPI', value: '4.20', prev: '4.40', change: -0.20, unit: '%', frequency: 'Biweekly', nextRelease: '2026-04-24', source: 'INEGI' },
    { name: 'Core CPI YoY', code: 'CCPI', value: '4.80', prev: '5.00', change: -0.20, unit: '%', frequency: 'Biweekly', nextRelease: '2026-04-24', source: 'INEGI' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '2.70', prev: '2.80', change: -0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'INEGI' },
    { name: 'Banxico Rate', code: 'BNXR', value: '11.25', prev: '11.25', change: 0, unit: '%', frequency: 'Banxico', nextRelease: '2026-05-09', source: 'Banxico' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '51.40', prev: '51.00', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-01', source: 'S&P' },
    { name: 'Industrial Production', code: 'INDP', value: '2.80', prev: '2.40', change: 0.40, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'INEGI' },
    { name: 'Retail Sales YoY', code: 'RTSL', value: '3.40', prev: '2.80', change: 0.60, unit: '%', frequency: 'Monthly', nextRelease: '2026-04-23', source: 'INEGI' },
    { name: 'Trade Balance', code: 'TRBL', value: '-3.24', prev: '-4.18', change: 0.94, unit: '$B', frequency: 'Monthly', nextRelease: '2026-04-25', source: 'INEGI' },
    { name: 'Consumer Confidence', code: 'CONC', value: '47.20', prev: '46.80', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-06', source: 'INEGI' },
    { name: 'Remittances', code: 'REMS', value: '5.48', prev: '4.82', change: 0.66, unit: '$B', frequency: 'Monthly', nextRelease: '2026-05-01', source: 'Banxico' },
    { name: 'MBONO 10Y Yield', code: 'MX10', value: '9.82', prev: '9.94', change: -0.12, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'Banxico' },
  ],
  CH: [
    { name: 'GDP Growth Rate', code: 'GDP', value: '0.80', prev: '0.70', change: 0.10, unit: '%', frequency: 'Quarterly', nextRelease: '2026-05-30', source: 'SECO' },
    { name: 'CPI YoY', code: 'CPI', value: '1.30', prev: '1.20', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'FSO' },
    { name: 'Core CPI YoY', code: 'CCPI', value: '1.10', prev: '1.00', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-05', source: 'FSO' },
    { name: 'Unemployment Rate', code: 'UNEMP', value: '2.30', prev: '2.20', change: 0.10, unit: '%', frequency: 'Monthly', nextRelease: '2026-05-08', source: 'SECO' },
    { name: 'SNB Policy Rate', code: 'SNBR', value: '1.75', prev: '1.75', change: 0, unit: '%', frequency: 'SNB', nextRelease: '2026-06-20', source: 'SNB' },
    { name: 'PMI Manufacturing', code: 'PMIM', value: '44.40', prev: '44.00', change: 0.40, unit: '', frequency: 'Monthly', nextRelease: '2026-05-01', source: 'procure.ch' },
    { name: 'KOF Leading Indicator', code: 'KOF', value: '101.80', prev: '100.20', change: 1.60, unit: '', frequency: 'Monthly', nextRelease: '2026-04-30', source: 'KOF' },
    { name: 'Trade Balance', code: 'TRBL', value: '4.82', prev: '3.94', change: 0.88, unit: 'CHF B', frequency: 'Monthly', nextRelease: '2026-04-17', source: 'FCA' },
    { name: 'Sight Deposits', code: 'SDEP', value: '478.20', prev: '482.40', change: -4.20, unit: 'CHF B', frequency: 'Weekly', nextRelease: '2026-04-14', source: 'SNB' },
    { name: 'Swiss Govt 10Y', code: 'CH10', value: '0.88', prev: '0.92', change: -0.04, unit: '%', frequency: 'Daily', nextRelease: '-', source: 'SNB' },
  ],
};

// Trend chart data by country
const trendData: Record<string, { month: string; gdp: number; cpi: number; unemp: number }[]> = {
  US: [
    { month: 'Oct', gdp: 2.9, cpi: 3.7, unemp: 3.8 }, { month: 'Nov', gdp: 2.9, cpi: 3.4, unemp: 3.7 },
    { month: 'Dec', gdp: 3.0, cpi: 3.3, unemp: 3.7 }, { month: 'Jan', gdp: 3.0, cpi: 3.1, unemp: 3.7 },
    { month: 'Feb', gdp: 3.0, cpi: 3.4, unemp: 3.8 }, { month: 'Mar', gdp: 2.8, cpi: 3.2, unemp: 3.9 },
  ],
  UK: [
    { month: 'Oct', gdp: 0.0, cpi: 4.6, unemp: 4.2 }, { month: 'Nov', gdp: 0.1, cpi: 3.9, unemp: 4.1 },
    { month: 'Dec', gdp: 0.2, cpi: 4.0, unemp: 4.0 }, { month: 'Jan', gdp: 0.3, cpi: 3.4, unemp: 4.0 },
    { month: 'Feb', gdp: 0.4, cpi: 3.4, unemp: 4.1 }, { month: 'Mar', gdp: 0.6, cpi: 3.4, unemp: 4.2 },
  ],
  EU: [
    { month: 'Oct', gdp: -0.1, cpi: 2.9, unemp: 6.5 }, { month: 'Nov', gdp: -0.1, cpi: 2.4, unemp: 6.5 },
    { month: 'Dec', gdp: 0.0, cpi: 2.9, unemp: 6.4 }, { month: 'Jan', gdp: 0.0, cpi: 2.8, unemp: 6.4 },
    { month: 'Feb', gdp: 0.1, cpi: 2.6, unemp: 6.4 }, { month: 'Mar', gdp: 0.3, cpi: 2.6, unemp: 6.4 },
  ],
  JP: [
    { month: 'Oct', gdp: 1.2, cpi: 3.3, unemp: 2.5 }, { month: 'Nov', gdp: 1.4, cpi: 2.8, unemp: 2.5 },
    { month: 'Dec', gdp: 1.6, cpi: 2.6, unemp: 2.4 }, { month: 'Jan', gdp: 1.8, cpi: 2.2, unemp: 2.4 },
    { month: 'Feb', gdp: 2.0, cpi: 2.6, unemp: 2.4 }, { month: 'Mar', gdp: 1.9, cpi: 2.8, unemp: 2.5 },
  ],
  CN: [
    { month: 'Oct', gdp: 4.9, cpi: -0.2, unemp: 5.0 }, { month: 'Nov', gdp: 4.9, cpi: -0.5, unemp: 5.0 },
    { month: 'Dec', gdp: 5.0, cpi: -0.3, unemp: 5.1 }, { month: 'Jan', gdp: 5.0, cpi: 0.8, unemp: 5.2 },
    { month: 'Feb', gdp: 5.0, cpi: 0.7, unemp: 5.3 }, { month: 'Mar', gdp: 5.2, cpi: 0.7, unemp: 5.3 },
  ],
};

const getCountryTrend = (code: string) => trendData[code] || trendData['US'];

const fire = (code: string) =>
  window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } }));

// Map indicator codes to CLI navigation targets
const CODE_NAV: Record<string, string> = {
  GDP: 'GDP', CPI: 'CPI', CCPI: 'CPI', PCE: 'PCE', CPCE: 'PCE',
  UNEMP: 'UNEMP', NFP: 'NFP', ISMM: 'ISM', ISMS: 'ISM',
  IJCL: 'UNEMP', PROD: 'GDP', ULC: 'GDP',
  FFRT: 'FED', M2MS: 'FED', BDEF: 'FED',
  BOJR: 'FED', ECBR: 'FED', BOER: 'FED', SNBR: 'FED', RBIR: 'FED', BNXR: 'FED',
};

export default function EconOverview() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();

  const indicators = countryData[selectedCountry] || countryData['US'];
  const trend = getCountryTrend(selectedCountry);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{countryInfo.flag}</span>
          <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Economic Indicators</span>
          <span className="text-muted-foreground font-mono text-[9px]">ECST &lt;GO&gt;</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-muted-foreground">Click rows to expand</span>
          <span className="text-muted-foreground font-mono text-[9px]">Last Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Mini trend chart */}
      <div className="border-b border-border pb-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">Key Macro Trends — GDP / CPI / Unemployment</div>
        <ExpandableResponsiveContainer width="100%" height={160}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`${v}%`]} />
            <Line type="monotone" dataKey="gdp" stroke="hsl(var(--positive))" strokeWidth={2} name="GDP" />
            <Line type="monotone" dataKey="cpi" stroke="hsl(var(--negative))" strokeWidth={2} name="CPI" />
            <Line type="monotone" dataKey="unemp" stroke="hsl(var(--accent))" strokeWidth={1} strokeDasharray="4 4" name="Unemp" />
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left px-2 py-1.5 text-accent font-bold w-5"></th>
              <th className="text-left px-2 py-1.5 text-accent font-bold">CODE</th>
              <th className="text-left px-2 py-1.5 text-accent font-bold">INDICATOR</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">ACTUAL</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">PREV</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">CHG</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">UNIT</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">FREQ</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">NEXT</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">SRC</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind, i) => {
              const expanded = isExpanded(ind.code);
              const history = ind.history || genHistory(parseFloat(ind.value));
              return (
                <ExpandableRow
                  key={ind.code}
                  id={ind.code}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={10}
                  className={`${i % 2 === 0 ? 'bg-surface-primary' : 'bg-surface-elevated/30'}`}
                  cells={
                    <>
                      <td className="px-1 py-1 w-5">
                        <ExpandIcon isExpanded={expanded} />
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); fire(CODE_NAV[ind.code] || 'ECST'); }}
                          className="text-accent font-bold hover:text-accent/60 transition-colors"
                          title={`Open ${ind.code} deep dive`}
                        >
                          {ind.code}
                        </button>
                      </td>
                      <td className="px-2 py-1 text-foreground">{ind.name}</td>
                      <td className="px-2 py-1 text-right font-bold text-foreground">{ind.value}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{ind.prev}</td>
                      <td className={`px-2 py-1 text-right font-bold ${ind.change > 0 ? 'text-positive' : ind.change < 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {ind.change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : ind.change < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                          {ind.change > 0 ? '+' : ''}{ind.change.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-center text-muted-foreground">{ind.unit}</td>
                      <td className="px-2 py-1 text-center text-muted-foreground">{ind.frequency}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{ind.nextRelease}</td>
                      <td className="px-2 py-1 text-right text-accent/70">{ind.source}</td>
                    </>
                  }
                  detail={
                    <div className="space-y-2">
                      {ind.description && (
                        <div className="text-[9px] font-mono text-muted-foreground border-b border-border pb-1.5 mb-1.5">{ind.description}</div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-1">
                          <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">6-Month Trend</div>
                          <DetailMiniChart data={history} dataKey="value" />
                        </div>
                        {ind.details && (
                          <div className="lg:col-span-2">
                            <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Breakdown</div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                              {ind.details.map(d => (
                                <div key={d.label} className="border border-border p-1.5">
                                  <div className="text-[8px] font-mono text-muted-foreground">{d.label}</div>
                                  <div className={`text-[10px] font-mono font-bold ${d.color || 'text-foreground'}`}>{d.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!ind.details && (
                          <div className="lg:col-span-2">
                            <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Key Info</div>
                            <DetailKV items={[
                              { label: 'Current', value: `${ind.value} ${ind.unit}` },
                              { label: 'Previous', value: `${ind.prev} ${ind.unit}` },
                              { label: 'Change', value: `${ind.change > 0 ? '+' : ''}${ind.change.toFixed(2)}`, color: ind.change > 0 ? 'text-positive' : ind.change < 0 ? 'text-negative' : '' },
                              { label: 'Source', value: ind.source },
                              { label: 'Frequency', value: ind.frequency },
                              { label: 'Next Release', value: ind.nextRelease },
                            ]} />
                          </div>
                        )}
                      </div>
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
