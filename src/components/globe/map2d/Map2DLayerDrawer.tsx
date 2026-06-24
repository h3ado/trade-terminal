/**
 * Bloomberg MAPS-style left-docked drawer:
 *  ▸ Layers tab — categorized accordion (Featured, Factories, Retail, Banking,
 *    Agriculture, Oil, Power, Mines, Natural Gas, Vessels, Infrastructure,
 *    Fires, Earthquakes, Weather, Cyclones, Drought, Climate Risk).
 *  ▸ Gallery tab — preset map combos (auto-toggle layers + center/zoom).
 *
 * Filters live in `Map2DFilters` (persisted via useUserPreference) — this
 * component is presentational and lifts toggles up via callbacks.
 */
import { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, X, Layers, BookMarked } from 'lucide-react';
import type { Map2DFilters } from './filters';
import { SAMPLE_MAPS, type SamplePreset } from './sampleMaps';
import { FACTORY_KIND_LABEL, FACTORY_COLOR } from './factories';
import { RETAIL_KIND_LABEL, RETAIL_COLOR } from './retail';
import { CROP_LABEL, CROP_COLOR } from './agriculture';
import { WEATHER_LABEL } from './weather';
import { RISK_LABEL } from './climateRisk';
import { RENEWABLE_KIND_LABEL, RENEWABLE_KIND_COLOR } from './renewable';
import { RAIL_CATEGORY_LABEL, RAIL_CATEGORY_COLOR } from './railCorridors';
import { FAB_KIND_LABEL } from './chipFabs';
import { MIL_OPERATOR_COLOR } from './militaryPresence';
import { FTZ_KIND_COLOR, FTZ_KIND_LABEL } from './freeTradeZones';
import { DRIVER_LABEL, DRIVER_COLOR } from './deforestation';
import { RATING_TIER_LABEL } from './creditRatings';
import { DEMOGRAPHIC_LABEL } from './demographics';
import { REGIME_LABEL, REGIME_COLOR } from './currencyRegimes';
import { FREEDOM_STATUS_COLOR } from './internetFreedom';
import { STORAGE_KIND_COLOR, STORAGE_KIND_LABEL } from './commodityStorage';

type InfraKey = keyof Map2DFilters['infra'];
type Row = { key: InfraKey; label: string; color: string };
type Category = { id: string; title: string; items: Row[]; minZoomNote?: string };

const CATEGORIES: Category[] = [
  { id: 'macro', title: 'Markets & Macro', items: [
    { key: 'equityPulse', label: 'Equity Pulse (mcap × %)', color: 'hsl(150, 80%, 55%)' },
    { key: 'fxHeat', label: 'FX Heat vs USD', color: 'hsl(150, 80%, 55%)' },
    { key: 'sovYield', label: 'Sovereign 10Y Yield', color: 'hsl(15, 85%, 55%)' },
    { key: 'sovCDS', label: 'Sovereign 5Y CDS', color: 'hsl(28, 90%, 55%)' },
    { key: 'macroChoro', label: 'Macro Choropleth', color: 'hsl(195, 90%, 60%)' },
    { key: 'commodityFlows', label: 'Commodity Flows', color: 'hsl(48, 95%, 60%)' },
    { key: 'shipLanes', label: 'Shipping Lanes', color: 'hsl(195, 90%, 65%)' },
    { key: 'chokeStress', label: 'Chokepoint Stress', color: 'hsl(15, 92%, 55%)' },
    { key: 'etfFlows', label: 'Country ETF Flows (1W)', color: 'hsl(28, 95%, 60%)' },
    { key: 'fxCarry', label: 'FX Carry vs USD', color: 'hsl(150, 80%, 55%)' },
    { key: 'cryptoHubs', label: 'Crypto Liquidity Hubs', color: 'hsl(195, 95%, 60%)' },
    { key: 'railCorridors', label: 'Freight Rail Corridors', color: 'hsl(40, 80%, 55%)' },
  ]},
  { id: 'geopolitics', title: 'Geopolitics & Risk', items: [
    { key: 'acledHeat',    label: 'Conflict Heat (ACLED)', color: 'hsl(0, 90%, 55%)' },
    { key: 'gdeltTone',    label: 'News Tone (GDELT)',     color: 'hsl(280, 75%, 60%)' },
    { key: 'sanctionsNet', label: 'Sanctions Network',     color: 'hsl(28, 95%, 55%)' },
    { key: 'elections',    label: 'Election Calendar',     color: 'hsl(48, 95%, 60%)' },
    { key: 'travelAdv',    label: 'Travel Advisory',       color: 'hsl(0, 85%, 48%)' },
    { key: 'disputes',     label: 'Territorial Disputes',  color: 'hsl(15, 90%, 55%)' },
    { key: 'militaryBases', label: 'Military Bases (Overseas)', color: 'hsl(220, 80%, 60%)' },
  ]},
  { id: 'credit', title: 'Credit & Rates', items: [
    { key: 'creditRatings', label: 'Sovereign Credit Ratings', color: 'hsl(150, 80%, 55%)' },
  ]},
  { id: 'demographics', title: 'Demographics', items: [
    { key: 'demographics', label: 'Population Structure', color: 'hsl(185, 80%, 55%)' },
  ]},
  { id: 'currency', title: 'Currency & Capital', items: [
    { key: 'currencyRegime', label: 'Exchange Rate Regime',   color: 'hsl(185, 85%, 55%)' },
  ]},
  { id: 'humanitarian', title: 'Humanitarian', items: [
    { key: 'refugeeFlows',    label: 'Refugee / Displacement', color: 'hsl(0, 85%, 55%)' },
    { key: 'internetFreedom', label: 'Internet Freedom',       color: 'hsl(145, 80%, 55%)' },
  ]},
  { id: 'physicalmarkets', title: 'Physical Markets', items: [
    { key: 'commodityStorage', label: 'Commodity Storage Hubs', color: 'hsl(48, 100%, 52%)' },
  ]},
  { id: 'supplychain', title: 'Supply Chain', items: [
    { key: 'chipFabs',     label: 'Semiconductor Fabs',    color: 'hsl(195, 90%, 60%)' },
    { key: 'remittances',  label: 'Remittance Corridors',  color: 'hsl(150, 80%, 55%)' },
    { key: 'sezZones',     label: 'Free Trade Zones / SEZs', color: 'hsl(33, 100%, 55%)' },
    { key: 'arcticRoutes', label: 'Arctic Shipping Routes', color: 'hsl(195, 90%, 65%)' },
  ]},
  { id: 'environment', title: 'Environment / ESG', items: [
    { key: 'deforestation', label: 'Deforestation Hotspots', color: 'hsl(25, 80%, 50%)' },
    { key: 'carbonMarkets', label: 'Carbon Markets / ETS',   color: 'hsl(150, 75%, 50%)' },
    { key: 'airQuality',    label: 'Air Quality (PM2.5)',     color: 'hsl(140, 80%, 55%)' },
  ]},
  { id: 'featured', title: 'Featured', items: [
    { key: 'tradeFlows', label: 'Trade Flows', color: 'hsl(195, 90%, 60%)' },
    { key: 'sanctions', label: 'Sanctioned States', color: 'hsl(0, 90%, 60%)' },
    { key: 'companies', label: 'Corporate HQs', color: 'hsl(195, 90%, 60%)' },
    { key: 'terminator', label: 'Day / Night', color: 'hsl(220, 60%, 25%)' },
  ]},
  { id: 'companies', title: 'Companies & Markets', items: [
    { key: 'companies', label: 'Corporate HQs (top 80)', color: 'hsl(195, 90%, 60%)' },
    { key: 'marketClocks', label: 'Market Open Status', color: 'hsl(150, 80%, 55%)' },
  ]},
  { id: 'connectivity', title: 'Connectivity', items: [
    { key: 'subseaCables', label: 'Subsea Cables', color: 'hsl(195, 90%, 60%)' },
    { key: 'fiber', label: 'Land Fiber', color: 'hsl(195, 70%, 50%)' },
    { key: 'datacenters', label: 'Data Centers', color: 'hsl(195, 90%, 60%)' },
    { key: 'ixps', label: 'Internet Exchanges', color: 'hsl(220, 90%, 70%)' },
  ]},
  { id: 'timelight', title: 'Time & Light', items: [
    { key: 'terminator', label: 'Day / Night Terminator', color: 'hsl(220, 60%, 25%)' },
    { key: 'marketClocks', label: 'Market Open Clocks', color: 'hsl(150, 80%, 55%)' },
  ]},
  { id: 'factories', title: 'Factories', items: [
    { key: 'factories', label: 'All Factories', color: FACTORY_COLOR.manufacturing },
  ]},
  { id: 'retail', title: 'Retail', items: [
    { key: 'retail', label: 'All Retail HQs', color: RETAIL_COLOR.gen },
  ]},
  { id: 'banking', title: 'Banking', items: [
    { key: 'cbHqs', label: 'Central Bank HQs', color: 'hsl(33, 100%, 55%)' },
  ]},
  { id: 'agriculture', title: 'Agriculture', items: [
    { key: 'agriculture', label: 'Crop Price Points', color: CROP_COLOR.corn },
  ]},
  { id: 'oil', title: 'Oil', items: [
    { key: 'refineries', label: 'Refineries', color: 'hsl(28, 95%, 55%)' },
    { key: 'oilfields', label: 'Oil & Gas Fields', color: 'hsl(15, 80%, 50%)' },
    { key: 'pipelines', label: 'Pipelines', color: 'hsl(48, 95%, 60%)' },
  ]},
  { id: 'power', title: 'Power', items: [
    { key: 'nuclear', label: 'Nuclear Plants', color: 'hsl(280, 75%, 65%)' },
    { key: 'hv', label: 'HV Interconnects', color: 'hsl(280, 75%, 65%)' },
    { key: 'renewables', label: 'Renewables (Wind/Solar/Hydro)', color: 'hsl(150, 80%, 55%)' },
    { key: 'coalPlants', label: 'Coal-Fired Power Plants', color: 'hsl(220, 20%, 50%)' },
  ], minZoomNote: 'Substations visible at zoom ≥ 4' },
  { id: 'mines', title: 'Mines', items: [
    { key: 'mines', label: 'Mining sites', color: 'hsl(40, 80%, 55%)' },
  ]},
  { id: 'natgas', title: 'Natural Gas', items: [
    { key: 'lng', label: 'LNG Terminals', color: 'hsl(48, 95%, 60%)' },
  ]},
  { id: 'infra', title: 'Infrastructure', items: [
    { key: 'ports', label: 'Ports', color: 'hsl(195, 90%, 60%)' },
    { key: 'airports', label: 'Airports', color: 'hsl(165, 80%, 55%)' },
    { key: 'naval', label: 'Naval Bases', color: 'hsl(0, 80%, 55%)' },
    { key: 'straits', label: 'Straits / Chokepoints', color: 'hsl(45, 95%, 60%)' },
    { key: 'datacenters', label: 'Data Centers', color: 'hsl(195, 90%, 60%)' },
    { key: 'ixps', label: 'Internet Exchanges', color: 'hsl(220, 90%, 70%)' },
    { key: 'fiber', label: 'Submarine Fiber', color: 'hsl(195, 90%, 60%)' },
  ]},
  { id: 'aviation', title: 'Aviation', items: [
    { key: 'flights', label: 'Live Aircraft (OpenSky)', color: 'hsl(195, 100%, 70%)' },
  ], minZoomNote: 'Limited to current viewport' },
  { id: 'maritime', title: 'Maritime', items: [
    { key: 'vessels', label: 'Live Vessels (AIS)', color: 'hsl(28, 95%, 60%)' },
  ], minZoomNote: 'AISStream · chokepoint coverage' },
  { id: 'fires', title: 'Fires', items: [
    { key: 'fires', label: 'Hotspots', color: 'hsl(15, 95%, 55%)' },
    { key: 'wildfires', label: 'Active Wildfires', color: 'hsl(15, 95%, 55%)' },
  ]},
  { id: 'quakes', title: 'Earthquakes', items: [
    { key: 'quakes', label: 'Recent Quakes', color: 'hsl(0, 90%, 55%)' },
    { key: 'tectonics', label: 'Tectonic Plates', color: 'hsl(0, 0%, 65%)' },
    { key: 'seismic', label: 'Seismic Belts', color: 'hsl(0, 85%, 55%)' },
  ]},
  { id: 'weather', title: 'Weather', items: [
    { key: 'weather', label: 'Weather Field', color: 'hsl(210, 80%, 60%)' },
    { key: 'lightning', label: 'Lightning (live)', color: 'hsl(55, 100%, 65%)' },
  ]},
  { id: 'climate', title: 'Climate Risk', items: [
    { key: 'climateRisk', label: 'Risk Choropleth', color: 'hsl(280, 75%, 55%)' },
  ]},
  { id: 'environment_live', title: 'Environment · Live', items: [
    { key: 'airQuality', label: 'Air Quality (PM2.5)', color: 'hsl(140, 80%, 55%)' },
  ], minZoomNote: 'OpenAQ · live' },
  { id: 'space', title: 'Space', items: [
    { key: 'iss', label: 'ISS · Live Position', color: 'hsl(195, 100%, 75%)' },
  ], minZoomNote: 'Open Notify · 5s polling' },
];

type Props = {
  filters: Map2DFilters;
  onToggleInfra: (k: InfraKey) => void;
  onUpdate: (patch: Partial<Map2DFilters>) => void;
  onLoadPreset: (preset: SamplePreset) => void;
  onClose: () => void;
};

export function Map2DLayerDrawer({ filters, onToggleInfra, onUpdate, onLoadPreset, onClose }: Props) {
  const [tab, setTab] = useState<'layers' | 'gallery'>('layers');
  const [open, setOpen] = useState<Record<string, boolean>>({
    macro: true, geopolitics: true, featured: true, oil: true, power: false, infra: false,
  });

  // Drag-to-move state — initial position matches the old absolute top-10 left-2
  const [pos, setPos] = useState({ x: 8, y: 40 });
  const [size, setSize] = useState({ w: 288, h: 520 });
  const dragRef = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ mx: number; my: number; ow: number; oh: number } | null>(null);

  return (
    <div
      className="absolute z-30 bg-surface-deep/95 backdrop-blur border border-accent/40 shadow-2xl font-mono text-foreground flex flex-col"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, minWidth: 220, minHeight: 200 }}
      data-no-drag
    >
      {/* Header — drag handle */}
      <div
        className="flex items-center justify-between px-2 py-1.5 bg-surface-elevated border-b border-border flex-shrink-0 cursor-move select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          setPos({
            x: Math.max(0, dragRef.current.ox + e.clientX - dragRef.current.mx),
            y: Math.max(0, dragRef.current.oy + e.clientY - dragRef.current.my),
          });
        }}
        onPointerUp={() => { dragRef.current = null; }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider">Maps Filters</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-accent" title="Close">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface-elevated/60 flex-shrink-0">
        <button onClick={() => setTab('layers')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] uppercase font-bold ${
            tab === 'layers' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Layers className="w-3 h-3" /> Layers
        </button>
        <button onClick={() => setTab('gallery')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] uppercase font-bold ${
            tab === 'gallery' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <BookMarked className="w-3 h-3" /> Gallery
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
      {tab === 'layers' && (
        <div>
          {CATEGORIES.map(cat => {
            const isOpen = !!open[cat.id];
            const activeCount = cat.items.filter(i => filters.infra[i.key]).length;
            return (
              <div key={cat.id} className="border-b border-border">
                <button onClick={() => setOpen(o => ({ ...o, [cat.id]: !o[cat.id] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-surface-elevated/60">
                  <div className="flex items-center gap-1">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span className="text-[9px] uppercase font-bold tracking-wide">{cat.title}</span>
                  </div>
                  {activeCount > 0 && (
                    <span className="text-[8px] bg-accent text-accent-foreground px-1">{activeCount}</span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-2 pb-2 space-y-0.5">
                    {cat.items.map(item => (
                      <label key={item.key} className="flex items-center gap-1.5 px-1 py-1 cursor-pointer hover:bg-surface-elevated/50">
                        <input type="checkbox" checked={!!filters.infra[item.key]} onChange={() => onToggleInfra(item.key)}
                          className="w-3 h-3 accent-[hsl(33,100%,50%)]" />
                        <span className="w-2 h-2 inline-block" style={{ background: item.color }} />
                        <span className="text-[9px] uppercase">{item.label}</span>
                      </label>
                    ))}

                    {/* Per-category extras */}
                    {cat.id === 'factories' && filters.infra.factories && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['admin','distribution','manufacturing','rnd'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: FACTORY_COLOR[k] }} />
                            <span>{FACTORY_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'retail' && filters.infra.retail && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['super','rest','gen','disc','app'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: RETAIL_COLOR[k] }} />
                            <span>{RETAIL_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'agriculture' && filters.infra.agriculture && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['canola','wheat','corn','soy'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: CROP_COLOR[k] }} />
                            <span>{CROP_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'weather' && filters.infra.weather && (
                      <div className="pl-4 pt-1 grid grid-cols-2 gap-0.5">
                        {(['temp','cloud','rain','soil','wind'] as const).map(k => (
                          <button key={k} onClick={() => onUpdate({ weatherMetric: k })}
                            className={`px-1 py-0.5 text-[8px] uppercase border ${
                              filters.weatherMetric === k ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                            }`}>{WEATHER_LABEL[k]}</button>
                        ))}
                      </div>
                    )}
                    {cat.id === 'climate' && filters.infra.climateRisk && (
                      <div className="pl-4 pt-1 grid grid-cols-1 gap-0.5">
                        {(['cyclone','surge','heat','water','reef'] as const).map(k => (
                          <button key={k} onClick={() => onUpdate({ climateMetric: k })}
                            className={`px-1 py-0.5 text-[8px] uppercase text-left border ${
                              filters.climateMetric === k ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                            }`}>{RISK_LABEL[k]}</button>
                        ))}
                      </div>
                    )}
                    {(cat.id === 'fires' || cat.id === 'quakes') && (filters.infra.fires || filters.infra.quakes) && (
                      <div className="pl-4 pt-1">
                        <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Window</div>
                        <div className="grid grid-cols-4 gap-0.5">
                          {(['24h','48h','7d','30d'] as const).map(w => (
                            <button key={w} onClick={() => onUpdate({ hazardWindow: w })}
                              className={`px-0.5 py-0.5 text-[8px] uppercase border ${
                                filters.hazardWindow === w ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                              }`}>{w}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cat.id === 'macro' && filters.infra.commodityFlows && (
                      <div className="pl-4 pt-1">
                        <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Commodities</div>
                        <div className="grid grid-cols-3 gap-0.5">
                          {(['crude','lng','grain','coal','copper','iron','chips'] as const).map(k => (
                            <button key={k}
                              onClick={() => onUpdate({ commoditySet: { ...filters.commoditySet, [k]: !filters.commoditySet[k] } })}
                              className={`px-1 py-0.5 text-[8px] uppercase border ${
                                filters.commoditySet[k] ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                              }`}>{k}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cat.id === 'macro' && filters.infra.railCorridors && (
                      <div className="pl-4 pt-1">
                        <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Rail Types</div>
                        <div className="grid grid-cols-2 gap-0.5">
                          {(['bri','bulk','container','energy'] as const).map(k => (
                            <button key={k}
                              onClick={() => onUpdate({ railCategories: { ...filters.railCategories, [k]: !filters.railCategories[k] } })}
                              className={`px-1 py-0.5 text-[8px] uppercase border ${
                                filters.railCategories[k] ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                              }`}>{RAIL_CATEGORY_LABEL[k]}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cat.id === 'macro' && filters.infra.macroChoro && (
                      <div className="pl-4 pt-1">
                        <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Metric</div>
                        <div className="grid grid-cols-3 gap-0.5">
                          {([
                            ['rate',       'Policy Rate'],
                            ['cpi',        'CPI YoY'],
                            ['realY',      'Real Yield'],
                            ['spread',     '2Y/10Y Spread'],
                            ['gdp',        'GDP Growth'],
                            ['unemp',      'Unemploy.'],
                            ['debt',       'Debt/GDP'],
                            ['ca',         'Curr. Acct'],
                            ['pmi',        'Mfg PMI'],
                            ['milSpend',   'Mil. Spend'],
                            ['reserves',   'FX Reserves'],
                            ['rating',     'Credit Rating'],
                            ['netFreedom', 'Internet Freedom'],
                          ] as const).map(([k, label]) => (
                            <button key={k} onClick={() => onUpdate({ macroMetric: k as Map2DFilters['macroMetric'] })}
                              className={`px-1 py-0.5 text-[8px] uppercase border ${
                                filters.macroMetric === k ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                              }`}>{label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cat.id === 'geopolitics' && (filters.infra.acledHeat || filters.infra.gdeltTone) && (
                      <div className="pl-4 pt-1">
                        <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Window</div>
                        <div className="grid grid-cols-3 gap-0.5">
                          {(['24h','7d','30d'] as const).map(w => (
                            <button key={w} onClick={() => onUpdate({ geoWindow: w })}
                              className={`px-1 py-0.5 text-[8px] uppercase border ${
                                filters.geoWindow === w ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                              }`}>{w}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {cat.id === 'power' && filters.infra.renewables && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['wind_offshore','wind_onshore','solar','hydro'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: RENEWABLE_KIND_COLOR[k] }} />
                            <span>{RENEWABLE_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'supplychain' && filters.infra.chipFabs && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['foundry','iDM','equipment','memory','packaging'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block rounded-full bg-accent" />
                            <span>{FAB_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'supplychain' && filters.infra.sezZones && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['ftz','sez','ifsc','bri_park','sci_park','ecozone'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: FTZ_KIND_COLOR[k] }} />
                            <span>{FTZ_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'demographics' && filters.infra.demographics && (
                      <div className="pl-4 pt-1 grid grid-cols-2 gap-0.5">
                        {(['workingAge','medianAge','popGrowth','urban'] as const).map(k => (
                          <button key={k} onClick={() => onUpdate({ demographicMetric: k })}
                            className={`px-1 py-0.5 text-[8px] uppercase border ${
                              filters.demographicMetric === k ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'
                            }`}>{DEMOGRAPHIC_LABEL[k]}</button>
                        ))}
                      </div>
                    )}
                    {cat.id === 'currency' && filters.infra.currencyRegime && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['free_float','managed_float','crawling_peg','fixed','currency_board','dollarized','monetary_union'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: REGIME_COLOR[k] }} />
                            <span>{REGIME_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'humanitarian' && filters.infra.internetFreedom && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['Free','Partly Free','Not Free'] as const).map(s => (
                          <div key={s} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: FREEDOM_STATUS_COLOR[s] }} />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'physicalmarkets' && filters.infra.commodityStorage && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['spr','lme','comex','gold_vault','gas_storage','grain','rare_earth'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: STORAGE_KIND_COLOR[k] }} />
                            <span>{STORAGE_KIND_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.id === 'environment' && filters.infra.deforestation && (
                      <div className="pl-4 pt-1 text-[8px] text-muted-foreground space-y-0.5">
                        {(['agriculture','logging','mining','fire','infrastructure'] as const).map(k => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 inline-block" style={{ background: DRIVER_COLOR[k] }} />
                            <span>{DRIVER_LABEL[k]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cat.minZoomNote && (
                      <div className="text-[8px] text-muted-foreground/70 italic pt-1">{cat.minZoomNote}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'gallery' && (
        <div className="p-2 grid grid-cols-1 gap-1.5">
          {SAMPLE_MAPS.map(p => (
            <button key={p.id} onClick={() => onLoadPreset(p)}
              className="text-left px-2 py-1.5 border border-border hover:border-accent bg-surface-elevated/40 hover:bg-surface-elevated transition-colors">
              <div className="text-[10px] font-bold uppercase">{p.title}</div>
              <div className="text-[8px] text-muted-foreground leading-snug mt-0.5">{p.blurb}</div>
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Resize handle — bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end pb-0.5 pr-0.5 text-muted-foreground/40 hover:text-accent select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          resizeRef.current = { mx: e.clientX, my: e.clientY, ow: size.w, oh: size.h };
        }}
        onPointerMove={(e) => {
          if (!resizeRef.current) return;
          setSize({
            w: Math.max(220, resizeRef.current.ow + e.clientX - resizeRef.current.mx),
            h: Math.max(200, resizeRef.current.oh + e.clientY - resizeRef.current.my),
          });
        }}
        onPointerUp={() => { resizeRef.current = null; }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
