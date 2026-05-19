import { test, expect } from 'vitest';
import { parseSource } from '../src/lib/parse-source';

test('parses title line and body', () => {
  const raw = `Day 42 在工作流中加入 AI

This is the body.

Second paragraph.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(42);
  expect(result.subtitle).toBe('在工作流中加入 AI');
  expect(result.body).toBe('This is the body.\n\nSecond paragraph.');
});

test('handles trailing whitespace', () => {
  const raw = `Day 7 標題\n\nBody.\n`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(7);
  expect(result.body).toBe('Body.');
});

test('throws on malformed first line', () => {
  expect(() => parseSource('Not a day title\n\nBody')).toThrow(/title line/);
});

test('parses legacy heading format with hash prefix', () => {
  const raw = `# Day 1 起步\n\nBody.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(1);
  expect(result.subtitle).toBe('起步');
  expect(result.body).toBe('Body.');
});

test('parses legacy heading format with colon separator', () => {
  const raw = `# Day 22: AI + SDD\n\nBody.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(22);
  expect(result.subtitle).toBe('AI + SDD');
  expect(result.body).toBe('Body.');
});

test('parses lowercase day prefix', () => {
  const raw = `day 27 lowercase title\n\nBody.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(27);
  expect(result.subtitle).toBe('lowercase title');
});

test('parses full-width colon separator (zh-TW typography)', () => {
  const raw = `Day 4：思考實驗\n\nBody.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(4);
  expect(result.subtitle).toBe('思考實驗');
});

test('parses full-width pipe separator', () => {
  const raw = `# Day 3｜Antigravity-Manager\n\nBody.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(3);
  expect(result.subtitle).toBe('Antigravity-Manager');
});

test('falls back to first body line when title line has no subtitle', () => {
  const raw = `# Day 1\n今天是今年的第一天\n也是正式失業的第一天`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(1);
  expect(result.subtitle).toBe('今天是今年的第一天');
});

test('truncates long body-line fallback subtitle', () => {
  const longLine = '一'.repeat(120);
  const raw = `Day 2\n${longLine}`;
  const result = parseSource(raw);
  expect(result.subtitle.endsWith('…')).toBe(true);
  expect([...result.subtitle].length).toBeLessThanOrEqual(61);
});

test('scans past leading prelude lines to find a Day N title', () => {
  const raw = `Vibe Coding\nDay 12 自製 Thread 發文機器人 (上)\n\nBody starts here.`;
  const result = parseSource(raw);
  expect(result.dayNumber).toBe(12);
  expect(result.subtitle).toBe('自製 Thread 發文機器人 (上)');
  expect(result.body).toBe('Body starts here.');
});

test('uses fallback dayNumber when title line is not "Day N"', () => {
  const raw = `今天開發時遇到一個奇怪的 bug。\n\nMore body.`;
  const result = parseSource(raw, 23);
  expect(result.dayNumber).toBe(23);
  expect(result.subtitle).toBe('今天開發時遇到一個奇怪的 bug。');
  expect(result.body).toBe('More body.');
});

test('throws on non-Day first line when no fallback dayNumber is provided', () => {
  expect(() => parseSource('Vibe Coding\n\nBody.')).toThrow(/title line/);
});
