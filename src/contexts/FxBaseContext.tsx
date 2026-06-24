import { createContext, useContext, useState, ReactNode } from 'react';

export const FX_BASES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY'] as const;
export type FxBase = typeof FX_BASES[number];

interface Ctx {
  base: FxBase;
  setBase: (b: FxBase) => void;
  pair: string;
  setPair: (p: string) => void;
}

const FxBaseContext = createContext<Ctx | null>(null);

export function FxBaseProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<FxBase>('USD');
  const [pair, setPair] = useState<string>('EURUSD');
  return (
    <FxBaseContext.Provider value={{ base, setBase, pair, setPair }}>
      {children}
    </FxBaseContext.Provider>
  );
}

export function useFxBase() {
  const ctx = useContext(FxBaseContext);
  if (!ctx) throw new Error('useFxBase must be used inside FxBaseProvider');
  return ctx;
}
