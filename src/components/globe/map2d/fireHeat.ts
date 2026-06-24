/**
 * Bin wildfire hotspots into a coarse lat/lng grid for low-zoom heatmap rendering.
 * Each cell sums fire radiative power (FRP) across hotspots inside it.
 */
export type FireCell = { lat: number; lng: number; frpSum: number; count: number; cellDeg: number };

type FireLike = { lat: number; lng: number; frp?: number; intensity: number };

export function binFires(fires: FireLike[], cellDeg: number): FireCell[] {
  const map = new Map<string, FireCell>();
  for (const f of fires) {
    const cy = Math.floor(f.lat / cellDeg) * cellDeg + cellDeg / 2;
    const cx = Math.floor(f.lng / cellDeg) * cellDeg + cellDeg / 2;
    const key = `${cy.toFixed(3)}|${cx.toFixed(3)}`;
    const frp = typeof f.frp === 'number' ? f.frp : f.intensity * 200;
    const cell = map.get(key);
    if (cell) { cell.frpSum += frp; cell.count += 1; }
    else map.set(key, { lat: cy, lng: cx, frpSum: frp, count: 1, cellDeg });
  }
  return Array.from(map.values());
}

/** Pick a cell size based on current map zoom band. */
export function fireCellDeg(zoom: number): number {
  if (zoom < 1.5) return 2.0;
  if (zoom < 2.5) return 1.0;
  return 0; // 0 = render individual points
}
