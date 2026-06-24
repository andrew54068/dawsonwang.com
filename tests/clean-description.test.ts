import { test, expect } from 'vitest';
import { cleanDescription } from '../src/lib/seo';

// Mirror the exact five-character HTML attribute escape that BaseLayout applies
// when interpolating a description into a `content="…"` attribute. The whole
// point of issue #166 is that cleanDescription must budget against THIS length,
// not the decoded character count.
function htmlAttributeLength(value: string): number {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;').length;
}

test('cleanDescription passes through short quote-free text unchanged', () => {
  const input = 'A concise summary of the day.';
  expect(cleanDescription(input)).toBe(input);
});

test('cleanDescription collapses internal whitespace', () => {
  expect(cleanDescription('  too   much\n\twhitespace  ')).toBe('too much whitespace');
});

test('cleanDescription truncates long quote-free text within the default budget', () => {
  const input = 'word '.repeat(80).trim(); // 399 chars, no escapeable characters
  const out = cleanDescription(input);
  expect(out.endsWith('…')).toBe(true);
  // Decoded length stays within the default 155 budget (legacy behaviour).
  expect(out.length).toBeLessThanOrEqual(155);
  // HTML-encoded length must also stay within budget (no escapeable chars here,
  // so the two are equal).
  expect(htmlAttributeLength(out)).toBeLessThanOrEqual(155);
});

test('cleanDescription keeps the HTML-encoded length within budget for quote-heavy text (issue #166)', () => {
  // Each `"` inflates by +5 when escaped (&quot;). A decoded-only budget would
  // let this blow past the SERP ~160-char ceiling once rendered into HTML.
  const input = `He said "yes" and "no" and "maybe" then "absolutely" and "never" again `.repeat(4).trim();
  const out = cleanDescription(input);
  // The regression contract: the RENDERED HTML attribute length is bounded by
  // the budget, not the decoded length.
  expect(htmlAttributeLength(out)).toBeLessThanOrEqual(155);
  // And comfortably under the Google SERP ceiling the issue is about.
  expect(htmlAttributeLength(out)).toBeLessThanOrEqual(160);
});

test('cleanDescription respects a custom maxLength as an HTML-encoded ceiling', () => {
  const input = `Quote "alpha" "beta" "gamma" "delta" "epsilon" "zeta" "eta" "theta" `.repeat(3).trim();
  const out = cleanDescription(input, 120);
  expect(htmlAttributeLength(out)).toBeLessThanOrEqual(120);
});

test('cleanDescription does not leave dangling punctuation before the ellipsis', () => {
  // Comma-separated list well over the 155-char budget so truncation triggers.
  const input = 'one, two, three, four, five, six, seven, eight, nine, ten, '.repeat(6).trim();
  const out = cleanDescription(input);
  expect(out.length).toBeGreaterThan(50); // sanity: truncation actually happened
  expect(out.endsWith('…')).toBe(true);
  expect(out).not.toMatch(/[，。、,;；:\s]…$/u);
});
