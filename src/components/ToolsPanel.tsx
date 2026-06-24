import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { calculateBlackScholes } from '@/utils/blackScholes';
import { ChevronLeft, ChevronUp, ChevronDown, Eye, EyeOff, Settings, X, Plus, Bold, Italic, List, Trash2, ArrowUp, ArrowDown, Maximize2, Minimize2 } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import AdvancedGlobe, { type GlobeMarket } from './globe/AdvancedGlobe';
import { ToolsCmdHeader } from './tools/ToolsTerminalChrome';
import PositionsTile from './tools/widgets/PositionsTile';
import RiskMonitorTile from './tools/widgets/RiskMonitorTile';
import AlertsTile from './tools/widgets/AlertsTile';
import OpraPricer from './tools/widgets/OpraPricer';
import CorrMatrix from './tools/widgets/CorrMatrix';
import PreMarketScan from './tools/widgets/PreMarketScan';
import CalcHub from './tools/widgets/CalcHub';

// Context allows the panel to inject a per-widget CMD code into every ToolSection
// without touching all 37 call sites.
const WidgetCmdContext = createContext<string | undefined>(undefined);

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CalcTab = 'risk' | 'profit' | 'position' | 'rr' | 'winrate' | 'fees' | 'drawdown' | 'expectancy' | 'kelly';
type TimerMode = 'stopwatch' | 'pomodoro' | 'countdown';

// ── Shared primitives ──────────────────────────────────────────────
function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] text-muted-foreground mb-1 uppercase font-body">{label}</label>
      <input {...props} className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
    </div>
  );
}

function ResultRow({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="mb-2">
      <span className="text-muted-foreground text-[9px] uppercase font-body">{label}</span>
      <div className={`font-mono font-bold text-sm ${valueClass}`}>{value}</div>
    </div>
  );
}

type SectionColor = 'accent' | 'green' | 'red' | 'blue' | 'purple' | 'yellow' | 'cyan' | 'pink';

const sectionColorMap: Record<SectionColor, { header: string; accent: string; top: string; border: string }> = {
  accent: { header: 'text-accent', accent: 'border-l-accent', top: 'border-t-accent', border: 'border-accent/30' },
  green: { header: 'text-positive', accent: 'border-l-positive', top: 'border-t-positive', border: 'border-positive/30' },
  red: { header: 'text-negative', accent: 'border-l-negative', top: 'border-t-negative', border: 'border-negative/30' },
  blue: { header: 'text-[hsl(210,80%,65%)]', accent: 'border-l-[hsl(210,80%,65%)]', top: 'border-t-[hsl(210,80%,65%)]', border: 'border-[hsl(210,80%,65%)]/30' },
  purple: { header: 'text-[hsl(270,70%,70%)]', accent: 'border-l-[hsl(270,70%,70%)]', top: 'border-t-[hsl(270,70%,70%)]', border: 'border-[hsl(270,70%,70%)]/30' },
  yellow: { header: 'text-[hsl(45,100%,60%)]', accent: 'border-l-[hsl(45,100%,60%)]', top: 'border-t-[hsl(45,100%,60%)]', border: 'border-[hsl(45,100%,60%)]/30' },
  cyan: { header: 'text-[hsl(185,70%,55%)]', accent: 'border-l-[hsl(185,70%,55%)]', top: 'border-t-[hsl(185,70%,55%)]', border: 'border-[hsl(185,70%,55%)]/30' },
  pink: { header: 'text-[hsl(340,70%,65%)]', accent: 'border-l-[hsl(340,70%,65%)]', top: 'border-t-[hsl(340,70%,65%)]', border: 'border-[hsl(340,70%,65%)]/30' },
};

function ToolSection({ title, icon, children, defaultOpen = false, headerRight, color = 'accent', cmd }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; headerRight?: React.ReactNode; color?: SectionColor; cmd?: string }) {
  const ctxCmd = useContext(WidgetCmdContext);
  const effectiveCmd = cmd ?? ctxCmd;
  const [open, setOpen] = useState(defaultOpen);
  const [resizing, setResizing] = useState(false);
  const [extraHeight, setExtraHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startH = useRef(0);
  const colors = sectionColorMap[color];

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    startY.current = e.clientY;
    startH.current = contentRef.current?.offsetHeight || 0;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY.current;
      setExtraHeight(Math.max(-startH.current + 40, delta));
    };
    const onUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div className={`bg-card border border-border mb-2 relative border-t-2 ${colors.top}`}>
      <button onClick={() => setOpen(!open)}
        className={`w-full px-2 py-1.5 bg-surface-deep border-b ${colors.border} flex justify-between items-center text-[10px] uppercase font-mono font-bold tracking-wider hover:bg-surface-elevated transition-colors`}>
        <div className="flex items-center gap-2 min-w-0">
          {effectiveCmd && <span className={`${colors.header} text-[10px] font-mono font-bold w-9 text-left flex-shrink-0`}>{effectiveCmd}</span>}
          {/* icon intentionally omitted */}
          <span className="text-muted-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerRight}
          <span className={`transition-transform text-muted-foreground/60 text-[9px] ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {open && (
        <div ref={contentRef} className="p-2 overflow-auto" style={extraHeight ? { height: `${(contentRef.current?.scrollHeight || 200) + extraHeight}px` } : {}}>
          {children}
          <div
            onMouseDown={onResizeStart}
            className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end pr-0.5 pb-0.5 opacity-40 hover:opacity-100 transition-opacity ${resizing ? 'opacity-100' : ''}`}
            title="Drag to resize"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-muted-foreground">
              <path d="M6 0L8 0L8 2Z" fill="currentColor" opacity="0.5"/>
              <path d="M3 3L8 3L8 5L5 5L5 8L3 8Z" fill="currentColor" opacity="0.35"/>
              <path d="M6 6L8 6L8 8L6 8Z" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

function CalcButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full px-3 py-2 bg-accent text-accent-foreground font-mono text-[11px] font-bold border border-accent hover:opacity-90 transition-opacity mb-3">
      {label}
    </button>
  );
}

// ── Global Markets Data ─────────────────────────────────────────────
const GLOBAL_MARKETS = [
  { name: 'New York (NYSE)', tz: 'America/New_York', open: 570, close: 960, preOpen: 240, postClose: 1200, lat: 40.7, lng: -74, abbr: 'NYSE', currency: 'USD', index: 'S&P 500', lunchStart: 0, lunchEnd: 0 },
  { name: 'NASDAQ', tz: 'America/New_York', open: 570, close: 960, preOpen: 240, postClose: 1200, lat: 40.75, lng: -73.98, abbr: 'NDAQ', currency: 'USD', index: 'NASDAQ 100', lunchStart: 0, lunchEnd: 0 },
  { name: 'Chicago (CME)', tz: 'America/Chicago', open: 510, close: 960, preOpen: 480, postClose: 960, lat: 41.9, lng: -87.6, abbr: 'CME', currency: 'USD', index: 'S&P Futures', lunchStart: 0, lunchEnd: 0 },
  { name: 'London (LSE)', tz: 'Europe/London', open: 480, close: 990, preOpen: 420, postClose: 1050, lat: 51.5, lng: -0.1, abbr: 'LSE', currency: 'GBP', index: 'FTSE 100', lunchStart: 0, lunchEnd: 0 },
  { name: 'Paris (Euronext)', tz: 'Europe/Paris', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 48.9, lng: 2.3, abbr: 'PAR', currency: 'EUR', index: 'CAC 40', lunchStart: 0, lunchEnd: 0 },
  { name: 'Frankfurt (XETR)', tz: 'Europe/Berlin', open: 540, close: 1020, preOpen: 480, postClose: 1080, lat: 50.1, lng: 8.7, abbr: 'XETR', currency: 'EUR', index: 'DAX 40', lunchStart: 0, lunchEnd: 0 },
  { name: 'Zurich (SIX)', tz: 'Europe/Zurich', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 47.4, lng: 8.5, abbr: 'SIX', currency: 'CHF', index: 'SMI', lunchStart: 0, lunchEnd: 0 },
  { name: 'Amsterdam (AMS)', tz: 'Europe/Amsterdam', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 52.4, lng: 4.9, abbr: 'AMS', currency: 'EUR', index: 'AEX 25', lunchStart: 0, lunchEnd: 0 },
  { name: 'Madrid (BME)', tz: 'Europe/Madrid', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 40.4, lng: -3.7, abbr: 'BME', currency: 'EUR', index: 'IBEX 35', lunchStart: 0, lunchEnd: 0 },
  { name: 'Milan (BIT)', tz: 'Europe/Rome', open: 540, close: 1050, preOpen: 480, postClose: 1080, lat: 45.5, lng: 9.2, abbr: 'BIT', currency: 'EUR', index: 'FTSE MIB', lunchStart: 0, lunchEnd: 0 },
  { name: 'Moscow (MOEX)', tz: 'Europe/Moscow', open: 600, close: 1110, preOpen: 570, postClose: 1140, lat: 55.8, lng: 37.6, abbr: 'MOEX', currency: 'RUB', index: 'MOEX Index', lunchStart: 0, lunchEnd: 0 },
  { name: 'Tokyo (TSE)', tz: 'Asia/Tokyo', open: 540, close: 900, preOpen: 480, postClose: 930, lat: 35.7, lng: 139.7, abbr: 'TSE', currency: 'JPY', index: 'Nikkei 225', lunchStart: 690, lunchEnd: 750 },
  { name: 'Hong Kong (HKEX)', tz: 'Asia/Hong_Kong', open: 570, close: 960, preOpen: 540, postClose: 960, lat: 22.3, lng: 114.2, abbr: 'HKEX', currency: 'HKD', index: 'Hang Seng', lunchStart: 720, lunchEnd: 780 },
  { name: 'Shanghai (SSE)', tz: 'Asia/Shanghai', open: 570, close: 900, preOpen: 555, postClose: 900, lat: 31.2, lng: 121.5, abbr: 'SSE', currency: 'CNY', index: 'SSE Composite', lunchStart: 690, lunchEnd: 780 },
  { name: 'Shenzhen (SZSE)', tz: 'Asia/Shanghai', open: 570, close: 900, preOpen: 555, postClose: 900, lat: 22.5, lng: 114.1, abbr: 'SZSE', currency: 'CNY', index: 'SZSE Component', lunchStart: 690, lunchEnd: 780 },
  { name: 'Seoul (KRX)', tz: 'Asia/Seoul', open: 540, close: 930, preOpen: 480, postClose: 960, lat: 37.6, lng: 127.0, abbr: 'KRX', currency: 'KRW', index: 'KOSPI', lunchStart: 0, lunchEnd: 0 },
  { name: 'Taipei (TWSE)', tz: 'Asia/Taipei', open: 540, close: 810, preOpen: 510, postClose: 840, lat: 25.0, lng: 121.5, abbr: 'TWSE', currency: 'TWD', index: 'TAIEX', lunchStart: 0, lunchEnd: 0 },
  { name: 'Sydney (ASX)', tz: 'Australia/Sydney', open: 600, close: 960, preOpen: 420, postClose: 960, lat: -33.9, lng: 151.2, abbr: 'ASX', currency: 'AUD', index: 'ASX 200', lunchStart: 0, lunchEnd: 0 },
  { name: 'Toronto (TSX)', tz: 'America/Toronto', open: 570, close: 960, preOpen: 420, postClose: 1020, lat: 43.7, lng: -79.4, abbr: 'TSX', currency: 'CAD', index: 'TSX Composite', lunchStart: 0, lunchEnd: 0 },
  { name: 'Mumbai (BSE)', tz: 'Asia/Kolkata', open: 555, close: 930, preOpen: 540, postClose: 930, lat: 19.1, lng: 72.9, abbr: 'BSE', currency: 'INR', index: 'SENSEX', lunchStart: 0, lunchEnd: 0 },
  { name: 'Singapore (SGX)', tz: 'Asia/Singapore', open: 540, close: 1020, preOpen: 510, postClose: 1050, lat: 1.3, lng: 103.8, abbr: 'SGX', currency: 'SGD', index: 'STI', lunchStart: 0, lunchEnd: 0 },
  { name: 'São Paulo (B3)', tz: 'America/Sao_Paulo', open: 600, close: 1020, preOpen: 555, postClose: 1050, lat: -23.5, lng: -46.6, abbr: 'B3', currency: 'BRL', index: 'Bovespa', lunchStart: 0, lunchEnd: 0 },
  { name: 'Mexico City (BMV)', tz: 'America/Mexico_City', open: 510, close: 900, preOpen: 480, postClose: 930, lat: 19.4, lng: -99.1, abbr: 'BMV', currency: 'MXN', index: 'IPC', lunchStart: 0, lunchEnd: 0 },
  { name: 'Johannesburg (JSE)', tz: 'Africa/Johannesburg', open: 540, close: 1020, preOpen: 480, postClose: 1020, lat: -26.2, lng: 28.0, abbr: 'JSE', currency: 'ZAR', index: 'JSE Top 40', lunchStart: 0, lunchEnd: 0 },
  { name: 'Dubai (DFM)', tz: 'Asia/Dubai', open: 600, close: 840, preOpen: 570, postClose: 870, lat: 25.2, lng: 55.3, abbr: 'DFM', currency: 'AED', index: 'DFM Index', lunchStart: 0, lunchEnd: 0 },
  { name: 'Riyadh (Tadawul)', tz: 'Asia/Riyadh', open: 600, close: 900, preOpen: 570, postClose: 930, lat: 24.7, lng: 46.7, abbr: 'TDWL', currency: 'SAR', index: 'Tadawul All Share', lunchStart: 0, lunchEnd: 0 },
  { name: 'Istanbul (BIST)', tz: 'Europe/Istanbul', open: 600, close: 1080, preOpen: 555, postClose: 1080, lat: 41.0, lng: 29.0, abbr: 'BIST', currency: 'TRY', index: 'BIST 100', lunchStart: 720, lunchEnd: 840 },
  { name: 'Warsaw (WSE)', tz: 'Europe/Warsaw', open: 540, close: 1020, preOpen: 480, postClose: 1020, lat: 52.2, lng: 21.0, abbr: 'WSE', currency: 'PLN', index: 'WIG 20', lunchStart: 0, lunchEnd: 0 },
  { name: 'Jakarta (IDX)', tz: 'Asia/Jakarta', open: 540, close: 930, preOpen: 510, postClose: 960, lat: -6.2, lng: 106.8, abbr: 'IDX', currency: 'IDR', index: 'JCI', lunchStart: 0, lunchEnd: 0 },
  { name: 'Bangkok (SET)', tz: 'Asia/Bangkok', open: 600, close: 1020, preOpen: 570, postClose: 1020, lat: 13.8, lng: 100.5, abbr: 'SET', currency: 'THB', index: 'SET Index', lunchStart: 720, lunchEnd: 810 },
];

// Country data for click-on-country summaries
const COUNTRY_DATA: Record<string, { name: string; gdp: string; gdpGrowth: string; inflation: string; rate: string; debt: string; unemployment: string; population: string; creditRating: string; currency: string; mainExchange: string; marketCap: string; topSectors: string }> = {
  'USA': { name: 'United States', gdp: '$28.78T', gdpGrowth: '+2.5%', inflation: '3.0%', rate: '5.25%', debt: '123% GDP', unemployment: '3.7%', population: '335M', creditRating: 'AA+/Aaa', currency: 'USD', mainExchange: 'NYSE/NASDAQ', marketCap: '$50.8T', topSectors: 'Tech, Healthcare, Finance' },
  'GBR': { name: 'United Kingdom', gdp: '$3.33T', gdpGrowth: '+0.3%', inflation: '4.0%', rate: '5.25%', debt: '101% GDP', unemployment: '4.2%', population: '68M', creditRating: 'AA/Aa3', currency: 'GBP', mainExchange: 'LSE', marketCap: '$3.1T', topSectors: 'Finance, Energy, Mining' },
  'JPN': { name: 'Japan', gdp: '$4.23T', gdpGrowth: '+1.9%', inflation: '3.3%', rate: '-0.10%', debt: '255% GDP', unemployment: '2.5%', population: '125M', creditRating: 'A+/A1', currency: 'JPY', mainExchange: 'TSE', marketCap: '$6.3T', topSectors: 'Auto, Electronics, Finance' },
  'CHN': { name: 'China', gdp: '$17.96T', gdpGrowth: '+5.2%', inflation: '0.2%', rate: '3.45%', debt: '83% GDP', unemployment: '5.2%', population: '1.41B', creditRating: 'A+/A1', currency: 'CNY', mainExchange: 'SSE/SZSE', marketCap: '$8.7T', topSectors: 'Tech, Manufacturing, Finance' },
  'DEU': { name: 'Germany', gdp: '$4.46T', gdpGrowth: '-0.3%', inflation: '3.7%', rate: '4.50%', debt: '64% GDP', unemployment: '5.7%', population: '84M', creditRating: 'AAA/Aaa', currency: 'EUR', mainExchange: 'XETRA', marketCap: '$2.2T', topSectors: 'Auto, Chemicals, Engineering' },
  'FRA': { name: 'France', gdp: '$3.05T', gdpGrowth: '+0.7%', inflation: '3.5%', rate: '4.50%', debt: '112% GDP', unemployment: '7.3%', population: '68M', creditRating: 'AA/Aa2', currency: 'EUR', mainExchange: 'Euronext Paris', marketCap: '$2.8T', topSectors: 'Luxury, Aerospace, Energy' },
  'CAN': { name: 'Canada', gdp: '$2.14T', gdpGrowth: '+1.1%', inflation: '3.1%', rate: '5.00%', debt: '107% GDP', unemployment: '5.8%', population: '40M', creditRating: 'AAA/Aaa', currency: 'CAD', mainExchange: 'TSX', marketCap: '$2.5T', topSectors: 'Energy, Mining, Finance' },
  'AUS': { name: 'Australia', gdp: '$1.69T', gdpGrowth: '+2.1%', inflation: '4.1%', rate: '4.35%', debt: '52% GDP', unemployment: '3.9%', population: '26M', creditRating: 'AAA/Aaa', currency: 'AUD', mainExchange: 'ASX', marketCap: '$1.6T', topSectors: 'Mining, Finance, Healthcare' },
  'IND': { name: 'India', gdp: '$3.73T', gdpGrowth: '+7.6%', inflation: '5.6%', rate: '6.50%', debt: '83% GDP', unemployment: '7.7%', population: '1.44B', creditRating: 'BBB-/Baa3', currency: 'INR', mainExchange: 'BSE/NSE', marketCap: '$4.3T', topSectors: 'IT, Finance, Pharma' },
  'BRA': { name: 'Brazil', gdp: '$2.13T', gdpGrowth: '+2.9%', inflation: '4.6%', rate: '11.75%', debt: '75% GDP', unemployment: '7.8%', population: '216M', creditRating: 'BB-/Ba2', currency: 'BRL', mainExchange: 'B3', marketCap: '$0.9T', topSectors: 'Commodities, Finance, Energy' },
  'KOR': { name: 'South Korea', gdp: '$1.71T', gdpGrowth: '+1.4%', inflation: '3.6%', rate: '3.50%', debt: '54% GDP', unemployment: '2.6%', population: '52M', creditRating: 'AA/Aa2', currency: 'KRW', mainExchange: 'KRX', marketCap: '$1.8T', topSectors: 'Semicon, Auto, Shipbuilding' },
  'MEX': { name: 'Mexico', gdp: '$1.32T', gdpGrowth: '+3.2%', inflation: '4.3%', rate: '11.25%', debt: '53% GDP', unemployment: '2.8%', population: '131M', creditRating: 'BBB/Baa2', currency: 'MXN', mainExchange: 'BMV', marketCap: '$0.5T', topSectors: 'Manufacturing, Mining, Oil' },
  'CHE': { name: 'Switzerland', gdp: '$0.91T', gdpGrowth: '+0.7%', inflation: '1.7%', rate: '1.75%', debt: '38% GDP', unemployment: '2.0%', population: '9M', creditRating: 'AAA/Aaa', currency: 'CHF', mainExchange: 'SIX', marketCap: '$1.8T', topSectors: 'Pharma, Finance, Luxury' },
  'RUS': { name: 'Russia', gdp: '$1.86T', gdpGrowth: '+3.6%', inflation: '7.4%', rate: '16.00%', debt: '20% GDP', unemployment: '2.9%', population: '144M', creditRating: 'NR', currency: 'RUB', mainExchange: 'MOEX', marketCap: '$0.6T', topSectors: 'Energy, Mining, Defense' },
  'SGP': { name: 'Singapore', gdp: '$0.40T', gdpGrowth: '+1.1%', inflation: '3.6%', rate: 'N/A (MAS)', debt: '168% GDP', unemployment: '2.0%', population: '6M', creditRating: 'AAA/Aaa', currency: 'SGD', mainExchange: 'SGX', marketCap: '$0.6T', topSectors: 'Finance, Tech, Shipping' },
  'ZAF': { name: 'South Africa', gdp: '$0.40T', gdpGrowth: '+0.6%', inflation: '5.5%', rate: '8.25%', debt: '73% GDP', unemployment: '32.1%', population: '62M', creditRating: 'BB-/Ba2', currency: 'ZAR', mainExchange: 'JSE', marketCap: '$0.9T', topSectors: 'Mining, Finance, Telecom' },
  'SAU': { name: 'Saudi Arabia', gdp: '$1.07T', gdpGrowth: '-0.8%', inflation: '1.6%', rate: '6.00%', debt: '26% GDP', unemployment: '4.9%', population: '37M', creditRating: 'A/A1', currency: 'SAR', mainExchange: 'Tadawul', marketCap: '$2.7T', topSectors: 'Oil & Gas, Finance, Petrochemicals' },
  'ARE': { name: 'UAE', gdp: '$0.51T', gdpGrowth: '+3.4%', inflation: '2.3%', rate: '5.40%', debt: '30% GDP', unemployment: '2.9%', population: '10M', creditRating: 'AA/Aa2', currency: 'AED', mainExchange: 'DFM/ADX', marketCap: '$0.8T', topSectors: 'Finance, Real Estate, Oil' },
  'TUR': { name: 'Turkey', gdp: '$1.11T', gdpGrowth: '+4.5%', inflation: '65%', rate: '45.00%', debt: '35% GDP', unemployment: '9.4%', population: '86M', creditRating: 'B/B3', currency: 'TRY', mainExchange: 'BIST', marketCap: '$0.2T', topSectors: 'Finance, Industry, Tourism' },
  'IDN': { name: 'Indonesia', gdp: '$1.37T', gdpGrowth: '+5.1%', inflation: '2.6%', rate: '6.25%', debt: '39% GDP', unemployment: '5.3%', population: '277M', creditRating: 'BBB/Baa2', currency: 'IDR', mainExchange: 'IDX', marketCap: '$0.5T', topSectors: 'Commodities, Finance, Telecom' },
  'THA': { name: 'Thailand', gdp: '$0.51T', gdpGrowth: '+1.9%', inflation: '0.6%', rate: '2.50%', debt: '62% GDP', unemployment: '1.0%', population: '72M', creditRating: 'BBB+/Baa1', currency: 'THB', mainExchange: 'SET', marketCap: '$0.5T', topSectors: 'Tourism, Auto, Electronics' },
  'TWN': { name: 'Taiwan', gdp: '$0.79T', gdpGrowth: '+1.3%', inflation: '2.5%', rate: '1.875%', debt: '28% GDP', unemployment: '3.4%', population: '24M', creditRating: 'AA/Aa3', currency: 'TWD', mainExchange: 'TWSE', marketCap: '$1.9T', topSectors: 'Semiconductors, Electronics, Tech' },
  'NLD': { name: 'Netherlands', gdp: '$1.09T', gdpGrowth: '+0.1%', inflation: '1.2%', rate: '4.50%', debt: '47% GDP', unemployment: '3.6%', population: '18M', creditRating: 'AAA/Aaa', currency: 'EUR', mainExchange: 'Euronext Amsterdam', marketCap: '$1.2T', topSectors: 'Tech, Energy, Finance' },
  'ESP': { name: 'Spain', gdp: '$1.58T', gdpGrowth: '+2.5%', inflation: '3.5%', rate: '4.50%', debt: '107% GDP', unemployment: '11.8%', population: '48M', creditRating: 'A/Baa1', currency: 'EUR', mainExchange: 'BME', marketCap: '$0.7T', topSectors: 'Finance, Telecom, Utilities' },
  'ITA': { name: 'Italy', gdp: '$2.19T', gdpGrowth: '+0.7%', inflation: '1.0%', rate: '4.50%', debt: '140% GDP', unemployment: '7.2%', population: '59M', creditRating: 'BBB/Baa3', currency: 'EUR', mainExchange: 'Borsa Italiana', marketCap: '$0.8T', topSectors: 'Finance, Luxury, Energy' },
  'POL': { name: 'Poland', gdp: '$0.84T', gdpGrowth: '+0.2%', inflation: '6.2%', rate: '5.75%', debt: '49% GDP', unemployment: '5.0%', population: '38M', creditRating: 'A-/A2', currency: 'PLN', mainExchange: 'WSE', marketCap: '$0.2T', topSectors: 'Finance, Energy, IT' },
};

function fmtMins(totalMins: number) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getMarketStatusForTZ(market: typeof GLOBAL_MARKETS[0]) {
  const now = new Date();
  const localStr = now.toLocaleString('en-US', { timeZone: market.tz });
  const local = new Date(localStr);
  const h = local.getHours(), m = local.getMinutes(), day = local.getDay();
  const mins = h * 60 + m;
  const timeStr = local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = local.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const openStr = `${Math.floor(market.open / 60)}:${(market.open % 60).toString().padStart(2, '0')}`;
  const closeStr = `${Math.floor(market.close / 60)}:${(market.close % 60).toString().padStart(2, '0')}`;
  const hoursStr = `${openStr}–${closeStr}`;
  const isLunch = market.lunchStart > 0 && mins >= market.lunchStart && mins < market.lunchEnd;

  if (day === 0 || day === 6) {
    const tillOpen = ((1 + (day === 0 ? 0 : 6)) * 1440) + market.open - mins;
    return { status: 'CLOSED' as const, label: 'Weekend', time: timeStr, date: dateStr, hoursStr, countdown: `Opens in ${fmtMins(tillOpen)}`, isLunch: false };
  }
  if (mins >= market.open && mins < market.close) {
    const tillClose = market.close - mins;
    return { status: 'OPEN' as const, label: isLunch ? 'Lunch Break' : 'Open', time: timeStr, date: dateStr, hoursStr, countdown: `Closes in ${fmtMins(tillClose)}`, isLunch };
  }
  if (mins >= market.preOpen && mins < market.open) {
    const tillOpen = market.open - mins;
    return { status: 'PRE' as const, label: 'Pre-Market', time: timeStr, date: dateStr, hoursStr, countdown: `Opens in ${fmtMins(tillOpen)}`, isLunch: false };
  }
  if (mins >= market.close && mins < market.postClose) {
    return { status: 'AFTER' as const, label: 'After Hours', time: timeStr, date: dateStr, hoursStr, countdown: 'Session ended', isLunch: false };
  }
  const tillOpen = mins < market.open ? market.open - mins : (1440 - mins) + market.open;
  return { status: 'CLOSED' as const, label: 'Closed', time: timeStr, date: dateStr, hoursStr, countdown: `Opens in ${fmtMins(tillOpen)}`, isLunch: false };
}

// Country data detail card
function CountryDataCard({ data, onClose }: { data: typeof COUNTRY_DATA[string]; onClose: () => void }) {
  const rows = [
    { label: 'GDP', value: data.gdp, sub: data.gdpGrowth, color: data.gdpGrowth.startsWith('+') ? 'text-positive' : 'text-negative' },
    { label: 'Inflation', value: data.inflation },
    { label: 'Central Bank Rate', value: data.rate },
    { label: 'Debt/GDP', value: data.debt },
    { label: 'Unemployment', value: data.unemployment },
    { label: 'Population', value: data.population },
    { label: 'Credit Rating', value: data.creditRating },
    { label: 'Market Cap', value: data.marketCap },
    { label: 'Exchange', value: data.mainExchange },
    { label: 'Top Sectors', value: data.topSectors },
  ];

  return (
    <div className="mt-2 bg-surface-deep border border-border rounded-sm overflow-hidden animate-in slide-in-from-top-1 duration-200">
      <div className="px-3 py-2 bg-surface-elevated border-b border-border flex items-center justify-between">
        <div className="font-mono font-bold text-foreground text-[12px]">🏳️ {data.name} — {data.currency}</div>
        <button onClick={onClose} className="p-0.5 hover:bg-accent/10 rounded-sm"><X className="w-3 h-3 text-muted-foreground" /></button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between items-baseline text-[9px] font-mono py-0.5 border-b border-border/30">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={`font-bold ${r.color || 'text-foreground'}`}>
              {r.value}
              {r.sub && <span className={`ml-1 ${r.color || ''}`}>({r.sub})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Globe Component (Real Map) ──────────────────────────────────────
type RegionKey = 'all' | 'americas' | 'emea' | 'apac' | 'mena' | 'latam' | 'europe' | 'asia';
type StatusFilter = 'all' | 'open' | 'pre' | 'post' | 'ext' | 'closed' | 'lunch';
type CurrencyFilter = 'all' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'OTHER';
type ThemeKey = 'dark' | 'midnight' | 'slate' | 'topo' | 'contrast' | 'sepia';
type SunMode = 'none' | 'terminator' | 'shade' | 'altitude' | 'civil';
type LabelMode = 'none' | 'abbr' | 'full' | 'index';
type GraticuleMode = 'none' | 'minor' | 'major' | 'full';
type HighlightMode = 'none' | 'tropics' | 'polar' | 'equator' | 'all';
type ProjectionMode = 'mercator' | 'equal-earth' | 'natural-earth';

const THEME_PALETTES: Record<ThemeKey, { ocean: string; landData: string; landNo: string; strokeData: string; strokeNo: string; selFill: string; selStroke: string }> = {
  dark:     { ocean: 'hsl(212, 32%, 7%)',  landData: 'hsl(205, 18%, 22%)', landNo: 'hsl(208, 12%, 16%)', strokeData: 'hsl(210, 18%, 32%)', strokeNo: 'hsl(210, 14%, 24%)', selFill: 'hsl(210, 45%, 32%)', selStroke: 'hsl(33, 100%, 55%)' },
  midnight: { ocean: 'hsl(225, 45%, 4%)',  landData: 'hsl(225, 30%, 14%)', landNo: 'hsl(225, 22%, 10%)', strokeData: 'hsl(225, 30%, 24%)', strokeNo: 'hsl(225, 22%, 18%)', selFill: 'hsl(220, 60%, 28%)', selStroke: 'hsl(195, 100%, 60%)' },
  slate:    { ocean: 'hsl(210, 8%, 9%)',   landData: 'hsl(210, 5%, 22%)',  landNo: 'hsl(210, 4%, 16%)',  strokeData: 'hsl(210, 6%, 32%)',  strokeNo: 'hsl(210, 5%, 24%)',  selFill: 'hsl(210, 10%, 32%)', selStroke: 'hsl(33, 100%, 55%)' },
  topo:     { ocean: 'hsl(200, 50%, 8%)',  landData: 'hsl(95, 25%, 22%)',  landNo: 'hsl(95, 18%, 16%)',  strokeData: 'hsl(95, 25%, 32%)',  strokeNo: 'hsl(95, 18%, 24%)',  selFill: 'hsl(45, 60%, 35%)',  selStroke: 'hsl(15, 100%, 55%)' },
  contrast: { ocean: 'hsl(0, 0%, 4%)',     landData: 'hsl(0, 0%, 25%)',    landNo: 'hsl(0, 0%, 14%)',    strokeData: 'hsl(0, 0%, 55%)',    strokeNo: 'hsl(0, 0%, 32%)',    selFill: 'hsl(60, 100%, 45%)', selStroke: 'hsl(60, 100%, 70%)' },
  sepia:    { ocean: 'hsl(30, 25%, 8%)',   landData: 'hsl(30, 20%, 22%)',  landNo: 'hsl(30, 15%, 16%)',  strokeData: 'hsl(30, 25%, 35%)',  strokeNo: 'hsl(30, 18%, 25%)',  selFill: 'hsl(25, 50%, 32%)',  selStroke: 'hsl(20, 100%, 55%)' },
};

function getMarketRegion(market: typeof GLOBAL_MARKETS[0]): 'americas' | 'emea' | 'apac' {
  if (market.tz.startsWith('America/')) return 'americas';
  if (market.tz.startsWith('Europe/') || market.tz.startsWith('Africa/') || ['Asia/Dubai', 'Asia/Riyadh'].includes(market.tz)) return 'emea';
  return 'apac';
}

function matchesRegionFilter(market: typeof GLOBAL_MARKETS[0], filter: RegionKey): boolean {
  if (filter === 'all') return true;
  const r = getMarketRegion(market);
  if (filter === 'americas' || filter === 'emea' || filter === 'apac') return r === filter;
  if (filter === 'europe') return market.tz.startsWith('Europe/');
  if (filter === 'asia') return market.tz.startsWith('Asia/') && !['Asia/Dubai', 'Asia/Riyadh'].includes(market.tz);
  if (filter === 'mena') return ['Asia/Dubai', 'Asia/Riyadh', 'Europe/Istanbul', 'Africa/Johannesburg'].includes(market.tz);
  if (filter === 'latam') return ['America/Sao_Paulo', 'America/Mexico_City'].includes(market.tz);
  return true;
}

// Compact dropdown control
function FilterDropdown<T extends string>({ label, value, options, onChange, width = 'w-[100px]' }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`${width} flex items-center justify-between gap-1 px-2 py-1 bg-surface-deep border border-border hover:border-accent/50 transition-colors text-[9px] font-mono`}
      >
        <span className="text-muted-foreground/70 uppercase">{label}</span>
        <span className="text-accent font-bold flex-1 text-right truncate">{current?.label ?? value}</span>
        <ChevronDown className={`w-2.5 h-2.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-0.5 left-0 right-0 bg-surface-elevated border border-accent/40 shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-2 py-1 text-[9px] font-mono hover:bg-accent/15 transition-colors ${
                opt.value === value ? 'bg-accent/20 text-accent font-bold' : 'text-foreground'
              }`}
            >{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketGlobe({ markets, expanded = false, onToggleExpand }: { markets: typeof GLOBAL_MARKETS; expanded?: boolean; onToggleExpand?: () => void }) {
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null);
  const [hoveredMarket, setHoveredMarket] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [regionFilter, setRegionFilter] = useState<RegionKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');
  const [theme, setTheme] = useState<ThemeKey>('dark');
  const [sunMode, setSunMode] = useState<SunMode>('terminator');
  const [labelMode, setLabelMode] = useState<LabelMode>('abbr');
  const [graticule, setGraticule] = useState<GraticuleMode>('major');
  const [highlights, setHighlights] = useState<HighlightMode>('all');

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const sel = selectedMarket !== null ? markets[selectedMarket] : null;
  const selStatus = sel ? getMarketStatusForTZ(sel) : null;
  const pulse = (Math.sin(tick * 0.5) + 1) / 2;

  const sessionProgress = sel ? (() => {
    const s = getMarketStatusForTZ(sel);
    if (s.status !== 'OPEN') return null;
    const now2 = new Date();
    const localStr = now2.toLocaleString('en-US', { timeZone: sel.tz });
    const local = new Date(localStr);
    const mins = local.getHours() * 60 + local.getMinutes();
    const total = sel.close - sel.open;
    const elapsed = mins - sel.open;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  })() : null;

  const terminatorPoints = useMemo(() => {
    const now = new Date();
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const sunDeclination = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const sunLng = -((utcH / 24) * 360 - 180);
    const points: [number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      const hourAngle = (lon - sunLng) * Math.PI / 180;
      const decRad = sunDeclination * Math.PI / 180;
      const terminatorLat = Math.atan(-Math.cos(hourAngle) / Math.tan(decRad)) * 180 / Math.PI;
      points.push([lon, terminatorLat]);
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(tick / 60)]);

  const mapHeight = expanded ? 560 : 380;
  const palette = THEME_PALETTES[theme];

  // Sun position (for shading / altitude overlays)
  const sunPos = useMemo(() => {
    const now = new Date();
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const sunLng = -((utcH / 24) * 360 - 180);
    return { lng: sunLng, decl: declination };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(tick / 60)]);

  // Solar altitude grid for shade/altitude overlays (every 12°)
  const solarGrid = useMemo(() => {
    const cells: { lng: number; lat: number; alt: number }[] = [];
    const step = 12;
    const decRad = sunPos.decl * Math.PI / 180;
    for (let lat = -84; lat <= 84; lat += step) {
      for (let lng = -180; lng < 180; lng += step) {
        const latRad = lat * Math.PI / 180;
        const hourAngle = (lng - sunPos.lng) * Math.PI / 180;
        const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle);
        const altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
        cells.push({ lng, lat, alt: altDeg });
      }
    }
    return { cells, step };
  }, [sunPos]);
  const countryData = selectedCountry ? COUNTRY_DATA[selectedCountry] : null;

  return (
    <div>
      <div className="relative border border-border rounded-sm overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(215, 35%, 5%) 0%, hsl(210, 30%, 8%) 50%, hsl(215, 35%, 5%) 100%)' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: expanded ? 160 : 120, center: [10, 20] }}
          height={mapHeight}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup>
            {/* Ocean base */}
            <rect x={-1000} y={-1000} width={3000} height={3000} fill={palette.ocean} />

            {/* Solar altitude / shade overlay (rendered before geographies) */}
            {(sunMode === 'shade' || sunMode === 'altitude' || sunMode === 'civil') && solarGrid.cells.map(({ lng, lat, alt }, idx) => {
              let fill = '';
              if (sunMode === 'shade') {
                // Day/night blanket — dark over night side
                const opacity = Math.max(0, Math.min(0.55, (-alt) / 90 * 0.7));
                if (opacity < 0.02) return null;
                fill = `rgba(5, 10, 25, ${opacity})`;
              } else if (sunMode === 'altitude') {
                // Heatmap of solar altitude (cold blue → hot orange)
                const t = (alt + 90) / 180; // 0..1
                const hue = 240 - t * 220; // 240(blue) -> 20(orange)
                const lightness = 30 + t * 30;
                const opacity = 0.35;
                fill = `hsla(${hue}, 80%, ${lightness}%, ${opacity})`;
              } else {
                // Civil twilight bands: night / astronomical / nautical / civil / day
                let band = '';
                if (alt < -18) band = 'rgba(2, 4, 15, 0.55)';
                else if (alt < -12) band = 'rgba(15, 25, 60, 0.45)';
                else if (alt < -6) band = 'rgba(40, 60, 110, 0.35)';
                else if (alt < 0) band = 'rgba(120, 90, 60, 0.30)';
                else if (alt < 10) band = 'rgba(255, 180, 90, 0.18)';
                else return null;
                fill = band;
              }
              return <rect key={`sun-${idx}`} x={lng - solarGrid.step / 2} y={lat - solarGrid.step / 2} width={solarGrid.step} height={solarGrid.step} fill={fill} pointerEvents="none" />;
            })}

            {/* Minor graticule — every 10° */}
            {(graticule === 'minor' || graticule === 'full') && Array.from({ length: 37 }, (_, i) => (i - 18) * 10).map(lng => (
              <Line key={`mlng-${lng}`} from={[lng, -82]} to={[lng, 82]}
                stroke="rgba(90, 130, 170, 0.05)" strokeWidth={0.2} />
            ))}
            {(graticule === 'minor' || graticule === 'full') && Array.from({ length: 17 }, (_, i) => (i - 8) * 10).map(lat => (
              <Line key={`mlat-${lat}`} from={[-180, lat]} to={[180, lat]}
                stroke="rgba(90, 130, 170, 0.05)" strokeWidth={0.2} />
            ))}

            {/* Major graticule — every 30° */}
            {(graticule === 'major' || graticule === 'full') && Array.from({ length: 13 }, (_, i) => (i - 6) * 30).map(lng => (
              <Line key={`lng-${lng}`} from={[lng, -82]} to={[lng, 82]}
                stroke="rgba(110, 150, 190, 0.12)" strokeWidth={0.35} />
            ))}
            {(graticule === 'major' || graticule === 'full') && Array.from({ length: 7 }, (_, i) => (i - 3) * 30).map(lat => (
              <Line key={`lat-${lat}`} from={[-180, lat]} to={[180, lat]}
                stroke="rgba(110, 150, 190, 0.12)" strokeWidth={0.35} />
            ))}

            {/* Tropic of Cancer / Capricorn */}
            {(highlights === 'tropics' || highlights === 'all') && <>
              <Line from={[-180, 23.4]} to={[180, 23.4]} stroke="rgba(255, 180, 80, 0.25)" strokeWidth={0.4} strokeDasharray="2 2" />
              <Line from={[-180, -23.4]} to={[180, -23.4]} stroke="rgba(255, 180, 80, 0.25)" strokeWidth={0.4} strokeDasharray="2 2" />
            </>}

            {/* Arctic / Antarctic circles */}
            {(highlights === 'polar' || highlights === 'all') && <>
              <Line from={[-180, 66.5]} to={[180, 66.5]} stroke="rgba(140, 200, 255, 0.22)" strokeWidth={0.4} strokeDasharray="2 2" />
              <Line from={[-180, -66.5]} to={[180, -66.5]} stroke="rgba(140, 200, 255, 0.22)" strokeWidth={0.4} strokeDasharray="2 2" />
            </>}

            {/* Equator + Prime Meridian */}
            {(highlights === 'equator' || highlights === 'all') && <>
              <Line from={[-180, 0]} to={[180, 0]} stroke="rgba(120, 180, 240, 0.3)" strokeWidth={0.6} />
              <Line from={[0, -82]} to={[0, 82]} stroke="rgba(120, 180, 240, 0.2)" strokeWidth={0.5} />
            </>}
            {/* International Date Line */}
            {highlights === 'all' && <>
              <Line from={[180, -82]} to={[180, 82]} stroke="rgba(255, 200, 100, 0.15)" strokeWidth={0.4} strokeDasharray="3 3" />
              <Line from={[-180, -82]} to={[-180, 82]} stroke="rgba(255, 200, 100, 0.15)" strokeWidth={0.4} strokeDasharray="3 3" />
            </>}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoA3 = geo.properties?.['ISO_A3'] || geo.id;
                  const hasData = !!COUNTRY_DATA[isoA3];
                  const isSelected = selectedCountry === isoA3;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? palette.selFill : hasData ? palette.landData : palette.landNo}
                      stroke={isSelected ? palette.selStroke : hasData ? palette.strokeData : palette.strokeNo}
                      strokeWidth={isSelected ? 1.2 : hasData ? 0.5 : 0.35}
                      onClick={() => {
                        if (hasData) {
                          setSelectedCountry(isSelected ? null : isoA3);
                          setSelectedMarket(null);
                        }
                      }}
                      style={{
                        default: { outline: 'none', cursor: hasData ? 'pointer' : 'default' },
                        hover: { fill: hasData ? 'hsl(205, 25%, 30%)' : 'hsl(208, 14%, 19%)', outline: 'none', cursor: hasData ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Day/night terminator line */}
            {(sunMode === 'terminator' || sunMode === 'civil') && terminatorPoints.length > 1 && terminatorPoints.slice(0, -1).map((pt, i) => (
              <Line key={`term-${i}`} from={pt} to={terminatorPoints[i + 1]}
                stroke="rgba(255, 200, 100, 0.45)" strokeWidth={0.8} />
            ))}

            {/* Latitude labels at left edge */}
            {[-60, -30, 0, 30, 60].map(lat => (
              <Marker key={`latlbl-${lat}`} coordinates={[-178, lat]}>
                <text textAnchor="start" style={{
                  fontFamily: 'monospace', fontSize: '5px', fill: 'rgba(140, 170, 200, 0.5)',
                  paintOrder: 'stroke', stroke: 'hsl(212, 32%, 7%)', strokeWidth: 1.5,
                }}>{lat > 0 ? `${lat}°N` : lat < 0 ? `${Math.abs(lat)}°S` : 'EQ'}</text>
              </Marker>
            ))}
            {/* Longitude labels at equator */}
            {[-120, -60, 0, 60, 120].map(lng => (
              <Marker key={`lnglbl-${lng}`} coordinates={[lng, -2]}>
                <text textAnchor="middle" style={{
                  fontFamily: 'monospace', fontSize: '5px', fill: 'rgba(140, 170, 200, 0.45)',
                  paintOrder: 'stroke', stroke: 'hsl(212, 32%, 7%)', strokeWidth: 1.5,
                }}>{lng === 0 ? '0°' : lng > 0 ? `${lng}°E` : `${Math.abs(lng)}°W`}</text>
              </Marker>
            ))}

            {markets.map((market, i) => {
              const status = getMarketStatusForTZ(market);
              const isOpen = status.status === 'OPEN';
              const isPre = status.status === 'PRE' || status.status === 'AFTER';
              const isSelected = selectedMarket === i;
              const isHovered = hoveredMarket === i;
              const active = isSelected || isHovered;
              const region = getMarketRegion(market);
              const matchesRegion = matchesRegionFilter(market, regionFilter);
              const isLunch = !!status.isLunch;
              const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'open' && isOpen) ||
                (statusFilter === 'pre' && status.status === 'PRE') ||
                (statusFilter === 'post' && status.status === 'AFTER') ||
                (statusFilter === 'ext' && isPre) ||
                (statusFilter === 'closed' && !isOpen && !isPre) ||
                (statusFilter === 'lunch' && isLunch);
              const matchesCurrency =
                currencyFilter === 'all' ||
                (currencyFilter === 'OTHER' ? !['USD', 'EUR', 'GBP', 'JPY', 'CNY'].includes(market.currency) : market.currency === currencyFilter);
              if (!active && (!matchesRegion || !matchesStatus || !matchesCurrency)) return null;
              const dotColor = isOpen ? 'hsl(145, 75%, 65%)' : isPre ? 'hsl(35, 100%, 55%)' : 'hsl(0, 55%, 50%)';
              const glowColor = isOpen ? 'rgba(80, 230, 140, 0.25)' : isPre ? 'rgba(255, 165, 0, 0.2)' : 'rgba(200, 60, 60, 0.1)';
              const baseR = expanded ? 3.5 : 2.5;
              const dotR = active ? baseR + 1.5 : baseR;
              const glowR = isOpen ? (baseR + 5 + pulse * 3) : (baseR + 3);

              return (
                <Marker key={i} coordinates={[market.lng, market.lat]}
                  onClick={() => { setSelectedMarket(i === selectedMarket ? null : i); setSelectedCountry(null); }}
                  onMouseEnter={() => setHoveredMarket(i)}
                  onMouseLeave={() => setHoveredMarket(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {(isOpen || isPre || active) && <circle r={glowR} fill={glowColor} />}
                  <circle r={dotR + 1} fill="none" stroke={dotColor} strokeWidth={active ? 1 : 0.5} opacity={0.5} />
                  <circle r={dotR} fill={dotColor} />
                  <circle r={dotR * 0.35} fill="white" opacity={0.25} cx={-dotR * 0.15} cy={-dotR * 0.15} />
                  {(labelMode !== 'none' || active) && (
                    <text textAnchor="middle" y={-(dotR + (active ? 5 : 3))}
                      style={{
                        fontFamily: 'monospace', fontSize: active ? (expanded ? '9px' : '8px') : (expanded ? '7px' : '6px'),
                        fontWeight: active ? 'bold' : 'normal', fill: active ? 'hsl(210, 20%, 95%)' : 'rgba(160, 180, 200, 0.55)',
                        paintOrder: 'stroke', stroke: 'hsl(215, 25%, 6%)', strokeWidth: active ? 3 : 2, strokeLinejoin: 'round',
                      }}
                    >{
                      active && expanded ? market.name.split('(')[0].trim()
                      : labelMode === 'full' ? market.name.split('(')[0].trim()
                      : labelMode === 'index' ? market.index
                      : market.abbr
                    }</text>
                  )}
                  {active && (
                    <text textAnchor="middle" y={dotR + (expanded ? 10 : 8)}
                      style={{
                        fontFamily: 'monospace', fontSize: expanded ? '6px' : '5px', fontWeight: 'bold', fill: dotColor,
                        paintOrder: 'stroke', stroke: 'hsl(215, 25%, 6%)', strokeWidth: 2, strokeLinejoin: 'round',
                      }}
                    >{status.label.toUpperCase()}</text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {onToggleExpand && (
          <button onClick={onToggleExpand}
            className="absolute top-2 right-2 p-1.5 bg-surface-elevated/80 border border-border rounded-sm hover:bg-accent/20 transition-colors z-10"
            title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded-sm border border-border/40 text-[7px] font-mono z-10 backdrop-blur-sm" style={{ background: 'hsla(215, 25%, 6%, 0.75)', color: 'rgba(170, 190, 220, 0.8)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(145, 75%, 65%)', boxShadow: '0 0 4px hsl(145, 75%, 65%)' }} />OPEN</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(35, 100%, 55%)' }} />EXT</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(0, 55%, 50%)' }} />CLOSED</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px" style={{ backgroundColor: 'rgba(255, 200, 100, 0.5)' }} />TERM</span>
        </div>

        {/* Status counter */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-sm border border-border/40 text-[8px] font-mono z-10 backdrop-blur-sm" style={{ background: 'hsla(215, 25%, 6%, 0.75)' }}>
          <span className="text-positive font-bold">{markets.filter(m => getMarketStatusForTZ(m).status === 'OPEN').length}</span>
          <span className="text-muted-foreground">/{markets.length} OPEN</span>
          <span className="text-muted-foreground/40 mx-1">·</span>
          <span className="text-muted-foreground">{new Date().toUTCString().split(' ')[4]} UTC</span>
        </div>

        <div className="absolute bottom-2 right-2 text-[6px] font-mono text-muted-foreground/40 z-10">
          Click country / dot · Drag to pan · Scroll to zoom
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mt-1 border border-border rounded-sm overflow-hidden" style={{ background: 'hsl(215, 15%, 8%)' }}>
        <div className="relative h-6">
          {Array.from({ length: 24 }, (_, hr) => (
            <div key={hr} className="absolute top-0 bottom-0" style={{ left: `${(hr / 24) * 100}%` }}>
              <div className="h-full border-l" style={{ borderColor: hr % 3 === 0 ? 'rgba(120, 150, 180, 0.2)' : 'rgba(80, 110, 140, 0.08)' }} />
              {hr % 3 === 0 && <span className="absolute bottom-0 left-1 text-[6px] font-mono" style={{ color: 'rgba(120, 150, 180, 0.4)' }}>{hr.toString().padStart(2, '0')}</span>}
            </div>
          ))}
          {markets.map((market, i) => {
            const status = getMarketStatusForTZ(market);
            const isOpen = status.status === 'OPEN';
            const isPre = status.status === 'PRE' || status.status === 'AFTER';
            const mktOffset = (() => {
              const nowLocal = new Date().toLocaleString('en-US', { timeZone: market.tz });
              return (new Date(nowLocal).getTime() - new Date().getTime()) / 60000;
            })();
            const openUTC = ((market.open - mktOffset + 1440) % 1440) / 1440 * 100;
            const closeUTC = ((market.close - mktOffset + 1440) % 1440) / 1440 * 100;
            const barW = closeUTC > openUTC ? closeUTC - openUTC : 100 - openUTC + closeUTC;
            const barColor = isOpen ? 'hsla(145, 70%, 55%, 0.5)' : isPre ? 'hsla(35, 100%, 50%, 0.3)' : 'hsla(220, 30%, 50%, 0.12)';
            return <div key={i} className="absolute" style={{ left: `${openUTC}%`, width: `${Math.min(barW, 100)}%`, top: `${1 + (i % 6) * 3}px`, height: '2px', backgroundColor: barColor, borderRadius: '1px' }} />;
          })}
          <div className="absolute top-0 bottom-0 w-px" style={{ left: `${((new Date().getUTCHours() + new Date().getUTCMinutes() / 60) / 24) * 100}%`, backgroundColor: 'rgba(255, 200, 100, 0.5)' }}>
            <span className="absolute -top-3 -translate-x-1/2 text-[6px] font-mono" style={{ color: 'rgba(255, 200, 100, 0.6)' }}>UTC</span>
          </div>
        </div>
      </div>

      {/* Country data card */}
      {countryData && <CountryDataCard data={countryData} onClose={() => setSelectedCountry(null)} />}

      {/* Market detail card */}
      {sel && selStatus && (
        <div className={`mt-2 bg-surface-deep border border-border rounded-sm overflow-hidden ${expanded ? 'grid grid-cols-2 gap-0' : ''}`}>
          <div className={expanded ? 'col-span-2' : ''}>
            <div className="px-3 py-2 bg-surface-elevated border-b border-border flex items-center justify-between">
              <div>
                <div className={`font-mono font-bold text-foreground ${expanded ? 'text-sm' : 'text-[12px]'}`}>{sel.name}</div>
                <div className="text-[9px] text-muted-foreground font-body">{selStatus.date}</div>
              </div>
              <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-sm border ${
                selStatus.status === 'OPEN' ? 'text-positive border-positive/30 bg-positive/10' :
                selStatus.status === 'CLOSED' ? 'text-negative border-negative/30 bg-negative/10' :
                'text-accent border-accent/30 bg-accent/10'
              }`}>{selStatus.label}</span>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
            <div><span className="text-muted-foreground font-body block text-[8px] uppercase">Local Time</span><span className="font-mono font-bold text-foreground">{selStatus.time}</span></div>
            <div><span className="text-muted-foreground font-body block text-[8px] uppercase">Trading Hours</span><span className="font-mono font-bold text-foreground">{selStatus.hoursStr}</span></div>
            <div><span className="text-muted-foreground font-body block text-[8px] uppercase">Currency</span><span className="font-mono font-bold text-foreground">{sel.currency}</span></div>
            <div><span className="text-muted-foreground font-body block text-[8px] uppercase">Main Index</span><span className="font-mono font-bold text-foreground">{sel.index}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground font-body block text-[8px] uppercase">Countdown</span><span className={`font-mono font-bold ${selStatus.status === 'OPEN' ? 'text-positive' : 'text-accent'}`}>⏱ {selStatus.countdown}</span></div>
            {sel.lunchStart > 0 && (
              <div className="col-span-2"><span className="text-muted-foreground font-body block text-[8px] uppercase">Lunch Break</span>
                <span className="font-mono text-accent">{Math.floor(sel.lunchStart / 60)}:{(sel.lunchStart % 60).toString().padStart(2, '0')}–{Math.floor(sel.lunchEnd / 60)}:{(sel.lunchEnd % 60).toString().padStart(2, '0')}{selStatus.isLunch && <span className="ml-1 text-accent font-bold">(NOW)</span>}</span>
              </div>
            )}
          </div>
          {expanded && (
            <div className="p-3 border-l border-border">
              <div className="text-[8px] uppercase text-muted-foreground font-body mb-2">All Markets ({markets.length})</div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {markets.map((m, idx) => {
                  const s = getMarketStatusForTZ(m);
                  return (
                    <button key={idx} onClick={() => setSelectedMarket(idx)}
                      className={`w-full flex items-center justify-between px-2 py-1 text-[8px] font-mono border rounded-sm transition-colors ${idx === selectedMarket ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/20'}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.status === 'OPEN' ? 'hsl(145, 75%, 65%)' : s.status === 'CLOSED' ? 'hsl(0, 60%, 50%)' : 'hsl(35, 100%, 55%)' }} />
                        <span className="text-foreground">{m.abbr}</span>
                      </div>
                      <span className="text-muted-foreground">{s.time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {sessionProgress !== null && (
            <div className={`px-3 pb-3 ${expanded ? 'col-span-2' : ''}`}>
              <div className="flex justify-between text-[8px] text-muted-foreground mb-1"><span>Session Progress</span><span className="text-positive font-mono font-bold">{sessionProgress.toFixed(0)}%</span></div>
              <div className="h-1.5 bg-surface-elevated border border-border rounded-full overflow-hidden"><div className="h-full bg-positive rounded-full transition-all" style={{ width: `${sessionProgress}%` }} /></div>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-3 p-2 bg-surface-deep border border-border rounded-sm">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[8px] font-mono text-accent uppercase tracking-wide font-bold">⚙ Map Filters</span>
            <span className="flex-1 h-px bg-border" />
            <button
              onClick={() => {
                setRegionFilter('all'); setStatusFilter('all'); setCurrencyFilter('all');
                setTheme('dark'); setSunMode('terminator'); setLabelMode('abbr');
                setGraticule('major'); setHighlights('all');
              }}
              className="px-2 py-0.5 text-[8px] font-mono border border-border hover:border-accent/50 hover:text-accent transition-colors text-muted-foreground"
            >RESET</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterDropdown<RegionKey>
              label="REG" value={regionFilter} onChange={setRegionFilter} width="w-[130px]"
              options={[
                { value: 'all', label: 'All regions' },
                { value: 'americas', label: 'Americas' },
                { value: 'latam', label: 'Latam' },
                { value: 'emea', label: 'EMEA' },
                { value: 'europe', label: 'Europe only' },
                { value: 'mena', label: 'MENA + Africa' },
                { value: 'apac', label: 'APAC' },
                { value: 'asia', label: 'Asia only' },
              ]}
            />
            <FilterDropdown<StatusFilter>
              label="STAT" value={statusFilter} onChange={setStatusFilter} width="w-[130px]"
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'open', label: 'Open only' },
                { value: 'pre', label: 'Pre-market' },
                { value: 'post', label: 'After-hours' },
                { value: 'ext', label: 'Extended hrs' },
                { value: 'lunch', label: 'In lunch break' },
                { value: 'closed', label: 'Closed only' },
              ]}
            />
            <FilterDropdown<CurrencyFilter>
              label="CCY" value={currencyFilter} onChange={setCurrencyFilter} width="w-[120px]"
              options={[
                { value: 'all', label: 'All currencies' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'JPY', label: 'JPY' },
                { value: 'CNY', label: 'CNY' },
                { value: 'OTHER', label: 'Other / EM' },
              ]}
            />
            <FilterDropdown<ThemeKey>
              label="THEME" value={theme} onChange={setTheme} width="w-[140px]"
              options={[
                { value: 'dark', label: 'Terminal dark' },
                { value: 'midnight', label: 'Midnight blue' },
                { value: 'slate', label: 'Slate gray' },
                { value: 'topo', label: 'Topographic' },
                { value: 'contrast', label: 'High contrast' },
                { value: 'sepia', label: 'Sepia' },
              ]}
            />
            <FilterDropdown<SunMode>
              label="SUN" value={sunMode} onChange={setSunMode} width="w-[150px]"
              options={[
                { value: 'none', label: 'None' },
                { value: 'terminator', label: 'Terminator line' },
                { value: 'shade', label: 'Day/night shade' },
                { value: 'altitude', label: 'Altitude heatmap' },
                { value: 'civil', label: 'Civil twilight' },
              ]}
            />
            <FilterDropdown<LabelMode>
              label="LBL" value={labelMode} onChange={setLabelMode} width="w-[120px]"
              options={[
                { value: 'none', label: 'None' },
                { value: 'abbr', label: 'Abbreviation' },
                { value: 'full', label: 'Full name' },
                { value: 'index', label: 'Main index' },
              ]}
            />
            <FilterDropdown<GraticuleMode>
              label="GRID" value={graticule} onChange={setGraticule} width="w-[120px]"
              options={[
                { value: 'none', label: 'None' },
                { value: 'major', label: 'Major (30°)' },
                { value: 'minor', label: 'Minor (10°)' },
                { value: 'full', label: 'Full grid' },
              ]}
            />
            <FilterDropdown<HighlightMode>
              label="HILO" value={highlights} onChange={setHighlights} width="w-[140px]"
              options={[
                { value: 'none', label: 'None' },
                { value: 'equator', label: 'Equator only' },
                { value: 'tropics', label: 'Tropics' },
                { value: 'polar', label: 'Polar circles' },
                { value: 'all', label: 'All overlays' },
              ]}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[8px] font-mono text-muted-foreground/60">
            <span>☀ Sun {sunPos.lng.toFixed(1)}°E · decl {sunPos.decl.toFixed(1)}°</span>
            <span className="text-muted-foreground/30">·</span>
            <span>Visible {markets.filter(m => matchesRegionFilter(m, regionFilter) && (currencyFilter === 'all' || (currencyFilter === 'OTHER' ? !['USD', 'EUR', 'GBP', 'JPY', 'CNY'].includes(m.currency) : m.currency === currencyFilter))).length}/{markets.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Fullscreen globe portal
function MarketGlobeExpanded({ markets, onClose }: { markets: typeof GLOBAL_MARKETS; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-elevated">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-foreground text-sm">🌍 GLOBAL MARKETS — EXPANDED VIEW</span>
          <span className="text-[9px] font-mono text-muted-foreground">ESC to close · Scroll to zoom · Drag to pan</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-accent/10 rounded-sm transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <MarketGlobe markets={markets} expanded={true} />
      </div>
    </div>,
    document.body
  );
}
// ── Widget type registry ────────────────────────────────────────────
type WidgetId =
  | 'blackScholes' | 'calculators' | 'compound' | 'pip' | 'margin'
  | 'fibonacci' | 'cagr' | 'todayPerf' | 'stratPerf' | 'topPerformers'
  | 'quickNotes' | 'watchlist' | 'checklist' | 'sessionTimer' | 'marketHours'
  | 'hotkeys' | 'econCalendar' | 'tradeIdeas'
  | 'macroSnapshot' | 'riskSentiment' | 'correlationMatrix' | 'treasuryMonitor' | 'dxyTracker'
  | 'futuresMonitor' | 'earningsCalendar' | 'sectorRotation' | 'volTermStructure' | 'econSurprise' | 'flowMonitor'
  | 'liveStream'
  | 'pivotPoints' | 'atrCalc' | 'lotSize' | 'breakevenCalc' | 'volCalc' | 'mtfBias'
  | 'positions' | 'riskMonitor' | 'alertsTile'
  | 'calcHub' | 'opraPricer' | 'preMarketScan';

// IDs removed from the registry. We quietly drop them from any saved config so users
// who had them pinned don't see broken tiles after the consolidation.
const LEGACY_IDS = new Set<string>([
  'macroQuickLinks',
  // calculators consolidated into calcHub
  'calculators', 'compound', 'pip', 'margin', 'cagr', 'fibonacci',
  'pivotPoints', 'atrCalc', 'lotSize', 'breakevenCalc', 'volCalc',
]);

// CMD codes shown in widget headers, addressable from CLI.
const WIDGET_CMD: Record<WidgetId, string> = {
  positions: 'POS', riskMonitor: 'RISK', alertsTile: 'ALRT',
  blackScholes: 'BS', calculators: 'CALC', compound: 'CMPD', pip: 'PIP', margin: 'MARG',
  fibonacci: 'FIB', cagr: 'CAGR', pivotPoints: 'PIV', atrCalc: 'ATR', lotSize: 'LOT',
  breakevenCalc: 'BE', volCalc: 'VOL', tradeIdeas: 'IDEA', mtfBias: 'MTF',
  todayPerf: 'PERF', stratPerf: 'STRT', topPerformers: 'TOPS', sectorRotation: 'SECT',
  quickNotes: 'NOTE', watchlist: 'WL', checklist: 'CHK', sessionTimer: 'TMR',
  hotkeys: 'HK', liveStream: 'LIVE',
  macroSnapshot: 'SNAP', riskSentiment: 'RSK', correlationMatrix: 'CORR',
  treasuryMonitor: 'UST', dxyTracker: 'DXY', volTermStructure: 'VTS', econSurprise: 'ESI',
  futuresMonitor: 'FUT', earningsCalendar: 'EARN', flowMonitor: 'FLOW', marketHours: 'MKTS',
  econCalendar: 'ECON',
  calcHub: 'CALC', opraPricer: 'OPRA', preMarketScan: 'SCAN',
};

type WidgetCategory = 'trading' | 'macro' | 'analytics' | 'tools' | 'flow';
const categoryColorMap: Record<WidgetCategory, SectionColor> = {
  trading: 'green',
  macro: 'cyan',
  analytics: 'purple',
  tools: 'accent',
  flow: 'pink',
};

const DEFAULT_WIDGETS: { id: WidgetId; label: string; icon: string; visible: boolean; category: WidgetCategory }[] = [
  // Live trading
  { id: 'positions', label: 'Open Positions', icon: '📋', visible: true, category: 'trading' },
  { id: 'riskMonitor', label: 'Risk Monitor', icon: '🛡', visible: true, category: 'trading' },
  { id: 'alertsTile', label: 'Price Alerts', icon: '🔔', visible: true, category: 'tools' },
  // Trading — consolidated
  { id: 'calcHub', label: 'Calculators', icon: '📐', visible: true, category: 'trading' },
  { id: 'opraPricer', label: 'Options Quick Pricer', icon: '⚡', visible: true, category: 'trading' },
  { id: 'blackScholes', label: 'Black-Scholes (Full)', icon: '⚡', visible: false, category: 'trading' },
  { id: 'tradeIdeas', label: 'Trade Ideas', icon: '💡', visible: true, category: 'trading' },
  { id: 'mtfBias', label: 'Multi-TF Bias', icon: '🔮', visible: true, category: 'analytics' },
  // Macro
  { id: 'macroSnapshot', label: 'Macro Snapshot', icon: '📡', visible: true, category: 'macro' },
  { id: 'riskSentiment', label: 'Risk Sentiment', icon: '🎯', visible: true, category: 'macro' },
  { id: 'treasuryMonitor', label: 'Treasury Monitor', icon: '🏛', visible: true, category: 'macro' },
  { id: 'dxyTracker', label: 'DXY & FX Tracker', icon: '💵', visible: true, category: 'macro' },
  { id: 'correlationMatrix', label: 'Correlation Matrix', icon: '🔗', visible: true, category: 'macro' },
  { id: 'volTermStructure', label: 'Vol Term Structure', icon: '📉', visible: true, category: 'macro' },
  { id: 'econSurprise', label: 'Econ Surprise Index', icon: '⚡', visible: true, category: 'macro' },
  // Analytics
  { id: 'todayPerf', label: "Today's Performance", icon: '📊', visible: true, category: 'analytics' },
  { id: 'stratPerf', label: 'Strategy Performance', icon: '📈', visible: true, category: 'analytics' },
  { id: 'topPerformers', label: 'Top Performers', icon: '🏆', visible: true, category: 'analytics' },
  { id: 'sectorRotation', label: 'Sector Rotation', icon: '🔄', visible: true, category: 'analytics' },
  // Flow & Market
  { id: 'preMarketScan', label: 'Pre-Market Scanner', icon: '🔍', visible: true, category: 'flow' },
  { id: 'futuresMonitor', label: 'Futures Monitor', icon: '📟', visible: true, category: 'flow' },
  { id: 'earningsCalendar', label: 'Earnings Calendar', icon: '📅', visible: true, category: 'flow' },
  { id: 'flowMonitor', label: 'Dark Pool & Flow', icon: '🌊', visible: true, category: 'flow' },
  { id: 'marketHours', label: 'Global Markets', icon: '🌍', visible: true, category: 'flow' },
  { id: 'econCalendar', label: 'Economic Events', icon: '📅', visible: true, category: 'flow' },
  // Tools
  { id: 'quickNotes', label: 'Quick Notes', icon: '📝', visible: true, category: 'tools' },
  { id: 'watchlist', label: 'Watchlist', icon: '👁', visible: true, category: 'tools' },
  { id: 'checklist', label: 'Checklists', icon: '✅', visible: true, category: 'tools' },
  { id: 'sessionTimer', label: 'Session Timer', icon: '⏱', visible: true, category: 'tools' },
  { id: 'hotkeys', label: 'Hotkeys Reference', icon: '⌨', visible: false, category: 'tools' },
  { id: 'liveStream', label: 'Live Stream', icon: '📺', visible: true, category: 'tools' },
];

const STORAGE_KEY = 'tools-widget-config-v4';

function loadWidgetConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = (JSON.parse(saved) as typeof DEFAULT_WIDGETS)
        .filter(w => !LEGACY_IDS.has(w.id as string));
      // Merge new widgets not in saved config
      const savedIds = new Set(parsed.map(w => w.id));
      const newWidgets = DEFAULT_WIDGETS.filter(w => !savedIds.has(w.id));
      return [...parsed, ...newWidgets];
    }
    // One-time migration: purge legacy keys from older v3 storage
    localStorage.removeItem('tools-widget-config-v3');
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS;
}

// ── Main Component ──────────────────────────────────────────────────
export default function ToolsPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [calcTab, setCalcTab] = useState<CalcTab>('risk');
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState(loadWidgetConfig);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); }, [widgets]);

  const toggleWidget = (id: WidgetId) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  const moveWidget = useCallback((idx: number, dir: -1 | 1) => {
    setWidgets(ws => {
      const next = [...ws];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return ws;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  // ── Calculator states ─────────────────────────────────────────
  const [bsInputs, setBsInputs] = useState({ stockPrice: '518.45', strikePrice: '520', daysToExpiry: '30', riskFreeRate: '5', volatility: '25' });
  const [bsResult, setBsResult] = useState<ReturnType<typeof calculateBlackScholes> | null>(null);
  const [riskInputs, setRiskInputs] = useState({ account: '125487.32', riskPct: '1', entry: '518.45', stop: '516.00' });
  const [riskResult, setRiskResult] = useState<any>(null);
  const [profitInputs, setProfitInputs] = useState({ entry: '', target: '', qty: '', side: 'LONG' });
  const [profitResult, setProfitResult] = useState<any>(null);
  const [posInputs, setPosInputs] = useState({ account: '125487.32', risk: '1', price: '' });
  const [posResult, setPosResult] = useState<any>(null);
  const [rrInputs, setRrInputs] = useState({ entry: '', stop: '', target: '' });
  const [rrResult, setRrResult] = useState<any>(null);
  const [wrInputs, setWrInputs] = useState({ avgWin: '', avgLoss: '' });
  const [wrResult, setWrResult] = useState<string | null>(null);
  const [feeInputs, setFeeInputs] = useState({ commission: '0.005', shares: '100', slippage: '0.05' });
  const [feeResult, setFeeResult] = useState<any>(null);
  const [compInputs, setCompInputs] = useState({ principal: '10000', rate: '8', years: '10', compound: '12' });
  const [compResult, setCompResult] = useState<{ total: number; interest: number } | null>(null);
  const [pipInputs, setPipInputs] = useState({ lotSize: '100000', pips: '10', pipValue: '0.0001' });
  const [pipResult, setPipResult] = useState<{ value: number } | null>(null);
  const [marginInputs, setMarginInputs] = useState({ posSize: '50000', leverage: '50' });
  const [marginResult, setMarginResult] = useState<{ required: number } | null>(null);
  const [ddInputs, setDdInputs] = useState({ peak: '150000', current: '125000' });
  const [ddResult, setDdResult] = useState<{ drawdown: number; pctDD: number; recoveryNeeded: number } | null>(null);
  const [expInputs, setExpInputs] = useState({ winRate: '55', avgWin: '487', avgLoss: '312' });
  const [expResult, setExpResult] = useState<{ expectancy: number; per100: number } | null>(null);
  const [kellyInputs, setKellyInputs] = useState({ winRate: '55', winLossRatio: '1.56' });
  const [kellyResult, setKellyResult] = useState<{ kelly: number; half: number; quarter: number } | null>(null);
  const [fibInputs, setFibInputs] = useState({ high: '', low: '', direction: 'up' });
  const [fibResult, setFibResult] = useState<{ levels: { pct: string; price: number }[] } | null>(null);
  const [cagrInputs, setCagrInputs] = useState({ startValue: '100000', endValue: '180000', years: '3' });
  const [cagrResult, setCagrResult] = useState<{ cagr: number } | null>(null);

  // ── New tool states ───────────────────────────────────────────
  const [pivotInputs, setPivotInputs] = useState({ high: '', low: '', close: '' });
  const [pivotResult, setPivotResult] = useState<{ pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number } | null>(null);
  const [atrInputs, setAtrInputs] = useState({ ranges: '2.5,3.1,1.8,2.9,3.4,2.2,2.7,3.0,2.1,2.6,3.3,1.9,2.8,3.2', period: '14' });
  const [atrResult, setAtrResult] = useState<{ atr: number; stopLong: number; stopShort: number } | null>(null);
  const [lotInputs, setLotInputs] = useState({ account: '10000', riskPct: '1', stopPips: '30', pipValue: '10' });
  const [lotResult, setLotResult] = useState<{ lots: number; units: number; riskAmt: number } | null>(null);
  const [beInputs, setBeInputs] = useState({ entries: '100,102', quantities: '50,30', fees: '5' });
  const [beResult, setBeResult] = useState<{ breakeven: number; totalQty: number; totalCost: number } | null>(null);
  const [volInputs, setVolInputs] = useState({ returns: '0.5,-0.3,1.2,-0.8,0.4,0.9,-0.2,1.5,-0.6,0.3' });
  const [volResult, setVolResult] = useState<{ daily: number; annualized: number; avgReturn: number } | null>(null);

  // ── Quick Notes (multiple) ────────────────────────────────────
  const [notesList, setNotesList] = useState<{ id: string; title: string; content: string; bold: boolean; italic: boolean; bullets: boolean }[]>(() => {
    try {
      const s = localStorage.getItem('trader-notes-v2');
      if (s) return JSON.parse(s);
    } catch {}
    return [{ id: '1', title: 'Session Notes', content: '', bold: false, italic: false, bullets: false }];
  });
  const [activeNoteId, setActiveNoteId] = useState(() => notesList[0]?.id || '1');

  useEffect(() => { localStorage.setItem('trader-notes-v2', JSON.stringify(notesList)); }, [notesList]);

  const activeNote = notesList.find(n => n.id === activeNoteId) || notesList[0];

  const updateNote = (field: string, value: any) => {
    setNotesList(nl => nl.map(n => n.id === activeNoteId ? { ...n, [field]: value } : n));
  };

  const addNote = () => {
    const newNote = { id: Date.now().toString(), title: `Note ${notesList.length + 1}`, content: '', bold: false, italic: false, bullets: false };
    setNotesList(nl => [...nl, newNote]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id: string) => {
    if (notesList.length <= 1) return;
    setNotesList(nl => nl.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(notesList.find(n => n.id !== id)?.id || '1');
  };

  // ── Watchlist ─────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState<{ symbol: string; alert: string; notes: string }[]>(() => {
    try { const s = localStorage.getItem('trader-watchlist-v2'); return s ? JSON.parse(s) : [
      { symbol: 'SPY', alert: '520.00', notes: 'Key support at 515' },
      { symbol: 'AAPL', alert: '195.00', notes: 'Earnings next week' },
      { symbol: 'NVDA', alert: '880.00', notes: 'Breakout above 900' },
    ]; } catch { return []; }
  });
  const [wlInput, setWlInput] = useState({ symbol: '', alert: '', notes: '' });
  useEffect(() => { localStorage.setItem('trader-watchlist-v2', JSON.stringify(watchlist)); }, [watchlist]);

  // ── Multiple Checklists ───────────────────────────────────────
  const [checklists, setChecklists] = useState<{ id: string; name: string; items: { text: string; done: boolean }[] }[]>(() => {
    try {
      const s = localStorage.getItem('trader-checklists-v2');
      if (s) return JSON.parse(s);
    } catch {}
    return [
      { id: '1', name: 'Pre-Session', items: [
        { text: 'Review pre-market gaps', done: false },
        { text: 'Check economic calendar', done: false },
        { text: 'Set daily loss limit', done: false },
        { text: 'Identify key S/R levels', done: false },
        { text: 'Review open positions', done: false },
      ]},
      { id: '2', name: 'During Trade', items: [
        { text: 'Confirm entry signal', done: false },
        { text: 'Set stop loss', done: false },
        { text: 'Set profit target', done: false },
        { text: 'Size position correctly', done: false },
      ]},
      { id: '3', name: 'Post-Session', items: [
        { text: 'Log all trades', done: false },
        { text: 'Review mistakes', done: false },
        { text: 'Update journal', done: false },
        { text: 'Plan tomorrow', done: false },
      ]},
    ];
  });
  const [activeChecklistId, setActiveChecklistId] = useState(() => checklists[0]?.id || '1');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newChecklistName, setNewChecklistName] = useState('');
  useEffect(() => { localStorage.setItem('trader-checklists-v2', JSON.stringify(checklists)); }, [checklists]);

  const activeChecklist = checklists.find(c => c.id === activeChecklistId) || checklists[0];

  // ── Session Timer (modes) ─────────────────────────────────────
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pomodoroWork, setPomodoroWork] = useState(25);
  const [pomodoroBreak, setPomodoroBreak] = useState(5);
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const [countdownSet, setCountdownSet] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds(s => {
        if (timerMode === 'stopwatch') return s + 1;
        if (timerMode === 'pomodoro') {
          if (s <= 1) {
            // Phase complete
            if (pomodoroPhase === 'work') {
              setPomodoroPhase('break');
              setPomodoroCount(c => c + 1);
              return pomodoroBreak * 60;
            } else {
              setPomodoroPhase('work');
              return pomodoroWork * 60;
            }
          }
          return s - 1;
        }
        if (timerMode === 'countdown') {
          if (s <= 1) { setTimerRunning(false); return 0; }
          return s - 1;
        }
        return s;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerMode, pomodoroPhase, pomodoroWork, pomodoroBreak]);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timerMode === 'pomodoro' && !timerRunning && timerSeconds === 0) {
      setTimerSeconds(pomodoroWork * 60);
      setPomodoroPhase('work');
    }
    if (timerMode === 'countdown' && !countdownSet) {
      setTimerSeconds(countdownMinutes * 60);
      setCountdownSet(true);
    }
    setTimerRunning(true);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    setPomodoroPhase('work');
    setPomodoroCount(0);
    setCountdownSet(false);
  };

  // ── Market Hours ──────────────────────────────────────────────
  const [marketView, setMarketView] = useState<'list' | 'globe'>('list');
  const [globeMode, setGlobeMode] = useState<'2d' | '3d'>('3d');
  const [globeExpanded, setGlobeExpanded] = useState(false);
  const [marketStatuses, setMarketStatuses] = useState(() => GLOBAL_MARKETS.map(m => ({ ...m, ...getMarketStatusForTZ(m) })));

  useEffect(() => {
    const id = setInterval(() => {
      setMarketStatuses(GLOBAL_MARKETS.map(m => ({ ...m, ...getMarketStatusForTZ(m) })));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Trade Ideas ───────────────────────────────────────────────
  const [tradeIdeas, setTradeIdeas] = useState<{ id: string; symbol: string; direction: string; entry: string; stop: string; target: string; notes: string; status: 'pending' | 'active' | 'closed' }[]>(() => {
    try { const s = localStorage.getItem('trader-ideas-v2'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [ideaInput, setIdeaInput] = useState({ symbol: '', direction: 'LONG', entry: '', stop: '', target: '', notes: '' });
  useEffect(() => { localStorage.setItem('trader-ideas-v2', JSON.stringify(tradeIdeas)); }, [tradeIdeas]);

  // ── Calculator functions ──────────────────────────────────────
  const calcBS = () => {
    const S = parseFloat(bsInputs.stockPrice), K = parseFloat(bsInputs.strikePrice);
    const days = parseFloat(bsInputs.daysToExpiry), r = parseFloat(bsInputs.riskFreeRate) / 100;
    const sigma = parseFloat(bsInputs.volatility) / 100;
    if (!S || !K || !days || isNaN(r) || !sigma) return;
    setBsResult(calculateBlackScholes(S, K, days / 365, r, sigma));
  };
  const calcRisk = () => {
    const acct = parseFloat(riskInputs.account), pct = parseFloat(riskInputs.riskPct);
    const entry = parseFloat(riskInputs.entry), stop = parseFloat(riskInputs.stop);
    if (!acct || !pct || !entry || !stop || entry === stop) return;
    const dollarRisk = acct * (pct / 100), riskPerShare = Math.abs(entry - stop);
    const shares = Math.floor(dollarRisk / riskPerShare);
    setRiskResult({ shares, dollarRisk: shares * riskPerShare, riskPerShare, posValue: shares * entry });
  };
  const calcProfit = () => {
    const entry = parseFloat(profitInputs.entry), target = parseFloat(profitInputs.target), qty = parseInt(profitInputs.qty);
    if (!entry || !target || !qty) return;
    const change = target - entry;
    const gross = change * qty * (profitInputs.side === 'SHORT' ? -1 : 1);
    const roi = (change / entry) * 100 * (profitInputs.side === 'SHORT' ? -1 : 1);
    setProfitResult({ gross, change, changePct: (change / entry) * 100, roi });
  };
  const calcPosition = () => {
    const acct = parseFloat(posInputs.account), risk = parseFloat(posInputs.risk), price = parseFloat(posInputs.price);
    if (!acct || !risk || !price) return;
    const dollarRisk = acct * (risk / 100), shares = Math.floor(dollarRisk / price);
    setPosResult({ shares, value: shares * price, dollarRisk });
  };
  const calcRR = () => {
    const entry = parseFloat(rrInputs.entry), stop = parseFloat(rrInputs.stop), target = parseFloat(rrInputs.target);
    if (!entry || !stop || !target) return;
    const risk = Math.abs(entry - stop), reward = Math.abs(target - entry);
    setRrResult({ ratio: (reward / risk).toFixed(2) + ':1', risk, reward });
  };
  const calcWinRate = () => {
    const avgWin = parseFloat(wrInputs.avgWin), avgLoss = parseFloat(wrInputs.avgLoss);
    if (!avgWin || !avgLoss) return;
    setWrResult((avgLoss / (avgWin + avgLoss) * 100).toFixed(2) + '%');
  };
  const calcFees = () => {
    const comm = parseFloat(feeInputs.commission), shares = parseInt(feeInputs.shares), slip = parseFloat(feeInputs.slippage);
    if (!comm || !shares || !slip) return;
    const commTotal = comm * shares * 2, slipTotal = slip * shares;
    setFeeResult({ commTotal, slipTotal, total: commTotal + slipTotal });
  };
  const calcCompound = () => {
    const P = parseFloat(compInputs.principal), r = parseFloat(compInputs.rate) / 100;
    const t = parseFloat(compInputs.years), n = parseFloat(compInputs.compound);
    if (!P || !r || !t || !n) return;
    const total = P * Math.pow(1 + r / n, n * t);
    setCompResult({ total, interest: total - P });
  };
  const calcPip = () => {
    const lot = parseFloat(pipInputs.lotSize), pips = parseFloat(pipInputs.pips), pv = parseFloat(pipInputs.pipValue);
    if (!lot || !pips || !pv) return;
    setPipResult({ value: lot * pips * pv });
  };
  const calcMargin = () => {
    const pos = parseFloat(marginInputs.posSize), lev = parseFloat(marginInputs.leverage);
    if (!pos || !lev) return;
    setMarginResult({ required: pos / lev });
  };
  const calcDrawdown = () => {
    const peak = parseFloat(ddInputs.peak), current = parseFloat(ddInputs.current);
    if (!peak || !current) return;
    const drawdown = peak - current, pctDD = (drawdown / peak) * 100;
    setDdResult({ drawdown, pctDD, recoveryNeeded: ((peak - current) / current) * 100 });
  };
  const calcExpectancy = () => {
    const wr = parseFloat(expInputs.winRate) / 100;
    const avgW = parseFloat(expInputs.avgWin), avgL = parseFloat(expInputs.avgLoss);
    if (!wr || !avgW || !avgL) return;
    const expectancy = (wr * avgW) - ((1 - wr) * avgL);
    setExpResult({ expectancy, per100: expectancy * 100 });
  };
  const calcKelly = () => {
    const wr = parseFloat(kellyInputs.winRate) / 100, wlr = parseFloat(kellyInputs.winLossRatio);
    if (!wr || !wlr) return;
    const kelly = (wr - ((1 - wr) / wlr)) * 100;
    setKellyResult({ kelly, half: kelly / 2, quarter: kelly / 4 });
  };
  const calcFib = () => {
    const high = parseFloat(fibInputs.high), low = parseFloat(fibInputs.low);
    if (!high || !low) return;
    const diff = high - low;
    const fibs = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
    setFibResult({ levels: fibs.map(f => ({ pct: f + '%', price: fibInputs.direction === 'up' ? low + (diff * f / 100) : high - (diff * f / 100) })) });
  };
  const calcCAGR = () => {
    const sv = parseFloat(cagrInputs.startValue), ev = parseFloat(cagrInputs.endValue), y = parseFloat(cagrInputs.years);
    if (!sv || !ev || !y) return;
    setCagrResult({ cagr: (Math.pow(ev / sv, 1 / y) - 1) * 100 });
  };
  const calcPivot = () => {
    const h = parseFloat(pivotInputs.high), l = parseFloat(pivotInputs.low), c = parseFloat(pivotInputs.close);
    if (!h || !l || !c) return;
    const pp = (h + l + c) / 3;
    setPivotResult({ pp, r1: 2 * pp - l, r2: pp + (h - l), r3: h + 2 * (pp - l), s1: 2 * pp - h, s2: pp - (h - l), s3: l - 2 * (h - pp) });
  };
  const calcATR = () => {
    const ranges = atrInputs.ranges.split(',').map(Number).filter(n => !isNaN(n));
    const period = parseInt(atrInputs.period) || 14;
    if (ranges.length === 0) return;
    const used = ranges.slice(-period);
    const atr = used.reduce((a, b) => a + b, 0) / used.length;
    setAtrResult({ atr, stopLong: -atr * 1.5, stopShort: atr * 1.5 });
  };
  const calcLot = () => {
    const acct = parseFloat(lotInputs.account), risk = parseFloat(lotInputs.riskPct);
    const stopPips = parseFloat(lotInputs.stopPips), pv = parseFloat(lotInputs.pipValue);
    if (!acct || !risk || !stopPips || !pv) return;
    const riskAmt = acct * (risk / 100);
    const units = riskAmt / (stopPips * (pv / 100000));
    setLotResult({ lots: parseFloat((units / 100000).toFixed(2)), units: Math.floor(units), riskAmt });
  };
  const calcBreakeven = () => {
    const entries = beInputs.entries.split(',').map(Number).filter(n => !isNaN(n));
    const quantities = beInputs.quantities.split(',').map(Number).filter(n => !isNaN(n));
    const fees = parseFloat(beInputs.fees) || 0;
    if (entries.length === 0 || entries.length !== quantities.length) return;
    const totalCost = entries.reduce((sum, e, i) => sum + e * quantities[i], 0) + fees;
    const totalQty = quantities.reduce((a, b) => a + b, 0);
    setBeResult({ breakeven: totalCost / totalQty, totalQty, totalCost });
  };
  const calcVol = () => {
    const returns = volInputs.returns.split(',').map(Number).filter(n => !isNaN(n));
    if (returns.length < 2) return;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / (returns.length - 1);
    const daily = Math.sqrt(variance);
    setVolResult({ daily, annualized: daily * Math.sqrt(252), avgReturn: avg });
  };

  const calcTabs: { id: CalcTab; label: string }[] = [
    { id: 'risk', label: 'Risk' }, { id: 'profit', label: 'P&L' }, { id: 'position', label: 'Size' },
    { id: 'rr', label: 'R:R' }, { id: 'winrate', label: 'Win%' }, { id: 'fees', label: 'Fees' },
    { id: 'drawdown', label: 'DD' }, { id: 'expectancy', label: 'EV' }, { id: 'kelly', label: 'Kelly' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Block all scroll events (wheel, touch) on the tools panel - must use non-passive listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); };
    const blockTouch = (e: TouchEvent) => { e.preventDefault(); e.stopPropagation(); };
    el.addEventListener('wheel', blockWheel, { passive: false });
    el.addEventListener('touchmove', blockTouch, { passive: false });
    return () => {
      el.removeEventListener('wheel', blockWheel);
      el.removeEventListener('touchmove', blockTouch);
    };
  }, []);

  const scrollBy = (amount: number) => {
    setScrollOffset(prev => {
      const container = scrollRef.current;
      const inner = innerRef.current;
      if (!container || !inner) return prev;
      const maxScroll = Math.max(0, inner.scrollHeight - container.clientHeight);
      return Math.max(0, Math.min(maxScroll, prev + amount));
    });
  };

  if (collapsed) return null;

  // ── Widget renderers ──────────────────────────────────────────
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'blackScholes':
        return (
          <ToolSection title="BLACK-SCHOLES" icon="⚡" defaultOpen color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Stock Price ($)" type="number" step="0.01" value={bsInputs.stockPrice} onChange={e => setBsInputs({ ...bsInputs, stockPrice: e.target.value })} />
              <InputField label="Strike Price ($)" type="number" step="0.01" value={bsInputs.strikePrice} onChange={e => setBsInputs({ ...bsInputs, strikePrice: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Days to Expiry" type="number" value={bsInputs.daysToExpiry} onChange={e => setBsInputs({ ...bsInputs, daysToExpiry: e.target.value })} />
                <InputField label="Risk-Free (%)" type="number" step="0.1" value={bsInputs.riskFreeRate} onChange={e => setBsInputs({ ...bsInputs, riskFreeRate: e.target.value })} />
              </div>
              <InputField label="IV (%)" type="number" step="0.1" value={bsInputs.volatility} onChange={e => setBsInputs({ ...bsInputs, volatility: e.target.value })} />
            </div>
            <CalcButton onClick={calcBS} label="Calculate" />
            {bsResult && (
              <div className="bg-surface-deep border border-border p-3 space-y-1">
                <div className="text-accent text-[10px] uppercase font-mono font-bold mb-2 pb-1 border-b border-border">Option Prices</div>
                <div className="grid grid-cols-2 gap-3">
                  <ResultRow label="Call" value={`$${bsResult.callPrice.toFixed(4)}`} valueClass="text-positive" />
                  <ResultRow label="Put" value={`$${bsResult.putPrice.toFixed(4)}`} valueClass="text-negative" />
                </div>
                <div className="text-accent text-[10px] uppercase font-mono font-bold mb-2 pt-2 pb-1 border-b border-border">Greeks</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <ResultRow label="Call Δ" value={bsResult.callDelta.toFixed(4)} />
                  <ResultRow label="Put Δ" value={bsResult.putDelta.toFixed(4)} />
                  <ResultRow label="Γ" value={bsResult.gamma.toFixed(6)} />
                  <ResultRow label="ν" value={bsResult.vega.toFixed(4)} />
                  <ResultRow label="Call θ" value={bsResult.callTheta.toFixed(4)} />
                  <ResultRow label="Put θ" value={bsResult.putTheta.toFixed(4)} />
                  <ResultRow label="Call ρ" value={bsResult.callRho.toFixed(4)} />
                  <ResultRow label="Put ρ" value={bsResult.putRho.toFixed(4)} />
                </div>
              </div>
            )}
          </ToolSection>
        );

      case 'calculators':
        return (
          <ToolSection title="CALCULATORS" icon="📐" defaultOpen color="green">
            <div className="flex flex-wrap gap-1 mb-3">
              {calcTabs.map(t => (
                <button key={t.id} onClick={() => setCalcTab(t.id)}
                  className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border transition-colors ${calcTab === t.id ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {calcTab === 'risk' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Account Size" type="number" value={riskInputs.account} onChange={e => setRiskInputs({ ...riskInputs, account: e.target.value })} />
                <InputField label="Risk %" type="number" step="0.1" value={riskInputs.riskPct} onChange={e => setRiskInputs({ ...riskInputs, riskPct: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Entry" type="number" step="0.01" value={riskInputs.entry} onChange={e => setRiskInputs({ ...riskInputs, entry: e.target.value })} />
                  <InputField label="Stop" type="number" step="0.01" value={riskInputs.stop} onChange={e => setRiskInputs({ ...riskInputs, stop: e.target.value })} />
                </div>
              </div>
              <CalcButton onClick={calcRisk} label="Calculate Risk" />
              {riskResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Position Size" value={`${riskResult.shares.toLocaleString()} shares`} valueClass="text-accent" />
                <ResultRow label="Dollar Risk" value={`$${riskResult.dollarRisk.toFixed(2)}`} valueClass="text-negative" />
                <ResultRow label="Risk/Share" value={`$${riskResult.riskPerShare.toFixed(2)}`} />
                <ResultRow label="Position Value" value={`$${riskResult.posValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              </div>)}
            </>)}
            {calcTab === 'profit' && (<>
              <div className="space-y-2.5 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Entry" type="number" step="0.01" value={profitInputs.entry} onChange={e => setProfitInputs({ ...profitInputs, entry: e.target.value })} />
                  <InputField label="Target" type="number" step="0.01" value={profitInputs.target} onChange={e => setProfitInputs({ ...profitInputs, target: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Qty" type="number" value={profitInputs.qty} onChange={e => setProfitInputs({ ...profitInputs, qty: e.target.value })} />
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1 uppercase font-body">Side</label>
                    <select value={profitInputs.side} onChange={e => setProfitInputs({ ...profitInputs, side: e.target.value })} className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px]">
                      <option>LONG</option><option>SHORT</option>
                    </select>
                  </div>
                </div>
              </div>
              <CalcButton onClick={calcProfit} label="Calculate P&L" />
              {profitResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Gross P&L" value={`${profitResult.gross >= 0 ? '+' : ''}$${profitResult.gross.toFixed(2)}`} valueClass={profitResult.gross >= 0 ? 'text-positive' : 'text-negative'} />
                <ResultRow label="ROI" value={`${profitResult.roi >= 0 ? '+' : ''}${profitResult.roi.toFixed(2)}%`} valueClass={profitResult.roi >= 0 ? 'text-positive' : 'text-negative'} />
              </div>)}
            </>)}
            {calcTab === 'position' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Account" type="number" value={posInputs.account} onChange={e => setPosInputs({ ...posInputs, account: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Risk %" type="number" step="0.1" value={posInputs.risk} onChange={e => setPosInputs({ ...posInputs, risk: e.target.value })} />
                  <InputField label="Price" type="number" step="0.01" value={posInputs.price} onChange={e => setPosInputs({ ...posInputs, price: e.target.value })} />
                </div>
              </div>
              <CalcButton onClick={calcPosition} label="Calculate Size" />
              {posResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Shares" value={posResult.shares.toLocaleString()} valueClass="text-accent" />
                <ResultRow label="Value" value={`$${posResult.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <ResultRow label="Max Risk" value={`$${posResult.dollarRisk.toFixed(2)}`} valueClass="text-negative" />
              </div>)}
            </>)}
            {calcTab === 'rr' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Entry" type="number" step="0.01" value={rrInputs.entry} onChange={e => setRrInputs({ ...rrInputs, entry: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Stop" type="number" step="0.01" value={rrInputs.stop} onChange={e => setRrInputs({ ...rrInputs, stop: e.target.value })} />
                  <InputField label="Target" type="number" step="0.01" value={rrInputs.target} onChange={e => setRrInputs({ ...rrInputs, target: e.target.value })} />
                </div>
              </div>
              <CalcButton onClick={calcRR} label="Calculate R:R" />
              {rrResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Ratio" value={rrResult.ratio} valueClass="text-positive text-lg" />
                <ResultRow label="Risk" value={`$${rrResult.risk.toFixed(2)}`} valueClass="text-negative" />
                <ResultRow label="Reward" value={`$${rrResult.reward.toFixed(2)}`} valueClass="text-positive" />
              </div>)}
            </>)}
            {calcTab === 'winrate' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Avg Win ($)" type="number" value={wrInputs.avgWin} onChange={e => setWrInputs({ ...wrInputs, avgWin: e.target.value })} />
                <InputField label="Avg Loss ($)" type="number" value={wrInputs.avgLoss} onChange={e => setWrInputs({ ...wrInputs, avgLoss: e.target.value })} />
              </div>
              <CalcButton onClick={calcWinRate} label="Calc Breakeven" />
              {wrResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Required Win Rate" value={wrResult} valueClass="text-accent text-lg" />
              </div>)}
            </>)}
            {calcTab === 'fees' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Commission/Share" type="number" step="0.001" value={feeInputs.commission} onChange={e => setFeeInputs({ ...feeInputs, commission: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Shares" type="number" value={feeInputs.shares} onChange={e => setFeeInputs({ ...feeInputs, shares: e.target.value })} />
                  <InputField label="Slippage ($)" type="number" step="0.01" value={feeInputs.slippage} onChange={e => setFeeInputs({ ...feeInputs, slippage: e.target.value })} />
                </div>
              </div>
              <CalcButton onClick={calcFees} label="Calculate Fees" />
              {feeResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Commission" value={`$${feeResult.commTotal.toFixed(2)}`} valueClass="text-negative" />
                <ResultRow label="Slippage" value={`$${feeResult.slipTotal.toFixed(2)}`} valueClass="text-negative" />
                <div className="border-t border-border pt-2 mt-2">
                  <ResultRow label="Total" value={`$${feeResult.total.toFixed(2)}`} valueClass="text-accent" />
                </div>
              </div>)}
            </>)}
            {calcTab === 'drawdown' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Peak Value ($)" type="number" value={ddInputs.peak} onChange={e => setDdInputs({ ...ddInputs, peak: e.target.value })} />
                <InputField label="Current Value ($)" type="number" value={ddInputs.current} onChange={e => setDdInputs({ ...ddInputs, current: e.target.value })} />
              </div>
              <CalcButton onClick={calcDrawdown} label="Calculate Drawdown" />
              {ddResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Drawdown" value={`$${ddResult.drawdown.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass="text-negative" />
                <ResultRow label="Drawdown %" value={`${ddResult.pctDD.toFixed(2)}%`} valueClass="text-negative" />
                <ResultRow label="Recovery Needed" value={`${ddResult.recoveryNeeded.toFixed(2)}%`} valueClass="text-accent" />
              </div>)}
            </>)}
            {calcTab === 'expectancy' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Win Rate (%)" type="number" step="0.1" value={expInputs.winRate} onChange={e => setExpInputs({ ...expInputs, winRate: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="Avg Win ($)" type="number" value={expInputs.avgWin} onChange={e => setExpInputs({ ...expInputs, avgWin: e.target.value })} />
                  <InputField label="Avg Loss ($)" type="number" value={expInputs.avgLoss} onChange={e => setExpInputs({ ...expInputs, avgLoss: e.target.value })} />
                </div>
              </div>
              <CalcButton onClick={calcExpectancy} label="Calculate EV" />
              {expResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Expectancy/Trade" value={`$${expResult.expectancy.toFixed(2)}`} valueClass={expResult.expectancy >= 0 ? 'text-positive' : 'text-negative'} />
                <ResultRow label="Per 100 Trades" value={`$${expResult.per100.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} valueClass={expResult.per100 >= 0 ? 'text-positive' : 'text-negative'} />
              </div>)}
            </>)}
            {calcTab === 'kelly' && (<>
              <div className="space-y-2.5 mb-3">
                <InputField label="Win Rate (%)" type="number" step="0.1" value={kellyInputs.winRate} onChange={e => setKellyInputs({ ...kellyInputs, winRate: e.target.value })} />
                <InputField label="Win/Loss Ratio" type="number" step="0.01" value={kellyInputs.winLossRatio} onChange={e => setKellyInputs({ ...kellyInputs, winLossRatio: e.target.value })} />
              </div>
              <CalcButton onClick={calcKelly} label="Calculate Kelly %" />
              {kellyResult && (<div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Full Kelly" value={`${kellyResult.kelly.toFixed(2)}%`} valueClass="text-accent text-lg" />
                <ResultRow label="Half Kelly" value={`${kellyResult.half.toFixed(2)}%`} valueClass="text-positive" />
                <ResultRow label="Quarter Kelly" value={`${kellyResult.quarter.toFixed(2)}%`} valueClass="text-muted-foreground" />
              </div>)}
            </>)}
          </ToolSection>
        );

      // ── Quick Notes (multiple with formatting) ────────────────
      case 'quickNotes':
        return (
          <ToolSection title="QUICK NOTES" icon="📝" defaultOpen color="accent">
            {/* Note tabs */}
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {notesList.map(n => (
                <div key={n.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => setActiveNoteId(n.id)}
                    className={`px-2 py-1 text-[9px] font-mono font-bold uppercase border transition-colors ${activeNoteId === n.id ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}
                  >
                    {n.title}
                  </button>
                  {notesList.length > 1 && (
                    <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-negative">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addNote} className="p-1 text-muted-foreground hover:text-accent" title="Add note">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {activeNote && (
              <>
                {/* Title edit */}
                <input
                  value={activeNote.title}
                  onChange={e => updateNote('title', e.target.value)}
                  className="w-full px-2 py-1 mb-2 bg-surface-elevated border border-border text-foreground font-mono text-[10px] focus:outline-none focus:border-accent"
                  placeholder="Note title..."
                />

                {/* Formatting toolbar */}
                <div className="flex gap-1 mb-2">
                  <button onClick={() => updateNote('bold', !activeNote.bold)}
                    className={`p-1 border transition-colors ${activeNote.bold ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                    <Bold className="w-3 h-3" />
                  </button>
                  <button onClick={() => updateNote('italic', !activeNote.italic)}
                    className={`p-1 border transition-colors ${activeNote.italic ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                    <Italic className="w-3 h-3" />
                  </button>
                  <button onClick={() => updateNote('bullets', !activeNote.bullets)}
                    className={`p-1 border transition-colors ${activeNote.bullets ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                    <List className="w-3 h-3" />
                  </button>
                </div>

                <textarea
                  value={activeNote.content}
                  onChange={e => updateNote('content', e.target.value)}
                  placeholder="Jot down observations, setups, or reminders..."
                  className={`w-full h-28 px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent resize-y ${activeNote.bold ? 'font-bold' : ''} ${activeNote.italic ? 'italic' : ''}`}
                  style={activeNote.bullets ? { listStyleType: 'disc' } : {}}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-muted-foreground font-body">{activeNote.content.length} chars • Auto-saved</span>
                  <button onClick={() => updateNote('content', '')} className="text-[9px] text-negative hover:underline font-body">Clear</button>
                </div>
              </>
            )}
          </ToolSection>
        );

      // ── Watchlist (enhanced with notes) ───────────────────────
      case 'watchlist':
        return (
          <ToolSection title="WATCHLIST" icon="👁" defaultOpen color="accent">
            <div className="space-y-1 mb-3">
              {watchlist.map((item, i) => (
                <div key={i} className="py-1.5 px-2 bg-surface-deep border border-border text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{item.symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-accent font-mono">@{item.alert}</span>
                      <button onClick={() => setWatchlist(wl => wl.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-negative">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-muted-foreground font-body mt-1 pl-1 border-l-2 border-accent/30">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-1">
                <input placeholder="SYM" value={wlInput.symbol} onChange={e => setWlInput({ ...wlInput, symbol: e.target.value.toUpperCase() })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                <input placeholder="Alert $" value={wlInput.alert} onChange={e => setWlInput({ ...wlInput, alert: e.target.value })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                <button onClick={() => { if (wlInput.symbol) { setWatchlist(wl => [...wl, { symbol: wlInput.symbol, alert: wlInput.alert || '—', notes: wlInput.notes }]); setWlInput({ symbol: '', alert: '', notes: '' }); } }}
                  className="px-2 py-1.5 bg-accent text-accent-foreground font-mono text-[11px] font-bold border border-accent">+</button>
              </div>
              <input placeholder="Notes (optional)" value={wlInput.notes} onChange={e => setWlInput({ ...wlInput, notes: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
            </div>
          </ToolSection>
        );

      // ── Multiple Checklists ───────────────────────────────────
      case 'checklist':
        return (
          <ToolSection title="CHECKLISTS" icon="✅" defaultOpen color="accent">
            {/* Checklist tabs */}
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {checklists.map(cl => (
                <div key={cl.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => setActiveChecklistId(cl.id)}
                    className={`px-2 py-1 text-[9px] font-mono font-bold uppercase border transition-colors ${activeChecklistId === cl.id ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}
                  >
                    {cl.name}
                  </button>
                  {checklists.length > 1 && (
                    <button onClick={() => {
                      setChecklists(cls => cls.filter(c => c.id !== cl.id));
                      if (activeChecklistId === cl.id) setActiveChecklistId(checklists.find(c => c.id !== cl.id)?.id || '1');
                    }} className="text-muted-foreground hover:text-negative">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new checklist */}
            <div className="flex gap-1 mb-3">
              <input placeholder="New checklist name..." value={newChecklistName} onChange={e => setNewChecklistName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newChecklistName.trim()) { setChecklists(cls => [...cls, { id: Date.now().toString(), name: newChecklistName.trim(), items: [] }]); setNewChecklistName(''); } }}
                className="flex-1 px-2 py-1 bg-surface-elevated border border-border text-foreground font-mono text-[9px] focus:outline-none focus:border-accent" />
              <button onClick={() => { if (newChecklistName.trim()) { setChecklists(cls => [...cls, { id: Date.now().toString(), name: newChecklistName.trim(), items: [] }]); setNewChecklistName(''); } }}
                className="px-2 py-1 bg-surface-elevated text-muted-foreground font-mono text-[9px] border border-border hover:text-foreground">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {activeChecklist && (
              <>
                <div className="space-y-1 mb-3">
                  {activeChecklist.items.map((item, i) => (
                    <label key={i} className="flex items-center gap-2 py-1.5 px-2 bg-surface-deep border border-border text-[11px] cursor-pointer hover:bg-surface-elevated transition-colors">
                      <input type="checkbox" checked={item.done} onChange={() => setChecklists(cls => cls.map(cl => cl.id === activeChecklistId ? { ...cl, items: cl.items.map((c, j) => j === i ? { ...c, done: !c.done } : c) } : cl))}
                        className="accent-accent" />
                      <span className={`font-body flex-1 ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.text}</span>
                      <button onClick={e => { e.preventDefault(); setChecklists(cls => cls.map(cl => cl.id === activeChecklistId ? { ...cl, items: cl.items.filter((_, j) => j !== i) } : cl)); }} className="text-muted-foreground hover:text-negative">
                        <X className="w-3 h-3" />
                      </button>
                    </label>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input placeholder="Add item..." value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newCheckItem.trim()) { setChecklists(cls => cls.map(cl => cl.id === activeChecklistId ? { ...cl, items: [...cl.items, { text: newCheckItem.trim(), done: false }] } : cl)); setNewCheckItem(''); } }}
                    className="flex-1 px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                  <button onClick={() => { if (newCheckItem.trim()) { setChecklists(cls => cls.map(cl => cl.id === activeChecklistId ? { ...cl, items: [...cl.items, { text: newCheckItem.trim(), done: false }] } : cl)); setNewCheckItem(''); } }}
                    className="px-2 py-1.5 bg-accent text-accent-foreground font-mono text-[11px] font-bold border border-accent">+</button>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-muted-foreground font-body">{activeChecklist.items.filter(c => c.done).length}/{activeChecklist.items.length} complete</span>
                  <button onClick={() => setChecklists(cls => cls.map(cl => cl.id === activeChecklistId ? { ...cl, items: cl.items.map(c => ({ ...c, done: false })) } : cl))} className="text-[9px] text-accent hover:underline font-body">Reset All</button>
                </div>
              </>
            )}
          </ToolSection>
        );

      // ── Session Timer (multi-mode) ────────────────────────────
      case 'sessionTimer':
        return (
          <ToolSection title="SESSION TIMER" icon="⏱" defaultOpen color="accent">
            {/* Mode selector */}
            <div className="flex gap-1 mb-3 justify-center">
              {(['stopwatch', 'pomodoro', 'countdown'] as TimerMode[]).map(mode => (
                <button key={mode} onClick={() => { resetTimer(); setTimerMode(mode); }}
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase border transition-colors ${timerMode === mode ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                  {mode === 'stopwatch' ? '⏱ Stop' : mode === 'pomodoro' ? '🍅 Pomo' : '⏳ Count'}
                </button>
              ))}
            </div>

            <div className="text-center">
              {/* Pomodoro phase indicator */}
              {timerMode === 'pomodoro' && (
                <div className="mb-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${pomodoroPhase === 'work' ? 'text-negative border-negative bg-negative/10' : 'text-positive border-positive bg-positive/10'}`}>
                    {pomodoroPhase === 'work' ? '🔥 Focus' : '☕ Break'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-body ml-2">#{pomodoroCount} completed</span>
                </div>
              )}

              <div className="font-mono text-2xl font-bold text-foreground mb-3">{fmtTime(timerSeconds)}</div>

              {/* Pomodoro settings */}
              {timerMode === 'pomodoro' && !timerRunning && timerSeconds === 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <InputField label="Work (min)" type="number" value={pomodoroWork.toString()} onChange={e => setPomodoroWork(parseInt(e.target.value) || 25)} />
                  <InputField label="Break (min)" type="number" value={pomodoroBreak.toString()} onChange={e => setPomodoroBreak(parseInt(e.target.value) || 5)} />
                </div>
              )}

              {/* Countdown settings */}
              {timerMode === 'countdown' && !countdownSet && (
                <div className="mb-3">
                  <InputField label="Minutes" type="number" value={countdownMinutes.toString()} onChange={e => setCountdownMinutes(parseInt(e.target.value) || 30)} />
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <button onClick={startTimer}
                  className={`px-4 py-1.5 font-mono text-[11px] font-bold border transition-colors ${timerRunning ? 'bg-negative text-foreground border-negative' : 'bg-accent text-accent-foreground border-accent'}`}
                  {...(timerRunning ? { onClick: () => setTimerRunning(false) } : { onClick: startTimer })}>
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button onClick={resetTimer}
                  className="px-4 py-1.5 bg-surface-elevated text-muted-foreground font-mono text-[11px] font-bold border border-border hover:text-foreground">
                  Reset
                </button>
              </div>

              {/* Progress bar for pomodoro/countdown */}
              {(timerMode === 'pomodoro' || timerMode === 'countdown') && (timerRunning || timerSeconds > 0) && (
                <div className="mt-3 h-1.5 bg-surface-elevated border border-border">
                  <div
                    className={`h-full transition-all ${timerMode === 'pomodoro' && pomodoroPhase === 'break' ? 'bg-positive' : 'bg-accent'}`}
                    style={{
                      width: `${timerMode === 'pomodoro'
                        ? (timerSeconds / ((pomodoroPhase === 'work' ? pomodoroWork : pomodoroBreak) * 60)) * 100
                        : (timerSeconds / (countdownMinutes * 60)) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          </ToolSection>
        );

      // ── Global Market Hours (Enhanced) ────────────────────────
      case 'marketHours':
        return (
          <ToolSection title="GLOBAL MARKETS" icon="🌍" defaultOpen color="pink">
            {/* View toggle */}
            <div className="flex gap-1 mb-3 justify-center">
              <button onClick={() => setMarketView('list')}
                className={`px-3 py-1 text-[9px] font-mono font-bold uppercase border transition-colors ${marketView === 'list' ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                📋 List
              </button>
              <button onClick={() => setMarketView('globe')}
                className={`px-3 py-1 text-[9px] font-mono font-bold uppercase border transition-colors ${marketView === 'globe' ? 'bg-accent text-accent-foreground border-accent' : 'bg-surface-elevated text-muted-foreground border-border hover:text-foreground'}`}>
                🌍 Globe
              </button>
            </div>

            {/* Summary bar */}
            <div className="flex justify-between items-center mb-3 px-2 py-1.5 bg-surface-deep border border-border text-[9px] font-mono">
              <span className="text-muted-foreground">
                <span className="text-positive font-bold">{marketStatuses.filter(m => m.status === 'OPEN').length}</span> Open
              </span>
              <span className="text-muted-foreground">
                <span className="text-accent font-bold">{marketStatuses.filter(m => m.status === 'PRE' || m.status === 'AFTER').length}</span> Extended
              </span>
              <span className="text-muted-foreground">
                <span className="text-negative font-bold">{marketStatuses.filter(m => m.status === 'CLOSED').length}</span> Closed
              </span>
            </div>

            {marketView === 'globe' ? (
              <>
                <MarketGlobe markets={GLOBAL_MARKETS} onToggleExpand={() => setGlobeExpanded(true)} />
                {globeExpanded && <MarketGlobeExpanded markets={GLOBAL_MARKETS} onClose={() => setGlobeExpanded(false)} />}
              </>
            ) : (
              <div className="space-y-px">
                {marketStatuses
                  .map((m, i) => ({ m, i, mkt: GLOBAL_MARKETS[i] }))
                  .filter(({ mkt }) => ['NYSE', 'NDAQ', 'CME', 'LSE', 'XETR', 'TSE', 'HKEX', 'SSE', 'ASX', 'TSX'].includes(mkt.abbr))
                  .map(({ m, i, mkt }) => {
                  const dotColor = m.status === 'OPEN' ? 'hsl(var(--positive))' : m.status === 'CLOSED' ? 'hsl(var(--negative))' : 'hsl(var(--accent))';
                  const textColor = m.status === 'OPEN' ? 'text-positive' : m.status === 'CLOSED' ? 'text-negative' : 'text-accent';
                  const shortCountdown = m.countdown
                    ? m.countdown.replace('Opens in ', '↑').replace('Closes in ', '↓').replace('Session ended', '—')
                    : '';
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[10px_38px_1fr_auto_auto] items-center gap-2 px-2 py-[3px] bg-surface-deep border border-border/40 hover:border-accent/40 hover:bg-surface-primary/40 transition-colors text-[10px]"
                      title={`${mkt.name} • ${mkt.index} • ${m.hoursStr} ${mkt.currency}`}
                    >
                      <div className="relative w-2 h-2">
                        <span className="absolute inset-0 rounded-full" style={{ backgroundColor: dotColor }} />
                        {m.status === 'OPEN' && !m.isLunch && (
                          <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: dotColor, opacity: 0.4 }} />
                        )}
                      </div>
                      <span className="font-mono font-bold text-foreground">{mkt.abbr}</span>
                      <span className={`font-mono font-bold ${textColor} truncate`}>
                        {m.isLunch ? 'LUNCH' : m.label.toUpperCase()}
                      </span>
                      <span className="font-mono text-muted-foreground tabular-nums text-[9px]">{m.time}</span>
                      {shortCountdown && (
                        <span className={`font-mono ${textColor} text-[9px] tabular-nums w-14 text-right truncate`}>{shortCountdown}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ToolSection>
        );

      // ── Economic Events ───────────────────────────────────────
      case 'econCalendar':
        return (
          <ToolSection title="ECONOMIC EVENTS" icon="📅" color="pink">
            <div className="space-y-1">
              {[
                { time: '08:30 ET', event: 'CPI m/m', impact: 'HIGH', prev: '0.4%', forecast: '0.3%' },
                { time: '10:00 ET', event: 'Consumer Sentiment', impact: 'MED', prev: '67.8', forecast: '68.2' },
                { time: '14:00 ET', event: 'FOMC Minutes', impact: 'HIGH', prev: '—', forecast: '—' },
                { time: '08:30 ET +1d', event: 'Jobless Claims', impact: 'MED', prev: '232K', forecast: '228K' },
              ].map((ev, i) => (
                <div key={i} className="py-1.5 px-2 bg-surface-deep border border-border text-[10px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-muted-foreground">{ev.time}</span>
                    <span className={`font-mono font-bold text-[8px] px-1 py-0.5 border ${ev.impact === 'HIGH' ? 'text-negative border-negative bg-negative/10' : 'text-accent border-accent bg-accent/10'}`}>
                      {ev.impact}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-foreground">{ev.event}</div>
                  <div className="flex gap-3 mt-0.5 text-[9px]">
                    <span className="text-muted-foreground">Prev: <span className="text-foreground font-mono">{ev.prev}</span></span>
                    <span className="text-muted-foreground">Fcst: <span className="text-accent font-mono">{ev.forecast}</span></span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-muted-foreground font-body mt-2 text-center">Sample data • Connect to live feed for real events</div>
          </ToolSection>
        );

      // ── Trade Ideas ───────────────────────────────────────────
      case 'tradeIdeas':
        return (
          <ToolSection title="TRADE IDEAS" icon="💡" color="green">
            <div className="space-y-1 mb-3">
              {tradeIdeas.map((idea, i) => (
                <div key={idea.id} className="py-1.5 px-2 bg-surface-deep border border-border text-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-foreground">{idea.symbol}</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-mono font-bold text-[8px] px-1 ${idea.direction === 'LONG' ? 'text-positive' : 'text-negative'}`}>{idea.direction}</span>
                      <select
                        value={idea.status}
                        onChange={e => setTradeIdeas(ideas => ideas.map(id => id.id === idea.id ? { ...id, status: e.target.value as any } : id))}
                        className="bg-surface-elevated border border-border text-foreground font-mono text-[8px] px-1 py-0.5"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button onClick={() => setTradeIdeas(ideas => ideas.filter(id => id.id !== idea.id))} className="text-muted-foreground hover:text-negative">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[9px] text-muted-foreground font-mono">
                    <span>E: {idea.entry}</span>
                    <span>S: {idea.stop}</span>
                    <span>T: {idea.target}</span>
                  </div>
                  {idea.notes && <div className="text-[9px] text-muted-foreground font-body mt-1 border-l-2 border-accent/30 pl-1">{idea.notes}</div>}
                </div>
              ))}
              {tradeIdeas.length === 0 && <div className="text-[9px] text-muted-foreground font-body text-center py-2">No trade ideas yet</div>}
            </div>

            {/* Add idea form */}
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto] gap-1">
                <input placeholder="Symbol" value={ideaInput.symbol} onChange={e => setIdeaInput({ ...ideaInput, symbol: e.target.value.toUpperCase() })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                <select value={ideaInput.direction} onChange={e => setIdeaInput({ ...ideaInput, direction: e.target.value })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px]">
                  <option>LONG</option><option>SHORT</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <input placeholder="Entry" value={ideaInput.entry} onChange={e => setIdeaInput({ ...ideaInput, entry: e.target.value })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                <input placeholder="Stop" value={ideaInput.stop} onChange={e => setIdeaInput({ ...ideaInput, stop: e.target.value })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
                <input placeholder="Target" value={ideaInput.target} onChange={e => setIdeaInput({ ...ideaInput, target: e.target.value })}
                  className="px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
              </div>
              <input placeholder="Notes (thesis, catalyst...)" value={ideaInput.notes} onChange={e => setIdeaInput({ ...ideaInput, notes: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-accent" />
              <button onClick={() => {
                if (ideaInput.symbol) {
                  setTradeIdeas(ideas => [...ideas, { ...ideaInput, id: Date.now().toString(), status: 'pending' as const }]);
                  setIdeaInput({ symbol: '', direction: 'LONG', entry: '', stop: '', target: '', notes: '' });
                }
              }} className="w-full px-3 py-1.5 bg-accent text-accent-foreground font-mono text-[11px] font-bold border border-accent hover:opacity-90 transition-opacity">
                Add Idea
              </button>
            </div>
          </ToolSection>
        );

      case 'hotkeys':
        return (
          <ToolSection title="HOTKEYS REFERENCE" icon="⌨" color="accent">
            <div className="space-y-1">
              {[
                { keys: 'Ctrl+N', action: 'New Trade' },
                { keys: 'Ctrl+S', action: 'Save / Export' },
                { keys: 'Ctrl+B', action: 'Toggle Sidebar' },
                { keys: 'Ctrl+F', action: 'Search Trades' },
                { keys: 'Ctrl+J', action: 'Open Journal' },
                { keys: 'Esc', action: 'Close Modal' },
              ].map(h => (
                <div key={h.keys} className="flex items-center justify-between py-1.5 text-[11px]">
                  <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border font-mono text-accent text-[10px]">{h.keys}</kbd>
                  <span className="text-muted-foreground font-body">{h.action}</span>
                </div>
              ))}
            </div>
          </ToolSection>
        );

      case 'compound':
        return (
          <ToolSection title="COMPOUND INTEREST" icon="💹" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Principal ($)" type="number" value={compInputs.principal} onChange={e => setCompInputs({ ...compInputs, principal: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Annual Rate (%)" type="number" step="0.1" value={compInputs.rate} onChange={e => setCompInputs({ ...compInputs, rate: e.target.value })} />
                <InputField label="Years" type="number" value={compInputs.years} onChange={e => setCompInputs({ ...compInputs, years: e.target.value })} />
              </div>
              <InputField label="Compounds/Year" type="number" value={compInputs.compound} onChange={e => setCompInputs({ ...compInputs, compound: e.target.value })} />
            </div>
            <CalcButton onClick={calcCompound} label="Calculate" />
            {compResult && (<div className="bg-surface-deep border border-border p-3">
              <ResultRow label="Future Value" value={`$${compResult.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClass="text-positive" />
              <ResultRow label="Interest Earned" value={`$${compResult.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClass="text-accent" />
            </div>)}
          </ToolSection>
        );

      case 'pip':
        return (
          <ToolSection title="PIP CALCULATOR" icon="💱" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Lot Size" type="number" value={pipInputs.lotSize} onChange={e => setPipInputs({ ...pipInputs, lotSize: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Pips" type="number" value={pipInputs.pips} onChange={e => setPipInputs({ ...pipInputs, pips: e.target.value })} />
                <InputField label="Pip Value" type="number" step="0.0001" value={pipInputs.pipValue} onChange={e => setPipInputs({ ...pipInputs, pipValue: e.target.value })} />
              </div>
            </div>
            <CalcButton onClick={calcPip} label="Calculate" />
            {pipResult && (<div className="bg-surface-deep border border-border p-3">
              <ResultRow label="Pip Value" value={`$${pipResult.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClass="text-accent" />
            </div>)}
          </ToolSection>
        );

      case 'margin':
        return (
          <ToolSection title="MARGIN CALCULATOR" icon="🏦" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Position Size ($)" type="number" value={marginInputs.posSize} onChange={e => setMarginInputs({ ...marginInputs, posSize: e.target.value })} />
              <InputField label="Leverage (x)" type="number" value={marginInputs.leverage} onChange={e => setMarginInputs({ ...marginInputs, leverage: e.target.value })} />
            </div>
            <CalcButton onClick={calcMargin} label="Calculate" />
            {marginResult && (<div className="bg-surface-deep border border-border p-3">
              <ResultRow label="Required Margin" value={`$${marginResult.required.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueClass="text-accent" />
            </div>)}
          </ToolSection>
        );

      case 'fibonacci':
        return (
          <ToolSection title="FIBONACCI LEVELS" icon="🔢" color="green">
            <div className="space-y-2.5 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <InputField label="High" type="number" step="0.01" value={fibInputs.high} onChange={e => setFibInputs({ ...fibInputs, high: e.target.value })} />
                <InputField label="Low" type="number" step="0.01" value={fibInputs.low} onChange={e => setFibInputs({ ...fibInputs, low: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1 uppercase font-body">Direction</label>
                <select value={fibInputs.direction} onChange={e => setFibInputs({ ...fibInputs, direction: e.target.value })}
                  className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground font-mono text-[11px]">
                  <option value="up">Retracement (Up)</option>
                  <option value="down">Retracement (Down)</option>
                </select>
              </div>
            </div>
            <CalcButton onClick={calcFib} label="Calculate Levels" />
            {fibResult && (<div className="bg-surface-deep border border-border p-3">
              {fibResult.levels.map(l => (
                <div key={l.pct} className="flex justify-between py-1 border-b border-border last:border-0 text-[11px]">
                  <span className="text-accent font-mono font-bold">{l.pct}</span>
                  <span className="font-mono text-foreground">${l.price.toFixed(2)}</span>
                </div>
              ))}
            </div>)}
          </ToolSection>
        );

      case 'cagr':
        return (
          <ToolSection title="CAGR CALCULATOR" icon="📊" color="green">
            <div className="space-y-2.5 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Start Value ($)" type="number" value={cagrInputs.startValue} onChange={e => setCagrInputs({ ...cagrInputs, startValue: e.target.value })} />
                <InputField label="End Value ($)" type="number" value={cagrInputs.endValue} onChange={e => setCagrInputs({ ...cagrInputs, endValue: e.target.value })} />
              </div>
              <InputField label="Years" type="number" value={cagrInputs.years} onChange={e => setCagrInputs({ ...cagrInputs, years: e.target.value })} />
            </div>
            <CalcButton onClick={calcCAGR} label="Calculate CAGR" />
            {cagrResult && (<div className="bg-surface-deep border border-border p-3">
              <ResultRow label="CAGR" value={`${cagrResult.cagr.toFixed(2)}%`} valueClass={cagrResult.cagr >= 0 ? 'text-positive text-lg' : 'text-negative text-lg'} />
            </div>)}
          </ToolSection>
        );

      case 'todayPerf':
        return (
          <ToolSection title="TODAY'S PERFORMANCE" icon="📊" color="purple">
            <ul className="space-y-0">
              {[{ l: 'Trades', v: '7' }, { l: 'Winners', v: '5', c: 'text-positive' }, { l: 'Losers', v: '2', c: 'text-negative' }, { l: "Today's P&L", v: '+$1,245.80', c: 'text-positive' }].map(m => (
                <li key={m.l} className="flex justify-between py-1.5 border-b border-border last:border-0 text-[11px]">
                  <span className="text-muted-foreground font-body">{m.l}</span>
                  <span className={`font-bold font-mono ${m.c || ''}`}>{m.v}</span>
                </li>
              ))}
            </ul>
          </ToolSection>
        );

      case 'stratPerf':
        return (
          <ToolSection title="STRATEGY PERFORMANCE" icon="📈" color="purple">
            {[{ name: 'Swing Trading', rate: 64 }, { name: 'Options', rate: 58 }, { name: 'Day Trading', rate: 48, negative: true }, { name: 'Scalping', rate: 71 }].map(s => (
              <div key={s.name} className="mb-3 last:mb-0">
                <div className="text-[10px] text-muted-foreground mb-1 font-body">{s.name} - {s.rate}% Win Rate</div>
                <div className="h-5 bg-surface-elevated border border-border">
                  <div className={`h-full ${s.negative ? 'bg-negative' : 'bg-positive'}`} style={{ width: `${s.rate}%` }} />
                </div>
              </div>
            ))}
          </ToolSection>
        );

      case 'topPerformers':
        return (
          <ToolSection title="TOP PERFORMERS" icon="🏆" color="purple">
            <ul className="space-y-0">
              {[{ l: 'SPY', v: '+$3,245', c: 'text-positive' }, { l: 'AAPL', v: '+$2,180', c: 'text-positive' }, { l: 'QQQ', v: '+$1,825', c: 'text-positive' }, { l: 'TSLA', v: '-$1,340', c: 'text-negative' }, { l: 'NVDA', v: '-$980', c: 'text-negative' }].map(m => (
                <li key={m.l} className="flex justify-between py-1.5 border-b border-border last:border-0 text-[11px]">
                  <span className="font-bold font-mono">{m.l}</span>
                  <span className={`font-bold font-mono ${m.c}`}>{m.v}</span>
                </li>
              ))}
            </ul>
          </ToolSection>
        );

      case 'calcHub':
        return (
          <ToolSection title="CALCULATORS" icon="📐" defaultOpen color="green">
            <CalcHub />
          </ToolSection>
        );

      case 'opraPricer':
        return (
          <ToolSection title="OPTIONS QUICK PRICER" icon="⚡" defaultOpen color="green">
            <OpraPricer />
          </ToolSection>
        );

      case 'preMarketScan':
        return (
          <ToolSection title="PRE-MARKET SCANNER" icon="🔍" defaultOpen color="pink">
            <PreMarketScan />
          </ToolSection>
        );


      case 'macroSnapshot': {
        const snapshotData = [
          { label: 'S&P 500', value: '5,428.72', chg: '+0.34%', positive: true },
          { label: 'Nasdaq', value: '17,126.40', chg: '+0.52%', positive: true },
          { label: 'DJIA', value: '40,112.55', chg: '-0.11%', positive: false },
          { label: 'Russell 2K', value: '2,048.33', chg: '+0.18%', positive: true },
          { label: 'VIX', value: '14.82', chg: '-3.20%', positive: true },
          { label: 'US 10Y', value: '4.28%', chg: '+2bp', positive: false },
          { label: 'US 2Y', value: '4.71%', chg: '-1bp', positive: true },
          { label: '2s10s', value: '-43bp', chg: '+3bp', positive: true },
          { label: 'DXY', value: '104.32', chg: '-0.15%', positive: true },
          { label: 'Gold', value: '$2,338', chg: '+0.42%', positive: true },
          { label: 'WTI', value: '$78.44', chg: '-1.12%', positive: false },
          { label: 'BTC', value: '$67,820', chg: '+2.14%', positive: true },
          { label: 'EUR/USD', value: '1.0842', chg: '+0.08%', positive: true },
          { label: 'USD/JPY', value: '157.22', chg: '+0.22%', positive: false },
          { label: 'IG CDX', value: '52bp', chg: '-1bp', positive: true },
          { label: 'HY CDX', value: '318bp', chg: '-3bp', positive: true },
        ];
        return (
          <ToolSection title="MACRO SNAPSHOT" icon="📡" defaultOpen color="cyan">
            <div className="grid grid-cols-2 gap-0">
              {snapshotData.map(d => (
                <div key={d.label} className="flex justify-between items-center py-1.5 px-1.5 border-b border-grid-line odd:border-r">
                  <span className="text-[9px] font-mono text-muted-foreground">{d.label}</span>
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-foreground">{d.value}</div>
                    <div className={`text-[8px] font-mono font-bold ${d.positive ? 'text-positive' : 'text-negative'}`}>{d.chg}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[8px] font-mono text-muted-foreground/50 text-center">Simulated data • Updates on refresh</div>
          </ToolSection>
        );
      }

      case 'riskSentiment': {
        const riskIndicators = [
          { label: 'VIX', value: 14.82, zone: 'low', desc: 'Complacency', threshold: [0, 15, 20, 30, 80] },
          { label: 'MOVE Index', value: 98.5, zone: 'neutral', desc: 'Moderate', threshold: [0, 80, 110, 140, 250] },
          { label: 'Put/Call', value: 0.72, zone: 'neutral', desc: 'Balanced', threshold: [0, 0.6, 0.8, 1.0, 2.0] },
          { label: 'HY Spread', value: 318, zone: 'low', desc: 'Tight', threshold: [0, 300, 400, 500, 1000] },
          { label: 'SKEW', value: 138, zone: 'elevated', desc: 'Tail risk', threshold: [100, 120, 135, 150, 180] },
          { label: 'IG CDX', value: 52, zone: 'low', desc: 'Calm', threshold: [0, 60, 80, 100, 200] },
        ];
        const zoneColor = (z: string) => z === 'low' ? 'text-positive' : z === 'neutral' ? 'text-accent' : z === 'elevated' ? 'text-warning' : 'text-negative';
        const zoneBg = (z: string) => z === 'low' ? 'bg-positive' : z === 'neutral' ? 'bg-accent' : z === 'elevated' ? 'bg-yellow-500' : 'bg-negative';
        const overallScore = 72; // Risk-on score 0-100
        return (
          <ToolSection title="RISK SENTIMENT" icon="🎯" color="cyan">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Risk Appetite Score</span>
                <span className="text-sm font-mono font-bold text-positive">{overallScore}/100</span>
              </div>
              <div className="h-2.5 bg-surface-elevated border border-border rounded-sm overflow-hidden">
                <div className="h-full bg-gradient-to-r from-negative via-yellow-500 to-positive" style={{ width: `${overallScore}%` }} />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[7px] font-mono text-negative">RISK OFF</span>
                <span className="text-[7px] font-mono text-positive">RISK ON</span>
              </div>
            </div>
            <div className="space-y-0">
              {riskIndicators.map(ind => (
                <div key={ind.label} className="flex items-center gap-2 py-1.5 border-b border-grid-line last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${zoneBg(ind.zone)}`} />
                  <span className="text-[9px] font-mono text-muted-foreground w-16">{ind.label}</span>
                  <span className="text-[10px] font-mono font-bold text-foreground flex-1">{ind.value}</span>
                  <span className={`text-[8px] font-mono font-bold ${zoneColor(ind.zone)}`}>{ind.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 bg-surface-elevated border border-border">
              <div className="text-[9px] font-mono text-accent font-bold mb-1">REGIME SIGNAL</div>
              <div className="text-[10px] font-mono text-positive font-bold">▲ RISK-ON</div>
              <div className="text-[8px] font-mono text-muted-foreground mt-0.5">Low vol + tight spreads + strong PMI = favorable conditions for risk assets.</div>
            </div>
          </ToolSection>
        );
      }

      case 'correlationMatrix':
        return (
          <ToolSection title="CORRELATION MATRIX" icon="🔗" color="cyan">
            <CorrMatrix />
          </ToolSection>
        );


      case 'treasuryMonitor': {
        const yields = [
          { tenor: '1M', yield: 5.38, chg: 0, prev: 5.38 },
          { tenor: '3M', yield: 5.36, chg: -1, prev: 5.37 },
          { tenor: '6M', yield: 5.28, chg: -2, prev: 5.30 },
          { tenor: '1Y', yield: 5.05, chg: -3, prev: 5.08 },
          { tenor: '2Y', yield: 4.71, chg: -1, prev: 4.72 },
          { tenor: '3Y', yield: 4.52, chg: 0, prev: 4.52 },
          { tenor: '5Y', yield: 4.35, chg: +1, prev: 4.34 },
          { tenor: '7Y', yield: 4.34, chg: +1, prev: 4.33 },
          { tenor: '10Y', yield: 4.28, chg: +2, prev: 4.26 },
          { tenor: '20Y', yield: 4.52, chg: +2, prev: 4.50 },
          { tenor: '30Y', yield: 4.45, chg: +3, prev: 4.42 },
        ];
        const maxYield = Math.max(...yields.map(y => y.yield));
        return (
          <ToolSection title="TREASURY MONITOR" icon="🏛" color="cyan">
            <div className="space-y-0">
              {yields.map(y => (
                <div key={y.tenor} className="flex items-center gap-1.5 py-1 border-b border-grid-line last:border-0">
                  <span className="text-[9px] font-mono font-bold text-accent w-8">{y.tenor}</span>
                  <div className="flex-1 h-3 bg-surface-elevated border border-grid-line relative">
                    <div className="h-full bg-accent/20" style={{ width: `${(y.yield / maxYield) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-foreground w-12 text-right">{y.yield.toFixed(2)}%</span>
                  <span className={`text-[8px] font-mono font-bold w-8 text-right ${y.chg > 0 ? 'text-negative' : y.chg < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                    {y.chg > 0 ? '+' : ''}{y.chg}bp
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="p-1.5 bg-surface-elevated border border-border">
                <div className="text-[8px] font-mono text-muted-foreground">2s10s Spread</div>
                <div className="text-[11px] font-mono font-bold text-negative">-43bp</div>
                <div className="text-[7px] font-mono text-muted-foreground">Inverted</div>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border">
                <div className="text-[8px] font-mono text-muted-foreground">3m10y Spread</div>
                <div className="text-[11px] font-mono font-bold text-negative">-108bp</div>
                <div className="text-[7px] font-mono text-muted-foreground">Deep inversion</div>
              </div>
            </div>
          </ToolSection>
        );
      }

      case 'dxyTracker': {
        const fxPairs = [
          { pair: 'DXY', value: '104.32', chg: '-0.15%', positive: false, bar: 62 },
          { pair: 'EUR/USD', value: '1.0842', chg: '+0.08%', positive: true, bar: 54 },
          { pair: 'GBP/USD', value: '1.2718', chg: '+0.12%', positive: true, bar: 58 },
          { pair: 'USD/JPY', value: '157.22', chg: '+0.22%', positive: false, bar: 78 },
          { pair: 'USD/CHF', value: '0.8912', chg: '-0.05%', positive: true, bar: 45 },
          { pair: 'AUD/USD', value: '0.6644', chg: '+0.18%', positive: true, bar: 42 },
          { pair: 'USD/CAD', value: '1.3688', chg: '-0.08%', positive: true, bar: 52 },
          { pair: 'NZD/USD', value: '0.6112', chg: '+0.10%', positive: true, bar: 38 },
        ];
        const dxyComponents = [
          { ccy: 'EUR', weight: '57.6%', impact: '-0.09%' },
          { ccy: 'JPY', weight: '13.6%', impact: '+0.03%' },
          { ccy: 'GBP', weight: '11.9%', impact: '-0.01%' },
          { ccy: 'CAD', weight: '9.1%', impact: '+0.01%' },
          { ccy: 'SEK', weight: '4.2%', impact: '-0.01%' },
          { ccy: 'CHF', weight: '3.6%', impact: '+0.00%' },
        ];
        return (
          <ToolSection title="DXY & FX TRACKER" icon="💵" color="cyan">
            <div className="space-y-0 mb-3">
              {fxPairs.map(p => (
                <div key={p.pair} className="flex items-center gap-1.5 py-1.5 border-b border-grid-line last:border-0">
                  <span className={`text-[9px] font-mono font-bold w-14 ${p.pair === 'DXY' ? 'text-accent' : 'text-muted-foreground'}`}>{p.pair}</span>
                  <div className="flex-1 h-2 bg-surface-elevated border border-grid-line">
                    <div className={`h-full ${p.positive ? 'bg-positive/30' : 'bg-negative/30'}`} style={{ width: `${p.bar}%` }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-foreground w-14 text-right">{p.value}</span>
                  <span className={`text-[8px] font-mono font-bold w-12 text-right ${p.positive ? 'text-positive' : 'text-negative'}`}>{p.chg}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2">
              <div className="text-[9px] font-mono text-accent font-bold mb-1.5">DXY COMPONENT WEIGHTS</div>
              {dxyComponents.map(c => (
                <div key={c.ccy} className="flex items-center justify-between py-1 border-b border-grid-line last:border-0">
                  <span className="text-[9px] font-mono text-muted-foreground">{c.ccy}</span>
                  <span className="text-[9px] font-mono text-foreground">{c.weight}</span>
                  <span className={`text-[8px] font-mono font-bold ${c.impact.startsWith('+') ? 'text-positive' : c.impact.startsWith('-') ? 'text-negative' : 'text-muted-foreground'}`}>{c.impact}</span>
                </div>
              ))}
            </div>
          </ToolSection>
        );
      }

      case 'futuresMonitor': {
        const futures = [
          { sym: 'ES', name: 'S&P 500', price: '5,432.50', chg: '+12.25', pct: '+0.23%', vol: '1.2M', pos: true },
          { sym: 'NQ', name: 'Nasdaq 100', price: '19,245.75', chg: '+68.50', pct: '+0.36%', vol: '892K', pos: true },
          { sym: 'YM', name: 'Dow Jones', price: '40,185', chg: '-42', pct: '-0.10%', vol: '445K', pos: false },
          { sym: 'RTY', name: 'Russell 2K', price: '2,052.80', chg: '+4.60', pct: '+0.22%', vol: '312K', pos: true },
          { sym: 'ZB', name: '30Y T-Bond', price: '118-16', chg: '-0-08', pct: '-0.04%', vol: '620K', pos: false },
          { sym: 'ZN', name: '10Y T-Note', price: '110-24', chg: '-0-04', pct: '-0.02%', vol: '1.8M', pos: false },
          { sym: 'GC', name: 'Gold', price: '2,342.30', chg: '+8.40', pct: '+0.36%', vol: '245K', pos: true },
          { sym: 'CL', name: 'Crude Oil', price: '78.62', chg: '-0.88', pct: '-1.11%', vol: '1.1M', pos: false },
          { sym: 'SI', name: 'Silver', price: '29.48', chg: '+0.32', pct: '+1.10%', vol: '148K', pos: true },
          { sym: '6E', name: 'Euro FX', price: '1.0845', chg: '+0.0008', pct: '+0.07%', vol: '380K', pos: true },
          { sym: 'NG', name: 'Natural Gas', price: '2.648', chg: '-0.042', pct: '-1.56%', vol: '520K', pos: false },
          { sym: 'HG', name: 'Copper', price: '4.5820', chg: '+0.0340', pct: '+0.75%', vol: '95K', pos: true },
        ];
        return (
          <ToolSection title="FUTURES MONITOR" icon="📟" color="pink">
            <div className="space-y-0">
              {futures.map(f => (
                <div key={f.sym} className="flex items-center gap-1 py-1.5 border-b border-grid-line last:border-0">
                  <span className="text-[9px] font-mono font-bold text-accent w-7">{f.sym}</span>
                  <span className="text-[8px] font-mono text-muted-foreground w-16 truncate">{f.name}</span>
                  <span className="text-[10px] font-mono font-bold text-foreground flex-1 text-right">{f.price}</span>
                  <span className={`text-[8px] font-mono font-bold w-14 text-right ${f.pos ? 'text-positive' : 'text-negative'}`}>{f.chg}</span>
                  <span className={`text-[8px] font-mono font-bold w-12 text-right ${f.pos ? 'text-positive' : 'text-negative'}`}>{f.pct}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[8px] font-mono text-muted-foreground/50 text-center">Simulated • Updates on refresh</div>
          </ToolSection>
        );
      }

      case 'earningsCalendar': {
        const earnings = [
          { date: 'Apr 14', sym: 'GS', name: 'Goldman Sachs', eps: '$8.72', rev: '$12.8B', time: 'BMO', surprise: '+4.2%' },
          { date: 'Apr 15', sym: 'BAC', name: 'Bank of America', eps: '$0.82', rev: '$25.5B', time: 'BMO', surprise: '' },
          { date: 'Apr 15', sym: 'UNH', name: 'UnitedHealth', eps: '$6.73', rev: '$99.8B', time: 'BMO', surprise: '' },
          { date: 'Apr 16', sym: 'ASML', name: 'ASML Holding', eps: '$5.28', rev: '$7.1B', time: 'BMO', surprise: '' },
          { date: 'Apr 17', sym: 'NFLX', name: 'Netflix', eps: '$4.52', rev: '$9.3B', time: 'AMC', surprise: '' },
          { date: 'Apr 17', sym: 'TSM', name: 'Taiwan Semi', eps: '$1.82', rev: '$25.8B', time: 'BMO', surprise: '' },
          { date: 'Apr 22', sym: 'TSLA', name: 'Tesla', eps: '$0.42', rev: '$21.4B', time: 'AMC', surprise: '' },
          { date: 'Apr 23', sym: 'META', name: 'Meta Platforms', eps: '$4.36', rev: '$38.2B', time: 'AMC', surprise: '' },
        ];
        return (
          <ToolSection title="EARNINGS CALENDAR" icon="📅" color="pink">
            <div className="space-y-0">
              {earnings.map((e, i) => (
                <div key={i} className="py-1.5 px-1 border-b border-grid-line last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-muted-foreground">{e.date}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">{e.sym}</span>
                      <span className="text-[8px] font-mono text-muted-foreground truncate">{e.name}</span>
                    </div>
                    <span className={`text-[7px] font-mono font-bold px-1 py-0.5 border ${e.time === 'BMO' ? 'text-[hsl(45,100%,60%)] border-[hsl(45,100%,60%)]/30 bg-[hsl(45,100%,60%)]/10' : 'text-[hsl(270,70%,70%)] border-[hsl(270,70%,70%)]/30 bg-[hsl(270,70%,70%)]/10'}`}>
                      {e.time}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[8px] font-mono">
                    <span className="text-muted-foreground">EPS: <span className="text-foreground font-bold">{e.eps}</span></span>
                    <span className="text-muted-foreground">Rev: <span className="text-foreground font-bold">{e.rev}</span></span>
                    {e.surprise && <span className="text-positive font-bold">{e.surprise}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ToolSection>
        );
      }

      case 'sectorRotation': {
        const sectors = [
          { name: 'Technology', chg: '+1.24%', flow: '+$2.1B', momentum: 'Strong', pos: true, score: 88 },
          { name: 'Healthcare', chg: '+0.82%', flow: '+$890M', momentum: 'Moderate', pos: true, score: 72 },
          { name: 'Financials', chg: '+0.45%', flow: '+$540M', momentum: 'Moderate', pos: true, score: 65 },
          { name: 'Energy', chg: '-0.92%', flow: '-$380M', momentum: 'Weak', pos: false, score: 35 },
          { name: 'Consumer Disc.', chg: '+0.28%', flow: '+$120M', momentum: 'Neutral', pos: true, score: 52 },
          { name: 'Industrials', chg: '+0.55%', flow: '+$310M', momentum: 'Moderate', pos: true, score: 60 },
          { name: 'Materials', chg: '-0.18%', flow: '-$95M', momentum: 'Weak', pos: false, score: 42 },
          { name: 'Utilities', chg: '-0.35%', flow: '-$210M', momentum: 'Weak', pos: false, score: 28 },
          { name: 'Real Estate', chg: '-0.62%', flow: '-$440M', momentum: 'Weak', pos: false, score: 32 },
          { name: 'Comm Services', chg: '+0.98%', flow: '+$680M', momentum: 'Strong', pos: true, score: 78 },
          { name: 'Staples', chg: '+0.12%', flow: '-$55M', momentum: 'Neutral', pos: true, score: 48 },
        ];
        const momColor = (m: string) => m === 'Strong' ? 'text-positive' : m === 'Moderate' ? 'text-accent' : m === 'Neutral' ? 'text-muted-foreground' : 'text-negative';
        return (
          <ToolSection title="SECTOR ROTATION" icon="🔄" color="purple">
            <div className="space-y-0">
              {sectors.sort((a, b) => b.score - a.score).map(s => (
                <div key={s.name} className="flex items-center gap-1 py-1.5 border-b border-grid-line last:border-0">
                  <span className="text-[9px] font-mono text-muted-foreground w-24 truncate">{s.name}</span>
                  <div className="flex-1 h-2 bg-surface-elevated border border-grid-line">
                    <div className={`h-full ${s.pos ? 'bg-positive/30' : 'bg-negative/30'}`} style={{ width: `${s.score}%` }} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold w-14 text-right ${s.pos ? 'text-positive' : 'text-negative'}`}>{s.chg}</span>
                  <span className={`text-[8px] font-mono font-bold w-12 text-right ${momColor(s.momentum)}`}>{s.momentum}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 p-1.5 bg-surface-elevated border border-border">
              <div className="text-[8px] font-mono text-[hsl(270,70%,70%)] font-bold mb-0.5">ROTATION SIGNAL</div>
              <div className="text-[9px] font-mono text-muted-foreground">Growth → Cyclicals shift detected. Tech & Comm leading, Defensives lagging.</div>
            </div>
          </ToolSection>
        );
      }

      case 'volTermStructure': {
        const volData = [
          { expiry: '1W', vix: 12.8, iv: 14.2, rv: 11.5, term: 'Backwardation' },
          { expiry: '1M', vix: 14.8, iv: 16.1, rv: 13.2, term: 'Contango' },
          { expiry: '2M', vix: 16.2, iv: 17.5, rv: 14.0, term: 'Contango' },
          { expiry: '3M', vix: 17.5, iv: 18.8, rv: 14.5, term: 'Contango' },
          { expiry: '6M', vix: 19.2, iv: 20.4, rv: 15.2, term: 'Contango' },
          { expiry: '1Y', vix: 20.8, iv: 21.5, rv: 16.0, term: 'Contango' },
        ];
        const maxVol = 25;
        return (
          <ToolSection title="VOL TERM STRUCTURE" icon="📉" color="cyan">
            <div className="space-y-0 mb-3">
              <div className="flex items-center gap-1 py-1 border-b border-border text-[7px] font-mono text-muted-foreground">
                <span className="w-8">EXP</span>
                <span className="flex-1">VIX FUT</span>
                <span className="w-10 text-right">IV</span>
                <span className="w-10 text-right">RV</span>
                <span className="w-10 text-right">SPREAD</span>
              </div>
              {volData.map(v => (
                <div key={v.expiry} className="flex items-center gap-1 py-1.5 border-b border-grid-line last:border-0">
                  <span className="text-[9px] font-mono font-bold text-accent w-8">{v.expiry}</span>
                  <div className="flex-1 h-3 bg-surface-elevated border border-grid-line relative">
                    <div className="h-full bg-[hsl(185,70%,55%)]/20" style={{ width: `${(v.vix / maxVol) * 100}%` }} />
                    <div className="absolute top-0 h-full border-r border-negative/50" style={{ left: `${(v.rv / maxVol) * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-foreground w-10 text-right">{v.iv.toFixed(1)}</span>
                  <span className="text-[9px] font-mono text-muted-foreground w-10 text-right">{v.rv.toFixed(1)}</span>
                  <span className={`text-[8px] font-mono font-bold w-10 text-right ${v.iv > v.rv ? 'text-positive' : 'text-negative'}`}>
                    {(v.iv - v.rv).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">VIX SPOT</div>
                <div className="text-[11px] font-mono font-bold text-positive">14.82</div>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">VVIX</div>
                <div className="text-[11px] font-mono font-bold text-foreground">82.4</div>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">SKEW</div>
                <div className="text-[11px] font-mono font-bold text-accent">138.2</div>
              </div>
            </div>
          </ToolSection>
        );
      }

      case 'econSurprise': {
        const surprises = [
          { indicator: 'NFP', actual: '272K', expect: '190K', surprise: '+43.2%', date: 'Apr 4', pos: true },
          { indicator: 'CPI y/y', actual: '3.4%', expect: '3.4%', surprise: '0.0%', date: 'Apr 10', pos: true },
          { indicator: 'Retail Sales', actual: '0.7%', expect: '0.4%', surprise: '+75.0%', date: 'Apr 15', pos: true },
          { indicator: 'PMI Mfg', actual: '50.3', expect: '51.5', surprise: '-2.3%', date: 'Apr 1', pos: false },
          { indicator: 'ISM Svcs', actual: '49.4', expect: '52.0', surprise: '-5.0%', date: 'Apr 3', pos: false },
          { indicator: 'Claims', actual: '215K', expect: '225K', surprise: '+4.4%', date: 'Apr 11', pos: true },
          { indicator: 'PPI m/m', actual: '0.2%', expect: '0.3%', surprise: '+33.3%', date: 'Apr 11', pos: true },
          { indicator: 'Housing Starts', actual: '1.32M', expect: '1.42M', surprise: '-7.0%', date: 'Apr 16', pos: false },
        ];
        const posCount = surprises.filter(s => s.pos).length;
        const negCount = surprises.filter(s => !s.pos).length;
        return (
          <ToolSection title="ECON SURPRISE INDEX" icon="⚡" color="cyan">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">CESI (US)</div>
                <div className="text-sm font-mono font-bold text-positive">+28.4</div>
                <div className="text-[7px] font-mono text-muted-foreground">Above trend</div>
              </div>
              <div className="flex-1 p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">BEATS</div>
                <div className="text-sm font-mono font-bold text-positive">{posCount}</div>
              </div>
              <div className="flex-1 p-1.5 bg-surface-elevated border border-border text-center">
                <div className="text-[7px] font-mono text-muted-foreground">MISSES</div>
                <div className="text-sm font-mono font-bold text-negative">{negCount}</div>
              </div>
            </div>
            <div className="space-y-0">
              {surprises.map((s, i) => (
                <div key={i} className="flex items-center gap-1 py-1.5 border-b border-grid-line last:border-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.pos ? 'bg-positive' : 'bg-negative'}`} />
                  <span className="text-[9px] font-mono font-bold text-foreground w-20">{s.indicator}</span>
                  <span className="text-[8px] font-mono text-muted-foreground w-10">{s.date}</span>
                  <span className="text-[9px] font-mono font-bold text-foreground flex-1 text-right">{s.actual}</span>
                  <span className="text-[8px] font-mono text-muted-foreground w-10 text-right">{s.expect}</span>
                  <span className={`text-[8px] font-mono font-bold w-14 text-right ${s.pos ? 'text-positive' : 'text-negative'}`}>{s.surprise}</span>
                </div>
              ))}
            </div>
          </ToolSection>
        );
      }

      case 'flowMonitor': {
        const flows = [
          { type: 'Dark Pool', sym: 'SPY', size: '$1.2B', side: 'BUY', time: '10:32', sentiment: 'Bullish' },
          { type: 'Block', sym: 'AAPL', size: '$480M', side: 'SELL', time: '10:28', sentiment: 'Bearish' },
          { type: 'Sweep', sym: 'NVDA', size: '$320M', side: 'BUY', time: '10:25', sentiment: 'Bullish' },
          { type: 'Dark Pool', sym: 'QQQ', size: '$890M', side: 'BUY', time: '10:22', sentiment: 'Bullish' },
          { type: 'Block', sym: 'TSLA', size: '$210M', side: 'SELL', time: '10:18', sentiment: 'Bearish' },
          { type: 'Sweep', sym: 'MSFT', size: '$550M', side: 'BUY', time: '10:15', sentiment: 'Bullish' },
          { type: 'Dark Pool', sym: 'AMZN', size: '$340M', side: 'BUY', time: '10:12', sentiment: 'Bullish' },
          { type: 'Block', sym: 'META', size: '$275M', side: 'SELL', time: '10:08', sentiment: 'Bearish' },
        ];
        const typeColor = (t: string) => t === 'Dark Pool' ? 'text-[hsl(270,70%,70%)]' : t === 'Block' ? 'text-[hsl(45,100%,60%)]' : 'text-[hsl(185,70%,55%)]';
        const typeBg = (t: string) => t === 'Dark Pool' ? 'bg-[hsl(270,70%,70%)]/10 border-[hsl(270,70%,70%)]/30' : t === 'Block' ? 'bg-[hsl(45,100%,60%)]/10 border-[hsl(45,100%,60%)]/30' : 'bg-[hsl(185,70%,55%)]/10 border-[hsl(185,70%,55%)]/30';
        return (
          <ToolSection title="DARK POOL & FLOW" icon="🌊" color="pink">
            <div className="flex gap-2 mb-3 text-[8px] font-mono">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(270,70%,70%)]" />Dark Pool</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(45,100%,60%)]" />Block</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(185,70%,55%)]" />Sweep</div>
            </div>
            <div className="space-y-0">
              {flows.map((f, i) => (
                <div key={i} className="py-1.5 px-1 border-b border-grid-line last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[7px] font-mono font-bold px-1 py-0.5 border ${typeBg(f.type)} ${typeColor(f.type)}`}>{f.type}</span>
                      <span className="text-[10px] font-mono font-bold text-foreground">{f.sym}</span>
                    </div>
                    <span className="text-[8px] font-mono text-muted-foreground">{f.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-foreground font-bold">{f.size}</span>
                    <span className={`font-bold ${f.side === 'BUY' ? 'text-positive' : 'text-negative'}`}>{f.side}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 p-1.5 bg-surface-elevated border border-border">
              <div className="text-[8px] font-mono text-[hsl(340,70%,65%)] font-bold mb-0.5">NET FLOW SIGNAL</div>
              <div className="text-[9px] font-mono text-positive font-bold">▲ NET BUYING +$2.8B</div>
              <div className="text-[8px] font-mono text-muted-foreground">Institutional accumulation across mega-cap tech.</div>
            </div>
          </ToolSection>
        );
      }

      case 'pivotPoints':
        return (
          <ToolSection title="PIVOT POINTS" icon="📍" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Previous High" type="number" step="0.01" value={pivotInputs.high} onChange={e => setPivotInputs({ ...pivotInputs, high: e.target.value })} />
              <InputField label="Previous Low" type="number" step="0.01" value={pivotInputs.low} onChange={e => setPivotInputs({ ...pivotInputs, low: e.target.value })} />
              <InputField label="Previous Close" type="number" step="0.01" value={pivotInputs.close} onChange={e => setPivotInputs({ ...pivotInputs, close: e.target.value })} />
            </div>
            <CalcButton onClick={calcPivot} label="Calculate Pivots" />
            {pivotResult && (
              <div className="bg-surface-deep border border-border p-3 space-y-1">
                <div className="text-accent text-[10px] uppercase font-mono font-bold mb-2 pb-1 border-b border-border">Resistance</div>
                <ResultRow label="R3" value={`$${pivotResult.r3.toFixed(2)}`} valueClass="text-negative" />
                <ResultRow label="R2" value={`$${pivotResult.r2.toFixed(2)}`} valueClass="text-negative" />
                <ResultRow label="R1" value={`$${pivotResult.r1.toFixed(2)}`} valueClass="text-negative" />
                <div className="text-accent text-[10px] uppercase font-mono font-bold my-2 py-1 border-y border-border">Pivot Point</div>
                <ResultRow label="PP" value={`$${pivotResult.pp.toFixed(2)}`} valueClass="text-accent" />
                <div className="text-accent text-[10px] uppercase font-mono font-bold my-2 py-1 border-y border-border">Support</div>
                <ResultRow label="S1" value={`$${pivotResult.s1.toFixed(2)}`} valueClass="text-positive" />
                <ResultRow label="S2" value={`$${pivotResult.s2.toFixed(2)}`} valueClass="text-positive" />
                <ResultRow label="S3" value={`$${pivotResult.s3.toFixed(2)}`} valueClass="text-positive" />
              </div>
            )}
          </ToolSection>
        );

      case 'atrCalc':
        return (
          <ToolSection title="ATR CALCULATOR" icon="📏" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="True Ranges (comma-separated)" value={atrInputs.ranges} onChange={e => setAtrInputs({ ...atrInputs, ranges: e.target.value })} />
              <InputField label="Period" type="number" value={atrInputs.period} onChange={e => setAtrInputs({ ...atrInputs, period: e.target.value })} />
            </div>
            <CalcButton onClick={calcATR} label="Calculate ATR" />
            {atrResult && (
              <div className="bg-surface-deep border border-border p-3">
                <ResultRow label="ATR" value={atrResult.atr.toFixed(4)} valueClass="text-accent" />
                <ResultRow label="Suggested Stop (Long)" value={`${atrResult.stopLong.toFixed(4)} from entry`} valueClass="text-negative" />
                <ResultRow label="Suggested Stop (Short)" value={`+${atrResult.stopShort.toFixed(4)} from entry`} valueClass="text-negative" />
                <div className="text-[8px] font-mono text-muted-foreground mt-2">Stop = 1.5× ATR from entry. Adjust multiplier to preference.</div>
              </div>
            )}
          </ToolSection>
        );

      case 'lotSize':
        return (
          <ToolSection title="LOT SIZE (FOREX)" icon="💱" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Account Balance" type="number" value={lotInputs.account} onChange={e => setLotInputs({ ...lotInputs, account: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Risk %" type="number" step="0.1" value={lotInputs.riskPct} onChange={e => setLotInputs({ ...lotInputs, riskPct: e.target.value })} />
                <InputField label="Stop (pips)" type="number" value={lotInputs.stopPips} onChange={e => setLotInputs({ ...lotInputs, stopPips: e.target.value })} />
              </div>
              <InputField label="Pip Value ($)" type="number" step="0.01" value={lotInputs.pipValue} onChange={e => setLotInputs({ ...lotInputs, pipValue: e.target.value })} />
            </div>
            <CalcButton onClick={calcLot} label="Calculate Lot Size" />
            {lotResult && (
              <div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Lot Size" value={`${lotResult.lots} lots`} valueClass="text-accent" />
                <ResultRow label="Units" value={lotResult.units.toLocaleString()} />
                <ResultRow label="Dollar Risk" value={`$${lotResult.riskAmt.toFixed(2)}`} valueClass="text-negative" />
              </div>
            )}
          </ToolSection>
        );

      case 'breakevenCalc':
        return (
          <ToolSection title="BREAKEVEN CALCULATOR" icon="⚖️" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Entry Prices (comma-separated)" value={beInputs.entries} onChange={e => setBeInputs({ ...beInputs, entries: e.target.value })} />
              <InputField label="Quantities (comma-separated)" value={beInputs.quantities} onChange={e => setBeInputs({ ...beInputs, quantities: e.target.value })} />
              <InputField label="Total Fees ($)" type="number" step="0.01" value={beInputs.fees} onChange={e => setBeInputs({ ...beInputs, fees: e.target.value })} />
            </div>
            <CalcButton onClick={calcBreakeven} label="Calculate Breakeven" />
            {beResult && (
              <div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Breakeven Price" value={`$${beResult.breakeven.toFixed(4)}`} valueClass="text-accent" />
                <ResultRow label="Total Shares" value={beResult.totalQty.toLocaleString()} />
                <ResultRow label="Total Cost" value={`$${beResult.totalCost.toFixed(2)}`} />
              </div>
            )}
          </ToolSection>
        );

      case 'volCalc':
        return (
          <ToolSection title="VOLATILITY CALCULATOR" icon="🌪️" color="green">
            <div className="space-y-2.5 mb-3">
              <InputField label="Daily Returns % (comma-separated)" value={volInputs.returns} onChange={e => setVolInputs({ ...volInputs, returns: e.target.value })} />
            </div>
            <CalcButton onClick={calcVol} label="Calculate Volatility" />
            {volResult && (
              <div className="bg-surface-deep border border-border p-3">
                <ResultRow label="Daily Vol" value={`${volResult.daily.toFixed(4)}%`} valueClass="text-accent" />
                <ResultRow label="Annualized Vol" value={`${volResult.annualized.toFixed(2)}%`} valueClass="text-accent" />
                <ResultRow label="Avg Daily Return" value={`${volResult.avgReturn >= 0 ? '+' : ''}${volResult.avgReturn.toFixed(4)}%`} valueClass={volResult.avgReturn >= 0 ? 'text-positive' : 'text-negative'} />
              </div>
            )}
          </ToolSection>
        );

      case 'mtfBias': {
        const timeframes = [
          { tf: '1M', trend: 'BULLISH', strength: 85, key: 'Above 200 SMA' },
          { tf: '1W', trend: 'BULLISH', strength: 78, key: 'Higher highs' },
          { tf: '1D', trend: 'NEUTRAL', strength: 52, key: 'Consolidating' },
          { tf: '4H', trend: 'BEARISH', strength: 38, key: 'Below VWAP' },
          { tf: '1H', trend: 'BEARISH', strength: 30, key: 'Selling pressure' },
          { tf: '15M', trend: 'NEUTRAL', strength: 48, key: 'Ranging' },
        ];
        const trendColor = (t: string) => t === 'BULLISH' ? 'text-positive' : t === 'BEARISH' ? 'text-negative' : 'text-muted-foreground';
        const barColor = (s: number) => s >= 60 ? 'bg-positive' : s <= 40 ? 'bg-negative' : 'bg-muted-foreground';
        const overallBull = timeframes.filter(t => t.trend === 'BULLISH').length;
        const overallBear = timeframes.filter(t => t.trend === 'BEARISH').length;
        const overall = overallBull > overallBear ? 'BULLISH' : overallBull < overallBear ? 'BEARISH' : 'MIXED';
        return (
          <ToolSection title="MULTI-TF BIAS" icon="🔮" color="purple">
            <div className="mb-3 p-2 bg-surface-elevated border border-border">
              <div className="text-[8px] font-mono text-muted-foreground mb-0.5">OVERALL BIAS</div>
              <div className={`text-sm font-mono font-bold ${trendColor(overall)}`}>{overall}</div>
              <div className="text-[8px] font-mono text-muted-foreground">{overallBull} bullish · {overallBear} bearish · {timeframes.length - overallBull - overallBear} neutral</div>
            </div>
            <div className="space-y-0">
              {timeframes.map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-grid-line last:border-0">
                  <span className="text-[10px] font-mono font-bold text-foreground w-8">{t.tf}</span>
                  <span className={`text-[9px] font-mono font-bold w-16 ${trendColor(t.trend)}`}>{t.trend}</span>
                  <div className="flex-1 h-1.5 bg-surface-deep rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(t.strength)}`} style={{ width: `${t.strength}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground w-20 text-right">{t.key}</span>
                </div>
              ))}
            </div>
          </ToolSection>
        );
      }

      case 'liveStream':
        return (
          <ToolSection title="LIVE STREAM" icon="📺" defaultOpen color="red">
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full border-0"
                src="https://www.youtube.com/embed/QB5BNdBFujE?autoplay=0"
                title="Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </ToolSection>
        );

      case 'positions':
        return (
          <ToolSection title="OPEN POSITIONS" icon="📋" defaultOpen color="green">
            <PositionsTile />
          </ToolSection>
        );

      case 'riskMonitor':
        return (
          <ToolSection title="RISK MONITOR" icon="🛡" defaultOpen color="red">
            <RiskMonitorTile />
          </ToolSection>
        );

      case 'alertsTile':
        return (
          <ToolSection title="PRICE ALERTS" icon="🔔" defaultOpen color="yellow">
            <AlertsTile />
          </ToolSection>
        );

      default: return null;
    }
  };

  // Jump-to-category for F-key bar and edit mode jump targets.
  const categoryAnchors = useRef<Partial<Record<WidgetCategory, HTMLDivElement | null>>>({});
  const jumpToCategory = useCallback((cat: string) => {
    const node = categoryAnchors.current[cat as WidgetCategory];
    if (!node || !scrollRef.current || !innerRef.current) return;
    const innerTop = innerRef.current.getBoundingClientRect().top;
    const targetTop = node.getBoundingClientRect().top;
    setScrollOffset(prev => Math.max(0, prev + (targetTop - innerTop) - 4));
  }, []);



  // Track which categories we've seen while rendering so we only anchor the FIRST
  // widget per category for jump targets.
  const seenCats = new Set<WidgetCategory>();
  const visibleWidgets = widgets.filter(w => w.visible);

  return (
    <div className="bg-surface-primary border-r border-border h-full w-full flex flex-col">
      {/* Bloomberg-style CMD header */}
      <ToolsCmdHeader
        onToggle={onToggle}
        onEditToggle={() => setEditMode(!editMode)}
        editMode={editMode}
      />



      {/* Widgets area - fixed, only navigable via buttons */}
      <div className="flex-1 overflow-hidden relative">
        {/* Scroll up arrow */}
        <button
          onClick={() => scrollBy(-200)}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-0.5 bg-surface-elevated/90 border-b border-border hover:bg-accent/20 transition-colors cursor-pointer"
          title="Scroll up"
        >
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div ref={scrollRef} className="h-full overflow-hidden">
          <div
            ref={innerRef}
            className="p-2 pt-5 pb-5 transition-transform duration-200 ease-out"
            style={{ transform: `translateY(-${scrollOffset}px)` }}
          >
            {editMode ? (
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground font-body mb-3">Toggle visibility and reorder widgets.</p>
                {widgets.map((w, i) => {
                  const catColor = categoryColorMap[w.category] || 'accent';
                  const colors = sectionColorMap[catColor] || sectionColorMap['accent'];
                  return (
                  <div key={w.id} className={`flex items-center gap-2 py-1.5 px-2 bg-surface-deep border border-border text-[11px] border-l-2 ${colors.accent}`}>
                    <button onClick={() => toggleWidget(w.id)} className="flex-shrink-0">
                      {w.visible ? <Eye className="w-3.5 h-3.5 text-positive" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    <span className="mr-1">{w.icon}</span>
                    <span className="text-[9px] font-mono font-bold text-accent w-9 flex-shrink-0">{WIDGET_CMD[w.id] || ''}</span>
                    <span className={`flex-1 font-body ${w.visible ? 'text-foreground' : 'text-muted-foreground'}`}>{w.label}</span>
                    <span className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 border ${colors.border} ${colors.header}`}>{w.category}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => moveWidget(i, -1)} disabled={i === 0}
                        className="p-0.5 hover:bg-surface-elevated rounded disabled:opacity-20">
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => moveWidget(i, 1)} disabled={i === widgets.length - 1}
                        className="p-0.5 hover:bg-surface-elevated rounded disabled:opacity-20">
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              visibleWidgets.map(w => {
                const firstOfCat = !seenCats.has(w.category);
                if (firstOfCat) seenCats.add(w.category);
                return (
                  <div
                    key={w.id}
                    ref={firstOfCat ? (el => { categoryAnchors.current[w.category] = el; }) : undefined}
                  >
                    <WidgetCmdContext.Provider value={WIDGET_CMD[w.id]}>
                      {renderWidget(w.id)}
                    </WidgetCmdContext.Provider>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Scroll down arrow */}
        <button
          onClick={() => scrollBy(200)}
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center py-0.5 bg-surface-elevated/90 border-t border-border hover:bg-accent/20 transition-colors cursor-pointer"
          title="Scroll down"
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

    </div>
  );
}
