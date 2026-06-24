import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const tradeData = [
  { country: '🇺🇸 United States', exports: '2,085B', imports: '3,277B', balance: '-1,192B', balColor: 'text-red-400', topPartner: 'Canada', topExport: 'Petroleum', topImport: 'Electronics', details: { gdpPct: '11.0%', yoy: '+3.2%', fta: 14, sanctions: 12, partners: [{ name: 'Canada', vol: '714B', bal: '-78B' }, { name: 'Mexico', vol: '687B', bal: '-152B' }, { name: 'China', vol: '575B', bal: '-279B' }, { name: 'Japan', vol: '218B', bal: '-67B' }, { name: 'Germany', vol: '198B', bal: '-72B' }], goods: [{ name: 'Petroleum', val: '185B', dir: 'EXP' }, { name: 'Semiconductors', val: '62B', dir: 'EXP' }, { name: 'Pharma', val: '78B', dir: 'EXP' }, { name: 'Electronics', val: '412B', dir: 'IMP' }, { name: 'Vehicles', val: '198B', dir: 'IMP' }] } },
  { country: '🇨🇳 China', exports: '3,593B', imports: '2,716B', balance: '+877B', balColor: 'text-green-400', topPartner: 'United States', topExport: 'Electronics', topImport: 'Semiconductors', details: { gdpPct: '18.5%', yoy: '+5.1%', fta: 19, sanctions: 3, partners: [{ name: 'United States', vol: '575B', bal: '+279B' }, { name: 'Japan', vol: '318B', bal: '+42B' }, { name: 'South Korea', vol: '298B', bal: '-28B' }, { name: 'Germany', vol: '215B', bal: '+35B' }, { name: 'Australia', vol: '198B', bal: '-82B' }], goods: [{ name: 'Electronics', val: '812B', dir: 'EXP' }, { name: 'Machinery', val: '498B', dir: 'EXP' }, { name: 'Textiles', val: '285B', dir: 'EXP' }, { name: 'Semiconductors', val: '382B', dir: 'IMP' }, { name: 'Crude Oil', val: '298B', dir: 'IMP' }] } },
  { country: '🇩🇪 Germany', exports: '1,810B', imports: '1,573B', balance: '+237B', balColor: 'text-green-400', topPartner: 'France', topExport: 'Vehicles', topImport: 'Energy', details: { gdpPct: '47.2%', yoy: '+1.8%', fta: 52, sanctions: 8, partners: [{ name: 'France', vol: '198B', bal: '+42B' }, { name: 'Netherlands', vol: '185B', bal: '+28B' }, { name: 'United States', vol: '198B', bal: '+72B' }, { name: 'China', vol: '215B', bal: '-35B' }, { name: 'Poland', vol: '142B', bal: '+18B' }], goods: [{ name: 'Vehicles', val: '298B', dir: 'EXP' }, { name: 'Machinery', val: '215B', dir: 'EXP' }, { name: 'Chemicals', val: '142B', dir: 'EXP' }, { name: 'Energy', val: '98B', dir: 'IMP' }, { name: 'Electronics', val: '85B', dir: 'IMP' }] } },
  { country: '🇯🇵 Japan', exports: '756B', imports: '897B', balance: '-141B', balColor: 'text-red-400', topPartner: 'China', topExport: 'Vehicles', topImport: 'Energy', details: { gdpPct: '18.8%', yoy: '+2.4%', fta: 21, sanctions: 5, partners: [{ name: 'China', vol: '318B', bal: '-42B' }, { name: 'United States', vol: '218B', bal: '+67B' }, { name: 'South Korea', vol: '82B', bal: '+12B' }, { name: 'Taiwan', vol: '72B', bal: '-18B' }, { name: 'Australia', vol: '68B', bal: '-32B' }], goods: [{ name: 'Vehicles', val: '185B', dir: 'EXP' }, { name: 'Semiconductors', val: '52B', dir: 'EXP' }, { name: 'Machinery', val: '98B', dir: 'EXP' }, { name: 'Crude Oil', val: '125B', dir: 'IMP' }, { name: 'LNG', val: '72B', dir: 'IMP' }] } },
  { country: '🇬🇧 United Kingdom', exports: '468B', imports: '689B', balance: '-221B', balColor: 'text-red-400', topPartner: 'EU-27', topExport: 'Financial Svcs', topImport: 'Machinery', details: { gdpPct: '31.2%', yoy: '+0.8%', fta: 38, sanctions: 15, partners: [{ name: 'EU-27', vol: '482B', bal: '-92B' }, { name: 'United States', vol: '142B', bal: '+18B' }, { name: 'China', vol: '98B', bal: '-52B' }, { name: 'Switzerland', vol: '42B', bal: '+12B' }, { name: 'Japan', vol: '28B', bal: '-8B' }], goods: [{ name: 'Financial Svcs', val: '98B', dir: 'EXP' }, { name: 'Petroleum', val: '42B', dir: 'EXP' }, { name: 'Pharma', val: '38B', dir: 'EXP' }, { name: 'Machinery', val: '72B', dir: 'IMP' }, { name: 'Vehicles', val: '62B', dir: 'IMP' }] } },
  { country: '🇰🇷 South Korea', exports: '684B', imports: '632B', balance: '+52B', balColor: 'text-green-400', topPartner: 'China', topExport: 'Semiconductors', topImport: 'Crude Oil', details: { gdpPct: '43.8%', yoy: '+6.2%', fta: 22, sanctions: 2, partners: [{ name: 'China', vol: '298B', bal: '+28B' }, { name: 'United States', vol: '142B', bal: '+42B' }, { name: 'Vietnam', vol: '98B', bal: '+32B' }, { name: 'Japan', vol: '82B', bal: '-12B' }, { name: 'Taiwan', vol: '42B', bal: '-8B' }], goods: [{ name: 'Semiconductors', val: '198B', dir: 'EXP' }, { name: 'Vehicles', val: '72B', dir: 'EXP' }, { name: 'Ships', val: '42B', dir: 'EXP' }, { name: 'Crude Oil', val: '98B', dir: 'IMP' }, { name: 'Electronics', val: '52B', dir: 'IMP' }] } },
];

const containerData = [
  { route: 'Asia→US West Coast', cost: '$2,180', chg: '+12%', color: 'text-red-400', vol: '18.2M TEU', transit: '14d', congestion: 'LOW' },
  { route: 'Asia→Europe', cost: '$1,450', chg: '-5%', color: 'text-green-400', vol: '24.8M TEU', transit: '32d', congestion: 'MED' },
  { route: 'Asia→US East Coast', cost: '$3,820', chg: '+28%', color: 'text-red-400', vol: '8.4M TEU', transit: '35d', congestion: 'HIGH' },
  { route: 'Europe→US East Coast', cost: '$1,280', chg: '-2%', color: 'text-green-400', vol: '5.2M TEU', transit: '12d', congestion: 'LOW' },
  { route: 'Intra-Asia', cost: '$680', chg: '+4%', color: 'text-red-400', vol: '42.1M TEU', transit: '5d', congestion: 'LOW' },
];

const tariffAlerts = [
  { headline: 'US §301 Tariffs on China: 25% on $250B goods', status: 'ACTIVE', impact: 'HIGH', sectors: 'Tech, Industrial' },
  { headline: 'EU Carbon Border Adjustment (CBAM) Phase 2', status: 'PENDING', impact: 'MED', sectors: 'Steel, Cement, Aluminum' },
  { headline: 'US-UK Trade Deal: Zero tariff on 98% goods', status: 'SIGNED', impact: 'LOW', sectors: 'Agriculture, Pharma' },
  { headline: 'India Retaliatory Tariffs: 15-40% on US goods', status: 'ACTIVE', impact: 'MED', sectors: 'Agriculture, Tech' },
];

export default function TradeFlow() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) GLOBAL TRADE BALANCE MATRIX — TRFL</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Country</th><th className="text-right p-1">Exports</th><th className="text-right p-1">Imports</th><th className="text-right p-1">Balance</th><th className="text-right p-1">Top Partner</th><th className="text-right p-1">Top Export</th><th className="text-right p-1">Top Import</th>
          </tr></thead>
          <tbody>{tradeData.map(r => (
            <><tr key={r.country} onClick={() => setSelected(selected === r.country ? null : r.country)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === r.country ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{r.country}</td>
              <td className="text-right p-1">{r.exports}</td><td className="text-right p-1">{r.imports}</td><td className={`text-right p-1 font-bold ${r.balColor}`}>{r.balance}</td>
              <td className="text-right p-1 text-muted-foreground">{r.topPartner}</td><td className="text-right p-1 text-muted-foreground">{r.topExport}</td><td className="text-right p-1 text-muted-foreground">{r.topImport}</td>
            </tr>
            {selected === r.country && (
              <tr key={r.country + '-d'} className="border-b border-border/50"><td colSpan={7} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[9px] text-accent font-bold mb-1">TRADE METRICS</div>
                    <div className="space-y-0.5">
                      {[{ l: 'Trade/GDP', v: r.details.gdpPct }, { l: 'YoY Growth', v: r.details.yoy }, { l: 'Active FTAs', v: String(r.details.fta) }, { l: 'Sanctions', v: String(r.details.sanctions) }].map(i => (
                        <div key={i.l} className="flex justify-between"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-accent font-bold mb-1">TOP PARTNERS</div>
                    {r.details.partners.map(p => (
                      <div key={p.name} className="flex justify-between"><span className="text-muted-foreground">{p.name}</span><span>{p.vol}</span><span className={p.bal.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{p.bal}</span></div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[9px] text-accent font-bold mb-1">KEY GOODS</div>
                    {r.details.goods.map(g => (
                      <div key={g.name} className="flex justify-between"><span className="text-muted-foreground">{g.name}</span><span className={g.dir === 'EXP' ? 'text-green-400' : 'text-red-400'}>{g.dir}</span><span>{g.val}</span></div>
                    ))}
                  </div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border p-2 bg-card">
          <div className="text-accent font-bold mb-2">2) CONTAINER SHIPPING INDEX</div>
          <table className="w-full">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-1">Route</th><th className="text-right p-1">Cost/40ft</th><th className="text-right p-1">Chg</th><th className="text-right p-1">Volume</th><th className="text-right p-1">Transit</th><th className="text-right p-1">Congest</th>
            </tr></thead>
            <tbody>{containerData.map(r => (
              <tr key={r.route} className="border-b border-border/50 hover:bg-accent/5">
                <td className="p-1">{r.route}</td><td className="text-right p-1 font-bold">{r.cost}</td><td className={`text-right p-1 ${r.color}`}>{r.chg}</td>
                <td className="text-right p-1 text-muted-foreground">{r.vol}</td><td className="text-right p-1 text-muted-foreground">{r.transit}</td>
                <td className="text-right p-1"><span className={`px-1 ${r.congestion === 'HIGH' ? 'bg-red-500/20 text-red-400' : r.congestion === 'MED' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{r.congestion}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="border border-border p-2 bg-card">
          <div className="text-accent font-bold mb-2">3) TARIFF & TRADE POLICY ALERTS</div>
          <div className="space-y-1.5">
            {tariffAlerts.map((a, i) => (
              <div key={i} className="border border-border/50 p-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-foreground font-bold text-[9px]">{a.headline}</span>
                  <span className={`px-1 text-[8px] ${a.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' : a.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{a.status}</span>
                </div>
                <div className="flex gap-3 text-[8px] text-muted-foreground mt-0.5">
                  <span>Impact: <span className={a.impact === 'HIGH' ? 'text-red-400' : a.impact === 'MED' ? 'text-yellow-400' : 'text-green-400'}>{a.impact}</span></span>
                  <span>Sectors: {a.sectors}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>TRFL — Global Trade Flow Monitor</span><span>Source: WTO / UN Comtrade / Freightos</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
