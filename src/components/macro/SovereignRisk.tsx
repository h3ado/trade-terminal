import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const sovereigns = [
  { country: '🇺🇸 United States', rating: 'AA+/Aaa', cds5y: '28bp', chg: '-2', color: 'text-green-400', debtGdp: '123%', deficit: '-6.2%', fx: '104.2', ext: '32.8T', details: { sp: 'AA+', moody: 'Aaa', fitch: 'AA+', outlook: 'STABLE', lastChg: '2023-08-01', cds1y: '12bp', cds10y: '42bp', matProfile: '5.8yr avg', intCost: '$880B', rollover12m: '$8.2T', reserves: '$245B', goldTon: '8,134t' } },
  { country: '🇬🇧 United Kingdom', rating: 'AA/Aa3', cds5y: '32bp', chg: '+1', color: 'text-red-400', debtGdp: '101%', deficit: '-4.8%', fx: '1.272', ext: '8.7T', details: { sp: 'AA', moody: 'Aa3', fitch: 'AA-', outlook: 'STABLE', lastChg: '2024-03-15', cds1y: '15bp', cds10y: '48bp', matProfile: '14.2yr avg', intCost: '£112B', rollover12m: '£450B', reserves: '$185B', goldTon: '310t' } },
  { country: '🇮🇹 Italy', rating: 'BBB/Baa3', cds5y: '82bp', chg: '+4', color: 'text-red-400', debtGdp: '140%', deficit: '-7.2%', fx: '1.088', ext: '2.8T', details: { sp: 'BBB', moody: 'Baa3', fitch: 'BBB', outlook: 'STABLE', lastChg: '2024-11-22', cds1y: '38bp', cds10y: '118bp', matProfile: '7.1yr avg', intCost: '€85B', rollover12m: '€380B', reserves: '$198B', goldTon: '2,452t' } },
  { country: '🇯🇵 Japan', rating: 'A+/A1', cds5y: '22bp', chg: '-1', color: 'text-green-400', debtGdp: '255%', deficit: '-5.8%', fx: '151.8', ext: '4.2T', details: { sp: 'A+', moody: 'A1', fitch: 'A', outlook: 'STABLE', lastChg: '2023-04-18', cds1y: '8bp', cds10y: '35bp', matProfile: '9.2yr avg', intCost: '¥25.3T', rollover12m: '¥180T', reserves: '$1,232B', goldTon: '846t' } },
  { country: '🇧🇷 Brazil', rating: 'BB-/Ba2', cds5y: '148bp', chg: '+8', color: 'text-red-400', debtGdp: '75%', deficit: '-8.1%', fx: '4.98', ext: '672B', details: { sp: 'BB-', moody: 'Ba2', fitch: 'BB', outlook: 'POSITIVE', lastChg: '2024-12-18', cds1y: '72bp', cds10y: '198bp', matProfile: '4.1yr avg', intCost: 'R$720B', rollover12m: 'R$1.8T', reserves: '$355B', goldTon: '130t' } },
  { country: '🇹🇷 Turkey', rating: 'B/B3', cds5y: '285bp', chg: '+15', color: 'text-red-400', debtGdp: '42%', deficit: '-5.4%', fx: '32.1', ext: '498B', details: { sp: 'B', moody: 'B3', fitch: 'B+', outlook: 'POSITIVE', lastChg: '2024-09-06', cds1y: '185bp', cds10y: '342bp', matProfile: '3.2yr avg', intCost: '₺842B', rollover12m: '₺1.2T', reserves: '$148B', goldTon: '585t' } },
  { country: '🇿🇦 South Africa', rating: 'BB-/Ba2', cds5y: '192bp', chg: '+6', color: 'text-red-400', debtGdp: '73%', deficit: '-4.5%', fx: '18.42', ext: '185B', details: { sp: 'BB-', moody: 'Ba2', fitch: 'BB-', outlook: 'STABLE', lastChg: '2024-05-24', cds1y: '98bp', cds10y: '248bp', matProfile: '3.8yr avg', intCost: 'R312B', rollover12m: 'R580B', reserves: '$62B', goldTon: '125t' } },
  { country: '🇦🇷 Argentina', rating: 'CCC/Ca', cds5y: '1,450bp', chg: '-120', color: 'text-green-400', debtGdp: '89%', deficit: '-2.8%', fx: '875', ext: '278B', details: { sp: 'CCC', moody: 'Ca', fitch: 'CC', outlook: 'POSITIVE', lastChg: '2025-01-10', cds1y: '2,180bp', cds10y: '1,280bp', matProfile: '8.5yr avg', intCost: '$12.8B', rollover12m: '$18.2B', reserves: '$28B', goldTon: '62t' } },
];

export default function SovereignRisk() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) SOVEREIGN CREDIT RISK MONITOR — SOVR</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Sovereign</th><th className="text-right p-1">Rating</th><th className="text-right p-1">CDS 5Y</th><th className="text-right p-1">Chg (bp)</th><th className="text-right p-1">Debt/GDP</th><th className="text-right p-1">Deficit/GDP</th><th className="text-right p-1">FX Rate</th><th className="text-right p-1">Ext Debt</th>
          </tr></thead>
          <tbody>{sovereigns.map(s => (
            <><tr key={s.country} onClick={() => setSelected(selected === s.country ? null : s.country)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === s.country ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{s.country}</td>
              <td className="text-right p-1 font-bold text-yellow-400">{s.rating}</td><td className="text-right p-1">{s.cds5y}</td><td className={`text-right p-1 ${s.color}`}>{s.chg}</td>
              <td className="text-right p-1">{s.debtGdp}</td><td className="text-right p-1 text-red-400">{s.deficit}</td><td className="text-right p-1">{s.fx}</td><td className="text-right p-1 text-muted-foreground">{s.ext}</td>
            </tr>
            {selected === s.country && (
              <tr key={s.country + '-d'}><td colSpan={8} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-4 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">CREDIT RATINGS</div>
                    {[{ l: 'S&P', v: s.details.sp }, { l: 'Moody\'s', v: s.details.moody }, { l: 'Fitch', v: s.details.fitch }, { l: 'Outlook', v: s.details.outlook }, { l: 'Last Action', v: s.details.lastChg }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">CDS TERM STRUCTURE</div>
                    {[{ l: '1Y CDS', v: s.details.cds1y }, { l: '5Y CDS', v: s.cds5y }, { l: '10Y CDS', v: s.details.cds10y }, { l: 'Curve Slope', v: `${parseInt(s.details.cds10y) - parseInt(s.details.cds1y)}bp` }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">DEBT PROFILE</div>
                    {[{ l: 'Avg Maturity', v: s.details.matProfile }, { l: 'Int Cost', v: s.details.intCost }, { l: '12M Rollover', v: s.details.rollover12m }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">RESERVES</div>
                    {[{ l: 'FX Reserves', v: s.details.reserves }, { l: 'Gold Holdings', v: s.details.goldTon }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>SOVR — Sovereign Credit Risk Monitor</span><span>Source: S&P / Moody's / Fitch / Markit</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
