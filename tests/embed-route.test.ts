import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '../src/pages/api/embed';

const ACCOUNT = 'CF_ACCOUNT_ID';
const TOKEN = 'CF_API_TOKEN';

function embedRequest(query: unknown = '語意'): Request {
  return new Request('https://www.dawsonwang.com/api/embed', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://www.dawsonwang.com' },
    body: JSON.stringify({ query }),
  });
}

async function call(request = embedRequest()): Promise<Response> {
  return POST({ request } as never);
}

describe('POST /api/embed', () => {
  beforeEach(() => {
    delete process.env[ACCOUNT];
    delete process.env[TOKEN];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env[ACCOUNT];
    delete process.env[TOKEN];
  });

  test('embeds the query when credentials come from the runtime environment', async () => {
    // The production shape: nothing was in the environment when the bundle was
    // built; Vercel injects the project's variables into the function instead.
    process.env[ACCOUNT] = 'acct-123';
    process.env[TOKEN] = 'cf-token';
    const fetchMock = vi.fn(async () =>
      Response.json({ success: true, result: { data: [[0.1, 0.2, 0.3]] } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await call();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ vector: [0.1, 0.2, 0.3] });
    expect(res.headers.get('cache-control')).toBe('no-store');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct-123/ai/run/@cf/baai/bge-m3',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer cf-token');
    expect(JSON.parse(init.body as string)).toEqual({ text: ['語意'] });
  });

  test('answers 503 without calling Cloudflare when credentials are missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await call();

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: 'Service unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('treats blank credentials as missing rather than calling Cloudflare unauthenticated', async () => {
    // scripts/deploy-local.ts blanks these for its offline build.
    process.env[ACCOUNT] = '';
    process.env[TOKEN] = '';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await call();

    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('rejects cross-origin callers before touching credentials', async () => {
    process.env[ACCOUNT] = 'acct-123';
    process.env[TOKEN] = 'cf-token';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('https://www.dawsonwang.com/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ query: '語意' }),
    });
    const res = await call(request);

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects empty and oversized queries', async () => {
    process.env[ACCOUNT] = 'acct-123';
    process.env[TOKEN] = 'cf-token';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect((await call(embedRequest('   '))).status).toBe(400);
    expect((await call(embedRequest('字'.repeat(501)))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reports 502 when Cloudflare fails, without leaking upstream detail', async () => {
    process.env[ACCOUNT] = 'acct-123';
    process.env[TOKEN] = 'cf-token';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('account suspended', { status: 429 })),
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await call();

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'Upstream error' });
    errorSpy.mockRestore();
  });
});
