/**
 * Mini-map: a fixed thumbnail of the whole world with a viewport rectangle
 * showing the main map's current view. Click to recenter the main map.
 */
import { useMemo } from 'react';
import { mercator } from './filters';

const MM_W = 180;
const MM_H = 90;

type Props = {
  /** Main-map world dims (after zoom). */
  worldW: number;
  worldH: number;
  viewW: number;
  viewH: number;
  panX: number;
  panY: number;
  /** Current zoom (used for label only). */
  zoom: number;
  /** Optional country geojson to outline the world thumbnail. */
  countries?: any | null;
  /** Recenter callback — receives (lat, lng) of the click. */
  onRecenter: (lat: number, lng: number) => void;
};

export function MiniMap2D({
  worldW, worldH, viewW, viewH, panX, panY, zoom, countries, onRecenter,
}: Props) {
  // Visible window in main-map render coords.
  const winX0 = -panX, winY0 = -panY;
  const winX1 = winX0 + viewW, winY1 = winY0 + viewH;

  // Map main-map render coords → mini-map coords.
  const sx = MM_W / worldW;
  const sy = MM_H / worldH;
  const rx0 = Math.max(0, Math.min(MM_W, winX0 * sx));
  const ry0 = Math.max(0, Math.min(MM_H, winY0 * sy));
  const rx1 = Math.max(0, Math.min(MM_W, winX1 * sx));
  const ry1 = Math.max(0, Math.min(MM_H, winY1 * sy));

  const countryPaths = useMemo(() => {
    if (!countries) return null;
    const out: string[] = [];
    for (const feat of countries.features ?? []) {
      const geom = feat.geometry;
      if (!geom) continue;
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          let prevX: number | null = null;
          let d = '';
          for (let i = 0; i < ring.length; i++) {
            const [lng, lat] = ring[i];
            const { x, y } = mercator(lat, lng, MM_W, MM_H);
            if (prevX !== null && Math.abs(x - prevX) > MM_W / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
            else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
            prevX = x;
          }
          out.push(d);
        }
      }
    }
    return out;
  }, [countries]);

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // Inverse mercator on mini-map dims.
    const lng = (cx / MM_W) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * (cy / MM_H);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    onRecenter(lat, lng);
  };

  return (
    <div
      className="absolute bottom-2 left-2 z-30 bg-surface-deep/90 border border-border backdrop-blur p-1 cursor-crosshair"
      data-no-drag
    >
      <svg width={MM_W} height={MM_H} onClick={onClick} className="block">
        <rect x={0} y={0} width={MM_W} height={MM_H} fill="hsl(220, 30%, 5%)" />
        {countryPaths && (
          <g fill="none" stroke="hsl(195, 60%, 50%)" strokeWidth={0.4} opacity={0.6}>
            {countryPaths.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}
        <rect
          x={rx0} y={ry0} width={Math.max(2, rx1 - rx0)} height={Math.max(2, ry1 - ry0)}
          fill="hsl(33, 100%, 50%)" fillOpacity={0.18}
          stroke="hsl(33, 100%, 60%)" strokeWidth={1}
        />
      </svg>
      <div className="text-[7px] font-mono text-muted-foreground text-center mt-0.5">
        WORLD · {zoom.toFixed(1)}x
      </div>
    </div>
  );
}
