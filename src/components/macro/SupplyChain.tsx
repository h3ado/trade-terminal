import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const supplyIndices = [
  { name: 'NY Fed GSCPI', value: '0.28', chg: '-0.15', color: 'text-green-400', signal: 'NORMAL', level: 35 },
  { name: 'Baltic Dry Index', value: '1,842', chg: '+124', color: 'text-green-400', signal: 'RISING', level: 55 },
  { name: 'Harpex Container', value: '1,125', chg: '-42', color: 'text-red-400', signal: 'FALLING', level: 42 },
  { name: 'Freightos FBX Global', value: '$1,982', chg: '+215', color: 'text-red-400', signal: 'ELEVATED', level: 62 },
  { name: 'Drewry WCI', value: '$2,415', chg: '+180', color: 'text-red-400', signal: 'RISING', level: 58 },
];

const commodityChains = [
  { commodity: 'Semiconductors', status: 'TIGHT', leadTime: '18-22 wks', inventory: 'LOW', choke: 'TSMC (Taiwan)', risk: 'HIGH', details: { waferUtil: '92%', capex2024: '$38B', topFabs: ['TSMC 52%', 'Samsung 17%', 'Intel 12%'], shortage: ['Auto MCU', 'Analog ICs', 'Power MOSFET'], inventory_days: '28 days', yoy_ship: '+8.2%' } },
  { commodity: 'Lithium / EV Batteries', status: 'SURPLUS', leadTime: '8-12 wks', inventory: 'HIGH', choke: 'Refining (CN)', risk: 'MED', details: { waferUtil: 'N/A', capex2024: '$22B', topFabs: ['CATL 37%', 'BYD 16%', 'LG 13%'], shortage: ['Solid-state R&D'], inventory_days: '45 days', yoy_ship: '+22.4%' } },
  { commodity: 'Crude Oil', status: 'BALANCED', leadTime: '2-4 wks', inventory: 'NORMAL', choke: 'Strait of Hormuz', risk: 'MED', details: { waferUtil: 'N/A', capex2024: '$185B', topFabs: ['Saudi 12.5%', 'US 12.1%', 'Russia 10.8%'], shortage: ['Spare capacity thin'], inventory_days: '62 days', yoy_ship: '-1.2%' } },
  { commodity: 'Natural Gas / LNG', status: 'TIGHT', leadTime: '6-8 wks', inventory: 'LOW', choke: 'LNG Terminal Cap', risk: 'HIGH', details: { waferUtil: 'N/A', capex2024: '$42B', topFabs: ['Qatar 22%', 'Australia 21%', 'US 20%'], shortage: ['Europe winter supply'], inventory_days: '38 days', yoy_ship: '+5.8%' } },
  { commodity: 'Rare Earths', status: 'CRITICAL', leadTime: '26-32 wks', inventory: 'VERY LOW', choke: 'China (90% refining)', risk: 'CRITICAL', details: { waferUtil: 'N/A', capex2024: '$4.2B', topFabs: ['China 70%', 'Myanmar 12%', 'Australia 6%'], shortage: ['Dysprosium', 'Neodymium', 'Terbium'], inventory_days: '15 days', yoy_ship: '-3.4%' } },
  { commodity: 'Copper', status: 'TIGHT', leadTime: '4-6 wks', inventory: 'LOW', choke: 'Chile/Peru Mining', risk: 'MED', details: { waferUtil: 'N/A', capex2024: '$28B', topFabs: ['Chile 27%', 'Peru 10%', 'DRC 10%'], shortage: ['Smelting capacity'], inventory_days: '22 days', yoy_ship: '+2.1%' } },
];

const portCongestion = [
  { port: 'Shanghai', country: '🇨🇳', vessels: 142, waitDays: '1.2', util: '88%', status: 'NORMAL' },
  { port: 'Singapore', country: '🇸🇬', vessels: 98, waitDays: '0.8', util: '82%', status: 'NORMAL' },
  { port: 'Rotterdam', country: '🇳🇱', vessels: 52, waitDays: '1.5', util: '78%', status: 'NORMAL' },
  { port: 'Los Angeles', country: '🇺🇸', vessels: 28, waitDays: '2.8', util: '92%', status: 'ELEVATED' },
  { port: 'Busan', country: '🇰🇷', vessels: 68, waitDays: '0.6', util: '75%', status: 'NORMAL' },
  { port: 'Jebel Ali', country: '🇦🇪', vessels: 45, waitDays: '3.2', util: '95%', status: 'CONGESTED' },
];

export default function SupplyChain() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) SUPPLY CHAIN PRESSURE INDICES — SPLC</div>
        <div className="grid grid-cols-5 gap-2">
          {supplyIndices.map(s => (
            <div key={s.name} className="border border-border p-2">
              <div className="text-[8px] text-muted-foreground">{s.name}</div>
              <div className="text-sm font-bold">{s.value}</div>
              <div className={`text-[9px] ${s.color}`}>{s.chg}</div>
              <div className="mt-1 h-1 bg-border rounded"><div className="h-1 bg-accent rounded" style={{ width: `${s.level}%` }} /></div>
              <div className={`text-[8px] mt-0.5 ${s.signal === 'NORMAL' ? 'text-green-400' : s.signal === 'RISING' || s.signal === 'ELEVATED' ? 'text-yellow-400' : 'text-red-400'}`}>{s.signal}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">2) CRITICAL SUPPLY CHAIN TRACKER</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Commodity/Chain</th><th className="text-right p-1">Status</th><th className="text-right p-1">Lead Time</th><th className="text-right p-1">Inventory</th><th className="text-right p-1">Chokepoint</th><th className="text-right p-1">Risk</th>
          </tr></thead>
          <tbody>{commodityChains.map(c => (
            <><tr key={c.commodity} onClick={() => setSelected(selected === c.commodity ? null : c.commodity)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === c.commodity ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{c.commodity}</td>
              <td className="text-right p-1"><span className={`px-1 ${c.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : c.status === 'TIGHT' ? 'bg-yellow-500/20 text-yellow-400' : c.status === 'SURPLUS' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{c.status}</span></td>
              <td className="text-right p-1">{c.leadTime}</td><td className="text-right p-1 text-muted-foreground">{c.inventory}</td>
              <td className="text-right p-1 text-muted-foreground">{c.choke}</td>
              <td className="text-right p-1"><span className={c.risk === 'CRITICAL' ? 'text-red-400' : c.risk === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}>{c.risk}</span></td>
            </tr>
            {selected === c.commodity && (
              <tr key={c.commodity + '-d'}><td colSpan={6} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-3 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">MARKET SHARE</div>
                    {c.details.topFabs.map(f => <div key={f} className="text-[9px] text-muted-foreground">{f}</div>)}
                  </div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">INVENTORY</div>
                    {[{ l: 'Days Supply', v: c.details.inventory_days }, { l: 'YoY Shipments', v: c.details.yoy_ship }, { l: '2024 CapEx', v: c.details.capex2024 }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">BOTTLENECKS</div>
                    {c.details.shortage.map(s => <div key={s} className="text-[9px] text-red-400">⚠ {s}</div>)}
                  </div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">3) GLOBAL PORT CONGESTION</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Port</th><th className="text-left p-1">Country</th><th className="text-right p-1">Vessels</th><th className="text-right p-1">Avg Wait</th><th className="text-right p-1">Util %</th><th className="text-right p-1">Status</th>
          </tr></thead>
          <tbody>{portCongestion.map(p => (
            <tr key={p.port} className="border-b border-border/50 hover:bg-accent/5">
              <td className="p-1 font-bold">{p.port}</td><td className="p-1">{p.country}</td><td className="text-right p-1">{p.vessels}</td><td className="text-right p-1">{p.waitDays}d</td>
              <td className="text-right p-1">{p.util}</td>
              <td className="text-right p-1"><span className={`px-1 ${p.status === 'CONGESTED' ? 'bg-red-500/20 text-red-400' : p.status === 'ELEVATED' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{p.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>SPLC — Supply Chain Pressure Monitor</span><span>Source: NY Fed / Freightos / Flexport</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
