/**
 * Internet freedom and digital sovereignty data.
 * Two sub-datasets:
 *
 * 1. Freedom House "Freedom on the Net" (FOTN) 2023-2024:
 *    score 0-100 (100 = most free); status = Free/Partly Free/Not Free
 *    Critical for: tech stock risk (platform bans), sanctions, digital assets,
 *    supply chain (data localisation requirements), fintech market access.
 *
 * 2. Internet penetration (World Bank / ITU 2023):
 *    % of population using the internet — consumer market sizing.
 */

export type FreedomStatus = 'Free' | 'Partly Free' | 'Not Free';

export type InternetFreedomData = {
  /** FOTN score 0-100 (100 = most free, 0 = no freedom) */
  score: number;
  status: FreedomStatus;
  /** % of population that are internet users */
  penetrationPct: number;
  /** Key censorship or control note */
  censorshipNotes?: string;
};

export const INTERNET_FREEDOM: Record<string, InternetFreedomData> = {

  // ── Free (score 70-100) ───────────────────────────────────────────────────
  IS:  { score: 95, status: 'Free', penetrationPct: 99.0 },
  NO:  { score: 94, status: 'Free', penetrationPct: 97.8 },
  EE:  { score: 93, status: 'Free', penetrationPct: 94.6 },
  FI:  { score: 91, status: 'Free', penetrationPct: 95.2 },
  CA:  { score: 87, status: 'Free', penetrationPct: 93.5 },
  DE:  { score: 80, status: 'Free', penetrationPct: 91.0 },
  NL:  { score: 79, status: 'Free', penetrationPct: 95.4 },
  SE:  { score: 77, status: 'Free', penetrationPct: 95.5 },
  AU:  { score: 76, status: 'Free', penetrationPct: 91.5 },
  GB:  { score: 76, status: 'Free', penetrationPct: 96.0, censorshipNotes: 'OSA 2023 content moderation; IWF blocking' },
  JP:  { score: 76, status: 'Free', penetrationPct: 83.5 },
  FR:  { score: 74, status: 'Free', penetrationPct: 84.7, censorshipNotes: 'DSA compliance; anti-hate speech laws; TikTok government device ban' },
  NZ:  { score: 74, status: 'Free', penetrationPct: 91.0 },
  US:  { score: 73, status: 'Free', penetrationPct: 91.8, censorshipNotes: 'TikTok ban legislation 2024 (divest order); Section 230 debates' },
  IE:  { score: 72, status: 'Free', penetrationPct: 90.0 },
  AT:  { score: 72, status: 'Free', penetrationPct: 90.3 },
  LT:  { score: 71, status: 'Free', penetrationPct: 83.0 },
  KR:  { score: 71, status: 'Free', penetrationPct: 97.6, censorshipNotes: 'KCSC content blocking (gambling, gambling, defamation); YouTube popular' },
  CH:  { score: 79, status: 'Free', penetrationPct: 93.6 },
  TW:  { score: 77, status: 'Free', penetrationPct: 90.0, censorshipNotes: 'PRC influence operations; disinformation source; no access to CN platforms' },

  // ── Partly Free (score 40-69) ─────────────────────────────────────────────
  BR:  { score: 68, status: 'Partly Free', penetrationPct: 84.0, censorshipNotes: 'STF X/Twitter blocking 2024; fake news CPI; digital sovereignty legislation' },
  HK:  { score: 44, status: 'Partly Free', penetrationPct: 93.0, censorshipNotes: 'Post-NSL 2020; self-censorship boom; HKFP challenges; VPN use surges' },
  SG:  { score: 60, status: 'Partly Free', penetrationPct: 88.0, censorshipNotes: 'POFMA (fake news law) broad application; SPH media consolidation' },
  PH:  { score: 65, status: 'Partly Free', penetrationPct: 66.0, censorshipNotes: 'Rappler/ABS-CBN closures; Facebook major disinformation hub' },
  IN:  { score: 50, status: 'Partly Free', penetrationPct: 46.3, censorshipNotes: 'Internet shutdowns (highest globally 2023); IT Rules 2021 content removal; Kashmir blackouts' },
  ID:  { score: 52, status: 'Partly Free', penetrationPct: 77.0, censorshipNotes: 'ITE Law arrests for criticism; TikTok e-commerce banned; fintech-heavy market' },
  TH:  { score: 38, status: 'Partly Free', penetrationPct: 77.8, censorshipNotes: 'lèse-majesté online enforcement; activist arrests; CCA Section 14' },
  PL:  { score: 68, status: 'Partly Free', penetrationPct: 86.0, censorshipNotes: 'Some improvement post-Tusk; prior TVP/public media control' },
  MX:  { score: 65, status: 'Partly Free', penetrationPct: 76.5, censorshipNotes: 'Journalist targeted by spyware (Pegasus); Cartel-related blogger risk' },
  AR:  { score: 67, status: 'Partly Free', penetrationPct: 86.8 },
  TR:  { score: 29, status: 'Not Free', penetrationPct: 83.3, censorshipNotes: 'X blocked Nov 2022–Jul 2023; Wikipedia blocked 2017-2019; social media law fines' },
  MA:  { score: 46, status: 'Partly Free', penetrationPct: 84.3, censorshipNotes: 'VoIP blocked; journalist arrests for online content' },
  TN:  { score: 51, status: 'Partly Free', penetrationPct: 62.4, censorshipNotes: 'Post-2021 Saïed; decree 54 online speech arrests' },
  EG:  { score: 27, status: 'Not Free', penetrationPct: 71.9, censorshipNotes: 'Sisi era mass blocking; Al-Jazeera blocked; VPN widely used' },
  JO:  { score: 47, status: 'Partly Free', penetrationPct: 88.2, censorshipNotes: 'Cybercrime law arrests; Telegram blocked briefly; news site licensing' },
  UA:  { score: 62, status: 'Partly Free', penetrationPct: 81.5, censorshipNotes: 'Wartime VK/Russian platform bans; Diia gov app success; legitimate blocking' },
  KZ:  { score: 29, status: 'Not Free', penetrationPct: 84.0, censorshipNotes: 'Protests blocked; Telegram throttling; SORM surveillance' },
  NG:  { score: 55, status: 'Partly Free', penetrationPct: 55.0, censorshipNotes: 'Twitter 7-month ban 2021-22; data throttling; NITDA takedown demands' },
  GH:  { score: 63, status: 'Partly Free', penetrationPct: 68.0 },
  ZA:  { score: 73, status: 'Free', penetrationPct: 72.0 },
  KE:  { score: 58, status: 'Partly Free', penetrationPct: 42.0, censorshipNotes: 'Social media cuts during protests; OTT tax; Safaricom government stakes' },
  CO:  { score: 63, status: 'Partly Free', penetrationPct: 73.4 },
  PK:  { score: 25, status: 'Not Free', penetrationPct: 36.0, censorshipNotes: 'X blocked Feb 2024; Wikipedia blocked; YouTube periodic bans; PTI content removed' },
  BD:  { score: 40, status: 'Partly Free', penetrationPct: 44.0, censorshipNotes: 'DSA arrests; Facebook DM cooperation; UN report on surveillance' },
  ET:  { score: 28, status: 'Not Free', penetrationPct: 22.0, censorshipNotes: 'Tigray-era internet blackout 2020-21; Ethiotel monopoly; social media shutdowns' },
  UZ:  { score: 28, status: 'Not Free', penetrationPct: 70.0, censorshipNotes: 'VPN blocks; Opposition content removed; SORM-style surveillance' },
  VN:  { score: 22, status: 'Not Free', penetrationPct: 79.1, censorshipNotes: 'Cybersecurity Law 2019 data localisation; Facebook/YouTube compliance demanded; journalist arrests' },
  AZ:  { score: 35, status: 'Partly Free', penetrationPct: 88.0, censorshipNotes: 'Activist arrests; VPN use high; Azerbaijan internet monitoring' },

  // ── Not Free (score 0-39) ─────────────────────────────────────────────────
  CN:  { score: 10, status: 'Not Free', penetrationPct: 76.4, censorshipNotes: 'Great Firewall; Google/Meta/YouTube/Twitter blocked; WeChat surveillance; VPN illegal but tolerated for business' },
  IR:  { score: 16, status: 'Not Free', penetrationPct: 69.0, censorshipNotes: 'Instagram/WhatsApp blocked since Mahsa protests 2022; VPN widely used; national intranet (SHOMA)' },
  RU:  { score: 21, status: 'Not Free', penetrationPct: 85.0, censorshipNotes: 'Instagram/Facebook blocked since 2022; SORM-3; Roskomnadzor; DPI infrastructure; VPN spike' },
  CU:  { score: 22, status: 'Not Free', penetrationPct: 68.0, censorshipNotes: 'ETECSA monopoly; slow speeds; social media blocked during July 2021 protests' },
  BY:  { score: 29, status: 'Not Free', penetrationPct: 83.0, censorshipNotes: 'Telegram blocked 2020 election; Signal/Tor blocked; journalist doxing; LukaShenka surveillance' },
  MM:  { score: 21, status: 'Not Free', penetrationPct: 39.0, censorshipNotes: 'Facebook blocked; military junta internet kills; activists arrested; sim card confiscations' },
  KP:  { score: 3,  status: 'Not Free', penetrationPct:  0.1, censorshipNotes: 'No public internet; elite intranet (Kwangmyong) only; death penalty for foreign media' },
  SD:  { score: 23, status: 'Not Free', penetrationPct: 30.0, censorshipNotes: 'SAF/RSF both cut internet; 5 major shutdowns 2023-24; Khartoum telecom infrastructure destroyed' },
  SS:  { score: 21, status: 'Not Free', penetrationPct:  9.0 },
  YE:  { score: 24, status: 'Not Free', penetrationPct: 26.0, censorshipNotes: 'Houthi and Hadi zones both block; infrastructure destroyed' },
  SA:  { score: 32, status: 'Not Free', penetrationPct: 95.7, censorshipNotes: 'VoIP restricted; LGBTQ+ / political content blocked; Twitter influencer arrests; CITC monitoring' },
  AE:  { score: 38, status: 'Partly Free', penetrationPct: 99.0, censorshipNotes: 'VoIP (Skype/FaceTime) blocked; LGBTQ+ content; FinCEN surveillance capabilities bought' },
  SY:  { score: 26, status: 'Not Free', penetrationPct: 34.0 },
  TM:  { score: 5,  status: 'Not Free', penetrationPct: 41.0, censorshipNotes: 'Turkmentelekom monopoly; WhatsApp blocked; VPN illegal; SORM' },
  UG:  { score: 36, status: 'Partly Free', penetrationPct: 26.0, censorshipNotes: 'Social media tax; Twitter/Facebook blocked during 2021 elections; HeroAPI use' },
};

/** Color: green (Free) → amber (Partly Free) → red (Not Free). */
export function freedomColor(score: number): string {
  if (score >= 70) {
    const t = (score - 70) / 30;
    return `hsla(145, 80%, ${50 - t * 5}%, ${0.20 + t * 0.25})`;  // bright green
  }
  if (score >= 40) {
    const t = (score - 40) / 30;
    return `hsla(${35 + t * 30}, 85%, ${52 - t * 5}%, ${0.22 + t * 0.15})`;  // amber → yellow-green
  }
  const t = score / 40;
  return `hsla(${t * 35}, 88%, ${48 - t * 4}%, ${0.30 + (1 - t) * 0.20})`;  // deep red → amber
}

/** Internet penetration ramp: gray (low) → teal (high). */
export function penetrationColor(pct: number): string {
  const t = Math.min(1, pct / 100);
  return `hsla(185, 75%, ${45 + t * 10}%, ${0.15 + t * 0.35})`;
}

export const FREEDOM_STATUS_COLOR: Record<FreedomStatus, string> = {
  'Free':        'hsl(145, 80%, 55%)',
  'Partly Free': 'hsl(45, 90%, 55%)',
  'Not Free':    'hsl(0, 85%, 52%)',
};
