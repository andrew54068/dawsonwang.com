import { test, expect } from 'vitest';
import { isAllowedOrigin, trustedClientIp } from '../src/lib/origin-guard';

function req(headers: Record<string, string>): Request {
  return new Request('https://www.dawsonwang.com/api/x', { method: 'POST', headers });
}

test('allows requests with Origin from the default allowlist', () => {
  expect(isAllowedOrigin(req({ origin: 'https://www.dawsonwang.com' }))).toBe(true);
  expect(isAllowedOrigin(req({ origin: 'https://dawsonwang.com' }))).toBe(true);
});

test('falls back to Referer when Origin is absent', () => {
  expect(isAllowedOrigin(req({ referer: 'https://www.dawsonwang.com/foo' }))).toBe(true);
});

test('rejects unknown origins', () => {
  expect(isAllowedOrigin(req({ origin: 'https://evil.example' }))).toBe(false);
});

test('rejects requests with no Origin or Referer', () => {
  expect(isAllowedOrigin(req({}))).toBe(false);
});

test('rejects malformed origins', () => {
  expect(isAllowedOrigin(req({ origin: 'not a url' }))).toBe(false);
});

test('trustedClientIp prefers clientAddress over headers', () => {
  const r = req({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '5.5.5.5' });
  expect(trustedClientIp('1.1.1.1', r)).toBe('1.1.1.1');
});

test('trustedClientIp falls back to x-real-ip then x-forwarded-for', () => {
  expect(trustedClientIp(undefined, req({ 'x-real-ip': '5.5.5.5' }))).toBe('5.5.5.5');
  expect(trustedClientIp(null, req({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7' }))).toBe('6.6.6.6');
  expect(trustedClientIp(undefined, req({}))).toBe('unknown');
});
