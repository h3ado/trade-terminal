// ECTR — Bilateral Trade Flows. Sub-tabs: EXPORTS, IMPORTS, BALANCE, PRODUCTS.
// Top-20 partners seeded from 2025FY national customs + ITC TradeMap.
import { useMemo, useState } from 'react';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, MiniBars } from './_shell/charts';

type Tab = 'EXPORTS' | 'IMPORTS' | 'BALANCE' | 'PRODUCTS';

interface Partner {
  cc: string; flag: string; name: string;
  valueUsdBn: number; share: number; yoy: number; trend: number[];
}

const FLOWS: Record<string, { exports: Partner[]; imports: Partner[]; totalEx: number; totalIm: number }> = {
  US: {
    totalEx: 2068, totalIm: 3300,
    exports: [
      { cc: 'CA', flag: '🇨🇦', name: 'Canada',        valueUsdBn: 354, share: 17.1, yoy: +2.4, trend: [98,99,100,102,101,103,104,103,105,106,105,107] },
      { cc: 'MX', flag: '🇲🇽', name: 'Mexico',        valueUsdBn: 322, share: 15.6, yoy: +4.1, trend: [97,99,100,101,103,104,105,106,107,106,108,109] },
      { cc: 'CN', flag: '🇨🇳', name: 'China',         valueUsdBn: 145, share:  7.0, yoy: -8.2, trend: [105,103,101,100,98,96,95,93,92,91,90,89] },
      { cc: 'JP', flag: '🇯🇵', name: 'Japan',         valueUsdBn:  82, share:  4.0, yoy: +1.1, trend: [99,100,100,101,101,102,101,102,103,102,103,103] },
      { cc: 'UK', flag: '🇬🇧', name: 'United Kingdom',valueUsdBn:  79, share:  3.8, yoy: +3.6, trend: [98,99,100,101,102,103,103,104,105,105,106,107] },
      { cc: 'DE', flag: '🇩🇪', name: 'Germany',       valueUsdBn:  77, share:  3.7, yoy: -1.3, trend: [101,100,100,99,99,98,98,99,98,99,99,98] },
      { cc: 'KR', flag: '🇰🇷', name: 'South Korea',   valueUsdBn:  66, share:  3.2, yoy: +5.2, trend: [96,98,99,100,101,102,103,104,105,106,107,108] },
      { cc: 'NL', flag: '🇳🇱', name: 'Netherlands',   valueUsdBn:  72, share:  3.5, yoy: +7.4, trend: [95,97,99,101,103,104,106,107,108,109,110,111] },
      { cc: 'IN', flag: '🇮🇳', name: 'India',         valueUsdBn:  48, share:  2.3, yoy: +6.8, trend: [96,98,99,101,103,104,105,106,107,108,109,110] },
      { cc: 'BR', flag: '🇧🇷', name: 'Brazil',        valueUsdBn:  43, share:  2.1, yoy: +0.4, trend: [99,100,99,100,101,100,101,100,101,100,101,100] },
      { cc: 'FR', flag: '🇫🇷', name: 'France',        valueUsdBn:  42, share:  2.0, yoy: -2.1, trend: [102,101,100,100,99,99,98,99,98,98,97,98] },
      { cc: 'TW', flag: '🇹🇼', name: 'Taiwan',        valueUsdBn:  41, share:  2.0, yoy: +8.9, trend: [94,96,98,100,102,104,106,107,109,110,112,113] },
      { cc: 'SG', flag: '🇸🇬', name: 'Singapore',     valueUsdBn:  38, share:  1.8, yoy: +4.7, trend: [96,98,99,100,102,103,104,105,106,107,108,109] },
      { cc: 'BE', flag: '🇧🇪', name: 'Belgium',       valueUsdBn:  36, share:  1.7, yoy: +2.2, trend: [98,99,99,100,101,101,102,103,103,104,104,105] },
      { cc: 'AU', flag: '🇦🇺', name: 'Australia',     valueUsdBn:  35, share:  1.7, yoy: +3.1, trend: [97,99,100,101,102,103,104,104,105,106,107,108] },
      { cc: 'CH', flag: '🇨🇭', name: 'Switzerland',   valueUsdBn:  30, share:  1.5, yoy: +1.5, trend: [99,100,100,101,101,102,102,103,103,104,104,105] },
      { cc: 'IT', flag: '🇮🇹', name: 'Italy',         valueUsdBn:  28, share:  1.4, yoy: -0.6, trend: [101,100,100,100,99,99,100,99,100,99,100,99] },
      { cc: 'ES', flag: '🇪🇸', name: 'Spain',         valueUsdBn:  22, share:  1.1, yoy: +1.9, trend: [98,99,100,100,101,102,102,103,103,104,104,105] },
      { cc: 'IE', flag: '🇮🇪', name: 'Ireland',       valueUsdBn:  21, share:  1.0, yoy: +9.5, trend: [93,95,97,99,101,103,105,107,109,110,112,113] },
      { cc: 'HK', flag: '🇭🇰', name: 'Hong Kong',     valueUsdBn:  20, share:  1.0, yoy: -4.0, trend: [104,103,102,101,100,99,98,97,96,96,95,94] },
    ],
    imports: [
      { cc: 'MX', flag: '🇲🇽', name: 'Mexico',        valueUsdBn: 510, share: 15.5, yoy: +6.3, trend: [95,97,99,101,103,104,106,107,108,109,110,112] },
      { cc: 'CN', flag: '🇨🇳', name: 'China',         valueUsdBn: 462, share: 14.0, yoy: -3.4, trend: [104,103,102,101,100,99,98,97,97,96,95,94] },
      { cc: 'CA', flag: '🇨🇦', name: 'Canada',        valueUsdBn: 421, share: 12.8, yoy: +2.1, trend: [98,99,100,100,101,102,102,103,103,104,104,105] },
      { cc: 'DE', flag: '🇩🇪', name: 'Germany',       valueUsdBn: 161, share:  4.9, yoy: +1.0, trend: [99,100,100,101,101,101,102,102,102,103,103,103] },
      { cc: 'JP', flag: '🇯🇵', name: 'Japan',         valueUsdBn: 152, share:  4.6, yoy: -1.8, trend: [102,101,101,100,100,99,99,98,98,97,97,96] },
      { cc: 'KR', flag: '🇰🇷', name: 'South Korea',   valueUsdBn: 132, share:  4.0, yoy: +9.7, trend: [92,94,96,98,100,102,104,106,108,110,112,114] },
      { cc: 'VN', flag: '🇻🇳', name: 'Vietnam',       valueUsdBn: 128, share:  3.9, yoy: +12.4, trend: [89,92,95,98,101,104,107,110,113,116,119,122] },
      { cc: 'TW', flag: '🇹🇼', name: 'Taiwan',        valueUsdBn: 116, share:  3.5, yoy: +14.8, trend: [87,90,93,96,99,102,106,109,113,116,120,124] },
      { cc: 'IN', flag: '🇮🇳', name: 'India',         valueUsdBn:  91, share:  2.8, yoy: +8.1, trend: [93,95,97,100,102,104,106,108,110,112,114,116] },
      { cc: 'IE', flag: '🇮🇪', name: 'Ireland',       valueUsdBn:  82, share:  2.5, yoy: +5.4, trend: [96,98,99,101,103,104,106,107,108,109,110,111] },
      { cc: 'IT', flag: '🇮🇹', name: 'Italy',         valueUsdBn:  74, share:  2.2, yoy: +2.8, trend: [97,98,99,100,101,102,103,103,104,105,106,107] },
      { cc: 'UK', flag: '🇬🇧', name: 'United Kingdom',valueUsdBn:  69, share:  2.1, yoy: +1.6, trend: [98,99,100,100,101,101,102,102,103,103,104,104] },
      { cc: 'FR', flag: '🇫🇷', name: 'France',        valueUsdBn:  61, share:  1.8, yoy: +0.4, trend: [99,100,100,100,100,101,100,101,101,101,101,101] },
      { cc: 'TH', flag: '🇹🇭', name: 'Thailand',      valueUsdBn:  57, share:  1.7, yoy: +4.0, trend: [96,98,99,100,101,102,103,104,105,106,107,108] },
      { cc: 'BR', flag: '🇧🇷', name: 'Brazil',        valueUsdBn:  41, share:  1.2, yoy: +3.2, trend: [97,98,99,100,101,102,103,104,104,105,106,107] },
      { cc: 'CH', flag: '🇨🇭', name: 'Switzerland',   valueUsdBn:  40, share:  1.2, yoy: -1.0, trend: [101,100,100,99,99,99,99,99,98,98,98,98] },
      { cc: 'MY', flag: '🇲🇾', name: 'Malaysia',      valueUsdBn:  38, share:  1.2, yoy: +6.8, trend: [95,97,99,101,103,104,105,106,107,108,109,110] },
      { cc: 'SG', flag: '🇸🇬', name: 'Singapore',     valueUsdBn:  35, share:  1.1, yoy: +5.1, trend: [96,98,99,101,102,103,104,105,106,107,108,109] },
      { cc: 'ID', flag: '🇮🇩', name: 'Indonesia',     valueUsdBn:  31, share:  0.9, yoy: +4.5, trend: [96,98,99,100,101,102,103,104,105,106,107,108] },
      { cc: 'PH', flag: '🇵🇭', name: 'Philippines',   valueUsdBn:  28, share:  0.8, yoy: +6.0, trend: [95,97,99,100,102,103,104,105,106,107,108,109] },
    ],
  },
};

// HS Section product mix (% of total exports/imports), seeded by HS section
const PRODUCTS: Record<string, { ex: Array<[string, number]>; im: Array<[string, number]> }> = {
  US: {
    ex: [['Mineral fuels & oil', 14.2], ['Machinery & electronics', 22.4], ['Aircraft & vehicles', 15.6], ['Chemicals & pharma', 12.8], ['Agriculture & food', 9.4], ['Precious metals', 4.1], ['Plastics & rubber', 4.0], ['Optical & medical', 3.8], ['Other', 13.7]],
    im: [['Machinery & electronics', 27.1], ['Vehicles & transport', 14.8], ['Chemicals & pharma', 13.2], ['Mineral fuels & oil', 9.6], ['Optical & medical', 4.8], ['Apparel & textiles', 5.4], ['Furniture & toys', 3.9], ['Base metals', 3.6], ['Other', 17.6]],
  },
};
const DEFAULT_PRODUCTS = { ex: [['Mixed', 100]] as Array<[string, number]>, im: [['Mixed', 100]] as Array<[string, number]> };

function syntheticFlows(_cc: string) {
  const partners: Partner[] = ['US','CN','DE','JP','UK','KR','FR','IN','NL','IT','MX','CA','BR','AU','ES','CH','SG','TW','VN','PL'].map((cc, i) => ({
    cc, flag: '🌐', name: cc,
    valueUsdBn: Math.round(180 / (i + 1)),
    share: +(20 - i * 0.9).toFixed(1),
    yoy: +(((i * 7) % 13) - 6).toFixed(1),
    trend: Array.from({ length: 12 }, (_, k) => 100 + Math.sin((i + k) / 2) * 4),
  }));
  return { exports: partners, imports: partners, totalEx: partners.reduce((s, p) => s + p.valueUsdBn, 0), totalIm: partners.reduce((s, p) => s + p.valueUsdBn, 0) };
}

function PartnerRow({ p, total, onClick }: { p: Partner; total: number; onClick: () => void }) {
  return (
    <tr className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={onClick}>
      <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{p.flag}</span><span className="font-bold">{p.cc}</span> <span className="text-muted-foreground">{p.name}</span></td>
      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold">${p.valueUsdBn.toLocaleString()}B</td>
      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground">{p.share.toFixed(1)}%</td>
      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${p.yoy > 0 ? 'text-positive' : p.yoy < 0 ? 'text-negative' : 'text-muted-foreground'}`}>{p.yoy > 0 ? '+' : ''}{p.yoy.toFixed(1)}%</td>
      <td className="px-2 py-0.5"><div className={p.trend[p.trend.length - 1] >= p.trend[0] ? 'text-positive' : 'text-negative'}><Sparkline data={p.trend} w={100} h={20} /></div></td>
    </tr>
  );
}

export default function ECTR() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = useMemo(() => FLOWS[selectedCountry] ?? syntheticFlows(selectedCountry), [selectedCountry]);
  const products = PRODUCTS[selectedCountry] ?? DEFAULT_PRODUCTS;
  const [tab, setTab] = useState<Tab>('EXPORTS');
  const [drill, setDrill] = useState<{ p: Partner; side: 'EX' | 'IM' } | null>(null);

  const balance = data.totalEx - data.totalIm;
  const ccyByPartner = useMemo(() => {
    const map = new Map<string, { ex: number; im: number; flag: string; name: string }>();
    data.exports.forEach(p => map.set(p.cc, { ex: p.valueUsdBn, im: 0, flag: p.flag, name: p.name }));
    data.imports.forEach(p => {
      const r = map.get(p.cc); if (r) r.im = p.valueUsdBn;
      else map.set(p.cc, { ex: 0, im: p.valueUsdBn, flag: p.flag, name: p.name });
    });
    return Array.from(map.entries()).map(([cc, v]) => ({ cc, ...v, bal: v.ex - v.im })).sort((a, b) => b.bal - a.bal);
  }, [data]);

  return (
    <CmdShell
      code="ECTR"
      title={`${countryInfo.flag}  ${countryInfo.name.toUpperCase()}  ·  Bilateral Trade Flows  ·  2025FY`}
      headerRight={<span className="text-[9px] font-mono text-muted-foreground uppercase">Switch country via CLI</span>}
      tabs={<CmdTabs tabs={[{ id: 'EXPORTS', label: 'Exports' }, { id: 'IMPORTS', label: 'Imports' }, { id: 'BALANCE', label: 'Balance' }, { id: 'PRODUCTS', label: 'Products' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1">
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Total Exports</div><div className="text-lg font-mono font-bold text-positive tabular-nums">${data.totalEx.toLocaleString()}B</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Total Imports</div><div className="text-lg font-mono font-bold text-foreground tabular-nums">${data.totalIm.toLocaleString()}B</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Trade Balance</div><div className={`text-lg font-mono font-bold tabular-nums ${balance >= 0 ? 'text-positive' : 'text-negative'}`}>{balance >= 0 ? '+' : ''}${balance.toLocaleString()}B</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Top Export Partner</div><div className="text-lg font-mono font-bold text-accent">{data.exports[0]?.cc}</div><div className="text-[9px] font-mono text-muted-foreground">{data.exports[0]?.share.toFixed(1)}% share</div></div>
        </div>
      }
      footerLeft={`ECTR <GO> · Values USD bn · YoY = 2025 vs 2024`}
      footerRight={selectedCountry in FLOWS ? 'Source: National customs + ITC TradeMap' : `Synthetic profile (no seed for ${selectedCountry})`}
    >
      <div className="h-full overflow-auto relative">

        {tab === 'EXPORTS' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10"><tr className="border-b border-border">
              {['Partner','USD','Share','YoY','12M Trend'].map((h, i) => (
                <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i === 0 || i === 4 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{data.exports.map(p => <PartnerRow key={p.cc} p={p} total={data.totalEx} onClick={() => setDrill({ p, side: 'EX' })} />)}</tbody>
          </table>
        )}

        {tab === 'IMPORTS' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10"><tr className="border-b border-border">
              {['Partner','USD','Share','YoY','12M Trend'].map((h, i) => (
                <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i === 0 || i === 4 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{data.imports.map(p => <PartnerRow key={p.cc} p={p} total={data.totalIm} onClick={() => setDrill({ p, side: 'IM' })} />)}</tbody>
          </table>
        )}

        {tab === 'BALANCE' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10"><tr className="border-b border-border">
              <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Partner</th>
              <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-positive">Exports</th>
              <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-accent">Imports</th>
              <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-foreground">Balance</th>
              <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Bar</th>
            </tr></thead>
            <tbody>
              {ccyByPartner.map(r => {
                const max = Math.max(...ccyByPartner.map(x => Math.abs(x.bal)));
                const pct = max ? (r.bal / max) * 100 : 0;
                return (
                  <tr key={r.cc} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{r.flag}</span><span className="font-bold">{r.cc}</span> <span className="text-muted-foreground">{r.name}</span></td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-positive">${r.ex.toLocaleString()}B</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-accent">${r.im.toLocaleString()}B</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${r.bal >= 0 ? 'text-positive' : 'text-negative'}`}>{r.bal >= 0 ? '+' : ''}${r.bal.toLocaleString()}B</td>
                    <td className="px-2 py-0.5">
                      <div className="relative h-3 w-[200px] bg-surface-deep">
                        <div className="absolute top-0 bottom-0 w-px left-1/2 bg-border" />
                        <div className={`absolute top-0 bottom-0 ${r.bal >= 0 ? 'bg-positive left-1/2' : 'bg-negative right-1/2'}`} style={{ width: `${Math.abs(pct / 2)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'PRODUCTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 p-1">
            {([['Exports', products.ex, 'text-positive'], ['Imports', products.im, 'text-accent']] as const).map(([title, list, tone]) => (
              <div key={title} className="border border-border bg-surface-deep">
                <div className="px-2 py-1 border-b border-border bg-background"><span className={`text-[9px] font-mono uppercase tracking-wider font-bold ${tone}`}>{title} by HS Section</span></div>
                <div className="p-2 space-y-1">
                  {list.map(([label, pct]) => (
                    <div key={label} className="text-[11px] font-mono">
                      <div className="flex justify-between"><span>{label}</span><span className="tabular-nums font-bold">{pct.toFixed(1)}%</span></div>
                      <div className="h-2 bg-background border border-border mt-0.5"><div className={`h-full ${tone.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `${drill.p.flag} ${selectedCountry} ↔ ${drill.p.cc}` : ''} subtitle={drill ? (drill.side === 'EX' ? 'Export destination' : 'Import origin') : ''}>
          {drill && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Value</div><div className="text-lg font-mono font-bold tabular-nums">${drill.p.valueUsdBn}B</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Share</div><div className="text-lg font-mono font-bold tabular-nums">{drill.p.share.toFixed(1)}%</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">YoY</div><div className={`text-lg font-mono font-bold tabular-nums ${drill.p.yoy >= 0 ? 'text-positive' : 'text-negative'}`}>{drill.p.yoy >= 0 ? '+' : ''}{drill.p.yoy.toFixed(1)}%</div></div>
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">12-Month Index (100 = 12mo prior)</div>
                <div className={drill.p.trend[drill.p.trend.length - 1] >= drill.p.trend[0] ? 'text-positive' : 'text-negative'}>
                  <Sparkline data={drill.p.trend} w={490} h={50} fill="currentColor" />
                </div>
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">M/M % Change</div>
                <MiniBars data={drill.p.trend.map((v, i, a) => i === 0 ? 0 : ((v - a[i - 1]) / a[i - 1]) * 100)} w={490} h={40} />
              </div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
