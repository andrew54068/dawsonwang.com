import type { AnalyticsConfig, AnalyticsEventProperties } from './analytics';

export interface AnalyticsApi {
  pageview(path?: string): void;
  event(name: string, properties?: AnalyticsEventProperties): void;
}

export interface AnalyticsApiDependencies {
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  navigatorImpl?: Pick<Navigator, 'sendBeacon'>;
  path: string;
  href: string;
  referrer: string;
  title: string;
  vercelDispatch?: (event: 'event' | 'pageview', properties?: unknown) => void;
}

declare global {
  interface Window {
    dwAnalytics?: AnalyticsApi;
    va?: (event: 'beforeSend' | 'event' | 'pageview', properties?: unknown) => void;
  }
}

function sanitizeProperties(properties?: AnalyticsEventProperties): AnalyticsEventProperties | undefined {
  if (!properties) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ))
  ) as AnalyticsEventProperties;

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function postJson(
  endpoint: string,
  body: Record<string, unknown>,
  deps: Pick<AnalyticsApiDependencies, 'fetchImpl' | 'navigatorImpl'>
) {
  const payload = JSON.stringify(body);

  try {
    if (deps.navigatorImpl?.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (deps.navigatorImpl.sendBeacon(endpoint, blob)) return;
    }
  } catch {
    // Fall through to fetch keepalive.
  }

  void deps.fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

function absoluteUrl(path: string, href: string) {
  try {
    return new URL(path, href).toString();
  } catch {
    return href;
  }
}

export function createAnalyticsApi(
  config: AnalyticsConfig,
  deps: AnalyticsApiDependencies
): AnalyticsApi {
  return {
    pageview(path = deps.path) {
      if (!config.enabled) return;

      if (config.provider === 'vercel') {
        deps.vercelDispatch?.('pageview', { route: path, path });
        return;
      }

      if (config.provider === 'self-hosted' && config.endpoint) {
        postJson(config.endpoint, {
          type: 'pageview',
          path,
          url: absoluteUrl(path, deps.href),
          referrer: deps.referrer || undefined,
          title: deps.title || undefined,
          sentAt: new Date().toISOString(),
        }, deps);
      }
    },

    event(name, properties) {
      const trimmedName = name.trim();
      if (!trimmedName || !config.enabled) return;

      const sanitizedProperties = sanitizeProperties(properties);

      if (config.provider === 'vercel') {
        deps.vercelDispatch?.('event', sanitizedProperties
          ? { name: trimmedName, data: sanitizedProperties }
          : { name: trimmedName });
        return;
      }

      if (config.provider === 'self-hosted' && config.endpoint) {
        postJson(config.endpoint, {
          type: 'event',
          name: trimmedName,
          path: deps.path,
          url: deps.href,
          referrer: deps.referrer || undefined,
          title: deps.title || undefined,
          properties: sanitizedProperties,
          sentAt: new Date().toISOString(),
        }, deps);
      }
    },
  };
}

export function installAnalytics(
  config: AnalyticsConfig,
  targetWindow: Window = window,
  targetDocument: Document = document
): AnalyticsApi {
  const path = `${targetWindow.location.pathname}${targetWindow.location.search}` || '/';
  const api = createAnalyticsApi(config, {
    fetchImpl: targetWindow.fetch.bind(targetWindow),
    navigatorImpl: targetWindow.navigator,
    path,
    href: targetWindow.location.href,
    referrer: targetDocument.referrer,
    title: targetDocument.title,
    vercelDispatch: targetWindow.va?.bind(targetWindow) as AnalyticsApiDependencies['vercelDispatch'],
  });

  targetWindow.dwAnalytics = api;

  if (config.autoTrackPageviews) {
    api.pageview(path);
  }

  return api;
}

export function trackPageview(path?: string) {
  window.dwAnalytics?.pageview(path);
}

export function trackEvent(name: string, properties?: AnalyticsEventProperties) {
  window.dwAnalytics?.event(name, properties);
}
