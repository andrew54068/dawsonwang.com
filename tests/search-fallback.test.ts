// @ts-nocheck
import { describe, expect, test } from 'vitest';
import {
  normalizeSearchText,
  parseSearchFallbackIndexJson,
  runSearchFallback,
  serializeSearchFallbackIndex,
  type SearchFallbackDoc,
} from '../src/lib/search-fallback';

const docs: SearchFallbackDoc[] = [
  {
    day: 165,
    subtitle: '用不完的訂閱額度拿去舉辦黑客松',
    body: '最近想到一個：自己開一場黑客松，讓幾隊 AI 同時各做各的。',
  },
  {
    day: 60,
    subtitle: 'Claude Code 的記憶管理術',
    body: '這篇提到 Anthropic 黑客松冠軍的 Claude Code 配置與長文心得。',
  },
  {
    day: 40,
    subtitle: '自動化流程設計',
    body: '把 agent workflow 串進日常工作流。',
  },
];

describe('search fallback', () => {
  test('normalizes full-width ASCII while preserving Traditional Chinese characters', () => {
    expect(normalizeSearchText('  ＡＩ　黑客松  ')).toBe('ai 黑客松');
  });

  test('returns the reported 黑客松 article and day/title as the top hit', () => {
    const hits = runSearchFallback(docs, '黑客松');

    expect(hits[0]).toMatchObject({
      day: 165,
      subtitle: '用不完的訂閱額度拿去舉辦黑客松',
      matchSource: 'subtitle+body',
    });
    expect(hits.map((hit) => hit.day)).toContain(60);
  });

  test('ranks subtitle matches above body-only matches', () => {
    const hits = runSearchFallback(docs, '黑客松');
    const subtitleHit = hits.find((hit) => hit.day === 165);
    const bodyOnlyHit = hits.find((hit) => hit.day === 60);

    expect(subtitleHit?.score).toBeGreaterThan(bodyOnlyHit?.score ?? 0);
  });

  test('escapes inline JSON payloads and parses them back safely', () => {
    const json = serializeSearchFallbackIndex([
      {
        day: 1,
        subtitle: 'script safety',
        body: 'contains <script>alert(1)</script> and\n extra whitespace',
      },
    ]);

    expect(json).toContain('\\u003cscript>alert(1)\\u003c/script>');
    expect(json).not.toContain('<script>alert(1)</script>');

    expect(parseSearchFallbackIndexJson(json)).toEqual([
      {
        day: 1,
        subtitle: 'script safety',
        body: 'contains <script>alert(1)</script> and extra whitespace',
      },
    ]);
  });
});
