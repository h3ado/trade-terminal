import { createContext, useContext, useState, ReactNode } from 'react';

export type MacroCountry = 'US' | 'UK' | 'EU' | 'JP' | 'CN' | 'DE' | 'FR' | 'CA' | 'AU' | 'IN' | 'BR' | 'KR' | 'MX' | 'CH';

export interface CountryInfo {
  code: MacroCountry;
  name: string;
  flag: string;
  currency: string;
  centralBank: string;
}

export const countries: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', centralBank: 'Federal Reserve' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', centralBank: 'Bank of England' },
  { code: 'EU', name: 'Eurozone', flag: '🇪🇺', currency: 'EUR', centralBank: 'ECB' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', centralBank: 'Bank of Japan' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', centralBank: 'PBOC' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', centralBank: 'Bundesbank' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', centralBank: 'Banque de France' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', centralBank: 'Bank of Canada' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', centralBank: 'RBA' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', centralBank: 'RBI' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', centralBank: 'BCB' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', centralBank: 'BOK' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', centralBank: 'Banxico' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', centralBank: 'SNB' },
];

interface MacroCountryContextType {
  selectedCountry: MacroCountry;
  setSelectedCountry: (country: MacroCountry) => void;
  countryInfo: CountryInfo;
}

const MacroCountryContext = createContext<MacroCountryContextType | undefined>(undefined);

export function MacroCountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<MacroCountry>('US');
  const countryInfo = countries.find(c => c.code === selectedCountry) || countries[0];

  return (
    <MacroCountryContext.Provider value={{ selectedCountry, setSelectedCountry, countryInfo }}>
      {children}
    </MacroCountryContext.Provider>
  );
}

export function useMacroCountry() {
  const ctx = useContext(MacroCountryContext);
  if (!ctx) throw new Error('useMacroCountry must be used within MacroCountryProvider');
  return ctx;
}
