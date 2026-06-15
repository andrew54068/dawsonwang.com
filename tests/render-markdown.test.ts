import { test, expect } from 'vitest';
import { renderMarkdown } from '../src/lib/render-markdown';

// Regression: GFM bare-URL autolinking (marked) extends a URL until the next
// ASCII whitespace, so a URL written inline in Chinese —
//   「…介紹過：https://dawsonwang.com/day/141）測完最有用…」
// — swallowed the fullwidth ） and the following CJK text into the href
// (rendered as https://dawsonwang.com/day/141%EF%BC%89%E6%B8%AC…). The
// autolink must terminate at the first non-ASCII character instead.

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

test('terminates a bare-URL autolink at a fullwidth closing paren', () => {
  const html = renderMarkdown(
    '我在 Day 141 介紹過：https://dawsonwang.com/day/141）測完最有用的一條結論',
  );
  expect(hrefs(html)).toEqual(['https://dawsonwang.com/day/141']);
  expect(html).not.toContain('%EF%BC%89'); // fullwidth ） must not leak into href
  expect(html).not.toContain('day/141%'); // no trailing CJK percent-encoded in
  expect(html).toContain('）測完最有用的一條結論'); // stays as visible text
});

test('terminates a bare-URL autolink at a CJK char with no punctuation', () => {
  const html = renderMarkdown('見https://example.com/path測試結束');
  expect(hrefs(html)).toEqual(['https://example.com/path']);
  expect(html).not.toContain('%E6'); // no CJK bytes encoded into the href
});

test('leaves a URL followed by ASCII whitespace unchanged (regression guard)', () => {
  const html = renderMarkdown('see https://example.com/x for details');
  expect(hrefs(html)).toEqual(['https://example.com/x']);
});

test('does not touch an explicit [text](url) markdown link', () => {
  const html = renderMarkdown('[Day 141](https://dawsonwang.com/day/141) 測試');
  expect(hrefs(html)).toEqual(['https://dawsonwang.com/day/141']);
  expect(html).toContain('>Day 141</a>');
});

test('bounds two CJK-wrapped URLs in the same paragraph', () => {
  const html = renderMarkdown('甲：https://a.example/1）乙：https://b.example/2）丙');
  expect(hrefs(html)).toEqual(['https://a.example/1', 'https://b.example/2']);
});

test('trims trailing sentence punctuation, leaving it as text', () => {
  const html = renderMarkdown('ref https://example.com/a. next');
  expect(hrefs(html)).toEqual(['https://example.com/a']);
});

test('keeps GFM tables rendering (gfm must stay enabled)', () => {
  const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
  expect(html).toContain('<table>');
});
