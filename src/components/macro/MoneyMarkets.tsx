import { useMacroCountry } from '@/contexts/MacroCountryContext';

const countryMoneyMkt: Record<string, {
  rates: { name: string; ticker: string; rate: number; prev: number; change: number }[];
  bills: { maturity: string; rate: number; prev: number; issued: string }[];
  balanceSheet: { item: string; value: string; change: string; trend: string }[];
}> = {
  US: {
    rates: [
      { name: 'Effective Fed Funds', ticker: 'EFFR', rate: 5.33, prev: 5.33, change: 0 },
      { name: 'SOFR', ticker: 'SOFR', rate: 5.31, prev: 5.31, change: 0 },
      { name: 'SOFR 30D Avg', ticker: 'SOFR30', rate: 5.32, prev: 5.32, change: 0 },
      { name: 'SOFR 90D Avg', ticker: 'SOFR90', rate: 5.33, prev: 5.33, change: 0 },
      { name: 'OBFR', ticker: 'OBFR', rate: 5.32, prev: 5.32, change: 0 },
      { name: 'IORB', ticker: 'IORB', rate: 5.40, prev: 5.40, change: 0 },
      { name: 'Reverse Repo (ON RRP)', ticker: 'RRP', rate: 5.30, prev: 5.30, change: 0 },
      { name: 'Discount Window', ticker: 'DISC', rate: 5.50, prev: 5.50, change: 0 },
      { name: 'DTCC GCF Repo', ticker: 'GCF', rate: 5.34, prev: 5.33, change: 0.01 },
      { name: 'Prime Rate', ticker: 'PRIME', rate: 8.50, prev: 8.50, change: 0 },
    ],
    bills: [
      { maturity: '4-Week', rate: 5.54, prev: 5.53, issued: '$80B' },
      { maturity: '8-Week', rate: 5.52, prev: 5.51, issued: '$70B' },
      { maturity: '13-Week', rate: 5.48, prev: 5.47, issued: '$75B' },
      { maturity: '26-Week', rate: 5.38, prev: 5.36, issued: '$60B' },
      { maturity: '52-Week', rate: 5.12, prev: 5.10, issued: '$42B' },
    ],
    balanceSheet: [
      { item: 'Total Assets', value: '$7.52T', change: '-$42B', trend: 'QT' },
      { item: 'Treasuries', value: '$4.62T', change: '-$28B', trend: 'Runoff' },
      { item: 'MBS', value: '$2.34T', change: '-$12B', trend: 'Runoff' },
      { item: 'Reverse Repo (ON RRP)', value: '$0.48T', change: '-$82B', trend: 'Draining' },
      { item: 'Reserve Balances', value: '$3.42T', change: '+$18B', trend: 'Stable' },
      { item: 'TGA (Treasury Account)', value: '$0.72T', change: '+$28B', trend: 'Building' },
    ],
  },
  UK: {
    rates: [
      { name: 'Bank Rate', ticker: 'BKRT', rate: 5.25, prev: 5.25, change: 0 },
      { name: 'SONIA', ticker: 'SONIA', rate: 5.19, prev: 5.19, change: 0 },
      { name: 'SONIA 30D Avg', ticker: 'SON30', rate: 5.20, prev: 5.20, change: 0 },
      { name: 'Gilt Repo Rate', ticker: 'REPO', rate: 5.22, prev: 5.21, change: 0.01 },
      { name: 'Base Rate', ticker: 'BASE', rate: 5.25, prev: 5.25, change: 0 },
    ],
    bills: [
      { maturity: '1-Month', rate: 5.22, prev: 5.20, issued: '£8B' },
      { maturity: '3-Month', rate: 5.18, prev: 5.16, issued: '£12B' },
      { maturity: '6-Month', rate: 5.08, prev: 5.06, issued: '£8B' },
    ],
    balanceSheet: [
      { item: 'Total Assets', value: '£852B', change: '-£4.2B', trend: 'QT' },
      { item: 'Gilts (APF)', value: '£712B', change: '-£3.8B', trend: 'Active Sales' },
      { item: 'Corp Bonds (CBPS)', value: '£0B', change: '£0', trend: 'Wound Down' },
      { item: 'Reserves', value: '£748B', change: '-£8B', trend: 'Declining' },
    ],
  },
  EU: {
    rates: [
      { name: 'ECB Main Refi Rate', ticker: 'MRO', rate: 4.50, prev: 4.50, change: 0 },
      { name: 'ECB Deposit Facility', ticker: 'DFR', rate: 4.00, prev: 4.00, change: 0 },
      { name: 'ECB Marginal Lending', ticker: 'MLF', rate: 4.75, prev: 4.75, change: 0 },
      { name: '€STR', ticker: 'ESTR', rate: 3.90, prev: 3.90, change: 0 },
      { name: 'EURIBOR 3M', ticker: 'EUR3M', rate: 3.91, prev: 3.92, change: -0.01 },
      { name: 'EURIBOR 6M', ticker: 'EUR6M', rate: 3.86, prev: 3.88, change: -0.02 },
    ],
    bills: [
      { maturity: '3-Month', rate: 3.82, prev: 3.80, issued: '€28B' },
      { maturity: '6-Month', rate: 3.76, prev: 3.74, issued: '€22B' },
      { maturity: '12-Month', rate: 3.52, prev: 3.50, issued: '€18B' },
    ],
    balanceSheet: [
      { item: 'Total Assets', value: '€6.82T', change: '-€42B', trend: 'QT' },
      { item: 'PSPP Holdings', value: '€2.24T', change: '-€18B', trend: 'Passive QT' },
      { item: 'PEPP Holdings', value: '€1.68T', change: '€0', trend: 'Reinvesting' },
      { item: 'TLTRO III', value: '€0.42T', change: '-€28B', trend: 'Maturing' },
      { item: 'Excess Liquidity', value: '€3.48T', change: '-€52B', trend: 'Declining' },
    ],
  },
  JP: {
    rates: [
      { name: 'BOJ Policy Rate', ticker: 'BOJR', rate: 0.10, prev: -0.10, change: 0.20 },
      { name: 'TONAR (Uncollat O/N)', ticker: 'TONAR', rate: 0.07, prev: -0.01, change: 0.08 },
      { name: 'Call Rate (O/N)', ticker: 'CALL', rate: 0.08, prev: -0.01, change: 0.09 },
      { name: 'TIBOR 3M', ticker: 'TIB3M', rate: 0.12, prev: 0.02, change: 0.10 },
    ],
    bills: [
      { maturity: '3-Month', rate: -0.02, prev: -0.04, issued: '¥5.4T' },
      { maturity: '6-Month', rate: 0.02, prev: -0.02, issued: '¥4.2T' },
      { maturity: '12-Month', rate: 0.08, prev: 0.04, issued: '¥3.8T' },
    ],
    balanceSheet: [
      { item: 'Total Assets', value: '¥758T', change: '+¥1.2T', trend: 'Expanding' },
      { item: 'JGB Holdings', value: '¥582T', change: '+¥0.8T', trend: 'YCC Ended' },
      { item: 'ETF Holdings', value: '¥37T', change: '¥0', trend: 'No New Purchases' },
      { item: 'Current Account Bal.', value: '¥542T', change: '+¥2.4T', trend: 'Stable' },
    ],
  },
};

const getCountryMoneyMkt = (code: string) => countryMoneyMkt[code] || countryMoneyMkt['US'];

export default function MoneyMarkets() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = getCountryMoneyMkt(selectedCountry);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{countryInfo.name} Money Markets & Liquidity</span>
        <span className="text-muted-foreground font-mono text-[9px]">MMKT &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {data.rates.slice(0, 4).map(r => (
          <div key={r.ticker} className="border border-border p-2">
            <div className="text-[8px] font-mono text-muted-foreground">{r.ticker}</div>
            <div className="text-xl font-mono font-bold text-accent">{r.rate.toFixed(2)}%</div>
            <div className="text-[8px] font-mono text-muted-foreground">{r.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Overnight & Short-Term Rates</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">RATE</th>
                <th className="text-center px-2 py-1 text-muted-foreground">CODE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">LEVEL</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG</th>
              </tr>
            </thead>
            <tbody>
              {data.rates.map((r, i) => (
                <tr key={r.ticker} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground">{r.name}</td>
                  <td className="px-2 py-1 text-center text-accent font-bold">{r.ticker}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{r.rate.toFixed(2)}%</td>
                  <td className={`px-2 py-1 text-right ${r.change !== 0 ? (r.change > 0 ? 'text-negative' : 'text-positive') : 'text-muted-foreground'}`}>
                    {r.change === 0 ? '—' : `${r.change > 0 ? '+' : ''}${(r.change * 100).toFixed(0)}bp`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Short-Term Bill Rates</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">MATURITY</th>
                <th className="text-right px-2 py-1 text-muted-foreground">RATE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">PREV</th>
                <th className="text-right px-2 py-1 text-muted-foreground">ISSUED</th>
              </tr>
            </thead>
            <tbody>
              {data.bills.map((t, i) => (
                <tr key={t.maturity} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground font-bold">{t.maturity}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{t.rate.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{t.prev.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{t.issued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">{countryInfo.centralBank} Balance Sheet</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">ITEM</th>
              <th className="text-right px-2 py-1 text-muted-foreground">VALUE</th>
              <th className="text-right px-2 py-1 text-muted-foreground">WoW CHG</th>
              <th className="text-center px-2 py-1 text-muted-foreground">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.balanceSheet.map((f, i) => (
              <tr key={f.item} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i === 0 ? 'font-bold' : ''} ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground">{f.item}</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{f.value}</td>
                <td className={`px-2 py-1 text-right font-bold ${f.change.startsWith('-') ? 'text-negative' : f.change.startsWith('+') ? 'text-positive' : 'text-muted-foreground'}`}>{f.change}</td>
                <td className="px-2 py-1 text-center">
                  <span className={`text-[8px] px-1 py-0.5 font-bold ${
                    f.trend === 'QT' || f.trend === 'Runoff' || f.trend === 'Draining' || f.trend === 'Declining' || f.trend === 'Active Sales' || f.trend === 'Maturing' || f.trend === 'Passive QT'
                      ? 'text-negative bg-negative/10'
                      : f.trend === 'Expanding' ? 'text-accent bg-accent/10'
                      : 'text-positive bg-positive/10'
                  }`}>{f.trend.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
