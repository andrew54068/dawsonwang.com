import { test, expect } from 'vitest';
import {
  classifyDay,
  scoreTopics,
  TOPIC_RULES,
  FLOOR,
  MAX_SLUGS,
  type TopicRule,
} from '../scripts/lib/day-topic-classifier';
import { upsertEntries, type DayTags } from '../scripts/categorize-days';
import { TOPICS } from '../src/data/topics';

// --- classifier -------------------------------------------------------------

test('every topic rule targets a slug that exists in the taxonomy', () => {
  const known = new Set(TOPICS.map(t => t.slug));
  const unknown = TOPIC_RULES.map(r => r.slug).filter(s => !known.has(s));
  expect(unknown).toEqual([]);
});

test('every taxonomy topic has a classifier rule, so no topic is unreachable', () => {
  const ruled = new Set(TOPIC_RULES.map(r => r.slug));
  const missing = TOPICS.map(t => t.slug).filter(s => !ruled.has(s));
  expect(missing).toEqual([]);
});

test('classifyDay always returns at least one slug (topics.ts must cover every day)', () => {
  const result = classifyDay('', '完全沒有任何關鍵字的內容');
  expect(result.slugs.length).toBeGreaterThan(0);
  expect(result.lowConfidence).toBe(true);
});

test('classifyDay never returns more than MAX_SLUGS', () => {
  const kitchenSink = [
    'Ollama MLX 量化 本地模型', 'Threads LinkedIn 粉專 演算法 觸及',
    'Puppeteer Playwright CDP RPA 瀏覽器自動化', 'Obsidian RAG 第二大腦 知識庫',
    'token 額度 用量 訂閱 成本', '資安 prompt injection 外洩 沙箱',
  ].join('\n');
  expect(classifyDay('全部都講', kitchenSink).slugs.length).toBeLessThanOrEqual(MAX_SLUGS);
});

test('a title match outweighs a single body mention of a rival topic', () => {
  const scores = scoreTopics('Ollama 本地模型實測', '順帶一提我也有用 Threads 發文');
  expect(scores[0].slug).toBe('local-llm');
});

test('repeated mentions have diminishing returns rather than dominating', () => {
  const once = scoreTopics('', 'Ollama')[0].score;
  const twentyTimes = scoreTopics('', Array(20).fill('Ollama').join(' '))
    .find(s => s.slug === 'local-llm')!.score;
  expect(twentyTimes).toBeLessThan(once * 5);
  expect(twentyTimes).toBeGreaterThan(once);
});

test('damp scales a topic score without reordering its own matches', () => {
  const base: TopicRule[] = [{ slug: 'local-llm', strong: [/Ollama/i], weak: [], damp: 1 }];
  const damped: TopicRule[] = [{ slug: 'local-llm', strong: [/Ollama/i], weak: [], damp: 0.5 }];
  const full = scoreTopics('', 'Ollama', base)[0].score;
  const half = scoreTopics('', 'Ollama', damped)[0].score;
  expect(half).toBeCloseTo(full * 0.5, 5);
});

test('a clearly on-topic day classifies the way the taxonomy intends', () => {
  expect(classifyDay('用 Ollama 在本地跑量化模型', '本地模型 推論 顯卡').slugs).toContain('local-llm');
  expect(classifyDay('資安：prompt injection 怎麼防', '外洩 個資 權限控管').slugs).toContain('security');
  expect(classifyDay('Threads 演算法怎麼算觸及', '粉專 社群經營 互動率').slugs).toContain('social-platforms');
});

test('scoreTopics is deterministic — the committed output must not drift', () => {
  const a = scoreTopics('Claude Code 的 MCP 與 hooks', 'subagent skills harness');
  const b = scoreTopics('Claude Code 的 MCP 與 hooks', 'subagent skills harness');
  expect(a).toEqual(b);
});

test('slugs below FLOOR are dropped even when they matched something', () => {
  const { slugs, scores } = classifyDay('Ollama MLX 量化 本地模型 GGUF', 'Ollama 推論');
  for (const slug of slugs) {
    expect(scores.find(s => s.slug === slug)!.score).toBeGreaterThanOrEqual(FLOOR);
  }
});

// --- topics.ts writer -------------------------------------------------------

const FIXTURE = `export const DAY_TOPICS: Record<number, string[]> = {
  226: ['content-workflow', 'dev-tooling'],
  225: ['dev-tooling', 'cases'],
  100: ['beginner', 'ai-trends'],
};
`;

function tags(day: number, slugs: string[]): DayTags {
  return { day, slugs, scores: [], lowConfidence: false };
}

test('upsertEntries inserts a new day at the top, keeping descending order', () => {
  const { text, added } = upsertEntries(FIXTURE, [tags(227, ['ai-trends', 'cases'])]);
  expect(added).toEqual([227]);
  const days = [...text.matchAll(/^\s*(\d+):/gm)].map(m => Number(m[1]));
  expect(days).toEqual([227, 226, 225, 100]);
  expect(text).toContain(`  227: ['ai-trends', 'cases'],`);
});

test('upsertEntries places a mid-range day in its sorted slot', () => {
  const { text } = upsertEntries(FIXTURE, [tags(150, ['knowledge'])]);
  const days = [...text.matchAll(/^\s*(\d+):/gm)].map(m => Number(m[1]));
  expect(days).toEqual([226, 225, 150, 100]);
});

test('upsertEntries inserts multiple new days in one pass, all sorted', () => {
  const { text, added } = upsertEntries(FIXTURE, [
    tags(227, ['ai-trends']),
    tags(228, ['knowledge']),
    tags(150, ['cases']),
  ]);
  expect(added.sort((a, b) => a - b)).toEqual([150, 227, 228]);
  const days = [...text.matchAll(/^\s*(\d+):/gm)].map(m => Number(m[1]));
  expect(days).toEqual([228, 227, 226, 225, 150, 100]);
});

test('upsertEntries leaves untouched lines byte-identical', () => {
  const { text } = upsertEntries(FIXTURE, [tags(227, ['ai-trends'])]);
  for (const line of FIXTURE.split('\n').filter(Boolean)) {
    expect(text).toContain(line);
  }
});

test('upsertEntries replaces an existing day in place rather than duplicating it', () => {
  const { text, added, replaced } = upsertEntries(FIXTURE, [tags(225, ['knowledge'])]);
  expect(added).toEqual([]);
  expect(replaced).toEqual([225]);
  const days = [...text.matchAll(/^\s*(\d+):/gm)].map(m => Number(m[1]));
  expect(days).toEqual([226, 225, 100]);
  expect(text).toContain(`  225: ['knowledge'],`);
  expect(text).not.toContain(`  225: ['dev-tooling', 'cases'],`);
});

test('upsertEntries reports no change when the entry already matches', () => {
  const { added, replaced } = upsertEntries(FIXTURE, [tags(226, ['content-workflow', 'dev-tooling'])]);
  expect(added).toEqual([]);
  expect(replaced).toEqual([]);
});

test('upsertEntries output still parses as the same map shape', () => {
  const { text } = upsertEntries(FIXTURE, [tags(227, ['ai-trends', 'cases'])]);
  const body = text.slice(text.indexOf('{') + 1, text.lastIndexOf('}'));
  const parsed = Object.fromEntries(
    [...body.matchAll(/(\d+):\s*\[([^\]]*)\]/g)].map(m => [
      Number(m[1]),
      m[2].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean),
    ]),
  );
  expect(parsed[227]).toEqual(['ai-trends', 'cases']);
  expect(parsed[226]).toEqual(['content-workflow', 'dev-tooling']);
});

test('upsertEntries fails loudly on a file it does not recognise', () => {
  expect(() => upsertEntries('const x = 1;\n', [tags(1, ['cases'])])).toThrow(/DAY_TOPICS/);
});
