import { useState, useEffect, useMemo } from 'react';
import AdvancedGlobe, { type GlobeMarket } from '@/components/globe/AdvancedGlobe';

// Inlined market list (mirrors GLOBAL_MARKETS in ToolsPanel) to avoid coupling.
const MARKETS = [
  { name: 'New York (NYSE)', tz: 'America/New_York', open: 570, close: 960, preOpen: 240, postClose: 1200, lat: 40.7, lng: -74, abbr: 'NYSE', currency: 'USD', index: 'S&P 500' },
  { name: 'NASDAQ', tz: 'America/New_York', open: 570, close: 960, preOpen: 240, postClose: 1200, lat: 40.75, lng: -73.98, abbr: 'NDAQ', currency: 'USD', index: 'NASDAQ 100' },
  { name: 'Chicago (CME)', tz: 'America/Chicago', open: 510, close: 960, preOpen: 480, postClose: 960, lat: 41.9, lng: -87.6, abbr: 'CME', currency: 'USD', index: 'S&P Futures' },
  { name: 'London (LSE)', tz: 'Europe/London', open: 480, close: 990, preOpen: 420, postClose: 1050, lat: 51.5, lng: -0.1, abbr: 'LSE', currency: 'GBP', index: 'FTSE 100' },
  { name: 'Paris (Euronext)', tz: 'Europe/Paris', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 48.9, lng: 2.3, abbr: 'PAR', currency: 'EUR', index: 'CAC 40' },
  { name: 'Frankfurt (XETR)', tz: 'Europe/Berlin', open: 540, close: 1020, preOpen: 480, postClose: 1080, lat: 50.1, lng: 8.7, abbr: 'XETR', currency: 'EUR', index: 'DAX 40' },
  { name: 'Zurich (SIX)', tz: 'Europe/Zurich', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 47.4, lng: 8.5, abbr: 'SIX', currency: 'CHF', index: 'SMI' },
  { name: 'Amsterdam (AMS)', tz: 'Europe/Amsterdam', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 52.4, lng: 4.9, abbr: 'AMS', currency: 'EUR', index: 'AEX 25' },
  { name: 'Madrid (BME)', tz: 'Europe/Madrid', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 40.4, lng: -3.7, abbr: 'BME', currency: 'EUR', index: 'IBEX 35' },
  { name: 'Milan (BIT)', tz: 'Europe/Rome', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 45.5, lng: 9.2, abbr: 'BIT', currency: 'EUR', index: 'FTSE MIB' },
  { name: 'Moscow (MOEX)', tz: 'Europe/Moscow', open: 600, close: 1110, preOpen: 570, postClose: 1140, lat: 55.8, lng: 37.6, abbr: 'MOEX', currency: 'RUB', index: 'MOEX Index' },
  { name: 'Tokyo (TSE)', tz: 'Asia/Tokyo', open: 540, close: 900, preOpen: 480, postClose: 930, lat: 35.7, lng: 139.7, abbr: 'TSE', currency: 'JPY', index: 'Nikkei 225' },
  { name: 'Hong Kong (HKEX)', tz: 'Asia/Hong_Kong', open: 570, close: 960, preOpen: 540, postClose: 960, lat: 22.3, lng: 114.2, abbr: 'HKEX', currency: 'HKD', index: 'Hang Seng' },
  { name: 'Shanghai (SSE)', tz: 'Asia/Shanghai', open: 570, close: 900, preOpen: 555, postClose: 900, lat: 31.2, lng: 121.5, abbr: 'SSE', currency: 'CNY', index: 'SSE Composite' },
  { name: 'Shenzhen (SZSE)', tz: 'Asia/Shanghai', open: 570, close: 900, preOpen: 555, postClose: 900, lat: 22.5, lng: 114.1, abbr: 'SZSE', currency: 'CNY', index: 'SZSE Component' },
  { name: 'Seoul (KRX)', tz: 'Asia/Seoul', open: 540, close: 930, preOpen: 480, postClose: 960, lat: 37.6, lng: 127.0, abbr: 'KRX', currency: 'KRW', index: 'KOSPI' },
  { name: 'Taipei (TWSE)', tz: 'Asia/Taipei', open: 540, close: 810, preOpen: 510, postClose: 840, lat: 25.0, lng: 121.5, abbr: 'TWSE', currency: 'TWD', index: 'TAIEX' },
  { name: 'Sydney (ASX)', tz: 'Australia/Sydney', open: 600, close: 960, preOpen: 420, postClose: 960, lat: -33.9, lng: 151.2, abbr: 'ASX', currency: 'AUD', index: 'ASX 200' },
  { name: 'Toronto (TSX)', tz: 'America/Toronto', open: 570, close: 960, preOpen: 420, postClose: 1020, lat: 43.7, lng: -79.4, abbr: 'TSX', currency: 'CAD', index: 'TSX Composite' },
  { name: 'Mumbai (BSE)', tz: 'Asia/Kolkata', open: 555, close: 930, preOpen: 540, postClose: 930, lat: 19.1, lng: 72.9, abbr: 'BSE', currency: 'INR', index: 'SENSEX' },
  { name: 'Singapore (SGX)', tz: 'Asia/Singapore', open: 540, close: 1020, preOpen: 510, postClose: 1050, lat: 1.3, lng: 103.8, abbr: 'SGX', currency: 'SGD', index: 'STI' },
  { name: 'São Paulo (B3)', tz: 'America/Sao_Paulo', open: 600, close: 1020, preOpen: 555, postClose: 1050, lat: -23.5, lng: -46.6, abbr: 'B3', currency: 'BRL', index: 'Bovespa' },
  { name: 'Mexico City (BMV)', tz: 'America/Mexico_City', open: 510, close: 900, preOpen: 480, postClose: 930, lat: 19.4, lng: -99.1, abbr: 'BMV', currency: 'MXN', index: 'IPC' },
  { name: 'Johannesburg (JSE)', tz: 'Africa/Johannesburg', open: 540, close: 1020, preOpen: 480, postClose: 1020, lat: -26.2, lng: 28.0, abbr: 'JSE', currency: 'ZAR', index: 'JSE Top 40' },
  { name: 'Dubai (DFM)', tz: 'Asia/Dubai', open: 600, close: 840, preOpen: 570, postClose: 870, lat: 25.2, lng: 55.3, abbr: 'DFM', currency: 'AED', index: 'DFM Index' },
  { name: 'Riyadh (Tadawul)', tz: 'Asia/Riyadh', open: 600, close: 900, preOpen: 570, postClose: 930, lat: 24.7, lng: 46.7, abbr: 'TDWL', currency: 'SAR', index: 'Tadawul All Share' },
  { name: 'Istanbul (BIST)', tz: 'Europe/Istanbul', open: 600, close: 1080, preOpen: 555, postClose: 1080, lat: 41.0, lng: 29.0, abbr: 'BIST', currency: 'TRY', index: 'BIST 100' },
  { name: 'Warsaw (WSE)', tz: 'Europe/Warsaw', open: 540, close: 1020, preOpen: 480, postClose: 1020, lat: 52.2, lng: 21.0, abbr: 'WSE', currency: 'PLN', index: 'WIG 20' },
  { name: 'Jakarta (IDX)', tz: 'Asia/Jakarta', open: 540, close: 930, preOpen: 510, postClose: 960, lat: -6.2, lng: 106.8, abbr: 'IDX', currency: 'IDR', index: 'JCI' },
  { name: 'Bangkok (SET)', tz: 'Asia/Bangkok', open: 600, close: 1020, preOpen: 570, postClose: 1020, lat: 13.8, lng: 100.5, abbr: 'SET', currency: 'THB', index: 'SET Index' },
];

function getStatus(m: typeof MARKETS[0], now: Date): GlobeMarket['status'] {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: m.tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
  const parts = f.formatToParts(now);
  const wd = parts.find(p => p.type === 'weekday')?.value;
  const h = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const min = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
  if (wd === 'Sat' || wd === 'Sun') return 'CLOSED';
  const mins = h * 60 + min;
  if (mins >= m.open && mins < m.close) return 'OPEN';
  if (mins >= m.preOpen && mins < m.open) return 'PRE';
  if (mins >= m.close && mins < m.postClose) return 'AFTER';
  return 'CLOSED';
}

export default function GlobeView() {
  const [now, setNow] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'3D' | '2D'>(() => {
    try { return JSON.parse(localStorage.getItem('lovable:userpref:globe.viewMode') || '"3D"'); } catch { return '3D'; }
  });
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<'2D' | '3D'>;
      if (e.detail === '2D' || e.detail === '3D') setViewMode(e.detail);
    };
    window.addEventListener('lovable:globe-set-view-mode', handler as EventListener);
    return () => window.removeEventListener('lovable:globe-set-view-mode', handler as EventListener);
  }, []);

  const markets = useMemo<GlobeMarket[]>(
    () => MARKETS.map(m => ({
      name: m.name, abbr: m.abbr, lat: m.lat, lng: m.lng,
      currency: m.currency, index: m.index, tz: m.tz, status: getStatus(m, now),
    })),
    [now],
  );

  const setMode = (mode: '2D' | '3D') => {
    setViewMode(mode);
    window.dispatchEvent(new CustomEvent('lovable:globe-set-view-mode', { detail: mode }));
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center bg-surface-deep/80 border border-border backdrop-blur">
        {(['3D', '2D'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold border-r border-border last:border-r-0 ${
              viewMode === mode
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === '3D' ? 'GLOB' : 'MAP'}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <div className="h-full w-full">
          <AdvancedGlobe markets={markets} expanded={true} />
        </div>
      </div>
    </div>
  );
}
