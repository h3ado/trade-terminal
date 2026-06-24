/**
 * IBKR TWS Bridge API Service
 *
 * Connects to a local Python bridge server that talks to TWS / IB Gateway.
 * Falls back to mock data when the bridge is unavailable.
 */

export interface Quote {
  symbol: string;
  last: number;
  bid: number | null;
  ask: number | null;
  volume: number;
  prevClose: number;
  change: number;
  changePct: number;
  timestamp: string;
}

export interface ChainRow {
  expiry: string;
  expiryDate: string;
  strike: number;
  type: "C" | "P";
  bid: number;
  ask: number;
  last: number;
  volume: number;
  oi: number;
  oiChange: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  iv: number;
  gex: number;
  dex: number;
  score: number;
}

export interface ChainResponse {
  symbol: string;
  spot: number;
  rows: ChainRow[];
  timestamp: string;
}

export interface GexStrike { strike: number; gamma: number; }
export interface DexStrike { strike: number; callDelta: number; putDelta: number; }

export interface GexResponse {
  symbol: string;
  spot: number;
  gex: GexStrike[];
  dex: DexStrike[];
  netGex: number;
  maxGamma: GexStrike;
  flipLevel: number | null;
  regime: string;
  timestamp: string;
}

export interface SurfaceResponse {
  symbol: string;
  spot: number;
  strikes: number[];
  expiries: string[];
  iv: number[][];
  atmIdx: number;
  timestamp: string;
}

export interface HistoricalIvPoint {
  date: string;
  iv: number;
  rv20: number;
  rv10: number;
  close: number;
}

export interface HistoricalIvResponse {
  symbol: string;
  data: HistoricalIvPoint[];
  currentIv: number;
  currentRv20: number;
  vrp: number;
  timestamp: string;
}

export interface HealthStatus {
  status: "connected" | "disconnected";
  tws_host: string;
  tws_port: number;
  timestamp: string;
}

const STORAGE_KEY = "ibkr_bridge_url";
const DEFAULT_URL = "http://localhost:5555";

export function getBridgeUrl(): string {
  if (typeof localStorage === "undefined") return DEFAULT_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setBridgeUrl(url: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, url.replace(/\/+$/, ""));
}

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = getBridgeUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bridge API error [${res.status}]: ${body}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<HealthStatus> { return apiFetch<HealthStatus>("/api/health"); }
export async function fetchQuote(symbol: string): Promise<Quote> { return apiFetch<Quote>(`/api/quote/${encodeURIComponent(symbol)}`); }
export async function fetchOptionsChain(symbol: string): Promise<ChainResponse> { return apiFetch<ChainResponse>(`/api/options/chain/${encodeURIComponent(symbol)}`); }
export async function fetchGex(symbol: string): Promise<GexResponse> { return apiFetch<GexResponse>(`/api/options/gex/${encodeURIComponent(symbol)}`); }
export async function fetchVolSurface(symbol: string): Promise<SurfaceResponse> { return apiFetch<SurfaceResponse>(`/api/options/surface/${encodeURIComponent(symbol)}`); }
export async function fetchHistoricalIv(symbol: string): Promise<HistoricalIvResponse> { return apiFetch<HistoricalIvResponse>(`/api/historical/iv/${encodeURIComponent(symbol)}`); }
