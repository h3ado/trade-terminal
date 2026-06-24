import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailMiniChart, DetailKV, DetailStat } from './MacroExpandable';

interface CentralBank {
  bank: string;
  code: string;
  country: string;
  rate: number;
  prevRate: number;
  lastChange: string;
  lastAction: string;
  nextMeeting: string;
  bias: 'Hawkish' | 'Neutral' | 'Dovish';
  inflationTarget: string;
  currentInflation: number;
  qeStatus: string;
  balanceSheet: string;
  forwardGuidance: string;
  rateHistory?: { label: string; value: number }[];
  mandates?: string;
  governor?: string;
  frequency?: string;
  voteSplit?: string;
}

const banks: CentralBank[] = [
  { bank: 'Federal Reserve', code: 'FED', country: 'US', rate: 5.50, prevRate: 5.50, lastChange: '2025-07-26', lastAction: 'HOLD', nextMeeting: '2026-05-07', bias: 'Hawkish', inflationTarget: '2.0%', currentInflation: 3.2, qeStatus: 'QT $60B/mo', balanceSheet: '$7.4T', forwardGuidance: 'Data-dependent, no rush to cut', governor: 'Jerome Powell', frequency: '8x/year', voteSplit: '12-0 (unanimous)', mandates: 'Dual mandate: price stability & maximum employment' },
  { bank: 'European Central Bank', code: 'ECB', country: 'EU', rate: 4.50, prevRate: 4.50, lastChange: '2025-09-14', lastAction: 'HOLD', nextMeeting: '2026-04-17', bias: 'Neutral', inflationTarget: '2.0%', currentInflation: 2.6, qeStatus: 'QT Active', balanceSheet: '€6.4T', forwardGuidance: 'Meeting by meeting approach', governor: 'Christine Lagarde', frequency: '8x/year', voteSplit: 'Consensus', mandates: 'Price stability (primary)' },
  { bank: 'Bank of England', code: 'BOE', country: 'UK', rate: 5.25, prevRate: 5.25, lastChange: '2025-08-03', lastAction: 'HOLD', nextMeeting: '2026-05-09', bias: 'Neutral', inflationTarget: '2.0%', currentInflation: 3.4, qeStatus: 'QT £80B/yr', balanceSheet: '£842B', forwardGuidance: 'Restrictive for sufficiently long', governor: 'Andrew Bailey', frequency: '8x/year', voteSplit: '6-3 (hold)', mandates: 'Price stability & financial stability' },
  { bank: 'Bank of Japan', code: 'BOJ', country: 'JP', rate: 0.10, prevRate: -0.10, lastChange: '2026-03-19', lastAction: '+20bp', nextMeeting: '2026-04-26', bias: 'Dovish', inflationTarget: '2.0%', currentInflation: 2.8, qeStatus: 'YCC Ended', balanceSheet: '¥755T', forwardGuidance: 'Gradual normalization path', governor: 'Kazuo Ueda', frequency: '8x/year', voteSplit: '7-2 (hike)', mandates: 'Price stability' },
  { bank: 'Swiss National Bank', code: 'SNB', country: 'CH', rate: 1.75, prevRate: 1.75, lastChange: '2025-06-22', lastAction: 'HOLD', nextMeeting: '2026-06-20', bias: 'Neutral', inflationTarget: '<2.0%', currentInflation: 1.3, qeStatus: 'FX Intervention', balanceSheet: 'CHF 780B', forwardGuidance: 'Price stability priority', governor: 'Thomas Jordan', frequency: '4x/year', voteSplit: 'Consensus', mandates: 'Price stability & economic conditions' },
  { bank: 'Bank of Canada', code: 'BOC', country: 'CA', rate: 5.00, prevRate: 5.00, lastChange: '2025-07-12', lastAction: 'HOLD', nextMeeting: '2026-04-24', bias: 'Hawkish', inflationTarget: '1-3%', currentInflation: 2.9, qeStatus: 'QT Active', balanceSheet: 'C$248B', forwardGuidance: 'Need sustained progress on inflation', governor: 'Tiff Macklem', frequency: '8x/year', voteSplit: 'Consensus' },
  { bank: 'Reserve Bank of Aus', code: 'RBA', country: 'AU', rate: 4.35, prevRate: 4.35, lastChange: '2025-11-07', lastAction: 'HOLD', nextMeeting: '2026-05-07', bias: 'Hawkish', inflationTarget: '2-3%', currentInflation: 3.4, qeStatus: 'QT Active', balanceSheet: 'A$528B', forwardGuidance: 'Not ruling anything in or out', governor: 'Michele Bullock', frequency: '8x/year', voteSplit: 'Unanimous' },
  { bank: "People's Bank of China", code: 'PBOC', country: 'CN', rate: 3.45, prevRate: 3.55, lastChange: '2025-08-21', lastAction: '-10bp', nextMeeting: '2026-04-20', bias: 'Dovish', inflationTarget: '~3.0%', currentInflation: 0.7, qeStatus: 'Easing', balanceSheet: '¥44.8T', forwardGuidance: 'Counter-cyclical adjustments', governor: 'Pan Gongsheng', frequency: 'Monthly', voteSplit: 'N/A' },
  { bank: 'Reserve Bank of India', code: 'RBI', country: 'IN', rate: 6.50, prevRate: 6.50, lastChange: '2025-04-06', lastAction: 'HOLD', nextMeeting: '2026-06-06', bias: 'Neutral', inflationTarget: '4±2%', currentInflation: 5.4, qeStatus: 'Neutral', balanceSheet: '₹62.4T', forwardGuidance: 'Withdrawal of accommodation', governor: 'Shaktikanta Das', frequency: '6x/year', voteSplit: '5-1 (hold)' },
  { bank: 'Banco Central do Brasil', code: 'BCB', country: 'BR', rate: 11.75, prevRate: 11.75, lastChange: '2025-06-21', lastAction: 'HOLD', nextMeeting: '2026-05-07', bias: 'Hawkish', inflationTarget: '3±1.5%', currentInflation: 4.6, qeStatus: 'Neutral', balanceSheet: 'R$6.2T', forwardGuidance: 'Vigilance on persistent inflation', governor: 'Roberto Campos Neto', frequency: '8x/year', voteSplit: '8-1 (hold)' },
  { bank: 'Bank of Korea', code: 'BOK', country: 'KR', rate: 3.50, prevRate: 3.50, lastChange: '2025-05-25', lastAction: 'HOLD', nextMeeting: '2026-04-11', bias: 'Neutral', inflationTarget: '2.0%', currentInflation: 3.2, qeStatus: 'Neutral', balanceSheet: '₩546T', forwardGuidance: 'Open to both directions', governor: 'Rhee Chang-yong', frequency: '8x/year', voteSplit: '5-2 (hold)' },
  { bank: 'Banxico', code: 'BXN', country: 'MX', rate: 11.25, prevRate: 11.25, lastChange: '2025-06-27', lastAction: 'HOLD', nextMeeting: '2026-05-09', bias: 'Hawkish', inflationTarget: '3±1%', currentInflation: 4.2, qeStatus: 'Neutral', balanceSheet: 'MXN 5.8T', forwardGuidance: 'Cautious approach warranted', governor: 'Victoria Rodriguez', frequency: '8x/year', voteSplit: '4-1 (hold)' },
];

const fedDotPlot = [
  { year: '2026', median: 5.125, range: [4.625, 5.625] },
  { year: '2027', median: 4.125, range: [3.375, 4.875] },
  { year: '2028', median: 3.125, range: [2.625, 3.875] },
  { year: 'Long Run', median: 2.500, range: [2.375, 3.000] },
];

const rateHistory = [
  { label: '6M Ago', US: 5.50, EU: 4.50, UK: 5.25, JP: -0.10, CN: 3.55 },
  { label: '3M Ago', US: 5.50, EU: 4.50, UK: 5.25, JP: 0.00, CN: 3.45 },
  { label: 'Current', US: 5.50, EU: 4.50, UK: 5.25, JP: 0.10, CN: 3.45 },
  { label: '3M Fwd', US: 5.25, EU: 4.00, UK: 5.00, JP: 0.25, CN: 3.35 },
  { label: '6M Fwd', US: 5.00, EU: 3.50, UK: 4.75, JP: 0.35, CN: 3.25 },
  { label: '12M Fwd', US: 4.50, EU: 3.00, UK: 4.25, JP: 0.50, CN: 3.00 },
];

export default function CentralBanks() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">Central Bank Monitor</span>
        <span className="text-muted-foreground font-mono text-[9px]">CBRT &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click any bank for deep dive</span>
      </div>

      {/* Main table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left px-1 py-1.5 text-accent font-bold w-4"></th>
              <th className="text-left px-2 py-1.5 text-accent font-bold">BANK</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">CODE</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">RATE</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">PREV</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">LAST ACT</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">BIAS</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">CPI</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">TARGET</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">NEXT MTG</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b, i) => {
              const expanded = isExpanded(b.code);
              const hist = [
                { label: '2024Q1', value: b.rate + 0.25 },
                { label: '2024Q2', value: b.rate + 0.25 },
                { label: '2024Q3', value: b.rate },
                { label: '2025Q1', value: b.rate },
                { label: '2025Q3', value: b.prevRate },
                { label: 'Current', value: b.rate },
              ];
              return (
                <ExpandableRow
                  key={b.code}
                  id={b.code}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={10}
                  className={b.country === selectedCountry ? 'bg-accent/10' : i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                  cells={
                    <>
                      <td className="px-1 py-1.5 w-4"><ExpandIcon isExpanded={expanded} /></td>
                      <td className="px-2 py-1.5">
                        <div className="text-foreground font-bold">{b.bank}</div>
                        <div className="text-muted-foreground text-[8px]">{b.country}</div>
                      </td>
                      <td className="px-2 py-1.5 text-center text-accent font-bold">{b.code}</td>
                      <td className="px-2 py-1.5 text-right text-foreground font-bold">{b.rate.toFixed(2)}%</td>
                      <td className="px-2 py-1.5 text-right text-muted-foreground">{b.prevRate.toFixed(2)}%</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`px-1 py-0.5 text-[8px] font-bold ${
                          b.lastAction === 'HOLD' ? 'text-muted-foreground bg-muted/30' :
                          b.lastAction.startsWith('+') ? 'text-negative bg-negative/10' :
                          'text-positive bg-positive/10'
                        }`}>{b.lastAction}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`px-1 py-0.5 text-[8px] font-bold ${
                          b.bias === 'Hawkish' ? 'text-negative bg-negative/10' :
                          b.bias === 'Dovish' ? 'text-positive bg-positive/10' :
                          'text-muted-foreground bg-muted/30'
                        }`}>{b.bias.toUpperCase()}</span>
                      </td>
                      <td className={`px-2 py-1.5 text-right font-bold ${b.currentInflation > 3 ? 'text-negative' : b.currentInflation > 2 ? 'text-accent' : 'text-positive'}`}>
                        {b.currentInflation.toFixed(1)}%
                      </td>
                      <td className="px-2 py-1.5 text-right text-muted-foreground">{b.inflationTarget}</td>
                      <td className="px-2 py-1.5 text-right text-muted-foreground">{b.nextMeeting}</td>
                    </>
                  }
                  detail={
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Rate History</div>
                        <DetailMiniChart data={hist} dataKey="value" height={80} />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Details</div>
                        <DetailKV items={[
                          { label: 'Governor', value: b.governor || '—' },
                          { label: 'Meeting Freq.', value: b.frequency || '—' },
                          { label: 'Vote Split', value: b.voteSplit || '—' },
                          { label: 'Balance Sheet', value: b.balanceSheet },
                          { label: 'QE/QT Status', value: b.qeStatus },
                          { label: 'Last Changed', value: b.lastChange },
                        ]} />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Forward Guidance</div>
                        <div className="text-[9px] font-mono text-foreground border border-border p-2 mb-2">{b.forwardGuidance}</div>
                        {b.mandates && (
                          <div className="text-[8px] font-mono text-muted-foreground border border-border p-1.5">
                            <span className="text-accent font-bold">Mandate: </span>{b.mandates}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Fed Dot Plot */}
        <div className="border border-border">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Fed Dot Plot — Rate Projections</span>
          </div>
          <div className="grid grid-cols-4 gap-0 divide-x divide-grid-line">
            {fedDotPlot.map(d => (
              <div key={d.year} className="px-3 py-2 text-center">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{d.year}</div>
                <div className="text-lg font-mono font-bold text-accent">{d.median.toFixed(3)}%</div>
                <div className="text-[8px] font-mono text-muted-foreground">
                  Range: {d.range[0].toFixed(3)}–{d.range[1].toFixed(3)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate path table */}
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Implied Rate Path (OIS)</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">PERIOD</th>
                <th className="text-right px-2 py-1 text-muted-foreground">FED</th>
                <th className="text-right px-2 py-1 text-muted-foreground">ECB</th>
                <th className="text-right px-2 py-1 text-muted-foreground">BOE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">BOJ</th>
                <th className="text-right px-2 py-1 text-muted-foreground">PBOC</th>
              </tr>
            </thead>
            <tbody>
              {rateHistory.map((r, i) => (
                <tr key={r.label} className={`border-b border-grid-line last:border-0 ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground font-bold">{r.label}</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.US.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.EU.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.UK.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.JP.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.CN.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
