/**
 * Curated upcoming national elections (presidential / general / legislative).
 * Coords = capital city. Add/refresh as needed; this is intentionally a
 * shippable static list so the layer works offline.
 */
export type ElectionPin = {
  id: string;
  iso: string;
  country: string;
  capital: string;
  lat: number;
  lng: number;
  date: string;            // ISO YYYY-MM-DD
  type: 'Presidential' | 'General' | 'Legislative' | 'Parliamentary' | 'Referendum';
  notes?: string;
};

// Snapshot of upcoming national-level elections (current + next ~18 months from mid-2026).
// Past events (> 7 days ago) are hidden by the rendering filter but kept for continuity.
export const ELECTIONS: ElectionPin[] = [
  // ── Recently concluded (rendered as PAST, fading out after 7 days) ──────
  { id: 'mx-2026', iso: 'MX', country: 'Mexico',      capital: 'Mexico City', lat: 19.43, lng: -99.13, date: '2026-06-07', type: 'Legislative',  notes: 'Mid-term Congress · Morena retained majority' },
  { id: 'co-2026', iso: 'CO', country: 'Colombia',    capital: 'Bogotá',      lat:  4.71, lng: -74.07, date: '2026-05-31', type: 'Presidential', notes: 'Petro runoff — market watched' },
  { id: 'pe-2026', iso: 'PE', country: 'Peru',        capital: 'Lima',        lat: -12.05, lng: -77.04, date: '2026-04-12', type: 'General',      notes: 'High political fragmentation' },
  { id: 'ph-2026', iso: 'PH', country: 'Philippines', capital: 'Manila',      lat: 14.60, lng: 120.98, date: '2026-05-11', type: 'Legislative',  notes: 'Mid-term Senate+House' },
  { id: 'au-2026', iso: 'AU', country: 'Australia',   capital: 'Canberra',    lat: -35.28, lng: 149.13, date: '2026-05-17', type: 'General',      notes: 'Labor held majority' },
  { id: 'pl-2026', iso: 'PL', country: 'Poland',      capital: 'Warsaw',      lat: 52.23, lng:  21.01, date: '2026-05-18', type: 'Presidential', notes: 'Tusk coalition context' },
  { id: 'hu-2026', iso: 'HU', country: 'Hungary',     capital: 'Budapest',    lat: 47.50, lng:  19.04, date: '2026-04-26', type: 'General',       notes: 'Orbán / Fidesz contested' },
  { id: 'uk-2026', iso: 'GB', country: 'United Kingdom', capital: 'London',   lat: 51.50, lng:  -0.13, date: '2026-05-07', type: 'Legislative',  notes: 'Local council + devolved polls' },
  { id: 'it-2026', iso: 'IT', country: 'Italy',       capital: 'Rome',        lat: 41.89, lng:  12.49, date: '2026-06-08', type: 'Referendum',    notes: 'Labor reform referendum' },

  // ── Upcoming ─────────────────────────────────────────────────────────────
  { id: 'jp-2026', iso: 'JP', country: 'Japan',       capital: 'Tokyo',       lat: 35.68, lng: 139.69, date: '2026-07-19', type: 'Legislative',  notes: 'Upper House (Sangi-in) election' },
  { id: 'ru-2026', iso: 'RU', country: 'Russia',      capital: 'Moscow',      lat: 55.75, lng:  37.62, date: '2026-09-13', type: 'Legislative',  notes: 'State Duma elections' },
  { id: 'de-2026', iso: 'DE', country: 'Germany',     capital: 'Berlin',      lat: 52.52, lng:  13.40, date: '2026-09-27', type: 'Legislative',  notes: 'Bavaria + Niedersachsen state elections' },
  { id: 'eg-2026', iso: 'EG', country: 'Egypt',       capital: 'Cairo',       lat: 30.04, lng:  31.24, date: '2026-10-15', type: 'Parliamentary', notes: 'House of Representatives' },
  { id: 'br-2026', iso: 'BR', country: 'Brazil',      capital: 'Brasília',    lat: -15.78, lng: -47.93, date: '2026-10-04', type: 'General',      notes: 'Presidential + Congress · Lula vs. Bolsonaro rematch likely' },
  { id: 'br-2026-r', iso: 'BR', country: 'Brazil (runoff)', capital: 'Brasília', lat: -15.60, lng: -47.80, date: '2026-10-25', type: 'General',   notes: 'Presidential runoff (if needed)' },
  { id: 'za-2026', iso: 'ZA', country: 'South Africa', capital: 'Pretoria',   lat: -25.75, lng:  28.19, date: '2026-11-01', type: 'Legislative',  notes: 'Local government elections' },
  { id: 'us-2026', iso: 'US', country: 'United States', capital: 'Washington', lat: 38.91, lng: -77.04, date: '2026-11-03', type: 'Legislative', notes: 'Midterms — House + 34 Senate seats' },
  { id: 'ca-2026', iso: 'CA', country: 'Canada',      capital: 'Ottawa',      lat: 45.42, lng: -75.70, date: '2026-10-20', type: 'General',      notes: 'Federal election (fixed date)' },
  { id: 'cl-2026', iso: 'CL', country: 'Chile',       capital: 'Santiago',    lat: -33.45, lng: -70.67, date: '2026-11-15', type: 'General',      notes: 'Presidential + Congress' },
  { id: 'ec-2026', iso: 'EC', country: 'Ecuador',     capital: 'Quito',       lat: -0.23, lng: -78.52, date: '2026-10-11', type: 'General',       notes: 'Presidential election' },
  { id: 'il-2026', iso: 'IL', country: 'Israel',      capital: 'Jerusalem',   lat: 31.78, lng:  35.21, date: '2026-10-27', type: 'General',       notes: 'Snap election expected · market-sensitive' },

  // ── 2027 ─────────────────────────────────────────────────────────────────
  { id: 'fr-2027', iso: 'FR', country: 'France',      capital: 'Paris',       lat: 48.86, lng:   2.35, date: '2027-04-25', type: 'Presidential', notes: 'Macron term-limited; far-right vs. center' },
  { id: 'fr-2027-leg', iso: 'FR', country: 'France (Legislative)', capital: 'Paris', lat: 48.87, lng: 2.36, date: '2027-06-06', type: 'Legislative', notes: 'Follows presidential by ~6 weeks' },
  { id: 'kr-2027', iso: 'KR', country: 'South Korea', capital: 'Seoul',       lat: 37.57, lng: 126.98, date: '2027-03-03', type: 'Presidential', notes: 'Yoon successor · market-sensitive' },
  { id: 'ng-2027', iso: 'NG', country: 'Nigeria',     capital: 'Abuja',       lat:  9.05, lng:   7.49, date: '2027-02-25', type: 'General',       notes: 'Tinubu re-election bid · oil country' },
  { id: 'tr-2027', iso: 'TR', country: 'Türkiye',     capital: 'Ankara',      lat: 39.93, lng:  32.86, date: '2027-05-23', type: 'Presidential', notes: 'Erdoğan potential 3rd term; TRY sensitivity' },
  { id: 'ke-2027', iso: 'KE', country: 'Kenya',       capital: 'Nairobi',     lat: -1.29, lng:  36.82, date: '2027-08-10', type: 'General',       notes: 'Ruto re-election · E.Africa hub' },
  { id: 'ar-2027', iso: 'AR', country: 'Argentina',   capital: 'Buenos Aires', lat: -34.60, lng: -58.38, date: '2027-10-24', type: 'General',    notes: 'Milei mid-term test · peso/reform watch' },
  { id: 'es-2027', iso: 'ES', country: 'Spain',       capital: 'Madrid',      lat: 40.42, lng:  -3.70, date: '2027-09-26', type: 'General',       notes: 'Sánchez mandate ends' },
  { id: 'in-2027-states', iso: 'IN', country: 'India (state polls)', capital: 'New Delhi', lat: 28.61, lng: 77.21, date: '2027-02-20', type: 'Legislative', notes: 'UP, Punjab and other key states' },
  { id: 'id-2029', iso: 'ID', country: 'Indonesia',   capital: 'Jakarta',     lat: -6.21, lng: 106.85, date: '2029-02-14', type: 'General',       notes: 'Prabowo successor · next cycle' },
  { id: 'nz-2026', iso: 'NZ', country: 'New Zealand', capital: 'Wellington',  lat: -41.28, lng: 174.78, date: '2026-10-01', type: 'General',      notes: 'Fixed 3-year term' },
  { id: 'pk-2028', iso: 'PK', country: 'Pakistan',    capital: 'Islamabad',   lat: 33.72, lng:  73.04, date: '2028-02-08', type: 'General',       notes: 'Next parliamentary cycle' },
  { id: 'th-2027', iso: 'TH', country: 'Thailand',    capital: 'Bangkok',     lat: 13.75, lng: 100.52, date: '2027-05-01', type: 'General',       notes: 'Pheu Thai government · mid-term' },
  { id: 'my-2027', iso: 'MY', country: 'Malaysia',    capital: 'Kuala Lumpur', lat: 3.14, lng: 101.69, date: '2027-11-01', type: 'General',       notes: 'Anwar Ibrahim government' },
  { id: 'vn-2026-party', iso: 'VN', country: 'Vietnam', capital: 'Hanoi',    lat: 21.03, lng: 105.85, date: '2026-01-22', type: 'Legislative',   notes: 'CPV Party Congress XIV · key for FDI policy' },
];

export function daysUntil(iso: string, now = new Date()): number {
  const d = new Date(iso + 'T12:00:00Z');
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

export function electionPinColor(days: number): string {
  if (days < 0)  return 'hsl(220, 10%, 45%)';   // past
  if (days < 30) return 'hsl(0, 90%, 60%)';     // imminent
  if (days < 90) return 'hsl(33, 100%, 55%)';   // soon
  if (days < 180)return 'hsl(48, 95%, 60%)';
  return 'hsl(195, 90%, 60%)';
}
