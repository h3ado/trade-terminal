import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailMiniChart, DetailKV } from './MacroExpandable';
import EIALiveStrip from './EIALiveStrip';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Commodity {
  category: string;
  name: string;
  ticker: string;
  last: number;
  change: number;
  changePct: number;
  high52w: number;
  low52w: number;
  unit: string;
  contract: string;
  openInterest?: string;
  description?: string;
  seasonal?: string;
  correlation?: string;
}

const commodities: Commodity[] = [
  { category: 'Energy', name: 'WTI Crude', ticker: 'CL1', last: 78.42, change: 1.12, changePct: 1.45, high52w: 93.68, low52w: 67.32, unit: '$/bbl', contract: 'May 26', openInterest: '1.84M', description: 'West Texas Intermediate crude oil futures. Primary US oil benchmark.', seasonal: 'Demand peaks summer driving season', correlation: 'Positive to energy equities, negative to airlines' },
  { category: 'Energy', name: 'Brent Crude', ticker: 'CO1', last: 82.18, change: 0.98, changePct: 1.21, high52w: 97.44, low52w: 71.18, unit: '$/bbl', contract: 'Jun 26', openInterest: '2.12M', description: 'Brent crude oil futures. Global oil benchmark.' },
  { category: 'Energy', name: 'Natural Gas', ticker: 'NG1', last: 1.78, change: -0.04, changePct: -2.20, high52w: 3.42, low52w: 1.52, unit: '$/MMBtu', contract: 'May 26', openInterest: '1.42M', description: 'Henry Hub natural gas futures.', seasonal: 'Demand peaks in winter heating season' },
  { category: 'Energy', name: 'RBOB Gasoline', ticker: 'XB1', last: 2.6842, change: 0.0312, changePct: 1.18, high52w: 2.9812, low52w: 2.1244, unit: '$/gal', contract: 'May 26' },
  { category: 'Energy', name: 'Heating Oil', ticker: 'HO1', last: 2.5918, change: 0.0188, changePct: 0.73, high52w: 3.1244, low52w: 2.2812, unit: '$/gal', contract: 'May 26' },
  { category: 'Energy', name: 'Carbon (EU ETS)', ticker: 'CFI2Z6', last: 62.40, change: 0.82, changePct: 1.33, high52w: 98.20, low52w: 52.40, unit: '€/tonne', contract: 'Dec 26' },
  { category: 'Metals', name: 'Gold', ticker: 'GC1', last: 2178.40, change: 12.80, changePct: 0.59, high52w: 2220.40, low52w: 1810.80, unit: '$/oz', contract: 'Jun 26', openInterest: '528K', description: 'COMEX gold futures. Safe haven and inflation hedge.', correlation: 'Inverse to USD, positive to real rates' },
  { category: 'Metals', name: 'Silver', ticker: 'SI1', last: 24.82, change: 0.34, changePct: 1.39, high52w: 26.44, low52w: 20.12, unit: '$/oz', contract: 'May 26', openInterest: '142K' },
  { category: 'Metals', name: 'Platinum', ticker: 'PL1', last: 912.40, change: -4.20, changePct: -0.46, high52w: 1048.60, low52w: 842.20, unit: '$/oz', contract: 'Jul 26' },
  { category: 'Metals', name: 'Palladium', ticker: 'PA1', last: 1008.80, change: -12.40, changePct: -1.21, high52w: 1294.20, low52w: 932.60, unit: '$/oz', contract: 'Jun 26' },
  { category: 'Metals', name: 'Copper', ticker: 'HG1', last: 3.9842, change: 0.0412, changePct: 1.04, high52w: 4.2212, low52w: 3.5412, unit: '$/lb', contract: 'May 26', openInterest: '248K', description: 'COMEX copper futures. "Dr. Copper" — economic health indicator.', correlation: 'Positive to global PMI and China growth' },
  { category: 'Metals', name: 'Iron Ore (SGX)', ticker: 'FE', last: 118.40, change: 2.20, changePct: 1.89, high52w: 142.80, low52w: 98.40, unit: '$/t', contract: 'May 26' },
  { category: 'Metals', name: 'Aluminum (LME)', ticker: 'LMAHDS3', last: 2284.00, change: 18.00, changePct: 0.79, high52w: 2642.00, low52w: 2082.00, unit: '$/t', contract: '3M' },
  { category: 'Agriculture', name: 'Corn', ticker: 'C 1', last: 442.25, change: -2.50, changePct: -0.56, high52w: 612.50, low52w: 418.75, unit: '¢/bu', contract: 'May 26' },
  { category: 'Agriculture', name: 'Soybeans', ticker: 'S 1', last: 1178.50, change: 4.25, changePct: 0.36, high52w: 1412.25, low52w: 1102.50, unit: '¢/bu', contract: 'May 26' },
  { category: 'Agriculture', name: 'Wheat', ticker: 'W 1', last: 558.75, change: -8.25, changePct: -1.45, high52w: 742.50, low52w: 498.25, unit: '¢/bu', contract: 'May 26' },
  { category: 'Agriculture', name: 'Coffee', ticker: 'KC1', last: 188.45, change: 3.20, changePct: 1.73, high52w: 212.80, low52w: 142.50, unit: '¢/lb', contract: 'May 26' },
  { category: 'Agriculture', name: 'Sugar', ticker: 'SB1', last: 21.84, change: -0.18, changePct: -0.82, high52w: 27.42, low52w: 19.12, unit: '¢/lb', contract: 'May 26' },
  { category: 'Agriculture', name: 'Cotton', ticker: 'CT1', last: 82.42, change: 0.68, changePct: 0.83, high52w: 92.18, low52w: 74.32, unit: '¢/lb', contract: 'May 26' },
  { category: 'Agriculture', name: 'Cocoa', ticker: 'CC1', last: 9842.00, change: 284.00, changePct: 2.97, high52w: 11420.00, low52w: 3280.00, unit: '$/t', contract: 'May 26' },
  { category: 'Agriculture', name: 'Live Cattle', ticker: 'LC1', last: 184.42, change: 0.82, changePct: 0.45, high52w: 192.80, low52w: 168.20, unit: '¢/lb', contract: 'Jun 26' },
];

const categories = ['Energy', 'Metals', 'Agriculture'];

const perfData = commodities.map(c => ({ name: c.ticker, pct: c.changePct }));

const wtiHistory = [
  { date: 'Oct', price: 82.4 }, { date: 'Nov', price: 76.8 }, { date: 'Dec', price: 71.2 },
  { date: 'Jan', price: 73.8 }, { date: 'Feb', price: 76.4 }, { date: 'Mar', price: 78.4 },
];

export default function Commodities() {
  const { countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();

  // Live prices keyed by commodity name
  const [livePrices, setLivePrices] = useState<Record<string, { last: number; change: number; changePct: number }>>({});

  useEffect(() => {
    fetch('/api/market/macro/commodities')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.commodities?.length) return;
        const map: Record<string, { last: number; change: number; changePct: number }> = {};
        for (const c of d.commodities) {
          if (c.name && c.last != null) map[c.name] = { last: c.last, change: c.change ?? 0, changePct: c.changePct ?? 0 };
        }
        setLivePrices(map);
      })
      .catch(() => {});
  }, []);

  const liveOrStatic = (name: string, field: 'last' | 'change' | 'changePct', fallback: number) =>
    livePrices[name]?.[field] ?? fallback;

  return (
    <div className="space-y-3">
      <EIALiveStrip />
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">Commodities Monitor</span>
        <span className="text-muted-foreground font-mono text-[9px]">CMDM &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click any commodity for details</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { label: 'WTI CRUDE', name: 'WTI Oil', fallbackVal: 78.42,  fallbackChg: 1.45,  prefix: '$' },
          { label: 'BRENT',     name: 'WTI Oil', fallbackVal: 82.18,  fallbackChg: 1.21,  prefix: '$' },
          { label: 'GOLD',      name: 'Gold',    fallbackVal: 2178.40, fallbackChg: 0.59, prefix: '$' },
          { label: 'SILVER',    name: 'Silver',  fallbackVal: 24.82,  fallbackChg: 1.39,  prefix: '$' },
          { label: 'COPPER',    name: 'Copper',  fallbackVal: 3.98,   fallbackChg: 1.04,  prefix: '$' },
          { label: 'NAT GAS',   name: 'NatGas',  fallbackVal: 1.78,   fallbackChg: -2.20, prefix: '$' },
        ].map(s => {
          const val = liveOrStatic(s.name, 'last', s.fallbackVal);
          const chg = liveOrStatic(s.name, 'changePct', s.fallbackChg);
          const color = chg >= 0 ? 'text-positive' : 'text-negative';
          return { ...s, value: `${s.prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, chg: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, color };
        }).map(s => (
          <div key={s.label} className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">{s.label}</div>
            <div className="text-lg font-mono font-bold text-foreground">{s.value}</div>
            <div className={`text-[9px] font-mono font-bold ${s.color}`}>{s.chg}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Daily % Change</div>
          <ExpandableResponsiveContainer width="100%" height={160}>
            <BarChart data={perfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`${v.toFixed(2)}%`]} />
              <Bar dataKey="pct" fill="hsl(var(--accent))">
                {perfData.map((entry, index) => (
                  <rect key={index} fill={entry.pct >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />
                ))}
              </Bar>
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">WTI Crude — 6 Month</div>
          <ExpandableResponsiveContainer width="100%" height={160}>
            <LineChart data={wtiHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`$${v.toFixed(2)}`]} />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      {/* Category tables with expandable rows */}
      {categories.map(cat => (
        <div key={cat} className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">{cat}</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-1 py-1 text-muted-foreground w-4"></th>
                <th className="text-left px-2 py-1 text-muted-foreground">TICKER</th>
                <th className="text-left px-2 py-1 text-muted-foreground">NAME</th>
                <th className="text-right px-2 py-1 text-muted-foreground">LAST</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
                <th className="text-right px-2 py-1 text-muted-foreground">%CHG</th>
                <th className="text-right px-2 py-1 text-muted-foreground">52W H</th>
                <th className="text-right px-2 py-1 text-muted-foreground">52W L</th>
                <th className="text-right px-2 py-1 text-muted-foreground">UNIT</th>
                <th className="text-right px-2 py-1 text-muted-foreground">OI</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CTR</th>
              </tr>
            </thead>
            <tbody>
              {commodities.filter(c => c.category === cat).map((c, i) => {
                const expanded = isExpanded(c.ticker);
                const pctOf52w = ((c.last - c.low52w) / (c.high52w - c.low52w) * 100).toFixed(0);
                const hist = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(label => ({
                  label, value: +(c.last * (0.92 + Math.random() * 0.16)).toFixed(2)
                }));
                return (
                  <ExpandableRow
                    key={c.ticker}
                    id={c.ticker}
                    isExpanded={expanded}
                    onToggle={toggleRow}
                    colSpan={11}
                    className={i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                    cells={
                      <>
                        <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                        <td className="px-2 py-1 text-accent font-bold">{c.ticker}</td>
                        <td className="px-2 py-1 text-foreground">{c.name}</td>
                        <td className="px-2 py-1 text-right text-foreground font-bold">{c.last.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`px-2 py-1 text-right font-bold ${c.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                          <span className="inline-flex items-center gap-0.5 justify-end">
                            {c.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}
                          </span>
                        </td>
                        <td className={`px-2 py-1 text-right font-bold ${c.changePct >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {c.changePct >= 0 ? '+' : ''}{c.changePct.toFixed(2)}%
                        </td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{c.high52w.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground">{c.low52w.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground text-[8px]">{c.unit}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground text-[8px]">{c.openInterest || '—'}</td>
                        <td className="px-2 py-1 text-right text-muted-foreground text-[8px]">{c.contract}</td>
                      </>
                    }
                    detail={
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div>
                          <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">6M Price History</div>
                          <DetailMiniChart data={hist} dataKey="value" height={70} />
                        </div>
                        <div>
                          <DetailKV items={[
                            { label: '52W Range', value: `${c.low52w.toLocaleString('en-US', { minimumFractionDigits: 2 })} – ${c.high52w.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                            { label: 'Position in Range', value: `${pctOf52w}%` },
                            { label: 'Open Interest', value: c.openInterest || '—' },
                            { label: 'Contract', value: c.contract },
                            { label: 'Unit', value: c.unit },
                          ]} />
                          {/* 52W range bar */}
                          <div className="mt-2">
                            <div className="text-[8px] font-mono text-muted-foreground mb-0.5">52W Position</div>
                            <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${pctOf52w}%` }} />
                            </div>
                          </div>
                        </div>
                        <div>
                          {c.description && (
                            <div className="text-[9px] font-mono text-muted-foreground mb-2">{c.description}</div>
                          )}
                          {c.seasonal && (
                            <div className="border border-border p-1.5 mb-1">
                              <div className="text-[8px] font-mono text-accent font-bold">Seasonal</div>
                              <div className="text-[8px] font-mono text-foreground">{c.seasonal}</div>
                            </div>
                          )}
                          {c.correlation && (
                            <div className="border border-border p-1.5">
                              <div className="text-[8px] font-mono text-accent font-bold">Correlations</div>
                              <div className="text-[8px] font-mono text-foreground">{c.correlation}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
