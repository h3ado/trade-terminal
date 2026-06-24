import { useQuery } from "@tanstack/react-query";
import { useBridge } from "@/contexts/BridgeContext";
import {
  fetchQuote, fetchOptionsChain, fetchGex,
  fetchVolSurface, fetchHistoricalIv,
  type Quote, type ChainResponse, type GexResponse,
  type SurfaceResponse, type HistoricalIvResponse,
} from "@/services/ibkrBridge";

type Endpoint = "quote" | "chain" | "gex" | "surface" | "historicalIv";

type EndpointReturnType<T extends Endpoint> =
  T extends "quote" ? Quote :
  T extends "chain" ? ChainResponse :
  T extends "gex" ? GexResponse :
  T extends "surface" ? SurfaceResponse :
  T extends "historicalIv" ? HistoricalIvResponse :
  never;

const fetchers: Record<Endpoint, (symbol: string) => Promise<any>> = {
  quote: fetchQuote,
  chain: fetchOptionsChain,
  gex: fetchGex,
  surface: fetchVolSurface,
  historicalIv: fetchHistoricalIv,
};

export function useLiveData<T extends Endpoint>(
  endpoint: T,
  symbol: string,
  options?: { refetchInterval?: number }
) {
  const { isLive } = useBridge();

  return useQuery<EndpointReturnType<T>>({
    queryKey: ["ibkr", endpoint, symbol],
    queryFn: () => fetchers[endpoint](symbol),
    enabled: isLive && !!symbol,
    refetchInterval: isLive ? (options?.refetchInterval ?? 30000) : false,
    retry: 1,
    staleTime: 10000,
  });
}
