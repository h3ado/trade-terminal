/**
 * Climate risk choropleths — coarse 10° grid synthetic risk indices for:
 * cyclone, storm-surge 50yr, excessive heat 20yr, water scarcity, reef stress.
 * Values 0..1 → semi-transparent fill.
 */
export type RiskMetric = 'cyclone' | 'surge' | 'heat' | 'water' | 'reef';

export type RiskCell = { lat: number; lng: number; v: number };

const STEP = 10;

function noise(lat: number, lng: number, salt: number): number {
  const x = Math.sin(lat * 9.7129 + lng * 41.713 + salt * 17.5) * 23758.5453;
  return Math.abs(x - Math.floor(x));
}

function build(metric: RiskMetric): RiskCell[] {
  const out: RiskCell[] = [];
  for (let lat = -75; lat <= 75; lat += STEP) {
    for (let lng = -180; lng < 180; lng += STEP) {
      let v = 0;
      if (metric === 'cyclone') {
        // Tropical cyclone basins: 5–25° lat both hemispheres.
        const trop = Math.exp(-((Math.abs(lat) - 15) ** 2) / 80);
        // Higher over warm SSTs (W. Pacific, N. Atlantic, Indian).
        const basinW = (lng > 100 && lng < 180) || (lng > 80 && lng < 100) ? 1.0
          : (lng > -100 && lng < -40) ? 0.8
          : (lng > 40 && lng < 80) ? 0.7 : 0.3;
        v = trop * basinW + noise(lat, lng, 1) * 0.15;
      } else if (metric === 'surge') {
        // Coastal proxy: high at low elevations near tropical & mid-lat coasts.
        const trop = Math.exp(-((Math.abs(lat) - 20) ** 2) / 140);
        v = trop * 0.7 + noise(lat, lng, 2) * 0.3;
      } else if (metric === 'heat') {
        // Hottest in subtropics + continental interiors.
        const sub = Math.exp(-((Math.abs(lat) - 28) ** 2) / 200);
        v = sub * 0.75 + noise(lat, lng, 3) * 0.25;
      } else if (metric === 'water') {
        // Subtropical drylands: 20–35° lat.
        const dry = Math.exp(-((Math.abs(lat) - 27) ** 2) / 90);
        v = dry * 0.85 + noise(lat, lng, 4) * 0.15;
      } else { // reef
        // Tropical reefs: 0–25° lat.
        const trop = Math.exp(-((Math.abs(lat) - 12) ** 2) / 60);
        v = trop * 0.7 + noise(lat, lng, 5) * 0.3;
      }
      out.push({ lat, lng, v: Math.max(0, Math.min(1, v)) });
    }
  }
  return out;
}

export const RISK_FIELDS: Record<RiskMetric, RiskCell[]> = {
  cyclone: build('cyclone'),
  surge: build('surge'),
  heat: build('heat'),
  water: build('water'),
  reef: build('reef'),
};

export function riskColor(metric: RiskMetric, v: number): string {
  switch (metric) {
    case 'cyclone': return `hsl(${280 - v * 240}, 75%, 55%)`;
    case 'surge': return `hsl(210, 85%, ${60 - v * 25}%)`;
    case 'heat': return `hsl(${50 - v * 50}, 95%, 55%)`;
    case 'water': return `hsl(${35 + v * 10}, ${50 + v * 40}%, ${55 - v * 20}%)`;
    case 'reef': return `hsl(${320 - v * 60}, 75%, 55%)`;
  }
}

export const RISK_LABEL: Record<RiskMetric, string> = {
  cyclone: 'Cyclone risk',
  surge: 'Storm surge 50yr',
  heat: 'Excessive heat 20yr',
  water: 'Water scarcity',
  reef: 'Reef stress',
};

export const RISK_STEP = STEP;
