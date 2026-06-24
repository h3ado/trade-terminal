import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { checkHealth, getBridgeUrl, setBridgeUrl, type HealthStatus } from "@/services/ibkrBridge";

interface BridgeContextType {
  isLive: boolean;
  status: HealthStatus | null;
  checking: boolean;
  error: string | null;
  bridgeUrl: string;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

const BridgeContext = createContext<BridgeContextType | null>(null);

export function useBridge() {
  const ctx = useContext(BridgeContext);
  if (!ctx) throw new Error("useBridge must be inside BridgeProvider");
  return ctx;
}

export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeUrl, setBridgeUrlState] = useState(getBridgeUrl());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doHealthCheck = useCallback(async () => {
    setChecking(true);
    try {
      const h = await checkHealth();
      setStatus(h);
      setIsLive(h.status === "connected");
      setError(null);
    } catch (e: any) {
      setIsLive(false);
      setStatus(null);
      setError(e.message?.includes("fetch") ? "Bridge server unreachable" : e.message);
    } finally {
      setChecking(false);
    }
  }, []);

  const connect = useCallback(async (url: string) => {
    setBridgeUrl(url);
    setBridgeUrlState(url);
    setChecking(true);
    try {
      const h = await checkHealth();
      setStatus(h);
      setIsLive(h.status === "connected");
      setError(null);
    } catch (e: any) {
      setIsLive(false);
      setError("Cannot reach bridge at " + url);
    } finally {
      setChecking(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsLive(false);
    setStatus(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(doHealthCheck, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive, doHealthCheck]);

  return (
    <BridgeContext.Provider
      value={{ isLive, status, checking, error, bridgeUrl, connect, disconnect, refresh: doHealthCheck }}
    >
      {children}
    </BridgeContext.Provider>
  );
}
