import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { resolveContentDir } from './categorize-days';
import { loadAllDays } from '../src/lib/content-loader';
import { ARTICLE_TYPES, FRESHNESS, classificationForDay } from '../src/lib/article-taxonomy';
import { TOPICS } from '../src/data/topics';
import { topicsForDay } from '../src/lib/topics';

const days = await loadAllDays(resolveContentDir());
const missing = days.filter(day => !classificationForDay(day.dayNumber)).map(day => day.dayNumber);
const changed = days.filter(day => {
  const recorded = classificationForDay(day.dayNumber);
  if (!recorded) return false;
  const raw = readFileSync(path.join(day.contentDir, 'source.md'));
  return createHash('sha256').update(raw).digest('hex') !== recorded.sourceHash;
}).map(day => day.dayNumber);
const report = {
  total: days.length,
  classified: days.length - missing.length,
  missing,
  changed,
  types: Object.fromEntries(ARTICLE_TYPES.map(t => [t.title, days.filter(day => classificationForDay(day.dayNumber)?.types.includes(t.slug)).length])),
  topics: Object.fromEntries(TOPICS.map(t => [t.title, days.filter(day => topicsForDay(day.dayNumber).includes(t.slug)).length])),
  freshness: Object.fromEntries(FRESHNESS.map(t => [t.title, days.filter(day => classificationForDay(day.dayNumber)?.freshness.includes(t.slug)).length])),
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && (missing.length || changed.length)) process.exitCode = 1;
