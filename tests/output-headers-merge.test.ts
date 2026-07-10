import { test, expect, describe } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  toBuildOutputSrc,
  headerRouteFrom,
  mergeVercelHeadersIntoConfig,
  type VercelHeaderRule,
  type VercelJson,
  type BuildOutputConfig,
  type BuildOutputRoute,
} from '../scripts/lib/merge-output-headers';

const vercelJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
) as VercelJson;

const CSP_RULE: VercelHeaderRule = {
  source: '/(.*)',
  headers: [
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'" },
    { key: 'X-Frame-Options', value: 'DENY' },
  ],
};

// `BuildOutputConfig.routes` and `BuildOutputRoute.headers` are optional; these
// narrow them with a loud failure so strict null checks stay happy in assertions.
function routesOf(config: BuildOutputConfig): BuildOutputRoute[] {
  const { routes } = config;
  if (!routes) throw new Error('expected config.routes to be defined');
  return routes;
}

function headersOf(route: BuildOutputRoute | undefined): Record<string, string> {
  const headers = route?.headers;
  if (!headers) throw new Error('expected route.headers to be defined');
  return headers;
}

describe('toBuildOutputSrc', () => {
  test('anchors a path-to-regexp catch-all', () => {
    expect(toBuildOutputSrc('/(.*)')).toBe('^/(.*)$');
  });
  test('leaves an already-anchored src unchanged', () => {
    expect(toBuildOutputSrc('^/blog/(.*)$')).toBe('^/blog/(.*)$');
  });
});

describe('headerRouteFrom', () => {
  test('flattens key/value pairs and sets continue:true', () => {
    const r = headerRouteFrom(CSP_RULE);
    expect(r.src).toBe('^/(.*)$');
    expect(r.continue).toBe(true);
    const headers = headersOf(r);
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
  });
});

describe('mergeVercelHeadersIntoConfig', () => {
  const baseConfig = (): BuildOutputConfig => ({
    version: 3,
    routes: [{ handle: 'filesystem' }, { src: '/.*', dest: '/_render' }],
  });

  test('prepends a header route, preserves existing routes', () => {
    const { config, added } = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, baseConfig());
    expect(added).toBe(1);
    const routes = routesOf(config);
    expect(headersOf(routes[0])['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
    expect(routes[0].continue).toBe(true);
    // existing routes stay, in order, after the injected header route
    expect(routes[1]).toEqual({ handle: 'filesystem' });
    expect(routes[2]).toEqual({ src: '/.*', dest: '/_render' });
  });

  test('is idempotent — merging twice adds nothing the second time', () => {
    const first = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, baseConfig());
    const second = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, first.config);
    expect(second.added).toBe(0);
    expect(routesOf(second.config).filter((r) => r.headers).length).toBe(1);
  });

  test('no header rules → config untouched', () => {
    const cfg = baseConfig();
    const { config, added } = mergeVercelHeadersIntoConfig({}, cfg);
    expect(added).toBe(0);
    expect(config.routes).toEqual(cfg.routes);
  });

  test('handles a config that has no routes array', () => {
    const { config, added } = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, { version: 3 });
    expect(added).toBe(1);
    expect(headersOf(routesOf(config)[0])['X-Frame-Options']).toBe('DENY');
  });

  test('carries the REAL vercel.json CSP into the build output config', () => {
    const { config, added } = mergeVercelHeadersIntoConfig(vercelJson, baseConfig());
    expect(added).toBeGreaterThanOrEqual(1);
    const headerRoute = routesOf(config).find((r) => r.headers?.['Content-Security-Policy']);
    expect(headerRoute).toBeTruthy();
    const headers = headersOf(headerRoute);
    expect(headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
