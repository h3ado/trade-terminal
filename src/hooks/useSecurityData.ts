import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface SecurityOverview {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  avgVolume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  isMarketOpen: boolean | null;
  ts: number;
}

export interface OHLCVCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SecurityChart {
  ticker: string;
  interval: string;
  candles: OHLCVCandle[];
}

export interface IndicatorPoint {
  time: string;
  rsi?: number | null;
}
export interface MACDPoint {
  time: string;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
}
export interface BBPoint {
  time: string;
  upper_band: number | null;
  middle_band: number | null;
  lower_band: number | null;
}

export interface SecurityIndicators {
  ticker: string;
  interval: string;
  rsi: IndicatorPoint[];
  macd: MACDPoint[];
  bbands: BBPoint[];
}

// ─── Fundamentals types ────────────────────────────────────────────────────────

export interface IncomeStatement {
  endDate: string;
  totalRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  basicEPS: number | null;
  ebitda: number | null;
}

export interface Officer {
  name: string;
  title: string;
  totalPay: number | null;
}

export interface EstimateTrend {
  period: string;
  periodLabel: string;
  epsAvg: number | null;
  epsLow: number | null;
  epsHigh: number | null;
  epsAnalysts: number | null;
  revAvg: number | null;
  revLow: number | null;
  revHigh: number | null;
  revAnalysts: number | null;
}

export interface EarningsHistory {
  quarter: string;
  epsEstimate: number | null;
  epsActual: number | null;
  surprise: number | null;
}

export interface UpgradeAction {
  firm: string;
  action: string;
  toGrade: string;
  fromGrade: string;
  date: string;
}

export interface RecommendationCounts {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface InstitutionalHolder {
  organization: string;
  reportDate: string;
  pctHeld: number | null;
  shares: number | null;
  value: number | null;
}

export interface InsiderTransaction {
  name: string;
  relation: string;
  date: string;
  description: string;
  shares: number | null;
  value: number | null;
  ownership: string;
}

export interface PeerRow {
  ticker: string;
  name: string;
  marketCap: number | null;
  price: number | null;
  changePct: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  revenueGrowth: number | null;
  profitMargins: number | null;
  returnOnEquity: number | null;
}

export interface SecurityFundamentals {
  ticker: string;
  profile: {
    sector: string | null;
    industry: string | null;
    employees: number | null;
    website: string | null;
    country: string | null;
    city: string | null;
    state: string | null;
    description: string | null;
    officers: Officer[];
  };
  keyStats: {
    marketCap: number | null;
    enterpriseValue: number | null;
    trailingPE: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
    beta: number | null;
    dividendRate: number | null;
    dividendYield: number | null;
    payoutRatio: number | null;
    exDividendDate: string;
    shortPercentFloat: number | null;
    earningsDate: string;
  };
  financials: {
    revenueGrowth: number | null;
    earningsGrowth: number | null;
    grossMargins: number | null;
    operatingMargins: number | null;
    profitMargins: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    freeCashflow: number | null;
    totalDebt: number | null;
    totalCash: number | null;
    targetMeanPrice: number | null;
    targetLowPrice: number | null;
    targetHighPrice: number | null;
    annualIncome: IncomeStatement[];
    quarterlyIncome: IncomeStatement[];
  };
  estimates: {
    trend: EstimateTrend[];
    history: EarningsHistory[];
  };
  analyst: {
    recommendations: RecommendationCounts | null;
    upgrades: UpgradeAction[];
    targetMean: number | null;
    targetLow: number | null;
    targetHigh: number | null;
    numAnalysts: number | null;
  };
  ownership: {
    insiderPctHeld: number | null;
    institutionPctHeld: number | null;
    institutionFloatPct: number | null;
    institutionCount: number | null;
    holders: InstitutionalHolder[];
  };
  insiders: {
    transactions: InsiderTransaction[];
  };
  ts: number;
}

// ─── Chart types ───────────────────────────────────────────────────────────────

export type ChartInterval = '1day' | '1week' | '1month';
export type ChartRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

function rangeToParams(range: ChartRange): { interval: ChartInterval; outputsize: number } {
  switch (range) {
    case '1W': return { interval: '1day', outputsize: 7 };
    case '1M': return { interval: '1day', outputsize: 30 };
    case '3M': return { interval: '1day', outputsize: 90 };
    case '6M': return { interval: '1day', outputsize: 180 };
    case '1Y': return { interval: '1day', outputsize: 365 };
    case '5Y': return { interval: '1week', outputsize: 260 };
  }
}

export function useSecurityData(ticker: string, range: ChartRange) {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [chart, setChart] = useState<SecurityChart | null>(null);
  const [indicators, setIndicators] = useState<SecurityIndicators | null>(null);
  const [fundamentals, setFundamentals] = useState<SecurityFundamentals | null>(null);
  const [peers, setPeers] = useState<PeerRow[] | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(true);
  const [peersLoading, setPeersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!ticker) return;
    try {
      const data = await apiGet<SecurityOverview>(`/api/market/security/${encodeURIComponent(ticker)}/overview`);
      setOverview(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load overview');
    } finally {
      setOverviewLoading(false);
    }
  }, [ticker]);

  const fetchChart = useCallback(async () => {
    if (!ticker) return;
    setChartLoading(true);
    const { interval, outputsize } = rangeToParams(range);
    try {
      const [chartData, indData] = await Promise.all([
        apiGet<SecurityChart>(`/api/market/security/${encodeURIComponent(ticker)}/chart`, {
          interval, outputsize: String(outputsize),
        }),
        apiGet<SecurityIndicators>(`/api/market/security/${encodeURIComponent(ticker)}/indicators`, {
          interval, outputsize: String(outputsize),
        }),
      ]);
      setChart(chartData);
      setIndicators(indData);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load chart');
    } finally {
      setChartLoading(false);
    }
  }, [ticker, range]);

  const fetchFundamentals = useCallback(async () => {
    if (!ticker) return;
    setFundamentalsLoading(true);
    try {
      const data = await apiGet<SecurityFundamentals>(`/api/market/security/${encodeURIComponent(ticker)}/fundamentals`);
      setFundamentals(data);
    } catch {
      // Silently degrade — Yahoo Finance can be unreliable; tabs will show "unavailable"
    } finally {
      setFundamentalsLoading(false);
    }
  }, [ticker]);

  const fetchPeers = useCallback(async () => {
    if (!ticker) return;
    setPeersLoading(true);
    try {
      const data = await apiGet<{ peers: PeerRow[] }>(`/api/market/security/${encodeURIComponent(ticker)}/peers`);
      setPeers(data.peers);
    } catch {
      setPeers([]);
    } finally {
      setPeersLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    setOverviewLoading(true);
    fetchOverview();
    const id = setInterval(fetchOverview, 30_000);
    return () => clearInterval(id);
  }, [fetchOverview]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  useEffect(() => {
    setFundamentals(null);
    fetchFundamentals();
  }, [fetchFundamentals]);

  useEffect(() => {
    setPeers(null);
    fetchPeers();
  }, [fetchPeers]);

  return {
    overview,
    chart,
    indicators,
    fundamentals,
    peers,
    overviewLoading,
    chartLoading,
    fundamentalsLoading,
    peersLoading,
    error,
    refetchChart: fetchChart,
    refetchFundamentals: fetchFundamentals,
    refetchPeers: fetchPeers,
  };
}
