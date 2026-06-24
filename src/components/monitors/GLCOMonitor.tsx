// GLCO — Global Commodities monitor. Uses EIA energy + Twelve Data quotes.
import { useEIA } from '@/hooks/useEIA';
import { useLiveQuotes } from '@/hooks/useLiveQuotes';
import MonitorTable, { MonitorCol } from './MonitorTable';

interface Row {
  section: 'Energy' | 'Metals' | 'Ags' | 'Softs';
  name: string;
  contract: string;
  last: number | null;
  chgPct: number | null;
  net: number | null;
  unit: string;
}

const GROUPS: Array<{ section: Row['section']; name: string; contract: string; symbol: string; unit: string }> = [
  { section: 'Energy', name: 'WTI Crude', contract: 'CL1', symbol: 'CL=F', unit: '$/bbl' },
  { section: 'Energy', name: 'Brent', contract: 'CO1', symbol: 'BZ=F', unit: '$/bbl' },
  { section: 'Energy', name: 'Nat Gas', contract: 'NG1', symbol: 'NG=F', unit: '$/MMBtu' },
  { section: 'Energy', name: 'Gasoline', contract: 'XB1', symbol: 'RB=F', unit: '$/gal' },
  { section: 'Energy', name: 'Heating Oil', contract: 'HO1', symbol: 'HO=F', unit: '$/gal' },
  { section: 'Metals', name: 'Gold', contract: 'GC1', symbol: 'GC=F', unit: '$/oz' },
  { section: 'Metals', name: 'Silver', contract: 'SI1', symbol: 'SI=F', unit: '$/oz' },
  { section: 'Metals', name: 'Copper', contract: 'HG1', symbol: 'HG=F', unit: '$/lb' },
  { section: 'Metals', name: 'Platinum', contract: 'PL1', symbol: 'PL=F', unit: '$/oz' },
  { section: 'Metals', name: 'Palladium', contract: 'PA1', symbol: 'PA=F', unit: '$/oz' },
  { section: 'Ags', name: 'Corn', contract: 'C 1', symbol: 'ZC=F', unit: '¢/bu' },
  { section: 'Ags', name: 'Wheat', contract: 'W 1', symbol: 'ZW=F', unit: '¢/bu' },
  { section: 'Ags', name: 'Soybeans', contract: 'S 1', symbol: 'ZS=F', unit: '¢/bu' },
  { section: 'Softs', name: 'Sugar', contract: 'SB1', symbol: 'SB=F', unit: '¢/lb' },
  { section: 'Softs', name: 'Coffee', contract: 'KC1', symbol: 'KC=F', unit: '¢/lb' },
  { section: 'Softs', name: 'Cotton', contract: 'CT1', symbol: 'CT=F', unit: '¢/lb' },
  { section: 'Softs', name: 'Cocoa', contract: 'CC1', symbol: 'CC=F', unit: '$/MT' },
];

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtPct = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);
const toneCls = (n: number | null) => (n == null ? 'text-muted-foreground' : n > 0 ? 'text-positive' : n < 0 ? 'text-negative' : 'text-foreground');

export default function GLCOMonitor() {
  const symbols = GROUPS.map(g => g.symbol);
  const { quotes, live } = useLiveQuotes(symbols);
  const { byKey: eia, ts } = useEIA();

  const rows: Row[] = GROUPS.map(g => {
    const q = quotes?.[g.symbol];
    let last = q?.price ?? null;
    const chgPct = q?.pct ?? null;
    if (last == null && g.symbol === 'CL=F') last = eia['wti']?.value ?? null;
    if (last == null && g.symbol === 'BZ=F') last = eia['brent']?.value ?? null;
    if (last == null && g.symbol === 'NG=F') last = eia['henryhub']?.value ?? null;
    const net = q?.change ?? null;
    return { section: g.section, name: g.name, contract: g.contract, last, chgPct, net, unit: g.unit };
  });

  // Sort within section order
  const ordered: Row[] = [];
  (['Energy', 'Metals', 'Ags', 'Softs'] as const).forEach(sec => {
    rows.filter(r => r.section === sec).forEach(r => ordered.push(r));
  });

  // Compute section header positions
  const sectionHeaders: Array<{ afterIndex: number; label: string }> = [];
  let last = '';
  ordered.forEach((r, i) => {
    if (r.section !== last) {
      sectionHeaders.push({ afterIndex: i - 1, label: r.section.toUpperCase() });
      last = r.section;
    }
  });

  const cols: MonitorCol<Row>[] = [
    { key: 'name', label: 'Commodity', render: r => <span className="font-bold">{r.name}</span> },
    { key: 'contract', label: 'Cont.', render: r => <span className="text-muted-foreground">{r.contract}</span> },
    { key: 'last', label: 'Last', align: 'right', render: r => <span className="font-bold">{fmt(r.last)}</span> },
    { key: 'net', label: 'Net', align: 'right', render: r => <span className={toneCls(r.net)}>{r.net == null ? '—' : `${r.net >= 0 ? '+' : ''}${fmt(r.net)}`}</span> },
    { key: 'chg', label: '%Chg', align: 'right', render: r => <span className={toneCls(r.chgPct)}>{fmtPct(r.chgPct)}</span> },
    { key: 'unit', label: 'Unit', align: 'right', render: r => <span className="text-muted-foreground">{r.unit}</span> },
  ];

  return (
    <MonitorTable
      title="Global Commodities"
      code="GLCO"
      cols={cols}
      rows={ordered}
      loading={!live}
      ts={ts}
      sectionHeaders={sectionHeaders}
      rowKey={r => `${r.section}-${r.contract}`}
    />
  );
}
