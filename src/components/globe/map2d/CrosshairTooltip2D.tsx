/**
 * Crosshair Tooltip — Bloomberg-style floating panel that follows the cursor
 * on the 2D map and reads out values for every active layer at that lat/lng.
 *
 * Pure presentational + in-memory selection over already-fetched data. Adds
 * zero network requests. Shift-hold freezes the readout, Esc/toggle hides.
 */
import { useMemo } from 'react';
import type { GlobeMarket } from '../AdvancedGlobe';
import type { FXRate } from '@/hooks/useFXRates';
import type { IndexQuote } from '@/hooks/useIndices';
import type { Storm } from '@/hooks/useStorms';
import type { LiveQuake } from '@/hooks/useLiveQuakes';
import type { AcledEvent } from '@/hooks/useAcledEvents';
import { COUNTRY_META, pickCountryAt, type CountryMeta } from './countryLookup';
import { POLICY_RATE, CPI_YOY, SOV_YIELD_10Y, COUNTRY_CCY } from './markets';
import { usePrivacy } from '@/contexts/PrivacyContext';

type Props = {
  /** Cursor screen position relative to the map wrapper. */
  sx: number;
  sy: number;
  /** Cursor lat/lng (null = off-canvas). */
  lat: number;
  lng: number;
  /** Map viewport size for edge-flip. */
  containerW: number;
  containerH: number;
  /** Frozen via Shift hold — panel stays pinned, no value updates. */
  frozen: boolean;
  /** Datasets already loaded by Map2D. */
  fxRates: FXRate[];
  indicesByAbbr: Record<string, IndexQuote>;
  storms: Storm[];
  quakes: LiveQuake[];
  acledEvents: AcledEvent[];
  /** Active-layer flags so we only render relevant rows. */
  show: {
    fx: boolean;
    rates: boolean;
    macro: boolean;
    equity: boolean;
    acled: boolean;
    storms: boolean;
    quakes: boolean;
  };
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function nearestPoint<T extends { lat: number; lng: number }>(
  arr: T[], lat: number, lng: number, maxKm: number,
): { item: T; km: number } | null {
  let best: T | null = null;
  let bestKm = Infinity;
  // Bbox prefilter — ~5° at most latitudes is well over 500km but cheap.
  const dDeg = Math.min(20, maxKm / 60);
  for (const p of arr) {
    if (Math.abs(p.lat - lat) > dDeg) continue;
    if (Math.abs(p.lng - lng) > dDeg + 5) continue;
    const km = haversineKm(lat, lng, p.lat, p.lng);
    if (km < bestKm) { bestKm = km; best = p; }
  }
  if (!best || bestKm > maxKm) return null;
  return { item: best, km: bestKm };
}

const TIP_W = 240;
const TIP_PAD = 14;

export function CrosshairTooltip2D({
  sx, sy, lat, lng, containerW, containerH, frozen,
  fxRates, indicesByAbbr, storms, quakes, acledEvents, show,
}: Props) {
  const { privacyMode } = usePrivacy();

  const country: CountryMeta | null = useMemo(() => pickCountryAt(lat, lng), [lat, lng]);

  // Distance to country centroid — only show country block if reasonably close.
  const countryNearby = country
    ? haversineKm(lat, lng, country.lat, country.lng) < 1800
    : false;

  const fx = country?.currency
    ? fxRates.find(r => r.ccy === country.currency)
    : undefined;

  const eq = country?.equityAbbr ? indicesByAbbr[country.equityAbbr] : undefined;

  const rate10y = country ? SOV_YIELD_10Y[country.iso]?.lvl : undefined;
  const policy = country ? POLICY_RATE[country.iso]?.lvl : undefined;
  const cpi = country ? CPI_YOY[country.iso]?.lvl : undefined;

  // Nearest live events — capped distance keeps readout meaningful.
  const nearStorm = useMemo(
    () => show.storms ? nearestPoint(storms, lat, lng, 1500) : null,
    [show.storms, storms, lat, lng],
  );
  const nearQuake = useMemo(
    () => show.quakes ? nearestPoint(quakes, lat, lng, 800) : null,
    [show.quakes, quakes, lat, lng],
  );
  const nearAcled = useMemo(
    () => show.acled ? nearestPoint(acledEvents, lat, lng, 600) : null,
    [show.acled, acledEvents, lat, lng],
  );
  const acled7d = useMemo(() => {
    if (!show.acled || !country) return null;
    const cutoff = Date.now() - 7 * 86400_000;
    let count = 0;
    let fatalities = 0;
    for (const e of acledEvents) {
      if (e.country === country.name && e.ts >= cutoff) {
        count++;
        fatalities += e.fatalities;
      }
    }
    return { count, fatalities };
  }, [show.acled, country, acledEvents]);

  // Edge-flip: keep tooltip on-screen.
  const flipX = sx + TIP_W + TIP_PAD * 2 > containerW;
  const left = flipX ? sx - TIP_W - TIP_PAD : sx + TIP_PAD;
  const top = Math.max(8, Math.min(containerH - 280, sy - 8));

  const fmt = (v: number | null | undefined, digits = 2, suffix = '') => {
    if (v == null || isNaN(v)) return '—';
    if (privacyMode) return '••••';
    return v.toFixed(digits) + suffix;
  };
  const sign = (v: number | null | undefined) => (v == null ? '' : v >= 0 ? '+' : '');
  const colorFor = (v: number | null | undefined) =>
    v == null ? 'text-muted-foreground' : v >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className="absolute z-40 pointer-events-none font-mono text-[9px] bg-surface-deep/95 backdrop-blur border border-accent/60 shadow-2xl"
      style={{ left, top, width: TIP_W }}
      data-no-drag
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-surface-elevated border-b border-border">
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
          {frozen ? 'CRSR · FROZEN' : 'CRSR'}
        </span>
        <span className="tabular-nums text-foreground">
          {lat.toFixed(2)}° {lng.toFixed(2)}°
        </span>
      </div>

      {/* Country */}
      {country && countryNearby && (
        <div className="px-2 py-1.5 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]">
              <span className="mr-1">{country.flag}</span>
              <span className="font-bold text-foreground">{country.name}</span>
            </span>
            <span className="text-[8px] text-muted-foreground">
              {country.iso}{country.rating ? ` · ${country.rating}` : ''}
            </span>
          </div>

          {show.fx && fx && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">{fx.ccy}/USD</span>
              <span className="flex gap-2 tabular-nums">
                <span className="text-foreground">{fmt(fx.usd, 4)}</span>
                <span className={colorFor(fx.change_pct)}>
                  {fx.change_pct != null ? sign(fx.change_pct) + fmt(fx.change_pct, 2, '%') : '—'}
                </span>
              </span>
            </div>
          )}

          {show.equity && eq && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">{country.equityAbbr}</span>
              <span className="flex gap-2 tabular-nums">
                <span className="text-foreground">{fmt(eq.close, 2)}</span>
                <span className={colorFor(eq.change_pct)}>
                  {eq.change_pct != null ? sign(eq.change_pct) + fmt(eq.change_pct, 2, '%') : '—'}
                </span>
              </span>
            </div>
          )}

          {show.rates && rate10y != null && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">10Y</span>
              <span className="text-foreground tabular-nums">{fmt(rate10y, 2, '%')}</span>
            </div>
          )}

          {show.macro && policy != null && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">Policy</span>
              <span className="text-foreground tabular-nums">{fmt(policy, 2, '%')}</span>
            </div>
          )}

          {show.macro && cpi != null && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">CPI YoY</span>
              <span className={colorFor(cpi > 3 ? -1 : 1)}>{sign(cpi)}{fmt(cpi, 2, '%')}</span>
            </div>
          )}

          {acled7d && acled7d.count > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground uppercase">ACLED 7d</span>
              <span className="text-accent tabular-nums">
                {acled7d.count} ev · {acled7d.fatalities} fat
              </span>
            </div>
          )}
        </div>
      )}

      {/* Nearest event */}
      {nearAcled && (
        <div className="px-2 py-1 border-b border-border">
          <div className="flex justify-between text-[8px] uppercase mb-0.5">
            <span className="text-muted-foreground">Nearest event</span>
            <span className="text-accent tabular-nums">{nearAcled.km.toFixed(0)} km</span>
          </div>
          <div className="text-foreground/90 truncate" title={nearAcled.item.title}>
            {nearAcled.item.subType} · {nearAcled.item.location}
          </div>
        </div>
      )}

      {/* Nearest hazards */}
      {(nearStorm || nearQuake) && (
        <div className="px-2 py-1 border-b border-border">
          <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Nearest hazard</div>
          {nearStorm && (
            <div className="flex justify-between py-0.5">
              <span className="text-foreground truncate max-w-[60%]">
                🌀 {nearStorm.item.name} · {nearStorm.item.category >= 1 ? `C${nearStorm.item.category}` : nearStorm.item.classification}
              </span>
              <span className="text-accent tabular-nums">{nearStorm.km.toFixed(0)} km</span>
            </div>
          )}
          {nearQuake && (
            <div className="flex justify-between py-0.5">
              <span className="text-foreground truncate max-w-[60%]">
                ⌬ M{nearQuake.item.mag.toFixed(1)} · {nearQuake.item.region || '—'}
              </span>
              <span className="text-accent tabular-nums">{nearQuake.km.toFixed(0)} km</span>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="px-2 py-1 text-[8px] text-muted-foreground uppercase tracking-wider flex justify-between">
        <span>{frozen ? 'release shift' : 'shift = freeze'}</span>
        <span>esc = hide</span>
      </div>
    </div>
  );
}
