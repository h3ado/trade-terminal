import { Router } from 'express';

const router = Router();

// ─── Deterministic mock data helpers (mirrors the UI seeds) ──────────────────

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function getRegime(ticker: string) {
  const r = rng(hash(ticker + ':dpi-snap'));
  const spot = +(480 + r() * 60).toFixed(2);
  const zeroG = +(spot + (r() - 0.5) * 8).toFixed(2);
  const netGex = Math.round((r() - 0.45) * 4_500_000_000);
  return { ticker, spot, zeroG, distToZeroPct: +(((zeroG - spot) / spot) * 100).toFixed(2), netGex, regime: netGex >= 0 ? 'long-gamma' : 'short-gamma', interpretation: netGex >= 0 ? 'Dealers buy dips / sell rips. Pinning likely.' : 'Dealers chase trends. Vol expansion risk.', flipProb: Math.round(20 + r() * 65) };
}

function getGex(ticker: string) {
  const r = rng(hash(ticker + ':gex'));
  return { ticker, netGex: Math.round((r() - 0.45) * 4_500_000_000), callGex: Math.round(r() * 3_000_000_000), putGex: Math.round(-r() * 2_500_000_000), largestCallWall: Math.round(480 + r() * 30), largestPutWall: Math.round(450 + r() * 30) };
}

function getIv(ticker: string) {
  const r = rng(hash(ticker + ':iv'));
  const atm = +(15 + r() * 25).toFixed(1);
  return { ticker, atmIv: atm, ivRank: Math.round(r() * 100), ivPctl: Math.round(r() * 100), rv20: +(atm * (0.7 + r() * 0.5)).toFixed(1), skew25d: +((r() - 0.5) * 6).toFixed(2), termSlope: +((r() - 0.5) * 4).toFixed(2) };
}

function screen(filter: { minIvRank?: number; maxIvRank?: number; positiveSkew?: boolean }) {
  const universe = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'IWM', 'META', 'AMZN', 'MSFT', 'GOOG', 'AMD', 'COIN'];
  return { matches: universe.map(t => getIv(t)).filter(x => filter.minIvRank ? x.ivRank >= filter.minIvRank : true).filter(x => filter.maxIvRank ? x.ivRank <= filter.maxIvRank : true).filter(x => filter.positiveSkew ? x.skew25d > 0 : true).slice(0, 8) };
}

const STRATEGY_PRESETS: Record<string, any[]> = {
  'long-call': [{ side: 'LONG', type: 'CALL', strikeOffset: 0, dte: 30, qty: 1 }],
  'bull-call-spread': [{ side: 'LONG', type: 'CALL', strikeOffset: 0, dte: 30, qty: 1 }, { side: 'SHORT', type: 'CALL', strikeOffset: 10, dte: 30, qty: 1 }],
  'iron-condor': [{ side: 'SHORT', type: 'PUT', strikeOffset: -10, dte: 30, qty: 1 }, { side: 'LONG', type: 'PUT', strikeOffset: -20, dte: 30, qty: 1 }, { side: 'SHORT', type: 'CALL', strikeOffset: 10, dte: 30, qty: 1 }, { side: 'LONG', type: 'CALL', strikeOffset: 20, dte: 30, qty: 1 }],
};

// ─── Options Copilot route ────────────────────────────────────────────────────

const TOOLS = [
  { name: 'get_regime', description: 'Get GEX regime for a ticker', input_schema: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] } },
  { name: 'get_gex', description: 'Get gamma exposure for a ticker', input_schema: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] } },
  { name: 'get_iv', description: 'Get implied volatility surface for a ticker', input_schema: { type: 'object', properties: { ticker: { type: 'string' } }, required: ['ticker'] } },
  { name: 'screen_by_iv', description: 'Screen universe by IV rank/percentile', input_schema: { type: 'object', properties: { minIvRank: { type: 'number' }, maxIvRank: { type: 'number' }, positiveSkew: { type: 'boolean' } } } },
  { name: 'build_strategy', description: 'Get strategy legs for a template', input_schema: { type: 'object', properties: { template: { type: 'string' }, ticker: { type: 'string' } }, required: ['template', 'ticker'] } },
];

function callTool(name: string, input: any): unknown {
  switch (name) {
    case 'get_regime': return getRegime(input.ticker);
    case 'get_gex': return getGex(input.ticker);
    case 'get_iv': return getIv(input.ticker);
    case 'screen_by_iv': return screen(input);
    case 'build_strategy': return { ticker: input.ticker, template: input.template, legs: STRATEGY_PRESETS[input.template] ?? STRATEGY_PRESETS['long-call'] };
    default: return { error: 'unknown tool' };
  }
}

router.post('/options-copilot', async (req, res) => {
  const { messages = [], ticker } = req.body as { messages: any[]; ticker?: string };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' }); return; }

  const systemPrompt = `You are Options Copilot, a quantitative options trading assistant. You have access to tools for GEX data, IV surfaces, and strategy templates.
Current ticker context: ${ticker ?? 'not set'}. Be concise. When asked about a strategy, always call the relevant data tools first.`;

  try {
    let msgs = [...messages];
    let finalText = '';
    const toolCalls: any[] = [];

    // Agentic loop (max 5 iterations)
    for (let i = 0; i < 5; i++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: systemPrompt, tools: TOOLS, messages: msgs }),
      });
      if (!r.ok) throw new Error(`anthropic ${r.status}`);
      const j = await r.json() as any;

      if (j.stop_reason === 'end_turn') {
        finalText = j.content?.find((c: any) => c.type === 'text')?.text ?? '';
        break;
      }
      if (j.stop_reason === 'tool_use') {
        const toolUseBlocks = j.content.filter((c: any) => c.type === 'tool_use');
        msgs.push({ role: 'assistant', content: j.content });
        const toolResults = toolUseBlocks.map((t: any) => {
          const result = callTool(t.name, t.input);
          toolCalls.push({ name: t.name, input: t.input, result });
          return { type: 'tool_result', tool_use_id: t.id, content: JSON.stringify(result) };
        });
        msgs.push({ role: 'user', content: toolResults });
      } else { break; }
    }

    res.json({ text: finalText, toolCalls });
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

export default router;
