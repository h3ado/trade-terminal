const SOURCE_CODES: Record<string, string> = {
  'reuters.com': 'RTR ', 'apnews.com': 'AP  ', 'bloomberg.com': 'BBG ',
  'afp.com': 'AFP ', 'efe.com': 'EFE ', 'dpa-news.com': 'DPA ',
  'wsj.com': 'WSJ ', 'ft.com': 'FT  ', 'cnbc.com': 'CNBC',
  'nytimes.com': 'NYT ', 'economist.com': 'ECO ', 'barrons.com': 'BRRN',
  'marketwatch.com': 'MKTW', 'seekingalpha.com': 'SALP', 'zerohedge.com': 'ZH  ',
  'businessinsider.com': 'BSIN', 'fortune.com': 'FORT', 'forbes.com': 'FRBS',
  'bbc.com': 'BBC ', 'bbc.co.uk': 'BBC ', 'cnn.com': 'CNN ',
  'foxnews.com': 'FOX ', 'nbcnews.com': 'NBC ', 'abcnews.go.com': 'ABC ',
  'federalreserve.gov': 'FRB ', 'sec.gov': 'SEC ', 'congress.gov': 'CONG',
  'treasury.gov': 'TRES', 'ecb.europa.eu': 'ECB ', 'boj.or.jp': 'BOJ ',
  'bankofengland.co.uk': 'BOE ', 'coindesk.com': 'CDK ', 'cointelegraph.com': 'CTLG',
  'decrypt.co': 'DCPT', 'oilprice.com': 'OPX ', 'rigzone.com': 'RGZ ',
};

export function sourceCode(domain: string): string {
  if (!domain) return '????';
  if (domain.startsWith('@')) return ('@' + domain.slice(1, 3).toUpperCase()).padEnd(4);
  const key = domain.toLowerCase().replace(/^www\./, '');
  const match = SOURCE_CODES[key] ?? SOURCE_CODES[domain.toLowerCase()];
  if (match) return match.slice(0, 4).padEnd(4);
  return key.split('.')[0].toUpperCase().slice(0, 4).padEnd(4);
}
