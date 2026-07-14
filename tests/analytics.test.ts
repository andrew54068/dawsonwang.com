import { describe, expect, test, vi } from 'vitest';
import { createAnalyticsApi, installAnalytics } from '../src/lib/analytics-client';
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
  const populatedAttribution = {
    attribution_first_source: 'qr',
    attribution_first_medium: 'offline',
    attribution_first_campaign: '2026-talk',
    attribution_first_content: 'slide-cta',
    attribution_last_source: 'threads',
    attribution_last_medium: 'social',
    attribution_last_campaign: 'profile',
    attribution_last_content: 'bio',
  };

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

  test('vercel provider never sends more than two custom event properties', () => {
    const vercelDispatch = vi.fn();
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), {
      fetchImpl: vi.fn(),
      navigatorImpl: undefined,
      path: '/links',
      href: 'https://dawsonwang.com/links',
      referrer: '',
      title: 'Links',
      attribution: populatedAttribution,
      vercelDispatch,
    });

    api.event('cta_click', { source: 'hero', ordinal: 1, extra: 'ignored' });

    const payload = vercelDispatch.mock.calls[0]?.[1] as { data?: Record<string, unknown> };
    expect(Object.keys(payload.data ?? {})).toHaveLength(2);
  });

  test('vercel link_click keeps exactly the required link contract', () => {
    const vercelDispatch = vi.fn();
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), {
      fetchImpl: vi.fn(),
      navigatorImpl: undefined,
      path: '/links',
      href: 'https://dawsonwang.com/links',
      referrer: '',
      title: 'Links',
      attribution: populatedAttribution,
      vercelDispatch,
    });

    api.event('link_click', {
      link_id: 'threads',
      placement: 'links_page',
      source: 'extra-field-that-must-not-be-sent',
    });

    expect(vercelDispatch).toHaveBeenCalledWith('event', {
      name: 'link_click',
      data: {
        link_id: 'threads',
        placement: 'links_page',
      },
    });
  });

  test('vercel inquiry_submit uses compact attribution and omits placement', () => {
    const vercelDispatch = vi.fn();
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), {
      fetchImpl: vi.fn(),
      navigatorImpl: undefined,
      path: '/',
      href: 'https://dawsonwang.com/',
      referrer: '',
      title: 'Home',
      attribution: populatedAttribution,
      vercelDispatch,
    });

    api.event('inquiry_submit', {
      placement: 'homepage_inquiry',
      name: 'Person Example',
    });

    expect(vercelDispatch).toHaveBeenCalledWith('event', {
      name: 'inquiry_submit',
      data: {
        utm_source: 'threads',
        utm_content: 'bio',
      },
    });
    const payload = vercelDispatch.mock.calls[0]?.[1] as { data?: Record<string, unknown> };
    expect(Object.keys(payload.data ?? {})).toHaveLength(2);
  });

  test('vercel custom event values are capped at 255 characters', () => {
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

    api.event('cta_click', { source: 'x'.repeat(300) });

    const payload = vercelDispatch.mock.calls[0]?.[1] as { data?: Record<string, string> };
    expect(payload.data?.source).toHaveLength(255);
  });

  test('merges attribution into self-hosted pageviews and custom events', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const api = createAnalyticsApi(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'self-hosted' }), {
      fetchImpl: fetchMock,
      navigatorImpl: undefined,
      path: '/links?utm_source=qr',
      href: 'https://dawsonwang.com/links?utm_source=qr',
      referrer: '',
      title: 'Links | Dawson Wang',
      attribution: { attribution_first_source: 'qr' },
    });

    api.pageview();
    api.event('link_click', { link_id: 'threads' });

    const pageviewBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const eventBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(pageviewBody.properties).toEqual({ attribution_first_source: 'qr' });
    expect(eventBody.properties).toEqual({
      attribution_first_source: 'qr',
      link_id: 'threads',
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

describe('installAnalytics', () => {
  function fakeEnvironment() {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const va = vi.fn();
    const targetWindow = {
      location: {
        pathname: '/search',
        search: '?q=agent',
        href: 'https://dawsonwang.com/search?q=agent',
      },
      fetch: fetchMock,
      // No sendBeacon so the API takes the fetch keepalive path.
      navigator: {},
      va,
    } as unknown as Window;
    const targetDocument = {
      referrer: 'https://google.com/',
      title: 'Search | Dawson Wang',
    } as unknown as Document;
    return { targetWindow, targetDocument, fetchMock, va };
  }

  test('self-hosted registers window.dwAnalytics and auto-fires a pageview to the endpoint', () => {
    const { targetWindow, targetDocument, fetchMock } = fakeEnvironment();
    const config = resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'self-hosted' });

    const api = installAnalytics(config, targetWindow, targetDocument);

    expect(targetWindow.dwAnalytics).toBe(api);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/analytics');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      type: 'pageview',
      path: '/search?q=agent',
      url: 'https://dawsonwang.com/search?q=agent',
      referrer: 'https://google.com/',
      title: 'Search | Dawson Wang',
    });
  });

  test('vercel registers dwAnalytics but does not auto-fire (the Analytics component owns the load pageview)', () => {
    const { targetWindow, targetDocument, fetchMock, va } = fakeEnvironment();
    const config = resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' });

    installAnalytics(config, targetWindow, targetDocument);

    expect(targetWindow.dwAnalytics).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(va).not.toHaveBeenCalled();
  });

  test('emits one compact landing attribution event for a tagged Vercel visit', () => {
    const { targetWindow, targetDocument, va } = fakeEnvironment();
    targetWindow.location.search = '?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta';
    targetWindow.location.href = 'https://dawsonwang.com/links?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta';

    installAnalytics(resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'vercel' }), targetWindow, targetDocument);

    expect(va).toHaveBeenCalledWith('event', {
      name: 'landing_attribution',
      data: {
        utm_source: 'qr',
        utm_content: 'slide-cta',
      },
    });
    const payload = va.mock.calls[0]?.[1] as { data?: Record<string, unknown> };
    expect(Object.keys(payload.data ?? {})).toHaveLength(2);
  });

  test('none registers a no-op api and sends nothing on load', () => {
    const { targetWindow, targetDocument, fetchMock, va } = fakeEnvironment();
    const config = resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'none' });

    const api = installAnalytics(config, targetWindow, targetDocument);
    api.pageview();
    api.event('cta_click', { source: 'hero' });

    expect(targetWindow.dwAnalytics).toBe(api);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(va).not.toHaveBeenCalled();
  });

  test('none provider does not capture tagged attribution or touch session storage', () => {
    const { targetWindow, targetDocument, fetchMock, va } = fakeEnvironment();
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    const sessionStorageGetter = vi.fn(() => storage);
    Object.defineProperty(targetWindow, 'sessionStorage', {
      configurable: true,
      get: sessionStorageGetter,
    });
    targetWindow.location.search = '?utm_source=qr&utm_medium=offline';
    targetWindow.location.href = 'https://dawsonwang.com/links?utm_source=qr&utm_medium=offline';

    const api = installAnalytics(
      resolveAnalyticsConfig({ PUBLIC_ANALYTICS_PROVIDER: 'none' }),
      targetWindow,
      targetDocument,
    );
    api.pageview();
    api.event('cta_click', { source: 'hero' });

    expect(targetWindow.dwAnalytics).toBe(api);
    expect(sessionStorageGetter).not.toHaveBeenCalled();
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(va).not.toHaveBeenCalled();
  });
});
