// Shared helpers: Claude API call, JSON parsing, escaping, slugs.
// No dependencies: uses Node 20's built-in fetch.

export const MODELS = {
  // Cheap model drafts and plans; stronger model reviews. Override with env vars.
  writer: process.env.WRITER_MODEL || 'claude-haiku-5-5',
  reviewer: process.env.REVIEWER_MODEL || 'claude-sonnet-5-5',
};

export async function callClaude({ model, system, user, maxTokens = 4000 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // The system prompt (style guide) repeats on every call, so cache it.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export function parseJson(text) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(clean);
  } catch {
    const first = clean.search(/[\[{]/);
    const last = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (first === -1 || last === -1) throw new Error('Model did not return JSON');
    return JSON.parse(clean.slice(first, last + 1));
  }
}

export async function withRetry(fn, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; console.warn(`Retrying after error: ${e.message}`); }
  }
  throw lastErr;
}

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
