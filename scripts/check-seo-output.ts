import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TOPICS } from '../src/data/topics';

const root = process.cwd();
const configuredSiteDir = process.env.SEO_SITE_DIR;
const candidateSiteDirs = configuredSiteDir
  ? [configuredSiteDir]
  : ['dist', 'dist/client', '.vercel/output/static'];
const outDir = candidateSiteDirs
  .map(dir => path.resolve(root, dir))
  .find(dir => existsSync(path.join(dir, 'index.html')))
  ?? path.resolve(root, configuredSiteDir ?? 'dist');
const siteUrl = 'https://dawsonwang.com';

const failures: string[] = [];
const notes: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function note(message: string) {
  notes.push(message);
}

function readGenerated(relativePath: string) {
  const filePath = path.join(outDir, relativePath);
  if (!existsSync(filePath)) {
    fail(`Missing generated file: ${path.relative(root, filePath)}`);
    return '';
  }
  return readFileSync(filePath, 'utf8');
}

function assertIncludes(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`);
}

function assertMatch(haystack: string, pattern: RegExp, label: string) {
  if (!pattern.test(haystack)) fail(`${label} missing pattern ${pattern}`);
}

function listSourceDays() {
  const contentDir = path.join(root, '100days/content');
  return readdirSync(contentDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^day\d+$/.test(entry.name))
    .map(entry => {
      const number = Number(entry.name.replace('day', ''));
      const sourcePath = path.join(contentDir, entry.name, 'source.md');
      return { dir: entry.name, number, sourcePath };
    })
    .filter(day => Number.isFinite(day.number) && existsSync(day.sourcePath))
    .sort((a, b) => a.number - b.number);
}

if (!existsSync(outDir)) {
  fail(`Generated output directory does not exist: ${path.relative(root, outDir)}`);
} else {
  const days = listSourceDays();
  const latestDay = days.at(-1)?.number;
  note(`source day count: ${days.length}${latestDay ? `, latest day: ${latestDay}` : ''}`);

  const home = readGenerated('index.html');
  assertIncludes(home, `<link rel="canonical" href="${siteUrl}/"`, 'home');
  assertMatch(home, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, 'home');
  assertIncludes(home, `<meta property="og:url" content="${siteUrl}/"`, 'home');
  assertMatch(home, /<meta property="og:image" content="https:\/\/dawsonwang\.com\/[^"]+"\s*\/?\s*>/, 'home');
  assertMatch(home, /<meta name="twitter:image" content="https:\/\/dawsonwang\.com\/[^"]+"\s*\/?\s*>/, 'home');
  assertMatch(home, /<script type="application\/ld\+json"[^>]*>.*"@type":"Person".*"@type":"WebSite".*<\/script>/s, 'home JSON-LD');

  if (latestDay) {
    const dayHtml = readGenerated(`day/${latestDay}/index.html`);
    assertIncludes(dayHtml, `<link rel="canonical" href="${siteUrl}/day/${latestDay}"`, `day ${latestDay}`);
    assertIncludes(dayHtml, '<meta property="og:type" content="article"', `day ${latestDay}`);
    assertMatch(dayHtml, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, `day ${latestDay}`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"Article".*<\/script>/s, `day ${latestDay} Article JSON-LD`);
  }

  const generatedDayPages = days.filter(day => existsSync(path.join(outDir, `day/${day.number}/index.html`)));
  if (generatedDayPages.length !== days.length) {
    const missing = days
      .filter(day => !existsSync(path.join(outDir, `day/${day.number}/index.html`)))
      .map(day => `${day.dir}->/day/${day.number}`)
      .slice(0, 20)
      .join(', ');
    fail(`Generated day page count mismatch: ${generatedDayPages.length}/${days.length}. Missing: ${missing}`);
  } else {
    note(`generated day pages: ${generatedDayPages.length}/${days.length}`);
  }

  const topicsIndex = readGenerated('topics/index.html');
  assertIncludes(topicsIndex, `<link rel="canonical" href="${siteUrl}/topics"`, 'topics index');
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"ItemList".*<\/script>/s, 'topics index JSON-LD');
  for (const topic of TOPICS) {
    const label = `topic ${topic.slug}`;
    const topicHtml = readGenerated(`topics/${topic.slug}/index.html`);
    assertIncludes(topicHtml, `<link rel="canonical" href="${siteUrl}/topics/${topic.slug}"`, label);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"DefinedTerm".*"@type":"ItemList".*<\/script>/s, `${label} JSON-LD`);
  }
  note(`generated topic pages: ${TOPICS.length}/${TOPICS.length}`);

  const sitemap = readGenerated('sitemap.xml');
  assertIncludes(sitemap, `<loc>${siteUrl}/</loc>`, 'sitemap');
  assertIncludes(sitemap, `<loc>${siteUrl}/days</loc>`, 'sitemap');
  assertIncludes(sitemap, `<loc>${siteUrl}/topics</loc>`, 'sitemap');
  for (const topic of TOPICS) {
    assertIncludes(sitemap, `<loc>${siteUrl}/topics/${topic.slug}</loc>`, 'sitemap');
  }
  const sitemapTopicCount = Array.from(sitemap.matchAll(/<loc>https:\/\/dawsonwang\.com\/topics\/[^<]+<\/loc>/g)).length;
  if (sitemapTopicCount !== TOPICS.length) fail(`Sitemap topic URL count mismatch: ${sitemapTopicCount}/${TOPICS.length}`);
  assertIncludes(sitemap, `<loc>${siteUrl}/search</loc>`, 'sitemap');
  if (latestDay) assertIncludes(sitemap, `<loc>${siteUrl}/day/${latestDay}</loc>`, 'sitemap');
  const sitemapDayCount = Array.from(sitemap.matchAll(/<loc>https:\/\/dawsonwang\.com\/day\/\d+<\/loc>/g)).length;
  if (sitemapDayCount !== days.length) fail(`Sitemap day URL count mismatch: ${sitemapDayCount}/${days.length}`);

  const robots = readGenerated('robots.txt');
  assertIncludes(robots, `Sitemap: ${siteUrl}/sitemap.xml`, 'robots.txt');
  assertIncludes(robots, 'Disallow: /api/', 'robots.txt');

  const llms = readGenerated('llms.txt');
  assertIncludes(llms, '# Dawson Wang', 'llms.txt');
  assertIncludes(llms, `${siteUrl}/topics`, 'llms.txt');
  if (latestDay) assertIncludes(llms, `${siteUrl}/day/${latestDay}`, 'llms.txt');
}

for (const line of notes) console.log(`✓ ${line}`);
if (failures.length) {
  console.error('\nSEO generated-output check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('✓ generated SEO output contains required metadata, crawler files, sitemap coverage, llms.txt, and content routes');
