/**
 * Recent earthquake points + simplified tectonic plate boundary lines.
 * Sample data; real impl would wire to USGS feeds.
 */
export type Quake = {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  depthKm: number;
  /** Hours ago. */
  age: number;
  region?: string;
};

export const QUAKES: Quake[] = [
  { id: 'q-japan-1', lat: 37.4, lng: 141.6, mag: 6.2, depthKm: 35, age: 6, region: 'Off Honshu' },
  { id: 'q-japan-2', lat: 35.7, lng: 140.1, mag: 4.8, depthKm: 60, age: 18, region: 'Chiba' },
  { id: 'q-chile-1', lat: -23.5, lng: -69.8, mag: 5.5, depthKm: 110, age: 12, region: 'Antofagasta' },
  { id: 'q-chile-2', lat: -33.5, lng: -71.6, mag: 4.6, depthKm: 30, age: 36, region: 'Valparaíso' },
  { id: 'q-peru', lat: -12.0, lng: -77.0, mag: 5.0, depthKm: 65, age: 22, region: 'Lima' },
  { id: 'q-mexico', lat: 18.5, lng: -103.5, mag: 5.8, depthKm: 25, age: 9, region: 'Michoacán' },
  { id: 'q-alaska', lat: 60.0, lng: -150.0, mag: 5.4, depthKm: 50, age: 4, region: 'Cook Inlet' },
  { id: 'q-iceland', lat: 63.9, lng: -22.5, mag: 4.5, depthKm: 8, age: 14, region: 'Reykjanes' },
  { id: 'q-italy', lat: 42.7, lng: 13.3, mag: 4.2, depthKm: 12, age: 26, region: 'Central Apennines' },
  { id: 'q-greece', lat: 38.0, lng: 22.0, mag: 4.7, depthKm: 18, age: 30, region: 'Gulf of Corinth' },
  { id: 'q-turkey', lat: 38.6, lng: 39.0, mag: 5.1, depthKm: 14, age: 50, region: 'East Anatolia' },
  { id: 'q-iran', lat: 35.7, lng: 51.4, mag: 4.4, depthKm: 22, age: 44, region: 'Tehran prov.' },
  { id: 'q-philippines', lat: 13.0, lng: 124.0, mag: 5.7, depthKm: 90, age: 7, region: 'Bicol' },
  { id: 'q-indonesia', lat: -2.0, lng: 99.0, mag: 5.9, depthKm: 35, age: 16, region: 'Sumatra' },
  { id: 'q-png', lat: -6.0, lng: 147.0, mag: 6.0, depthKm: 110, age: 28, region: 'PNG' },
  { id: 'q-vanuatu', lat: -16.0, lng: 168.0, mag: 5.6, depthKm: 80, age: 40, region: 'Vanuatu' },
  { id: 'q-newzealand', lat: -43.5, lng: 172.5, mag: 4.3, depthKm: 15, age: 60, region: 'Canterbury' },
  { id: 'q-california', lat: 35.6, lng: -117.6, mag: 4.4, depthKm: 6, age: 20, region: 'Ridgecrest' },
  { id: 'q-puertorico', lat: 17.9, lng: -66.8, mag: 4.6, depthKm: 12, age: 32, region: 'PR' },
  { id: 'q-haiti', lat: 18.5, lng: -73.0, mag: 5.2, depthKm: 10, age: 48, region: 'Haiti' },
];

export function quakeColor(mag: number): string {
  if (mag >= 6) return 'hsl(0, 90%, 55%)';
  if (mag >= 5) return 'hsl(20, 90%, 55%)';
  if (mag >= 4) return 'hsl(45, 95%, 55%)';
  return 'hsl(60, 80%, 60%)';
}

/** Simplified major tectonic plate boundary polylines. Sampled for speed. */
export const TECTONIC_PLATES: { id: string; name: string; path: [number, number][] }[] = [
  { id: 'pacific-ring-w', name: 'Pacific Ring (West)',
    path: [[140, 50], [142, 40], [144, 30], [148, 20], [152, 10], [148, 0], [140, -10], [148, -20], [156, -30], [170, -40]] },
  { id: 'pacific-ring-e', name: 'Pacific Ring (East)',
    path: [[-152, 60], [-150, 50], [-140, 40], [-130, 30], [-120, 25], [-110, 20], [-100, 15], [-90, 10], [-80, 0], [-72, -15], [-72, -30], [-72, -45]] },
  { id: 'mid-atlantic', name: 'Mid-Atlantic Ridge',
    path: [[-15, 70], [-22, 60], [-30, 45], [-32, 30], [-30, 15], [-20, 0], [-12, -15], [-13, -30], [-14, -45], [-15, -55]] },
  { id: 'mid-indian', name: 'Mid-Indian Ridge',
    path: [[55, 0], [60, -10], [65, -20], [70, -30], [75, -40], [80, -50]] },
  { id: 'eurasian-african', name: 'Eurasian-African Boundary',
    path: [[-10, 36], [0, 36], [10, 38], [20, 36], [28, 36], [38, 38], [44, 39], [50, 36]] },
  { id: 'andean', name: 'Andean Subduction',
    path: [[-77, 5], [-78, -5], [-78, -15], [-72, -25], [-70, -35], [-72, -45]] },
  { id: 'himalayan', name: 'Himalayan Collision',
    path: [[68, 32], [75, 32], [82, 30], [90, 28], [95, 27], [100, 26]] },
];
