import { test, expect } from 'vitest';
import { renderMarkdown } from '../src/lib/render-markdown';

// spec/features/day-sources-line-breaks.feature — Day 290: the sources block after the
// last --- is one "label：url" per line with no blank lines, and marked merged it into one
// paragraph. Lines after the last --- keep their line breaks; the body does not.

const SOURCES = [
  'NVIDIA 新聞稿：https://example.com/a',
  'NVIDIA 開發文件：https://example.com/b',
  'Qwen：https://example.com/c',
].join('\n');

test('each source line after the last --- gets its own line', () => {
  const html = renderMarkdown(`內文。\n\n---\n${SOURCES}\n\n#MSI #NvidiaRTXSpark`);
  const tail = html.slice(html.indexOf('<hr>'));
  expect(tail.match(/<br>/g)).toHaveLength(2);
  for (const line of tail.split('<br>')) {
    expect(line.match(/href=/g)).toHaveLength(1);
  }
  expect(html).toContain('<p>#MSI #NvidiaRTXSpark</p>');
});

test('soft line breaks in the body still merge into one paragraph', () => {
  const html = renderMarkdown(`第一行\n第二行\n\n---\n${SOURCES}`);
  expect(html).toContain('<p>第一行\n第二行</p>');
});

test('a day with no --- renders exactly as before', () => {
  const body = '第一行\n第二行\n\nhttps://example.com/a\nhttps://example.com/b';
  expect(renderMarkdown(body)).not.toContain('<br>');
});
