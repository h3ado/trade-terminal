import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import FREDLiveStrip from './FREDLiveStrip';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const countryLaborData: Record<string, {
  summary: { label: string; value: string; prev: string; trend: string }[];
  nfpHistory: { month: string; nfp: number }[];
  wageGrowth: { month: string; yoy: number; mom: number }[];
  sectorEmployment: { sector: string; added: number; pct: number }[];
  unemploymentBreakdown: { group: string; rate: number; prev: number }[];
}> = {
  US: {
    summary: [
      { label: 'Unemployment Rate', value: '3.9%', prev: '3.8%', trend: 'up' },
      { label: 'U-6 Underemployment', value: '7.3%', prev: '7.1%', trend: 'up' },
      { label: 'Labor Force Part.', value: '62.5%', prev: '62.5%', trend: 'flat' },
      { label: 'Prime-Age LFPR', value: '83.5%', prev: '83.4%', trend: 'up' },
      { label: 'Avg Hourly Earnings YoY', value: '4.1%', prev: '4.3%', trend: 'down' },
      { label: 'Avg Weekly Hours', value: '34.3', prev: '34.3', trend: 'flat' },
      { label: 'JOLTS Openings', value: '8.86M', prev: '9.02M', trend: 'down' },
      { label: 'Quits Rate', value: '2.1%', prev: '2.2%', trend: 'down' },
      { label: 'Hires Rate', value: '3.5%', prev: '3.6%', trend: 'down' },
      { label: 'Layoffs Rate', value: '1.0%', prev: '1.0%', trend: 'flat' },
    ],
    nfpHistory: [
      { month: 'Oct', nfp: 150 }, { month: 'Nov', nfp: 199 }, { month: 'Dec', nfp: 216 },
      { month: 'Jan', nfp: 353 }, { month: 'Feb', nfp: 229 }, { month: 'Mar', nfp: 275 },
    ],
    wageGrowth: [
      { month: 'Oct', yoy: 4.4, mom: 0.3 }, { month: 'Nov', yoy: 4.3, mom: 0.4 }, { month: 'Dec', yoy: 4.3, mom: 0.3 },
      { month: 'Jan', yoy: 4.5, mom: 0.6 }, { month: 'Feb', yoy: 4.3, mom: 0.2 }, { month: 'Mar', yoy: 4.1, mom: 0.3 },
    ],
    sectorEmployment: [
      { sector: 'Healthcare', added: 72, pct: 26.2 }, { sector: 'Government', added: 52, pct: 18.9 },
      { sector: 'Leisure & Hospitality', added: 44, pct: 16.0 }, { sector: 'Professional Services', added: 32, pct: 11.6 },
      { sector: 'Construction', added: 28, pct: 10.2 }, { sector: 'Retail Trade', added: 18, pct: 6.5 },
      { sector: 'Manufacturing', added: -12, pct: -4.4 }, { sector: 'Info/Tech', added: -8, pct: -2.9 },
      { sector: 'Financial', added: 22, pct: 8.0 }, { sector: 'Transportation', added: 14, pct: 5.1 },
    ],
    unemploymentBreakdown: [
      { group: 'Overall', rate: 3.9, prev: 3.8 }, { group: 'White', rate: 3.4, prev: 3.3 },
      { group: 'Black', rate: 5.6, prev: 5.4 }, { group: 'Hispanic', rate: 4.9, prev: 4.8 },
      { group: 'Asian', rate: 3.1, prev: 3.0 }, { group: 'Youth (16-24)', rate: 8.4, prev: 8.2 },
      { group: 'College Degree+', rate: 2.1, prev: 2.0 },
    ],
  },
  UK: {
    summary: [
      { label: 'Unemployment Rate', value: '4.2%', prev: '4.1%', trend: 'up' },
      { label: 'Employment Rate', value: '75.6%', prev: '75.7%', trend: 'down' },
      { label: 'Inactivity Rate', value: '21.1%', prev: '21.0%', trend: 'up' },
      { label: 'Avg Weekly Earnings', value: '5.6%', prev: '5.8%', trend: 'down' },
      { label: 'Real Wage Growth', value: '2.2%', prev: '2.4%', trend: 'down' },
      { label: 'Claimant Count', value: '1.62M', prev: '1.58M', trend: 'up' },
      { label: 'Vacancies', value: '898K', prev: '916K', trend: 'down' },
      { label: 'PAYE Employees', value: '30.2M', prev: '30.1M', trend: 'up' },
    ],
    nfpHistory: [
      { month: 'Oct', nfp: 54 }, { month: 'Nov', nfp: 73 }, { month: 'Dec', nfp: 48 },
      { month: 'Jan', nfp: 72 }, { month: 'Feb', nfp: 21 }, { month: 'Mar', nfp: 48 },
    ],
    wageGrowth: [
      { month: 'Oct', yoy: 7.2, mom: 0.4 }, { month: 'Nov', yoy: 6.6, mom: 0.3 }, { month: 'Dec', yoy: 6.2, mom: 0.3 },
      { month: 'Jan', yoy: 5.8, mom: 0.4 }, { month: 'Feb', yoy: 5.8, mom: 0.3 }, { month: 'Mar', yoy: 5.6, mom: 0.3 },
    ],
    sectorEmployment: [
      { sector: 'Healthcare/Social', added: 18, pct: 37.5 }, { sector: 'Professional Svcs', added: 12, pct: 25.0 },
      { sector: 'Hospitality', added: 8, pct: 16.7 }, { sector: 'Construction', added: 6, pct: 12.5 },
      { sector: 'Manufacturing', added: -4, pct: -8.3 }, { sector: 'Retail', added: -2, pct: -4.2 },
      { sector: 'Finance', added: 8, pct: 16.7 }, { sector: 'IT/Comms', added: -6, pct: -12.5 },
    ],
    unemploymentBreakdown: [
      { group: 'Overall', rate: 4.2, prev: 4.1 }, { group: 'Men', rate: 4.4, prev: 4.3 },
      { group: 'Women', rate: 3.9, prev: 3.8 }, { group: 'Youth (16-24)', rate: 12.8, prev: 12.4 },
      { group: 'Ethnic Minorities', rate: 6.8, prev: 6.6 }, { group: 'Disabled', rate: 6.2, prev: 6.0 },
    ],
  },
  JP: {
    summary: [
      { label: 'Unemployment Rate', value: '2.5%', prev: '2.4%', trend: 'up' },
      { label: 'Jobs-to-Applicants', value: '1.30', prev: '1.32', trend: 'down' },
      { label: 'Labor Force Part.', value: '63.0%', prev: '62.9%', trend: 'up' },
      { label: 'Cash Earnings YoY', value: '2.0%', prev: '1.4%', trend: 'up' },
      { label: 'Real Wages YoY', value: '-0.6%', prev: '-1.2%', trend: 'up' },
      { label: 'Total Employment', value: '67.6M', prev: '67.5M', trend: 'up' },
    ],
    nfpHistory: [
      { month: 'Oct', nfp: 20 }, { month: 'Nov', nfp: 30 }, { month: 'Dec', nfp: 10 },
      { month: 'Jan', nfp: 40 }, { month: 'Feb', nfp: 20 }, { month: 'Mar', nfp: 30 },
    ],
    wageGrowth: [
      { month: 'Oct', yoy: 1.2, mom: 0.1 }, { month: 'Nov', yoy: 0.8, mom: 0.1 }, { month: 'Dec', yoy: 1.0, mom: 0.2 },
      { month: 'Jan', yoy: 1.4, mom: 0.2 }, { month: 'Feb', yoy: 2.0, mom: 0.3 }, { month: 'Mar', yoy: 2.0, mom: 0.2 },
    ],
    sectorEmployment: [
      { sector: 'Services', added: 18, pct: 60 }, { sector: 'Healthcare', added: 8, pct: 26.7 },
      { sector: 'Manufacturing', added: -4, pct: -13.3 }, { sector: 'Construction', added: 4, pct: 13.3 },
      { sector: 'IT/Comms', added: 6, pct: 20 }, { sector: 'Retail', added: -2, pct: -6.7 },
    ],
    unemploymentBreakdown: [
      { group: 'Overall', rate: 2.5, prev: 2.4 }, { group: 'Men', rate: 2.7, prev: 2.6 },
      { group: 'Women', rate: 2.3, prev: 2.2 }, { group: 'Youth (15-24)', rate: 4.2, prev: 4.0 },
      { group: 'Age 55+', rate: 2.4, prev: 2.3 },
    ],
  },
};

const getCountryLabor = (code: string) => countryLaborData[code] || countryLaborData['US'];

export default function LaborMarket() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = getCountryLabor(selectedCountry);

  return (
    <div className="space-y-3">
      {selectedCountry === 'US' && (
        <FREDLiveStrip keys={['unemployment', 'nfp_change']} title="LIVE · FRED LABOR" />
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Labor Market Dashboard</span>
        <span className="text-muted-foreground font-mono text-[9px]">LABR &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {data.summary.slice(0, 5).map(s => (
          <div key={s.label} className="border border-border p-2">
            <div className="text-[8px] font-mono text-muted-foreground">{s.label}</div>
            <div className="text-lg font-mono font-bold text-foreground">{s.value}</div>
            <div className={`text-[8px] font-mono ${s.trend === 'up' ? 'text-negative' : s.trend === 'down' ? 'text-positive' : 'text-muted-foreground'}`}>
              Prev: {s.prev} {s.trend === 'up' ? '▲' : s.trend === 'down' ? '▼' : '—'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Employment Change (000s)</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <BarChart data={data.nfpHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey="nfp" fill="hsl(var(--accent))" name="Employment" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Wage Growth</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <LineChart data={data.wageGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="yoy" stroke="hsl(var(--accent))" strokeWidth={2} name="YoY %" />
              <Line type="monotone" dataKey="mom" stroke="hsl(var(--positive))" strokeWidth={1} strokeDasharray="4 4" name="MoM %" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Employment Change by Sector (000s)</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">SECTOR</th>
                <th className="text-right px-2 py-1 text-muted-foreground">ADDED</th>
                <th className="text-right px-2 py-1 text-muted-foreground">% TOTAL</th>
                <th className="px-2 py-1 text-muted-foreground w-24"></th>
              </tr>
            </thead>
            <tbody>
              {data.sectorEmployment.sort((a, b) => b.added - a.added).map((s, i) => (
                <tr key={s.sector} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground">{s.sector}</td>
                  <td className={`px-2 py-1 text-right font-bold ${s.added >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {s.added >= 0 ? '+' : ''}{s.added}K
                  </td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{s.pct > 0 ? '+' : ''}{s.pct}%</td>
                  <td className="px-2 py-1">
                    <div className="flex items-center">
                      {s.added >= 0 ? (
                        <div className="h-2 bg-positive/60 rounded-r" style={{ width: `${Math.min(100, (s.added / 72) * 100)}%` }} />
                      ) : (
                        <div className="h-2 bg-negative/60 rounded-l ml-auto" style={{ width: `${Math.min(100, (Math.abs(s.added) / 72) * 100)}%` }} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Unemployment by Demographics</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">GROUP</th>
                <th className="text-right px-2 py-1 text-muted-foreground">RATE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              </tr>
            </thead>
            <tbody>
              {data.unemploymentBreakdown.map((u, i) => {
                const chg = u.rate - u.prev;
                return (
                  <tr key={u.group} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''} ${i === 0 ? 'font-bold' : ''}`}>
                    <td className="px-2 py-1 text-foreground">{u.group}</td>
                    <td className="px-2 py-1 text-right text-foreground font-bold">{u.rate}%</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{u.prev}%</td>
                    <td className={`px-2 py-1 text-right font-bold ${chg > 0 ? 'text-negative' : chg < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                      {chg > 0 ? '+' : ''}{chg.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.summary.length > 5 && (
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Additional Labor Indicators</span>
          </div>
          <div className="grid grid-cols-5 divide-x divide-grid-line">
            {data.summary.slice(5).map(s => (
              <div key={s.label} className="px-3 py-2 text-center">
                <div className="text-[8px] font-mono text-muted-foreground">{s.label}</div>
                <div className="text-sm font-mono font-bold text-foreground mt-0.5">{s.value}</div>
                <div className={`text-[8px] font-mono ${s.trend === 'down' ? 'text-positive' : s.trend === 'up' ? 'text-negative' : 'text-muted-foreground'}`}>
                  prev {s.prev}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
