import { describe, expect, test, vi } from 'vitest';
import { createAnalyticsApi } from '../src/lib/analytics-client';
import { resolveAnalyticsConfig } from '../src/lib/analytics';

describe('resolveAnalyticsConfig', () => {
  test('defaults to optional Vercel analytics with speed insights enabled', () => {
    expect(resolveAnalyticsConfig({})).toEqual({
      provider: 'vercel',
      enabled: true,
      endpoint: null,
      enableSpeedInsights: true,
      autoTrackPageviews: false,
    });
  });

  test('supports a self-hosted endpoint provider', () => {
    expect(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'self-hosted' })).toEqual({
      provider: 'self-hosted',
      enabled: true,
      endpoint: '/api/analytics',
      enableSpeedInsights: false,
      autoTrackPageviews: true,
    });

    expect(
      resolveAnalyticsConfig({
        PUBLIC_ANALYTICS_PROVIDER: 'self-hosted',
        PUBLIC_ANALYTICS_ENDPOINT: 'https://stats.example.com/collect',
      })
    ).toMatchObject({ endpoint: 'https://stats.example.com/collect' });
  });

  test('supports a disabled no-provider mode', () => {
    expect(
      resolveAnalyticsConfig({
        PUBLIC_ANALYTICS_PROVIDER: 'none',
        PUBLIC_VERCEL_SPEED_INSIGHTS: 'false',
      })
    ).toEqual({
      provider: 'none',
      enabled: false,
      endpoint: null,
      enableSpeedInsights: false,
      autoTrackPageviews: false,
    });
  });
});

describe('createAnalyticsApi', () => {
  test('self-hosted provider posts pageviews to the configured endpoint', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'self-hosted' }), {
      fetchImpl: fetchMock,
      navigatorImpl: undefined,
      path: '/search?q=agent',
      href: 'https://dawsonwang.com/search?q=agent',
      referrer: 'https://google.com/',
      title: 'Search | Dawson Wang',
      vercelDispatch: vi.fn(),
    });

    api.pageview();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/analytics');
    expect(init).toMatchObject({
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    });

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      type: 'pageview',
      path: '/search?q=agent',
      url: 'https://dawsonwang.com/search?q=agent',
      referrer: 'https://google.com/',
      title: 'Search | Dawson Wang',
    });
  });

  test('vercel provider proxies custom events into window.va semantics', () => {
    const vercelDispatch = vi.fn();
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), {
      fetchImpl: vi.fn(),
      navigatorImpl: undefined,
      path: '/',
      href: 'https://dawsonwang.com/',
      referrer: '',
      title: 'Home',
      vercelDispatch,
    });

    api.event('cta_click', { source: 'hero', ordinal: 1 });

    expect(vercelDispatch).toHaveBeenCalledWith('event', {
      name: 'cta_click',
      data: { source: 'hero', ordinal: 1 },
    });
  });

  test('none provider is a no-op for pageviews and events', () => {
    const fetchMock = vi.fn();
    const vercelDispatch = vi.fn();
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'none' }), {
      fetchImpl: fetchMock,
      navigatorImpl: undefined,
      path: '/',
      href: 'https://dawsonwang.com/',
      referrer: '',
      title: 'Home',
      vercelDispatch,
    });

    api.pageview();
    api.event('cta_click', { source: 'hero' });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(vercelDispatch).not.toHaveBeenCalled();
  });
});
