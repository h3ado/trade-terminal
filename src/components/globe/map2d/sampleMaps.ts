/**
 * Bloomberg MAPS function — preset combos. Selecting a preset toggles the
 * relevant infra layers and pans/zooms to the spotlight region.
 */
import type { Map2DFilters } from './filters';

export type SamplePreset = {
  id: string;
  title: string;
  blurb: string;
  region: { lat: number; lng: number; zoom: number };
  /** Subset of infra toggles to set ON (others left as-is). */
  infraOn: (keyof Map2DFilters['infra'])[];
  /** Optional: factory/retail/agri/weather/etc. extra layer keys (handled by drawer). */
  extras?: Partial<{
    factories: boolean; retail: boolean; agriculture: boolean;
    weather: boolean; weatherMetric: 'temp' | 'cloud' | 'rain' | 'soil' | 'wind';
    fires: boolean; quakes: boolean; tectonics: boolean;
    climateRisk: boolean; climateMetric: 'cyclone' | 'surge' | 'heat' | 'water' | 'reef';
    companies: boolean; subseaCables: boolean; terminator: boolean; marketClocks: boolean;
    equityPulse: boolean; fxHeat: boolean; sovYield: boolean; sovCDS: boolean;
    commodityFlows: boolean; macroChoro: boolean;
    acledHeat: boolean; gdeltTone: boolean; sanctionsNet: boolean;
    elections: boolean; travelAdv: boolean;
  }>;
};

export const SAMPLE_MAPS: SamplePreset[] = [
  {
    id: 'gulf-oil',
    title: 'Gulf of Mexico Oil Platforms',
    blurb: 'Refineries, oil fields & LNG export terminals along the US Gulf.',
    region: { lat: 27.5, lng: -91.5, zoom: 5.5 },
    infraOn: ['refineries', 'oilfields', 'lng', 'pipelines'],
  },
  {
    id: 'us-natgas',
    title: 'US Natural Gas Pipelines',
    blurb: 'Interstate pipeline corridors, LNG export, and storage hubs.',
    region: { lat: 37, lng: -96, zoom: 3.5 },
    infraOn: ['pipelines', 'lng', 'oilfields'],
  },
  {
    id: 'silk-road',
    title: 'Chinese Silk Road',
    blurb: 'Belt & Road corridors: ports, rail, pipelines across Eurasia.',
    region: { lat: 38, lng: 75, zoom: 2.6 },
    infraOn: ['ports', 'pipelines', 'tradeFlows', 'straits'],
  },
  {
    id: 'hurricane-tracker',
    title: 'Hurricane Tracker',
    blurb: 'Active cyclones with forecast tracks + climate risk overlay.',
    region: { lat: 22, lng: -75, zoom: 3.2 },
    infraOn: [],
    extras: { climateRisk: true, climateMetric: 'cyclone' },
  },
  {
    id: 'us-power-grid',
    title: 'US Power Grid',
    blurb: 'Nuclear plants and HV interconnects across North America.',
    region: { lat: 39, lng: -98, zoom: 3.6 },
    infraOn: ['nuclear', 'hv'],
  },
  {
    id: 'global-refineries',
    title: 'Global Refineries',
    blurb: 'World refining capacity, operators & throughput.',
    region: { lat: 25, lng: 30, zoom: 1.8 },
    infraOn: ['refineries', 'pipelines'],
  },
  {
    id: 'kroger-fam',
    title: 'Kroger Family Stores',
    blurb: 'Major US supermarket chain footprint.',
    region: { lat: 38, lng: -92, zoom: 4 },
    infraOn: [],
    extras: { retail: true },
  },
  {
    id: 'semi-fabs',
    title: 'Global Semi Fabs',
    blurb: 'TSMC, Samsung, Intel, ASML — chip supply chain.',
    region: { lat: 30, lng: 90, zoom: 1.8 },
    infraOn: ['datacenters'],
    extras: { factories: true },
  },
  {
    id: 'food-belts',
    title: 'World Food Belts',
    blurb: 'Wheat, corn, soy & canola production belts.',
    region: { lat: 30, lng: -10, zoom: 1.6 },
    infraOn: [],
    extras: { agriculture: true },
  },
  {
    id: 'ring-of-fire',
    title: 'Ring of Fire',
    blurb: 'Tectonic boundaries + recent quakes around the Pacific.',
    region: { lat: 0, lng: -160, zoom: 1.6 },
    infraOn: ['seismic'],
    extras: { quakes: true, tectonics: true },
  },
  {
    id: 'wildfire-watch',
    title: 'Global Wildfire Watch',
    blurb: 'Recent fire hotspots from Amazon to Boreal.',
    region: { lat: 10, lng: -30, zoom: 1.6 },
    infraOn: ['wildfires'],
    extras: { fires: true },
  },
  {
    id: 'rainfall-now',
    title: 'Rainfall Now',
    blurb: 'Rainfall heat-cells + cloud cover.',
    region: { lat: 0, lng: 0, zoom: 1.4 },
    infraOn: [],
    extras: { weather: true, weatherMetric: 'rain' },
  },
  {
    id: 'subsea-cable-map',
    title: 'Subsea Cable Map',
    blurb: 'Intercontinental fiber backbone + landing stations.',
    region: { lat: 20, lng: -30, zoom: 1.4 },
    infraOn: [],
    extras: { subseaCables: true },
  },
  {
    id: 'global-corp-hqs',
    title: 'Global Corporate HQs',
    blurb: 'Top 80 public companies by market cap, by sector.',
    region: { lat: 30, lng: 0, zoom: 1.6 },
    infraOn: [],
    extras: { companies: true },
  },
  {
    id: 'day-night-now',
    title: 'Day / Night · Now',
    blurb: 'Live solar terminator + market-open clocks.',
    region: { lat: 20, lng: 0, zoom: 1.2 },
    infraOn: [],
    extras: { terminator: true, marketClocks: true },
  },
  {
    id: 'us-tech-cluster',
    title: 'US Tech Cluster',
    blurb: 'Bay Area + Seattle + Texas megacaps.',
    region: { lat: 38, lng: -110, zoom: 4 },
    infraOn: [],
    extras: { companies: true },
  },
  {
    id: 'macro-pulse',
    title: 'Macro Pulse',
    blurb: 'Equity pulse + FX heat + 10Y sovereign yields.',
    region: { lat: 25, lng: 10, zoom: 1.4 },
    infraOn: ['equityPulse', 'fxHeat', 'sovYield'],
  },
  {
    id: 'risk-on-off',
    title: 'Risk On / Off',
    blurb: '5Y CDS bubbles + policy-rate choropleth + commodity arcs.',
    region: { lat: 20, lng: 20, zoom: 1.3 },
    infraOn: ['sovCDS', 'macroChoro', 'commodityFlows'],
  },
  {
    id: 'risk-radar',
    title: 'Risk Radar',
    blurb: 'Conflict heat + sanctions arcs + travel advisory choropleth.',
    region: { lat: 25, lng: 30, zoom: 1.6 },
    infraOn: ['acledHeat', 'sanctionsNet', 'travelAdv'],
  },
  {
    id: 'election-watch',
    title: 'Election Watch',
    blurb: 'Upcoming elections + GDELT news-tone heatmap.',
    region: { lat: 20, lng: 0, zoom: 1.4 },
    infraOn: ['elections', 'gdeltTone'],
  },
  // ── New presets ─────────────────────────────────────────────────────────
  {
    id: 'bri-watch',
    title: 'BRI Watch',
    blurb: 'Belt & Road corridors: rail, ports, SEZs, trade disputes.',
    region: { lat: 30, lng: 85, zoom: 2.0 },
    infraOn: ['railCorridors', 'ports', 'tradeFlows', 'disputes', 'sezZones'],
  },
  {
    id: 'chip-supply-chain',
    title: 'Chip Supply Chain',
    blurb: 'Fab locations, shipping chokepoints + companies (TSMC/NVDA/ASML).',
    region: { lat: 25, lng: 118, zoom: 3.0 },
    infraOn: ['chipFabs', 'shipLanes', 'chokeStress'],
    extras: { companies: true },
  },
  {
    id: 'energy-transition',
    title: 'Energy Transition',
    blurb: 'Renewables vs coal plants vs carbon markets across Europe.',
    region: { lat: 50, lng: 15, zoom: 2.8 },
    infraOn: ['renewables', 'coalPlants', 'carbonMarkets', 'hv'],
  },
  {
    id: 'arctic-opening',
    title: 'Arctic Opening',
    blurb: 'Northern Sea Route + Northwest Passage + ice-retreat climate risk.',
    region: { lat: 72, lng: 20, zoom: 2.2 },
    infraOn: ['arcticRoutes', 'naval'],
    extras: { weather: true, weatherMetric: 'temp', climateRisk: true, climateMetric: 'heat' },
  },
  {
    id: 'geopolitical-flashpoints',
    title: 'Geopolitical Flashpoints',
    blurb: 'Active disputes, conflict heat, overseas military bases, sanctions.',
    region: { lat: 25, lng: 50, zoom: 1.5 },
    infraOn: ['disputes', 'acledHeat', 'militaryBases', 'sanctionsNet'],
  },
  {
    id: 'em-remittances',
    title: 'EM Remittance Map',
    blurb: 'Remittance corridors + FX carry vs USD + current account balance.',
    region: { lat: 20, lng: 40, zoom: 1.4 },
    infraOn: ['remittances', 'fxCarry', 'macroChoro'],
  },
  {
    id: 'deforestation-watch',
    title: 'Deforestation Watch',
    blurb: 'Deforestation hotspots + wildfire heatmap + rainfall overlay.',
    region: { lat: -8, lng: -58, zoom: 2.6 },
    infraOn: ['deforestation', 'wildfires'],
    extras: { fires: true, weather: true, weatherMetric: 'rain' },
  },
  {
    id: 'military-spending',
    title: 'Military Spending',
    blurb: 'Defense budgets as % GDP + overseas bases + conflict zones.',
    region: { lat: 30, lng: 20, zoom: 1.4 },
    infraOn: ['militaryBases', 'macroChoro', 'acledHeat'],
  },
];
