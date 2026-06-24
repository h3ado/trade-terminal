// WEI — World Equity Indices monitor (Bloomberg-style full-screen).
import { useIndices } from '@/hooks/useIndices';
import MonitorTable, { MonitorCol } from './MonitorTable';

type Row = ReturnType<typeof useIndices>['indices'][number];

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtPct = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);
const toneCls = (n: number | null) => (n == null ? 'text-muted-foreground' : n > 0 ? 'text-positive' : n < 0 ? 'text-negative' : 'text-foreground');

export default function WEIMonitor() {
  const { indices, loading, ts } = useIndices();

  const cols: MonitorCol<Row>[] = [
    { key: 'abbr', label: 'Index', render: r => <span className="font-bold text-accent">{r.abbr}</span> },
    { key: 'sym', label: 'Sym', render: r => <span className="text-muted-foreground">{r.symbol}</span> },
    { key: 'last', label: 'Last', align: 'right', render: r => <span className="font-bold">{fmt(r.close)}</span> },
    { key: 'chg', label: '%Chg', align: 'right', render: r => <span className={toneCls(r.change_pct)}>{fmtPct(r.change_pct)}</span> },
    {
      key: 'net', label: 'Net', align: 'right',
      render: r => {
        const net = r.close != null && r.prev_close != null ? r.close - r.prev_close : null;
        return <span className={toneCls(net)}>{net == null ? '—' : `${net >= 0 ? '+' : ''}${fmt(net)}`}</span>;
      },
    },
    { key: 'mcap', label: 'Mcap $T', align: 'right', render: r => <span className="text-muted-foreground">{r.mcap_usd_t ? r.mcap_usd_t.toFixed(2) : '—'}</span> },
    {
      key: 'movers', label: 'Top Movers', render: r => (
        <span className="text-[10px] text-muted-foreground truncate">
          {(r.movers ?? []).slice(0, 3).map((m, i) => (
            <span key={i} className="mr-2">
              {m.sym}{' '}
              <span className={toneCls(m.pct)}>{fmtPct(m.pct)}</span>
            </span>
          ))}
        </span>
      ),
    },
  ];

  return (
    <MonitorTable
      title="World Equity Indices"
      code="WEI"
      cols={cols}
      rows={indices}
      loading={loading}
      ts={ts}
      rowKey={r => r.abbr}
    />
  );
}
