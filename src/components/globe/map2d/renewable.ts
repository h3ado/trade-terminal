/**
 * Renewable energy infrastructure: offshore & onshore wind farms, utility-scale
 * solar parks, and major hydroelectric dams. Critical for energy-transition
 * investment themes, power price correlation, and ESG overlays.
 *
 * Capacity in GW (nameplate). Coords are approximate centroid/dam-wall.
 */
import type { PointFeature } from './infra';

export type RenewableKind = 'wind_offshore' | 'wind_onshore' | 'solar' | 'hydro';

export type RenewableFeature = PointFeature & {
  kind: RenewableKind;
  capacityGW: number;
  status: 'OPERATIONAL' | 'PLANNED' | 'UNDER_CONSTRUCTION';
};

// ─── Offshore Wind ───────────────────────────────────────────────────────────
export const OFFSHORE_WIND: RenewableFeature[] = [
  { id: 'hornsea2', name: 'Hornsea 2', kind: 'wind_offshore', lat: 53.90, lng: 1.70, capacityGW: 1.39, size: 5, meta: '1.39 GW · Ørsted', operator: 'Ørsted', country: 'GB', status: 'OPERATIONAL' },
  { id: 'hornsea1', name: 'Hornsea 1', kind: 'wind_offshore', lat: 53.80, lng: 1.85, capacityGW: 1.22, size: 5, meta: '1.22 GW', operator: 'Ørsted', country: 'GB', status: 'OPERATIONAL' },
  { id: 'doggerbank', name: 'Dogger Bank', kind: 'wind_offshore', lat: 54.60, lng: 2.30, capacityGW: 3.60, size: 5, meta: '3.6 GW · World largest (3 phases)', operator: 'SSE/Equinor', country: 'GB', status: 'UNDER_CONSTRUCTION' },
  { id: 'gansu-offshore', name: 'Hornsea 3', kind: 'wind_offshore', lat: 53.95, lng: 2.10, capacityGW: 2.85, size: 5, meta: '2.85 GW · planned', operator: 'Ørsted', country: 'GB', status: 'PLANNED' },
  { id: 'sheringham-shoal', name: 'Sheringham Shoal', kind: 'wind_offshore', lat: 53.05, lng: 1.12, capacityGW: 0.32, size: 3, meta: '317 MW', country: 'GB', status: 'OPERATIONAL' },
  { id: 'hollandse-kust', name: 'Hollandse Kust Noord', kind: 'wind_offshore', lat: 52.90, lng: 4.40, capacityGW: 0.76, size: 4, meta: '760 MW', operator: 'Vattenfall', country: 'NL', status: 'OPERATIONAL' },
  { id: 'borssele', name: 'Borssele 1-5', kind: 'wind_offshore', lat: 51.55, lng: 3.00, capacityGW: 1.49, size: 5, meta: '1.49 GW', country: 'NL', status: 'OPERATIONAL' },
  { id: 'gemini', name: 'Gemini', kind: 'wind_offshore', lat: 54.06, lng: 5.90, capacityGW: 0.60, size: 3, meta: '600 MW', country: 'NL', status: 'OPERATIONAL' },
  { id: 'baltic-eagle', name: 'Baltic Eagle', kind: 'wind_offshore', lat: 55.00, lng: 14.60, capacityGW: 0.48, size: 3, meta: '480 MW', operator: 'Iberdrola', country: 'DE', status: 'OPERATIONAL' },
  { id: 'borkum-riffgrund', name: 'Borkum Riffgrund 2', kind: 'wind_offshore', lat: 54.05, lng: 6.55, capacityGW: 0.45, size: 3, meta: '450 MW', operator: 'Ørsted', country: 'DE', status: 'OPERATIONAL' },
  { id: 'sandbank', name: 'Sandbank', kind: 'wind_offshore', lat: 55.00, lng: 7.15, capacityGW: 0.29, size: 3, meta: '288 MW', country: 'DE', status: 'OPERATIONAL' },
  { id: 'fecamp', name: 'Fécamp', kind: 'wind_offshore', lat: 49.93, lng: 0.38, capacityGW: 0.50, size: 3, meta: '500 MW · EDF', country: 'FR', status: 'OPERATIONAL' },
  { id: 'vineyard-wind', name: 'Vineyard Wind', kind: 'wind_offshore', lat: 41.35, lng: -70.50, capacityGW: 0.80, size: 4, meta: 'US first large offshore · Avangrid', country: 'US', status: 'UNDER_CONSTRUCTION' },
  { id: 'revolution-wind', name: 'Revolution Wind', kind: 'wind_offshore', lat: 41.20, lng: -71.00, capacityGW: 0.70, size: 4, meta: '700 MW · Ørsted/Eversource', country: 'US', status: 'UNDER_CONSTRUCTION' },
  { id: 'sunrise-wind', name: 'Sunrise Wind', kind: 'wind_offshore', lat: 40.90, lng: -71.50, capacityGW: 0.93, size: 4, meta: '924 MW · Ørsted', country: 'US', status: 'PLANNED' },
  { id: 'bloc-0', name: 'Taiwan Offshore (BLOC)', kind: 'wind_offshore', lat: 23.70, lng: 119.60, capacityGW: 3.00, size: 5, meta: '3 GW · Ørsted/Equinor', country: 'TW', status: 'UNDER_CONSTRUCTION' },
  { id: 'greater-changhua', name: 'Greater Changhua', kind: 'wind_offshore', lat: 23.90, lng: 119.40, capacityGW: 2.40, size: 5, meta: '2.4 GW · Ørsted', country: 'TW', status: 'OPERATIONAL' },
  { id: 'hywind-tampen', name: 'Hywind Tampen (floating)', kind: 'wind_offshore', lat: 61.25, lng: 3.05, capacityGW: 0.09, size: 3, meta: '88 MW · World first large floating', operator: 'Equinor', country: 'NO', status: 'OPERATIONAL' },
  { id: 'beibu-gulf', name: 'Beibu Gulf Offshore', kind: 'wind_offshore', lat: 21.00, lng: 108.50, capacityGW: 2.00, size: 5, meta: '2 GW · China offshore', country: 'CN', status: 'OPERATIONAL' },
  { id: 'yangjiang', name: 'Yangjiang Offshore', kind: 'wind_offshore', lat: 21.80, lng: 111.60, capacityGW: 3.00, size: 5, meta: 'Guangdong province', country: 'CN', status: 'OPERATIONAL' },
  { id: 'kriegers-flak', name: "Kriegers Flak", kind: 'wind_offshore', lat: 55.00, lng: 12.70, capacityGW: 0.60, size: 3, meta: '600 MW · Vattenfall', country: 'DK', status: 'OPERATIONAL' },
  { id: 'rampion', name: 'Rampion', kind: 'wind_offshore', lat: 50.67, lng: -0.30, capacityGW: 0.40, size: 3, meta: '400 MW', country: 'GB', status: 'OPERATIONAL' },
  { id: 'moray-east', name: 'Moray East', kind: 'wind_offshore', lat: 57.80, lng: -2.70, capacityGW: 0.95, size: 4, meta: '950 MW', country: 'GB', status: 'OPERATIONAL' },
  { id: 'scotwind', name: 'ScotWind (multiple)', kind: 'wind_offshore', lat: 58.50, lng: -2.00, capacityGW: 25.0, size: 5, meta: '25 GW planned · 2030', country: 'GB', status: 'PLANNED' },
  { id: 'ijmuiden-ver', name: 'IJmuiden Ver', kind: 'wind_offshore', lat: 52.80, lng: 3.80, capacityGW: 4.00, size: 5, meta: '4 GW · planned', country: 'NL', status: 'PLANNED' },
];

// ─── Onshore Wind ────────────────────────────────────────────────────────────
export const ONSHORE_WIND: RenewableFeature[] = [
  { id: 'gansu-wind', name: 'Gansu Wind Base', kind: 'wind_onshore', lat: 39.80, lng: 97.50, capacityGW: 20.0, size: 5, meta: '20+ GW · China Wind Corridor', country: 'CN', status: 'OPERATIONAL' },
  { id: 'xinjiang-wind', name: 'Xinjiang Wind Base', kind: 'wind_onshore', lat: 43.80, lng: 85.00, capacityGW: 15.0, size: 5, meta: '15 GW · Hami cluster', country: 'CN', status: 'OPERATIONAL' },
  { id: 'inner-mongolia-wind', name: 'Inner Mongolia Wind', kind: 'wind_onshore', lat: 40.60, lng: 110.00, capacityGW: 30.0, size: 5, meta: '30+ GW · Gobi', country: 'CN', status: 'OPERATIONAL' },
  { id: 'alta-wind', name: 'Alta Wind Energy Center', kind: 'wind_onshore', lat: 34.60, lng: -118.40, capacityGW: 1.55, size: 4, meta: '1.55 GW · Mojave', country: 'US', status: 'OPERATIONAL' },
  { id: 'roscoe-wind', name: 'Roscoe Wind Farm', kind: 'wind_onshore', lat: 32.45, lng: -100.55, capacityGW: 0.78, size: 4, meta: '781 MW · Texas', country: 'US', status: 'OPERATIONAL' },
  { id: 'wind-energy-center-tx', name: 'Permian Energy Center', kind: 'wind_onshore', lat: 33.00, lng: -101.50, capacityGW: 1.80, size: 4, meta: 'Texas wind hub', country: 'US', status: 'OPERATIONAL' },
  { id: 'cedar-rapids-ia', name: 'Iowa Wind Hub', kind: 'wind_onshore', lat: 42.00, lng: -94.00, capacityGW: 4.00, size: 4, meta: '~40% Iowa electricity', country: 'US', status: 'OPERATIONAL' },
  { id: 'jaisalmer-wind', name: 'Jaisalmer Wind Park', kind: 'wind_onshore', lat: 27.20, lng: 70.80, capacityGW: 1.06, size: 4, meta: '1.06 GW · Rajasthan', country: 'IN', status: 'OPERATIONAL' },
  { id: 'muppandal', name: 'Muppandal Wind Cluster', kind: 'wind_onshore', lat: 8.37, lng: 77.64, capacityGW: 1.50, size: 4, meta: 'Tamil Nadu', country: 'IN', status: 'OPERATIONAL' },
  { id: 'horns-rev', name: 'Horns Rev 1-3', kind: 'wind_onshore', lat: 55.57, lng: 7.90, capacityGW: 0.74, size: 3, meta: 'Iconic Danish hub', country: 'DK', status: 'OPERATIONAL' },
  { id: 'sweden-markbygden', name: 'Markbygden (Vindpark)', kind: 'wind_onshore', lat: 65.50, lng: 20.50, capacityGW: 4.00, size: 5, meta: '4 GW · Europe largest onshore', country: 'SE', status: 'UNDER_CONSTRUCTION' },
  { id: 'brazil-nordeste-wind', name: 'NE Brazil Wind Belt', kind: 'wind_onshore', lat: -5.00, lng: -38.50, capacityGW: 12.0, size: 5, meta: 'Ceará/RN cluster', country: 'BR', status: 'OPERATIONAL' },
  { id: 'ushuaia-ar-wind', name: 'Patagonia Wind Belt', kind: 'wind_onshore', lat: -46.00, lng: -68.00, capacityGW: 3.00, size: 4, meta: 'Argentina', country: 'AR', status: 'OPERATIONAL' },
  { id: 'sahara-wind', name: 'Sahara Wind Project', kind: 'wind_onshore', lat: 27.00, lng: -2.00, capacityGW: 10.0, size: 5, meta: 'Morocco/Algeria planned', country: 'MA', status: 'PLANNED' },
  { id: 'masdar-turbines', name: 'Masdar Abu Dhabi Wind', kind: 'wind_onshore', lat: 23.90, lng: 54.30, capacityGW: 0.10, size: 3, meta: 'Gulf pioneer', country: 'AE', status: 'OPERATIONAL' },
  { id: 'australia-macarthur', name: 'MacArthur Wind Farm', kind: 'wind_onshore', lat: -38.10, lng: 142.10, capacityGW: 0.42, size: 3, meta: '420 MW · Victoria', country: 'AU', status: 'OPERATIONAL' },
  { id: 'germany-wind', name: 'North German Wind Belt', kind: 'wind_onshore', lat: 53.50, lng: 9.50, capacityGW: 30.0, size: 5, meta: 'Schleswig-Holstein/Hamburg', country: 'DE', status: 'OPERATIONAL' },
];

// ─── Utility-Scale Solar ──────────────────────────────────────────────────────
export const SOLAR_FARMS: RenewableFeature[] = [
  { id: 'bhadla', name: 'Bhadla Solar Park', kind: 'solar', lat: 27.54, lng: 71.93, capacityGW: 2.70, size: 5, meta: '2.7 GW · World #1 single site', country: 'IN', status: 'OPERATIONAL' },
  { id: 'pavagada', name: 'Pavagada Solar', kind: 'solar', lat: 14.11, lng: 77.28, capacityGW: 2.05, size: 5, meta: '2.05 GW · Karnataka', country: 'IN', status: 'OPERATIONAL' },
  { id: 'kurnool-solar', name: 'Kurnool Ultra Mega', kind: 'solar', lat: 15.82, lng: 78.05, capacityGW: 1.00, size: 4, meta: '1 GW · Andhra Pradesh', country: 'IN', status: 'OPERATIONAL' },
  { id: 'ningxia-solar', name: 'Ningxia Solar Base', kind: 'solar', lat: 37.50, lng: 106.50, capacityGW: 6.00, size: 5, meta: '6 GW · China', country: 'CN', status: 'OPERATIONAL' },
  { id: 'qinghai-solar', name: 'Qinghai Solar', kind: 'solar', lat: 36.90, lng: 99.00, capacityGW: 5.00, size: 5, meta: '5 GW · Golmud Desert', country: 'CN', status: 'OPERATIONAL' },
  { id: 'xinjiang-solar', name: 'Xinjiang Solar Base', kind: 'solar', lat: 42.50, lng: 87.00, capacityGW: 8.00, size: 5, meta: '8 GW · Hami basin', country: 'CN', status: 'OPERATIONAL' },
  { id: 'benban', name: 'Benban Solar Park', kind: 'solar', lat: 24.39, lng: 32.77, capacityGW: 1.65, size: 5, meta: '1.65 GW · Africa largest', country: 'EG', status: 'OPERATIONAL' },
  { id: 'noor-ouarzazate', name: 'Noor Ouarzazate', kind: 'solar', lat: 30.93, lng: -6.87, capacityGW: 0.58, size: 4, meta: '580 MW CSP+PV · Morocco', country: 'MA', status: 'OPERATIONAL' },
  { id: 'solar-star-ca', name: 'Solar Star', kind: 'solar', lat: 34.85, lng: -118.45, capacityGW: 0.58, size: 4, meta: '579 MW · California', country: 'US', status: 'OPERATIONAL' },
  { id: 'desert-sunlight', name: 'Desert Sunlight', kind: 'solar', lat: 33.83, lng: -115.43, capacityGW: 0.55, size: 4, meta: '550 MW · Mojave', country: 'US', status: 'OPERATIONAL' },
  { id: 'topaz', name: 'Topaz Solar Farm', kind: 'solar', lat: 35.36, lng: -120.09, capacityGW: 0.55, size: 4, meta: '550 MW · California', country: 'US', status: 'OPERATIONAL' },
  { id: 'gemini-solar-nv', name: 'Gemini Solar+Storage', kind: 'solar', lat: 36.45, lng: -114.95, capacityGW: 0.69, size: 4, meta: '690 MW + 380 MWh · Nevada', country: 'US', status: 'UNDER_CONSTRUCTION' },
  { id: 'ouaddai-solar', name: 'NEOM Solar (Saudi)', kind: 'solar', lat: 27.80, lng: 36.00, capacityGW: 4.00, size: 5, meta: '4 GW · NEOM city', country: 'SA', status: 'PLANNED' },
  { id: 'saudi-sabic', name: 'Sudair Solar', kind: 'solar', lat: 25.70, lng: 46.50, capacityGW: 1.50, size: 5, meta: '1.5 GW · ARAMCO+ACWA', country: 'SA', status: 'OPERATIONAL' },
  { id: 'masdar-nofar', name: 'Sweihan Solar (Nofar)', kind: 'solar', lat: 23.70, lng: 54.50, capacityGW: 1.18, size: 4, meta: '1.18 GW · Abu Dhabi', country: 'AE', status: 'OPERATIONAL' },
  { id: 'um-al-zizah', name: 'Al Dhafra Solar', kind: 'solar', lat: 24.10, lng: 53.40, capacityGW: 2.10, size: 5, meta: '2.1 GW · World largest single site (2022)', country: 'AE', status: 'OPERATIONAL' },
  { id: 'sakaka-solar', name: 'Sakaka Solar', kind: 'solar', lat: 29.97, lng: 40.21, capacityGW: 0.30, size: 3, meta: '300 MW · Saudi first utility', country: 'SA', status: 'OPERATIONAL' },
  { id: 'loule-solar', name: 'Alqueva Solar', kind: 'solar', lat: 38.20, lng: -7.50, capacityGW: 0.23, size: 3, meta: '220 MW floating · Portugal', country: 'PT', status: 'OPERATIONAL' },
  { id: 'charanka', name: 'Charanka Solar Park', kind: 'solar', lat: 23.90, lng: 71.25, capacityGW: 0.59, size: 4, meta: '590 MW · Gujarat', country: 'IN', status: 'OPERATIONAL' },
  { id: 'australia-sunraysia', name: 'Sunraysia Solar Farm', kind: 'solar', lat: -34.20, lng: 143.20, capacityGW: 0.26, size: 3, meta: '255 MW · Victoria', country: 'AU', status: 'OPERATIONAL' },
  { id: 'chile-atacama', name: 'Atacama Solar', kind: 'solar', lat: -24.00, lng: -69.00, capacityGW: 3.00, size: 5, meta: 'Atacama Desert cluster', country: 'CL', status: 'OPERATIONAL' },
  { id: 'solar-sahara-tunisia', name: 'Sahara TuNur', kind: 'solar', lat: 31.60, lng: 9.80, capacityGW: 4.50, size: 5, meta: '4.5 GW CSP · planned export to EU', country: 'TN', status: 'PLANNED' },
  { id: 'ten-west-link', name: 'Arizona Solar Hub', kind: 'solar', lat: 33.50, lng: -112.50, capacityGW: 5.00, size: 5, meta: 'Phoenix metro solar', country: 'US', status: 'OPERATIONAL' },
  { id: 'uk-cleve-hill', name: 'Cleve Hill Solar', kind: 'solar', lat: 51.37, lng: 0.93, capacityGW: 0.35, size: 3, meta: '350 MW · UK largest', country: 'GB', status: 'UNDER_CONSTRUCTION' },
  { id: 'de-solar', name: 'Brandenburg Solar', kind: 'solar', lat: 52.20, lng: 13.80, capacityGW: 2.00, size: 4, meta: 'E. Germany cluster', country: 'DE', status: 'OPERATIONAL' },
];

// ─── Major Hydroelectric Dams ─────────────────────────────────────────────────
export const HYDRO_DAMS: RenewableFeature[] = [
  { id: 'three-gorges', name: 'Three Gorges', kind: 'hydro', lat: 30.82, lng: 111.00, capacityGW: 22.50, size: 5, meta: '22.5 GW · World #1', country: 'CN', status: 'OPERATIONAL' },
  { id: 'baihetan', name: 'Baihetan', kind: 'hydro', lat: 26.89, lng: 102.89, capacityGW: 16.00, size: 5, meta: '16 GW · World #2', country: 'CN', status: 'OPERATIONAL' },
  { id: 'xiluodu', name: 'Xiluodu', kind: 'hydro', lat: 28.26, lng: 103.64, capacityGW: 13.86, size: 5, meta: '13.9 GW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'wudongde', name: 'Wudongde', kind: 'hydro', lat: 26.26, lng: 102.59, capacityGW: 10.20, size: 5, meta: '10.2 GW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'itaipu', name: 'Itaipú', kind: 'hydro', lat: -25.41, lng: -54.59, capacityGW: 14.00, size: 5, meta: '14 GW · Brazil/Paraguay', country: 'BR', status: 'OPERATIONAL' },
  { id: 'inga', name: 'Inga I+II', kind: 'hydro', lat: -5.52, lng: 13.62, capacityGW: 1.78, size: 4, meta: 'Congo · Inga 3 planned 11 GW', country: 'CD', status: 'OPERATIONAL' },
  { id: 'inga3-planned', name: 'Grand Inga (planned)', kind: 'hydro', lat: -5.45, lng: 13.58, capacityGW: 40.0, size: 5, meta: 'Would be world #1 if built', country: 'CD', status: 'PLANNED' },
  { id: 'guri', name: 'Guri', kind: 'hydro', lat: 7.75, lng: -62.99, capacityGW: 10.24, size: 5, meta: '10.2 GW · Venezuela', country: 'VE', status: 'OPERATIONAL' },
  { id: 'belo-monte', name: 'Belo Monte', kind: 'hydro', lat: -3.12, lng: -51.72, capacityGW: 11.23, size: 5, meta: '11.2 GW · Amazon', country: 'BR', status: 'OPERATIONAL' },
  { id: 'tucurui', name: 'Tucuruí', kind: 'hydro', lat: -3.83, lng: -49.71, capacityGW: 8.37, size: 4, meta: '8.4 GW', country: 'BR', status: 'OPERATIONAL' },
  { id: 'hoover-dam', name: 'Hoover Dam', kind: 'hydro', lat: 36.01, lng: -114.74, capacityGW: 2.08, size: 4, meta: '2.08 GW · Lake Mead · drought stressed', country: 'US', status: 'OPERATIONAL' },
  { id: 'grand-coulee', name: 'Grand Coulee', kind: 'hydro', lat: 47.96, lng: -118.98, capacityGW: 6.81, size: 5, meta: '6.8 GW · US largest', country: 'US', status: 'OPERATIONAL' },
  { id: 'robert-bourassa', name: 'Robert-Bourassa (LG-2)', kind: 'hydro', lat: 53.74, lng: -77.63, capacityGW: 5.62, size: 5, meta: '5.6 GW · James Bay', country: 'CA', status: 'OPERATIONAL' },
  { id: 'Churchill-falls', name: 'Churchill Falls', kind: 'hydro', lat: 53.56, lng: -64.01, capacityGW: 5.43, size: 4, meta: '5.4 GW · Labrador', country: 'CA', status: 'OPERATIONAL' },
  { id: 'aswan', name: 'Aswan High Dam', kind: 'hydro', lat: 23.97, lng: 32.88, capacityGW: 2.10, size: 4, meta: '2.1 GW · Nile', country: 'EG', status: 'OPERATIONAL' },
  { id: 'gerd', name: 'GERD (Grand Ethiopian)', kind: 'hydro', lat: 11.21, lng: 35.09, capacityGW: 5.15, size: 5, meta: '5.15 GW · Nile geopolitics', country: 'ET', status: 'OPERATIONAL' },
  { id: 'bakun', name: 'Bakun', kind: 'hydro', lat: 2.78, lng: 114.14, capacityGW: 2.40, size: 4, meta: '2.4 GW · Sarawak', country: 'MY', status: 'OPERATIONAL' },
  { id: 'nuozhadu', name: 'Nuozhadu', kind: 'hydro', lat: 22.73, lng: 100.44, capacityGW: 5.85, size: 5, meta: '5.85 GW · Lancang-Mekong', country: 'CN', status: 'OPERATIONAL' },
  { id: 'nalubaale', name: 'Nalubaale + Kiira', kind: 'hydro', lat: 0.43, lng: 33.18, capacityGW: 0.38, size: 3, meta: 'Lake Victoria · Nile source', country: 'UG', status: 'OPERATIONAL' },
  { id: 'kariba', name: 'Kariba', kind: 'hydro', lat: -16.52, lng: 28.77, capacityGW: 1.83, size: 4, meta: 'Zambia/Zimbabwe · SADC', country: 'ZW', status: 'OPERATIONAL' },
  { id: 'cahora-bassa', name: 'Cahora Bassa', kind: 'hydro', lat: -15.62, lng: 32.71, capacityGW: 2.08, size: 4, meta: '2.08 GW · Mozambique-SA grid', country: 'MZ', status: 'OPERATIONAL' },
  { id: 'bhakra-nangal', name: 'Bhakra-Nangal', kind: 'hydro', lat: 31.41, lng: 76.43, capacityGW: 1.36, size: 3, meta: 'Punjab · India independence project', country: 'IN', status: 'OPERATIONAL' },
  { id: 'bratsk', name: 'Bratsk', kind: 'hydro', lat: 56.14, lng: 101.81, capacityGW: 4.50, size: 4, meta: '4.5 GW · Siberia', country: 'RU', status: 'OPERATIONAL' },
  { id: 'sayano-shushenskaya', name: 'Sayano-Shushenskaya', kind: 'hydro', lat: 52.84, lng: 91.40, capacityGW: 6.40, size: 5, meta: '6.4 GW · Russia largest', country: 'RU', status: 'OPERATIONAL' },
  { id: 'enguri', name: 'Enguri', kind: 'hydro', lat: 42.67, lng: 42.11, capacityGW: 1.30, size: 3, meta: 'Georgia · 271m arch dam', country: 'GE', status: 'OPERATIONAL' },
];

export const RENEWABLE_KIND_COLOR: Record<RenewableKind, string> = {
  wind_offshore: 'hsl(195, 90%, 65%)',
  wind_onshore:  'hsl(170, 80%, 60%)',
  solar:         'hsl(45, 100%, 58%)',
  hydro:         'hsl(210, 85%, 60%)',
};

export const RENEWABLE_KIND_LABEL: Record<RenewableKind, string> = {
  wind_offshore: 'Offshore Wind',
  wind_onshore:  'Onshore Wind',
  solar:         'Solar Farm',
  hydro:         'Hydroelectric',
};
