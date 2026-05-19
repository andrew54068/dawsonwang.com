import { test, expect, describe } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const vercelJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
);

function getHeader(name: string): string {
  const rule = vercelJson.headers?.find((h: any) => h.source === '/(.*)');
  if (!rule) throw new Error('vercel.json is missing the /(.*) headers rule');
  const header = rule.headers.find((h: any) => h.key.toLowerCase() === name.toLowerCase());
  if (!header) throw new Error(`vercel.json is missing the ${name} header`);
  return header.value as string;
}

function parseCsp(value: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const directive of value.split(';')) {
    const parts = directive.trim().split(/\s+/);
    if (!parts[0]) continue;
    out[parts[0]] = parts.slice(1);
  }
  return out;
}

describe('vercel.json Content-Security-Policy', () => {
  const csp = parseCsp(getHeader('Content-Security-Policy'));

  // Regression guard: pagefind (keyword search) needs WebAssembly. A strict CSP
  // without this token blocks WebAssembly.instantiate and breaks /search with
  // "Failed to load the Pagefind WASM" / "invalid gzip data".
  test("script-src allows WebAssembly via 'wasm-unsafe-eval'", () => {
    expect(csp['script-src']).toContain("'wasm-unsafe-eval'");
  });

  // Hardening guard: don't let someone "fix" WASM by reintroducing the broader
  // 'unsafe-eval' (which also re-enables JS eval()) or by opening to wildcards.
  test('script-src keeps its hardening intent', () => {
    const scriptSrc = csp['script-src'] ?? [];
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain('*');
    expect(scriptSrc.some((s) => s.startsWith('http:') || s === 'data:')).toBe(false);
  });

  test('frame-ancestors / object-src / base-uri stay locked down', () => {
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
  });
});

describe('vercel.json other security headers', () => {
  test('X-Frame-Options is DENY', () => {
    expect(getHeader('X-Frame-Options')).toBe('DENY');
  });

  test('X-Content-Type-Options is nosniff', () => {
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff');
  });

  test('Referrer-Policy is strict-origin-when-cross-origin', () => {
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  test('Permissions-Policy disables sensitive sensors and FLoC', () => {
    const v = getHeader('Permissions-Policy');
    for (const feature of ['camera', 'geolocation', 'microphone', 'payment', 'interest-cohort']) {
      expect(v).toMatch(new RegExp(`${feature}=\\(\\)`));
    }
  });
});
