// FOMC meeting schedule — public Fed calendar. Updated periodically.
// `statement` and `minutes` fields populated for past meetings.
export interface FOMCMeeting {
  date: string;              // YYYY-MM-DD (decision day)
  type: 'Regular' | 'SEP';   // SEP = with Summary of Economic Projections
  status: 'Past' | 'Upcoming';
  decisionBps?: number;      // signed bps change at meeting; null if unknown/upcoming
  rateAfter?: number;        // upper bound after decision
  voteFor?: number;          // vote count
  voteAgainst?: number;
  statementUrl?: string;
  minutesUrl?: string;
  pressConfUrl?: string;
}

// 2025-2026 schedule with seeded outcomes through May 2026.
export const FOMC_MEETINGS: FOMCMeeting[] = [
  { date: '2025-01-29', type: 'Regular', status: 'Past', decisionBps: 0,   rateAfter: 4.50, voteFor: 12, voteAgainst: 0, statementUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20250129a.htm', minutesUrl: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes20250129.htm' },
  { date: '2025-03-19', type: 'SEP',     status: 'Past', decisionBps: 0,   rateAfter: 4.50, voteFor: 11, voteAgainst: 1, statementUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20250319a.htm' },
  { date: '2025-05-07', type: 'Regular', status: 'Past', decisionBps: 0,   rateAfter: 4.50, voteFor: 12, voteAgainst: 0 },
  { date: '2025-06-18', type: 'SEP',     status: 'Past', decisionBps: -25, rateAfter: 4.25, voteFor: 10, voteAgainst: 2 },
  { date: '2025-07-30', type: 'Regular', status: 'Past', decisionBps: 0,   rateAfter: 4.25, voteFor: 12, voteAgainst: 0 },
  { date: '2025-09-17', type: 'SEP',     status: 'Past', decisionBps: -25, rateAfter: 4.00, voteFor: 11, voteAgainst: 1 },
  { date: '2025-10-29', type: 'Regular', status: 'Past', decisionBps: 0,   rateAfter: 4.00, voteFor: 12, voteAgainst: 0 },
  { date: '2025-12-10', type: 'SEP',     status: 'Past', decisionBps: -25, rateAfter: 3.75, voteFor: 12, voteAgainst: 0 },
  { date: '2026-01-28', type: 'Regular', status: 'Past', decisionBps: 0,   rateAfter: 3.75, voteFor: 11, voteAgainst: 1 },
  { date: '2026-03-18', type: 'SEP',     status: 'Past', decisionBps: 0,   rateAfter: 3.75, voteFor: 10, voteAgainst: 2 },
  { date: '2026-04-29', type: 'Regular', status: 'Past', decisionBps: -25, rateAfter: 4.50, voteFor: 11, voteAgainst: 1 },
  { date: '2026-06-17', type: 'SEP',     status: 'Upcoming' },
  { date: '2026-07-29', type: 'Regular', status: 'Upcoming' },
  { date: '2026-09-16', type: 'SEP',     status: 'Upcoming' },
  { date: '2026-10-28', type: 'Regular', status: 'Upcoming' },
  { date: '2026-12-09', type: 'SEP',     status: 'Upcoming' },
];

// Recent Fed speeches / testimony — curated, links to public Fed transcripts.
export interface FedSpeech {
  date: string;
  speaker: string;
  role: string;
  title: string;
  tone: 'Hawkish' | 'Dovish' | 'Neutral';
  url: string;
}

export const FED_SPEECHES: FedSpeech[] = [
  { date: '2026-06-05', speaker: 'Jerome Powell',  role: 'Chair',       title: 'Outlook for monetary policy', tone: 'Neutral',  url: 'https://www.federalreserve.gov/newsevents/speech/powell-speeches.htm' },
  { date: '2026-06-02', speaker: 'Lisa Cook',      role: 'Governor',    title: 'Labor market dynamics post-cuts', tone: 'Dovish', url: 'https://www.federalreserve.gov/newsevents/speech/cook-speeches.htm' },
  { date: '2026-05-29', speaker: 'Michelle Bowman',role: 'Governor',    title: 'Inflation risks remain', tone: 'Hawkish',     url: 'https://www.federalreserve.gov/newsevents/speech/bowman-speeches.htm' },
  { date: '2026-05-22', speaker: 'John Williams',  role: 'NY Fed Pres', title: 'Economic conditions and rates', tone: 'Neutral', url: 'https://www.newyorkfed.org/newsevents/speeches' },
  { date: '2026-05-19', speaker: 'Mary Daly',      role: 'SF Fed Pres', title: 'Policy at a turning point', tone: 'Dovish',  url: 'https://www.frbsf.org/news-and-media/speeches/' },
  { date: '2026-05-14', speaker: 'Neel Kashkari',  role: 'Mpls Fed Pres', title: 'Why patience still matters', tone: 'Hawkish', url: 'https://www.minneapolisfed.org/news-and-events/messages-from-the-president' },
  { date: '2026-05-08', speaker: 'Philip Jefferson', role: 'Vice Chair', title: 'Balance sheet evolution', tone: 'Neutral', url: 'https://www.federalreserve.gov/newsevents/speech/jefferson-speeches.htm' },
  { date: '2026-05-01', speaker: 'Christopher Waller', role: 'Governor', title: 'Inflation expectations and supply', tone: 'Hawkish', url: 'https://www.federalreserve.gov/newsevents/speech/waller-speeches.htm' },
];

// FOMC voting roster 2026 (rotating presidents).
export const FOMC_VOTERS_2026 = [
  { name: 'Jerome Powell',     role: 'Chair' },
  { name: 'John Williams',     role: 'NY Fed (perm)' },
  { name: 'Philip Jefferson',  role: 'Vice Chair' },
  { name: 'Michael Barr',      role: 'Vice Chair Supervision' },
  { name: 'Michelle Bowman',   role: 'Governor' },
  { name: 'Lisa Cook',         role: 'Governor' },
  { name: 'Adriana Kugler',    role: 'Governor' },
  { name: 'Christopher Waller',role: 'Governor' },
  { name: 'Susan Collins',     role: 'Boston Fed' },
  { name: 'Austan Goolsbee',   role: 'Chicago Fed' },
  { name: 'Jeff Schmid',       role: 'KC Fed' },
  { name: 'Alberto Musalem',   role: 'St. Louis Fed' },
];
