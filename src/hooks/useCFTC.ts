import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type COTLiveRow = {
  asset: string;
  market: string;
  ticker: string;
  openInterest: number;
  commercials: number;
  managedMoney: number;
  nonReportable: number;
  week: number;
  fourWeek: number;
  pctRank: number;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  reportDate?: string | null;
};

export type COTReportRow = Record<string, string | number>;

type CFTCState = {
  rows: COTLiveRow[];
  historyRows: COTLiveRow[];
  legacyRows: COTReportRow[];
  disaggRows: COTReportRow[];
  tffRows: COTReportRow[];
  citRows: COTReportRow[];
  reportDate: string | null;
  source: string | null;
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: Omit<CFTCState, 'loading' | 'error'> | null = null;
const TTL = 6 * 60 * 60_000;

export function useCFTC(): CFTCState {
  const [state, setState] = useState<CFTCState>({
    rows: memo?.rows ?? [],
    historyRows: memo?.historyRows ?? [],
    legacyRows: memo?.legacyRows ?? [],
    disaggRows: memo?.disaggRows ?? [],
    tffRows: memo?.tffRows ?? [],
    citRows: memo?.citRows ?? [],
    reportDate: memo?.reportDate ?? null,
    source: memo?.source ?? null,
    ts: memo?.ts ?? null,
    loading: !memo,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (memo && memo.ts && Date.now() - memo.ts < TTL) {
        setState({ ...memo, loading: false, error: null });
        return;
      }
      try {
        const data = await apiGet<{ rows?: COTLiveRow[]; historyRows?: COTLiveRow[]; legacyRows?: COTReportRow[]; disaggRows?: COTReportRow[]; tffRows?: COTReportRow[]; citRows?: COTReportRow[]; reportDate?: string | null; source?: string }>('/api/market/cot/cftc-cot');
        const next = {
          rows: (data?.rows ?? []) as COTLiveRow[],
          historyRows: (data?.historyRows ?? []) as COTLiveRow[],
          legacyRows: (data?.legacyRows ?? []) as COTReportRow[],
          disaggRows: (data?.disaggRows ?? []) as COTReportRow[],
          tffRows: (data?.tffRows ?? []) as COTReportRow[],
          citRows: (data?.citRows ?? []) as COTReportRow[],
          reportDate: (data?.reportDate ?? null) as string | null,
          source: (data?.source ?? 'CFTC public reporting') as string,
          ts: Date.now(),
        };
        memo = next;
        if (!cancelled) setState({ ...next, loading: false, error: null });
      } catch (e: any) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: String(e?.message ?? e) }));
      }
    };
    load();
    const id = window.setInterval(load, TTL);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  return state;
}
