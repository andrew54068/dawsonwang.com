import type { AnalyticsConfig, AnalyticsEventProperties } from './analytics';
import { captureAttribution, toAnalyticsProperties } from './analytics-attribution';

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
  attribution?: Record<string, string>;
  vercelDispatch?: (event: 'event' | 'pageview', properties?: unknown) => void;
}

declare global {
  interface Window {
    dwAnalytics?: AnalyticsApi;
    va?: (event: 'beforeSend' | 'event' | 'pageview', properties?: unknown) => void;
  }
}

const VERCEL_MAX_CUSTOM_PROPERTIES = 2;
const VERCEL_MAX_CUSTOM_LENGTH = 255;

function sanitizeProperties(properties?: AnalyticsEventProperties): AnalyticsEventProperties | undefined {
  if (!properties) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ))
  ) as AnalyticsEventProperties;

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeVercelValue(
  value: AnalyticsEventProperties[string] | undefined
): AnalyticsEventProperties[string] | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.slice(0, VERCEL_MAX_CUSTOM_LENGTH);
  return value;
}

function compactVercelProperties(
  pairs: Array<[string, AnalyticsEventProperties[string] | undefined]>
): AnalyticsEventProperties | undefined {
  const compacted: AnalyticsEventProperties = {};

  for (const [rawKey, rawValue] of pairs) {
    if (Object.keys(compacted).length >= VERCEL_MAX_CUSTOM_PROPERTIES) break;

    const key = rawKey.slice(0, VERCEL_MAX_CUSTOM_LENGTH);
    const value = sanitizeVercelValue(rawValue);
    if (!key || value === undefined) continue;

    compacted[key] = value;
  }

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function compactVercelAttribution(
  attribution?: Record<string, string>
): AnalyticsEventProperties | undefined {
  return compactVercelProperties([
    ['utm_source', attribution?.attribution_last_source ?? attribution?.attribution_first_source],
    ['utm_content', attribution?.attribution_last_content ?? attribution?.attribution_first_content],
  ]);
}

function vercelEventData(
  name: string,
  properties: AnalyticsEventProperties | undefined,
  attribution?: Record<string, string>,
): AnalyticsEventProperties | undefined {
  const sanitizedProperties = sanitizeProperties(properties);

  if (name === 'link_click') {
    return compactVercelProperties([
      ['link_id', sanitizedProperties?.link_id],
      ['placement', sanitizedProperties?.placement],
    ]);
  }

  if (name === 'landing_attribution' || name === 'inquiry_submit') {
    return compactVercelAttribution(attribution);
  }

  const pairs = Object.entries(sanitizedProperties ?? {});
  if (pairs.length < VERCEL_MAX_CUSTOM_PROPERTIES) {
    pairs.push(...Object.entries(compactVercelAttribution(attribution) ?? {}));
  }

  return compactVercelProperties(pairs);
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
  const withAttribution = (properties?: AnalyticsEventProperties) => (
    sanitizeProperties({ ...deps.attribution, ...properties })
  );

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
          properties: withAttribution(),
          sentAt: new Date().toISOString(),
        }, deps);
      }
    },

    event(name, properties) {
      const trimmedName = name.trim();
      if (!trimmedName || !config.enabled) return;

      if (config.provider === 'vercel') {
        const data = vercelEventData(trimmedName, properties, deps.attribution);
        const vercelName = trimmedName.slice(0, VERCEL_MAX_CUSTOM_LENGTH);
        deps.vercelDispatch?.('event', data
          ? { name: vercelName, data }
          : { name: vercelName });
        return;
      }

      const sanitizedProperties = withAttribution(properties);

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
  const captured = config.enabled
    ? captureAttribution(targetWindow.location.search, (() => {
      try {
        return targetWindow.sessionStorage;
      } catch {
        return undefined;
      }
    })())
    : { state: { firstTouch: {}, lastTouch: {} }, hasIncoming: false };
  const attribution = config.enabled ? toAnalyticsProperties(captured.state) : undefined;
  const api = createAnalyticsApi(config, {
    fetchImpl: targetWindow.fetch.bind(targetWindow),
    navigatorImpl: targetWindow.navigator,
    path,
    href: targetWindow.location.href,
    referrer: targetDocument.referrer,
    title: targetDocument.title,
    attribution,
    vercelDispatch: targetWindow.va?.bind(targetWindow) as AnalyticsApiDependencies['vercelDispatch'],
  });

  targetWindow.dwAnalytics = api;

  if (config.provider === 'vercel' && captured.hasIncoming) {
    api.event('landing_attribution');
  }

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
