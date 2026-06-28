// OVME workspace — Bloomberg OVME-style option pricing & analytics.
// Owns shared deal state (strike, DTE, vol, rate, type) across all 7 sub-tabs.
import { useMemo, useState } from "react";
import { calculateBlackScholes } from "@/utils/blackScholes";
import OvmePricing from "./OvmePricing";
import OvmeGreeks from "./OvmeGreeks";
import OvmeStrategy from "./OvmeStrategy";
import OvmeMatrix from "./OvmeMatrix";
import OvmeSkew from "./OvmeSkew";
import OvmeTermStruct from "./OvmeTermStruct";
import Ovme3DSurface from "./Ovme3DSurface";
import OvmeBacktest from "./OvmeBacktest";
import LiveDataBar from "../LiveDataBar";
import { useIbkrSurface } from "@/hooks/useIbkrSurface";

export interface OvmeDeal {
  ticker: string;
  spot: number;
  strike: number;
  dte: number;
  vol: number;   // percent
  rate: number;  // percent
  isCall: boolean;
}

interface Props { ticker: string; sub: string; redact?: boolean }

const SPOT_BY_TICKER: Record<string, number> = {
  SPY: 482.32, QQQ: 502.10, AAPL: 195.30, NVDA: 870.50, TSLA: 220.80, IWM: 210.40,
};

export default function OvmeWorkspace({ ticker, sub, redact = false }: Props) {
  const defaultSpot = SPOT_BY_TICKER[ticker] ?? 482.32;
  const [deal, setDeal] = useState<OvmeDeal>({
    ticker,
    spot: defaultSpot,
    strike: Math.round(defaultSpot),
    dte: 30,
    vol: 20.8,
    rate: 5.25,
    isCall: true,
  });

  const ibkrSurface = useIbkrSurface();

  // Keep deal ticker/spot synced if user switches ticker at the header.
  useMemo(() => {
    setDeal((d) => ({ ...d, ticker, spot: SPOT_BY_TICKER[ticker] ?? d.spot, strike: Math.round(SPOT_BY_TICKER[ticker] ?? d.spot) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const liveBar = (
    <LiveDataBar
      ticker={ticker}
      loading={ibkrSurface.loading}
      error={ibkrSurface.error}
      loadedTicker={ibkrSurface.data?.loadedTicker ?? null}
      ts={ibkrSurface.data?.ts ?? null}
      isLive={ibkrSurface.isLive}
      onLoad={() => ibkrSurface.load(ticker)}
    />
  );

  const liveIvAt = ibkrSurface.data?.loadedTicker === ticker
    ? ibkrSurface.liveIvAt
    : undefined;

  switch (sub) {
    case "greeks":    return <><div className="mb-3">{liveBar}</div><OvmeGreeks deal={deal} redact={redact} /></>;
    case "strategy":  return <><div className="mb-3">{liveBar}</div><OvmeStrategy deal={deal} redact={redact} /></>;
    case "surface":   return <><div className="mb-3">{liveBar}</div><Ovme3DSurface ticker={ticker} redact={redact} liveIvAt={liveIvAt} /></>;
    case "matrix":    return <><div className="mb-3">{liveBar}</div><OvmeMatrix deal={deal} redact={redact} /></>;
    case "skew":      return <><div className="mb-3">{liveBar}</div><OvmeSkew deal={deal} redact={redact} liveIvAt={liveIvAt} /></>;
    case "term":      return <><div className="mb-3">{liveBar}</div><OvmeTermStruct deal={deal} redact={redact} liveIvAt={liveIvAt} /></>;
    case "btest":     return <><div className="mb-3">{liveBar}</div><OvmeBacktest deal={deal} redact={redact} /></>;
    case "pricing":
    default:          return <><div className="mb-3">{liveBar}</div><OvmePricing deal={deal} setDeal={setDeal} redact={redact} /></>;
  }
}

// Shared helper available to sub-panels.
export function priceDeal(d: OvmeDeal) {
  return calculateBlackScholes(d.spot, d.strike, d.dte / 365, d.rate / 100, d.vol / 100);
}
