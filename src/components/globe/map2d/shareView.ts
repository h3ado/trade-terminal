/**
 * Encode/decode a Map2D "view" (camera + active filter signature) into the URL
 * hash so a user can copy the URL and share their exact view. Format:
 *   #m=lat,lng,zoom,infraBitmask,basemap
 *
 * We only persist a compact subset (enough to round-trip the most useful
 * state). Layer drawer values that need full structural representation stay
 * in user_preferences.
 */
import type { Map2DFilters } from './filters';

export type ShareableView = {
  lat: number;
  lng: number;
  zoom: number;
  basemap?: Map2DFilters['basemap'];
  infraOn?: (keyof Map2DFilters['infra'])[];
};

/** Build the `#m=...` hash string for the current view. */
export function encodeViewHash(v: ShareableView): string {
  const parts = [
    v.lat.toFixed(3),
    v.lng.toFixed(3),
    v.zoom.toFixed(2),
    v.basemap ?? 'wire',
    (v.infraOn ?? []).join('.'),
  ];
  return `#m=${parts.join('|')}`;
}

/** Parse a hash like `#m=...` (with or without leading `#`) → view, or null. */
export function decodeViewHash(hash: string): ShareableView | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw.startsWith('m=')) return null;
  const body = raw.slice(2);
  const [latS, lngS, zoomS, basemap, infraS] = body.split('|');
  const lat = Number(latS);
  const lng = Number(lngS);
  const zoom = Number(zoomS);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(zoom)) return null;
  return {
    lat, lng, zoom,
    basemap: basemap as Map2DFilters['basemap'],
    infraOn: (infraS ?? '').split('.').filter(Boolean) as (keyof Map2DFilters['infra'])[],
  };
}

/** Replace the URL hash without scrolling / pushing history. */
export function writeViewHash(v: ShareableView) {
  const next = encodeViewHash(v);
  if (window.location.hash !== next) {
    history.replaceState(null, '', next);
  }
}
