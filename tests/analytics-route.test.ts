import { afterEach, describe, expect, test, vi } from 'vitest';
import { POST } from '../src/pages/api/analytics';

function buildRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = { origin: 'https://www.dawsonwang.com' }
): Request {
  return new Request('https://www.dawsonwang.com/api/analytics', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analytics', () => {
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

  afterEach(() => {
    infoSpy.mockClear();
  });

  test('accepts same-origin pageview payloads and logs a structured event', async () => {
    const res = await POST({
      request: buildRequest({
        type: 'pageview',
        path: '/search?q=agent',
        url: 'https://dawsonwang.com/search?q=agent',
        referrer: 'https://google.com/',
        title: 'Search | Dawson Wang',
      }),
    } as any);

    expect(res.status).toBe(202);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]?.[0]).toBe('[analytics]');
    expect(String(infoSpy.mock.calls[0]?.[1] ?? '')).toContain('"type":"pageview"');
  });

  test('rejects cross-origin callers', async () => {
    const res = await POST({
      request: buildRequest(
        {
          type: 'pageview',
          path: '/',
          url: 'https://dawsonwang.com/',
        },
        { origin: 'https://evil.example' }
      ),
    } as any);

    expect(res.status).toBe(403);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  test('rejects malformed custom events', async () => {
    const res = await POST({
      request: buildRequest({
        type: 'event',
        name: '',
        path: '/',
        url: 'https://dawsonwang.com/',
      }),
    } as any);

    expect(res.status).toBe(400);
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
