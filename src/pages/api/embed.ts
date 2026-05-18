import type { APIRoute } from 'astro';

export const prerender = false;

const MODEL = '@cf/baai/bge-m3';

export const POST: APIRoute = async ({ request }) => {
  const accountId = import.meta.env.CF_ACCOUNT_ID;
  const apiToken = import.meta.env.CF_API_TOKEN;
  if (!accountId || !apiToken) {
    return json({ error: 'CF_ACCOUNT_ID / CF_API_TOKEN not set' }, 500);
  }

  let query: string;
  try {
    const body = await request.json();
    query = String((body as { query?: unknown })?.query ?? '').trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!query) return json({ error: 'Empty query' }, 400);
  if (query.length > 500) return json({ error: 'Query too long' }, 400);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text: [query] }),
  });
  if (!upstream.ok) {
    return json({ error: `CF ${upstream.status}: ${await upstream.text()}` }, 502);
  }
  const data = (await upstream.json()) as {
    result?: { data?: number[][] };
    success?: boolean;
  };
  const vector = data?.result?.data?.[0];
  if (!Array.isArray(vector)) return json({ error: 'Unexpected CF response' }, 502);

  return json({ vector }, 200, { 'cache-control': 'no-store' });
};

function json(body: unknown, status: number, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });
}
