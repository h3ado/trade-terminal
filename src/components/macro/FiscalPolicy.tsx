import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const fiscalData = [
  { country: '🇺🇸 United States', revenue: '$4.4T', spending: '$6.1T', deficit: '-$1.7T', defGdp: '-6.2%', debt: '$34.8T', debtGdp: '123%', intPct: '14.2%', details: { tax: '$2.2T', social: '$1.5T', corp: '$420B', customs: '$98B', topSpend: [{ n: 'Social Security', v: '$1.4T' }, { n: 'Medicare/Medicaid', v: '$1.6T' }, { n: 'Defense', v: '$886B' }, { n: 'Interest', v: '$880B' }, { n: 'Other', v: '$1.3T' }], debtHolders: [{ n: 'Fed Reserve', v: '18%' }, { n: 'Foreign Gov', v: '24%' }, { n: 'Mutual Funds', v: '12%' }, { n: 'Banks', v: '8%' }, { n: 'Other', v: '38%' }] } },
  { country: '🇬🇧 United Kingdom', revenue: '£1.1T', spending: '£1.3T', deficit: '-£138B', defGdp: '-4.8%', debt: '£2.7T', debtGdp: '101%', intPct: '8.5%', details: { tax: '£385B', social: '£185B', corp: '£85B', customs: '£32B', topSpend: [{ n: 'Health (NHS)', v: '£181B' }, { n: 'Welfare', v: '£261B' }, { n: 'Education', v: '£112B' }, { n: 'Defence', v: '£55B' }, { n: 'Debt Interest', v: '£112B' }], debtHolders: [{ n: 'BoE', v: '28%' }, { n: 'Pension Funds', v: '22%' }, { n: 'Foreign', v: '28%' }, { n: 'Insurance', v: '12%' }, { n: 'Other', v: '10%' }] } },
  { country: '🇯🇵 Japan', revenue: '¥72T', spending: '¥114T', deficit: '-¥42T', defGdp: '-5.8%', debt: '¥1,286T', debtGdp: '255%', intPct: '22.1%', details: { tax: '¥42T', social: '¥22T', corp: '¥14T', customs: '¥1.2T', topSpend: [{ n: 'Social Security', v: '¥37T' }, { n: 'Debt Service', v: '¥25T' }, { n: 'Local Govt', v: '¥16T' }, { n: 'Public Works', v: '¥6T' }, { n: 'Defense', v: '¥7T' }], debtHolders: [{ n: 'BoJ', v: '48%' }, { n: 'Insurance', v: '20%' }, { n: 'Banks', v: '12%' }, { n: 'Pension', v: '8%' }, { n: 'Foreign', v: '7%' }] } },
  { country: '🇩🇪 Germany', revenue: '€883B', spending: '€918B', deficit: '-€35B', defGdp: '-1.2%', debt: '€2.4T', debtGdp: '64%', intPct: '3.8%', details: { tax: '€412B', social: '€285B', corp: '€42B', customs: '€38B', topSpend: [{ n: 'Social', v: '€198B' }, { n: 'Labor', v: '€162B' }, { n: 'Defence', v: '€52B' }, { n: 'Transport', v: '€42B' }, { n: 'Interest', v: '€35B' }], debtHolders: [{ n: 'ECB/Buba', v: '32%' }, { n: 'Foreign', v: '42%' }, { n: 'Banks', v: '12%' }, { n: 'Insurance', v: '8%' }, { n: 'Other', v: '6%' }] } },
  { country: '🇨🇳 China', revenue: '¥22T', spending: '¥27T', deficit: '-¥5T', defGdp: '-3.8%', debt: '¥68T', debtGdp: '56%', intPct: '5.2%', details: { tax: '¥15T', social: '¥4.2T', corp: '¥4.8T', customs: '¥2.1T', topSpend: [{ n: 'Infrastructure', v: '¥8.2T' }, { n: 'Education', v: '¥4.2T' }, { n: 'Defense', v: '¥1.6T' }, { n: 'Social Security', v: '¥3.8T' }, { n: 'Debt Service', v: '¥1.4T' }], debtHolders: [{ n: 'PBOC/State', v: '45%' }, { n: 'Banks', v: '32%' }, { n: 'Foreign', v: '8%' }, { n: 'Insurance', v: '10%' }, { n: 'Other', v: '5%' }] } },
  { country: '🇫🇷 France', revenue: '€612B', spending: '€798B', deficit: '-€186B', defGdp: '-5.5%', debt: '€3.1T', debtGdp: '111%', intPct: '6.8%', details: { tax: '€312B', social: '€198B', corp: '€52B', customs: '€28B', topSpend: [{ n: 'Social Protection', v: '€298B' }, { n: 'Health', v: '€142B' }, { n: 'Education', v: '€98B' }, { n: 'Defence', v: '€48B' }, { n: 'Debt Interest', v: '€52B' }], debtHolders: [{ n: 'ECB/BdF', v: '28%' }, { n: 'Foreign', v: '48%' }, { n: 'Insurance', v: '12%' }, { n: 'Banks', v: '8%' }, { n: 'Other', v: '4%' }] } },
];

const stimulusTracker = [
  { program: 'US IRA (Inflation Reduction Act)', size: '$891B', deployed: '$285B', pct: 32, sector: 'Clean Energy', expires: '2032', status: 'ACTIVE' },
  { program: 'US CHIPS Act', size: '$280B', deployed: '$52B', pct: 19, sector: 'Semiconductors', expires: '2027', status: 'ACTIVE' },
  { program: 'EU NextGenEU', size: '€807B', deployed: '€285B', pct: 35, sector: 'Green/Digital', expires: '2026', status: 'ACTIVE' },
  { program: 'Japan Green Transformation', size: '¥20T', deployed: '¥4.2T', pct: 21, sector: 'Decarbonization', expires: '2033', status: 'ACTIVE' },
  { program: 'China Common Prosperity', size: '¥5T+', deployed: '¥2.8T', pct: 56, sector: 'Social/Rural', expires: 'Ongoing', status: 'ACTIVE' },
  { program: 'India PLI Scheme', size: '₹2.0T', deployed: '₹580B', pct: 29, sector: 'Manufacturing', expires: '2028', status: 'ACTIVE' },
];

export default function FiscalPolicy() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) GLOBAL FISCAL MONITOR — FISC</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Country</th><th className="text-right p-1">Revenue</th><th className="text-right p-1">Spending</th><th className="text-right p-1">Deficit</th><th className="text-right p-1">Def/GDP</th><th className="text-right p-1">Total Debt</th><th className="text-right p-1">Debt/GDP</th><th className="text-right p-1">Int %Rev</th>
          </tr></thead>
          <tbody>{fiscalData.map(f => (
            <><tr key={f.country} onClick={() => setSelected(selected === f.country ? null : f.country)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === f.country ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{f.country}</td>
              <td className="text-right p-1">{f.revenue}</td><td className="text-right p-1">{f.spending}</td><td className="text-right p-1 text-red-400 font-bold">{f.deficit}</td>
              <td className="text-right p-1 text-red-400">{f.defGdp}</td><td className="text-right p-1">{f.debt}</td>
              <td className="text-right p-1 font-bold">{f.debtGdp}</td><td className="text-right p-1 text-yellow-400">{f.intPct}</td>
            </tr>
            {selected === f.country && (
              <tr key={f.country + '-d'}><td colSpan={8} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-3 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">REVENUE BREAKDOWN</div>
                    {[{ l: 'Income Tax', v: f.details.tax }, { l: 'Social Contrib', v: f.details.social }, { l: 'Corporate Tax', v: f.details.corp }, { l: 'Customs/Excise', v: f.details.customs }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">SPENDING BY CATEGORY</div>
                    {f.details.topSpend.map(s => (
                      <div key={s.n} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{s.n}</span><span className="font-bold">{s.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">DEBT HOLDERS</div>
                    {f.details.debtHolders.map(h => (
                      <div key={h.n} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{h.n}</span><span className="font-bold">{h.v}</span></div>
                    ))}</div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">2) GLOBAL STIMULUS & FISCAL PROGRAMS</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Program</th><th className="text-right p-1">Total Size</th><th className="text-right p-1">Deployed</th><th className="text-right p-1">% Used</th><th className="text-right p-1">Sector</th><th className="text-right p-1">Expires</th><th className="text-right p-1">Status</th>
          </tr></thead>
          <tbody>{stimulusTracker.map(s => (
            <tr key={s.program} className="border-b border-border/50 hover:bg-accent/5">
              <td className="p-1 font-bold">{s.program}</td><td className="text-right p-1">{s.size}</td><td className="text-right p-1">{s.deployed}</td>
              <td className="text-right p-1"><div className="inline-flex items-center gap-1"><div className="w-12 h-1.5 bg-border rounded overflow-hidden inline-block"><div className="h-full bg-accent" style={{ width: `${s.pct}%` }} /></div><span>{s.pct}%</span></div></td>
              <td className="text-right p-1 text-muted-foreground">{s.sector}</td><td className="text-right p-1 text-muted-foreground">{s.expires}</td>
              <td className="text-right p-1"><span className="px-1 bg-green-500/20 text-green-400">{s.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>FISC — Global Fiscal Policy Monitor</span><span>Source: IMF / CBO / National Treasuries</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
