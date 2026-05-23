import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TOPICS, DAY_TOPICS } from '../src/data/topics';

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

function countMatches(haystack: string, pattern: RegExp) {
  return Array.from(haystack.matchAll(pattern)).length;
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
  assertIncludes(home, '<meta property="og:image:width" content="1200"', 'home og:image:width');
  assertIncludes(home, '<meta property="og:image:height" content="630"', 'home og:image:height');
  assertMatch(home, /<meta property="og:image:alt" content="[^"]+"/, 'home og:image:alt');
  assertMatch(home, /<meta name="twitter:image" content="https:\/\/dawsonwang\.com\/[^"]+"\s*\/?\s*>/, 'home');
  assertMatch(home, /<meta name="twitter:image:alt" content="[^"]+"/, 'home twitter:image:alt');
  assertMatch(home, /<script type="application\/ld\+json"[^>]*>.*"@type":"Person".*"@type":"WebSite".*<\/script>/s, 'home JSON-LD');
  assertMatch(home, /"@type":"Person"[^}]*"description":"/, 'home Person description');
  assertMatch(home, /"@type":"Person"[\s\S]*?"knowsLanguage":\["zh-Hant-TW","en"\]/, 'home Person knowsLanguage');
  assertMatch(home, /"@type":"WebSite"[^}]*"description":"/, 'home WebSite description');
  // ProfessionalService OfferCatalog enrichment: mirrors src/data/services.ts (3 tier services).
  assertMatch(home, /"@type":"ProfessionalService"[\s\S]*?"hasOfferCatalog":\{[\s\S]*?"@type":"OfferCatalog"/, 'home ProfessionalService hasOfferCatalog');
  assertIncludes(home, `"@id":"${siteUrl}/#ai-workflow-service-catalog"`, 'home OfferCatalog @id');
  const homeOfferCount = countMatches(home, /"@type":"Offer","position":\d+/g);
  if (homeOfferCount < 3) fail(`home OfferCatalog has only ${homeOfferCount} Offer items (expected >=3 — one per service tier)`);
  assertMatch(home, /"@type":"Offer"[\s\S]*?"itemOffered":\{"@type":"Service"[\s\S]*?"provider":\{"@id":"https:\/\/dawsonwang\.com\/#person"\}/, 'home Offer.itemOffered Service.provider -> #person graph link');
  assertMatch(home, /"@type":"Offer"[^}]*"url":"https:\/\/dawsonwang\.com\/#inquire"/, 'home Offer.url absolute -> #inquire');
  assertIncludes(home, 'Dawson Wang', 'home');
  assertIncludes(home, 'AI 工具落地', 'home');
  assertIncludes(home, 'action="/api/inquiry"', 'home inquiry form');
  assertIncludes(home, 'method="POST"', 'home inquiry form');
  for (const field of ['name', 'email', 'company', 'goal', 'team_size', 'budget', 'timeline', 'hp_field']) {
    assertIncludes(home, `name="${field}"`, `home inquiry form field ${field}`);
  }
  assertIncludes(home, 'href="/#inquire"', 'home appointment CTA');
  // Negative probe: home is type=website, must NOT emit article:* OG tags.
  if (home.includes('article:published_time')) fail('home leaks article:published_time meta (should be type=website)');

  const allPosts = readGenerated('days/index.html');
  assertIncludes(allPosts, `<link rel="canonical" href="${siteUrl}/days"`, 'all posts');
  assertIncludes(allPosts, '所有', 'all posts');
  assertIncludes(allPosts, '文章', 'all posts');
  assertMatch(allPosts, /<meta property="og:image:alt" content="[^"]+"/, '/days og:image:alt');
  assertMatch(allPosts, /<meta name="twitter:image:alt" content="[^"]+"/, '/days twitter:image:alt');
  if (allPosts.includes('article:published_time')) fail('/days leaks article:published_time meta (should be type=website)');
  assertIncludes(allPosts, '共 ', 'all posts');
  const allPostsDayLinks = countMatches(allPosts, /href="\/day\/\d+"/g);
  if (allPostsDayLinks < days.length) fail(`All posts page links only ${allPostsDayLinks}/${days.length} day pages`);
  assertMatch(allPosts, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"ItemList".*<\/script>/s, '/days CollectionPage+ItemList JSON-LD');
  assertMatch(allPosts, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/days BreadcrumbList JSON-LD');
  assertMatch(allPosts, /"url":"https:\/\/dawsonwang\.com\/day\/\d+"/, '/days ItemList contains absolute day URLs');

  const search = readGenerated('search/index.html');
  assertIncludes(search, `<link rel="canonical" href="${siteUrl}/search"`, 'search');
  assertIncludes(search, 'id="search-form"', 'search form');
  assertIncludes(search, 'type="search"', 'search form');
  assertIncludes(search, 'value="keyword"', 'search keyword mode');
  assertIncludes(search, 'value="semantic"', 'search semantic mode');
  assertIncludes(search, 'id="search-results"', 'search results');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"SearchResultsPage".*<\/script>/s, '/search SearchResultsPage JSON-LD');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/search BreadcrumbList JSON-LD');
  assertIncludes(search, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/search JSON-LD isPartOf #website graph link');
  assertMatch(search, /"target":"https:\/\/dawsonwang\.com\/search\?q=\{search_term_string\}"/, '/search SearchAction target');

  if (latestDay) {
    const dayHtml = readGenerated(`day/${latestDay}/index.html`);
    assertIncludes(dayHtml, `<link rel="canonical" href="${siteUrl}/day/${latestDay}"`, `day ${latestDay}`);
    assertIncludes(dayHtml, '<meta property="og:type" content="article"', `day ${latestDay}`);
    assertMatch(dayHtml, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, `day ${latestDay}`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"Article".*<\/script>/s, `day ${latestDay} Article JSON-LD`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `day ${latestDay} BreadcrumbList JSON-LD`);
    // Article enrichment (wordCount + isPartOf are stable across all days; articleSection gated below).
    assertMatch(dayHtml, /"wordCount":\d+/, `day ${latestDay} Article wordCount`);
    assertIncludes(dayHtml, `"isPartOf":{"@id":"${siteUrl}/#website"}`, `day ${latestDay} Article isPartOf`);
    // mainEntityOfPage promoted to typed WebPage node (was bare URL string).
    assertIncludes(dayHtml, `"mainEntityOfPage":{"@type":"WebPage","@id":"${siteUrl}/day/${latestDay}"}`, `day ${latestDay} Article mainEntityOfPage WebPage`);
    // image promoted to typed ImageObject with declared dimensions (large-image rich-result eligibility).
    // Primary image is always the og-default fallback (1200x630) so dimensions are stable across days.
    assertMatch(dayHtml, /"image":(\[\{|\{)"@type":"ImageObject","url":"https:\/\/dawsonwang\.com\/og-default\.png","width":1200,"height":630/, `day ${latestDay} Article image ImageObject`);
    // Negative: ensure we did NOT regress to bare-URL mainEntityOfPage.
    if (/"mainEntityOfPage":"https:/.test(dayHtml)) fail(`day ${latestDay} Article mainEntityOfPage regressed to bare URL string`);
    // OG article:* metadata: published/modified/author asserted on the latest day.
    assertMatch(dayHtml, /<meta property="article:published_time" content="[^"]+"/, `day ${latestDay} article:published_time`);
    assertMatch(dayHtml, /<meta property="article:modified_time" content="[^"]+"/, `day ${latestDay} article:modified_time`);
    assertIncludes(dayHtml, `<meta property="article:author" content="${siteUrl}/#person"`, `day ${latestDay} article:author`);
    assertMatch(dayHtml, /<meta property="og:image:alt" content="[^"]+"/, `day ${latestDay} og:image:alt`);
    assertMatch(dayHtml, /<meta name="twitter:image:alt" content="[^"]+"/, `day ${latestDay} twitter:image:alt`);
  }

  // article:tag is only emitted when the day has topic chips; assert on the latest day that has topics
  // (stable-subset gate per the skill — avoids hiding a baseline gap for older days without topic mappings).
  const latestDayWithTopics = Object.keys(DAY_TOPICS)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && (DAY_TOPICS[n] ?? []).length > 0 && existsSync(path.join(outDir, `day/${n}/index.html`)))
    .sort((a, b) => b - a)[0];
  if (latestDayWithTopics) {
    const dayHtml = readGenerated(`day/${latestDayWithTopics}/index.html`);
    assertMatch(dayHtml, /<meta property="article:tag" content="[^"]+"/, `day ${latestDayWithTopics} article:tag`);
    assertMatch(dayHtml, /"about":\[\{"@id":"https:\/\/dawsonwang\.com\/topics\/[^"]+#term"\}/, `day ${latestDayWithTopics} Article about → DefinedTerm graph link`);
    note(`article:tag and Article about asserted on day ${latestDayWithTopics}`);
  } else {
    note('no day with topics found; article:tag and Article about probes skipped');
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
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/topics BreadcrumbList JSON-LD');
  for (const topic of TOPICS) {
    const label = `topic ${topic.slug}`;
    const topicHtml = readGenerated(`topics/${topic.slug}/index.html`);
    assertIncludes(topicHtml, `<link rel="canonical" href="${siteUrl}/topics/${topic.slug}"`, label);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"DefinedTerm".*"@type":"ItemList".*<\/script>/s, `${label} JSON-LD`);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `${label} BreadcrumbList JSON-LD`);
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
  assertIncludes(llms, `${siteUrl}/rss.xml`, 'llms.txt rss link');
  if (latestDay) assertIncludes(llms, `${siteUrl}/day/${latestDay}`, 'llms.txt');

  // /proof portfolio page — CollectionPage + BreadcrumbList JSON-LD with #website graph link
  const proof = readGenerated('proof/index.html');
  assertIncludes(proof, `<link rel="canonical" href="${siteUrl}/proof"`, '/proof canonical');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*<\/script>/s, '/proof CollectionPage JSON-LD');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/proof BreadcrumbList JSON-LD');
  assertIncludes(proof, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/proof JSON-LD isPartOf #website graph link');

  // RSS feed
  assertIncludes(home, '<link rel="alternate" type="application/rss+xml"', 'home rss alternate link');
  assertIncludes(allPosts, '<link rel="alternate" type="application/rss+xml"', '/days rss alternate link');
  assertIncludes(sitemap, `<loc>${siteUrl}/rss.xml</loc>`, 'sitemap rss entry');
  const rss = readGenerated('rss.xml');
  assertIncludes(rss, '<rss version="2.0"', 'rss.xml');
  assertIncludes(rss, 'xmlns:atom="http://www.w3.org/2005/Atom"', 'rss.xml atom namespace');
  assertMatch(rss, /<atom:link[^>]+href="https:\/\/dawsonwang\.com\/rss\.xml"[^>]+rel="self"/, 'rss.xml atom:link self');
  assertIncludes(rss, '<channel>', 'rss.xml channel');
  assertIncludes(rss, `<link>${siteUrl}/</link>`, 'rss.xml channel link');
  assertIncludes(rss, '<language>zh-Hant-TW</language>', 'rss.xml language');
  assertMatch(rss, /<item>[\s\S]*?<link>https:\/\/dawsonwang\.com\/day\/\d+<\/link>/, 'rss.xml item with absolute day link');
  if (latestDay) assertIncludes(rss, `<link>${siteUrl}/day/${latestDay}</link>`, 'rss.xml latest day');

  // /inquiry-received thank-you page is noindexed via BaseLayout `noindex` prop.
  const inquiry = readGenerated('inquiry-received/index.html');
  assertIncludes(inquiry, '<meta name="robots" content="noindex, nofollow"', '/inquiry-received noindex meta robots');
  if (inquiry.includes('content="index, follow')) fail('/inquiry-received leaks index,follow robots directive (should be noindex,nofollow)');
  // Negative-sitemap probe: /inquiry-received must NOT appear in sitemap.xml or llms.txt.
  if (sitemap.includes(`${siteUrl}/inquiry-received`)) fail('sitemap.xml leaks /inquiry-received (should be excluded)');
  if (llms.includes(`${siteUrl}/inquiry-received`)) fail('llms.txt leaks /inquiry-received (should be excluded)');
  // Guard against an accidental global flip: indexable pages must still emit index,follow.
  assertIncludes(home, 'content="index, follow', 'home robots index,follow (regression guard)');
  assertIncludes(search, 'content="index, follow', '/search robots index,follow (regression guard)');
}

for (const line of notes) console.log(`✓ ${line}`);
if (failures.length) {
  console.error('\nSEO generated-output check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('✓ generated SEO and production-flow output contains required metadata, inquiry form, article browsing, search page, crawler files, sitemap coverage, llms.txt, and content routes');
