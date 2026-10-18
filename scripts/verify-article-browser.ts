import { execFileSync } from 'node:child_process';

const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) throw new Error('Usage: yarn taxonomy:verify-browser <private-preview-url> (requires installed chrome-devtools-axi)');
const env = { ...process.env, CHROME_DEVTOOLS_AXI_SESSION: 'article-taxonomy-check' };
function browser(...args: string[]) {
  return execFileSync('chrome-devtools-axi', args, { env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
}
browser('open', new URL('/days?type=fundamentals&topic=local-llm', base).href);
const result = browser('eval', `async () => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const rows = () => [...document.querySelectorAll('[data-article-row]')];
  const visible = () => rows().filter(e => !e.hidden).map(e => JSON.parse(e.dataset.articleRow).dayNumber);
  const input = (name, value) => document.querySelector('input[name="' + name + '"][value="' + value + '"]');
  const check = (name, value) => input(name, value).click();
  const total = rows().length;
  assert(total >= 290, 'Full corpus missing');
  assert([186, 90].every(day => visible().includes(day)), 'Shared URL did not select core model concepts');
  assert(!visible().includes(107), 'Tutorial leaked into basic concepts filter');
  assert(input('type', 'fundamentals').checked && input('topic', 'local-llm').checked, 'URL not restored into controls');
  const before = visible().length;
  check('type', 'tutorials');
  assert(visible().includes(107) && visible().length >= before, 'OR within article types failed');
  assert(new URLSearchParams(location.search).getAll('type').length === 2, 'Multi-selection URL lost');
  history.back();
  await new Promise(resolve => setTimeout(resolve, 250));
  assert(!input('type', 'tutorials').checked && !visible().includes(107), 'Back navigation failed');
  history.forward();
  await new Promise(resolve => setTimeout(resolve, 250));
  assert(input('type', 'tutorials').checked && visible().includes(107), 'Forward navigation failed');
  check('freshness', 'evergreen');
  assert(rows().filter(e => !e.hidden).every(e => JSON.parse(e.dataset.articleRow).freshness.includes('evergreen')), 'AND across axes failed');
  const query = document.querySelector('[name="q"]');
  query.value = 'xxxxxxxx-no-such-article';
  query.dispatchEvent(new Event('input', { bubbles: true }));
  assert(visible().length === 0 && !document.querySelector('[data-filter-empty]').hidden, 'Empty state failed');
  document.querySelector('[data-clear-filters]').click();
  assert(visible().length === total && location.search === '' && !document.querySelector('[data-filter-empty]').offsetHeight, 'Clear filters failed');
  query.value = 'FP16';
  query.dispatchEvent(new Event('input', { bubbles: true }));
  assert(visible().includes(186), 'Title search failed');
  document.querySelector('[data-clear-filters]').click();
  check('type', 'cases');
  assert(document.querySelector('[data-filter-summary]').textContent === '案例與復盤', 'Colliding legacy topic title overwrote type title');
  assert(!document.querySelector('a a'), 'Nested article/tag links');
  document.querySelector('[data-clear-filters]').click();
  return { browserChecksPassed: true, total, checks: 13 };
}`);
if (!result.includes('browserChecksPassed')) throw new Error(result);
browser('open', new URL('/days?topic=cases', base).href);
const legacyResult = browser('eval', `() => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const legacy = document.querySelector('input[name="topic"][value="cases"]');
  assert(legacy?.checked, 'Legacy cases topic has no selected control');
  const before = document.querySelectorAll('[data-article-row]:not([hidden])').length;
  document.querySelector('input[name="freshness"][value="evergreen"]').click();
  assert(new URLSearchParams(location.search).getAll('topic').includes('cases'), 'Legacy cases topic lost on refinement');
  const visible = [...document.querySelectorAll('[data-article-row]:not([hidden])')];
  assert(visible.length <= before && visible.every(e => JSON.parse(e.dataset.articleRow).topics.includes('cases')), 'Legacy topic refinement broadened results');
  return 'legacyChecksPassed';
}`);
if (!legacyResult.includes('legacyChecksPassed')) throw new Error(legacyResult);
for (const width of [390, 1280]) {
  browser('resize', String(width), '900');
  const layout = browser('eval', `() => { if (document.documentElement.scrollWidth > innerWidth) throw new Error('Horizontal overflow at ${width}px'); return 'layoutPassed'; }`);
  if (!layout.includes('layoutPassed')) throw new Error(layout);
}
console.log('Article browser: 16 interaction checks + mobile/desktop overflow checks passed.');
