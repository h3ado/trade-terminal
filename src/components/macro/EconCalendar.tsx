import { useMacroCountry, countries } from '@/contexts/MacroCountryContext';
import { useState, useMemo } from 'react';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailSection, DetailGrid, DetailStat, DetailKV, DetailMiniChart } from './MacroExpandable';

export interface EconEvent {
  date: string;
  time: string;
  country: string;
  event: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  actual?: string;
  forecast: string;
  previous: string;
  // Extended fields
  category: string;
  unit: string;
  source: string;
  frequency: string;
  description: string;
  consensus?: { high: string; low: string; median: string; numEstimates: number };
  revisions?: { prevRevised?: string; direction?: 'up' | 'down' | 'unch' };
  history: { date: string; value: number }[];
  marketReaction?: { asset: string; direction: 'up' | 'down' | 'flat'; magnitude: string };
  relatedEvents?: string[];
  speakerTitle?: string;
}

export const events: EconEvent[] = [
  // ── Apr 11 ──
  { date: '2026-04-11', time: '08:30', country: 'US', event: 'PPI MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.6%', actual: '0.2%',
    category: 'Inflation', unit: '%', source: 'Bureau of Labor Statistics', frequency: 'Monthly',
    description: 'Producer Price Index measures average changes in selling prices received by domestic producers. A leading indicator of consumer inflation.',
    consensus: { high: '0.5%', low: '0.1%', median: '0.3%', numEstimates: 42 },
    revisions: { prevRevised: '0.5%', direction: 'down' },
    history: [{ date: 'Nov', value: 0.0 }, { date: 'Dec', value: 0.1 }, { date: 'Jan', value: 0.3 }, { date: 'Feb', value: 0.6 }, { date: 'Mar', value: 0.2 }],
    marketReaction: { asset: 'USD/JPY', direction: 'down', magnitude: '-0.3%' },
    relatedEvents: ['PPI YoY', 'Core PPI MoM', 'CPI MoM'] },
  { date: '2026-04-11', time: '08:30', country: 'US', event: 'PPI YoY', impact: 'HIGH', forecast: '1.1%', previous: '0.9%', actual: '1.0%',
    category: 'Inflation', unit: '%', source: 'Bureau of Labor Statistics', frequency: 'Monthly',
    description: 'Year-over-year change in the Producer Price Index. Shows the annual pace of wholesale inflation.',
    consensus: { high: '1.4%', low: '0.8%', median: '1.1%', numEstimates: 40 },
    history: [{ date: 'Nov', value: 0.9 }, { date: 'Dec', value: 1.0 }, { date: 'Jan', value: 0.9 }, { date: 'Feb', value: 0.9 }, { date: 'Mar', value: 1.0 }],
    relatedEvents: ['PPI MoM', 'CPI YoY'] },
  { date: '2026-04-11', time: '10:00', country: 'US', event: 'Michigan Consumer Sentiment', impact: 'MED', forecast: '77.0', previous: '76.9',
    category: 'Sentiment', unit: 'Index', source: 'University of Michigan', frequency: 'Monthly',
    description: 'Measures consumer confidence regarding personal finances, business conditions, and purchasing power. Includes 5-year inflation expectations.',
    consensus: { high: '79.5', low: '74.0', median: '77.0', numEstimates: 35 },
    history: [{ date: 'Nov', value: 71.8 }, { date: 'Dec', value: 69.7 }, { date: 'Jan', value: 79.0 }, { date: 'Feb', value: 76.9 }, { date: 'Mar', value: 77.0 }],
    relatedEvents: ['Consumer Confidence (CB)'] },
  { date: '2026-04-11', time: '07:00', country: 'UK', event: 'GDP MoM', impact: 'HIGH', forecast: '0.2%', previous: '0.1%',
    category: 'Growth', unit: '%', source: 'ONS', frequency: 'Monthly',
    description: 'Month-over-month change in UK gross domestic product. Key gauge of economic momentum.',
    consensus: { high: '0.4%', low: '-0.1%', median: '0.2%', numEstimates: 28 },
    history: [{ date: 'Nov', value: 0.3 }, { date: 'Dec', value: -0.1 }, { date: 'Jan', value: 0.2 }, { date: 'Feb', value: 0.1 }, { date: 'Mar', value: 0.2 }],
    marketReaction: { asset: 'GBP/USD', direction: 'up', magnitude: '+0.15%' },
    relatedEvents: ['GDP QoQ', 'Industrial Production'] },
  { date: '2026-04-11', time: '07:00', country: 'UK', event: 'Industrial Production MoM', impact: 'MED', forecast: '0.1%', previous: '-0.2%',
    category: 'Output', unit: '%', source: 'ONS', frequency: 'Monthly',
    description: 'Measures output of UK factories, mines, and utilities. Volatile component of GDP.',
    consensus: { high: '0.4%', low: '-0.3%', median: '0.1%', numEstimates: 22 },
    history: [{ date: 'Nov', value: 0.5 }, { date: 'Dec', value: -0.4 }, { date: 'Jan', value: 0.3 }, { date: 'Feb', value: -0.2 }, { date: 'Mar', value: 0.1 }],
    relatedEvents: ['Manufacturing Production', 'GDP MoM'] },
  { date: '2026-04-11', time: '02:00', country: 'CN', event: 'CPI YoY', impact: 'HIGH', forecast: '0.8%', previous: '0.7%', actual: '0.7%',
    category: 'Inflation', unit: '%', source: 'National Bureau of Statistics', frequency: 'Monthly',
    description: 'China consumer price index year-over-year. Near-zero readings highlight persistent deflationary pressures.',
    consensus: { high: '1.0%', low: '0.5%', median: '0.8%', numEstimates: 30 },
    history: [{ date: 'Nov', value: -0.5 }, { date: 'Dec', value: 0.1 }, { date: 'Jan', value: 0.5 }, { date: 'Feb', value: 0.7 }, { date: 'Mar', value: 0.7 }],
    marketReaction: { asset: 'USD/CNH', direction: 'flat', magnitude: '0.0%' },
    relatedEvents: ['PPI YoY (CN)'] },
  { date: '2026-04-11', time: '02:00', country: 'CN', event: 'PPI YoY', impact: 'HIGH', forecast: '-2.6%', previous: '-2.8%', actual: '-2.8%',
    category: 'Inflation', unit: '%', source: 'National Bureau of Statistics', frequency: 'Monthly',
    description: 'China producer prices remain deeply negative, indicating weak industrial demand and overcapacity.',
    consensus: { high: '-2.0%', low: '-3.2%', median: '-2.6%', numEstimates: 28 },
    history: [{ date: 'Nov', value: -3.0 }, { date: 'Dec', value: -2.7 }, { date: 'Jan', value: -2.5 }, { date: 'Feb', value: -2.8 }, { date: 'Mar', value: -2.8 }],
    relatedEvents: ['CPI YoY (CN)', 'Industrial Production'] },

  // ── Apr 14 ──
  { date: '2026-04-14', time: '08:30', country: 'US', event: 'CPI MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.4%',
    category: 'Inflation', unit: '%', source: 'Bureau of Labor Statistics', frequency: 'Monthly',
    description: 'Consumer Price Index month-over-month change. The most watched inflation report and key Fed input for rate decisions.',
    consensus: { high: '0.5%', low: '0.1%', median: '0.3%', numEstimates: 52 },
    history: [{ date: 'Nov', value: 0.3 }, { date: 'Dec', value: 0.2 }, { date: 'Jan', value: 0.3 }, { date: 'Feb', value: 0.4 }, { date: 'Mar', value: 0.3 }],
    marketReaction: { asset: 'S&P 500', direction: 'up', magnitude: '+0.5%' },
    relatedEvents: ['CPI YoY', 'Core CPI MoM', 'PCE Price Index'] },
  { date: '2026-04-14', time: '08:30', country: 'US', event: 'CPI YoY', impact: 'HIGH', forecast: '3.1%', previous: '3.2%',
    category: 'Inflation', unit: '%', source: 'Bureau of Labor Statistics', frequency: 'Monthly',
    description: 'Headline annual inflation rate. Fed targets 2% (via PCE). Continued deceleration supports rate cut narrative.',
    consensus: { high: '3.4%', low: '2.9%', median: '3.1%', numEstimates: 50 },
    history: [{ date: 'Nov', value: 3.1 }, { date: 'Dec', value: 3.4 }, { date: 'Jan', value: 3.1 }, { date: 'Feb', value: 3.2 }, { date: 'Mar', value: 3.1 }],
    relatedEvents: ['CPI MoM', 'Core CPI YoY'] },
  { date: '2026-04-14', time: '08:30', country: 'US', event: 'Core CPI MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.4%',
    category: 'Inflation', unit: '%', source: 'Bureau of Labor Statistics', frequency: 'Monthly',
    description: 'CPI excluding food and energy. Annualized 3-month rate closely watched by policymakers for trend signals.',
    consensus: { high: '0.4%', low: '0.2%', median: '0.3%', numEstimates: 48 },
    history: [{ date: 'Nov', value: 0.3 }, { date: 'Dec', value: 0.3 }, { date: 'Jan', value: 0.4 }, { date: 'Feb', value: 0.4 }, { date: 'Mar', value: 0.3 }],
    relatedEvents: ['CPI MoM', 'Core PCE MoM'] },
  { date: '2026-04-14', time: '10:30', country: 'UK', event: 'Employment Change', impact: 'HIGH', forecast: '45K', previous: '48K',
    category: 'Labor', unit: 'K', source: 'ONS', frequency: 'Monthly',
    description: 'Change in number of people employed in the UK. Key indicator for BOE policy alongside wage growth.',
    consensus: { high: '60K', low: '20K', median: '45K', numEstimates: 20 },
    history: [{ date: 'Nov', value: 72 }, { date: 'Dec', value: 56 }, { date: 'Jan', value: 48 }, { date: 'Feb', value: 48 }, { date: 'Mar', value: 45 }],
    relatedEvents: ['Unemployment Rate', 'Average Earnings'] },
  { date: '2026-04-14', time: '10:30', country: 'UK', event: 'Unemployment Rate', impact: 'HIGH', forecast: '4.2%', previous: '4.2%',
    category: 'Labor', unit: '%', source: 'ONS', frequency: 'Monthly',
    description: 'UK ILO unemployment rate. Gradual rise from 3.7% lows signals cooling labor market.',
    consensus: { high: '4.3%', low: '4.1%', median: '4.2%', numEstimates: 22 },
    history: [{ date: 'Nov', value: 4.0 }, { date: 'Dec', value: 4.0 }, { date: 'Jan', value: 4.1 }, { date: 'Feb', value: 4.2 }, { date: 'Mar', value: 4.2 }],
    relatedEvents: ['Employment Change', 'Claimant Count Change'] },

  // ── Apr 15 ──
  { date: '2026-04-15', time: '08:30', country: 'US', event: 'Retail Sales MoM', impact: 'HIGH', forecast: '0.4%', previous: '0.6%',
    category: 'Consumption', unit: '%', source: 'Census Bureau', frequency: 'Monthly',
    description: 'Monthly change in total retail receipts. Consumer spending accounts for ~70% of US GDP.',
    consensus: { high: '0.8%', low: '0.0%', median: '0.4%', numEstimates: 45 },
    history: [{ date: 'Nov', value: 0.3 }, { date: 'Dec', value: 0.6 }, { date: 'Jan', value: -0.8 }, { date: 'Feb', value: 0.6 }, { date: 'Mar', value: 0.4 }],
    marketReaction: { asset: 'US 10Y', direction: 'up', magnitude: '+3bp' },
    relatedEvents: ['Core Retail Sales', 'Consumer Confidence'] },
  { date: '2026-04-15', time: '08:30', country: 'CA', event: 'CPI YoY', impact: 'HIGH', forecast: '2.8%', previous: '2.9%',
    category: 'Inflation', unit: '%', source: 'Statistics Canada', frequency: 'Monthly',
    description: 'Canada annual inflation rate. BOC closely watches trimmed-mean and median CPI for core trend.',
    consensus: { high: '3.1%', low: '2.5%', median: '2.8%', numEstimates: 18 },
    history: [{ date: 'Nov', value: 3.1 }, { date: 'Dec', value: 3.4 }, { date: 'Jan', value: 2.9 }, { date: 'Feb', value: 2.9 }, { date: 'Mar', value: 2.8 }],
    relatedEvents: ['BOC Rate Decision', 'Core CPI Trimmed Mean'] },
  { date: '2026-04-15', time: '10:00', country: 'EU', event: 'ZEW Economic Sentiment', impact: 'MED', forecast: '20.0', previous: '19.9',
    category: 'Sentiment', unit: 'Index', source: 'ZEW', frequency: 'Monthly',
    description: 'Survey of ~350 financial analysts on 6-month economic outlook for the Eurozone. Leading indicator.',
    consensus: { high: '25.0', low: '15.0', median: '20.0', numEstimates: 15 },
    history: [{ date: 'Nov', value: 9.8 }, { date: 'Dec', value: 12.0 }, { date: 'Jan', value: 22.7 }, { date: 'Feb', value: 19.9 }, { date: 'Mar', value: 20.0 }],
    relatedEvents: ['ZEW (Germany)', 'Eurozone PMI'] },
  { date: '2026-04-15', time: '10:00', country: 'DE', event: 'ZEW Economic Sentiment', impact: 'MED', forecast: '18.5', previous: '19.9',
    category: 'Sentiment', unit: 'Index', source: 'ZEW', frequency: 'Monthly',
    description: 'German ZEW survey. Weak readings reflect structural challenges in manufacturing and energy costs.',
    consensus: { high: '24.0', low: '12.0', median: '18.5', numEstimates: 18 },
    history: [{ date: 'Nov', value: 7.4 }, { date: 'Dec', value: 12.5 }, { date: 'Jan', value: 15.2 }, { date: 'Feb', value: 19.9 }, { date: 'Mar', value: 18.5 }],
    relatedEvents: ['ifo Business Climate', 'German PMI'] },

  // ── Apr 16 ──
  { date: '2026-04-16', time: '09:15', country: 'US', event: 'Industrial Production MoM', impact: 'MED', forecast: '0.1%', previous: '0.1%',
    category: 'Output', unit: '%', source: 'Federal Reserve', frequency: 'Monthly',
    description: 'Output of US factories, mines, and utilities. Capacity utilization released simultaneously.',
    consensus: { high: '0.4%', low: '-0.2%', median: '0.1%', numEstimates: 38 },
    history: [{ date: 'Nov', value: 0.2 }, { date: 'Dec', value: 0.0 }, { date: 'Jan', value: -0.1 }, { date: 'Feb', value: 0.1 }, { date: 'Mar', value: 0.1 }],
    relatedEvents: ['Capacity Utilization', 'Manufacturing Production'] },
  { date: '2026-04-16', time: '14:00', country: 'US', event: 'Fed Beige Book', impact: 'MED', forecast: '-', previous: '-',
    category: 'Central Bank', unit: '-', source: 'Federal Reserve', frequency: '8x/year',
    description: 'Anecdotal summary of economic conditions across 12 Fed districts. Published 2 weeks before FOMC meetings. Key for qualitative assessment.',
    speakerTitle: 'Federal Reserve Board Staff',
    history: [],
    relatedEvents: ['FOMC Minutes', 'Fed Chair Speech'] },
  { date: '2026-04-16', time: '07:00', country: 'UK', event: 'CPI YoY', impact: 'HIGH', forecast: '3.3%', previous: '3.4%',
    category: 'Inflation', unit: '%', source: 'ONS', frequency: 'Monthly',
    description: 'UK headline inflation. BOE target is 2%. Services CPI (currently ~5%) remains the key concern for rate setters.',
    consensus: { high: '3.6%', low: '3.0%', median: '3.3%', numEstimates: 25 },
    history: [{ date: 'Nov', value: 3.9 }, { date: 'Dec', value: 4.0 }, { date: 'Jan', value: 3.4 }, { date: 'Feb', value: 3.4 }, { date: 'Mar', value: 3.3 }],
    marketReaction: { asset: 'GBP/USD', direction: 'up', magnitude: '+0.2%' },
    relatedEvents: ['Core CPI YoY', 'Services CPI', 'BOE Rate Decision'] },
  { date: '2026-04-16', time: '02:30', country: 'CN', event: 'GDP YoY Q1', impact: 'HIGH', forecast: '5.0%', previous: '5.2%',
    category: 'Growth', unit: '%', source: 'National Bureau of Statistics', frequency: 'Quarterly',
    description: 'China quarterly GDP. Government target is "around 5%". Property sector drag offset by manufacturing and exports.',
    consensus: { high: '5.4%', low: '4.6%', median: '5.0%', numEstimates: 35 },
    history: [{ date: 'Q1-25', value: 5.3 }, { date: 'Q2-25', value: 6.3 }, { date: 'Q3-25', value: 4.9 }, { date: 'Q4-25', value: 5.2 }, { date: 'Q1-26', value: 5.0 }],
    marketReaction: { asset: 'Hang Seng', direction: 'down', magnitude: '-0.8%' },
    relatedEvents: ['Industrial Production', 'Retail Sales (CN)', 'Fixed Asset Investment'] },
  { date: '2026-04-16', time: '02:30', country: 'CN', event: 'Industrial Production YoY', impact: 'HIGH', forecast: '6.5%', previous: '7.0%',
    category: 'Output', unit: '%', source: 'National Bureau of Statistics', frequency: 'Monthly',
    description: 'China factory output. Strong readings driven by EV, semiconductor, and green energy production.',
    consensus: { high: '7.5%', low: '5.5%', median: '6.5%', numEstimates: 30 },
    history: [{ date: 'Nov', value: 6.6 }, { date: 'Dec', value: 6.8 }, { date: 'Jan', value: 7.0 }, { date: 'Feb', value: 7.0 }, { date: 'Mar', value: 6.5 }],
    relatedEvents: ['GDP YoY (CN)', 'PMI Manufacturing'] },
  { date: '2026-04-16', time: '02:30', country: 'CN', event: 'Retail Sales YoY', impact: 'HIGH', forecast: '5.8%', previous: '5.5%',
    category: 'Consumption', unit: '%', source: 'National Bureau of Statistics', frequency: 'Monthly',
    description: 'China consumer spending. Services spending strong but goods consumption remains soft amid property downturn.',
    consensus: { high: '6.5%', low: '5.0%', median: '5.8%', numEstimates: 28 },
    history: [{ date: 'Nov', value: 10.1 }, { date: 'Dec', value: 7.4 }, { date: 'Jan', value: 5.5 }, { date: 'Feb', value: 5.5 }, { date: 'Mar', value: 5.8 }],
    relatedEvents: ['GDP YoY (CN)', 'Consumer Confidence (CN)'] },

  // ── Apr 17 ──
  { date: '2026-04-17', time: '08:30', country: 'US', event: 'Initial Jobless Claims', impact: 'MED', forecast: '215K', previous: '212K',
    category: 'Labor', unit: 'K', source: 'Department of Labor', frequency: 'Weekly',
    description: 'Weekly first-time unemployment filings. Best real-time labor market indicator. Sub-200K signals strong labor demand.',
    consensus: { high: '225K', low: '205K', median: '215K', numEstimates: 40 },
    history: [{ date: 'W-4', value: 218 }, { date: 'W-3', value: 210 }, { date: 'W-2', value: 215 }, { date: 'W-1', value: 212 }, { date: 'W0', value: 215 }],
    relatedEvents: ['Continuing Claims', 'Non-Farm Payrolls'] },
  { date: '2026-04-17', time: '08:30', country: 'US', event: 'Housing Starts', impact: 'MED', forecast: '1.48M', previous: '1.52M',
    category: 'Housing', unit: 'M', source: 'Census Bureau', frequency: 'Monthly',
    description: 'Annualized rate of new residential construction. Building permits released simultaneously. Rate-sensitive.',
    consensus: { high: '1.55M', low: '1.40M', median: '1.48M', numEstimates: 32 },
    history: [{ date: 'Nov', value: 1.56 }, { date: 'Dec', value: 1.46 }, { date: 'Jan', value: 1.33 }, { date: 'Feb', value: 1.52 }, { date: 'Mar', value: 1.48 }],
    relatedEvents: ['Building Permits', 'Existing Home Sales', 'New Home Sales'] },
  { date: '2026-04-17', time: '12:45', country: 'EU', event: 'ECB Interest Rate Decision', impact: 'HIGH', forecast: '4.50%', previous: '4.50%',
    category: 'Central Bank', unit: '%', source: 'European Central Bank', frequency: '6 weeks',
    description: 'ECB main refinancing rate. Market prices 70% chance of 25bp cut. Focus on updated staff projections and forward guidance.',
    consensus: { high: '4.50%', low: '4.25%', median: '4.50%', numEstimates: 45 },
    speakerTitle: 'ECB Governing Council',
    history: [{ date: 'Sep', value: 4.50 }, { date: 'Oct', value: 4.50 }, { date: 'Dec', value: 4.50 }, { date: 'Jan', value: 4.50 }, { date: 'Mar', value: 4.50 }],
    marketReaction: { asset: 'EUR/USD', direction: 'down', magnitude: '-0.4%' },
    relatedEvents: ['ECB Press Conference', 'Eurozone CPI', 'German Bunds'] },
  { date: '2026-04-17', time: '13:30', country: 'EU', event: 'ECB Press Conference', impact: 'HIGH', forecast: '-', previous: '-',
    category: 'Central Bank', unit: '-', source: 'European Central Bank', frequency: '6 weeks',
    description: 'ECB President Lagarde press conference. Watch for language shifts on "data-dependent" vs "restrictive" and balance of risks.',
    speakerTitle: 'Christine Lagarde, ECB President',
    history: [],
    relatedEvents: ['ECB Rate Decision', 'Eurozone Inflation'] },
  { date: '2026-04-17', time: '01:30', country: 'AU', event: 'Employment Change', impact: 'HIGH', forecast: '25.0K', previous: '32.8K',
    category: 'Labor', unit: 'K', source: 'ABS', frequency: 'Monthly',
    description: 'Australian employment change. RBA closely watches alongside participation rate for policy guidance.',
    consensus: { high: '45K', low: '10K', median: '25K', numEstimates: 18 },
    history: [{ date: 'Nov', value: 61.5 }, { date: 'Dec', value: -65.1 }, { date: 'Jan', value: 0.5 }, { date: 'Feb', value: 32.8 }, { date: 'Mar', value: 25.0 }],
    relatedEvents: ['Unemployment Rate (AU)', 'RBA Rate Decision'] },
  { date: '2026-04-17', time: '01:30', country: 'AU', event: 'Unemployment Rate', impact: 'HIGH', forecast: '3.8%', previous: '3.7%',
    category: 'Labor', unit: '%', source: 'ABS', frequency: 'Monthly',
    description: 'Australian unemployment rate. Rates near historic lows support RBA hawkish stance.',
    consensus: { high: '4.0%', low: '3.6%', median: '3.8%', numEstimates: 18 },
    history: [{ date: 'Nov', value: 3.9 }, { date: 'Dec', value: 3.9 }, { date: 'Jan', value: 4.1 }, { date: 'Feb', value: 3.7 }, { date: 'Mar', value: 3.8 }],
    relatedEvents: ['Employment Change (AU)', 'Participation Rate'] },

  // ── Apr 18 ──
  { date: '2026-04-18', time: '23:30', country: 'JP', event: 'National CPI YoY', impact: 'HIGH', forecast: '2.6%', previous: '2.8%',
    category: 'Inflation', unit: '%', source: 'Statistics Bureau', frequency: 'Monthly',
    description: 'Japan headline inflation. Above 2% for 24+ months. Key for BOJ normalization timeline and yen direction.',
    consensus: { high: '2.9%', low: '2.3%', median: '2.6%', numEstimates: 22 },
    history: [{ date: 'Nov', value: 2.8 }, { date: 'Dec', value: 2.6 }, { date: 'Jan', value: 2.2 }, { date: 'Feb', value: 2.8 }, { date: 'Mar', value: 2.6 }],
    marketReaction: { asset: 'USD/JPY', direction: 'down', magnitude: '-0.5%' },
    relatedEvents: ['Core CPI (ex Fresh Food)', 'BOJ Rate Decision'] },
  { date: '2026-04-18', time: '23:30', country: 'JP', event: 'Core CPI (ex Fresh Food)', impact: 'HIGH', forecast: '2.3%', previous: '2.4%',
    category: 'Inflation', unit: '%', source: 'Statistics Bureau', frequency: 'Monthly',
    description: 'BOJ preferred inflation gauge. Sustained above-target readings bolster case for further rate normalization.',
    consensus: { high: '2.6%', low: '2.1%', median: '2.3%', numEstimates: 20 },
    history: [{ date: 'Nov', value: 2.5 }, { date: 'Dec', value: 2.3 }, { date: 'Jan', value: 2.0 }, { date: 'Feb', value: 2.4 }, { date: 'Mar', value: 2.3 }],
    relatedEvents: ['National CPI YoY', 'Tokyo CPI'] },

  // ── Apr 22 ──
  { date: '2026-04-22', time: '10:00', country: 'US', event: 'Existing Home Sales', impact: 'MED', forecast: '4.38M', previous: '4.26M',
    category: 'Housing', unit: 'M', source: 'NAR', frequency: 'Monthly',
    description: 'Annualized rate of completed home sales. Inventory levels and median price closely watched.',
    consensus: { high: '4.55M', low: '4.15M', median: '4.38M', numEstimates: 30 },
    history: [{ date: 'Nov', value: 3.82 }, { date: 'Dec', value: 3.78 }, { date: 'Jan', value: 4.00 }, { date: 'Feb', value: 4.26 }, { date: 'Mar', value: 4.38 }],
    relatedEvents: ['New Home Sales', 'Pending Home Sales', 'Housing Starts'] },
  { date: '2026-04-22', time: '10:00', country: 'EU', event: 'Consumer Confidence Flash', impact: 'MED', forecast: '-15.2', previous: '-15.5',
    category: 'Sentiment', unit: 'Index', source: 'European Commission', frequency: 'Monthly',
    description: 'Flash estimate of Eurozone consumer confidence. Negative readings indicate pessimism prevails.',
    consensus: { high: '-12.0', low: '-18.0', median: '-15.2', numEstimates: 15 },
    history: [{ date: 'Nov', value: -16.9 }, { date: 'Dec', value: -15.0 }, { date: 'Jan', value: -16.1 }, { date: 'Feb', value: -15.5 }, { date: 'Mar', value: -15.2 }],
    relatedEvents: ['Retail Sales (EU)', 'ZEW Sentiment'] },

  // ── Apr 23 ──
  { date: '2026-04-23', time: '09:45', country: 'US', event: 'S&P PMI Manufacturing', impact: 'HIGH', forecast: '51.8', previous: '50.3',
    category: 'Activity', unit: 'Index', source: 'S&P Global', frequency: 'Monthly',
    description: 'Flash manufacturing PMI. Above 50 = expansion. New orders and prices paid sub-indices key for outlook.',
    consensus: { high: '53.0', low: '49.5', median: '51.8', numEstimates: 28 },
    history: [{ date: 'Nov', value: 49.4 }, { date: 'Dec', value: 47.9 }, { date: 'Jan', value: 50.7 }, { date: 'Feb', value: 50.3 }, { date: 'Mar', value: 51.8 }],
    marketReaction: { asset: 'S&P 500', direction: 'up', magnitude: '+0.3%' },
    relatedEvents: ['ISM Manufacturing', 'S&P PMI Services'] },
  { date: '2026-04-23', time: '09:45', country: 'US', event: 'S&P PMI Services', impact: 'HIGH', forecast: '52.2', previous: '52.6',
    category: 'Activity', unit: 'Index', source: 'S&P Global', frequency: 'Monthly',
    description: 'Flash services PMI. Services represent ~80% of US economy. Prices charged component important for inflation outlook.',
    consensus: { high: '54.0', low: '50.5', median: '52.2', numEstimates: 26 },
    history: [{ date: 'Nov', value: 50.8 }, { date: 'Dec', value: 51.4 }, { date: 'Jan', value: 52.5 }, { date: 'Feb', value: 52.6 }, { date: 'Mar', value: 52.2 }],
    relatedEvents: ['ISM Services', 'S&P PMI Manufacturing'] },

  // ── Apr 24 ──
  { date: '2026-04-24', time: '08:30', country: 'US', event: 'Durable Goods Orders', impact: 'HIGH', forecast: '0.8%', previous: '1.4%',
    category: 'Output', unit: '%', source: 'Census Bureau', frequency: 'Monthly',
    description: 'Orders for goods lasting 3+ years. Ex-transportation and core capital goods (nondefense ex-aircraft) are key gauges of business investment.',
    consensus: { high: '2.0%', low: '-0.5%', median: '0.8%', numEstimates: 35 },
    revisions: { prevRevised: '1.3%', direction: 'down' },
    history: [{ date: 'Nov', value: 5.4 }, { date: 'Dec', value: 0.0 }, { date: 'Jan', value: -6.1 }, { date: 'Feb', value: 1.4 }, { date: 'Mar', value: 0.8 }],
    relatedEvents: ['Core Capital Goods Orders', 'Factory Orders'] },
  { date: '2026-04-24', time: '09:30', country: 'CA', event: 'BOC Interest Rate Decision', impact: 'HIGH', forecast: '5.00%', previous: '5.00%',
    category: 'Central Bank', unit: '%', source: 'Bank of Canada', frequency: '8x/year',
    description: 'BOC policy rate decision. Monetary Policy Report published quarterly. Markets pricing 60% chance of hold.',
    consensus: { high: '5.00%', low: '4.75%', median: '5.00%', numEstimates: 22 },
    speakerTitle: 'BOC Governing Council',
    history: [{ date: 'Jul', value: 5.00 }, { date: 'Sep', value: 5.00 }, { date: 'Oct', value: 5.00 }, { date: 'Dec', value: 4.50 }, { date: 'Jan', value: 5.00 }],
    marketReaction: { asset: 'USD/CAD', direction: 'up', magnitude: '+0.3%' },
    relatedEvents: ['Canada CPI', 'BOC Monetary Policy Report'] },
  { date: '2026-04-24', time: '09:30', country: 'DE', event: 'ifo Business Climate', impact: 'HIGH', forecast: '88.0', previous: '87.8',
    category: 'Sentiment', unit: 'Index', source: 'ifo Institute', frequency: 'Monthly',
    description: 'Survey of 9,000 German firms on current conditions and 6-month expectations. Highly correlated with GDP.',
    consensus: { high: '90.0', low: '86.0', median: '88.0', numEstimates: 25 },
    history: [{ date: 'Nov', value: 87.3 }, { date: 'Dec', value: 86.4 }, { date: 'Jan', value: 85.2 }, { date: 'Feb', value: 87.8 }, { date: 'Mar', value: 88.0 }],
    relatedEvents: ['ZEW Sentiment (DE)', 'German PMI', 'German GDP'] },

  // ── Apr 25 ──
  { date: '2026-04-25', time: '08:30', country: 'US', event: 'PCE Price Index MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.3%',
    category: 'Inflation', unit: '%', source: 'Bureau of Economic Analysis', frequency: 'Monthly',
    description: 'Fed\'s preferred inflation measure. Released with Personal Income and Spending data. Covers broader basket than CPI.',
    consensus: { high: '0.4%', low: '0.1%', median: '0.3%', numEstimates: 48 },
    history: [{ date: 'Nov', value: 0.1 }, { date: 'Dec', value: 0.2 }, { date: 'Jan', value: 0.3 }, { date: 'Feb', value: 0.3 }, { date: 'Mar', value: 0.3 }],
    marketReaction: { asset: 'US 2Y', direction: 'down', magnitude: '-5bp' },
    relatedEvents: ['Core PCE MoM', 'Personal Income', 'Personal Spending'] },
  { date: '2026-04-25', time: '08:30', country: 'US', event: 'Core PCE MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.4%',
    category: 'Inflation', unit: '%', source: 'Bureau of Economic Analysis', frequency: 'Monthly',
    description: 'Core PCE ex food & energy — THE Fed target metric. 0.17% MoM = 2% annualized target pace. Market-critical release.',
    consensus: { high: '0.4%', low: '0.2%', median: '0.3%', numEstimates: 50 },
    history: [{ date: 'Nov', value: 0.1 }, { date: 'Dec', value: 0.2 }, { date: 'Jan', value: 0.4 }, { date: 'Feb', value: 0.4 }, { date: 'Mar', value: 0.3 }],
    relatedEvents: ['PCE Price Index MoM', 'Core CPI MoM'] },
  { date: '2026-04-25', time: '07:00', country: 'UK', event: 'Retail Sales MoM', impact: 'HIGH', forecast: '0.3%', previous: '0.2%',
    category: 'Consumption', unit: '%', source: 'ONS', frequency: 'Monthly',
    description: 'UK retail sales volumes. Includes food and non-food stores. Adjusted for store price changes.',
    consensus: { high: '0.8%', low: '-0.2%', median: '0.3%', numEstimates: 20 },
    history: [{ date: 'Nov', value: 1.3 }, { date: 'Dec', value: -3.2 }, { date: 'Jan', value: 3.4 }, { date: 'Feb', value: 0.2 }, { date: 'Mar', value: 0.3 }],
    relatedEvents: ['Consumer Confidence (UK)', 'GDP MoM'] },

  // ── Apr 26 ──
  { date: '2026-04-26', time: '00:30', country: 'JP', event: 'BOJ Interest Rate Decision', impact: 'HIGH', forecast: '0.10%', previous: '0.10%',
    category: 'Central Bank', unit: '%', source: 'Bank of Japan', frequency: '8x/year',
    description: 'BOJ policy rate decision. Quarterly Outlook Report released simultaneously with GDP and CPI projections.',
    consensus: { high: '0.25%', low: '0.10%', median: '0.10%', numEstimates: 25 },
    speakerTitle: 'BOJ Policy Board',
    history: [{ date: 'Mar-25', value: -0.10 }, { date: 'Jul-25', value: 0.10 }, { date: 'Sep-25', value: 0.25 }, { date: 'Jan-26', value: 0.25 }, { date: 'Mar-26', value: 0.10 }],
    marketReaction: { asset: 'USD/JPY', direction: 'up', magnitude: '+1.2%' },
    relatedEvents: ['BOJ Outlook Report', 'Japan CPI', 'JGB 10Y'] },
  { date: '2026-04-26', time: '00:30', country: 'JP', event: 'BOJ Outlook Report', impact: 'HIGH', forecast: '-', previous: '-',
    category: 'Central Bank', unit: '-', source: 'Bank of Japan', frequency: 'Quarterly',
    description: 'Quarterly economic projections including GDP and CPI forecasts. Key for understanding BOJ normalization path.',
    speakerTitle: 'BOJ Policy Board',
    history: [],
    relatedEvents: ['BOJ Rate Decision', 'BOJ Gov Ueda Press Conference'] },

  // ── Apr 30 ──
  { date: '2026-04-30', time: '08:30', country: 'US', event: 'GDP QoQ Advance Q1', impact: 'HIGH', forecast: '2.4%', previous: '2.8%',
    category: 'Growth', unit: '%', source: 'Bureau of Economic Analysis', frequency: 'Quarterly',
    description: 'First estimate of Q1 GDP annualized growth. Three revisions follow (2nd, 3rd, final). Consumer spending ~70% of total.',
    consensus: { high: '3.2%', low: '1.8%', median: '2.4%', numEstimates: 55 },
    history: [{ date: 'Q1-25', value: 1.6 }, { date: 'Q2-25', value: 2.8 }, { date: 'Q3-25', value: 3.2 }, { date: 'Q4-25', value: 2.8 }, { date: 'Q1-26', value: 2.4 }],
    marketReaction: { asset: 'US 10Y', direction: 'down', magnitude: '-4bp' },
    relatedEvents: ['GDP Price Index', 'Personal Consumption', 'Core PCE QoQ'] },
  { date: '2026-04-30', time: '10:00', country: 'EU', event: 'GDP QoQ Flash Q1', impact: 'HIGH', forecast: '0.2%', previous: '0.3%',
    category: 'Growth', unit: '%', source: 'Eurostat', frequency: 'Quarterly',
    description: 'Flash GDP estimate for the Eurozone. Country-level breakdowns follow. Germany weakness offset by Spain/Ireland growth.',
    consensus: { high: '0.4%', low: '0.0%', median: '0.2%', numEstimates: 30 },
    history: [{ date: 'Q1-25', value: 0.3 }, { date: 'Q2-25', value: 0.3 }, { date: 'Q3-25', value: 0.0 }, { date: 'Q4-25', value: 0.3 }, { date: 'Q1-26', value: 0.2 }],
    relatedEvents: ['German GDP', 'French GDP', 'ECB Rate Decision'] },
  { date: '2026-04-30', time: '01:30', country: 'AU', event: 'CPI YoY Q1', impact: 'HIGH', forecast: '3.3%', previous: '3.4%',
    category: 'Inflation', unit: '%', source: 'ABS', frequency: 'Quarterly',
    description: 'Australia quarterly CPI. RBA\'s preferred measure is the trimmed mean. Quarterly cadence makes each print high-impact.',
    consensus: { high: '3.6%', low: '3.0%', median: '3.3%', numEstimates: 18 },
    history: [{ date: 'Q1-25', value: 3.6 }, { date: 'Q2-25', value: 3.8 }, { date: 'Q3-25', value: 3.5 }, { date: 'Q4-25', value: 3.4 }, { date: 'Q1-26', value: 3.3 }],
    marketReaction: { asset: 'AUD/USD', direction: 'up', magnitude: '+0.25%' },
    relatedEvents: ['RBA Rate Decision', 'Employment (AU)', 'Monthly CPI Indicator'] },
];

const today = '2026-04-13';

const countryFlags: Record<string, string> = {};
countries.forEach(c => { countryFlags[c.code] = c.flag; });

const categoryColors: Record<string, string> = {
  'Inflation': 'text-negative',
  'Growth': 'text-positive',
  'Labor': 'text-bb-blue',
  'Central Bank': 'text-accent',
  'Consumption': 'text-bb-cyan',
  'Sentiment': 'text-bb-amber',
  'Activity': 'text-positive',
  'Output': 'text-bb-blue',
  'Housing': 'text-bb-cyan',
};

export default function EconCalendar() {
  const { selectedCountry } = useMacroCountry();
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterImpact, setFilterImpact] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const { toggleRow, isExpanded } = useExpandableRows();

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterCountry !== 'ALL' && e.country !== filterCountry) return false;
      if (filterImpact !== 'ALL' && e.impact !== filterImpact) return false;
      if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
      return true;
    });
  }, [filterCountry, filterImpact, filterCategory]);

  const grouped: Record<string, EconEvent[]> = {};
  filteredEvents.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const uniqueCountries = [...new Set(events.map(e => e.country))];
  const uniqueCategories = [...new Set(events.map(e => e.category))];

  const getSurprise = (e: EconEvent) => {
    if (!e.actual || e.forecast === '-') return null;
    const act = parseFloat(e.actual);
    const fcst = parseFloat(e.forecast);
    if (isNaN(act) || isNaN(fcst)) return null;
    return act - fcst;
  };

  const totalEvents = filteredEvents.length;
  const highImpact = filteredEvents.filter(e => e.impact === 'HIGH').length;
  const upcomingToday = filteredEvents.filter(e => e.date === today && !e.actual).length;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono font-bold text-xs uppercase">Economic Calendar</span>
          <span className="text-muted-foreground font-mono text-[9px]">ECO &lt;GO&gt;</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-muted-foreground">Events: <span className="text-foreground font-bold">{totalEvents}</span></span>
          <span className="text-muted-foreground">High Impact: <span className="text-negative font-bold">{highImpact}</span></span>
          {upcomingToday > 0 && <span className="text-muted-foreground">Pending Today: <span className="text-accent font-bold animate-pulse-dot">{upcomingToday}</span></span>}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] font-mono text-muted-foreground uppercase w-12">Region:</span>
          <button onClick={() => setFilterCountry('ALL')}
            className={`px-2 py-0.5 text-[9px] font-mono transition-all ${filterCountry === 'ALL' ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}>ALL</button>
          {uniqueCountries.map(c => (
            <button key={c} onClick={() => setFilterCountry(c)}
              className={`px-2 py-0.5 text-[9px] font-mono flex items-center gap-0.5 transition-all ${filterCountry === c ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}>
              <span className="text-[10px]">{countryFlags[c] || ''}</span>{c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] font-mono text-muted-foreground uppercase w-12">Impact:</span>
          {['ALL', 'HIGH', 'MED', 'LOW'].map(imp => (
            <button key={imp} onClick={() => setFilterImpact(imp)}
              className={`px-2 py-0.5 text-[9px] font-mono transition-all ${filterImpact === imp ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}>
              {imp === 'ALL' ? 'ALL' : <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 ${imp === 'HIGH' ? 'bg-negative' : imp === 'MED' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />{imp}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] font-mono text-muted-foreground uppercase w-12">Type:</span>
          <button onClick={() => setFilterCategory('ALL')}
            className={`px-2 py-0.5 text-[9px] font-mono transition-all ${filterCategory === 'ALL' ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}>ALL</button>
          {uniqueCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 text-[9px] font-mono transition-all ${filterCategory === cat ? 'bg-accent text-accent-foreground font-bold' : `${categoryColors[cat] || 'text-muted-foreground'} hover:bg-surface-elevated`}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {Object.entries(grouped).map(([date, evts]) => {
        const isPast = date < today;
        const isToday = date === today;
        return (
          <div key={date} className="border border-border overflow-hidden">
            <div className={`px-2 py-1 border-b border-border flex items-center gap-2 ${isToday ? 'bg-accent/10 border-l-2 border-l-accent' : 'bg-surface-elevated'}`}>
              <span className="text-accent font-mono font-bold text-[10px]">{formatDate(date)}</span>
              {isToday && <span className="text-[8px] font-mono font-bold text-accent-foreground bg-accent px-1.5 py-0.5">TODAY</span>}
              {isPast && <span className="text-[8px] font-mono text-muted-foreground">COMPLETED</span>}
              <span className="text-muted-foreground font-mono text-[9px] ml-auto">{evts.length} events</span>
              <span className="text-[8px] font-mono text-negative">{evts.filter(e => e.impact === 'HIGH').length} high</span>
            </div>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-grid-line bg-surface-deep">
                  <th className="text-left px-2 py-1 text-muted-foreground w-5"></th>
                  <th className="text-left px-2 py-1 text-muted-foreground w-14">TIME</th>
                  <th className="text-center px-1 py-1 text-muted-foreground w-10">CC</th>
                  <th className="text-left px-2 py-1 text-muted-foreground w-10">CAT</th>
                  <th className="text-left px-2 py-1 text-muted-foreground">EVENT</th>
                  <th className="text-right px-2 py-1 text-muted-foreground w-16">ACTUAL</th>
                  <th className="text-right px-2 py-1 text-muted-foreground w-16">FCST</th>
                  <th className="text-right px-2 py-1 text-muted-foreground w-16">PREV</th>
                  <th className="text-right px-2 py-1 text-muted-foreground w-16">SURP</th>
                </tr>
              </thead>
              <tbody>
                {evts.map((e, i) => {
                  const rowId = `${e.date}-${e.event}-${i}`;
                  const surprise = getSurprise(e);
                  const expanded = isExpanded(rowId);
                  return (
                    <ExpandableRow
                      key={rowId}
                      id={rowId}
                      isExpanded={expanded}
                      onToggle={toggleRow}
                      colSpan={9}
                      className={e.country === selectedCountry ? 'bg-accent/5' : ''}
                      cells={
                        <>
                          <td className="px-2 py-1.5">
                            <div className={`w-2 h-2 ${e.impact === 'HIGH' ? 'bg-negative' : e.impact === 'MED' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                          </td>
                          <td className="px-2 py-1.5 text-muted-foreground">{e.time} ET</td>
                          <td className="px-1 py-1.5 text-center">
                            <span className="text-[10px]">{countryFlags[e.country] || ''}</span>
                            <span className="text-accent font-bold ml-0.5">{e.country}</span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`text-[8px] uppercase ${categoryColors[e.category] || 'text-muted-foreground'}`}>{e.category.substring(0, 5)}</span>
                          </td>
                          <td className="px-2 py-1.5 text-foreground font-bold">
                            <ExpandIcon isExpanded={expanded} />
                            {e.event}
                            {e.speakerTitle && <span className="text-[8px] text-muted-foreground ml-1">({e.speakerTitle.split(',')[0]})</span>}
                          </td>
                          <td className={`px-2 py-1.5 text-right font-bold ${
                            e.actual ? (surprise && surprise > 0 ? 'text-positive' : surprise && surprise < 0 ? 'text-negative' : 'text-foreground') : 'text-muted-foreground/30'
                          }`}>
                            {e.actual || '—'}
                          </td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">{e.forecast}</td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">
                            {e.previous}
                            {e.revisions?.prevRevised && (
                              <span className={`text-[7px] ml-0.5 ${e.revisions.direction === 'up' ? 'text-positive' : 'text-negative'}`}>
                                →{e.revisions.prevRevised}
                              </span>
                            )}
                          </td>
                          <td className={`px-2 py-1.5 text-right font-bold ${
                            surprise === null ? 'text-muted-foreground/30' : surprise > 0 ? 'text-positive' : surprise < 0 ? 'text-negative' : 'text-foreground'
                          }`}>
                            {surprise === null ? '—' : `${surprise > 0 ? '+' : ''}${surprise.toFixed(1)}`}
                          </td>
                        </>
                      }
                      detail={
                        <DetailGrid cols={3}>
                          {/* Left: Description & metadata */}
                          <DetailSection title="Event Details">
                            <div className="text-[9px] font-mono text-foreground/80 mb-2 leading-relaxed">{e.description}</div>
                            <DetailKV items={[
                              { label: 'Source', value: e.source },
                              { label: 'Frequency', value: e.frequency },
                              { label: 'Unit', value: e.unit },
                              { label: 'Category', value: e.category, color: categoryColors[e.category] },
                              ...(e.speakerTitle ? [{ label: 'Speaker', value: e.speakerTitle }] : []),
                            ]} />
                            {e.relatedEvents && e.relatedEvents.length > 0 && (
                              <div className="mt-2">
                                <div className="text-[8px] text-muted-foreground mb-0.5">RELATED:</div>
                                <div className="flex flex-wrap gap-1">
                                  {e.relatedEvents.map(re => (
                                    <span key={re} className="text-[8px] px-1.5 py-0.5 bg-surface-elevated border border-border text-muted-foreground">{re}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </DetailSection>

                          {/* Center: Consensus & surprise */}
                          <DetailSection title="Consensus & Forecast">
                            {e.consensus ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                  <DetailStat label="Median" value={e.consensus.median} color="text-accent" />
                                  <DetailStat label="Estimates" value={String(e.consensus.numEstimates)} />
                                  <DetailStat label="High Est." value={e.consensus.high} color="text-positive" />
                                  <DetailStat label="Low Est." value={e.consensus.low} color="text-negative" />
                                </div>
                                {/* Consensus range visual */}
                                <div className="border border-border p-1.5">
                                  <div className="text-[8px] font-mono text-muted-foreground mb-1">FORECAST RANGE</div>
                                  <div className="relative h-4 bg-surface-deep border border-border">
                                    <div className="absolute inset-y-0 bg-accent/15"
                                      style={{
                                        left: '15%', right: '15%',
                                      }} />
                                    <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-accent" style={{ left: '50%' }} title="Median" />
                                    {e.actual && (() => {
                                      const lo = parseFloat(e.consensus.low);
                                      const hi = parseFloat(e.consensus.high);
                                      const act = parseFloat(e.actual);
                                      const range = hi - lo || 1;
                                      const pct = Math.max(0, Math.min(100, ((act - lo) / range) * 70 + 15));
                                      return <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground border border-accent" style={{ left: `${pct}%` }} title={`Actual: ${e.actual}`} />;
                                    })()}
                                  </div>
                                  <div className="flex justify-between text-[7px] font-mono text-muted-foreground mt-0.5">
                                    <span>{e.consensus.low}</span>
                                    <span className="text-accent">{e.consensus.median}</span>
                                    <span>{e.consensus.high}</span>
                                  </div>
                                </div>
                                {e.actual && surprise !== null && (
                                  <div className="border border-border p-1.5">
                                    <div className="text-[8px] font-mono text-muted-foreground mb-0.5">SURPRISE</div>
                                    <div className={`text-sm font-mono font-bold ${surprise > 0 ? 'text-positive' : surprise < 0 ? 'text-negative' : 'text-foreground'}`}>
                                      {surprise > 0 ? '▲ BEAT' : surprise < 0 ? '▼ MISS' : '● INLINE'} {surprise > 0 ? '+' : ''}{surprise.toFixed(2)} {e.unit}
                                    </div>
                                  </div>
                                )}
                                {e.revisions && e.revisions.prevRevised && (
                                  <div className="text-[8px] font-mono">
                                    <span className="text-muted-foreground">Prior revised: </span>
                                    <span className="text-foreground">{e.previous} → {e.revisions.prevRevised}</span>
                                    <span className={`ml-1 ${e.revisions.direction === 'up' ? 'text-positive' : 'text-negative'}`}>
                                      ({e.revisions.direction === 'up' ? '▲' : '▼'} revised {e.revisions.direction})
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[9px] text-muted-foreground">Qualitative event — no numerical forecast</div>
                            )}
                            {e.marketReaction && (
                              <div className="border border-border p-1.5 mt-2">
                                <div className="text-[8px] font-mono text-muted-foreground mb-0.5">MARKET REACTION</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold text-foreground">{e.marketReaction.asset}</span>
                                  <span className={`text-[9px] font-mono font-bold ${e.marketReaction.direction === 'up' ? 'text-positive' : e.marketReaction.direction === 'down' ? 'text-negative' : 'text-muted-foreground'}`}>
                                    {e.marketReaction.direction === 'up' ? '▲' : e.marketReaction.direction === 'down' ? '▼' : '—'} {e.marketReaction.magnitude}
                                  </span>
                                </div>
                              </div>
                            )}
                          </DetailSection>

                          {/* Right: History chart */}
                          <DetailSection title="Recent History">
                            {e.history.length > 0 ? (
                              <>
                                <DetailMiniChart
                                  data={e.history.map(h => ({ label: h.date, value: h.value }))}
                                  dataKey="value"
                                  labelKey="label"
                                  height={90}
                                />
                                <div className="space-y-0.5 mt-2">
                                  {e.history.map(h => (
                                    <div key={h.date} className="flex justify-between text-[8px] font-mono">
                                      <span className="text-muted-foreground">{h.date}</span>
                                      <span className="text-foreground font-bold">{h.value}{e.unit !== 'Index' && e.unit !== '-' && e.unit !== 'K' && e.unit !== 'M' ? e.unit : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-[9px] text-muted-foreground">No historical data for this event type</div>
                            )}
                          </DetailSection>
                        </DetailGrid>
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>ECO — Economic Calendar</span>
        <span>Times in ET • Source: Central Banks / Statistical Agencies</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}