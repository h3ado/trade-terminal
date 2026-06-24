import { useMacroCountry } from '@/contexts/MacroCountryContext';
import FREDLiveStrip from './FREDLiveStrip';
import WorldBankStrip from './WorldBankStrip';

// Map MacroCountry 2-letter codes to ISO3 for the World Bank API.
const ISO3: Record<string, string> = {
  US: 'USA', UK: 'GBR', EU: 'DEU', JP: 'JPN', CN: 'CHN', DE: 'DEU', FR: 'FRA',
  CA: 'CAN', AU: 'AUS', IN: 'IND', BR: 'BRA', KR: 'KOR', MX: 'MEX', CH: 'CHE',
};

interface GDPData {
  country: string;
  code: string;
  flag: string;
  gdpTrillions: number;
  realGrowth: number;
  prevGrowth: number;
  forecast2026: number;
  forecast2027: number;
  gdpPerCapita: number;
  debtToGDP: number;
  currentAccount: number;
  inflationCPI: number;
  fdi: number;
  population: string;
  region: string;
}

const gdpData: GDPData[] = [
  { country: 'United States', code: 'US', flag: '🇺🇸', gdpTrillions: 28.78, realGrowth: 2.8, prevGrowth: 3.0, forecast2026: 2.4, forecast2027: 2.1, gdpPerCapita: 85420, debtToGDP: 123.4, currentAccount: -3.8, inflationCPI: 3.2, fdi: 388, population: '335M', region: 'Americas' },
  { country: 'China', code: 'CN', flag: '🇨🇳', gdpTrillions: 18.54, realGrowth: 5.2, prevGrowth: 5.0, forecast2026: 4.8, forecast2027: 4.4, gdpPerCapita: 12882, debtToGDP: 83.6, currentAccount: 1.4, inflationCPI: 0.7, fdi: -18, population: '1.41B', region: 'Asia' },
  { country: 'Japan', code: 'JP', flag: '🇯🇵', gdpTrillions: 4.41, realGrowth: 1.9, prevGrowth: 2.0, forecast2026: 1.2, forecast2027: 1.0, gdpPerCapita: 35390, debtToGDP: 255.2, currentAccount: 3.2, inflationCPI: 2.8, fdi: 24, population: '124M', region: 'Asia' },
  { country: 'Germany', code: 'DE', flag: '🇩🇪', gdpTrillions: 4.46, realGrowth: -0.1, prevGrowth: -0.3, forecast2026: 0.8, forecast2027: 1.4, gdpPerCapita: 52824, debtToGDP: 64.8, currentAccount: 6.8, inflationCPI: 2.4, fdi: 42, population: '84M', region: 'Europe' },
  { country: 'India', code: 'IN', flag: '🇮🇳', gdpTrillions: 3.94, realGrowth: 7.8, prevGrowth: 7.6, forecast2026: 6.8, forecast2027: 6.4, gdpPerCapita: 2730, debtToGDP: 81.8, currentAccount: -1.2, inflationCPI: 5.4, fdi: 48, population: '1.44B', region: 'Asia' },
  { country: 'United Kingdom', code: 'UK', flag: '🇬🇧', gdpTrillions: 3.34, realGrowth: 0.6, prevGrowth: 0.4, forecast2026: 1.2, forecast2027: 1.4, gdpPerCapita: 48866, debtToGDP: 100.2, currentAccount: -2.8, inflationCPI: 3.4, fdi: 68, population: '68M', region: 'Europe' },
  { country: 'France', code: 'FR', flag: '🇫🇷', gdpTrillions: 3.05, realGrowth: 0.9, prevGrowth: 0.7, forecast2026: 1.2, forecast2027: 1.6, gdpPerCapita: 44408, debtToGDP: 110.8, currentAccount: -0.8, inflationCPI: 2.2, fdi: 38, population: '68M', region: 'Europe' },
  { country: 'Canada', code: 'CA', flag: '🇨🇦', gdpTrillions: 2.14, realGrowth: 1.2, prevGrowth: 1.0, forecast2026: 1.8, forecast2027: 2.0, gdpPerCapita: 53248, debtToGDP: 106.4, currentAccount: -1.4, inflationCPI: 2.9, fdi: 52, population: '40M', region: 'Americas' },
  { country: 'Brazil', code: 'BR', flag: '🇧🇷', gdpTrillions: 2.13, realGrowth: 2.9, prevGrowth: 3.0, forecast2026: 2.2, forecast2027: 2.4, gdpPerCapita: 9920, debtToGDP: 74.2, currentAccount: -1.6, inflationCPI: 4.6, fdi: 64, population: '215M', region: 'Americas' },
  { country: 'South Korea', code: 'KR', flag: '🇰🇷', gdpTrillions: 1.72, realGrowth: 2.1, prevGrowth: 1.4, forecast2026: 2.4, forecast2027: 2.2, gdpPerCapita: 33148, debtToGDP: 54.2, currentAccount: 4.2, inflationCPI: 3.2, fdi: 18, population: '52M', region: 'Asia' },
  { country: 'Australia', code: 'AU', flag: '🇦🇺', gdpTrillions: 1.72, realGrowth: 1.5, prevGrowth: 2.1, forecast2026: 2.0, forecast2027: 2.4, gdpPerCapita: 65126, debtToGDP: 52.8, currentAccount: 1.2, inflationCPI: 3.4, fdi: 42, population: '26M', region: 'Asia' },
  { country: 'Mexico', code: 'MX', flag: '🇲🇽', gdpTrillions: 1.79, realGrowth: 3.4, prevGrowth: 3.2, forecast2026: 2.8, forecast2027: 2.4, gdpPerCapita: 13420, debtToGDP: 52.4, currentAccount: -1.2, inflationCPI: 4.2, fdi: 36, population: '132M', region: 'Americas' },
  { country: 'Switzerland', code: 'CH', flag: '🇨🇭', gdpTrillions: 0.91, realGrowth: 0.8, prevGrowth: 0.7, forecast2026: 1.4, forecast2027: 1.6, gdpPerCapita: 102866, debtToGDP: 38.8, currentAccount: 8.2, inflationCPI: 1.3, fdi: 82, population: '9M', region: 'Europe' },
];

const getGrowthColor = (v: number) => {
  if (v >= 5) return 'text-positive font-bold';
  if (v >= 2) return 'text-positive';
  if (v >= 0) return 'text-accent';
  return 'text-negative';
};

export default function GlobalGDP() {
  const { selectedCountry } = useMacroCountry();
  const totalGDP = gdpData.reduce((s, d) => s + d.gdpTrillions, 0);
  const avgGrowth = gdpData.reduce((s, d) => s + d.realGrowth, 0) / gdpData.length;
  const fastest = [...gdpData].sort((a, b) => b.realGrowth - a.realGrowth)[0];
  const weakest = [...gdpData].sort((a, b) => a.realGrowth - b.realGrowth)[0];

  const iso3 = ISO3[selectedCountry] ?? 'USA';
  const countryName = gdpData.find((d) => d.code === selectedCountry)?.country;

  return (
    <div className="space-y-3">
      <FREDLiveStrip keys={['gdp_growth', 'industrial_prod', 'retail_sales', 'm2']} title="LIVE · FRED US" />
      <WorldBankStrip iso3={iso3} countryName={countryName} />
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">🌍 Global GDP & Macro Scorecard</span>
        <span className="text-muted-foreground font-mono text-[9px]">WGDP &lt;GO&gt;</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">TOP {gdpData.length} GDP</div>
          <div className="text-xl font-mono font-bold text-foreground">${totalGDP.toFixed(1)}T</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">AVG GROWTH</div>
          <div className={`text-xl font-mono font-bold ${avgGrowth >= 0 ? 'text-positive' : 'text-negative'}`}>{avgGrowth.toFixed(1)}%</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">FASTEST</div>
          <div className="text-xl font-mono font-bold text-positive">{fastest.flag} {fastest.realGrowth}%</div>
          <div className="text-[9px] font-mono text-muted-foreground">{fastest.country}</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">WEAKEST</div>
          <div className="text-xl font-mono font-bold text-negative">{weakest.flag} {weakest.realGrowth}%</div>
          <div className="text-[9px] font-mono text-muted-foreground">{weakest.country}</div>
        </div>
      </div>

      {/* GDP share visual */}
      <div className="border border-border p-2">
        <div className="text-[9px] font-mono text-muted-foreground mb-1">GDP Share</div>
        <div className="flex h-6 overflow-hidden rounded">
          {gdpData.map((d, i) => {
            const width = (d.gdpTrillions / totalGDP) * 100;
            const colors = ['bg-accent', 'bg-negative', 'bg-positive', 'bg-accent/70', 'bg-positive/70', 'bg-negative/70', 'bg-accent/50', 'bg-muted-foreground'];
            return (
              <div
                key={d.code}
                className={`${colors[i % colors.length]} flex items-center justify-center border-r border-background ${d.code === selectedCountry ? 'ring-1 ring-accent' : ''}`}
                style={{ width: `${width}%` }}
                title={`${d.country}: $${d.gdpTrillions}T (${width.toFixed(1)}%)`}
              >
                {width > 4 && <span className="text-[7px] font-mono font-bold text-white">{d.code}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left px-2 py-1.5 text-accent font-bold">COUNTRY</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">GDP ($T)</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">GROWTH</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">PREV</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">'26F</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">'27F</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">GDP/CAP</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">DEBT/GDP</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">C/A %</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">CPI</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">FDI $B</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">POP</th>
            </tr>
          </thead>
          <tbody>
            {gdpData.map((d, i) => (
              <tr key={d.code} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${d.code === selectedCountry ? 'bg-accent/10' : i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground font-bold">
                  <span className="mr-1">{d.flag}</span>{d.country}
                </td>
                <td className="px-2 py-1 text-right text-foreground font-bold">${d.gdpTrillions.toFixed(2)}</td>
                <td className={`px-2 py-1 text-right ${getGrowthColor(d.realGrowth)}`}>{d.realGrowth > 0 ? '+' : ''}{d.realGrowth}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.prevGrowth > 0 ? '+' : ''}{d.prevGrowth}%</td>
                <td className={`px-2 py-1 text-right ${getGrowthColor(d.forecast2026)}`}>{d.forecast2026}%</td>
                <td className={`px-2 py-1 text-right ${getGrowthColor(d.forecast2027)}`}>{d.forecast2027}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">${d.gdpPerCapita.toLocaleString()}</td>
                <td className={`px-2 py-1 text-right ${d.debtToGDP > 100 ? 'text-negative' : d.debtToGDP > 60 ? 'text-accent' : 'text-positive'}`}>{d.debtToGDP}%</td>
                <td className={`px-2 py-1 text-right ${d.currentAccount >= 0 ? 'text-positive' : 'text-negative'}`}>{d.currentAccount > 0 ? '+' : ''}{d.currentAccount}%</td>
                <td className={`px-2 py-1 text-right ${d.inflationCPI > 3 ? 'text-negative' : d.inflationCPI > 2 ? 'text-accent' : 'text-positive'}`}>{d.inflationCPI}%</td>
                <td className={`px-2 py-1 text-right ${d.fdi >= 0 ? 'text-positive' : 'text-negative'}`}>{d.fdi}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.population}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
