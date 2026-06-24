/**
 * Bloomberg-style bottom-left legend chip. Auto-derives a swatch list from the
 * currently active layers in `Map2DFilters`. Stays compact: shows up to ~6
 * entries, collapses with "+N more" if the user has many layers on.
 */
import { useMemo } from 'react';
import type { Map2DFilters } from './filters';
import { SECTOR_COLOR, SECTOR_LABEL } from './companies';
import { FACTORY_COLOR, FACTORY_KIND_LABEL } from './factories';
import { RETAIL_COLOR, RETAIL_KIND_LABEL } from './retail';
import { CROP_COLOR, CROP_LABEL } from './agriculture';

type Swatch = { color: string; label: string; shape?: 'square' | 'circle' | 'triangle' | 'line' };

type Props = { filters: Map2DFilters };

export function Legend2D({ filters }: Props) {
  const swatches = useMemo<Swatch[]>(() => {
    const out: Swatch[] = [];
    const i = filters.infra;
    if ((i as any).companies) {
      // Show top sectors
      (['tech', 'finance', 'energy', 'health', 'consumer'] as const).forEach(s =>
        out.push({ color: SECTOR_COLOR[s], label: SECTOR_LABEL[s], shape: 'circle' }),
      );
    }
    if (i.factories) {
      (['manufacturing', 'distribution', 'rnd', 'admin'] as const).forEach(k =>
        out.push({ color: FACTORY_COLOR[k], label: FACTORY_KIND_LABEL[k], shape: 'square' }),
      );
    }
    if (i.retail) {
      (['super', 'rest', 'gen', 'disc', 'app'] as const).forEach(k =>
        out.push({ color: RETAIL_COLOR[k], label: RETAIL_KIND_LABEL[k], shape: 'circle' }),
      );
    }
    if (i.agriculture) {
      (['corn', 'wheat', 'soy', 'canola'] as const).forEach(k =>
        out.push({ color: CROP_COLOR[k], label: CROP_LABEL[k], shape: 'triangle' }),
      );
    }
    if (i.refineries) out.push({ color: 'hsl(28, 95%, 55%)', label: 'Refineries', shape: 'circle' });
    if (i.oilfields)  out.push({ color: 'hsl(15, 80%, 50%)', label: 'Oil Fields', shape: 'circle' });
    if (i.lng)        out.push({ color: 'hsl(48, 95%, 60%)', label: 'LNG Terminals', shape: 'circle' });
    if (i.nuclear)    out.push({ color: 'hsl(280, 75%, 65%)', label: 'Nuclear', shape: 'circle' });
    if (i.pipelines)  out.push({ color: 'hsl(40, 90%, 60%)', label: 'Pipelines', shape: 'line' });
    if (i.hv)         out.push({ color: 'hsl(280, 75%, 65%)', label: 'HV Grid', shape: 'line' });
    if ((i as any).subseaCables) out.push({ color: 'hsl(195, 90%, 60%)', label: 'Subsea Cables', shape: 'line' });
    if (i.fiber)      out.push({ color: 'hsl(195, 90%, 60%)', label: 'Fiber', shape: 'line' });
    if (i.ports)      out.push({ color: 'hsl(195, 90%, 60%)', label: 'Ports', shape: 'square' });
    if (i.airports)   out.push({ color: 'hsl(165, 80%, 55%)', label: 'Airports', shape: 'triangle' });
    if (i.straits)    out.push({ color: 'hsl(45, 95%, 60%)', label: 'Chokepoints', shape: 'square' });
    if (i.fires)      out.push({ color: 'hsl(15, 95%, 55%)', label: 'Fire Hotspots', shape: 'circle' });
    if (i.quakes)     out.push({ color: 'hsl(0, 90%, 55%)', label: 'Earthquakes', shape: 'circle' });
    if (i.weather) {
      const m = filters.weatherMetric;
      const lbl = m === 'temp' ? 'Temperature' : m === 'rain' ? 'Precipitation' : m === 'wind' ? 'Wind' : m === 'cloud' ? 'Cloud' : 'Soil';
      out.push({ color: 'hsl(210, 80%, 60%)', label: lbl, shape: 'square' });
    }
    if (i.climateRisk) out.push({ color: 'hsl(280, 75%, 55%)', label: 'Climate Risk', shape: 'square' });
    if (i.sanctions)   out.push({ color: 'hsl(0, 90%, 55%)', label: 'Sanctions', shape: 'square' });
    if (i.tradeFlows)  out.push({ color: 'hsl(195, 90%, 60%)', label: 'Trade Flows', shape: 'line' });
    if ((i as any).equityPulse) out.push({ color: 'hsl(150, 80%, 55%)', label: 'Equity Pulse ±%', shape: 'circle' });
    if ((i as any).fxHeat)      out.push({ color: 'hsl(150, 80%, 55%)', label: 'FX vs USD', shape: 'square' });
    if ((i as any).sovYield)    out.push({ color: 'hsl(15, 85%, 55%)', label: '10Y Yield', shape: 'square' });
    if ((i as any).sovCDS)      out.push({ color: 'hsl(28, 90%, 55%)', label: '5Y CDS bps', shape: 'circle' });
    if ((i as any).commodityFlows) out.push({ color: 'hsl(48, 95%, 60%)', label: 'Commodity Flows', shape: 'line' });
    if ((i as any).macroChoro)  out.push({ color: 'hsl(195, 90%, 60%)', label: filters.macroMetric === 'rate' ? 'Policy Rate' : filters.macroMetric === 'cpi' ? 'CPI YoY' : 'Real 10Y', shape: 'square' });
    if ((i as any).shipLanes)   out.push({ color: 'hsl(195, 90%, 65%)', label: 'Shipping Lanes', shape: 'line' });
    if ((i as any).chokeStress) out.push({ color: 'hsl(15, 92%, 55%)', label: 'Chokepoint Stress', shape: 'circle' });
    if ((i as any).etfFlows)    out.push({ color: 'hsl(28, 95%, 60%)', label: 'ETF Flows 1W', shape: 'square' });
    if ((i as any).fxCarry)     out.push({ color: 'hsl(150, 80%, 55%)', label: 'FX Carry', shape: 'circle' });
    if ((i as any).cryptoHubs)  out.push({ color: 'hsl(195, 95%, 60%)', label: 'Crypto Hubs', shape: 'square' });
    if ((i as any).acledHeat)   out.push({ color: 'hsl(0, 90%, 55%)', label: 'Conflict Heat', shape: 'circle' });
    if ((i as any).gdeltTone)   out.push({ color: 'hsl(280, 75%, 60%)', label: 'News Tone', shape: 'circle' });
    if ((i as any).sanctionsNet)out.push({ color: 'hsl(28, 95%, 55%)', label: 'Sanctions Arc', shape: 'line' });
    if ((i as any).elections)   out.push({ color: 'hsl(48, 95%, 60%)', label: 'Elections', shape: 'triangle' });
    if ((i as any).travelAdv)   out.push({ color: 'hsl(0, 85%, 48%)', label: 'Travel Advisory', shape: 'square' });
    if ((i as any).terminator) out.push({ color: 'hsl(220, 60%, 25%)', label: 'Night Side', shape: 'square' });
    return out;
  }, [filters]);

  if (swatches.length === 0) return null;

  const max = 6;
  const visible = swatches.slice(0, max);
  const overflow = swatches.length - visible.length;

  return (
    <div
      // Sit above the bottom status bar (CRSR + scale) so the two chips
      // don't overlap. Status bar is ~24px tall + 8px gap.
      className="absolute bottom-10 left-2 z-30 bg-surface-deep/85 border border-border backdrop-blur px-2 py-1.5 font-mono text-[9px] text-foreground max-w-[260px]"
      data-no-drag
    >
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Legend</div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {visible.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Swatch shape={s.shape} color={s.color} />
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <div className="text-[8px] text-muted-foreground mt-1">+{overflow} more layer{overflow > 1 ? 's' : ''}</div>
      )}
    </div>
  );
}

function Swatch({ shape = 'square', color }: { shape?: Swatch['shape']; color: string }) {
  if (shape === 'line') {
    return <span className="inline-block" style={{ width: 10, height: 2, background: color }} />;
  }
  if (shape === 'circle') {
    return <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: color }} />;
  }
  if (shape === 'triangle') {
    return (
      <svg width="9" height="9" viewBox="0 0 10 10">
        <polygon points="5,0 10,9 0,9" fill={color} />
      </svg>
    );
  }
  return <span className="inline-block" style={{ width: 8, height: 8, background: color }} />;
}
