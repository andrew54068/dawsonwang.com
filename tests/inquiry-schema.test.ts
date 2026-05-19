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

test('rejects goal longer than 300 chars', () => {
  // The HTML form already enforces maxlength=300; if a client bypasses that,
  // reject rather than silently truncate (which would lose context).
  expect(() => InquirySchema.parse({ ...valid, goal: 'x'.repeat(301) })).toThrow();
});

test('accepts goal of exactly 300 chars', () => {
  const result = InquirySchema.parse({ ...valid, goal: 'x'.repeat(300) });
  expect(result.goal.length).toBe(300);
});

test('rejects newlines in name', () => {
  expect(() => InquirySchema.parse({ ...valid, name: 'A\r\nBcc: x@y.com' })).toThrow();
});

test('rejects newlines in company', () => {
  expect(() => InquirySchema.parse({ ...valid, company: 'Acme\nEvil' })).toThrow();
});
