/**
 * Basemap definitions for the 2D map. Bloomberg MAP function offers
 * Hybrid / Dark / Satellite / Street / Traffic — we mirror that with
 * curated raster tile providers + independent Roads / Labels overlays.
 *
 * URLs follow the {z}/{x}/{y} XYZ convention. Esri's ArcGIS REST API uses
 * {z}/{y}/{x} order — we wrap accordingly.
 */
export type BasemapId =
  | 'wire' | 'dark' | 'satellite' | 'street' | 'streetsplus' | 'traffic';

export type OverlayId = 'roads' | 'labels';

export type BasemapDef = {
  id: BasemapId;
  label: string;
  short: string;
  /** undefined → wireframe (no tiles, vector only). */
  url?: (z: number, x: number, y: number) => string;
  /** Optional secondary label/overlay layer drawn on top (e.g. Hybrid satellite + dark labels). */
  overlayUrl?: (z: number, x: number, y: number) => string;
  attribution: string;
  /** Country stroke style hint. */
  vectorTheme: 'dark' | 'light';
  /** Maximum native zoom this provider serves. */
  maxZoom: number;
};

const RETINA = typeof window !== 'undefined' && window.devicePixelRatio > 1.25 ? '@2x' : '';
const sat = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const dark = (z: number, x: number, y: number) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${z}/${x}/${y}${RETINA}.png`;
const darkLabels = (z: number, x: number, y: number) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_only_labels/${z}/${x}/${y}${RETINA}.png`;
const street = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
const voyager = (z: number, x: number, y: number) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/${z}/${x}/${y}${RETINA}.png`;

/** Esri Reference layer — transparent roads + administrative labels. */
export const ROADS_OVERLAY = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${z}/${y}/${x}`;
/** Esri Boundaries & Places — transparent labels (cities/countries). */
export const LABELS_OVERLAY = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`;

export const BASEMAPS: Record<BasemapId, BasemapDef> = {
  wire: {
    id: 'wire', label: 'Wireframe', short: 'WIRE',
    attribution: '', vectorTheme: 'dark', maxZoom: 7,
  },
  dark: {
    id: 'dark', label: 'Dark', short: 'DARK',
    url: dark, attribution: '© CARTO · OSM contributors', vectorTheme: 'dark', maxZoom: 22,
  },
  satellite: {
    id: 'satellite', label: 'Satellite', short: 'SAT',
    url: sat, attribution: '© Esri, Maxar, Earthstar Geographics', vectorTheme: 'light', maxZoom: 23,
  },
  street: {
    id: 'street', label: 'Street', short: 'STR',
    url: street, attribution: '© OpenStreetMap contributors', vectorTheme: 'light', maxZoom: 19,
  },
  streetsplus: {
    id: 'streetsplus', label: 'Streets+', short: 'ST+',
    url: voyager, attribution: '© CARTO · OSM contributors', vectorTheme: 'light', maxZoom: 22,
  },
  traffic: {
    id: 'traffic', label: 'Traffic', short: 'TFC',
    url: voyager, attribution: '© CARTO · OSM (traffic styling)', vectorTheme: 'light', maxZoom: 22,
  },
};

export const BASEMAP_LIST: BasemapDef[] = [
  BASEMAPS.wire, BASEMAPS.dark, BASEMAPS.satellite,
  BASEMAPS.street, BASEMAPS.streetsplus, BASEMAPS.traffic,
];
