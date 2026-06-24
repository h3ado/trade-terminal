import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import FREDLiveStrip from './FREDLiveStrip';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const countryInflation: Record<string, {
  headline: number; core: number; shelter: number; target: number;
  components: { component: string; weight: string; current: number; prev: number; sixMoAgo: number; oneYrAgo: number; peak: number }[];
  trend: { month: string; headline: number; core: number; shelter: number }[];
  breakevens: { tenor: string; current: number; prev: number }[];
}> = {
  US: {
    headline: 3.2, core: 3.6, shelter: 5.8, target: 2.0,
    components: [
      { component: 'Headline CPI YoY', weight: '100%', current: 3.2, prev: 3.4, sixMoAgo: 3.7, oneYrAgo: 3.1, peak: 9.1 },
      { component: 'Core CPI YoY', weight: '~78%', current: 3.6, prev: 3.8, sixMoAgo: 4.0, oneYrAgo: 3.9, peak: 6.6 },
      { component: 'Food', weight: '13.5%', current: 2.2, prev: 2.4, sixMoAgo: 2.8, oneYrAgo: 3.2, peak: 11.4 },
      { component: 'Energy', weight: '6.8%', current: -1.4, prev: -0.8, sixMoAgo: -4.2, oneYrAgo: -2.0, peak: 41.6 },
      { component: 'Shelter', weight: '36.2%', current: 5.8, prev: 6.0, sixMoAgo: 6.4, oneYrAgo: 7.2, peak: 8.2 },
      { component: 'OER', weight: '25.8%', current: 5.6, prev: 5.8, sixMoAgo: 6.2, oneYrAgo: 7.0, peak: 7.8 },
      { component: 'Medical Care', weight: '8.4%', current: 1.2, prev: 1.4, sixMoAgo: 0.8, oneYrAgo: -0.4, peak: 4.1 },
      { component: 'Transportation', weight: '8.6%', current: 0.8, prev: 1.2, sixMoAgo: 2.4, oneYrAgo: 1.8, peak: 22.4 },
      { component: 'New Vehicles', weight: '3.8%', current: -0.4, prev: -0.2, sixMoAgo: 1.2, oneYrAgo: 2.0, peak: 12.2 },
      { component: 'Used Vehicles', weight: '2.4%', current: -1.8, prev: -1.2, sixMoAgo: 2.4, oneYrAgo: 4.2, peak: 45.2 },
      { component: 'Apparel', weight: '2.5%', current: 0.2, prev: 0.4, sixMoAgo: 1.8, oneYrAgo: 3.2, peak: 5.6 },
      { component: 'Services ex-Shelter', weight: '~26%', current: 3.8, prev: 4.0, sixMoAgo: 4.4, oneYrAgo: 4.8, peak: 7.2 },
    ],
    trend: [
      { month: 'Oct', headline: 3.7, core: 4.0, shelter: 6.4 }, { month: 'Nov', headline: 3.4, core: 3.9, shelter: 6.2 },
      { month: 'Dec', headline: 3.3, core: 3.9, shelter: 6.0 }, { month: 'Jan', headline: 3.1, core: 3.8, shelter: 5.9 },
      { month: 'Feb', headline: 3.4, core: 3.8, shelter: 5.8 }, { month: 'Mar', headline: 3.2, core: 3.6, shelter: 5.8 },
    ],
    breakevens: [
      { tenor: '2Y', current: 2.42, prev: 2.48 }, { tenor: '5Y', current: 2.28, prev: 2.32 },
      { tenor: '10Y', current: 2.30, prev: 2.34 }, { tenor: '30Y', current: 2.34, prev: 2.38 },
    ],
  },
  UK: {
    headline: 3.4, core: 4.2, shelter: 6.4, target: 2.0,
    components: [
      { component: 'CPI YoY', weight: '100%', current: 3.4, prev: 3.2, sixMoAgo: 3.9, oneYrAgo: 4.0, peak: 11.1 },
      { component: 'Core CPI YoY', weight: '~85%', current: 4.2, prev: 4.0, sixMoAgo: 5.1, oneYrAgo: 5.8, peak: 7.1 },
      { component: 'Food & Non-Alc', weight: '11.9%', current: 4.0, prev: 3.8, sixMoAgo: 6.8, oneYrAgo: 12.4, peak: 19.2 },
      { component: 'Housing & Utilities', weight: '32.0%', current: 3.8, prev: 3.6, sixMoAgo: 4.2, oneYrAgo: 6.8, peak: 9.4 },
      { component: 'Transport', weight: '10.7%', current: -0.8, prev: -1.2, sixMoAgo: 0.4, oneYrAgo: 1.2, peak: 14.8 },
      { component: 'Recreation', weight: '11.7%', current: 5.8, prev: 5.4, sixMoAgo: 6.2, oneYrAgo: 7.4, peak: 7.8 },
      { component: 'Clothing', weight: '5.9%', current: 2.8, prev: 3.2, sixMoAgo: 4.6, oneYrAgo: 6.2, peak: 8.4 },
    ],
    trend: [
      { month: 'Oct', headline: 4.6, core: 5.7, shelter: 6.8 }, { month: 'Nov', headline: 3.9, core: 5.1, shelter: 6.6 },
      { month: 'Dec', headline: 4.0, core: 5.1, shelter: 6.6 }, { month: 'Jan', headline: 3.4, core: 4.2, shelter: 6.4 },
      { month: 'Feb', headline: 3.4, core: 4.2, shelter: 6.4 }, { month: 'Mar', headline: 3.4, core: 4.2, shelter: 6.4 },
    ],
    breakevens: [
      { tenor: '5Y', current: 3.72, prev: 3.78 }, { tenor: '10Y', current: 3.62, prev: 3.68 },
      { tenor: '30Y', current: 3.48, prev: 3.52 },
    ],
  },
  EU: {
    headline: 2.6, core: 3.1, shelter: 0, target: 2.0,
    components: [
      { component: 'HICP YoY', weight: '100%', current: 2.6, prev: 2.8, sixMoAgo: 2.9, oneYrAgo: 5.5, peak: 10.6 },
      { component: 'Core HICP YoY', weight: '~80%', current: 3.1, prev: 3.3, sixMoAgo: 4.0, oneYrAgo: 5.3, peak: 5.7 },
      { component: 'Energy', weight: '10.2%', current: -2.4, prev: -6.8, sixMoAgo: -11.2, oneYrAgo: 2.4, peak: 44.4 },
      { component: 'Food/Alcohol/Tobacco', weight: '21.8%', current: 4.0, prev: 4.2, sixMoAgo: 7.4, oneYrAgo: 11.8, peak: 16.2 },
      { component: 'Non-Energy Industrial', weight: '26.4%', current: 1.6, prev: 1.8, sixMoAgo: 3.4, oneYrAgo: 5.0, peak: 6.8 },
      { component: 'Services', weight: '41.6%', current: 3.9, prev: 4.0, sixMoAgo: 4.6, oneYrAgo: 5.2, peak: 5.6 },
    ],
    trend: [
      { month: 'Oct', headline: 2.9, core: 4.2, shelter: 0 }, { month: 'Nov', headline: 2.4, core: 3.6, shelter: 0 },
      { month: 'Dec', headline: 2.9, core: 3.4, shelter: 0 }, { month: 'Jan', headline: 2.8, core: 3.3, shelter: 0 },
      { month: 'Feb', headline: 2.6, core: 3.1, shelter: 0 }, { month: 'Mar', headline: 2.6, core: 3.1, shelter: 0 },
    ],
    breakevens: [
      { tenor: '5Y', current: 2.18, prev: 2.22 }, { tenor: '10Y', current: 2.24, prev: 2.28 },
    ],
  },
  JP: {
    headline: 2.8, core: 2.4, shelter: 0, target: 2.0,
    components: [
      { component: 'CPI YoY', weight: '100%', current: 2.8, prev: 2.6, sixMoAgo: 2.8, oneYrAgo: 3.3, peak: 4.3 },
      { component: 'Core CPI (ex Fresh Food)', weight: '~95%', current: 2.4, prev: 2.2, sixMoAgo: 2.8, oneYrAgo: 3.1, peak: 4.2 },
      { component: 'Core-Core (ex Food/Energy)', weight: '~82%', current: 2.2, prev: 2.0, sixMoAgo: 2.4, oneYrAgo: 2.8, peak: 3.0 },
      { component: 'Food', weight: '25.2%', current: 5.8, prev: 5.4, sixMoAgo: 7.2, oneYrAgo: 8.8, peak: 9.2 },
      { component: 'Energy', weight: '7.4%', current: -2.4, prev: -4.8, sixMoAgo: -8.2, oneYrAgo: -6.4, peak: 20.8 },
      { component: 'Durable Goods', weight: '5.8%', current: 1.8, prev: 2.2, sixMoAgo: 4.2, oneYrAgo: 6.4, peak: 8.2 },
      { component: 'Services', weight: '49.2%', current: 2.2, prev: 2.0, sixMoAgo: 2.4, oneYrAgo: 2.0, peak: 2.8 },
    ],
    trend: [
      { month: 'Oct', headline: 3.3, core: 2.9, shelter: 0 }, { month: 'Nov', headline: 2.8, core: 2.5, shelter: 0 },
      { month: 'Dec', headline: 2.6, core: 2.3, shelter: 0 }, { month: 'Jan', headline: 2.2, core: 2.0, shelter: 0 },
      { month: 'Feb', headline: 2.6, core: 2.2, shelter: 0 }, { month: 'Mar', headline: 2.8, core: 2.4, shelter: 0 },
    ],
    breakevens: [
      { tenor: '5Y', current: 1.42, prev: 1.38 }, { tenor: '10Y', current: 1.28, prev: 1.24 },
    ],
  },
};

const getCountryInflation = (code: string) => countryInflation[code] || countryInflation['US'];

export default function InflationMonitor() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = getCountryInflation(selectedCountry);

  return (
    <div className="space-y-3">
      {selectedCountry === 'US' && (
        <FREDLiveStrip keys={['cpi_yoy', 'core_cpi_yoy', 'pce_yoy', 'core_pce_yoy']} title="LIVE · FRED CPI" />
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Inflation Deep Dive</span>
        <span className="text-muted-foreground font-mono text-[9px]">INFL &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="border border-border p-2">
          <div className="text-[8px] font-mono text-muted-foreground">HEADLINE CPI</div>
          <div className={`text-xl font-mono font-bold ${data.headline > data.target ? 'text-negative' : 'text-positive'}`}>{data.headline}%</div>
          <div className="text-[8px] font-mono text-muted-foreground">Target: {data.target}%</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[8px] font-mono text-muted-foreground">CORE CPI</div>
          <div className={`text-xl font-mono font-bold ${data.core > data.target ? 'text-negative' : 'text-positive'}`}>{data.core}%</div>
        </div>
        {data.shelter > 0 && (
          <div className="border border-border p-2">
            <div className="text-[8px] font-mono text-muted-foreground">SHELTER</div>
            <div className="text-xl font-mono font-bold text-negative">{data.shelter}%</div>
            <div className="text-[8px] font-mono text-muted-foreground">Sticky — lagging</div>
          </div>
        )}
        {data.breakevens.length > 0 && (
          <div className="border border-border p-2">
            <div className="text-[8px] font-mono text-muted-foreground">{data.breakevens[data.breakevens.length > 2 ? 2 : data.breakevens.length - 1].tenor} BREAKEVEN</div>
            <div className="text-xl font-mono font-bold text-positive">{data.breakevens[data.breakevens.length > 2 ? 2 : data.breakevens.length - 1].current}%</div>
            <div className="text-[8px] font-mono text-positive">Market expectations</div>
          </div>
        )}
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">CPI Components Trend (YoY %)</div>
        <ExpandableResponsiveContainer width="100%" height={200}>
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`${v}%`]} />
            <Line type="monotone" dataKey="headline" stroke="hsl(var(--accent))" strokeWidth={2} name="Headline" />
            <Line type="monotone" dataKey="core" stroke="hsl(var(--negative))" strokeWidth={2} name="Core" />
            {data.shelter > 0 && <Line type="monotone" dataKey="shelter" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" name="Shelter" />}
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">CPI Component Breakdown</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">COMPONENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">WEIGHT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
              <th className="text-right px-2 py-1 text-muted-foreground">6M AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PEAK</th>
            </tr>
          </thead>
          <tbody>
            {data.components.map((d, i) => (
              <tr key={d.component} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i < 2 ? 'font-bold' : ''} ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground">{d.component}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.weight}</td>
                <td className={`px-2 py-1 text-right font-bold ${d.current > 3 ? 'text-negative' : d.current > 2 ? 'text-accent' : d.current < 0 ? 'text-positive' : 'text-positive'}`}>{d.current > 0 ? '+' : ''}{d.current}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.prev > 0 ? '+' : ''}{d.prev}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.sixMoAgo > 0 ? '+' : ''}{d.sixMoAgo}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.oneYrAgo > 0 ? '+' : ''}{d.oneYrAgo}%</td>
                <td className="px-2 py-1 text-right text-negative">{d.peak}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.breakevens.length > 0 && (
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Inflation Breakeven Rates</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">TENOR</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
                <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
              </tr>
            </thead>
            <tbody>
              {data.breakevens.map((b, i) => (
                <tr key={b.tenor} className={`border-b border-grid-line last:border-0 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground font-bold">{b.tenor}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{b.current}%</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{b.prev}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
