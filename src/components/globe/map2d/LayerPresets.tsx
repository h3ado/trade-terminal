/**
 * Quick-toggle preset chips that batch-flip a curated set of infra/extra
 * layers, plus user-saved custom presets that capture basemap + active
 * layers and can be re-applied or deleted.
 */
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Map2DFilters } from './filters';

type PresetKey = 'energy' | 'risk' | 'weather' | 'markets' | 'conflict' | 'infra';

type Preset = {
  key: PresetKey;
  label: string;
  /** Subset of infra layers this preset turns ON. */
  on: (keyof Map2DFilters['infra'])[];
};

const PRESETS: Preset[] = [
  { key: 'energy',   label: 'NRG',  on: ['refineries', 'oilfields', 'lng', 'pipelines'] },
  { key: 'infra',    label: 'INF',  on: ['ports', 'airports', 'hv', 'datacenters', 'subseaCables'] },
  { key: 'weather',  label: 'WX',   on: ['weather', 'fires', 'lightning', 'climateRisk'] },
  { key: 'risk',     label: 'RSK',  on: ['acledHeat', 'gdeltTone', 'sanctionsNet', 'travelAdv'] },
  { key: 'markets',  label: 'MKT',  on: ['equityPulse', 'fxHeat', 'sovYield', 'commodityFlows'] },
  { key: 'conflict', label: 'WAR',  on: ['acledHeat', 'naval', 'sanctions', 'straits'] },
];

export type SavedPreset = {
  id: string;
  name: string;
  basemap: Map2DFilters['basemap'];
  infraOn: (keyof Map2DFilters['infra'])[];
};

/** A preset is "active" when every layer it controls is currently ON. */
function isActive(p: Preset, infra: Map2DFilters['infra']) {
  return p.on.every(k => !!infra[k]);
}

/** A saved preset is "active" when its basemap matches and every saved layer is ON. */
function isSavedActive(p: SavedPreset, infra: Map2DFilters['infra'], basemap: Map2DFilters['basemap']) {
  if (p.basemap !== basemap) return false;
  return p.infraOn.every(k => !!infra[k]);
}

export function LayerPresets({
  infra,
  basemap,
  saved,
  onToggle,
  onApplySaved,
  onSave,
  onDelete,
}: {
  infra: Map2DFilters['infra'];
  basemap: Map2DFilters['basemap'];
  saved: SavedPreset[];
  /** Called with the next infra map (full object) for built-in chip toggles. */
  onToggle: (next: Map2DFilters['infra']) => void;
  /** Called with the saved preset's basemap + infra to apply it wholesale. */
  onApplySaved: (preset: SavedPreset) => void;
  /** Persist a snapshot of the current basemap + active layers under `name`. */
  onSave: (name: string) => void;
  /** Remove a saved preset by id. */
  onDelete: (id: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  const togglePreset = (p: Preset) => {
    const active = isActive(p, infra);
    const next = { ...infra };
    for (const k of p.on) (next as any)[k] = !active;
    onToggle(next);
  };

  const commitSave = () => {
    const name = draftName.trim().slice(0, 12);
    if (name.length > 0) onSave(name);
    setDraftName('');
    setNaming(false);
  };

  const activeLayerCount = (Object.keys(infra) as (keyof Map2DFilters['infra'])[])
    .filter(k => infra[k]).length;

  return (
    <div className="flex items-center gap-1" data-no-drag>
      {/* Built-in preset chips */}
      <div
        className="flex items-center bg-surface-deep/80 border border-border backdrop-blur"
        title="Layer presets — one-click themes"
      >
        {PRESETS.map((p, i) => {
          const active = isActive(p, infra);
          return (
            <button
              key={p.key}
              onClick={() => togglePreset(p)}
              className={`px-1.5 py-1 text-[8px] font-mono uppercase font-bold ${
                i < PRESETS.length - 1 ? 'border-r border-border' : ''
              } ${
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
              title={`${p.label}: ${p.on.join(', ')}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Saved custom presets */}
      {saved.length > 0 && (
        <div className="flex items-center bg-surface-deep/80 border border-accent/40 backdrop-blur">
          {saved.map((p, i) => {
            const active = isSavedActive(p, infra, basemap);
            return (
              <div
                key={p.id}
                className={`group flex items-stretch ${
                  i < saved.length - 1 ? 'border-r border-border' : ''
                }`}
              >
                <button
                  onClick={() => onApplySaved(p)}
                  className={`px-1.5 py-1 text-[8px] font-mono uppercase font-bold ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-accent hover:text-foreground hover:bg-accent/30'
                  }`}
                  title={`${p.name} · ${p.basemap.toUpperCase()} · ${p.infraOn.length} layers`}
                >
                  {p.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  className="px-0.5 text-muted-foreground hover:text-[hsl(0,85%,60%)] opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Delete preset "${p.name}"`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Save current view as preset */}
      {naming ? (
        <div className="flex items-center bg-surface-deep border border-accent">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitSave();
              if (e.key === 'Escape') { setNaming(false); setDraftName(''); }
            }}
            placeholder="NAME"
            maxLength={12}
            className="w-16 bg-transparent px-1.5 py-1 text-[9px] font-mono uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={commitSave}
            disabled={!draftName.trim()}
            className="px-1.5 py-1 text-[8px] font-mono uppercase font-bold bg-accent text-accent-foreground disabled:opacity-40"
          >
            OK
          </button>
        </div>
      ) : (
        <button
          onClick={() => setNaming(true)}
          disabled={activeLayerCount === 0}
          className="flex items-center gap-0.5 px-1.5 py-1 text-[8px] font-mono uppercase font-bold bg-surface-deep/80 border border-border backdrop-blur text-muted-foreground hover:text-foreground hover:bg-accent/30 disabled:opacity-40 disabled:hover:bg-surface-deep/80 disabled:hover:text-muted-foreground"
          title={
            activeLayerCount === 0
              ? 'Toggle some layers to save a preset'
              : `Save current view (${activeLayerCount} layers) as preset`
          }
        >
          <Plus className="w-2.5 h-2.5" />
          SAVE
        </button>
      )}
    </div>
  );
}
