import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailMiniChart, DetailKV } from './MacroExpandable';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const vixTermStructure = [
  { term: 'Spot', value: 14.82 }, { term: '1W', value: 15.12 }, { term: '1M', value: 16.44 },
  { term: '2M', value: 17.28 }, { term: '3M', value: 18.12 }, { term: '4M', value: 18.68 },
  { term: '5M', value: 19.04 }, { term: '6M', value: 19.32 }, { term: '9M', value: 19.88 },
  { term: '12M', value: 20.14 },
];

const vixHistory = [
  { date: 'Oct 25', close: 13.2, high: 17.8, low: 12.4 },
  { date: 'Nov 25', close: 14.8, high: 19.2, low: 13.1 },
  { date: 'Dec 25', close: 16.1, high: 22.4, low: 14.2 },
  { date: 'Jan 26', close: 13.8, high: 16.2, low: 12.8 },
  { date: 'Feb 26', close: 15.4, high: 20.8, low: 13.2 },
  { date: 'Mar 26', close: 14.2, high: 18.6, low: 12.8 },
  { date: 'Apr 26', close: 14.8, high: 18.6, low: 13.8 },
];

const volByCountry: Record<string, { name: string; ticker: string; value: number; change: number; pctile: number; signal: string; description?: string }[]> = {
  US: [
    { name: 'VIX (S&P 500)', ticker: 'VIX', value: 14.82, change: -0.44, pctile: 22, signal: 'LOW', description: 'CBOE Volatility Index. Implied vol from SPX options. Fear gauge.' },
    { name: 'VXN (Nasdaq)', ticker: 'VXN', value: 18.24, change: -0.32, pctile: 28, signal: 'LOW', description: 'Nasdaq 100 volatility index. Tech-heavy implied vol.' },
    { name: 'RVX (Russell)', ticker: 'RVX', value: 20.12, change: 0.18, pctile: 35, signal: 'NORMAL', description: 'Russell 2000 volatility. Small cap risk gauge.' },
    { name: 'OVX (Crude Oil)', ticker: 'OVX', value: 32.44, change: 1.22, pctile: 48, signal: 'NORMAL', description: 'Crude oil volatility index. Energy market uncertainty.' },
    { name: 'GVZ (Gold)', ticker: 'GVZ', value: 14.18, change: -0.28, pctile: 18, signal: 'LOW' },
    { name: 'VVIX (Vol of Vol)', ticker: 'VVIX', value: 82.44, change: 2.12, pctile: 42, signal: 'NORMAL', description: 'Volatility of VIX itself. Measures tail risk expectations.' },
    { name: 'MOVE (Bonds)', ticker: 'MOVE', value: 98.62, change: -1.88, pctile: 52, signal: 'NORMAL', description: 'Merrill Lynch Option Volatility Estimate for Treasuries.' },
    { name: 'SKEW Index', ticker: 'SKEW', value: 142.18, change: 1.44, pctile: 68, signal: 'ELEVATED', description: 'Measures tail risk in SPX options. Higher = more crash protection demand.' },
    { name: 'TYVIX (10Y Vol)', ticker: 'TYVIX', value: 5.82, change: -0.12, pctile: 24, signal: 'LOW' },
  ],
  EU: [
    { name: 'VSTOXX (Euro Stoxx)', ticker: 'V2X', value: 16.42, change: -0.28, pctile: 24, signal: 'LOW' },
    { name: 'VDAX-NEW (DAX)', ticker: 'VDAX', value: 15.82, change: -0.18, pctile: 22, signal: 'LOW' },
    { name: 'VCAC (CAC 40)', ticker: 'VCAC', value: 17.24, change: 0.42, pctile: 32, signal: 'NORMAL' },
    { name: 'OVX (Crude Oil)', ticker: 'OVX', value: 32.44, change: 1.22, pctile: 48, signal: 'NORMAL' },
    { name: 'MOVE (Bonds)', ticker: 'MOVE', value: 98.62, change: -1.88, pctile: 52, signal: 'NORMAL' },
  ],
  UK: [
    { name: 'VFTSE (FTSE 100)', ticker: 'VFTSE', value: 13.28, change: -0.32, pctile: 18, signal: 'LOW' },
    { name: 'OVX (Crude Oil)', ticker: 'OVX', value: 32.44, change: 1.22, pctile: 48, signal: 'NORMAL' },
    { name: 'MOVE (Bonds)', ticker: 'MOVE', value: 98.62, change: -1.88, pctile: 52, signal: 'NORMAL' },
    { name: 'GVZ (Gold)', ticker: 'GVZ', value: 14.18, change: -0.28, pctile: 18, signal: 'LOW' },
  ],
  JP: [
    { name: 'JNIV (Nikkei Vol)', ticker: 'JNIV', value: 22.48, change: 0.82, pctile: 42, signal: 'NORMAL' },
    { name: 'VXJ (Japan Vol)', ticker: 'VXJ', value: 24.12, change: 1.44, pctile: 48, signal: 'NORMAL' },
    { name: 'OVX (Crude Oil)', ticker: 'OVX', value: 32.44, change: 1.22, pctile: 48, signal: 'NORMAL' },
    { name: 'MOVE (Bonds)', ticker: 'MOVE', value: 98.62, change: -1.88, pctile: 52, signal: 'NORMAL' },
  ],
};

const getVolIndicators = (code: string) => volByCountry[code] || volByCountry['US'];

const putCallData = [
  { name: 'CBOE Equity P/C', value: 0.68, avg: 0.72, signal: 'Bullish' },
  { name: 'CBOE Index P/C', value: 1.24, avg: 1.18, signal: 'Bearish' },
  { name: 'CBOE Total P/C', value: 0.88, avg: 0.92, signal: 'Neutral' },
  { name: 'ISEE Call/Put', value: 142, avg: 128, signal: 'Bullish' },
];

const impliedRealVol = [
  { asset: 'SPX', iv30: 14.82, rv30: 12.44, premium: 2.38, regime: 'Low Vol' },
  { asset: 'NDX', iv30: 18.24, rv30: 16.82, premium: 1.42, regime: 'Low Vol' },
  { asset: 'RTY', iv30: 20.12, rv30: 22.44, premium: -2.32, regime: 'Realized > Implied' },
  { asset: 'EUR/USD', iv30: 6.42, rv30: 5.88, premium: 0.54, regime: 'Low Vol' },
  { asset: 'USD/JPY', iv30: 8.82, rv30: 9.44, premium: -0.62, regime: 'Realized > Implied' },
  { asset: 'Gold', iv30: 14.18, rv30: 12.82, premium: 1.36, regime: 'Low Vol' },
  { asset: 'WTI', iv30: 32.44, rv30: 28.82, premium: 3.62, regime: 'Normal' },
  { asset: '10Y UST', iv30: 5.82, rv30: 4.98, premium: 0.84, regime: 'Low Vol' },
];

export default function VolatilitySurface() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();
  const volIndicators = getVolIndicators(selectedCountry);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">Volatility Dashboard</span>
        <span className="text-muted-foreground font-mono text-[9px]">VOLM &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click any vol index for details</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">VIX SPOT</div>
          <div className="text-xl font-mono font-bold text-positive">14.82</div>
          <div className="text-[9px] font-mono text-positive">▼ 0.44 (-2.88%)</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">VIX 1M FUT</div>
          <div className="text-xl font-mono font-bold text-foreground">16.44</div>
          <div className="text-[9px] font-mono text-muted-foreground">Contango +10.9%</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">SKEW INDEX</div>
          <div className="text-xl font-mono font-bold text-accent">142.18</div>
          <div className="text-[9px] font-mono text-negative">▲ 1.44 (68th %ile)</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">MOVE INDEX</div>
          <div className="text-xl font-mono font-bold text-foreground">98.62</div>
          <div className="text-[9px] font-mono text-positive">▼ 1.88 (52nd %ile)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">VIX Term Structure</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <AreaChart data={vixTermStructure}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="term" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ExpandableResponsiveContainer>
          <div className="text-[8px] font-mono text-positive mt-1">CONTANGO — Normal term structure (low fear)</div>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">VIX Monthly — Close/High/Low</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={vixHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="high" stroke="hsl(var(--negative))" strokeDasharray="4 4" dot={false} name="High" />
              <Line type="monotone" dataKey="close" stroke="hsl(var(--accent))" strokeWidth={2} name="Close" />
              <Line type="monotone" dataKey="low" stroke="hsl(var(--positive))" strokeDasharray="4 4" dot={false} name="Low" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      {/* Vol indices table with expandable rows */}
      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">{countryInfo.name} — Volatility Monitor</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-1 py-1 text-muted-foreground w-4"></th>
              <th className="text-left px-2 py-1 text-muted-foreground">INDEX</th>
              <th className="text-left px-2 py-1 text-muted-foreground">TICKER</th>
              <th className="text-right px-2 py-1 text-muted-foreground">VALUE</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              <th className="text-right px-2 py-1 text-muted-foreground">%ILE (1Y)</th>
              <th className="text-center px-2 py-1 text-muted-foreground">SIGNAL</th>
              <th className="px-2 py-1 text-muted-foreground w-32">LEVEL</th>
            </tr>
          </thead>
          <tbody>
            {volIndicators.map((v, i) => {
              const expanded = isExpanded(v.ticker);
              const hist = [
                { label: 'Oct', value: v.value + 4.2 },
                { label: 'Nov', value: v.value + 2.8 },
                { label: 'Dec', value: v.value + 6.4 },
                { label: 'Jan', value: v.value - 1.2 },
                { label: 'Feb', value: v.value + 3.8 },
                { label: 'Mar', value: v.value },
              ];
              return (
                <ExpandableRow
                  key={v.ticker}
                  id={v.ticker}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={8}
                  className={i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                  cells={
                    <>
                      <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                      <td className="px-2 py-1 text-foreground font-bold">{v.name}</td>
                      <td className="px-2 py-1 text-accent">{v.ticker}</td>
                      <td className="px-2 py-1 text-right text-foreground font-bold">{v.value.toFixed(2)}</td>
                      <td className={`px-2 py-1 text-right font-bold ${v.change >= 0 ? 'text-negative' : 'text-positive'}`}>
                        {v.change >= 0 ? '+' : ''}{v.change.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{v.pctile}th</td>
                      <td className="px-2 py-1 text-center">
                        <span className={`text-[8px] px-1 py-0.5 font-bold ${
                          v.signal === 'LOW' ? 'text-positive bg-positive/10' :
                          v.signal === 'ELEVATED' ? 'text-negative bg-negative/10' :
                          'text-muted-foreground bg-muted/30'
                        }`}>{v.signal}</span>
                      </td>
                      <td className="px-2 py-1">
                        <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${v.pctile > 70 ? 'bg-negative' : v.pctile > 40 ? 'bg-accent' : 'bg-positive'}`} style={{ width: `${v.pctile}%` }} />
                        </div>
                      </td>
                    </>
                  }
                  detail={
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">6M History</div>
                        <DetailMiniChart data={hist} dataKey="value" height={70} />
                      </div>
                      <div>
                        <DetailKV items={[
                          { label: 'Current', value: v.value.toFixed(2) },
                          { label: '1Y Percentile', value: `${v.pctile}th` },
                          { label: 'Day Change', value: `${v.change >= 0 ? '+' : ''}${v.change.toFixed(2)}`, color: v.change >= 0 ? 'text-negative' : 'text-positive' },
                          { label: 'Regime', value: v.signal },
                        ]} />
                      </div>
                      <div>
                        {v.description && (
                          <div className="text-[9px] font-mono text-foreground border border-border p-2">{v.description}</div>
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

      {/* IV vs RV table with expandable */}
      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Implied vs Realized Volatility (30D)</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-1 py-1 text-muted-foreground w-4"></th>
              <th className="text-left px-2 py-1 text-muted-foreground">ASSET</th>
              <th className="text-right px-2 py-1 text-muted-foreground">IV 30D</th>
              <th className="text-right px-2 py-1 text-muted-foreground">RV 30D</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREMIUM</th>
              <th className="text-center px-2 py-1 text-muted-foreground">REGIME</th>
            </tr>
          </thead>
          <tbody>
            {impliedRealVol.map((v, i) => {
              const expanded = isExpanded(`ivrv-${v.asset}`);
              return (
                <ExpandableRow
                  key={v.asset}
                  id={`ivrv-${v.asset}`}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={6}
                  className={i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                  cells={
                    <>
                      <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                      <td className="px-2 py-1 text-foreground font-bold">{v.asset}</td>
                      <td className="px-2 py-1 text-right text-foreground">{v.iv30.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right text-foreground">{v.rv30.toFixed(2)}</td>
                      <td className={`px-2 py-1 text-right font-bold ${v.premium >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {v.premium >= 0 ? '+' : ''}{v.premium.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span className={`text-[8px] px-1 py-0.5 font-bold ${
                          v.regime.includes('Low') ? 'text-positive bg-positive/10' :
                          v.regime.includes('Realized') ? 'text-negative bg-negative/10' :
                          'text-muted-foreground bg-muted/30'
                        }`}>{v.regime.toUpperCase()}</span>
                      </td>
                    </>
                  }
                  detail={
                    <DetailKV items={[
                      { label: 'Implied Vol (30D)', value: v.iv30.toFixed(2) },
                      { label: 'Realized Vol (30D)', value: v.rv30.toFixed(2) },
                      { label: 'IV Premium', value: `${v.premium >= 0 ? '+' : ''}${v.premium.toFixed(2)}`, color: v.premium >= 0 ? 'text-positive' : 'text-negative' },
                      { label: 'Vol Regime', value: v.regime },
                      { label: 'Strategy Hint', value: v.premium > 2 ? 'Sell vol (premium rich)' : v.premium < -1 ? 'Buy vol (cheap)' : 'Neutral' },
                    ]} />
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Put/Call Ratios & Sentiment</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">INDICATOR</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CURRENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">20D AVG</th>
              <th className="text-center px-2 py-1 text-muted-foreground">SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {putCallData.map((p, i) => (
              <tr key={p.name} className={`border-b border-grid-line last:border-0 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground font-bold">{p.name}</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{typeof p.value === 'number' && p.value < 10 ? p.value.toFixed(2) : p.value}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{typeof p.avg === 'number' && p.avg < 10 ? p.avg.toFixed(2) : p.avg}</td>
                <td className="px-2 py-1 text-center">
                  <span className={`text-[8px] px-1 py-0.5 font-bold ${
                    p.signal === 'Bullish' ? 'text-positive bg-positive/10' :
                    p.signal === 'Bearish' ? 'text-negative bg-negative/10' :
                    'text-muted-foreground bg-muted/30'
                  }`}>{p.signal.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
