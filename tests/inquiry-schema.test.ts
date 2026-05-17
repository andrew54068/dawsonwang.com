import { test, expect } from 'vitest';
import { InquirySchema } from '../src/lib/inquiry-schema';

const valid = {
  name: '王小明',
  email: 'mr.wang@example.com',
  company: 'Acme Co',
  goal: '想把客服流程串 AI',
  team_size: '6-30',
  budget: '300k-800k',
  timeline: 'this_quarter',
  hp_field: '',
};

test('accepts valid payload', () => {
  expect(() => InquirySchema.parse(valid)).not.toThrow();
});

test('rejects missing email', () => {
  expect(() => InquirySchema.parse({ ...valid, email: '' })).toThrow();
});

test('rejects invalid budget', () => {
  expect(() => InquirySchema.parse({ ...valid, budget: 'free_money' })).toThrow();
});

test('rejects when honeypot is filled', () => {
  expect(() => InquirySchema.parse({ ...valid, hp_field: 'spam' })).toThrow(/honeypot/);
});

test('truncates goal to 300 chars', () => {
  const result = InquirySchema.parse({ ...valid, goal: 'x'.repeat(500) });
  expect(result.goal.length).toBe(300);
});
