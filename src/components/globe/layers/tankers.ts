import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';
import type { Vessel } from '@/hooks/useAISVessels';

/**
 * Renders live vessel positions as colored dots on the globe via three-globe's
 * `customLayerData`. Tankers = orange, cargo = cyan. Coexists with all other
 * layers since it owns its own custom-layer slot.
 */
export function useTankersLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  vessels: Vessel[],
  enabled: boolean,
  opacity: number,
) {
  const data = useMemo(() => (enabled ? vessels : []), [enabled, vessels]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    if (!enabled || data.length === 0) {
      // Don't call hexBinPointsData([]) — three-globe's hex layer crashes when
      // digesting an empty dataset on certain versions. Just bail out; the layer
      // will stay empty until enabled.
      return;
    }

    // Use hexBinPoints layer — it's an independent layer in three-globe and
    // gives us a nice density-aware visualization. Each hex represents a cluster
    // of vessels, colored by dominant category.
    (g as any)
      .hexBinPointsData(data)
      .hexBinPointLat((d: Vessel) => d.lat)
      .hexBinPointLng((d: Vessel) => d.lng)
      .hexBinPointWeight(1)
      .hexBinResolution(4)
      .hexAltitude(({ sumWeight }: { sumWeight: number }) =>
        Math.min(0.04, 0.005 + sumWeight * 0.003))
      .hexTopColor(({ points }: { points: Vessel[] }) => {
        const tankers = points.filter(p => p.category === 'tanker').length;
        const cargo = points.filter(p => p.category === 'cargo').length;
        // Tanker-dominant = orange, cargo-dominant = cyan, blended otherwise
        if (tankers > cargo) return `hsla(28, 95%, 60%, ${opacity})`;
        if (cargo > tankers) return `hsla(195, 90%, 60%, ${opacity})`;
        return `hsla(140, 70%, 60%, ${opacity})`;
      })
      .hexSideColor(() => `hsla(195, 90%, 30%, ${opacity * 0.6})`)
      .hexBinMerge(false)
      .hexLabel((d: { points: Vessel[]; sumWeight: number }) => {
        const tankers = d.points.filter(p => p.category === 'tanker').length;
        const cargo = d.points.filter(p => p.category === 'cargo').length;
        return `<div style="font-family: monospace; font-size: 10px; padding: 4px 6px; background: rgba(0,0,0,0.85); border: 1px solid hsl(195,90%,40%); color: white;">
          <div><b>${d.sumWeight}</b> vessels</div>
          <div style="color: hsl(28,95%,65%);">${tankers} tankers</div>
          <div style="color: hsl(195,90%,65%);">${cargo} cargo</div>
        </div>`;
      });
  }, [globeRef, data, enabled, opacity]);
}
