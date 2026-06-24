/**
 * Day/night terminator + time-zone band helpers. The terminator is the great-
 * circle where the sun is at the horizon for the given UTC time. We compute
 * solar declination + the subsolar longitude, then for each lng sample the lat
 * where cos(zenith)=0 — yielding a polyline we can render as an SVG path.
 *
 * Sample math: classic NOAA Solar Calculator approximations.
 */

/** Solar declination (°) for a given UTC date (degree). */
function solarDeclination(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  // Approximation (Spencer 1971 simplified)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (date.getUTCHours() - 12) / 24);
  return (180 / Math.PI) * (
    0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.001480 * Math.sin(3 * gamma)
  );
}

/** Subsolar longitude (°): the lng directly under the sun at this UTC. */
function subsolarLng(date: Date): number {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return -(utcHours - 12) * 15;
}

/**
 * Returns terminator polyline as [lng, lat] tuples sampled across [-180,180].
 * Also returns whether the *northern* hemisphere is currently in night for the
 * subsolar point (so caller can shade the correct side).
 */
export function terminatorPath(date = new Date()): { points: [number, number][]; nightSide: 'N' | 'S' } {
  const dec = solarDeclination(date);
  const decRad = (dec * Math.PI) / 180;
  const subLng = subsolarLng(date);
  const points: [number, number][] = [];
  for (let lng = -180; lng <= 180; lng += 2) {
    // Hour angle of this lng relative to subsolar
    const ha = ((lng - subLng) * Math.PI) / 180;
    // Latitude where the sun is on the horizon: tan(lat) = -cos(ha)/tan(dec)
    const lat = Math.atan(-Math.cos(ha) / Math.tan(decRad)) * (180 / Math.PI);
    points.push([lng, lat]);
  }
  // If declination is positive (boreal summer), the south pole is in darkness
  return { points, nightSide: dec >= 0 ? 'S' : 'N' };
}

/**
 * Major exchanges with their local timezone (IANA) — used to render market-open
 * status overlay on the map.
 */
export const MARKET_CLOCKS: { abbr: string; name: string; lat: number; lng: number; tz: string; openH: number; closeH: number }[] = [
  { abbr: 'NYSE',  name: 'New York', lat: 40.7069, lng: -74.0113, tz: 'America/New_York', openH: 9.5,  closeH: 16 },
  { abbr: 'NASDAQ', name: 'NASDAQ',  lat: 40.7508, lng: -73.9874, tz: 'America/New_York', openH: 9.5,  closeH: 16 },
  { abbr: 'TSX',   name: 'Toronto',  lat: 43.6487, lng: -79.3819, tz: 'America/Toronto',  openH: 9.5,  closeH: 16 },
  { abbr: 'LSE',   name: 'London',   lat: 51.5155, lng: -0.0922,  tz: 'Europe/London',    openH: 8,    closeH: 16.5 },
  { abbr: 'EURX',  name: 'Frankfurt', lat: 50.1109, lng: 8.6821,  tz: 'Europe/Berlin',    openH: 9,    closeH: 17.5 },
  { abbr: 'EPA',   name: 'Paris',    lat: 48.8698, lng: 2.3416,   tz: 'Europe/Paris',     openH: 9,    closeH: 17.5 },
  { abbr: 'SIX',   name: 'Zurich',   lat: 47.3769, lng: 8.5417,   tz: 'Europe/Zurich',    openH: 9,    closeH: 17.5 },
  { abbr: 'JPX',   name: 'Tokyo',    lat: 35.6809, lng: 139.7673, tz: 'Asia/Tokyo',       openH: 9,    closeH: 15 },
  { abbr: 'HKEX',  name: 'Hong Kong', lat: 22.2849, lng: 114.1577, tz: 'Asia/Hong_Kong',  openH: 9.5,  closeH: 16 },
  { abbr: 'SSE',   name: 'Shanghai', lat: 31.2386, lng: 121.4986, tz: 'Asia/Shanghai',    openH: 9.5,  closeH: 15 },
  { abbr: 'KRX',   name: 'Seoul',    lat: 37.5089, lng: 126.9251, tz: 'Asia/Seoul',       openH: 9,    closeH: 15.5 },
  { abbr: 'SGX',   name: 'Singapore', lat: 1.2825, lng: 103.8506, tz: 'Asia/Singapore',   openH: 9,    closeH: 17 },
  { abbr: 'BSE',   name: 'Mumbai',   lat: 18.9293, lng: 72.8332,  tz: 'Asia/Kolkata',     openH: 9.25, closeH: 15.5 },
  { abbr: 'ASX',   name: 'Sydney',   lat: -33.8651, lng: 151.2099, tz: 'Australia/Sydney', openH: 10,   closeH: 16 },
  { abbr: 'B3',    name: 'São Paulo', lat: -23.5444, lng: -46.6360, tz: 'America/Sao_Paulo', openH: 10, closeH: 17 },
  { abbr: 'JSE',   name: 'Johannesburg', lat: -26.1076, lng: 28.0567, tz: 'Africa/Johannesburg', openH: 9, closeH: 17 },
  { abbr: 'ADX',   name: 'Abu Dhabi', lat: 24.4977, lng: 54.3713, tz: 'Asia/Dubai',       openH: 10,   closeH: 14 },
];

/** Returns 'OPEN' | 'CLOSED' for a market clock at the given moment. */
export function marketStatus(clock: typeof MARKET_CLOCKS[number], now = new Date()): 'OPEN' | 'CLOSED' {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: clock.tz, hour12: false,
      hour: '2-digit', minute: '2-digit', weekday: 'short',
    });
    const parts = fmt.formatToParts(now);
    const wd = parts.find(p => p.type === 'weekday')?.value;
    const hour = Number(parts.find(p => p.type === 'hour')?.value);
    const min = Number(parts.find(p => p.type === 'minute')?.value);
    if (wd === 'Sat' || wd === 'Sun') return 'CLOSED';
    const t = hour + min / 60;
    return t >= clock.openH && t < clock.closeH ? 'OPEN' : 'CLOSED';
  } catch { return 'CLOSED'; }
}

/** Local time string ("HH:MM") in market's timezone. */
export function localTime(tz: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit',
    }).format(now);
  } catch { return '--:--'; }
}
