import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ratesData = [
  { country: '🇺🇸 Fed', rate: '5.25-5.50%', lastChg: '-25bp', lastDate: '2024-09', nextMeet: '2025-05-07', mktExp: 'HOLD', prob: '82%', realRate: '2.45%', neutral: '2.50%', details: { deposits: '$3.4T', rrp: '$450B', iorb: '5.40%', effRate: '5.33%', sofr: '5.31%', tbill3m: '5.22%', reserves: '$3.2T', qeQtPace: '-$60B/mo', balSheet: '$7.4T' } },
  { country: '🇪🇺 ECB', rate: '4.50%', lastChg: '-25bp', lastDate: '2024-10', nextMeet: '2025-04-17', mktExp: 'CUT 25', prob: '78%', realRate: '1.85%', neutral: '2.00%', details: { deposits: '€3.8T', rrp: 'N/A', iorb: '4.00%', effRate: '3.91%', sofr: 'N/A', tbill3m: '3.82%', reserves: '€850B', qeQtPace: '-€25B/mo', balSheet: '€6.6T' } },
  { country: '🇬🇧 BOE', rate: '5.25%', lastChg: '-25bp', lastDate: '2024-08', nextMeet: '2025-05-08', mktExp: 'HOLD', prob: '65%', realRate: '1.75%', neutral: '3.00%', details: { deposits: '£850B', rrp: '£420B', iorb: '5.25%', effRate: '5.20%', sofr: 'N/A', tbill3m: '5.18%', reserves: '£280B', qeQtPace: '-£80B/yr', balSheet: '£820B' } },
  { country: '🇯🇵 BOJ', rate: '0.25%', lastChg: '+15bp', lastDate: '2024-07', nextMeet: '2025-04-25', mktExp: 'HOLD', prob: '88%', realRate: '-2.45%', neutral: '0.50%', details: { deposits: '¥540T', rrp: 'N/A', iorb: '0.25%', effRate: '0.228%', sofr: 'N/A', tbill3m: '0.08%', reserves: '¥58T', qeQtPace: 'Tapering', balSheet: '¥756T' } },
  { country: '🇨🇭 SNB', rate: '1.50%', lastChg: '-25bp', lastDate: '2024-06', nextMeet: '2025-06-19', mktExp: 'HOLD', prob: '72%', realRate: '0.20%', neutral: '1.00%', details: { deposits: 'CHF 498B', rrp: 'N/A', iorb: '1.50%', effRate: '1.44%', sofr: 'N/A', tbill3m: '1.38%', reserves: 'CHF 680B', qeQtPace: 'FX Sales', balSheet: 'CHF 780B' } },
  { country: '🇦🇺 RBA', rate: '4.35%', lastChg: '+25bp', lastDate: '2023-11', nextMeet: '2025-05-20', mktExp: 'CUT 25', prob: '55%', realRate: '0.85%', neutral: '3.00%', details: { deposits: 'A$310B', rrp: 'N/A', iorb: '4.35%', effRate: '4.32%', sofr: 'N/A', tbill3m: '4.28%', reserves: 'A$85B', qeQtPace: 'Passive QT', balSheet: 'A$540B' } },
  { country: '🇨🇦 BOC', rate: '4.50%', lastChg: '-50bp', lastDate: '2024-12', nextMeet: '2025-04-16', mktExp: 'CUT 25', prob: '68%', realRate: '1.50%', neutral: '2.75%', details: { deposits: 'C$280B', rrp: 'C$120B', iorb: '4.50%', effRate: '4.48%', sofr: 'N/A', tbill3m: '4.42%', reserves: 'C$110B', qeQtPace: '-C$5B/mo', balSheet: 'C$380B' } },
  { country: '🇨🇳 PBOC', rate: '3.45%', lastChg: '-10bp', lastDate: '2024-07', nextMeet: 'Monthly', mktExp: 'CUT 10', prob: '42%', realRate: '3.15%', neutral: '3.00%', details: { deposits: '¥220T', rrp: '¥2.8T', iorb: '0.35%', effRate: '1.80%', sofr: 'N/A', tbill3m: '1.72%', reserves: '¥24T', qeQtPace: 'MLF/SLF Active', balSheet: '¥45T' } },
];

export default function GlobalRates() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) GLOBAL POLICY RATE DASHBOARD — RATD</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Central Bank</th><th className="text-right p-1">Policy Rate</th><th className="text-right p-1">Last Chg</th><th className="text-right p-1">Last Date</th><th className="text-right p-1">Next Meet</th><th className="text-right p-1">Mkt Exp</th><th className="text-right p-1">Prob</th><th className="text-right p-1">Real Rate</th><th className="text-right p-1">r*</th>
          </tr></thead>
          <tbody>{ratesData.map(r => (
            <><tr key={r.country} onClick={() => setSelected(selected === r.country ? null : r.country)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === r.country ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{r.country}</td>
              <td className="text-right p-1 font-bold text-yellow-400">{r.rate}</td>
              <td className={`text-right p-1 ${r.lastChg.startsWith('+') ? 'text-red-400' : 'text-green-400'}`}>{r.lastChg}</td>
              <td className="text-right p-1 text-muted-foreground">{r.lastDate}</td><td className="text-right p-1 text-muted-foreground">{r.nextMeet}</td>
              <td className="text-right p-1"><span className={`px-1 ${r.mktExp.includes('CUT') ? 'bg-green-500/20 text-green-400' : r.mktExp === 'HOLD' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{r.mktExp}</span></td>
              <td className="text-right p-1">{r.prob}</td><td className="text-right p-1">{r.realRate}</td><td className="text-right p-1 text-muted-foreground">{r.neutral}</td>
            </tr>
            {selected === r.country && (
              <tr key={r.country + '-d'}><td colSpan={9} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-3 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">MONEY MARKET RATES</div>
                    {[{ l: 'Eff. Rate', v: r.details.effRate }, { l: 'IORB', v: r.details.iorb }, { l: '3M Bill', v: r.details.tbill3m }, { l: 'SOFR/Equiv', v: r.details.sofr || 'N/A' }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">LIQUIDITY</div>
                    {[{ l: 'Bank Deposits', v: r.details.deposits }, { l: 'RRP Facility', v: r.details.rrp }, { l: 'Bank Reserves', v: r.details.reserves }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">BALANCE SHEET</div>
                    {[{ l: 'Total Assets', v: r.details.balSheet }, { l: 'QE/QT Pace', v: r.details.qeQtPace }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>RATD — Global Policy Rate Dashboard</span><span>Source: Central Banks / OIS Markets</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
