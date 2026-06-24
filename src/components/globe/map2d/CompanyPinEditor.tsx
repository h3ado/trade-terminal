/**
 * Floating form for creating or editing a custom company pin.
 * Validated with zod; positioned at a screen point (sx, sy) in the map container.
 */
import { useState } from 'react';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Sector } from './companies';
import { SECTOR_LABEL } from './companies';

const SectorEnum = z.enum(['tech','finance','energy','health','consumer','industrial','comm','auto','retail']);

const Schema = z.object({
  name: z.string().trim().min(1, 'Name required').max(120),
  ticker: z.string().trim().max(20).optional().or(z.literal('')),
  sector: SectorEnum,
  market_cap: z.coerce.number().min(0).max(1_000_000).optional(),
  hq: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type CompanyEditorValues = {
  name: string;
  ticker?: string;
  sector: z.infer<typeof SectorEnum>;
  market_cap?: number;
  hq?: string;
  notes?: string;
};

export type CompanyEditorInitial = Partial<CompanyEditorValues> & { lat: number; lng: number };

type Props = {
  initial: CompanyEditorInitial;
  sx: number; sy: number;
  containerW: number; containerH: number;
  title: string;
  onCancel: () => void;
  onSubmit: (v: CompanyEditorValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onResetSeed?: () => Promise<void> | void;
};

export function CompanyPinEditor({ initial, sx, sy, containerW, containerH, title, onCancel, onSubmit, onDelete, onResetSeed }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [ticker, setTicker] = useState(initial.ticker ?? '');
  const [sector, setSector] = useState<Sector>((initial.sector as Sector) ?? 'tech');
  const [mcap, setMcap] = useState<string>(initial.market_cap != null ? String(initial.market_cap) : '');
  const [hq, setHq] = useState(initial.hq ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const PANEL_W = 260, PANEL_H = 340;
  const left = Math.min(Math.max(8, sx + 12), Math.max(8, containerW - PANEL_W - 8));
  const top = Math.min(Math.max(8, sy + 12), Math.max(8, containerH - PANEL_H - 8));

  const submit = async () => {
    setErr(null);
    const parsed = Schema.safeParse({
      name, ticker, sector,
      market_cap: mcap === '' ? undefined : mcap,
      hq, notes,
    });
    if (!parsed.success) {
      setErr(Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Invalid input');
      return;
    }
    setBusy(true);
    try { await onSubmit(parsed.data as CompanyEditorValues); } catch (e: any) { setErr(e?.message ?? 'Save failed'); }
    finally { setBusy(false); }
  };

  return (
    <div
      data-no-drag
      className="absolute z-50 bg-surface-deep/95 backdrop-blur border border-accent shadow-2xl text-foreground font-mono"
      style={{ left, top, width: PANEL_W }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-2 py-1.5 bg-surface-elevated border-b border-border">
        <span className="text-[9px] font-bold uppercase tracking-wider text-accent">{title}</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-accent">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="p-2 space-y-1.5 text-[10px]">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Ticker" value={ticker} onChange={setTicker} />
        <div>
          <label className="block text-[8px] uppercase text-muted-foreground mb-0.5">Sector</label>
          <select
            value={sector} onChange={(e) => setSector(e.target.value as Sector)}
            className="w-full bg-surface-elevated border border-border px-1.5 py-1 text-[10px] focus:outline-none focus:border-accent"
          >
            {(Object.keys(SECTOR_LABEL) as Sector[]).map(s => (
              <option key={s} value={s}>{SECTOR_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <Field label="Market cap (USD B)" value={mcap} onChange={setMcap} type="number" />
        <Field label="HQ country (ISO)" value={hq} onChange={setHq} />
        <Field label="Notes" value={notes} onChange={setNotes} />
        <div className="text-[8px] text-muted-foreground pt-0.5">
          {initial.lat.toFixed(3)}, {initial.lng.toFixed(3)}
        </div>
        {err && <div className="text-[9px] text-destructive">{err}</div>}
        <div className="flex gap-1 pt-1">
          <button
            onClick={submit} disabled={busy}
            className="flex-1 px-2 py-1 bg-accent text-accent-foreground text-[9px] uppercase font-bold hover:opacity-80 disabled:opacity-50"
          >{busy ? 'Saving…' : 'Save'}</button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-surface-elevated border border-border text-[9px] uppercase font-bold hover:border-accent"
          >Cancel</button>
        </div>
        {(onDelete || onResetSeed) && (
          <div className="flex gap-1 pt-1 border-t border-border mt-1.5">
            {onDelete && (
              <button onClick={onDelete} className="flex-1 px-2 py-1 bg-surface-elevated border border-destructive/50 text-destructive text-[9px] uppercase font-bold hover:border-destructive">
                Delete
              </button>
            )}
            {onResetSeed && (
              <button onClick={onResetSeed} className="flex-1 px-2 py-1 bg-surface-elevated border border-border text-[9px] uppercase font-bold hover:border-accent">
                Reset to default
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[8px] uppercase text-muted-foreground mb-0.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-elevated border border-border px-1.5 py-1 text-[10px] focus:outline-none focus:border-accent"
      />
    </div>
  );
}
