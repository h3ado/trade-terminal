import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { useMacroCountry } from '@/contexts/MacroCountryContext';

interface MarketIndex {
  region: string;
  name: string;
  ticker: string;
  last: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: string;
  status: 'OPEN' | 'CLOSED' | 'PRE' | 'POST';
  country: string;
  pe?: number;
  ytd?: number;
  divYield?: number;
  mktCap?: string;
  w52High?: number;
  w52Low?: number;
  avgVol?: string;
  beta?: number;
  eps?: number;
}

const markets: MarketIndex[] = [
  { region: 'Americas', name: 'S&P 500', ticker: 'SPX', last: 5234.18, change: 15.29, changePct: 0.29, open: 5218.89, high: 5247.32, low: 5210.45, prevClose: 5218.89, volume: '3.8B', status: 'OPEN', country: 'US', pe: 21.4, ytd: 8.2, divYield: 1.42, beta: 1.00, mktCap: '$43.2T', w52High: 5325.44, w52Low: 4103.78, avgVol: '4.1B', eps: 244.58 },
  { region: 'Americas', name: 'Dow Jones Indus.', ticker: 'INDU', last: 39127.14, change: 62.42, changePct: 0.16, open: 39064.72, high: 39198.44, low: 39001.21, prevClose: 39064.72, volume: '312M', status: 'OPEN', country: 'US', pe: 18.2, ytd: 4.8, divYield: 1.82, beta: 0.92, mktCap: '$13.8T', w52High: 39889.05, w52Low: 32327.20, avgVol: '348M', eps: 2149.84 },
  { region: 'Americas', name: 'Nasdaq 100', ticker: 'NDX', last: 18339.44, change: 89.12, changePct: 0.49, open: 18250.32, high: 18401.77, low: 18202.11, prevClose: 18250.32, volume: '5.1B', status: 'OPEN', country: 'US', pe: 28.4, ytd: 12.6, divYield: 0.68, beta: 1.18, mktCap: '$24.1T', w52High: 18712.88, w52Low: 14058.34, avgVol: '5.8B', eps: 645.75 },
  { region: 'Americas', name: 'Russell 2000', ticker: 'RTY', last: 2070.16, change: -8.34, changePct: -0.40, open: 2078.50, high: 2084.22, low: 2062.88, prevClose: 2078.50, volume: '1.9B', status: 'OPEN', country: 'US', pe: 24.8, ytd: -2.4, divYield: 1.38, beta: 1.28, mktCap: '$3.1T', w52High: 2135.89, w52Low: 1636.94, avgVol: '2.2B' },
  { region: 'Americas', name: 'S&P/TSX Comp', ticker: 'SPTSX', last: 21894.32, change: 44.18, changePct: 0.20, open: 21850.14, high: 21932.44, low: 21812.05, prevClose: 21850.14, volume: '248M', status: 'OPEN', country: 'CA', pe: 16.8, ytd: 3.2, divYield: 2.84, mktCap: '$3.4T', w52High: 22213.07, w52Low: 18722.80, avgVol: '280M' },
  { region: 'Americas', name: 'Bovespa', ticker: 'IBOV', last: 128712.44, change: -412.67, changePct: -0.32, open: 129125.11, high: 129310.22, low: 128502.18, prevClose: 129125.11, volume: '11.2B', status: 'CLOSED', country: 'BR', pe: 8.4, ytd: -4.8, divYield: 4.82, mktCap: '$820B', w52High: 134391.67, w52Low: 104932.45, avgVol: '12.8B' },
  { region: 'Americas', name: 'IPC Mexico', ticker: 'MEXBOL', last: 56842.30, change: 182.44, changePct: 0.32, open: 56659.86, high: 56928.12, low: 56512.40, prevClose: 56659.86, volume: '8.2B', status: 'CLOSED', country: 'MX', pe: 14.2, ytd: 2.8, divYield: 2.42, mktCap: '$480B', w52High: 58124.50, w52Low: 48012.30, avgVol: '9.1B' },
  { region: 'Europe', name: 'FTSE 100', ticker: 'UKX', last: 7952.62, change: 22.14, changePct: 0.28, open: 7930.48, high: 7974.11, low: 7918.33, prevClose: 7930.48, volume: '812M', status: 'CLOSED', country: 'UK', pe: 12.4, ytd: 2.1, divYield: 3.62, mktCap: '$2.8T', w52High: 8047.44, w52Low: 7215.76, avgVol: '920M' },
  { region: 'Europe', name: 'DAX 40', ticker: 'DAX', last: 18112.44, change: 64.33, changePct: 0.36, open: 18048.11, high: 18156.72, low: 18012.89, prevClose: 18048.11, volume: '92M', status: 'CLOSED', country: 'DE', pe: 14.8, ytd: 6.8, divYield: 2.48, mktCap: '$1.9T', w52High: 18567.16, w52Low: 14630.21, avgVol: '105M' },
  { region: 'Europe', name: 'CAC 40', ticker: 'CAC', last: 8168.41, change: -12.78, changePct: -0.16, open: 8181.19, high: 8201.44, low: 8142.05, prevClose: 8181.19, volume: '3.4B', status: 'CLOSED', country: 'FR', pe: 15.2, ytd: 4.2, divYield: 2.88, mktCap: '$2.4T', w52High: 8259.19, w52Low: 6773.83, avgVol: '3.8B' },
  { region: 'Europe', name: 'Euro Stoxx 50', ticker: 'SX5E', last: 5042.88, change: 18.92, changePct: 0.38, open: 5023.96, high: 5058.14, low: 5014.33, prevClose: 5023.96, volume: '2.1B', status: 'CLOSED', country: 'EU', pe: 14.6, ytd: 5.4, divYield: 3.12, mktCap: '$4.2T', w52High: 5121.71, w52Low: 4061.91, avgVol: '2.4B' },
  { region: 'Europe', name: 'IBEX 35', ticker: 'IBEX', last: 11024.50, change: 35.70, changePct: 0.32, open: 10988.80, high: 11052.20, low: 10962.40, prevClose: 10988.80, volume: '1.8B', status: 'CLOSED', country: 'EU', pe: 12.8, ytd: 8.2, divYield: 3.84, mktCap: '$820B', w52High: 11288.30, w52Low: 8792.50, avgVol: '2.0B' },
  { region: 'Europe', name: 'SMI', ticker: 'SMI', last: 11672.30, change: -18.45, changePct: -0.16, open: 11690.75, high: 11715.40, low: 11648.20, prevClose: 11690.75, volume: '52M', status: 'CLOSED', country: 'CH', pe: 18.4, ytd: 3.8, divYield: 2.68, mktCap: '$1.6T', w52High: 11862.40, w52Low: 10342.60, avgVol: '58M' },
  { region: 'Europe', name: 'FTSE MIB', ticker: 'FTSEMIB', last: 34218.60, change: 128.40, changePct: 0.38, open: 34090.20, high: 34312.80, low: 34012.40, prevClose: 34090.20, volume: '1.4B', status: 'CLOSED', country: 'EU', pe: 10.2, ytd: 12.4, divYield: 4.12, mktCap: '$760B', w52High: 35124.80, w52Low: 26846.30, avgVol: '1.6B' },
  { region: 'Asia-Pac', name: 'Nikkei 225', ticker: 'NKY', last: 40128.32, change: 263.16, changePct: 0.66, open: 39865.16, high: 40212.44, low: 39801.22, prevClose: 39865.16, volume: '1.4T', status: 'CLOSED', country: 'JP', pe: 16.2, ytd: 14.8, divYield: 1.82, mktCap: '$5.8T', w52High: 41087.75, w52Low: 30526.80, avgVol: '1.6T' },
  { region: 'Asia-Pac', name: 'Hang Seng', ticker: 'HSI', last: 16828.93, change: -112.44, changePct: -0.66, open: 16941.37, high: 16978.12, low: 16782.05, prevClose: 16941.37, volume: '92B', status: 'CLOSED', country: 'CN', pe: 9.8, ytd: -8.2, divYield: 3.42, mktCap: '$4.2T', w52High: 22700.56, w52Low: 14597.31, avgVol: '108B' },
  { region: 'Asia-Pac', name: 'Shanghai Comp', ticker: 'SHCOMP', last: 3048.17, change: 8.92, changePct: 0.29, open: 3039.25, high: 3062.44, low: 3032.18, prevClose: 3039.25, volume: '324B', status: 'CLOSED', country: 'CN', pe: 12.4, ytd: -2.4, divYield: 2.62, mktCap: '$6.1T', w52High: 3418.95, w52Low: 2882.02, avgVol: '380B' },
  { region: 'Asia-Pac', name: 'ASX 200', ticker: 'AS51', last: 7814.20, change: 32.50, changePct: 0.42, open: 7781.70, high: 7828.40, low: 7768.90, prevClose: 7781.70, volume: '5.2B', status: 'CLOSED', country: 'AU', pe: 17.8, ytd: 4.2, divYield: 3.48, mktCap: '$1.8T', w52High: 7938.50, w52Low: 6898.70, avgVol: '5.8B' },
  { region: 'Asia-Pac', name: 'KOSPI', ticker: 'KOSPI', last: 2672.41, change: -14.33, changePct: -0.53, open: 2686.74, high: 2694.12, low: 2658.90, prevClose: 2686.74, volume: '8.4T', status: 'CLOSED', country: 'KR', pe: 12.2, ytd: -4.8, divYield: 1.92, mktCap: '$1.9T', w52High: 2786.44, w52Low: 2275.24, avgVol: '9.2T' },
  { region: 'Asia-Pac', name: 'SENSEX', ticker: 'SENSEX', last: 73852.94, change: 142.67, changePct: 0.19, open: 73710.27, high: 73988.12, low: 73628.44, prevClose: 73710.27, volume: '3.2B', status: 'CLOSED', country: 'IN', pe: 22.4, ytd: 2.8, divYield: 1.28, mktCap: '$4.8T', w52High: 75124.28, w52Low: 61002.57, avgVol: '3.6B' },
  { region: 'Asia-Pac', name: 'NIFTY 50', ticker: 'NIFTY', last: 22348.80, change: 42.20, changePct: 0.19, open: 22306.60, high: 22402.40, low: 22282.10, prevClose: 22306.60, volume: '2.8B', status: 'CLOSED', country: 'IN', pe: 21.8, ytd: 2.4, divYield: 1.32, mktCap: '$3.9T', w52High: 22794.70, w52Low: 18837.85, avgVol: '3.2B' },
  { region: 'Asia-Pac', name: 'CSI 300', ticker: 'CSI300', last: 3542.18, change: 12.44, changePct: 0.35, open: 3529.74, high: 3558.20, low: 3522.80, prevClose: 3529.74, volume: '142B', status: 'CLOSED', country: 'CN', pe: 11.8, ytd: -1.2, divYield: 2.48, mktCap: '$5.2T', w52High: 4124.92, w52Low: 3108.88, avgVol: '168B' },
];

const futures = [
  { name: 'E-mini S&P', ticker: 'ESM4', last: 5238.50, change: 4.25, changePct: 0.08, volume: '1.2M', oi: '2.8M' },
  { name: 'E-mini NQ', ticker: 'NQM4', last: 18362.00, change: 22.50, changePct: 0.12, volume: '892K', oi: '1.4M' },
  { name: 'E-mini Dow', ticker: 'YMM4', last: 39148.00, change: 18.00, changePct: 0.05, volume: '445K', oi: '620K' },
  { name: 'E-mini Russ', ticker: 'RTYM4', last: 2068.40, change: -1.80, changePct: -0.09, volume: '312K', oi: '480K' },
  { name: 'FTSE Fut', ticker: 'ZM4', last: 7958.00, change: 5.50, changePct: 0.07, volume: '82K', oi: '120K' },
  { name: 'DAX Fut', ticker: 'GXM4', last: 18128.00, change: 14.00, changePct: 0.08, volume: '68K', oi: '95K' },
  { name: 'Nikkei Fut', ticker: 'NKM4', last: 40180.00, change: 52.00, changePct: 0.13, volume: '42K', oi: '78K' },
  { name: 'HS Fut', ticker: 'HIM4', last: 16842.00, change: -18.00, changePct: -0.11, volume: '58K', oi: '92K' },
];

const regions = ['Americas', 'Europe', 'Asia-Pac'];

function DayRangeBar({ low, high, last, w52Low, w52High }: { low: number; high: number; last: number; w52Low?: number; w52High?: number }) {
  const range = high - low;
  const pos = range > 0 ? ((last - low) / range) * 100 : 50;
  return (
    <div className="relative h-1.5 bg-surface-elevated border border-grid-line">
      <div className="absolute top-0 left-0 h-full bg-accent/20" style={{ width: `${pos}%` }} />
      <div className="absolute top-0 h-full w-0.5 bg-accent" style={{ left: `${pos}%` }} />
    </div>
  );
}

export default function WorldMarkets() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(regions));

  const isHighlighted = (m: MarketIndex) => m.country === selectedCountry;
  const selected = selectedIndex ? markets.find(m => m.ticker === selectedIndex) : null;

  const toggleRegion = (r: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r); else next.add(r);
      return next;
    });
  };

  const fmtNum = (n: number, decimals = 2) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const chgColor = (v: number) => v >= 0 ? 'text-positive' : 'text-negative';

  // Bloomberg-style 52w range position
  const w52Pos = (m: MarketIndex) => {
    if (!m.w52High || !m.w52Low) return 50;
    const range = m.w52High - m.w52Low;
    return range > 0 ? ((m.last - m.w52Low) / range) * 100 : 50;
  };

  return (
    <div className="space-y-0">
      {/* Bloomberg-style header bar */}
      <div className="bg-surface-elevated border border-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm">{countryInfo.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono font-bold text-xs">WEI</span>
              <span className="text-foreground font-mono font-bold text-xs">World Equity Indices</span>
              <span className="text-muted-foreground font-mono text-[9px]">&lt;GO&gt;</span>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground">
              Real-Time Global Index Monitor • {markets.length} Indices • {futures.length} Futures
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
            <span className="text-positive font-bold">{markets.filter(m => m.status === 'OPEN').length} OPEN</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">{markets.filter(m => m.status === 'CLOSED').length} CLOSED</span>
          </div>
          <div className="text-muted-foreground">
            UPD: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Futures strip - Bloomberg GP style */}
      <div className="border-x border-b border-border">
        <div className="bg-accent/5 border-b border-accent/20 px-2 py-1 flex items-center gap-2">
          <span className="text-accent font-mono font-bold text-[9px]">1)</span>
          <span className="text-accent font-mono font-bold text-[9px] uppercase">Index Futures</span>
          <span className="text-muted-foreground font-mono text-[8px] ml-auto">Globex / Eurex / OSE / HKFE</span>
        </div>
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="bg-surface-deep border-b border-grid-line">
              <th className="text-left px-2 py-1 text-accent font-bold">TICKER</th>
              <th className="text-left px-1 py-1 text-muted-foreground">NAME</th>
              <th className="text-right px-2 py-1 text-muted-foreground">LAST</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              <th className="text-right px-2 py-1 text-muted-foreground">%CHG</th>
              <th className="text-right px-2 py-1 text-muted-foreground">VOLUME</th>
              <th className="text-right px-2 py-1 text-muted-foreground">OPEN INT</th>
            </tr>
          </thead>
          <tbody>
            {futures.map(f => (
              <tr key={f.ticker} className="border-b border-grid-line hover:bg-accent/5 transition-colors">
                <td className="px-2 py-1 text-accent font-bold">{f.ticker}</td>
                <td className="px-1 py-1 text-muted-foreground">{f.name}</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{fmtNum(f.last)}</td>
                <td className={`px-2 py-1 text-right font-bold ${chgColor(f.change)}`}>{f.change >= 0 ? '+' : ''}{fmtNum(f.change)}</td>
                <td className={`px-2 py-1 text-right font-bold ${chgColor(f.changePct)}`}>{f.changePct >= 0 ? '+' : ''}{f.changePct.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{f.volume}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{f.oi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Main index grid - Bloomberg WEI layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-x border-border">
        {regions.map((region, ri) => (
          <div key={region} className={`border-b border-border ${ri < 2 ? 'lg:border-r' : ''}`}>
            {/* Region header */}
            <button
              onClick={() => toggleRegion(region)}
              className="w-full bg-accent/5 border-b border-accent/20 px-2 py-1.5 flex items-center gap-2 hover:bg-accent/10 transition-colors"
            >
              <span className="text-accent font-mono font-bold text-[9px]">{ri + 2})</span>
              <span className="text-accent font-mono font-bold text-[9px] uppercase">{region}</span>
              <span className="text-muted-foreground font-mono text-[8px] ml-1">
                ({markets.filter(m => m.region === region).length})
              </span>
              <span className="ml-auto text-muted-foreground">
                {expandedRegions.has(region) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </button>

            {expandedRegions.has(region) && (
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr className="bg-surface-deep border-b border-grid-line">
                    <th className="text-left px-1.5 py-1 text-accent font-bold">TICKER</th>
                    <th className="text-right px-1.5 py-1 text-muted-foreground">LAST</th>
                    <th className="text-right px-1.5 py-1 text-muted-foreground">NET</th>
                    <th className="text-right px-1.5 py-1 text-muted-foreground">%CHG</th>
                    <th className="text-right px-1.5 py-1 text-muted-foreground">YTD%</th>
                    <th className="text-center px-1 py-1 text-muted-foreground">ST</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.filter(m => m.region === region).map(m => {
                    const isSelected = selectedIndex === m.ticker;
                    return (
                      <tr
                        key={m.ticker}
                        onClick={() => setSelectedIndex(isSelected ? null : m.ticker)}
                        className={`border-b border-grid-line cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent/15 border-l-2 border-l-accent' :
                          isHighlighted(m) ? 'bg-accent/5' :
                          'hover:bg-surface-elevated'
                        }`}
                      >
                        <td className="px-1.5 py-1.5">
                          <div className={`font-bold ${isSelected ? 'text-accent' : isHighlighted(m) ? 'text-accent' : 'text-foreground'}`}>
                            {m.ticker}
                          </div>
                          <div className="text-[7px] text-muted-foreground truncate max-w-[80px]">{m.name}</div>
                        </td>
                        <td className="px-1.5 py-1.5 text-right">
                          <span className="text-foreground font-bold text-[10px]">{fmtNum(m.last)}</span>
                        </td>
                        <td className={`px-1.5 py-1.5 text-right font-bold ${chgColor(m.change)}`}>
                          {m.change >= 0 ? '+' : ''}{fmtNum(m.change)}
                        </td>
                        <td className={`px-1.5 py-1.5 text-right font-bold ${chgColor(m.changePct)}`}>
                          {m.changePct >= 0 ? '+' : ''}{m.changePct.toFixed(2)}%
                        </td>
                        <td className={`px-1.5 py-1.5 text-right font-bold ${chgColor(m.ytd || 0)}`}>
                          {(m.ytd || 0) >= 0 ? '+' : ''}{m.ytd?.toFixed(1)}%
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <span className={`text-[7px] px-1 py-0.5 font-bold border ${
                            m.status === 'OPEN' ? 'text-positive border-positive/30 bg-positive/10' :
                            m.status === 'PRE' ? 'text-accent border-accent/30 bg-accent/10' :
                            'text-muted-foreground border-border bg-muted/20'
                          }`}>{m.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {/* Bloomberg-style security detail panel */}
      {selected && (
        <div className="border-x border-b border-border bg-surface-deep animate-in slide-in-from-top-1 duration-200">
          {/* Detail header */}
          <div className="bg-accent/10 border-b border-accent/20 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent font-mono font-bold text-sm">{selected.ticker}</span>
              <span className="text-foreground font-mono text-[11px]">{selected.name}</span>
              <span className="text-muted-foreground font-mono text-[9px]">{selected.region}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold text-lg ${chgColor(selected.change)}`}>
                {fmtNum(selected.last)}
              </span>
              <span className={`font-mono font-bold text-[11px] ${chgColor(selected.change)}`}>
                {selected.change >= 0 ? '▲' : '▼'} {fmtNum(Math.abs(selected.change))} ({selected.changePct >= 0 ? '+' : ''}{selected.changePct.toFixed(2)}%)
              </span>
              <button onClick={() => setSelectedIndex(null)} className="text-muted-foreground hover:text-foreground text-[10px] font-mono">✕</button>
            </div>
          </div>

          {/* Detail grid - Bloomberg DES style */}
          <div className="grid grid-cols-4 gap-0">
            {/* Column 1: Price Data */}
            <div className="border-r border-grid-line p-2">
              <div className="text-[8px] font-mono text-accent font-bold mb-2 uppercase border-b border-accent/20 pb-1">Price Data</div>
              {[
                { l: 'Open', v: fmtNum(selected.open) },
                { l: 'High', v: fmtNum(selected.high), c: 'text-positive' },
                { l: 'Low', v: fmtNum(selected.low), c: 'text-negative' },
                { l: 'Prev Close', v: fmtNum(selected.prevClose) },
                { l: 'Net Change', v: `${selected.change >= 0 ? '+' : ''}${fmtNum(selected.change)}`, c: chgColor(selected.change) },
                { l: '% Change', v: `${selected.changePct >= 0 ? '+' : ''}${selected.changePct.toFixed(2)}%`, c: chgColor(selected.changePct) },
              ].map(row => (
                <div key={row.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className={`font-bold ${row.c || 'text-foreground'}`}>{row.v}</span>
                </div>
              ))}
              <div className="mt-2">
                <div className="text-[7px] font-mono text-muted-foreground mb-0.5 flex justify-between">
                  <span>Day Range</span>
                </div>
                <DayRangeBar low={selected.low} high={selected.high} last={selected.last} />
                <div className="flex justify-between text-[7px] font-mono text-muted-foreground mt-0.5">
                  <span>{fmtNum(selected.low)}</span>
                  <span>{fmtNum(selected.high)}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Fundamentals */}
            <div className="border-r border-grid-line p-2">
              <div className="text-[8px] font-mono text-accent font-bold mb-2 uppercase border-b border-accent/20 pb-1">Fundamentals</div>
              {[
                { l: 'P/E Ratio', v: selected.pe?.toFixed(1) || '—' },
                { l: 'EPS', v: selected.eps ? `$${selected.eps.toFixed(2)}` : '—' },
                { l: 'Div Yield', v: selected.divYield ? `${selected.divYield.toFixed(2)}%` : '—', c: 'text-positive' },
                { l: 'Beta', v: selected.beta?.toFixed(2) || '—' },
                { l: 'YTD Return', v: `${(selected.ytd || 0) >= 0 ? '+' : ''}${selected.ytd?.toFixed(1)}%`, c: chgColor(selected.ytd || 0) },
                { l: 'Market Cap', v: selected.mktCap || '—' },
              ].map(row => (
                <div key={row.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className={`font-bold ${row.c || 'text-foreground'}`}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Column 3: Volume & Range */}
            <div className="border-r border-grid-line p-2">
              <div className="text-[8px] font-mono text-accent font-bold mb-2 uppercase border-b border-accent/20 pb-1">Volume & Range</div>
              {[
                { l: 'Volume', v: selected.volume },
                { l: 'Avg Volume', v: selected.avgVol || '—' },
                { l: 'Vol Ratio', v: '0.93x' },
                { l: '52W High', v: selected.w52High ? fmtNum(selected.w52High) : '—', c: 'text-positive' },
                { l: '52W Low', v: selected.w52Low ? fmtNum(selected.w52Low) : '—', c: 'text-negative' },
                { l: '52W %Rng', v: `${w52Pos(selected).toFixed(0)}%` },
              ].map(row => (
                <div key={row.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                  <span className="text-muted-foreground">{row.l}</span>
                  <span className={`font-bold ${row.c || 'text-foreground'}`}>{row.v}</span>
                </div>
              ))}
              {selected.w52High && selected.w52Low && (
                <div className="mt-2">
                  <div className="text-[7px] font-mono text-muted-foreground mb-0.5">52 Week Range</div>
                  <DayRangeBar low={selected.w52Low} high={selected.w52High} last={selected.last} />
                  <div className="flex justify-between text-[7px] font-mono text-muted-foreground mt-0.5">
                    <span>{fmtNum(selected.w52Low)}</span>
                    <span>{fmtNum(selected.w52High)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Column 4: Relative Performance */}
            <div className="p-2">
              <div className="text-[8px] font-mono text-accent font-bold mb-2 uppercase border-b border-accent/20 pb-1">Relative Performance</div>
              {[
                { period: '1D', ret: selected.changePct },
                { period: '1W', ret: selected.changePct * 2.1 + (Math.random() - 0.5) * 2 },
                { period: '1M', ret: (selected.ytd || 0) * 0.3 + (Math.random() - 0.5) * 3 },
                { period: '3M', ret: (selected.ytd || 0) * 0.6 + (Math.random() - 0.5) * 4 },
                { period: 'YTD', ret: selected.ytd || 0 },
                { period: '1Y', ret: (selected.ytd || 0) * 1.8 + (Math.random() - 0.5) * 6 },
              ].map(row => (
                <div key={row.period} className="flex items-center gap-1.5 py-0.5 text-[9px] font-mono">
                  <span className="text-muted-foreground w-6">{row.period}</span>
                  <div className="flex-1 h-2 bg-surface-elevated border border-grid-line relative">
                    {row.ret >= 0 ? (
                      <div className="absolute top-0 left-1/2 h-full bg-positive/30" style={{ width: `${Math.min(row.ret * 2, 50)}%` }} />
                    ) : (
                      <div className="absolute top-0 h-full bg-negative/30" style={{ right: '50%', width: `${Math.min(Math.abs(row.ret) * 2, 50)}%` }} />
                    )}
                    <div className="absolute top-0 left-1/2 h-full w-px bg-muted-foreground/30" />
                  </div>
                  <span className={`font-bold w-14 text-right ${chgColor(row.ret)}`}>
                    {row.ret >= 0 ? '+' : ''}{row.ret.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Breadth - Bloomberg MMAP style */}
      <div className="border-x border-b border-border">
        <div className="bg-accent/5 border-b border-accent/20 px-2 py-1 flex items-center gap-2">
          <span className="text-accent font-mono font-bold text-[9px]">5)</span>
          <span className="text-accent font-mono font-bold text-[9px] uppercase">Market Breadth — S&P 500</span>
        </div>
        <div className="grid grid-cols-8 gap-0 divide-x divide-grid-line">
          {[
            { label: 'Advancing', value: '312', color: 'text-positive' },
            { label: 'Declining', value: '184', color: 'text-negative' },
            { label: 'Unchanged', value: '7', color: 'text-muted-foreground' },
            { label: 'New Highs', value: '48', color: 'text-positive' },
            { label: 'New Lows', value: '12', color: 'text-negative' },
            { label: 'A/D Ratio', value: '1.70', color: 'text-positive' },
            { label: 'Up Volume', value: '2.4B', color: 'text-positive' },
            { label: 'Down Vol', value: '1.2B', color: 'text-negative' },
          ].map(b => (
            <div key={b.label} className="px-2 py-2 text-center">
              <div className="text-[7px] font-mono text-muted-foreground uppercase">{b.label}</div>
              <div className={`text-sm font-mono font-bold ${b.color}`}>{b.value}</div>
            </div>
          ))}
        </div>
        {/* Breadth bar */}
        <div className="px-3 py-2 border-t border-grid-line">
          <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground mb-1">
            <span>A/D BREADTH</span>
            <span className="text-positive font-bold">62.4%</span>
            <span className="ml-auto">McClellan Osc: <span className="text-positive font-bold">+42.8</span></span>
          </div>
          <div className="h-2 bg-surface-elevated border border-grid-line flex overflow-hidden">
            <div className="h-full bg-positive/40" style={{ width: '62.4%' }} />
            <div className="h-full bg-negative/40" style={{ width: '36.6%' }} />
            <div className="h-full bg-muted-foreground/20" style={{ width: '1%' }} />
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="border-x border-b border-border bg-surface-elevated px-3 py-1 flex items-center justify-between text-[8px] font-mono text-muted-foreground">
        <span>Source: Bloomberg LP • Delayed 15min where noted</span>
        <span>Page 1/1 • WEI &lt;GO&gt; for refresh</span>
      </div>
    </div>
  );
}
