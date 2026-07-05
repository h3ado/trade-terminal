import { useEffect, useState } from 'react';

export interface WeatherCity {
  key: string;
  name: string;
  country: string;
  tz: string;
  lat: number;
  lon: number;
  exchange?: string;
  commodity?: string;
}

export interface WeatherNow {
  temp_c: number;
  feels_c: number;
  dew_c: number;
  wind_kph: number;
  gust_kph: number;
  wind_deg: number;
  wind_dir: string;
  humidity: number;
  precip_mm: number;
  cloud: number;
  pressure_hpa: number;
  visibility_km: number;
  uv: number;
  code: number;
  is_day: number;
}

export interface HourlyPoint {
  time: string;      // ISO
  temp_c: number;
  feels_c: number;
  dew_c: number;
  humidity: number;
  precip_prob: number;
  precip_mm: number;
  wind_kph: number;
  gust_kph: number;
  cloud: number;
  visibility_km: number;
  pressure_hpa: number;
  code: number;
  uv: number;
}

export interface DayForecast {
  date: string;        // YYYY-MM-DD
  max_c: number;
  min_c: number;
  precip_mm: number;
  precip_prob: number;
  precip_hours: number;
  wind_max_kph: number;
  gust_max_kph: number;
  wind_dom_deg: number;
  uv_max: number;
  sunrise: string;     // ISO
  sunset: string;      // ISO
  code: number;
}

export interface AirQuality {
  us_aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  co: number | null;
  fetchedAt: number;
}

export interface CityWeather {
  city: WeatherCity;
  now: WeatherNow | null;
  hourly: HourlyPoint[];   // next 24h
  days: DayForecast[];     // 7-day
  fetchedAt: number;
  error?: string;
}

// ── city lists ──────────────────────────────────────────────────────────────

export const FINANCIAL_CENTERS: WeatherCity[] = [
  { key: 'NYC', name: 'New York',     country: 'US', lat: 40.71,  lon: -74.01,  tz: 'America/New_York',     exchange: 'NYSE / NASDAQ' },
  { key: 'LDN', name: 'London',       country: 'GB', lat: 51.51,  lon: -0.13,   tz: 'Europe/London',        exchange: 'LSE / ICE' },
  { key: 'TKO', name: 'Tokyo',        country: 'JP', lat: 35.68,  lon: 139.69,  tz: 'Asia/Tokyo',           exchange: 'TSE' },
  { key: 'HKG', name: 'Hong Kong',    country: 'HK', lat: 22.32,  lon: 114.17,  tz: 'Asia/Hong_Kong',       exchange: 'HKEX' },
  { key: 'CHI', name: 'Chicago',      country: 'US', lat: 41.88,  lon: -87.63,  tz: 'America/Chicago',      exchange: 'CME / CBOT' },
  { key: 'SGP', name: 'Singapore',    country: 'SG', lat: 1.35,   lon: 103.82,  tz: 'Asia/Singapore',       exchange: 'SGX' },
  { key: 'FRA', name: 'Frankfurt',    country: 'DE', lat: 50.11,  lon: 8.68,    tz: 'Europe/Berlin',        exchange: 'XETRA' },
  { key: 'SYD', name: 'Sydney',       country: 'AU', lat: -33.87, lon: 151.21,  tz: 'Australia/Sydney',     exchange: 'ASX' },
  { key: 'DXB', name: 'Dubai',        country: 'AE', lat: 25.20,  lon: 55.27,   tz: 'Asia/Dubai',           exchange: 'DGCX' },
  { key: 'ZRH', name: 'Zurich',       country: 'CH', lat: 47.38,  lon: 8.54,    tz: 'Europe/Zurich',        exchange: 'SIX' },
  { key: 'PAR', name: 'Paris',        country: 'FR', lat: 48.85,  lon: 2.35,    tz: 'Europe/Paris',         exchange: 'Euronext' },
  { key: 'MUM', name: 'Mumbai',       country: 'IN', lat: 19.08,  lon: 72.88,   tz: 'Asia/Kolkata',         exchange: 'NSE / BSE' },
];

export const COMMODITY_CITIES: WeatherCity[] = [
  { key: 'HOU', name: 'Houston TX',    country: 'US', lat: 29.75,  lon: -95.37, tz: 'America/Chicago',      commodity: 'Crude / Nat Gas' },
  { key: 'CUS', name: 'Cushing OK',    country: 'US', lat: 36.01,  lon: -96.77, tz: 'America/Chicago',      commodity: 'WTI Benchmark' },
  { key: 'ABD', name: 'Aberdeen UK',   country: 'GB', lat: 57.15,  lon: -2.09,  tz: 'Europe/London',        commodity: 'North Sea Brent' },
  { key: 'KSC', name: 'Kansas City',   country: 'US', lat: 39.10,  lon: -94.58, tz: 'America/Chicago',      commodity: 'HRW Wheat / Cattle' },
  { key: 'DEC', name: 'Decatur IL',    country: 'US', lat: 39.84,  lon: -88.95, tz: 'America/Chicago',      commodity: 'Corn / Soybean' },
  { key: 'MPL', name: 'Minneapolis',   country: 'US', lat: 44.98,  lon: -93.27, tz: 'America/Chicago',      commodity: 'Spring Wheat' },
  { key: 'JHB', name: 'Johannesburg',  country: 'ZA', lat: -26.20, lon: 28.04,  tz: 'Africa/Johannesburg',  commodity: 'Gold / Platinum' },
  { key: 'SCL', name: 'Santiago',      country: 'CL', lat: -33.46, lon: -70.65, tz: 'America/Santiago',     commodity: 'Copper' },
  { key: 'SNT', name: 'Santos Brazil', country: 'BR', lat: -23.96, lon: -46.33, tz: 'America/Sao_Paulo',    commodity: 'Coffee / Sugar' },
  { key: 'PRT', name: 'Perth WA',      country: 'AU', lat: -31.95, lon: 115.86, tz: 'Australia/Perth',      commodity: 'Iron Ore / LNG' },
];

export const ALL_CITIES = [...FINANCIAL_CENTERS, ...COMMODITY_CITIES];

// ── helpers ──────────────────────────────────────────────────────────────────

const WIND_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
export function windDir(deg: number): string { return WIND_DIRS[Math.round(deg / 22.5) % 16]; }

export function wmoLabel(code: number): string {
  if (code === 0)    return 'Clear Sky';
  if (code === 1)    return 'Mostly Clear';
  if (code === 2)    return 'Partly Cloudy';
  if (code === 3)    return 'Overcast';
  if (code <= 49)    return code <= 45 ? 'Fog' : 'Depositing Rime Fog';
  if (code <= 57)    return code <= 51 ? 'Light Drizzle' : code <= 53 ? 'Drizzle' : 'Dense Drizzle';
  if (code <= 67)    return code <= 61 ? 'Slight Rain' : code <= 63 ? 'Moderate Rain' : code <= 65 ? 'Heavy Rain' : 'Freezing Rain';
  if (code <= 77)    return code <= 71 ? 'Slight Snow' : code <= 73 ? 'Moderate Snow' : code <= 75 ? 'Heavy Snow' : 'Snow Grains';
  if (code <= 82)    return code <= 80 ? 'Slight Showers' : code <= 81 ? 'Moderate Showers' : 'Violent Showers';
  if (code <= 86)    return code <= 85 ? 'Slight Snow Shower' : 'Heavy Snow Shower';
  if (code === 95)   return 'Thunderstorm';
  if (code >= 96)    return 'Thunderstorm w/ Hail';
  return 'Unknown';
}

export function wmoIcon(code: number, isDay = 1): string {
  if (code === 0)    return isDay ? '☀️' : '🌙';
  if (code <= 2)     return isDay ? '🌤️' : '🌤️';
  if (code === 3)    return '☁️';
  if (code <= 49)    return '🌫️';
  if (code <= 67)    return '🌧️';
  if (code <= 77)    return '❄️';
  if (code <= 82)    return '🌦️';
  if (code <= 86)    return '🌨️';
  if (code >= 95)    return '⛈️';
  return '🌡️';
}

export function wmoSeverity(code: number): 'ok' | 'warn' | 'danger' {
  if (code >= 95)    return 'danger';
  if (code >= 80 || (code >= 65 && code <= 67) || (code >= 75 && code <= 77)) return 'warn';
  return 'ok';
}

export function cToF(c: number): number { return c * 9 / 5 + 32; }
export function aqiLabel(v: number): string {
  if (v <= 50)  return 'Good';
  if (v <= 100) return 'Moderate';
  if (v <= 150) return 'Unhealthy (Sensitive)';
  if (v <= 200) return 'Unhealthy';
  if (v <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}
export function aqiColor(v: number): string {
  if (v <= 50)  return 'text-positive';
  if (v <= 100) return 'text-[hsl(50,100%,55%)]';
  if (v <= 150) return 'text-accent';
  return 'text-negative';
}

// ── commodity market impact ───────────────────────────────────────────────────

export interface MarketImpact { level: 'HIGH' | 'MED' | 'LOW'; note: string }

export function commodityImpact(city: WeatherCity, now: WeatherNow | null): MarketImpact | null {
  if (!now) return null;
  const t = now.temp_c;
  const code = now.code;
  const wind = now.wind_kph;
  const rain = now.precip_mm;

  if (city.key === 'HOU' || city.key === 'CUS') {
    if (t > 38) return { level: 'HIGH', note: 'Extreme heat → AC demand surge, nat gas power gen elevated' };
    if (t < -5) return { level: 'HIGH', note: 'Freeze risk → wellhead freeze-offs, gas supply disruption' };
    if (code >= 95) return { level: 'HIGH', note: 'Severe wx → refinery/port ops risk, crude supply disruption' };
    if (t > 32) return { level: 'MED', note: 'High heat → elevated cooling demand, Permian well stress' };
    return { level: 'LOW', note: 'Normal conditions' };
  }
  if (city.key === 'ABD') {
    if (wind > 80 || code >= 95) return { level: 'HIGH', note: 'Storm conditions → North Sea platform ops suspended' };
    if (wind > 50 || code >= 80) return { level: 'MED', note: 'High winds → offshore ops limited, production at risk' };
    if (t < 2)  return { level: 'MED', note: 'Near-freeze → pipeline inspection constraints' };
    return { level: 'LOW', note: 'Normal North Sea conditions' };
  }
  if (city.key === 'KSC' || city.key === 'DEC' || city.key === 'MPL') {
    const isPlanting = new Date().getMonth() >= 3 && new Date().getMonth() <= 5;
    const isHarvest = new Date().getMonth() >= 8 && new Date().getMonth() <= 10;
    if (code >= 80 && (isPlanting || isHarvest)) return { level: 'HIGH', note: `Heavy precip during ${isPlanting ? 'planting' : 'harvest'} → yield risk, delay` };
    if (t > 38) return { level: 'HIGH', note: 'Extreme heat → crop stress, lower yield estimates' };
    if (t < -15) return { level: 'HIGH', note: 'Hard freeze → winter wheat kill risk' };
    if (rain > 20) return { level: 'MED', note: 'Heavy rain → field saturation, delayed operations' };
    if (t < 0 && isPlanting) return { level: 'MED', note: 'Below-freeze during planting season → delays' };
    return { level: 'LOW', note: 'Favorable growing conditions' };
  }
  if (city.key === 'JHB') {
    if (code >= 80) return { level: 'MED', note: 'Heavy rain → mine flooding risk, ops disruption' };
    if (t > 35)     return { level: 'MED', note: 'Extreme heat → underground mining restrictions possible' };
    return { level: 'LOW', note: 'Normal mining conditions' };
  }
  if (city.key === 'SCL') {
    if (code >= 65 || rain > 15) return { level: 'HIGH', note: 'Heavy rain → mudslide risk, Andean mine road closures' };
    if (t > 35)  return { level: 'MED', note: 'High heat → water supply stress for copper processing' };
    return { level: 'LOW', note: 'Normal copper belt conditions' };
  }
  if (city.key === 'SNT') {
    if (t > 35 || code >= 80) return { level: 'MED', note: 'Extreme weather → port loading delays, coffee/sugar transit' };
    return { level: 'LOW', note: 'Normal port conditions' };
  }
  if (city.key === 'PRT') {
    if (wind > 60) return { level: 'MED', note: 'High winds → iron ore vessel loading at Pilbara disrupted' };
    return { level: 'LOW', note: 'Normal LNG / iron ore conditions' };
  }
  return { level: 'LOW', note: 'Normal conditions' };
}

// ── fetching ─────────────────────────────────────────────────────────────────

const CACHE_KEY = 'tt:weather:v2';
const TTL = 30 * 60 * 1000;

async function fetchCity(city: WeatherCity): Promise<CityWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude',  String(city.lat));
  url.searchParams.set('longitude', String(city.lon));
  url.searchParams.set('current', [
    'temperature_2m','apparent_temperature','dew_point_2m','relative_humidity_2m',
    'precipitation','weather_code','cloud_cover',
    'wind_speed_10m','wind_direction_10m','wind_gusts_10m',
    'surface_pressure','visibility','uv_index','is_day',
  ].join(','));
  url.searchParams.set('hourly', [
    'temperature_2m','apparent_temperature','dew_point_2m','relative_humidity_2m',
    'precipitation_probability','precipitation','weather_code','cloud_cover',
    'wind_speed_10m','wind_gusts_10m','visibility','surface_pressure','uv_index',
  ].join(','));
  url.searchParams.set('daily', [
    'weather_code','temperature_2m_max','temperature_2m_min',
    'sunrise','sunset','precipitation_probability_max','precipitation_sum',
    'precipitation_hours','uv_index_max','wind_speed_10m_max',
    'wind_gusts_10m_max','wind_direction_10m_dominant',
  ].join(','));
  url.searchParams.set('timezone', city.tz);
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();

  const c = d.current;
  const now: WeatherNow = {
    temp_c:       c.temperature_2m,
    feels_c:      c.apparent_temperature,
    dew_c:        c.dew_point_2m,
    wind_kph:     c.wind_speed_10m,
    gust_kph:     c.wind_gusts_10m,
    wind_deg:     c.wind_direction_10m ?? 0,
    wind_dir:     windDir(c.wind_direction_10m ?? 0),
    humidity:     c.relative_humidity_2m,
    precip_mm:    c.precipitation,
    cloud:        c.cloud_cover,
    pressure_hpa: c.surface_pressure,
    visibility_km: (c.visibility ?? 10000) / 1000,
    uv:           c.uv_index ?? 0,
    code:         c.weather_code,
    is_day:       c.is_day,
  };

  // Find current hour index for slicing next 24h of hourly
  const nowIso = c.time as string;
  const hTimes: string[] = d.hourly?.time ?? [];
  const hStart = Math.max(0, hTimes.findIndex((t: string) => t >= nowIso.slice(0, 13)));
  const hSlice = (arr: number[]) => arr.slice(hStart, hStart + 24);

  const hourly: HourlyPoint[] = hTimes.slice(hStart, hStart + 24).map((time: string, i: number) => ({
    time,
    temp_c:       hSlice(d.hourly.temperature_2m)[i],
    feels_c:      hSlice(d.hourly.apparent_temperature)[i],
    dew_c:        hSlice(d.hourly.dew_point_2m)[i],
    humidity:     hSlice(d.hourly.relative_humidity_2m)[i],
    precip_prob:  hSlice(d.hourly.precipitation_probability)[i],
    precip_mm:    hSlice(d.hourly.precipitation)[i],
    wind_kph:     hSlice(d.hourly.wind_speed_10m)[i],
    gust_kph:     hSlice(d.hourly.wind_gusts_10m)[i],
    cloud:        hSlice(d.hourly.cloud_cover)[i],
    visibility_km: ((hSlice(d.hourly.visibility)[i]) ?? 10000) / 1000,
    pressure_hpa: hSlice(d.hourly.surface_pressure)[i],
    code:         hSlice(d.hourly.weather_code)[i],
    uv:           hSlice(d.hourly.uv_index)[i] ?? 0,
  }));

  const days: DayForecast[] = (d.daily?.time ?? []).map((date: string, i: number) => ({
    date,
    max_c:        d.daily.temperature_2m_max[i],
    min_c:        d.daily.temperature_2m_min[i],
    precip_mm:    d.daily.precipitation_sum[i],
    precip_prob:  d.daily.precipitation_probability_max[i] ?? 0,
    precip_hours: d.daily.precipitation_hours[i] ?? 0,
    wind_max_kph: d.daily.wind_speed_10m_max[i],
    gust_max_kph: d.daily.wind_gusts_10m_max[i],
    wind_dom_deg: d.daily.wind_direction_10m_dominant[i] ?? 0,
    uv_max:       d.daily.uv_index_max[i] ?? 0,
    sunrise:      d.daily.sunrise[i],
    sunset:       d.daily.sunset[i],
    code:         d.daily.weather_code[i],
  }));

  return { city, now, hourly, days, fetchedAt: Date.now() };
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude',  String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,carbon_monoxide');
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`AQ HTTP ${r.status}`);
  const d = await r.json();
  const c = d.current ?? {};
  return {
    us_aqi: c.us_aqi   ?? null,
    pm2_5:  c.pm2_5    ?? null,
    pm10:   c.pm10     ?? null,
    o3:     c.ozone    ?? null,
    no2:    c.nitrogen_dioxide ?? null,
    co:     c.carbon_monoxide  ?? null,
    fetchedAt: Date.now(),
  };
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useWeather() {
  const [data, setData] = useState<Record<string, CityWeather>>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, CityWeather>;
      const valid: Record<string, CityWeather> = {};
      for (const [k, v] of Object.entries(cached)) {
        if (Date.now() - v.fetchedAt < TTL) valid[k] = v;
      }
      return valid;
    } catch { return {}; }
  });
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const stale = ALL_CITIES.filter(c => {
        const cached = data[c.key];
        return !cached || Date.now() - cached.fetchedAt >= TTL;
      });
      if (stale.length === 0) { setLoading(false); return; }

      const results = await Promise.allSettled(stale.map(fetchCity));
      if (cancelled) return;

      setData(prev => {
        const next = { ...prev };
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            next[stale[i].key] = r.value;
          } else {
            next[stale[i].key] = {
              city: stale[i], now: null, hourly: [], days: [],
              fetchedAt: Date.now(), error: String(r.reason),
            };
          }
        });
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
      setLastFetch(Date.now());
      setLoading(false);
    }
    load();
    const id = window.setInterval(load, TTL);
    return () => { cancelled = true; window.clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, lastFetch };
}

export function useAirQuality(lat: number, lon: number, enabled = true) {
  const [aq, setAq] = useState<AirQuality | null>(null);
  const [aqLoading, setAqLoading] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setAqLoading(true);
    fetchAirQuality(lat, lon)
      .then(v => { if (!cancelled) setAq(v); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAqLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lon, enabled]);
  return { aq, aqLoading };
}
