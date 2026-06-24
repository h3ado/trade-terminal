import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const debtClock = [
  { label: 'US National Debt', value: '$34.8T', rate: '+$2.5B/day', color: 'text-red-400' },
  { label: 'Debt Per Citizen', value: '$103,420', rate: '', color: 'text-foreground' },
  { label: 'Debt Per Taxpayer', value: '$266,180', rate: '', color: 'text-foreground' },
  { label: 'Debt to GDP', value: '123.4%', rate: '+2.1% YoY', color: 'text-yellow-400' },
  { label: 'Interest Paid YTD', value: '$880B', rate: '$2.4B/day', color: 'text-red-400' },
  { label: 'Unfunded Liabilities', value: '$212T', rate: '', color: 'text-red-400' },
];

const auctionCalendar = [
  { date: '2025-04-14', security: '3-Month Bill', cusip: '912797KX8', size: '$80B', bidCover: '2.82', tail: '0.0bp', indirect: '62%', status: 'SETTLED' },
  { date: '2025-04-14', security: '6-Month Bill', cusip: '912797KY6', size: '$68B', bidCover: '2.95', tail: '-0.5bp', indirect: '58%', status: 'SETTLED' },
  { date: '2025-04-15', security: '10-Year Note', cusip: '91282CKA0', size: '$42B', bidCover: '2.45', tail: '+1.2bp', indirect: '72%', status: 'UPCOMING' },
  { date: '2025-04-16', security: '30-Year Bond', cusip: '912810TV8', size: '$22B', bidCover: '—', tail: '—', indirect: '—', status: 'UPCOMING' },
  { date: '2025-04-17', security: '20-Year Bond', cusip: '912810TU0', size: '$16B', bidCover: '—', tail: '—', indirect: '—', status: 'UPCOMING' },
  { date: '2025-04-17', security: '5-Year TIPS', cusip: '91282CKB8', size: '$22B', bidCover: '—', tail: '—', indirect: '—', status: 'UPCOMING' },
];

const maturityWall = [
  { period: 'Q2 2025', amount: '$2.8T', pctTotal: '8.0%', avgCoupon: '2.1%', refinRate: '4.8%', costInc: '+$75B' },
  { period: 'Q3 2025', amount: '$2.2T', pctTotal: '6.3%', avgCoupon: '1.8%', refinRate: '4.6%', costInc: '+$62B' },
  { period: 'Q4 2025', amount: '$3.1T', pctTotal: '8.9%', avgCoupon: '2.4%', refinRate: '4.5%', costInc: '+$65B' },
  { period: 'Q1 2026', amount: '$2.5T', pctTotal: '7.2%', avgCoupon: '1.5%', refinRate: '4.3%', costInc: '+$70B' },
  { period: '2026 Full', amount: '$9.8T', pctTotal: '28.2%', avgCoupon: '1.9%', refinRate: '4.2%', costInc: '+$225B' },
  { period: '2027 Full', amount: '$7.2T', pctTotal: '20.7%', avgCoupon: '2.8%', refinRate: '3.8%', costInc: '+$72B' },
];

const foreignHolders = [
  { country: '🇯🇵 Japan', holdings: '$1,138B', chg1m: '-$12B', chg1y: '-$42B', pctTotal: '14.8%', trend: 'SELLING', details: { peak: '$1,316B (2021)', bills: '$198B', notes: '$612B', bonds: '$328B', duration: '5.2yr' } },
  { country: '🇨🇳 China', holdings: '$775B', chg1m: '-$8B', chg1y: '-$52B', pctTotal: '10.1%', trend: 'SELLING', details: { peak: '$1,317B (2013)', bills: '$42B', notes: '$398B', bonds: '$335B', duration: '6.8yr' } },
  { country: '🇬🇧 United Kingdom', holdings: '$728B', chg1m: '+$15B', chg1y: '+$82B', pctTotal: '9.5%', trend: 'BUYING', details: { peak: '$728B (2025)', bills: '$285B', notes: '$312B', bonds: '$131B', duration: '2.8yr' } },
  { country: '🇧🇪 Belgium/Lux', holdings: '$382B', chg1m: '+$5B', chg1y: '+$28B', pctTotal: '5.0%', trend: 'BUYING', details: { peak: '$382B (2025)', bills: '$142B', notes: '$165B', bonds: '$75B', duration: '3.1yr' } },
  { country: '🇨🇭 Switzerland', holdings: '$298B', chg1m: '-$2B', chg1y: '+$8B', pctTotal: '3.9%', trend: 'STABLE', details: { peak: '$310B (2024)', bills: '$82B', notes: '$148B', bonds: '$68B', duration: '4.2yr' } },
  { country: '🇨🇦 Canada', holdings: '$282B', chg1m: '+$4B', chg1y: '+$32B', pctTotal: '3.7%', trend: 'BUYING', details: { peak: '$282B (2025)', bills: '$98B', notes: '$132B', bonds: '$52B', duration: '3.5yr' } },
];

export default function DebtMonitor() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) US DEBT CLOCK — DDIS</div>
        <div className="grid grid-cols-6 gap-2">
          {debtClock.map(d => (
            <div key={d.label} className="border border-border p-2 text-center">
              <div className="text-[8px] text-muted-foreground">{d.label}</div>
              <div className={`text-sm font-bold ${d.color}`}>{d.value}</div>
              {d.rate && <div className="text-[8px] text-red-400">{d.rate}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border p-2 bg-card">
          <div className="text-accent font-bold mb-2">2) TREASURY AUCTION CALENDAR</div>
          <table className="w-full">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-1">Date</th><th className="text-left p-1">Security</th><th className="text-right p-1">Size</th><th className="text-right p-1">B/C</th><th className="text-right p-1">Tail</th><th className="text-right p-1">Indirect</th><th className="text-right p-1">Status</th>
            </tr></thead>
            <tbody>{auctionCalendar.map((a, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/5">
                <td className="p-1 text-muted-foreground">{a.date}</td><td className="p-1 font-bold">{a.security}</td><td className="text-right p-1">{a.size}</td>
                <td className="text-right p-1">{a.bidCover}</td><td className="text-right p-1">{a.tail}</td><td className="text-right p-1">{a.indirect}</td>
                <td className="text-right p-1"><span className={`px-1 ${a.status === 'UPCOMING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{a.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="border border-border p-2 bg-card">
          <div className="text-accent font-bold mb-2">3) MATURITY WALL — REFINANCING RISK</div>
          <table className="w-full">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-1">Period</th><th className="text-right p-1">Maturing</th><th className="text-right p-1">% Total</th><th className="text-right p-1">Avg Cpn</th><th className="text-right p-1">Refi Rate</th><th className="text-right p-1">Cost Inc</th>
            </tr></thead>
            <tbody>{maturityWall.map(m => (
              <tr key={m.period} className="border-b border-border/50 hover:bg-accent/5">
                <td className="p-1 font-bold">{m.period}</td><td className="text-right p-1">{m.amount}</td><td className="text-right p-1">{m.pctTotal}</td>
                <td className="text-right p-1 text-green-400">{m.avgCoupon}</td><td className="text-right p-1 text-red-400">{m.refinRate}</td><td className="text-right p-1 text-red-400 font-bold">{m.costInc}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">4) FOREIGN HOLDERS OF US TREASURIES (TIC)</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Country</th><th className="text-right p-1">Holdings</th><th className="text-right p-1">1M Chg</th><th className="text-right p-1">1Y Chg</th><th className="text-right p-1">% Total</th><th className="text-right p-1">Trend</th>
          </tr></thead>
          <tbody>{foreignHolders.map(f => (
            <><tr key={f.country} onClick={() => setSelected(selected === f.country ? null : f.country)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === f.country ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{f.country}</td>
              <td className="text-right p-1 font-bold">{f.holdings}</td>
              <td className={`text-right p-1 ${f.chg1m.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{f.chg1m}</td>
              <td className={`text-right p-1 ${f.chg1y.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{f.chg1y}</td>
              <td className="text-right p-1">{f.pctTotal}</td>
              <td className="text-right p-1"><span className={`px-1 ${f.trend === 'BUYING' ? 'bg-green-500/20 text-green-400' : f.trend === 'SELLING' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{f.trend}</span></td>
            </tr>
            {selected === f.country && (
              <tr key={f.country + '-d'}><td colSpan={6} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-2 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">HOLDINGS BREAKDOWN</div>
                    {[{ l: 'T-Bills', v: f.details.bills }, { l: 'Notes', v: f.details.notes }, { l: 'Bonds', v: f.details.bonds }, { l: 'Avg Duration', v: f.details.duration }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">HISTORY</div>
                    <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Peak Holdings</span><span className="font-bold">{f.details.peak}</span></div>
                  </div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>DDIS — Debt & Issuance Monitor</span><span>Source: US Treasury / TIC / SIFMA</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
