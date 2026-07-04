import { test, expect, describe } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  toBuildOutputSrc,
  headerRouteFrom,
  mergeVercelHeadersIntoConfig,
  type VercelHeaderRule,
} from '../scripts/lib/merge-output-headers';

const vercelJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
);

const CSP_RULE: VercelHeaderRule = {
  source: '/(.*)',
  headers: [
    { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'" },
    { key: 'X-Frame-Options', value: 'DENY' },
  ],
};

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
    expect(r.headers['X-Frame-Options']).toBe('DENY');
    expect(r.headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
  });
});

describe('mergeVercelHeadersIntoConfig', () => {
  const baseConfig = () => ({
    version: 3,
    routes: [{ handle: 'filesystem' }, { src: '/.*', dest: '/_render' }],
  });

  test('prepends a header route, preserves existing routes', () => {
    const { config, added } = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, baseConfig());
    expect(added).toBe(1);
    expect(config.routes[0].headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
    expect(config.routes[0].continue).toBe(true);
    // existing routes stay, in order, after the injected header route
    expect(config.routes[1]).toEqual({ handle: 'filesystem' });
    expect(config.routes[2]).toEqual({ src: '/.*', dest: '/_render' });
  });

  test('is idempotent — merging twice adds nothing the second time', () => {
    const first = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, baseConfig());
    const second = mergeVercelHeadersIntoConfig({ headers: [CSP_RULE] }, first.config);
    expect(second.added).toBe(0);
    expect(second.config.routes.filter((r: any) => r.headers).length).toBe(1);
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
    expect(config.routes[0].headers['X-Frame-Options']).toBe('DENY');
  });

  test('carries the REAL vercel.json CSP into the build output config', () => {
    const { config, added } = mergeVercelHeadersIntoConfig(vercelJson, baseConfig());
    expect(added).toBeGreaterThanOrEqual(1);
    const headerRoute = config.routes.find((r: any) => r.headers?.['Content-Security-Policy']);
    expect(headerRoute).toBeTruthy();
    expect(headerRoute.headers['Content-Security-Policy']).toContain("'wasm-unsafe-eval'");
    expect(headerRoute.headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headerRoute.headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
