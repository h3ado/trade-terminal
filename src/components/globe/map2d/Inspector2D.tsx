/**
 * Right-docked Inspector panel that shows extended details for a clicked
 * 2D-map feature. Discriminated union over feature kinds keeps render code
 * specific to each type.
 */
import { X, Crosshair } from 'lucide-react';
import type { PointFeature, LineFeature } from './infra';
import type { GlobeMarket } from '../AdvancedGlobe';
import type { IndexQuote } from '@/hooks/useIndices';
import type { Storm } from '@/hooks/useStorms';
import type { EconPin } from '../layers/econPins';

export type PinnedFeature =
  | { kind: 'market'; data: GlobeMarket; quote?: IndexQuote }
  | { kind: 'point'; category: string; data: PointFeature }
  | { kind: 'line'; category: string; data: LineFeature }
  | { kind: 'storm'; data: Storm }
  | { kind: 'econ'; data: EconPin };

type Props = {
  pinned: PinnedFeature | null;
  onClose: () => void;
  onCenter: (lat: number, lng: number) => void;
};

export function Inspector2D({ pinned, onClose, onCenter }: Props) {
  if (!pinned) return null;

  let title = '';
  let subtitle = '';
  let lat = 0, lng = 0;
  const rows: { k: string; v: string }[] = [];

  if (pinned.kind === 'market') {
    const m = pinned.data;
    title = `${m.abbr} · ${m.name}`;
    subtitle = `${m.index} · ${m.currency} · ${m.tz}`;
    lat = m.lat; lng = m.lng;
    if (pinned.quote) {
      rows.push({ k: 'Last', v: pinned.quote.close != null ? pinned.quote.close.toFixed(2) : '—' });
      rows.push({ k: '24h', v: pinned.quote.change_pct != null ? `${pinned.quote.change_pct >= 0 ? '+' : ''}${pinned.quote.change_pct.toFixed(2)}%` : '—' });
      rows.push({ k: 'Mcap', v: pinned.quote.mcap_usd_t != null ? `$${pinned.quote.mcap_usd_t.toFixed(2)}T` : '—' });
      const top = pinned.quote.movers?.[0];
      if (top) rows.push({ k: 'Top mover', v: `${top.sym} ${top.pct >= 0 ? '+' : ''}${top.pct.toFixed(2)}%` });
    }
    rows.push({ k: 'Status', v: m.status ?? '—' });
  } else if (pinned.kind === 'point') {
    const p = pinned.data;
    title = p.name;
    subtitle = `${pinned.category.toUpperCase()}${p.country ? ' · ' + p.country : ''}`;
    lat = p.lat; lng = p.lng;
    if (p.meta) rows.push({ k: 'Meta', v: p.meta });
    if (p.operator) rows.push({ k: 'Operator', v: p.operator });
    if (p.commodity) rows.push({ k: 'Commodity', v: p.commodity });
    if (p.status) rows.push({ k: 'Status', v: p.status });
    rows.push({ k: 'Lat/Lng', v: `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)}` });
  } else if (pinned.kind === 'line') {
    const l = pinned.data;
    title = l.name;
    subtitle = `${pinned.category.toUpperCase()} · ${l.category}`;
    if (l.path.length) { lng = l.path[0][0]; lat = l.path[0][1]; }
    if (l.capacity) rows.push({ k: 'Capacity', v: l.capacity });
    if (l.status) rows.push({ k: 'Status', v: l.status });
    rows.push({ k: 'Segments', v: String(l.path.length - 1) });
  } else if (pinned.kind === 'storm') {
    const s = pinned.data;
    title = s.name;
    subtitle = `${s.category >= 1 ? 'CAT ' + s.category : s.classification} · ${s.basin}`;
    lat = s.lat; lng = s.lng;
    rows.push({ k: 'Wind', v: `${s.windKt} kt` });
    rows.push({ k: 'Pressure', v: s.pressureMb ? `${s.pressureMb} mb` : '—' });
    rows.push({ k: 'Forecast pts', v: String(s.forecast?.length ?? 0) });
  } else if (pinned.kind === 'econ') {
    const e = pinned.data;
    title = e.event;
    subtitle = `${e.country} · ${e.impact}`;
    lat = e.lat; lng = e.lng;
    rows.push({ k: 'Impact', v: e.impact });
    if ((e as any).when) rows.push({ k: 'When', v: String((e as any).when) });
  }

  return (
    <div
      className="absolute top-2 right-2 z-40 w-72 max-h-[70vh] overflow-y-auto bg-surface-deep/95 backdrop-blur border border-accent/50 shadow-2xl font-mono text-foreground"
      data-no-drag
      style={{ marginTop: '2.25rem' }}
    >
      <div className="flex items-center justify-between px-2 py-1.5 bg-surface-elevated border-b border-border">
        <span className="text-[9px] font-bold uppercase tracking-wider">Inspector</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-accent">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="px-2 py-2 border-b border-border">
        <div className="text-[11px] font-bold leading-tight">{title}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{subtitle}</div>
      </div>
      <div className="px-2 py-2 border-b border-border">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between text-[9px] py-0.5">
            <span className="text-muted-foreground uppercase">{r.k}</span>
            <span className="font-bold text-right max-w-[60%] truncate" title={r.v}>{r.v}</span>
          </div>
        ))}
      </div>
      <div className="px-2 py-2 border-b border-border">
        <button
          onClick={() => onCenter(lat, lng)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-accent text-accent-foreground text-[9px] uppercase font-bold hover:opacity-80"
        >
          <Crosshair className="w-3 h-3" /> Center on Map
        </button>
      </div>
      <div className="px-2 py-2 text-[8px] text-muted-foreground">
        <div className="uppercase mb-1">Related news</div>
        <div className="text-foreground/70 leading-snug">
          Live news feed coming soon — wire up to your preferred provider.
        </div>
      </div>
    </div>
  );
}
