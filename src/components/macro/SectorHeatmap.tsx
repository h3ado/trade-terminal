import { useMacroCountry, MacroCountry } from '@/contexts/MacroCountryContext';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailMiniChart, DetailKV } from './MacroExpandable';
import { useState } from 'react';

interface Sector {
  name: string;
  ticker: string;
  dayChg: number;
  weekChg: number;
  monthChg: number;
  ytdChg: number;
  pe: number;
  marketCap: string;
  topHoldings: string[];
  divYield?: number;
  avgVolume?: string;
  relStrength?: number;
  description?: string;
}

const sectorsByCountry: Record<string, Sector[]> = {
  US: [
    { name: 'Technology', ticker: 'XLK', dayChg: 0.62, weekChg: 1.84, monthChg: 4.12, ytdChg: 12.8, pe: 28.4, marketCap: '$16.2T', topHoldings: ['AAPL', 'MSFT', 'NVDA'], divYield: 0.72, avgVolume: '12.4M', relStrength: 78, description: 'Tech sector driven by AI infrastructure spending and cloud growth.' },
    { name: 'Healthcare', ticker: 'XLV', dayChg: -0.18, weekChg: 0.42, monthChg: -1.22, ytdChg: 2.4, pe: 18.2, marketCap: '$7.8T', topHoldings: ['UNH', 'JNJ', 'LLY'], divYield: 1.52, avgVolume: '8.2M', relStrength: 45, description: 'GLP-1 drug cycle driving LLY/NVO. Managed care under political pressure.' },
    { name: 'Financials', ticker: 'XLF', dayChg: 0.34, weekChg: 1.12, monthChg: 2.88, ytdChg: 8.6, pe: 15.4, marketCap: '$8.4T', topHoldings: ['BRK.B', 'JPM', 'V'], divYield: 1.68, avgVolume: '14.8M', relStrength: 65 },
    { name: 'Consumer Disc', ticker: 'XLY', dayChg: 0.78, weekChg: 2.14, monthChg: 5.42, ytdChg: 14.2, pe: 26.8, marketCap: '$6.2T', topHoldings: ['AMZN', 'TSLA', 'HD'], divYield: 0.82 },
    { name: 'Communication', ticker: 'XLC', dayChg: 0.42, weekChg: 1.56, monthChg: 3.88, ytdChg: 16.4, pe: 22.6, marketCap: '$5.8T', topHoldings: ['META', 'GOOGL', 'NFLX'], divYield: 0.68 },
    { name: 'Industrials', ticker: 'XLI', dayChg: 0.12, weekChg: 0.88, monthChg: 1.64, ytdChg: 6.2, pe: 21.4, marketCap: '$5.4T', topHoldings: ['GE', 'CAT', 'UNP'], divYield: 1.42 },
    { name: 'Consumer Stap', ticker: 'XLP', dayChg: -0.08, weekChg: -0.22, monthChg: -0.84, ytdChg: 1.2, pe: 20.8, marketCap: '$4.2T', topHoldings: ['PG', 'KO', 'PEP'], divYield: 2.58 },
    { name: 'Energy', ticker: 'XLE', dayChg: 1.24, weekChg: 3.42, monthChg: 6.88, ytdChg: 4.8, pe: 12.2, marketCap: '$3.2T', topHoldings: ['XOM', 'CVX', 'COP'], divYield: 3.42, relStrength: 72, description: 'Strong with oil rally. Capital discipline supporting shareholder returns.' },
    { name: 'Utilities', ticker: 'XLU', dayChg: -0.32, weekChg: -0.68, monthChg: -1.44, ytdChg: -2.4, pe: 16.8, marketCap: '$1.8T', topHoldings: ['NEE', 'DUK', 'SO'], divYield: 3.28 },
    { name: 'Real Estate', ticker: 'XLRE', dayChg: -0.44, weekChg: -1.12, monthChg: -2.82, ytdChg: -4.2, pe: 38.4, marketCap: '$1.4T', topHoldings: ['PLD', 'AMT', 'EQIX'], divYield: 3.62, relStrength: 22, description: 'Under pressure from high rates. CRE stress in office sector.' },
    { name: 'Materials', ticker: 'XLB', dayChg: 0.56, weekChg: 1.28, monthChg: 2.42, ytdChg: 3.6, pe: 18.6, marketCap: '$1.2T', topHoldings: ['LIN', 'APD', 'SHW'], divYield: 1.82 },
  ],
  UK: [
    { name: 'Oil & Gas', ticker: 'FTSE-OG', dayChg: 0.82, weekChg: 2.14, monthChg: 4.82, ytdChg: 6.4, pe: 8.4, marketCap: '£420B', topHoldings: ['SHEL', 'BP', 'CNE'] },
    { name: 'Banks', ticker: 'FTSE-BK', dayChg: 0.44, weekChg: 1.28, monthChg: 3.42, ytdChg: 12.2, pe: 7.8, marketCap: '£380B', topHoldings: ['HSBA', 'BARC', 'LLOY'] },
    { name: 'Mining', ticker: 'FTSE-MN', dayChg: 1.12, weekChg: 3.24, monthChg: 6.82, ytdChg: 2.8, pe: 10.4, marketCap: '£240B', topHoldings: ['RIO', 'AAL', 'GLEN'] },
    { name: 'Pharma', ticker: 'FTSE-PH', dayChg: -0.22, weekChg: -0.44, monthChg: -1.82, ytdChg: 4.2, pe: 14.8, marketCap: '£320B', topHoldings: ['AZN', 'GSK', 'HIK'] },
    { name: 'Consumer', ticker: 'FTSE-CS', dayChg: 0.14, weekChg: 0.82, monthChg: 1.44, ytdChg: 3.8, pe: 18.2, marketCap: '£280B', topHoldings: ['ULVR', 'DGE', 'RKT'] },
    { name: 'Insurance', ticker: 'FTSE-IN', dayChg: 0.32, weekChg: 0.94, monthChg: 2.28, ytdChg: 8.4, pe: 11.2, marketCap: '£180B', topHoldings: ['PHNX', 'LGEN', 'AV'] },
  ],
  EU: [
    { name: 'Luxury', ticker: 'SXQP', dayChg: 0.88, weekChg: 2.44, monthChg: 5.82, ytdChg: 18.4, pe: 28.2, marketCap: '€1.8T', topHoldings: ['MC', 'RMS', 'CDI'] },
    { name: 'Autos', ticker: 'SXAP', dayChg: -0.42, weekChg: -1.22, monthChg: -3.44, ytdChg: -8.2, pe: 6.4, marketCap: '€480B', topHoldings: ['VOW', 'MBG', 'BMW'] },
    { name: 'Banks', ticker: 'SX7P', dayChg: 0.68, weekChg: 1.82, monthChg: 4.28, ytdChg: 22.4, pe: 7.2, marketCap: '€620B', topHoldings: ['BNP', 'SAN', 'ISP'] },
    { name: 'Tech', ticker: 'SX8P', dayChg: 0.52, weekChg: 1.44, monthChg: 3.82, ytdChg: 14.8, pe: 24.6, marketCap: '€1.2T', topHoldings: ['ASML', 'SAP', 'SIE'] },
    { name: 'Healthcare', ticker: 'SXDP', dayChg: -0.18, weekChg: 0.24, monthChg: -0.82, ytdChg: 2.4, pe: 18.8, marketCap: '€1.4T', topHoldings: ['NVO', 'ROG', 'AZN'] },
    { name: 'Energy', ticker: 'SXEP', dayChg: 0.94, weekChg: 2.82, monthChg: 5.44, ytdChg: 4.2, pe: 8.8, marketCap: '€680B', topHoldings: ['TTE', 'EQNR', 'ENI'] },
  ],
  JP: [
    { name: 'Autos', ticker: 'TPX-AU', dayChg: 0.82, weekChg: 2.44, monthChg: 6.82, ytdChg: 22.4, pe: 10.2, marketCap: '¥84T', topHoldings: ['7203', '7267', '7201'] },
    { name: 'Electronics', ticker: 'TPX-EL', dayChg: 0.64, weekChg: 1.82, monthChg: 4.82, ytdChg: 16.8, pe: 18.4, marketCap: '¥62T', topHoldings: ['6758', '6861', '6902'] },
    { name: 'Banks', ticker: 'TPX-BK', dayChg: 1.24, weekChg: 3.42, monthChg: 8.82, ytdChg: 28.4, pe: 9.8, marketCap: '¥48T', topHoldings: ['8306', '8316', '8411'] },
    { name: 'Pharma', ticker: 'TPX-PH', dayChg: -0.32, weekChg: -0.82, monthChg: -2.44, ytdChg: -4.2, pe: 22.8, marketCap: '¥28T', topHoldings: ['4502', '4503', '4519'] },
    { name: 'Trading', ticker: 'TPX-TR', dayChg: 0.44, weekChg: 1.28, monthChg: 3.82, ytdChg: 12.4, pe: 8.4, marketCap: '¥42T', topHoldings: ['8058', '8031', '8001'] },
  ],
};

const getSectors = (country: string): Sector[] => sectorsByCountry[country] || sectorsByCountry['US'];

const getHeatColor = (val: number) => {
  if (val >= 2) return 'bg-positive text-positive-foreground';
  if (val >= 0.5) return 'bg-positive/60 text-foreground';
  if (val > 0) return 'bg-positive/20 text-foreground';
  if (val === 0) return 'bg-muted text-foreground';
  if (val > -0.5) return 'bg-negative/20 text-foreground';
  if (val > -2) return 'bg-negative/60 text-foreground';
  return 'bg-negative text-white';
};

export default function SectorHeatmap() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();
  const sectors = getSectors(selectedCountry);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Sector Performance</span>
        <span className="text-muted-foreground font-mono text-[9px]">SECT &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click sectors for analysis</span>
      </div>

      {/* Visual heatmap grid */}
      <div className="grid grid-cols-4 gap-1">
        {sectors.map(s => (
          <div key={s.ticker} className={`p-2 border border-border ${getHeatColor(s.dayChg)} transition-colors cursor-pointer hover:brightness-110`} onClick={() => toggleRow(s.ticker)}>
            <div className="flex justify-between items-start">
              <span className="font-mono font-bold text-[10px]">{s.ticker}</span>
              <span className="font-mono font-bold text-[11px]">
                {s.dayChg >= 0 ? '+' : ''}{s.dayChg.toFixed(2)}%
              </span>
            </div>
            <div className="text-[8px] font-mono opacity-80 mt-0.5">{s.name}</div>
            <div className="text-[8px] font-mono opacity-60 mt-0.5">
              W: {s.weekChg >= 0 ? '+' : ''}{s.weekChg.toFixed(1)}% | M: {s.monthChg >= 0 ? '+' : ''}{s.monthChg.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Expanded heatmap details */}
      {sectors.filter(s => isExpanded(s.ticker)).map(s => {
        const perfHist = [
          { label: '1D', value: s.dayChg },
          { label: '1W', value: s.weekChg },
          { label: '1M', value: s.monthChg },
          { label: 'YTD', value: s.ytdChg },
        ];
        return (
          <div key={`detail-${s.ticker}`} className="border border-accent/30 bg-surface-elevated/50 p-3 animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-accent font-mono font-bold text-[11px]">{s.ticker} — {s.name}</span>
              <button onClick={() => toggleRow(s.ticker)} className="text-[8px] font-mono text-muted-foreground hover:text-accent">✕ Close</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Performance</div>
                <DetailMiniChart data={perfHist} dataKey="value" height={70} color={s.dayChg >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />
              </div>
              <div>
                <DetailKV items={[
                  { label: 'P/E Ratio', value: s.pe.toFixed(1) },
                  { label: 'Market Cap', value: s.marketCap },
                  { label: 'Div Yield', value: s.divYield ? `${s.divYield.toFixed(2)}%` : '—' },
                  { label: 'Avg Volume', value: s.avgVolume || '—' },
                  { label: 'Rel. Strength', value: s.relStrength ? `${s.relStrength}` : '—' },
                  { label: 'Top Holdings', value: s.topHoldings.join(', ') },
                ]} />
              </div>
              <div>
                {s.description && (
                  <div className="text-[9px] font-mono text-foreground border border-border p-2 mb-2">{s.description}</div>
                )}
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: '1D', value: s.dayChg },
                    { label: '1W', value: s.weekChg },
                    { label: '1M', value: s.monthChg },
                    { label: 'YTD', value: s.ytdChg },
                  ].map(p => (
                    <div key={p.label} className="border border-border p-1">
                      <div className="text-[7px] font-mono text-muted-foreground">{p.label}</div>
                      <div className={`text-[10px] font-mono font-bold ${p.value >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {p.value >= 0 ? '+' : ''}{p.value.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Detailed table */}
      <div className="border border-border overflow-hidden">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left px-2 py-1.5 text-accent font-bold">SECTOR</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">ETF</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">1D</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">1W</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">1M</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">YTD</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">P/E</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">MKT CAP</th>
              <th className="text-left px-2 py-1.5 text-accent font-bold">TOP 3</th>
            </tr>
          </thead>
          <tbody>
            {[...sectors].sort((a, b) => b.dayChg - a.dayChg).map((s, i) => (
              <tr key={s.ticker} className={`border-b border-grid-line hover:bg-accent/5 cursor-pointer ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`} onClick={() => toggleRow(s.ticker)}>
                <td className="px-2 py-1 text-foreground font-bold">{s.name}</td>
                <td className="px-2 py-1 text-center text-accent">{s.ticker}</td>
                {[s.dayChg, s.weekChg, s.monthChg, s.ytdChg].map((v, j) => (
                  <td key={j} className={`px-2 py-1 text-right font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {v >= 0 ? '+' : ''}{v.toFixed(2)}%
                  </td>
                ))}
                <td className="px-2 py-1 text-right text-muted-foreground">{s.pe.toFixed(1)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{s.marketCap}</td>
                <td className="px-2 py-1 text-muted-foreground text-[8px]">{s.topHoldings.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
