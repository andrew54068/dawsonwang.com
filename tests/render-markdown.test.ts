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

// Day 219: source.md embeds photos as ![](./attachments/photo.jpeg). Rendered
// verbatim, the browser resolves that relative to /day/219 and 404s. Slides
// already ship absolute (/content/dayNNN/slides/…); markdown images must too.
const srcs = (html: string) => [...html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map(m => m[1]);

test('rewrites ./attachments/ image src to an absolute content path', () => {
  const html = renderMarkdown('![合照](./attachments/photo.jpeg)', { dayNumber: 219 });
  expect(srcs(html)).toEqual(['/content/day219/attachments/photo.jpeg']);
});

test('rewrites attachments/ without the leading ./', () => {
  const html = renderMarkdown('![x](attachments/photo.jpeg)', { dayNumber: 219 });
  expect(srcs(html)).toEqual(['/content/day219/attachments/photo.jpeg']);
});

test('pads the day number the same way slides do', () => {
  const html = renderMarkdown('![x](./attachments/a.png)', { dayNumber: 3 });
  expect(srcs(html)).toEqual(['/content/day03/attachments/a.png']);
});

test('leaves absolute and remote image srcs alone', () => {
  const html = renderMarkdown(
    '![a](https://cdn.example/a.png)\n\n![b](/content/day01/slides/x.png)',
    { dayNumber: 219 },
  );
  expect(srcs(html)).toEqual(['https://cdn.example/a.png', '/content/day01/slides/x.png']);
});

test('leaves relative images untouched when no day number is given', () => {
  const html = renderMarkdown('![x](./attachments/photo.jpeg)');
  expect(srcs(html)).toEqual(['./attachments/photo.jpeg']);
});

test('preserves alt text while rewriting', () => {
  const html = renderMarkdown('![兩天工作坊結束後](./attachments/p.jpeg)', { dayNumber: 219 });
  expect(html).toContain('alt="兩天工作坊結束後"');
});

// The src rewrite must not cost marked's own escaping: a hand-rolled
// `<img src="${src}" alt="${text}">` let a quote in the alt close the attribute
// and open a live event handler on the day page.
test('escapes a double quote in alt instead of closing the attribute', () => {
  const html = renderMarkdown('![alt" onerror="alert(1)](./attachments/x.png)', { dayNumber: 219 });
  expect(html).not.toContain('onerror="alert(1)"');
  expect(html).toContain('alt="alt&quot; onerror=&quot;alert(1)"');
});

test('escapes HTML metacharacters in alt', () => {
  const html = renderMarkdown('![a & b <c>](./attachments/x.png)', { dayNumber: 219 });
  expect(html).toContain('alt="a &amp; b &lt;c&gt;"');
});

test('escapes a double quote in the image title', () => {
  const html = renderMarkdown('![x](./attachments/x.png "a \\"title\\"")', { dayNumber: 219 });
  expect(html).toContain('title="a &quot;title&quot;"');
});

test('URL-encodes a space in the rewritten image src', () => {
  const html = renderMarkdown('![x](<./attachments/a b.png>)', { dayNumber: 219 });
  expect(srcs(html)).toEqual(['/content/day219/attachments/a%20b.png']);
});

// The day page always calls with a dayNumber, so the scoped instance MUST keep
// the CJK-boundary url tokenizer — otherwise the fullwidth-paren autolink bug
// silently comes back on every day page while the plain path stays green.
test('keeps the CJK URL boundary fix when a dayNumber is passed', () => {
  const html = renderMarkdown('介紹過：https://dawsonwang.com/day/141）測完', { dayNumber: 219 });
  expect(hrefs(html)).toEqual(['https://dawsonwang.com/day/141']);
});

test('keeps GFM tables when a dayNumber is passed', () => {
  const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |', { dayNumber: 219 });
  expect(html).toContain('<table>');
});

// Regression: the url tokenizer returns false for text with no URL, falling
// through to marked's default. A per-call Marked clone lost the tokenizer's
// rules binding and threw "Cannot read properties of undefined (reading
// 'inline')" — but only on this fallback path, which no dayNumber test hit.
test('renders plain CJK prose with a dayNumber (url tokenizer fallback path)', () => {
  const html = renderMarkdown('這是一段沒有網址的中文內容。', { dayNumber: 1 });
  expect(html).toContain('這是一段沒有網址的中文內容。');
});

test('renders an email autolink with a dayNumber without throwing', () => {
  expect(() => renderMarkdown('寫信給 me@example.com 謝謝', { dayNumber: 1 })).not.toThrow();
});
