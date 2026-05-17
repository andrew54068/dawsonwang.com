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
