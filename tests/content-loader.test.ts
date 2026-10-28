import { test, expect } from 'vitest';
import { loadAllDays } from '../src/lib/content-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../100days/content');

test('loads at least 100 days from real content/', async () => {
  const days = await loadAllDays(CONTENT_DIR);
  expect(days.length).toBeGreaterThanOrEqual(100);
});

test('every loaded day has a parseable title', async () => {
  const days = await loadAllDays(CONTENT_DIR);
  for (const day of days) {
    expect(day.dayNumber).toBeGreaterThan(0);
    expect(day.subtitle.length).toBeGreaterThan(0);
    expect(day.body.length).toBeGreaterThan(10);
  }
});

test('loads days whose source.md does not start with "Day N"', async () => {
  const days = await loadAllDays(CONTENT_DIR);
  const dayNumbers = new Set(days.map(d => d.dayNumber));
  // day12 starts with "Vibe Coding"; day23 starts with "今天開發時遇到..."
  expect(dayNumbers.has(12)).toBe(true);
  expect(dayNumbers.has(23)).toBe(true);
});

test('skips directories with empty source.md', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'content-loader-'));
  try {
    // Create three day directories: empty, valid, and missing source.md
    await mkdir(path.join(tmp, 'day01'), { recursive: true });
    await writeFile(path.join(tmp, 'day01', 'source.md'), ''); // empty

    await mkdir(path.join(tmp, 'day02'), { recursive: true });
    await writeFile(path.join(tmp, 'day02', 'source.md'), 'Day 2 valid\n\nBody text here.');

    await mkdir(path.join(tmp, 'day03'), { recursive: true }); // no source.md at all

    const days = await loadAllDays(tmp);
    expect(days.length).toBe(1);
    expect(days[0].dayNumber).toBe(2);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('OG selection accepts regular files, not directories or symlinks', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'content-og-'));
  const dayRoot = path.join(tmp, 'day01');
  try {
    await mkdir(path.join(dayRoot, 'og.jpg'), { recursive: true });
    await writeFile(path.join(dayRoot, 'source.md'), 'Day 1 分享卡片\n\n公開文章內容。');
    await writeFile(path.join(tmp, 'private.jpeg'), 'private');
    await symlink(path.join(tmp, 'private.jpeg'), path.join(dayRoot, 'og.jpeg'));
    await writeFile(path.join(dayRoot, 'og.png'), 'png');

    expect((await loadAllDays(tmp))[0].ogImage).toBe(path.join(dayRoot, 'og.png'));
    await rm(path.join(dayRoot, 'og.png'));
    expect((await loadAllDays(tmp))[0].ogImage).toBeUndefined();
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('day100 specifically loads with cover image', async () => {
  const days = await loadAllDays(CONTENT_DIR);
  const day100 = days.find(d => d.dayNumber === 100);
  expect(day100).toBeDefined();
  expect(day100!.coverImage).toBeTruthy();
});
