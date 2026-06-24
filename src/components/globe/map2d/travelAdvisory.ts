/**
 * US Department of State travel advisory levels (1-4) by ISO-A2.
 * 1 = Exercise Normal Precautions  (green)
 * 2 = Exercise Increased Caution   (yellow)
 * 3 = Reconsider Travel            (orange)
 * 4 = Do Not Travel                (red)
 *
 * Curated snapshot — refresh from travel.state.gov as needed.
 */
export type AdvisoryLevel = 1 | 2 | 3 | 4;

export const TRAVEL_ADVISORY: Record<string, { lvl: AdvisoryLevel; reason?: string }> = {
  // Level 4
  AF: { lvl: 4, reason: 'Terrorism, conflict' },
  BY: { lvl: 4, reason: 'Arbitrary detention' },
  MM: { lvl: 4, reason: 'Civil unrest, conflict' },
  CF: { lvl: 4, reason: 'Crime, conflict' },
  HT: { lvl: 4, reason: 'Kidnapping, civil unrest' },
  IR: { lvl: 4, reason: 'Wrongful detention' },
  IQ: { lvl: 4, reason: 'Terrorism, kidnapping' },
  LY: { lvl: 4, reason: 'Crime, terrorism' },
  ML: { lvl: 4, reason: 'Crime, terrorism' },
  KP: { lvl: 4, reason: 'Wrongful detention' },
  RU: { lvl: 4, reason: 'War, harassment' },
  SO: { lvl: 4, reason: 'Crime, terrorism' },
  SS: { lvl: 4, reason: 'Crime, conflict' },
  SD: { lvl: 4, reason: 'Armed conflict' },
  SY: { lvl: 4, reason: 'Terrorism, conflict' },
  UA: { lvl: 4, reason: 'Russian invasion' },
  VE: { lvl: 4, reason: 'Wrongful detention, crime' },
  YE: { lvl: 4, reason: 'Terrorism, conflict' },
  BF: { lvl: 4, reason: 'Terrorism' },
  NE: { lvl: 4, reason: 'Terrorism, kidnapping' },
  GN: { lvl: 4, reason: 'Civil unrest' },
  LB: { lvl: 4, reason: 'Conflict, terrorism' },
  IL: { lvl: 3, reason: 'Terrorism, conflict' },

  // Level 3
  CN: { lvl: 3, reason: 'Arbitrary enforcement' },
  CO: { lvl: 3, reason: 'Crime, terrorism' },
  EG: { lvl: 3, reason: 'Terrorism' },
  GT: { lvl: 3, reason: 'Crime' },
  HN: { lvl: 3, reason: 'Crime' },
  JM: { lvl: 3, reason: 'Crime' },
  NI: { lvl: 3, reason: 'Wrongful detention' },
  NG: { lvl: 3, reason: 'Crime, terrorism' },
  PK: { lvl: 3, reason: 'Terrorism' },
  CD: { lvl: 3, reason: 'Crime, civil unrest' },
  CG: { lvl: 3, reason: 'Civil unrest' },
  UG: { lvl: 3, reason: 'Crime, terrorism' },
  ZW: { lvl: 3, reason: 'Crime' },
  TT: { lvl: 3, reason: 'Crime' },
  MZ: { lvl: 3, reason: 'Terrorism' },
  ET: { lvl: 3, reason: 'Civil unrest' },

  // Level 2
  BR: { lvl: 2, reason: 'Crime' }, MX: { lvl: 2, reason: 'Crime' },
  IN: { lvl: 2, reason: 'Crime, terrorism' }, ID: { lvl: 2, reason: 'Terrorism' },
  PH: { lvl: 2, reason: 'Crime, terrorism' }, TR: { lvl: 2, reason: 'Terrorism' },
  TH: { lvl: 2, reason: 'Civil unrest' }, KE: { lvl: 2, reason: 'Crime, terrorism' },
  ZA: { lvl: 2, reason: 'Crime' }, FR: { lvl: 2, reason: 'Terrorism' },
  DE: { lvl: 2, reason: 'Terrorism' }, GB: { lvl: 2, reason: 'Terrorism' },
  IT: { lvl: 2, reason: 'Terrorism' }, ES: { lvl: 2, reason: 'Terrorism' },
  BE: { lvl: 2, reason: 'Terrorism' }, NL: { lvl: 2, reason: 'Terrorism' },
  DK: { lvl: 2, reason: 'Terrorism' }, MA: { lvl: 2, reason: 'Terrorism' },
  TN: { lvl: 2, reason: 'Terrorism' }, JO: { lvl: 2, reason: 'Terrorism' },
  SA: { lvl: 2, reason: 'Terrorism' }, AE: { lvl: 2, reason: 'Terrorism' },
  PE: { lvl: 2, reason: 'Crime, civil unrest' }, EC: { lvl: 2, reason: 'Crime' },
  AR: { lvl: 1 }, CL: { lvl: 1 },

  // Level 1
  CA: { lvl: 1 }, JP: { lvl: 1 }, KR: { lvl: 1 }, AU: { lvl: 1 }, NZ: { lvl: 1 },
  SG: { lvl: 1 }, NO: { lvl: 1 }, SE: { lvl: 1 }, FI: { lvl: 1 }, IS: { lvl: 1 },
  IE: { lvl: 1 }, PT: { lvl: 1 }, CH: { lvl: 1 }, AT: { lvl: 1 }, PL: { lvl: 1 },
  CZ: { lvl: 1 }, HU: { lvl: 1 }, GR: { lvl: 1 }, EE: { lvl: 1 }, LV: { lvl: 1 },
  LT: { lvl: 1 }, RO: { lvl: 1 }, BG: { lvl: 1 }, HR: { lvl: 1 }, SI: { lvl: 1 },
  CR: { lvl: 1 }, PA: { lvl: 1 }, UY: { lvl: 1 }, MY: { lvl: 1 }, VN: { lvl: 1 },
  TW: { lvl: 1 }, OM: { lvl: 1 }, QA: { lvl: 1 }, KW: { lvl: 1 }, BH: { lvl: 1 },
};

const ADVISORY_PALETTE: Record<AdvisoryLevel, string> = {
  1: 'hsl(140, 70%, 35%)',
  2: 'hsl(48, 90%, 50%)',
  3: 'hsl(28, 95%, 50%)',
  4: 'hsl(0, 85%, 48%)',
};

export const ADVISORY_LABEL: Record<AdvisoryLevel, string> = {
  1: 'L1 · Normal',
  2: 'L2 · Caution',
  3: 'L3 · Reconsider',
  4: 'L4 · Do Not Travel',
};

export function advisoryColor(lvl: AdvisoryLevel | undefined): string | null {
  if (!lvl) return null;
  return ADVISORY_PALETTE[lvl];
}
