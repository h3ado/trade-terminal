/**
 * Recent fire / hotspot points (sample, time-binned). Real implementation
 * would wire to MODIS/VIIRS FIRMS feed. Intensity 0..1 → marker size + color.
 */
export type FireBin = '24h' | '48h' | '7d' | '30d';

export type Fire = {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  bin: FireBin;
  region?: string;
};

export const FIRES: Fire[] = [
  // 24h bin
  { id: 'f-amazon-1', lat: -8.5, lng: -55.0, intensity: 0.9, bin: '24h', region: 'Amazon' },
  { id: 'f-amazon-2', lat: -10.2, lng: -52.8, intensity: 0.75, bin: '24h', region: 'Amazon' },
  { id: 'f-canada-1', lat: 56.0, lng: -113.0, intensity: 0.8, bin: '24h', region: 'BC/Alberta' },
  { id: 'f-canada-2', lat: 54.5, lng: -120.5, intensity: 0.65, bin: '24h', region: 'BC' },
  { id: 'f-california-1', lat: 38.5, lng: -120.5, intensity: 0.85, bin: '24h', region: 'California' },
  { id: 'f-australia-1', lat: -33.5, lng: 150.0, intensity: 0.7, bin: '24h', region: 'NSW' },
  { id: 'f-greece', lat: 38.4, lng: 23.6, intensity: 0.75, bin: '24h', region: 'Attica' },
  { id: 'f-portugal', lat: 40.0, lng: -8.0, intensity: 0.6, bin: '24h', region: 'Centro' },

  // 48h bin
  { id: 'f-amazon-3', lat: -7.5, lng: -60.0, intensity: 0.5, bin: '48h', region: 'Amazon' },
  { id: 'f-amazon-4', lat: -12.0, lng: -50.0, intensity: 0.45, bin: '48h', region: 'Amazon' },
  { id: 'f-siberia-1', lat: 62.0, lng: 130.0, intensity: 0.7, bin: '48h', region: 'Yakutia' },
  { id: 'f-siberia-2', lat: 60.0, lng: 110.0, intensity: 0.55, bin: '48h', region: 'Krasnoyarsk' },
  { id: 'f-spain', lat: 40.5, lng: -4.0, intensity: 0.5, bin: '48h', region: 'Castilla' },
  { id: 'f-turkey', lat: 36.8, lng: 30.6, intensity: 0.55, bin: '48h', region: 'Antalya' },
  { id: 'f-victoria', lat: -37.5, lng: 145.5, intensity: 0.6, bin: '48h', region: 'Victoria' },

  // 7d bin
  { id: 'f-cerrado', lat: -15.0, lng: -47.0, intensity: 0.4, bin: '7d', region: 'Cerrado' },
  { id: 'f-pantanal', lat: -17.5, lng: -57.0, intensity: 0.45, bin: '7d', region: 'Pantanal' },
  { id: 'f-borneo-1', lat: -2.0, lng: 113.0, intensity: 0.55, bin: '7d', region: 'Borneo' },
  { id: 'f-borneo-2', lat: -1.0, lng: 116.0, intensity: 0.5, bin: '7d', region: 'Borneo' },
  { id: 'f-sumatra', lat: -1.0, lng: 102.0, intensity: 0.5, bin: '7d', region: 'Sumatra' },
  { id: 'f-congo-1', lat: -4.0, lng: 23.0, intensity: 0.45, bin: '7d', region: 'Congo Basin' },
  { id: 'f-angola', lat: -12.0, lng: 18.0, intensity: 0.4, bin: '7d', region: 'Angola' },
  { id: 'f-zambia', lat: -14.0, lng: 28.0, intensity: 0.4, bin: '7d', region: 'Zambia' },
  { id: 'f-mexico', lat: 19.0, lng: -100.0, intensity: 0.4, bin: '7d', region: 'Michoacán' },

  // 30d bin
  { id: 'f-india-1', lat: 23.0, lng: 80.0, intensity: 0.3, bin: '30d', region: 'Madhya Pradesh' },
  { id: 'f-india-2', lat: 21.0, lng: 84.0, intensity: 0.3, bin: '30d', region: 'Odisha' },
  { id: 'f-myanmar', lat: 21.0, lng: 96.0, intensity: 0.35, bin: '30d', region: 'Myanmar' },
  { id: 'f-laos', lat: 19.5, lng: 103.0, intensity: 0.3, bin: '30d', region: 'Laos' },
  { id: 'f-namibia', lat: -19.0, lng: 18.0, intensity: 0.3, bin: '30d', region: 'Namibia' },
];

export const FIRE_BIN_AGE: Record<FireBin, number> = { '24h': 1, '48h': 2, '7d': 7, '30d': 30 };

export function fireColor(intensity: number): string {
  // Yellow → red ramp.
  return `hsl(${50 - intensity * 50}, 95%, ${60 - intensity * 15}%)`;
}
