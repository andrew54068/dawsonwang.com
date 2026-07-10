import { test, expect } from 'vitest';
import {
  isValidInquiryEmail,
  inquiryErrorMessage,
} from '../src/lib/inquiry-client';
import { InquirySchema } from '../src/lib/inquiry-schema';

const base = {
  name: '王小明',
  company: 'Acme Co',
  goal: '想把客服流程串 AI',
  team_size: '6-30',
  budget: '300k-800k',
  timeline: 'this_quarter',
  hp_field: '',
};
const serverAccepts = (email: string) =>
  InquirySchema.safeParse({ ...base, email }).success;

// The core regression guard. The client's submit-button gate and the server's
// schema MUST agree on every address — otherwise a "valid-looking" email slips
// past the button and bounces off the API (the bug that produced the bare
// "Invalid payload" page, originally triggered by `a@b.c`). Tested on RAW,
// untrimmed inputs so a trim mismatch between the two sides is caught.
test('client email gate agrees with the server schema on every case', () => {
  const cases = [
    'a@b.co',
    'a@b.c', // single-char TLD — the original report
    'a@b', // no TLD
    '', // empty
    '   ', // whitespace only
    ' a@b.co ', // surrounding whitespace
    'a@b.co ',
    ' a@b.co',
    'mr.wang@example.com',
    'x@y.io',
    'no-at-sign',
    'a@@b.com',
    'user@sub.example.com',
    'a@b.c.d', // trailing single-char TLD
    'A@B.CO', // uppercase
    'a@b.toolongbutfine',
    `${'a'.repeat(250)}@example.com`, // 262 chars: pattern-valid but over the length cap
  ];
  for (const email of cases) {
    expect(
      isValidInquiryEmail(email),
      `client/server disagree on ${JSON.stringify(email)}`,
    ).toBe(serverAccepts(email));
  }
});

test('rejects a pattern-valid address that exceeds the length cap, on both sides', () => {
  // RFC 5321 caps addresses at 254 chars; the regex alone would accept this.
  const tooLong = `${'a'.repeat(250)}@example.com`;
  expect(tooLong.length).toBeGreaterThan(254);
  expect(isValidInquiryEmail(tooLong)).toBe(false);
  expect(serverAccepts(tooLong)).toBe(false);
});

test('rejects the single-character TLD from the original report', () => {
  expect(isValidInquiryEmail('a@b.c')).toBe(false);
  expect(serverAccepts('a@b.c')).toBe(false);
});

test('accepts a normal address', () => {
  expect(isValidInquiryEmail('dawson@example.com')).toBe(true);
});

test('tolerates surrounding whitespace on both sides', () => {
  expect(isValidInquiryEmail('  dawson@example.com  ')).toBe(true);
  expect(serverAccepts('  dawson@example.com  ')).toBe(true);
});

// The submission-outcome mapping: success must be recognised (so the form never
// navigates to the 303 redirect page) and every failure must produce an inline
// message (so the raw "Invalid payload" body is never shown).
test('treats the success 303 (fetch opaqueredirect) as success', () => {
  expect(inquiryErrorMessage({ type: 'opaqueredirect', ok: false, status: 0 })).toBeNull();
});

test('treats a followed 2xx as success', () => {
  expect(inquiryErrorMessage({ type: 'basic', ok: true, status: 200 })).toBeNull();
});

test('maps rate limiting (429) to a specific message', () => {
  expect(inquiryErrorMessage({ type: 'basic', ok: false, status: 429 })).toMatch(/頻繁/);
});

test('maps every other failure to a non-empty inline message, never the raw body', () => {
  for (const status of [400, 403, 413, 500]) {
    const message = inquiryErrorMessage({ type: 'basic', ok: false, status });
    expect(message, `status ${status}`).toBeTruthy();
    expect(message).not.toMatch(/Invalid payload/);
  }
});
