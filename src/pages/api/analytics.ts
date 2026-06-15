import type { APIRoute } from 'astro';
import { isAllowedOrigin } from '../../lib/origin-guard';

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;
const MAX_PATH_CHARS = 2048;
const MAX_URL_CHARS = 4096;
const MAX_TITLE_CHARS = 300;
const MAX_NAME_CHARS = 120;
const MAX_TIMESTAMP_CHARS = 64;

type AnalyticsScalar = string | number | boolean | null;

function json(body: unknown, status: number, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });
}

function trimmedString(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxChars) return undefined;
  return trimmed;
}

function isAnalyticsProperties(value: unknown): value is Record<string, AnalyticsScalar> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => (
    entry === null || typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean'
  ));
}

function validatePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const body = payload as Record<string, unknown>;
  const type = trimmedString(body.type, 32);
  const path = trimmedString(body.path, MAX_PATH_CHARS);
  const url = trimmedString(body.url, MAX_URL_CHARS);
  const referrer = body.referrer === undefined ? undefined : trimmedString(body.referrer, MAX_URL_CHARS);
  const title = body.title === undefined ? undefined : trimmedString(body.title, MAX_TITLE_CHARS);
  const sentAt = body.sentAt === undefined ? undefined : trimmedString(body.sentAt, MAX_TIMESTAMP_CHARS);

  if (!type || !path || !url) return null;

  if (type === 'pageview') {
    return { type, path, url, referrer, title, sentAt };
  }

  if (type === 'event') {
    const name = trimmedString(body.name, MAX_NAME_CHARS);
    if (!name) return null;
    if (body.properties !== undefined && !isAnalyticsProperties(body.properties)) return null;
    return {
      type,
      name,
      path,
      url,
      referrer,
      title,
      sentAt,
      properties: body.properties,
    };
  }

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAllowedOrigin(request)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const event = validatePayload(payload);
  if (!event) {
    return json({ error: 'Invalid analytics payload' }, 400);
  }

  console.info('[analytics]', JSON.stringify({
    ...event,
    receivedAt: new Date().toISOString(),
  }));

  return json({ ok: true }, 202, { 'cache-control': 'no-store' });
};
