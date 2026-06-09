import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody } from './utils/response.js';
import {
  searchSiteIndex,
  buildSiteContextForAI,
  loadSiteSearchIndex,
} from './utils/marketing/siteIndexLoader.js';
import type { SiteAskResponse } from '../../src/types/siteSearch.js';

const MAX_QUESTION = 500;
const MAX_HISTORY = 4;

async function askAboutSite(
  question: string,
  history: { role: string; content: string }[] = [],
): Promise<SiteAskResponse> {
  const sources = searchSiteIndex(question, 8).map(({ score: _s, snippet: _sn, ...rest }) => rest);
  const context = buildSiteContextForAI(question, 8);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  const appIntent =
    /\b(pantry|meal plan|receipt|inventory|clara|brain|my kitchen|logged in|account)\b/i.test(question);

  if (!apiKey) {
    const fallback =
      sources.length > 0
        ? `Here are the closest pages on SousChef:\n\n${sources
            .slice(0, 5)
            .map((s) => `• **${s.title}** — ${s.href}\n  ${s.summary.slice(0, 120)}`)
            .join('\n\n')}`
        : 'Try searching for platform features, pricing, Kitchen Academy, or how SousChef works. Sign in to use Clara for your personal pantry.';
    return { answer: fallback, sources, ai_used: false, suggest_signup: appIntent };
  }

  const system = `You are SousChef Site Guide — a helpful assistant for the SousChef marketing website (HomeChef AI).
Answer ONLY using the SITE CONTEXT below. Do not invent features, prices, or policies.
If the user asks about their personal pantry, meals, or account, say those need the app and suggest /login.
Include markdown links like [Pricing](/pricing) when relevant.
Keep answers concise (2–4 short paragraphs max).
SousChef = Household Food Operating System: pantry memory, receipt scan, meal plans, Clara AI sous chef, Brain insights, Kitchen Academy.

SITE CONTEXT:
${context}`;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-MAX_HISTORY),
    { role: 'user', content: question },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.35,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('site-search OpenAI error', response.status, errText.slice(0, 200));
    return {
      answer:
        sources.length > 0
          ? `I couldn't reach AI right now. Try these pages:\n${sources.map((s) => `• ${s.title} (${s.href})`).join('\n')}`
          : 'Search is temporarily unavailable. Browse /explore, /pricing, or /learn.',
      sources,
      ai_used: false,
      suggest_signup: appIntent,
    };
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = data.choices?.[0]?.message?.content?.trim() ?? 'No answer generated.';

  return { answer, sources, ai_used: true, suggest_signup: appIntent };
}

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse({});
  }

  const params = event.queryStringParameters ?? {};

  if (event.httpMethod === 'GET') {
    if (params.action === 'index') {
      return jsonResponse({ entries: loadSiteSearchIndex(), count: loadSiteSearchIndex().length });
    }

    const q = (params.q ?? '').trim();
    const limit = Math.min(parseInt(params.limit ?? '12', 10) || 12, 24);
    const results = searchSiteIndex(q, limit);
    return jsonResponse({ results, query: q, count: results.length });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{ question?: string; history?: { role: string; content: string }[] }>(event);
    const question = (body?.question ?? '').trim();
    if (!question) return errorResponse('question is required', 400);
    if (question.length > MAX_QUESTION) return errorResponse('question too long', 400);

    const history = (body?.history ?? []).filter(
      (m) => m?.role && m?.content && ['user', 'assistant'].includes(m.role),
    );
    const result = await askAboutSite(question, history);
    return jsonResponse(result);
  }

  return errorResponse('Method not allowed', 405);
});
