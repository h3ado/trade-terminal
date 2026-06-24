// WB — World Bond Rates monitor. Uses FRED sovereign yields where available.
import { useFRED } from '@/hooks/useFRED';
import MonitorTable, { MonitorCol } from './MonitorTable';

interface Row {
  country: string;
  flag: string;
  y2: number | null;
  y5: number | null;
  y10: number | null;
  y30: number | null;
  chg10: number | null;
}

// Map FRED keys → tenor. The fred-indicators edge function may not return all of these;
// missing values render as '—' so the monitor is forward-compatible.
const SOURCES: Array<{ country: string; flag: string; keys: { y2?: string; y5?: string; y10?: string; y30?: string } }> = [
  { country: 'United States', flag: '🇺🇸', keys: { y2: 'us2y', y5: 'us5y', y10: 'us10y', y30: 'us30y' } },
  { country: 'United Kingdom', flag: '🇬🇧', keys: { y2: 'uk2y', y10: 'uk10y', y30: 'uk30y' } },
  { country: 'Germany', flag: '🇩🇪', keys: { y2: 'de2y', y10: 'de10y', y30: 'de30y' } },
  { country: 'France', flag: '🇫🇷', keys: { y10: 'fr10y' } },
  { country: 'Italy', flag: '🇮🇹', keys: { y10: 'it10y' } },
  { country: 'Spain', flag: '🇪🇸', keys: { y10: 'es10y' } },
  { country: 'Japan', flag: '🇯🇵', keys: { y2: 'jp2y', y10: 'jp10y', y30: 'jp30y' } },
  { country: 'Canada', flag: '🇨🇦', keys: { y2: 'ca2y', y10: 'ca10y' } },
  { country: 'Australia', flag: '🇦🇺', keys: { y2: 'au2y', y10: 'au10y' } },
  { country: 'Switzerland', flag: '🇨🇭', keys: { y10: 'ch10y' } },
  { country: 'China', flag: '🇨🇳', keys: { y10: 'cn10y' } },
  { country: 'India', flag: '🇮🇳', keys: { y10: 'in10y' } },
  { country: 'Brazil', flag: '🇧🇷', keys: { y10: 'br10y' } },
  { country: 'Mexico', flag: '🇲🇽', keys: { y10: 'mx10y' } },
];

const fmtPct = (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}%`);
const fmtBp = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(0)}bp`);
const toneCls = (n: number | null) => (n == null ? 'text-muted-foreground' : n > 0 ? 'text-negative' : n < 0 ? 'text-positive' : 'text-foreground');

export default function WBMonitor() {
  const { byKey, loading, ts } = useFRED();

  const rows: Row[] = SOURCES.map(s => {
    const get = (k?: string) => (k && byKey[k]?.value != null ? byKey[k].value : null);
    const y10v = get(s.keys.y10);
    const y10prev = s.keys.y10 ? byKey[s.keys.y10]?.prev ?? null : null;
    return {
      country: s.country,
      flag: s.flag,
      y2: get(s.keys.y2),
      y5: get(s.keys.y5),
      y10: y10v,
      y30: get(s.keys.y30),
      chg10: y10v != null && y10prev != null ? (y10v - y10prev) * 100 : null,
    };
  });

  const cols: MonitorCol<Row>[] = [
    { key: 'country', label: 'Country', render: r => (
      <span className="font-bold text-foreground">{r.flag} {r.country}</span>
    ) },
    { key: 'y2', label: '2Y', align: 'right', render: r => <span>{fmtPct(r.y2)}</span> },
    { key: 'y5', label: '5Y', align: 'right', render: r => <span>{fmtPct(r.y5)}</span> },
    { key: 'y10', label: '10Y', align: 'right', render: r => <span className="font-bold">{fmtPct(r.y10)}</span> },
    { key: 'y30', label: '30Y', align: 'right', render: r => <span>{fmtPct(r.y30)}</span> },
    {
      key: 'spread', label: '2s10s', align: 'right',
      render: r => {
        const sp = r.y2 != null && r.y10 != null ? (r.y10 - r.y2) * 100 : null;
        const inv = sp != null && sp < 0;
        return <span className={inv ? 'text-negative font-bold' : 'text-muted-foreground'}>{sp == null ? '—' : `${sp >= 0 ? '+' : ''}${sp.toFixed(0)}bp${inv ? ' ⚠' : ''}`}</span>;
      },
    },
    { key: 'chg10', label: '10Y Δ', align: 'right', render: r => <span className={toneCls(r.chg10)}>{fmtBp(r.chg10)}</span> },
  ];

  return (
    <MonitorTable
      title="World Sovereign Yields"
      code="WB"
      cols={cols}
      rows={rows}
      loading={loading}
      ts={ts}
      rowKey={r => r.country}
    />
  );
}
