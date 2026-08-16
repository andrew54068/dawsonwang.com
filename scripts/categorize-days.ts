#!/usr/bin/env -S npx tsx
//
// categorize-days.ts — assign topic slugs to 100Days content that isn't in
// DAY_TOPICS yet, and write them into src/data/topics.ts.
//
// Every day under 100days/content must carry at least one topic slug: it's what
// puts the day on /topics, and tests/topics.test.ts fails without it. That
// tagging used to be manual, so a freshly published day was invisible on
// /topics until someone remembered. deploy-local.ts now runs this first (see
// categorizeNewDays), which is why classification is offline and deterministic —
// see scripts/lib/day-topic-classifier.ts for the scoring model.
//
// Usage:
//   yarn categorize                  # tag untagged days, write src/data/topics.ts
//   yarn categorize --dry-run        # print what would be written, touch nothing
//   yarn categorize --eval           # score the classifier against existing tags
//   yarn categorize --day 227        # only this day (implies --retag for it)
//   yarn categorize --retag          # re-classify days that are ALREADY tagged,
//                                    #   overwriting hand-curated slugs (destructive)
//   yarn categorize --explain        # show per-topic scores for each day tagged
//
// Config:
//   CONTENT_SRC   canonical content dir (default: /Users/dawson/Documents/100Days/content,
//                 falling back to this repo's 100days/content when absent)

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSource } from '../src/lib/parse-source';
import { DAY_TOPICS } from '../src/data/topics';
import { classifyDay, TOPIC_RULES, type TopicRule, type TopicScore } from './lib/day-topic-classifier';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.resolve(HERE, '..');
const TOPICS_FILE = path.join(SITE_DIR, 'src', 'data', 'topics.ts');
const DEFAULT_CONTENT = '/Users/dawson/Documents/100Days/content';
const VENDORED_CONTENT = path.join(SITE_DIR, '100days', 'content');

export interface DayTags {
  day: number;
  slugs: string[];
  scores: TopicScore[];
  lowConfidence: boolean;
}

export function resolveContentDir(explicit?: string): string {
  const candidates = [explicit, process.env.CONTENT_SRC, DEFAULT_CONTENT, VENDORED_CONTENT].filter(Boolean) as string[];
  for (const dir of candidates) if (existsSync(dir)) return dir;
  throw new Error(`no content directory found (tried: ${candidates.join(', ')})`);
}

export interface ContentDay { day: number; dir: string }

/**
 * Days under `contentDir` that have a source.md, ascending.
 * Early days are zero-padded on disk (`day01`), so the directory name is kept
 * alongside the parsed number — never reconstruct it as `day${n}`.
 */
export function listContentDays(contentDir: string): ContentDay[] {
  return readdirSync(contentDir)
    .filter(name => /^day\d+$/.test(name))
    .filter(name => existsSync(path.join(contentDir, name, 'source.md')))
    .map(name => ({ day: parseInt(name.slice(3), 10), dir: name }))
    .sort((a, b) => a.day - b.day);
}

function classifyOne(contentDir: string, { day, dir }: ContentDay, rules = TOPIC_RULES): DayTags | null {
  const raw = readFileSync(path.join(contentDir, dir, 'source.md'), 'utf8');
  if (!raw.trim()) return null;
  let title: string;
  let body: string;
  try {
    const parsed = parseSource(raw, day);
    title = parsed.subtitle;
    body = parsed.body;
  } catch {
    return null; // matches content-loader.ts: an unparseable day isn't on the site either
  }
  const { slugs, scores, lowConfidence } = classifyDay(title, body, rules);
  return { day, slugs, scores, lowConfidence };
}

/**
 * Classify every content day that DAY_TOPICS doesn't cover yet.
 * `tagged` defaults to the committed map; pass an explicit set to re-tag.
 */
export function classifyUntagged(
  contentDir: string,
  opts: { only?: number[]; retag?: boolean } = {},
): DayTags[] {
  const all = listContentDays(contentDir);
  const scoped = opts.only ? all.filter(d => opts.only!.includes(d.day)) : all;
  const needsTag = opts.retag || opts.only
    ? scoped
    : scoped.filter(({ day }) => !(DAY_TOPICS[day]?.length > 0));

  return needsTag
    .map(entry => classifyOne(contentDir, entry))
    .filter((d): d is DayTags => d !== null)
    .sort((a, b) => b.day - a.day);
}

function formatEntry(day: number, slugs: string[]): string {
  return `  ${day}: [${slugs.map(s => `'${s}'`).join(', ')}],`;
}

/**
 * Insert/replace DAY_TOPICS entries in topics.ts source text, keeping the
 * map's descending-by-day order and leaving every untouched line byte-identical
 * so the diff shows only the new days.
 */
export function upsertEntries(source: string, entries: DayTags[]): { text: string; added: number[]; replaced: number[] } {
  const lines = source.split('\n');
  const openIdx = lines.findIndex(l => l.includes('export const DAY_TOPICS'));
  if (openIdx === -1) throw new Error('could not find `export const DAY_TOPICS` in topics.ts');
  const closeIdx = lines.findIndex((l, i) => i > openIdx && l.trim() === '};');
  if (closeIdx === -1) throw new Error('could not find the closing `};` of DAY_TOPICS');

  const added: number[] = [];
  const replaced: number[] = [];

  // Highest day first so each insert lands above the ones already placed.
  for (const entry of [...entries].sort((a, b) => b.day - a.day)) {
    const line = formatEntry(entry.day, entry.slugs);
    const end = lines.findIndex((l, i) => i > openIdx && l.trim() === '};');

    let existing = -1;
    let insertAt = end;
    for (let i = openIdx + 1; i < end; i++) {
      const m = lines[i].match(/^\s*(\d+)\s*:/);
      if (!m) continue;
      const day = parseInt(m[1], 10);
      if (day === entry.day) { existing = i; break; }
      if (day < entry.day) { insertAt = i; break; }
    }

    if (existing !== -1) {
      if (lines[existing] !== line) replaced.push(entry.day);
      lines[existing] = line;
    } else {
      lines.splice(insertAt, 0, line);
      added.push(entry.day);
    }
  }

  return { text: lines.join('\n'), added, replaced };
}

/**
 * Tag untagged days and write src/data/topics.ts.
 * Returns what it tagged; `written` is false when there was nothing to do or
 * when dryRun was set. Used by deploy-local.ts before it builds the worktree.
 */
export function categorizeNewDays(opts: {
  contentDir?: string;
  only?: number[];
  retag?: boolean;
  dryRun?: boolean;
} = {}): { tagged: DayTags[]; written: boolean; topicsFile: string } {
  const contentDir = resolveContentDir(opts.contentDir);
  const tagged = classifyUntagged(contentDir, { only: opts.only, retag: opts.retag });
  if (tagged.length === 0) return { tagged, written: false, topicsFile: TOPICS_FILE };

  const source = readFileSync(TOPICS_FILE, 'utf8');
  const { text, added, replaced } = upsertEntries(source, tagged);
  const changed = added.length > 0 || replaced.length > 0;
  if (changed && !opts.dryRun) writeFileSync(TOPICS_FILE, text);
  return { tagged, written: changed && !opts.dryRun, topicsFile: TOPICS_FILE };
}

// ---------------------------------------------------------------------------
// --eval: how well does the keyword table reproduce the hand-curated tags?
// ---------------------------------------------------------------------------

interface Metrics {
  n: number; primaryHit: number; anyOverlap: number;
  tp: number; predicted: number; actual: number;
  precision: number; recall: number; f1: number; objective: number;
  misses: string[];
}

/** Ground truth = the hand-curated tags already in DAY_TOPICS. */
function goldDays(contentDir: string): ContentDay[] {
  return listContentDays(contentDir).filter(d => DAY_TOPICS[d.day]?.length > 0);
}

function measure(contentDir: string, days: ContentDay[], rules: TopicRule[]): Metrics {
  let primaryHit = 0, anyOverlap = 0, tp = 0, predicted = 0, actual = 0;
  const misses: string[] = [];

  for (const entry of days) {
    const result = classifyOne(contentDir, entry, rules);
    if (!result) continue;
    const expected = DAY_TOPICS[entry.day];
    const got = result.slugs;
    const hit = got.filter(s => expected.includes(s));

    if (got[0] === expected[0]) primaryHit++;
    if (hit.length > 0) anyOverlap++;
    else misses.push(`  day${entry.day}: expected [${expected.join(', ')}] got [${got.join(', ')}]`);
    tp += hit.length;
    predicted += got.length;
    actual += expected.length;
  }

  const n = days.length;
  const precision = predicted ? tp / predicted : 0;
  const recall = actual ? tp / actual : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  // Weighted toward "the day reaches at least one correct topic", which is what a
  // reader browsing /topics actually feels. F1 keeps it from spraying slugs, and
  // primary accuracy is worth a slice because slugs[0] becomes articleSection in
  // the day's structured data.
  const objective = 0.4 * (anyOverlap / n) + 0.4 * f1 + 0.2 * (primaryHit / n);
  return { n, primaryHit, anyOverlap, tp, predicted, actual, precision, recall, f1, objective, misses };
}

function evaluate(contentDir: string): void {
  const days = goldDays(contentDir);
  const m = measure(contentDir, days, TOPIC_RULES);
  console.log(`\nevaluated ${m.n} hand-tagged days\n`);
  console.log(`  exact primary topic    ${((m.primaryHit / m.n) * 100).toFixed(1)}%  (${m.primaryHit}/${m.n})`);
  console.log(`  at least one overlap   ${((m.anyOverlap / m.n) * 100).toFixed(1)}%  (${m.anyOverlap}/${m.n})`);
  console.log(`  slug precision         ${(m.precision * 100).toFixed(1)}%  (${m.tp}/${m.predicted} predicted slugs were in the hand tags)`);
  console.log(`  slug recall            ${(m.recall * 100).toFixed(1)}%  (${m.tp}/${m.actual} hand tags were recovered)`);
  console.log(`  slug F1                ${(m.f1 * 100).toFixed(1)}%`);
  if (m.misses.length) {
    console.log(`\n  ${m.misses.length} day(s) with no overlap at all:`);
    console.log(m.misses.slice(0, 25).join('\n'));
    if (m.misses.length > 25) console.log(`  … and ${m.misses.length - 25} more`);
  }
  console.log();
}

/**
 * Coordinate ascent over each topic's `damp`. Deterministic: fixed grid, fixed
 * order, fixed passes — same corpus always yields the same table. Prints the
 * result for pasting back into day-topic-classifier.ts (it does not self-edit,
 * so a bad fit can never silently change how days are tagged).
 */
function tune(contentDir: string): void {
  const days = goldDays(contentDir);
  const GRID = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4, 1.6, 1.8, 2.2];
  const PASSES = 4;

  const rules: TopicRule[] = TOPIC_RULES.map(r => ({ ...r }));
  let best = measure(contentDir, days, rules).objective;
  console.log(`\ntuning damp over ${days.length} hand-tagged days (start objective ${(best * 100).toFixed(2)})`);

  for (let pass = 1; pass <= PASSES; pass++) {
    let improved = false;
    for (const rule of rules) {
      const original = rule.damp;
      let bestDamp = original;
      for (const candidate of GRID) {
        rule.damp = candidate;
        const score = measure(contentDir, days, rules).objective;
        if (score > best + 1e-9) { best = score; bestDamp = candidate; improved = true; }
      }
      rule.damp = bestDamp;
    }
    console.log(`  pass ${pass}: objective ${(best * 100).toFixed(2)}`);
    if (!improved) break;
  }

  const final = measure(contentDir, days, rules);
  console.log(`\nfitted damp values — paste into TOPIC_RULES:\n`);
  for (const rule of rules) console.log(`    ${rule.slug.padEnd(20)} damp: ${rule.damp},`);
  console.log(`\n  overlap ${((final.anyOverlap / final.n) * 100).toFixed(1)}%  ` +
    `primary ${((final.primaryHit / final.n) * 100).toFixed(1)}%  ` +
    `P ${(final.precision * 100).toFixed(1)}%  R ${(final.recall * 100).toFixed(1)}%  F1 ${(final.f1 * 100).toFixed(1)}%\n`);
}

// ---------------------------------------------------------------------------

interface Args { dryRun: boolean; evalMode: boolean; tuneMode: boolean; retag: boolean; explain: boolean; days?: number[]; contentDir?: string }

function parseArgs(argv: string[]): Args {
  const a: Args = { dryRun: false, evalMode: false, tuneMode: false, retag: false, explain: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--dry-run') a.dryRun = true;
    else if (t === '--eval') a.evalMode = true;
    else if (t === '--tune') a.tuneMode = true;
    else if (t === '--retag') a.retag = true;
    else if (t === '--explain') a.explain = true;
    else if (t === '--day') (a.days ??= []).push(Number(argv[++i]));
    else if (t.startsWith('--day=')) (a.days ??= []).push(Number(t.slice('--day='.length)));
    else if (t === '--content-dir') a.contentDir = argv[++i];
    else if (t.startsWith('--content-dir=')) a.contentDir = t.slice('--content-dir='.length);
    else throw new Error(`unknown argument: ${t}`);
  }
  if (a.days?.some(d => !Number.isInteger(d))) throw new Error('--day must be an integer');
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const contentDir = resolveContentDir(args.contentDir);

  if (args.evalMode) { evaluate(contentDir); return; }
  if (args.tuneMode) { tune(contentDir); return; }

  const { tagged, written } = categorizeNewDays({
    contentDir,
    only: args.days,
    retag: args.retag,
    dryRun: args.dryRun,
  });

  if (tagged.length === 0) {
    console.log(`[categorize] every day in ${contentDir} is already tagged — nothing to do.`);
    return;
  }

  for (const t of tagged) {
    const flag = t.lowConfidence ? '  ⚠ low confidence — review this one' : '';
    console.log(`[categorize] day${t.day} → ${t.slugs.join(', ')}${flag}`);
    if (args.explain) {
      for (const s of t.scores.filter(s => s.score > 0).slice(0, 6)) {
        console.log(`               ${s.slug.padEnd(20)} ${s.score}`);
      }
    }
  }

  console.log(
    args.dryRun
      ? `[categorize] dry-run: ${tagged.length} day(s) would be written to src/data/topics.ts`
      : written
        ? `[categorize] wrote ${tagged.length} day(s) to src/data/topics.ts`
        : '[categorize] no changes needed',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
