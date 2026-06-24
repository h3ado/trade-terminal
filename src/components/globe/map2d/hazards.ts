/**
 * Climate / hazard layers: simplified earthquake belts (rectangles approximating
 * the Pacific Ring of Fire and major Eurasian seismic belts) and recent
 * wildfire hotspot points (USGS-style sample, not live).
 */
import type { LngLat, PointFeature } from './infra';

export type HazardZone = {
  id: string;
  name: string;
  kind: 'seismic' | 'volcanic';
  // Simplified polygon (closed ring); paths use [lng, lat].
  ring: LngLat[];
  severity: 1 | 2 | 3;     // 1 low → 3 high
};

// Pacific Ring of Fire — rough-cut polygon strips for visual context.
export const EARTHQUAKE_ZONES: HazardZone[] = [
  {
    id: 'rof-west', name: 'Pacific Ring (West)', kind: 'seismic', severity: 3,
    ring: [
      [120, 60], [145, 55], [160, 45], [150, 30], [140, 20], [130, 5],
      [120, -10], [125, -25], [140, -35], [160, -40], [175, -50],
      [165, -50], [150, -40], [135, -30], [120, -15], [110, 0],
      [115, 15], [120, 30], [125, 45], [115, 55], [120, 60],
    ],
  },
  {
    id: 'rof-east', name: 'Pacific Ring (East)', kind: 'seismic', severity: 3,
    ring: [
      [-160, 60], [-130, 60], [-115, 50], [-110, 35], [-105, 20], [-95, 10],
      [-80, 0], [-75, -15], [-70, -30], [-72, -45], [-75, -55],
      [-85, -55], [-82, -45], [-80, -30], [-85, -15], [-95, 0],
      [-110, 10], [-120, 25], [-130, 40], [-150, 55], [-160, 60],
    ],
  },
  {
    id: 'med-belt', name: 'Mediterranean–Iran Belt', kind: 'seismic', severity: 2,
    ring: [
      [-10, 38], [10, 42], [25, 40], [40, 38], [55, 35], [70, 33],
      [80, 32], [90, 30], [95, 28], [85, 25], [70, 27], [55, 28],
      [40, 32], [25, 34], [10, 36], [-10, 35], [-10, 38],
    ],
  },
  {
    id: 'himalaya', name: 'Himalayan Belt', kind: 'seismic', severity: 3,
    ring: [
      [70, 38], [80, 36], [92, 33], [100, 30], [105, 27], [95, 24],
      [85, 26], [75, 30], [70, 34], [70, 38],
    ],
  },
];

// Sample wildfire hotspots (not live).
export const WILDFIRE_HOTSPOTS: PointFeature[] = [
  { id: 'fire-cal-1', name: 'N. California', kind: 'wildfire', lat: 39.50, lng: -121.50, size: 4, meta: 'Active' },
  { id: 'fire-cal-2', name: 'S. California', kind: 'wildfire', lat: 34.30, lng: -118.20, size: 3, meta: 'Active' },
  { id: 'fire-or', name: 'Oregon Cascades', kind: 'wildfire', lat: 44.10, lng: -122.50, size: 3, meta: 'Active' },
  { id: 'fire-bc', name: 'British Columbia', kind: 'wildfire', lat: 53.00, lng: -122.00, size: 4, meta: 'Active' },
  { id: 'fire-yt', name: 'Yukon', kind: 'wildfire', lat: 62.00, lng: -134.00, size: 3, meta: 'Active' },
  { id: 'fire-amazon', name: 'Amazon', kind: 'wildfire', lat: -8.00, lng: -62.00, size: 5, meta: 'Active · deforestation' },
  { id: 'fire-greece', name: 'Greece', kind: 'wildfire', lat: 38.00, lng: 23.50, size: 3, meta: 'Active' },
  { id: 'fire-portugal', name: 'Portugal', kind: 'wildfire', lat: 40.00, lng: -8.00, size: 3, meta: 'Active' },
  { id: 'fire-australia', name: 'NSW Australia', kind: 'wildfire', lat: -33.50, lng: 150.00, size: 4, meta: 'Active' },
  { id: 'fire-siberia', name: 'Sakha Siberia', kind: 'wildfire', lat: 64.00, lng: 130.00, size: 5, meta: 'Mega-fires' },
  { id: 'fire-indonesia', name: 'Sumatra peat', kind: 'wildfire', lat: 0.50, lng: 102.00, size: 3, meta: 'Peat fires' },
];

export const HAZARD_COLOR: Record<HazardZone['kind'], string> = {
  seismic: 'hsl(0, 85%, 55%)',
  volcanic: 'hsl(15, 95%, 55%)',
};
