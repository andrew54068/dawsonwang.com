import type { APIRoute } from 'astro';
import { isAllowedOrigin } from '../../lib/origin-guard';

export const prerender = false;

const MODEL = '@cf/baai/bge-m3';
const MAX_BODY_BYTES = 4 * 1024;
const MAX_QUERY_CHARS = 500;

export const POST: APIRoute = async ({ request }) => {
  if (!isAllowedOrigin(request)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413);
  }

  const accountId = import.meta.env.CF_ACCOUNT_ID;
  const apiToken = import.meta.env.CF_API_TOKEN;
  if (!accountId || !apiToken) {
    console.error('[embed] CF_ACCOUNT_ID / CF_API_TOKEN not set');
    return json({ error: 'Service unavailable' }, 503);
  }

  let query: string;
  try {
    const body = await request.json();
    query = String((body as { query?: unknown })?.query ?? '').trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!query) return json({ error: 'Empty query' }, 400);
  if (query.length > MAX_QUERY_CHARS) return json({ error: 'Query too long' }, 400);

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
    // Log details server-side; don't leak account/upstream specifics to clients.
    const detail = await upstream.text().catch(() => '');
    console.error('[embed] Cloudflare upstream error', upstream.status, detail.slice(0, 500));
    return json({ error: 'Upstream error' }, 502);
  }
  const data = (await upstream.json()) as {
    result?: { data?: number[][] };
    success?: boolean;
  };
  const vector = data?.result?.data?.[0];
  if (!Array.isArray(vector)) {
    console.error('[embed] Unexpected CF response shape');
    return json({ error: 'Upstream error' }, 502);
  }

  return json({ vector }, 200, { 'cache-control': 'no-store' });
};

function json(body: unknown, status: number, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });
}
