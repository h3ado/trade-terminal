import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const countryHousing: Record<string, {
  indicators: { label: string; value: string; prev: string; change: string; trend: string }[];
  mortgageRates: { label: string; rate: string; prev: string; change: string }[];
  priceIndex: { city: string; yoy: number; mom: number }[];
  affordability: { month: string; index: number }[];
}> = {
  US: {
    indicators: [
      { label: 'Median Home Price', value: '$412,400', prev: '$405,800', change: '+1.6%', trend: 'up' },
      { label: 'Existing Home Sales', value: '4.26M', prev: '4.18M', change: '+1.9%', trend: 'up' },
      { label: 'New Home Sales', value: '662K', prev: '648K', change: '+2.2%', trend: 'up' },
      { label: 'Housing Starts', value: '1.52M', prev: '1.46M', change: '+4.1%', trend: 'up' },
      { label: 'Building Permits', value: '1.49M', prev: '1.47M', change: '+1.4%', trend: 'up' },
      { label: 'Months Supply', value: '3.0', prev: '2.9', change: '+0.1', trend: 'up' },
      { label: 'Pending Home Sales', value: '-4.9%', prev: '1.3%', change: '-6.2%', trend: 'down' },
      { label: 'NAHB Builder Conf.', value: '48', prev: '51', change: '-3', trend: 'down' },
    ],
    mortgageRates: [
      { label: '30Y Fixed', rate: '6.88%', prev: '6.92%', change: '-4bp' },
      { label: '15Y Fixed', rate: '6.22%', prev: '6.28%', change: '-6bp' },
      { label: '5/1 ARM', rate: '6.42%', prev: '6.48%', change: '-6bp' },
      { label: 'Jumbo 30Y', rate: '7.12%', prev: '7.18%', change: '-6bp' },
      { label: 'MBA App Index', rate: '188.2', prev: '192.4', change: '-2.2%' },
      { label: 'Refi Index', rate: '412.8', prev: '418.2', change: '-1.3%' },
    ],
    priceIndex: [
      { city: 'National', yoy: 6.1, mom: 0.4 }, { city: 'New York', yoy: 7.2, mom: 0.5 },
      { city: 'Los Angeles', yoy: 8.4, mom: 0.6 }, { city: 'Chicago', yoy: 5.8, mom: 0.3 },
      { city: 'Dallas', yoy: 3.2, mom: 0.2 }, { city: 'Miami', yoy: 9.8, mom: 0.8 },
      { city: 'San Francisco', yoy: 4.6, mom: 0.3 }, { city: 'Seattle', yoy: 5.2, mom: 0.4 },
      { city: 'Denver', yoy: 2.8, mom: 0.1 }, { city: 'Phoenix', yoy: 3.4, mom: 0.2 },
      { city: 'Tampa', yoy: 4.2, mom: 0.3 }, { city: 'Atlanta', yoy: 5.6, mom: 0.4 },
    ],
    affordability: [
      { month: 'Oct', index: 92.4 }, { month: 'Nov', index: 93.1 }, { month: 'Dec', index: 91.8 },
      { month: 'Jan', index: 90.2 }, { month: 'Feb', index: 91.4 }, { month: 'Mar', index: 92.8 },
    ],
  },
  UK: {
    indicators: [
      { label: 'Avg House Price', value: '£288,000', prev: '£284,000', change: '+1.4%', trend: 'up' },
      { label: 'Mortgage Approvals', value: '55.2K', prev: '54.8K', change: '+0.7%', trend: 'up' },
      { label: 'Housing Starts', value: '38.2K', prev: '36.8K', change: '+3.8%', trend: 'up' },
      { label: 'RICS Price Balance', value: '-18%', prev: '-22%', change: '+4%', trend: 'up' },
      { label: 'Rightmove Asking', value: '£366,200', prev: '£362,800', change: '+0.9%', trend: 'up' },
      { label: 'Transactions', value: '86.4K', prev: '82.1K', change: '+5.2%', trend: 'up' },
    ],
    mortgageRates: [
      { label: '2Y Fixed', rate: '5.48%', prev: '5.52%', change: '-4bp' },
      { label: '5Y Fixed', rate: '5.12%', prev: '5.18%', change: '-6bp' },
      { label: 'SVR', rate: '8.18%', prev: '8.18%', change: '0bp' },
      { label: 'Buy-to-Let 2Y', rate: '5.82%', prev: '5.88%', change: '-6bp' },
    ],
    priceIndex: [
      { city: 'National', yoy: 1.4, mom: 0.2 }, { city: 'London', yoy: -1.2, mom: -0.1 },
      { city: 'Manchester', yoy: 2.8, mom: 0.3 }, { city: 'Birmingham', yoy: 2.4, mom: 0.2 },
      { city: 'Edinburgh', yoy: 3.2, mom: 0.4 }, { city: 'Bristol', yoy: 1.8, mom: 0.1 },
      { city: 'Leeds', yoy: 2.2, mom: 0.2 }, { city: 'Liverpool', yoy: 3.4, mom: 0.3 },
    ],
    affordability: [
      { month: 'Oct', index: 78.4 }, { month: 'Nov', index: 79.2 }, { month: 'Dec', index: 77.8 },
      { month: 'Jan', index: 76.4 }, { month: 'Feb', index: 77.8 }, { month: 'Mar', index: 78.6 },
    ],
  },
  CN: {
    indicators: [
      { label: 'Avg Home Price YoY', value: '-0.4%', prev: '-0.2%', change: '-0.2%', trend: 'down' },
      { label: 'New Home Sales Area', value: '-12.4%', prev: '-8.2%', change: '-4.2%', trend: 'down' },
      { label: 'Property Investment YTD', value: '-9.0%', prev: '-9.6%', change: '+0.6%', trend: 'up' },
      { label: 'Floor Space Started', value: '-18.2%', prev: '-20.4%', change: '+2.2%', trend: 'up' },
      { label: 'Floor Space Completed', value: '-2.8%', prev: '-4.2%', change: '+1.4%', trend: 'up' },
      { label: 'Developer Loans', value: '-12.4%', prev: '-14.8%', change: '+2.4%', trend: 'up' },
    ],
    mortgageRates: [
      { label: 'LPR 5Y (Mortgage)', rate: '3.95%', prev: '4.20%', change: '-25bp' },
      { label: 'First Home Rate', rate: '3.80%', prev: '3.90%', change: '-10bp' },
      { label: 'Second Home Rate', rate: '4.20%', prev: '4.40%', change: '-20bp' },
    ],
    priceIndex: [
      { city: 'National', yoy: -0.4, mom: 0.0 }, { city: 'Beijing', yoy: 0.8, mom: 0.1 },
      { city: 'Shanghai', yoy: 1.2, mom: 0.2 }, { city: 'Shenzhen', yoy: -2.4, mom: -0.2 },
      { city: 'Guangzhou', yoy: -1.8, mom: -0.1 }, { city: 'Chengdu', yoy: 2.4, mom: 0.3 },
      { city: 'Hangzhou', yoy: -0.8, mom: 0.0 }, { city: 'Wuhan', yoy: -3.2, mom: -0.3 },
    ],
    affordability: [
      { month: 'Oct', index: 62.4 }, { month: 'Nov', index: 61.8 }, { month: 'Dec', index: 60.4 },
      { month: 'Jan', index: 59.8 }, { month: 'Feb', index: 60.2 }, { month: 'Mar', index: 61.4 },
    ],
  },
};

const getCountryHousing = (code: string) => countryHousing[code] || countryHousing['US'];

export default function HousingMarket() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = getCountryHousing(selectedCountry);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Housing Market Dashboard</span>
        <span className="text-muted-foreground font-mono text-[9px]">HOUS &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {data.indicators.slice(0, 4).map(h => (
          <div key={h.label} className="border border-border p-2">
            <div className="text-[8px] font-mono text-muted-foreground">{h.label}</div>
            <div className="text-lg font-mono font-bold text-foreground">{h.value}</div>
            <div className={`text-[8px] font-mono ${h.trend === 'up' ? 'text-positive' : 'text-negative'}`}>
              {h.change} vs prev ({h.prev})
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Mortgage Rates</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">TYPE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">RATE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              </tr>
            </thead>
            <tbody>
              {data.mortgageRates.map((m, i) => (
                <tr key={m.label} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground font-bold">{m.label}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{m.rate}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{m.prev}</td>
                  <td className={`px-2 py-1 text-right font-bold ${m.change.startsWith('-') ? 'text-positive' : 'text-negative'}`}>{m.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Affordability Index (100 = affordable)</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <LineChart data={data.affordability}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="index" stroke="hsl(var(--accent))" strokeWidth={2} name="Index" />
            </LineChart>
          </ExpandableResponsiveContainer>
          <div className="text-[8px] font-mono text-negative mt-1">Below 100 — Historically unaffordable</div>
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Home Price Index by Region</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">CITY/REGION</th>
              <th className="text-right px-2 py-1 text-muted-foreground">YOY %</th>
              <th className="text-right px-2 py-1 text-muted-foreground">MOM %</th>
              <th className="px-2 py-1 text-muted-foreground w-32">YOY LEVEL</th>
            </tr>
          </thead>
          <tbody>
            {data.priceIndex.map((c, i) => (
              <tr key={c.city} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i === 0 ? 'font-bold' : ''} ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground">{c.city}</td>
                <td className={`px-2 py-1 text-right font-bold ${c.yoy >= 0 ? 'text-positive' : 'text-negative'}`}>{c.yoy >= 0 ? '+' : ''}{c.yoy}%</td>
                <td className={`px-2 py-1 text-right ${c.mom >= 0 ? 'text-positive' : 'text-negative'}`}>{c.mom >= 0 ? '+' : ''}{c.mom}%</td>
                <td className="px-2 py-1">
                  <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.yoy >= 0 ? 'bg-positive/60' : 'bg-negative/60'}`} style={{ width: `${Math.min(100, Math.abs(c.yoy / 10) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.indicators.length > 4 && (
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Supply & Demand Indicators</span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-grid-line">
            {data.indicators.slice(4).map(h => (
              <div key={h.label} className="px-3 py-2 text-center">
                <div className="text-[8px] font-mono text-muted-foreground">{h.label}</div>
                <div className="text-sm font-mono font-bold text-foreground mt-0.5">{h.value}</div>
                <div className={`text-[8px] font-mono ${h.trend === 'up' ? 'text-positive' : 'text-negative'}`}>{h.change}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
