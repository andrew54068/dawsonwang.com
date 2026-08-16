import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test, expect, beforeAll, afterAll } from 'vitest';
import { stagedPathsOtherThan, type GitRunner } from '../scripts/lib/git-staged';

// Exercised against a REAL repo through a REAL trimming runner, because the bug
// this guards against lived in the seam between the two: parsing that looked
// correct in isolation was wrong once deploy-local.ts's git() helper trimmed the
// output. A pure-string test of the parser passed while production was broken.

const TOPICS = 'src/data/topics.ts';
let repo: string;

/** Mirrors deploy-local.ts's git(): captures stdout and TRIMS it. */
const git: GitRunner = args =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).toString().trim();

function run(...args: string[]) { execFileSync('git', args, { cwd: repo }); }

beforeAll(() => {
  repo = mkdtempSync(path.join(tmpdir(), 'git-staged-'));
  run('init', '-q', '.');
  run('config', 'user.email', 'test@example.com');
  run('config', 'user.name', 'test');
  mkdirSync(path.join(repo, 'src', 'data'), { recursive: true });
  writeFileSync(path.join(repo, TOPICS), 'base\n');
  writeFileSync(path.join(repo, 'other.ts'), 'base\n');
  run('add', '-A');
  run('commit', '-qm', 'init');
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

test('a clean tree reports nothing staged', () => {
  expect(stagedPathsOtherThan(git, TOPICS)).toEqual([]);
});

test('an UNSTAGED edit does not block — the leading porcelain space must not be lost', () => {
  writeFileSync(path.join(repo, 'other.ts'), 'edited\n');
  expect(stagedPathsOtherThan(git, TOPICS)).toEqual([]);
});

test('an untracked file does not block', () => {
  writeFileSync(path.join(repo, 'scratch.txt'), 'scratch\n');
  expect(stagedPathsOtherThan(git, TOPICS)).toEqual([]);
});

test('the excluded path alone does not block, even when staged', () => {
  writeFileSync(path.join(repo, TOPICS), 'tagged\n');
  run('add', TOPICS);
  expect(stagedPathsOtherThan(git, TOPICS)).toEqual([]);
});

test('a genuinely staged other path DOES block, and keeps its full name', () => {
  run('add', 'other.ts');
  const staged = stagedPathsOtherThan(git, TOPICS);
  expect(staged).toEqual(['other.ts']);          // not 'ther.ts' — no character eaten
  expect(staged[0].startsWith('o')).toBe(true);
});

test('committing only the excluded path leaves other work untouched', () => {
  run('reset', '-q', 'other.ts');
  run('add', TOPICS);
  run('commit', '-qm', 'content(topics): tag day227');
  const changed = execFileSync('git', ['show', '--name-only', '--format=', 'HEAD'], {
    cwd: repo, encoding: 'utf8',
  }).trim().split('\n').filter(Boolean);
  expect(changed).toEqual([TOPICS]);
  // the unstaged edit and the untracked file survived the commit
  const still = execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' });
  expect(still).toContain('other.ts');
  expect(still).toContain('scratch.txt');
});

test('deep paths survive — no off-by-one from column parsing', () => {
  const deep = 'src/data/nested/deep/file.ts';
  mkdirSync(path.join(repo, 'src', 'data', 'nested', 'deep'), { recursive: true });
  writeFileSync(path.join(repo, deep), 'x\n');
  run('add', deep);
  expect(stagedPathsOtherThan(git, TOPICS)).toContain(deep);
});
