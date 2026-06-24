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
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface CreditSpread {
  name: string;
  ticker: string;
  spread: number;
  prevSpread: number;
  change: number;
  sixMoAvg: number;
  oneYrAvg: number;
  level: string;
  description?: string;
  components?: { label: string; value: string }[];
}

const creditSpreads: CreditSpread[] = [
  { name: 'IG Corporate OAS', ticker: 'LUACOAS', spread: 98, prevSpread: 102, change: -4, sixMoAvg: 108, oneYrAvg: 118, level: 'TIGHT', description: 'Investment grade corporate option-adjusted spread. Reflects credit risk premium for high-quality issuers.', components: [{ label: 'A-rated', value: '72 bp' }, { label: 'BBB-rated', value: '128 bp' }, { label: 'Duration', value: '6.8Y' }, { label: 'Yield', value: '5.42%' }] },
  { name: 'HY Corporate OAS', ticker: 'LF98OAS', spread: 342, prevSpread: 348, change: -6, sixMoAvg: 378, oneYrAvg: 412, level: 'TIGHT', description: 'High yield corporate spread. Key indicator of credit market stress.', components: [{ label: 'BB-rated', value: '198 bp' }, { label: 'B-rated', value: '368 bp' }, { label: 'CCC-rated', value: '882 bp' }, { label: 'Yield', value: '7.82%' }] },
  { name: 'BB OAS', ticker: 'BBOAS', spread: 198, prevSpread: 204, change: -6, sixMoAvg: 218, oneYrAvg: 242, level: 'TIGHT' },
  { name: 'B OAS', ticker: 'BOAS', spread: 368, prevSpread: 374, change: -6, sixMoAvg: 402, oneYrAvg: 448, level: 'TIGHT' },
  { name: 'CCC OAS', ticker: 'CCCOAS', spread: 882, prevSpread: 898, change: -16, sixMoAvg: 942, oneYrAvg: 1024, level: 'NORMAL' },
  { name: 'EM Sovereign OAS', ticker: 'EMOAS', spread: 312, prevSpread: 318, change: -6, sixMoAvg: 338, oneYrAvg: 368, level: 'TIGHT' },
  { name: 'MBS OAS', ticker: 'MBSOAS', spread: 42, prevSpread: 44, change: -2, sixMoAvg: 48, oneYrAvg: 54, level: 'TIGHT' },
  { name: 'CMBS OAS', ticker: 'CMBSOAS', spread: 128, prevSpread: 132, change: -4, sixMoAvg: 142, oneYrAvg: 168, level: 'NORMAL' },
  { name: 'ABS OAS', ticker: 'ABSOAS', spread: 48, prevSpread: 50, change: -2, sixMoAvg: 54, oneYrAvg: 62, level: 'TIGHT' },
  { name: 'CLO AAA OAS', ticker: 'CLOAAA', spread: 128, prevSpread: 132, change: -4, sixMoAvg: 142, oneYrAvg: 158, level: 'TIGHT' },
];

const sovereignCDS = [
  { country: 'US', cds5y: 28, change: -1, rating: 'Aa1/AA+', flag: '🇺🇸', outlook: 'Stable', debtGDP: '123%' },
  { country: 'UK', cds5y: 32, change: 0, rating: 'Aa3/AA', flag: '🇬🇧', outlook: 'Stable', debtGDP: '100%' },
  { country: 'Germany', cds5y: 12, change: -1, rating: 'Aaa/AAA', flag: '🇩🇪', outlook: 'Stable', debtGDP: '65%' },
  { country: 'France', cds5y: 28, change: 1, rating: 'Aa2/AA-', flag: '🇫🇷', outlook: 'Negative', debtGDP: '111%' },
  { country: 'Italy', cds5y: 82, change: -2, rating: 'Baa3/BBB', flag: '🇮🇹', outlook: 'Stable', debtGDP: '142%' },
  { country: 'Spain', cds5y: 48, change: -1, rating: 'Baa1/A', flag: '🇪🇸', outlook: 'Positive', debtGDP: '108%' },
  { country: 'Japan', cds5y: 22, change: 0, rating: 'A1/A+', flag: '🇯🇵', outlook: 'Stable', debtGDP: '255%' },
  { country: 'China', cds5y: 68, change: 2, rating: 'A1/A+', flag: '🇨🇳', outlook: 'Negative', debtGDP: '84%' },
  { country: 'Brazil', cds5y: 142, change: -4, rating: 'Ba2/BB-', flag: '🇧🇷', outlook: 'Stable', debtGDP: '74%' },
  { country: 'Turkey', cds5y: 284, change: 8, rating: 'B3/B', flag: '🇹🇷', outlook: 'Positive', debtGDP: '38%' },
  { country: 'South Africa', cds5y: 198, change: 2, rating: 'Ba2/BB-', flag: '🇿🇦', outlook: 'Stable', debtGDP: '72%' },
  { country: 'Mexico', cds5y: 108, change: -2, rating: 'Baa2/BBB', flag: '🇲🇽', outlook: 'Stable', debtGDP: '54%' },
  { country: 'India', cds5y: 78, change: -1, rating: 'Baa3/BBB-', flag: '🇮🇳', outlook: 'Positive', debtGDP: '82%' },
  { country: 'Indonesia', cds5y: 82, change: 0, rating: 'Baa2/BBB', flag: '🇮🇩', outlook: 'Stable', debtGDP: '39%' },
];

const issuanceData = [
  { month: 'Oct', ig: 118, hy: 22, em: 14 },
  { month: 'Nov', ig: 98, hy: 18, em: 12 },
  { month: 'Dec', ig: 42, hy: 8, em: 6 },
  { month: 'Jan', ig: 142, hy: 28, em: 18 },
  { month: 'Feb', ig: 128, hy: 32, em: 22 },
  { month: 'Mar', ig: 168, hy: 42, em: 28 },
  { month: 'Apr', ig: 84, hy: 18, em: 12 },
];

const hySpreadHistory = [
  { date: 'Oct', spread: 412 }, { date: 'Nov', spread: 398 }, { date: 'Dec', spread: 382 },
  { date: 'Jan', spread: 368 }, { date: 'Feb', spread: 354 }, { date: 'Mar', spread: 342 },
];

const defaultRates = [
  { category: 'All HY', trailing12m: 2.8, prev: 3.2, fiveYrAvg: 3.1 },
  { category: 'Leveraged Loans', trailing12m: 3.4, prev: 3.8, fiveYrAvg: 2.8 },
  { category: 'IG', trailing12m: 0.1, prev: 0.1, fiveYrAvg: 0.2 },
  { category: 'EM Corporate', trailing12m: 1.8, prev: 2.2, fiveYrAvg: 2.4 },
  { category: 'EM Sovereign', trailing12m: 0.4, prev: 0.6, fiveYrAvg: 0.8 },
  { category: 'Distressed Ratio', trailing12m: 4.2, prev: 5.8, fiveYrAvg: 6.4 },
];

export default function CreditMarkets() {
  const { countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">Credit Markets Monitor</span>
        <span className="text-muted-foreground font-mono text-[9px]">CRDM &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click spreads or CDS for details</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">IG OAS</div>
          <div className="text-xl font-mono font-bold text-positive">98 bp</div>
          <div className="text-[9px] font-mono text-positive">▼ 4bp — Tight</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">HY OAS</div>
          <div className="text-xl font-mono font-bold text-positive">342 bp</div>
          <div className="text-[9px] font-mono text-positive">▼ 6bp — Risk-on</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">HY DEFAULT</div>
          <div className="text-xl font-mono font-bold text-accent">2.8%</div>
          <div className="text-[9px] font-mono text-positive">↓ from 3.2%</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">IG ISSUANCE YTD</div>
          <div className="text-xl font-mono font-bold text-foreground">$522B</div>
          <div className="text-[9px] font-mono text-muted-foreground">+18% vs PY</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">DISTRESSED %</div>
          <div className="text-xl font-mono font-bold text-positive">4.2%</div>
          <div className="text-[9px] font-mono text-positive">↓ from 5.8%</div>
        </div>
      </div>

      {/* Credit spreads table with expandable rows */}
      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Option-Adjusted Spreads (OAS)</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-1 py-1 text-muted-foreground w-4"></th>
              <th className="text-left px-2 py-1 text-muted-foreground">INDEX</th>
              <th className="text-right px-2 py-1 text-muted-foreground">SPREAD</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              <th className="text-right px-2 py-1 text-muted-foreground">6M AVG</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AVG</th>
              <th className="text-center px-2 py-1 text-muted-foreground">LEVEL</th>
              <th className="px-2 py-1 text-muted-foreground w-28">VS 1Y AVG</th>
            </tr>
          </thead>
          <tbody>
            {creditSpreads.map((c, i) => {
              const vsAvg = ((c.spread - c.oneYrAvg) / c.oneYrAvg) * 100;
              const expanded = isExpanded(c.ticker);
              const hist = [
                { label: 'Oct', value: c.oneYrAvg },
                { label: 'Nov', value: c.oneYrAvg - 8 },
                { label: 'Dec', value: c.sixMoAvg + 4 },
                { label: 'Jan', value: c.sixMoAvg },
                { label: 'Feb', value: c.prevSpread },
                { label: 'Mar', value: c.spread },
              ];
              return (
                <ExpandableRow
                  key={c.ticker}
                  id={c.ticker}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={8}
                  className={i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                  cells={
                    <>
                      <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                      <td className="px-2 py-1 text-foreground font-bold">{c.name}</td>
                      <td className="px-2 py-1 text-right text-foreground font-bold">{c.spread} bp</td>
                      <td className={`px-2 py-1 text-right font-bold ${c.change <= 0 ? 'text-positive' : 'text-negative'}`}>
                        {c.change > 0 ? '+' : ''}{c.change}
                      </td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{c.sixMoAvg}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{c.oneYrAvg}</td>
                      <td className="px-2 py-1 text-center">
                        <span className={`text-[8px] px-1 py-0.5 font-bold ${c.level === 'TIGHT' ? 'text-positive bg-positive/10' : 'text-muted-foreground bg-muted/30'}`}>{c.level}</span>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-muted/30 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-positive rounded-full" style={{ width: `${Math.min(100, Math.max(5, 50 + vsAvg))}%` }} />
                          </div>
                          <span className="text-[8px] text-positive">{vsAvg.toFixed(0)}%</span>
                        </div>
                      </td>
                    </>
                  }
                  detail={
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Spread History (6M)</div>
                        <DetailMiniChart data={hist} dataKey="value" height={70} />
                      </div>
                      <div>
                        <DetailKV items={[
                          { label: 'Current Spread', value: `${c.spread} bp` },
                          { label: 'vs 6M Avg', value: `${c.spread - c.sixMoAvg} bp`, color: c.spread < c.sixMoAvg ? 'text-positive' : 'text-negative' },
                          { label: 'vs 1Y Avg', value: `${c.spread - c.oneYrAvg} bp`, color: c.spread < c.oneYrAvg ? 'text-positive' : 'text-negative' },
                          { label: 'Z-Score vs 1Y', value: `${(vsAvg / 10).toFixed(1)}σ`, color: vsAvg < 0 ? 'text-positive' : 'text-negative' },
                        ]} />
                      </div>
                      {c.components ? (
                        <div>
                          <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Components</div>
                          <DetailKV items={c.components.map(comp => ({ label: comp.label, value: comp.value }))} />
                          {c.description && <div className="text-[8px] font-mono text-muted-foreground mt-2">{c.description}</div>}
                        </div>
                      ) : (
                        c.description && (
                          <div className="text-[9px] font-mono text-foreground border border-border p-2">{c.description}</div>
                        )
                      )}
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Sovereign CDS with expandable rows */}
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Sovereign 5Y CDS Spreads</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-1 py-1 text-muted-foreground w-4"></th>
                <th className="text-left px-2 py-1 text-muted-foreground">COUNTRY</th>
                <th className="text-right px-2 py-1 text-muted-foreground">5Y CDS</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
                <th className="text-left px-2 py-1 text-muted-foreground">RATING</th>
              </tr>
            </thead>
            <tbody>
              {sovereignCDS.map((s, i) => {
                const expanded = isExpanded(`cds-${s.country}`);
                return (
                  <ExpandableRow
                    key={s.country}
                    id={`cds-${s.country}`}
                    isExpanded={expanded}
                    onToggle={toggleRow}
                    colSpan={5}
                    className={i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                    cells={
                      <>
                        <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                        <td className="px-2 py-1 text-foreground font-bold">
                          <span className="mr-1">{s.flag}</span>{s.country}
                        </td>
                        <td className="px-2 py-1 text-right text-foreground font-bold">{s.cds5y} bp</td>
                        <td className={`px-2 py-1 text-right font-bold ${s.change <= 0 ? 'text-positive' : 'text-negative'}`}>
                          {s.change > 0 ? '+' : ''}{s.change}
                        </td>
                        <td className="px-2 py-1 text-muted-foreground text-[8px]">{s.rating}</td>
                      </>
                    }
                    detail={
                      <DetailKV items={[
                        { label: 'Rating', value: s.rating },
                        { label: 'Outlook', value: s.outlook, color: s.outlook === 'Positive' ? 'text-positive' : s.outlook === 'Negative' ? 'text-negative' : '' },
                        { label: 'Debt/GDP', value: s.debtGDP },
                        { label: '5Y CDS', value: `${s.cds5y} bp` },
                      ]} />
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="border border-border bg-surface-primary p-3">
            <div className="text-[10px] font-mono text-muted-foreground mb-2">HY OAS Spread — 6 Month (bp)</div>
            <ExpandableResponsiveContainer width="100%" height={120}>
              <LineChart data={hySpreadHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="spread" stroke="hsl(var(--positive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ExpandableResponsiveContainer>
          </div>

          <div className="border border-border bg-surface-primary p-3">
            <div className="text-[10px] font-mono text-muted-foreground mb-2">Bond Issuance ($B)</div>
            <ExpandableResponsiveContainer width="100%" height={120}>
              <BarChart data={issuanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Bar dataKey="ig" stackId="a" fill="hsl(var(--accent))" name="IG" />
                <Bar dataKey="hy" stackId="a" fill="hsl(var(--negative))" name="HY" />
                <Bar dataKey="em" stackId="a" fill="hsl(var(--positive))" name="EM" />
              </BarChart>
            </ExpandableResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Default rates */}
      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Default & Distressed Rates (Trailing 12M)</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">CATEGORY</th>
              <th className="text-right px-2 py-1 text-muted-foreground">T12M</th>
              <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
              <th className="text-right px-2 py-1 text-muted-foreground">5Y AVG</th>
              <th className="text-center px-2 py-1 text-muted-foreground">TREND</th>
            </tr>
          </thead>
          <tbody>
            {defaultRates.map((d, i) => (
              <tr key={d.category} className={`border-b border-grid-line last:border-0 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground font-bold">{d.category}</td>
                <td className={`px-2 py-1 text-right font-bold ${d.trailing12m > d.fiveYrAvg ? 'text-negative' : 'text-positive'}`}>{d.trailing12m}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.prev}%</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{d.fiveYrAvg}%</td>
                <td className="px-2 py-1 text-center">
                  <span className={`text-[8px] px-1 py-0.5 font-bold ${d.trailing12m < d.prev ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}`}>
                    {d.trailing12m < d.prev ? '↓ IMPROVING' : '↑ DETERIORATING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
