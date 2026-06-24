/**
 * Coarse 5°×5° lat/lng weather grid — sample temperature, cloud cover,
 * rainfall, soil moisture, wind speed. Rendered as semi-transparent rects.
 * Values are illustrative (deterministic seeded noise) — not live data.
 */
export type WeatherMetric = 'temp' | 'cloud' | 'rain' | 'soil' | 'wind';

export type WeatherCell = {
  lat: number; lng: number;
  /** Normalized 0..1 value for the metric. */
  v: number;
};

const STEP = 10;

/** Deterministic pseudo-noise based on lat/lng & metric so reloads are stable. */
function noise(lat: number, lng: number, salt: number): number {
  const x = Math.sin(lat * 12.9898 + lng * 78.233 + salt * 37.719) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}

/** Build a synthetic field with realistic latitudinal patterns. */
function buildField(metric: WeatherMetric): WeatherCell[] {
  const out: WeatherCell[] = [];
  for (let lat = -85; lat <= 85; lat += STEP) {
    for (let lng = -180; lng < 180; lng += STEP) {
      const lr = lat / 90;
      let base = 0;
      if (metric === 'temp') {
        // Cosine of latitude: warm equator, cold poles; +noise.
        base = Math.cos(lat * Math.PI / 180) * 0.85 + noise(lat, lng, 1) * 0.18;
      } else if (metric === 'rain') {
        // ITCZ (~0–10°N) and mid-latitude storm tracks (~50°).
        base = Math.exp(-((lat - 5) ** 2) / 200) * 0.7 +
               Math.exp(-((Math.abs(lat) - 50) ** 2) / 250) * 0.4 +
               noise(lat, lng, 2) * 0.25;
      } else if (metric === 'cloud') {
        base = 0.4 + Math.sin(lat * 0.05 + lng * 0.03) * 0.25 + noise(lat, lng, 3) * 0.3;
      } else if (metric === 'soil') {
        // Inverse of dryness: rainforest belt high.
        base = Math.exp(-((lat - 0) ** 2) / 350) * 0.65 + noise(lat, lng, 4) * 0.3;
      } else { // wind
        // Stronger at mid-latitudes (jet streams) and roaring 40s.
        base = Math.exp(-((Math.abs(lat) - 45) ** 2) / 400) * 0.7 + noise(lat, lng, 5) * 0.35;
      }
      out.push({ lat, lng, v: Math.max(0, Math.min(1, base)) });
    }
  }
  return out;
}

export const WEATHER_FIELDS: Record<WeatherMetric, WeatherCell[]> = {
  temp: buildField('temp'),
  cloud: buildField('cloud'),
  rain: buildField('rain'),
  soil: buildField('soil'),
  wind: buildField('wind'),
};

/** Per-metric color ramp returning HSL. */
export function weatherColor(metric: WeatherMetric, v: number): string {
  switch (metric) {
    case 'temp':
      // Cool blue → warm red.
      return `hsl(${240 - v * 240}, 80%, 55%)`;
    case 'rain':
      return `hsl(210, 80%, ${30 + v * 40}%)`;
    case 'cloud':
      return `hsl(0, 0%, ${30 + v * 60}%)`;
    case 'soil':
      return `hsl(${30 + v * 80}, 70%, ${30 + v * 25}%)`;
    case 'wind':
      return `hsl(${280 - v * 80}, 75%, ${40 + v * 20}%)`;
  }
}

export const WEATHER_LABEL: Record<WeatherMetric, string> = {
  temp: 'Temperature',
  cloud: 'Cloud Cover',
  rain: 'Rainfall',
  soil: 'Soil Moisture',
  wind: 'Wind Speed',
};

export const WEATHER_STEP = STEP;
