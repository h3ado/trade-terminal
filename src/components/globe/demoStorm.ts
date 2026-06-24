import type { Storm } from '@/hooks/useStorms';

/**
 * Synthetic Atlantic hurricane used for off-season visual QA of the storms
 * layer + time-scrubber animation. Track curls north from the Bahamas, hooks
 * along the US East Coast, and exits into the North Atlantic at +120h.
 */
export const DEMO_STORM: Storm = {
  id: 'DEMO-AL01',
  name: 'DEMO',
  basin: 'AL',
  classification: 'Hurricane',
  category: 3,
  lat: 24.5,
  lng: -76.0,
  windKt: 105,
  pressureMb: 958,
  movementDeg: 320,
  movementKt: 12,
  forecast: [
    { lat: 25.8, lng: -78.0, tau: 12,  wind: 105 },
    { lat: 27.5, lng: -80.0, tau: 24,  wind: 110 },
    { lat: 30.2, lng: -81.0, tau: 48,  wind: 100 },
    { lat: 34.0, lng: -78.0, tau: 72,  wind: 90  },
    { lat: 38.5, lng: -73.0, tau: 96,  wind: 75  },
    { lat: 42.0, lng: -67.0, tau: 120, wind: 65  },
  ],
  updated: new Date().toISOString(),
};

export const DEMO_STORM_EVENT = 'lovable:globe-toggle-demo-storm';
