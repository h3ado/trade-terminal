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

  // Keep deal ticker/spot synced if user switches ticker at the header.
  useMemo(() => {
    setDeal((d) => ({ ...d, ticker, spot: SPOT_BY_TICKER[ticker] ?? d.spot, strike: Math.round(SPOT_BY_TICKER[ticker] ?? d.spot) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  switch (sub) {
    case "greeks":    return <OvmeGreeks deal={deal} redact={redact} />;
    case "strategy":  return <OvmeStrategy deal={deal} redact={redact} />;
    case "surface":   return <Ovme3DSurface ticker={ticker} redact={redact} />;
    case "matrix":    return <OvmeMatrix deal={deal} redact={redact} />;
    case "skew":      return <OvmeSkew deal={deal} redact={redact} />;
    case "term":      return <OvmeTermStruct deal={deal} redact={redact} />;
    case "btest":     return <OvmeBacktest deal={deal} redact={redact} />;
    case "pricing":
    default:          return <OvmePricing deal={deal} setDeal={setDeal} redact={redact} />;
  }
}

// Shared helper available to sub-panels.
export function priceDeal(d: OvmeDeal) {
  return calculateBlackScholes(d.spot, d.strike, d.dte / 365, d.rate / 100, d.vol / 100);
}
