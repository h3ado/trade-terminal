/**
 * Multi-basemap raster underlay. Supports any provider in `basemaps.ts`,
 * deep zoom (z up to 19), and independent toggleable overlays (Roads + Labels).
 *
 * - The tile zoom level is derived from the rendered world size (`worldW`)
 *   so a wider canvas pulls higher-detail tiles.
 * - Tiles outside the viewport are culled to keep the DOM small.
 * - We render base + up to two overlays (basemap-overlay e.g. dark labels,
 *   plus optional Roads, plus optional Labels overlays).
 */
import { useMemo } from 'react';
import { BASEMAPS, ROADS_OVERLAY, LABELS_OVERLAY, type BasemapId } from './basemaps';

type Props = {
  basemap: BasemapId;
  worldW: number;
  worldH: number;
  viewW: number;
  viewH: number;
  panX: number;
  panY: number;
  svgZoom: number;
  opacity?: number;
  showRoads?: boolean;
  showLabels?: boolean;
  /** Render N copies of the world horizontally for infinite east/west scroll. Default 1. */
  wrapCopies?: number;
};

function buildTiles(
  url: (z: number, x: number, y: number) => string,
  worldW: number, worldH: number, viewW: number, viewH: number,
  panX: number, panY: number,
  maxZoom: number,
) {
  // Tile zoom: each web-mercator tile is 256px at native zoom.
  const z = Math.max(0, Math.min(maxZoom, Math.round(Math.log2(worldW / 256))));
  const tilesPerSide = 2 ** z;
  const tileW = worldW / tilesPerSide;
  const tileH = worldH / tilesPerSide;

  const x0 = -panX, y0 = -panY;
  const x1 = x0 + viewW, y1 = y0 + viewH;
  const i0 = Math.max(0, Math.floor(x0 / tileW));
  const i1 = Math.min(tilesPerSide - 1, Math.floor(x1 / tileW));
  const j0 = Math.max(0, Math.floor(y0 / tileH));
  const j1 = Math.min(tilesPerSide - 1, Math.floor(y1 / tileH));

  const out: { key: string; src: string; left: number; top: number; width: number; height: number }[] = [];
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      // Round to integer pixels + 1px overlap to remove hairline seams.
      const left = Math.round(panX + i * tileW);
      const top = Math.round(panY + j * tileH);
      const right = Math.round(panX + (i + 1) * tileW);
      const bottom = Math.round(panY + (j + 1) * tileH);
      out.push({
        key: `${z}/${i}/${j}`, src: url(z, i, j),
        left, top, width: right - left + 1, height: bottom - top + 1,
      });
    }
  }
  return out;
}

export function TileUnderlay({
  basemap, worldW, worldH, viewW, viewH, panX, panY, svgZoom,
  opacity = 0.95, showRoads = false, showLabels = false, wrapCopies = 3,
}: Props) {
  const def = BASEMAPS[basemap] ?? BASEMAPS.satellite;

  // Build copies offset by ±worldW so dragging east/west feels infinite.
  const offsets = useMemo(() => {
    const half = Math.floor(wrapCopies / 2);
    const out: number[] = [];
    for (let i = -half; i <= half; i++) out.push(i * worldW);
    return out;
  }, [wrapCopies, worldW]);

  const baseTiles = useMemo(
    () => def?.url ? offsets.flatMap((dx) =>
      buildTiles(def.url!, worldW, worldH, viewW, viewH, panX + dx, panY, def.maxZoom)
        .map(t => ({ ...t, key: `c${dx}_${t.key}` }))
    ) : [],
    [def, offsets, worldW, worldH, viewW, viewH, panX, panY],
  );
  const basemapOverlayTiles = useMemo(
    () => def?.overlayUrl ? offsets.flatMap((dx) =>
      buildTiles(def.overlayUrl!, worldW, worldH, viewW, viewH, panX + dx, panY, def.maxZoom)
        .map(t => ({ ...t, key: `c${dx}_${t.key}` }))
    ) : [],
    [def, offsets, worldW, worldH, viewW, viewH, panX, panY],
  );
  const roadTiles = useMemo(
    () => showRoads ? offsets.flatMap((dx) =>
      buildTiles(ROADS_OVERLAY, worldW, worldH, viewW, viewH, panX + dx, panY, 23)
        .map(t => ({ ...t, key: `c${dx}_${t.key}` }))
    ) : [],
    [showRoads, offsets, worldW, worldH, viewW, viewH, panX, panY],
  );
  const labelTiles = useMemo(
    () => showLabels ? offsets.flatMap((dx) =>
      buildTiles(LABELS_OVERLAY, worldW, worldH, viewW, viewH, panX + dx, panY, 23)
        .map(t => ({ ...t, key: `c${dx}_${t.key}` }))
    ) : [],
    [showLabels, offsets, worldW, worldH, viewW, viewH, panX, panY],
  );

  if (!def?.url) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {baseTiles.map((tile) => (
        <img key={tile.key} src={tile.src} alt="" loading="lazy" decoding="async" draggable={false}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: tile.width, height: tile.height }} />
      ))}
      {basemapOverlayTiles.map((tile) => (
        <img key={'lbl-' + tile.key} src={tile.src} alt="" loading="lazy" decoding="async" draggable={false}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: tile.width, height: tile.height, mixBlendMode: 'screen' }} />
      ))}
      {roadTiles.map((tile) => (
        <img key={'road-' + tile.key} src={tile.src} alt="" loading="lazy" decoding="async" draggable={false}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: tile.width, height: tile.height, mixBlendMode: def.vectorTheme === 'dark' ? 'screen' : 'multiply', opacity: 0.85 }} />
      ))}
      {labelTiles.map((tile) => (
        <img key={'place-' + tile.key} src={tile.src} alt="" loading="lazy" decoding="async" draggable={false}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: tile.width, height: tile.height, mixBlendMode: def.vectorTheme === 'dark' ? 'screen' : 'multiply', opacity: 0.9 }} />
      ))}
      <div className="absolute bottom-1 right-1 text-[7px] font-mono text-white/70 bg-black/60 px-1 pointer-events-none">
        {def.attribution}
      </div>
    </div>
  );
}
