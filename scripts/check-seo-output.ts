import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TOPICS, DAY_TOPICS } from '../src/data/topics';
import { PROOF_PROJECTS } from '../src/data/proof-projects';
import { PERSON_SAME_AS_URLS } from '../src/data/profiles';

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

function extractRequired(haystack: string, pattern: RegExp, label: string) {
  const match = haystack.match(pattern);
  if (!match?.[1]) {
    fail(`${label} missing pattern ${pattern}`);
    return '';
  }

  return match[1];
}

function decodeJsonStringLiteral(value: string) {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function assertTitleStack(haystack: string, expectedTitle: string, label: string) {
  const escapedTitle = escapeHtml(expectedTitle);
  assertIncludes(haystack, `<title>${escapedTitle}</title>`, `${label} title`);
  assertIncludes(haystack, `<meta property="og:title" content="${escapedTitle}"`, `${label} og:title`);
  assertIncludes(haystack, `<meta name="twitter:title" content="${escapedTitle}"`, `${label} twitter:title`);
}

function assertDiscoveryAlternates(haystack: string, label: string) {
  assertIncludes(haystack, '<link rel="alternate" type="text/plain" title="Dawson Wang AI-readable site summary" href="/llms.txt"', `${label} llms alternate link`);
  assertIncludes(haystack, '<link rel="alternate" type="application/rss+xml" title="Dawson Wang RSS" href="/rss.xml"', `${label} rss alternate link`);
}

function assertSelfHreflangAlternates(haystack: string, routePath: string, label: string) {
  const href = routePath === '/' ? `${siteUrl}/` : `${siteUrl}${routePath}`;
  assertIncludes(haystack, `<link rel="alternate" hreflang="zh-Hant-TW" href="${href}"`, `${label} hreflang zh-Hant-TW`);
  assertIncludes(haystack, `<link rel="alternate" hreflang="x-default" href="${href}"`, `${label} hreflang x-default`);
}

function readPngDimensionsFromAssetUrl(assetUrl: string) {
  try {
    const { pathname } = new URL(assetUrl);
    const imagePath = path.join(root, 'public', pathname.replace(/^\/+/, ''));
    const imageBytes = readFileSync(imagePath);
    if (imageBytes.length < 24 || imageBytes.toString('ascii', 1, 4) !== 'PNG') return undefined;

    return {
      width: imageBytes.readUInt32BE(16),
      height: imageBytes.readUInt32BE(20),
    };
  } catch {
    return undefined;
  }
}

function listSourceDays() {
  const contentDir = path.join(root, '100days/content');
  return readdirSync(contentDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^day\d+$/.test(entry.name))
    .map(entry => {
      const number = Number(entry.name.replace('day', ''));
      const sourcePath = path.join(contentDir, entry.name, 'source.md');
      const publishManifestPath = path.join(contentDir, entry.name, 'publish-manifest.json');
      return { dir: entry.name, number, sourcePath, publishManifestPath };
    })
    .filter(day => Number.isFinite(day.number) && existsSync(day.sourcePath))
    .sort((a, b) => a.number - b.number);
}

function readDayPublishedAt(publishManifestPath: string) {
  if (!existsSync(publishManifestPath)) return undefined;

  try {
    const manifest = JSON.parse(readFileSync(publishManifestPath, 'utf8')) as {
      threads?: { published_at?: string };
      facebook?: { published_at?: string };
      linkedin?: { published_at?: string };
    };
    return manifest.threads?.published_at
      ?? manifest.facebook?.published_at
      ?? manifest.linkedin?.published_at;
  } catch {
    fail(`Unreadable publish manifest: ${path.relative(root, publishManifestPath)}`);
    return undefined;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertSitemapEntry(xml: string, routePath: string, priority: string, changefreq: string, lastmod?: string) {
  const loc = escapeRegExp(`${siteUrl}${routePath}`);
  const lastmodPattern = lastmod ? `<lastmod>${escapeRegExp(lastmod)}<\\/lastmod>\\s*` : '';
  const pattern = new RegExp(
    `<url>\\s*<loc>${loc}<\\/loc>\\s*${lastmodPattern}<changefreq>${escapeRegExp(changefreq)}<\\/changefreq>\\s*<priority>${escapeRegExp(priority)}<\\/priority>\\s*<\\/url>`
  );
  assertMatch(xml, pattern, `sitemap ${routePath}`);
}

if (!existsSync(outDir)) {
  fail(`Generated output directory does not exist: ${path.relative(root, outDir)}`);
} else {
  const days = listSourceDays();
  const latestDay = days.at(-1)?.number;
  const dayPublishedAtByNumber = new Map(days.map(day => [day.number, readDayPublishedAt(day.publishManifestPath)]));
  const latestPublishedAt = Array.from(dayPublishedAtByNumber.values())
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const taggedTopicSlugs = TOPICS
    .filter(topic => Object.values(DAY_TOPICS).some(slugs => slugs.includes(topic.slug)))
    .map(topic => topic.slug);
  const topicPublishedAtBySlug = new Map(taggedTopicSlugs.map(slug => {
    const publishedAt = Object.entries(DAY_TOPICS)
      .filter(([, slugs]) => slugs.includes(slug))
      .map(([dayNumber]) => dayPublishedAtByNumber.get(Number(dayNumber)))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    return [slug, publishedAt];
  }));
  note(`source day count: ${days.length}${latestDay ? `, latest day: ${latestDay}` : ''}`);

  const home = readGenerated('index.html');
  const expectedHomeTitle = 'Dawson Wang — AI 工具落地實踐者';
  assertIncludes(home, `<link rel="canonical" href="${siteUrl}/"`, 'home');
  assertSelfHreflangAlternates(home, '/', 'home');
  assertTitleStack(home, expectedHomeTitle, 'home');
  assertMatch(home, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, 'home');
  assertIncludes(home, `<meta property="og:url" content="${siteUrl}/"`, 'home');
  assertIncludes(home, '<meta name="twitter:site" content="@dawson54068"', 'home twitter:site');
  assertIncludes(home, '<meta name="twitter:creator" content="@dawson54068"', 'home twitter:creator');
  assertMatch(home, /<meta property="og:image" content="https:\/\/dawsonwang\.com\/[^"]+"\s*\/?\s*>/, 'home');
  assertIncludes(home, '<meta property="og:image:width" content="1200"', 'home og:image:width');
  assertIncludes(home, '<meta property="og:image:height" content="630"', 'home og:image:height');
  assertMatch(home, /<meta property="og:image:alt" content="[^"]+"/, 'home og:image:alt');
  assertMatch(home, /<meta name="twitter:image" content="https:\/\/dawsonwang\.com\/[^"]+"\s*\/?\s*>/, 'home');
  assertMatch(home, /<meta name="twitter:image:alt" content="[^"]+"/, 'home twitter:image:alt');
  assertMatch(home, /<script type="application\/ld\+json"[^>]*>.*"@type":"Person".*"@type":"WebSite".*<\/script>/s, 'home JSON-LD');
  assertMatch(home, /"@type":"Person"[^}]*"description":"/, 'home Person description');
  assertMatch(home, /"@type":"Person"[\s\S]*?"knowsLanguage":\["zh-Hant-TW","en"\]/, 'home Person knowsLanguage');
  // Root-graph link: Person → ProfessionalService (joins the commercial-intent subtree into the Person node).
  assertMatch(home, new RegExp(`"@type":"Person"[\\s\\S]*?"worksFor":\\{"@id":"${siteUrl}/#ai-workflow-service"\\}`), 'home Person worksFor → #ai-workflow-service graph link');
  // Knowledge Graph entity-linking: Person.sameAs array of canonical off-site profiles
  // (sourced from src/data/profiles.ts). At minimum the GitHub URL must be present.
  assertMatch(home, /"@type":"Person"[\s\S]*?"sameAs":\[[^\]]*"https:\/\/github\.com\/andrew54068"/, 'home Person sameAs contains GitHub URL');
  for (const profileUrl of PERSON_SAME_AS_URLS) {
    const escaped = profileUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assertMatch(home, new RegExp(`"@type":"Person"[\\s\\S]*?"sameAs":\\[[^\\]]*"${escaped}"`), `home Person sameAs contains ${profileUrl}`);
  }
  assertMatch(home, /"@type":"WebSite"[^}]*"description":"/, 'home WebSite description');
  assertMatch(home, /"@type":"WebSite"[\s\S]*?"potentialAction":\{"@type":"SearchAction","target":"https:\/\/dawsonwang\.com\/search\?q=\{search_term_string\}","query-input":"required name=search_term_string"\}/, 'home WebSite SearchAction');
  // Bidirectional Person ↔ WebSite root-graph links (PR/issue #55 — root-graph enrichment).
  assertMatch(home, /"@type":"Person"[\s\S]*?"mainEntityOfPage":\{"@id":"https:\/\/dawsonwang\.com\/#website"\}/, 'home Person mainEntityOfPage → #website graph link');
  assertMatch(home, /"@type":"WebSite"[\s\S]*?"mainEntity":\{"@id":"https:\/\/dawsonwang\.com\/#person"\}/, 'home WebSite mainEntity → #person graph link');
  assertMatch(home, /"@type":"WebSite"[\s\S]*?"copyrightHolder":\{"@id":"https:\/\/dawsonwang\.com\/#person"\}/, 'home WebSite copyrightHolder → #person graph link');
  // ProfessionalService OfferCatalog enrichment: mirrors src/data/services.ts (3 tier services).
  assertMatch(home, /"@type":"ProfessionalService"[\s\S]*?"hasOfferCatalog":\{[\s\S]*?"@type":"OfferCatalog"/, 'home ProfessionalService hasOfferCatalog');
  // Graph links back to the root WebSite node so the ProfessionalService + its OfferCatalog are not orphan nodes.
  assertMatch(home, new RegExp(`"@type":"ProfessionalService"[\\s\\S]*?"isPartOf":\\{"@id":"${siteUrl}/#website"\\}`), 'home ProfessionalService isPartOf → #website graph link');
  assertMatch(home, new RegExp(`"@type":"OfferCatalog"[\\s\\S]*?"isPartOf":\\{"@id":"${siteUrl}/#website"\\}`), 'home OfferCatalog isPartOf → #website graph link');
  assertIncludes(home, `"@id":"${siteUrl}/#ai-workflow-service-catalog"`, 'home OfferCatalog @id');
  const homeOfferCount = countMatches(home, /"@type":"Offer","position":\d+/g);
  if (homeOfferCount < 3) fail(`home OfferCatalog has only ${homeOfferCount} Offer items (expected >=3 — one per service tier)`);
  assertMatch(home, /"@type":"Offer"[\s\S]*?"itemOffered":\{"@type":"Service"[\s\S]*?"provider":\{"@id":"https:\/\/dawsonwang\.com\/#person"\}/, 'home Offer.itemOffered Service.provider -> #person graph link');
  assertMatch(home, /"@type":"Offer"[^}]*"url":"https:\/\/dawsonwang\.com\/#inquire"/, 'home Offer.url absolute -> #inquire');
  assertIncludes(home, 'Dawson Wang', 'home');
  assertIncludes(home, 'AI 工具落地', 'home');
  assertDiscoveryAlternates(home, 'home');
  assertIncludes(home, 'action="/api/inquiry"', 'home inquiry form');
  assertIncludes(home, 'method="POST"', 'home inquiry form');
  for (const field of ['name', 'email', 'company', 'goal', 'team_size', 'budget', 'timeline', 'hp_field']) {
    assertIncludes(home, `name="${field}"`, `home inquiry form field ${field}`);
  }
  assertIncludes(home, 'href="/#inquire"', 'home appointment CTA');
  // Negative probe: home is type=website, must NOT emit article:* OG tags.
  if (home.includes('article:published_time')) fail('home leaks article:published_time meta (should be type=website)');

  const allPosts = readGenerated('days/index.html');
  assertTitleStack(allPosts, 'AI 工具落地文章索引 | Dawson Wang', 'all posts');
  assertIncludes(allPosts, `<link rel="canonical" href="${siteUrl}/days"`, 'all posts');
  assertSelfHreflangAlternates(allPosts, '/days', 'all posts');
  assertMatch(allPosts, /<meta name="description" content="瀏覽 Dawson Wang 連續 \d+ 天公開的 AI 工具落地文章：[^"]+"\s*\/?\s*>/, 'all posts meta description');
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
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(allPosts, `"@id":"${siteUrl}/days#breadcrumb"`, '/days BreadcrumbList @id');
  assertMatch(allPosts, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/days#breadcrumb"\\}`), '/days CollectionPage breadcrumb → #breadcrumb graph link');

  const search = readGenerated('search/index.html');
  assertTitleStack(search, 'AI 工作流文章搜尋 | Dawson Wang', 'search');
  assertIncludes(search, `<link rel="canonical" href="${siteUrl}/search"`, 'search');
  assertSelfHreflangAlternates(search, '/search', 'search');
  assertMatch(search, /<meta name="description" content="從 \d+ 篇 Dawson Wang 的 AI 工具落地日誌中，用關鍵字或語意搜尋 Claude Code、MCP、automation、內容流程與團隊導入案例。"\s*\/?\s*>/, 'search meta description');
  assertIncludes(search, 'id="search-form"', 'search form');
  assertIncludes(search, 'type="search"', 'search form');
  assertIncludes(search, 'value="keyword"', 'search keyword mode');
  assertIncludes(search, 'value="semantic"', 'search semantic mode');
  assertIncludes(search, 'id="search-results"', 'search results');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"SearchResultsPage".*<\/script>/s, '/search SearchResultsPage JSON-LD');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/search BreadcrumbList JSON-LD');
  assertDiscoveryAlternates(search, '/search');
  assertIncludes(search, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/search JSON-LD isPartOf #website graph link');
  assertMatch(search, /"target":"https:\/\/dawsonwang\.com\/search\?q=\{search_term_string\}"/, '/search SearchAction target');
  // BreadcrumbList @id + SearchResultsPage → BreadcrumbList graph link (issue #68).
  assertIncludes(search, `"@id":"${siteUrl}/search#breadcrumb"`, '/search BreadcrumbList @id');
  assertMatch(search, new RegExp(`"@type":"SearchResultsPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/search#breadcrumb"\\}`), '/search SearchResultsPage breadcrumb → #breadcrumb graph link');

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

  for (const day of generatedDayPages) {
    const label = `day ${day.number}`;
    const dayHtml = readGenerated(`day/${day.number}/index.html`);
    const headline = decodeJsonStringLiteral(extractRequired(dayHtml, /"@type":"Article"[\s\S]*?"headline":"((?:\\.|[^"])*)"/, `${label} Article headline`));
    const expectedTitle = headline ? `${headline} | Dawson Wang` : '';
    assertIncludes(dayHtml, `<link rel="canonical" href="${siteUrl}/day/${day.number}"`, `${label} canonical`);
    assertSelfHreflangAlternates(dayHtml, `/day/${day.number}`, label);
    assertTitleStack(dayHtml, expectedTitle, label);
    assertDiscoveryAlternates(dayHtml, label);
    assertIncludes(dayHtml, '<meta property="og:type" content="article"', `${label} og:type article`);
  }

  if (latestDay) {
    const dayHtml = readGenerated(`day/${latestDay}/index.html`);
    const latestDayHeadline = decodeJsonStringLiteral(extractRequired(dayHtml, /"@type":"Article"[\s\S]*?"headline":"((?:\\.|[^"])*)"/, `day ${latestDay} Article headline`));
    const expectedLatestDayTitle = latestDayHeadline ? `${latestDayHeadline} | Dawson Wang` : '';
    assertIncludes(dayHtml, `<link rel="canonical" href="${siteUrl}/day/${latestDay}"`, `day ${latestDay}`);
    assertSelfHreflangAlternates(dayHtml, `/day/${latestDay}`, `day ${latestDay}`);
    assertTitleStack(dayHtml, expectedLatestDayTitle, `day ${latestDay}`);
    assertIncludes(dayHtml, '<meta property="og:type" content="article"', `day ${latestDay}`);
    assertIncludes(dayHtml, '<meta name="twitter:site" content="@dawson54068"', `day ${latestDay} twitter:site`);
    assertIncludes(dayHtml, '<meta name="twitter:creator" content="@dawson54068"', `day ${latestDay} twitter:creator`);
    assertMatch(dayHtml, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, `day ${latestDay}`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"Article".*<\/script>/s, `day ${latestDay} Article JSON-LD`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `day ${latestDay} BreadcrumbList JSON-LD`);
    // BreadcrumbList @id + Article → BreadcrumbList graph link (issue #68).
    assertIncludes(dayHtml, `"@id":"${siteUrl}/day/${latestDay}#breadcrumb"`, `day ${latestDay} BreadcrumbList @id`);
    assertMatch(dayHtml, new RegExp(`"@type":"Article"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/day/${latestDay}#breadcrumb"\\}`), `day ${latestDay} Article breadcrumb → #breadcrumb graph link`);
    // Article enrichment (wordCount + isPartOf are stable across all days; articleSection gated below).
    assertMatch(dayHtml, /"wordCount":\d+/, `day ${latestDay} Article wordCount`);
    assertIncludes(dayHtml, `"isPartOf":{"@id":"${siteUrl}/#website"}`, `day ${latestDay} Article isPartOf`);
    assertIncludes(dayHtml, '"isAccessibleForFree":true', `day ${latestDay} Article isAccessibleForFree`);
    assertIncludes(dayHtml, `"copyrightHolder":{"@id":"${siteUrl}/#person"}`, `day ${latestDay} Article copyrightHolder → #person graph link`);
    assertIncludes(dayHtml, `"creator":{"@id":"${siteUrl}/#person"}`, `day ${latestDay} Article creator → #person graph link`);
    assertIncludes(dayHtml, `"accountablePerson":{"@id":"${siteUrl}/#person"}`, `day ${latestDay} Article accountablePerson → #person graph link`);
    assertIncludes(dayHtml, `"editor":{"@id":"${siteUrl}/#person"}`, `day ${latestDay} Article editor → #person graph link`);
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
    const latestDayOgImage = dayHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!latestDayOgImage) {
      fail(`day ${latestDay} missing og:image meta`);
    } else {
      const latestDayOgImageDimensions = readPngDimensionsFromAssetUrl(latestDayOgImage);
      if (!latestDayOgImageDimensions) {
        fail(`day ${latestDay} og:image dimensions unreadable for ${latestDayOgImage}`);
      } else {
        assertIncludes(dayHtml, `<meta property="og:image:width" content="${latestDayOgImageDimensions.width}"`, `day ${latestDay} og:image:width`);
        assertIncludes(dayHtml, `<meta property="og:image:height" content="${latestDayOgImageDimensions.height}"`, `day ${latestDay} og:image:height`);
      }
    }
    assertDiscoveryAlternates(dayHtml, `day ${latestDay}`);
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

  const topicsIndex = readGenerated('topics/index.html');
  assertTitleStack(topicsIndex, 'AI 工具落地主題索引 | Dawson Wang', 'topics index');
  assertIncludes(topicsIndex, `<link rel="canonical" href="${siteUrl}/topics"`, 'topics index');
  assertSelfHreflangAlternates(topicsIndex, '/topics', 'topics index');
  assertMatch(topicsIndex, /<meta name="description" content="依主題瀏覽 Dawson Wang 的 \d+ 個 AI 工具落地分類：agent workflow、Claude Code、MCP、自動化、內容流程與團隊導入。"\s*\/?\s*>/, 'topics index meta description');
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"ItemList".*<\/script>/s, 'topics index JSON-LD');
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/topics BreadcrumbList JSON-LD');
  assertDiscoveryAlternates(topicsIndex, '/topics');
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(topicsIndex, `"@id":"${siteUrl}/topics#breadcrumb"`, '/topics BreadcrumbList @id');
  assertMatch(topicsIndex, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/topics#breadcrumb"\\}`), '/topics CollectionPage breadcrumb → #breadcrumb graph link');
  // DefinedTermSet hub: models topics as a controlled vocabulary, with isPartOf graph link up to #website
  // and one hasDefinedTerm reference per TOPICS entry (generated from src/data/topics.ts — no literal slugs in JSON-LD source).
  assertMatch(topicsIndex, /"@type":"DefinedTermSet"[\s\S]*?"@id":"https:\/\/dawsonwang\.com\/topics#topic-taxonomy"/, '/topics DefinedTermSet @id');
  assertMatch(topicsIndex, /"@type":"DefinedTermSet"[\s\S]*?"isPartOf":\{"@id":"https:\/\/dawsonwang\.com\/#website"\}/, '/topics DefinedTermSet isPartOf → #website graph link');
  for (const topic of TOPICS) {
    assertIncludes(topicsIndex, `{"@id":"${siteUrl}/topics/${topic.slug}#term"}`, `/topics DefinedTermSet hasDefinedTerm → ${topic.slug}#term graph link`);
  }
  // Count guard: future TOPICS growth ships green automatically without a literal-number edit.
  const taxonomyTermRefCount = countMatches(topicsIndex, /"@id":"https:\/\/dawsonwang\.com\/topics\/[^"]+#term"/g);
  if (taxonomyTermRefCount < TOPICS.length) fail(`/topics DefinedTermSet term-ref count ${taxonomyTermRefCount} < TOPICS.length ${TOPICS.length}`);
  for (const topic of TOPICS) {
    const label = `topic ${topic.slug}`;
    const topicHtml = readGenerated(`topics/${topic.slug}/index.html`);
    assertTitleStack(topicHtml, `${topic.title} AI 實作文章 | Dawson Wang`, label);
    assertIncludes(topicHtml, `<link rel="canonical" href="${siteUrl}/topics/${topic.slug}"`, label);
    assertSelfHreflangAlternates(topicHtml, `/topics/${topic.slug}`, label);
    assertMatch(topicHtml, /<meta name="description" content="[^"]+ 收錄 \d+ 篇 Dawson Wang 的 AI 工具落地文章與案例。"\s*\/?\s*>/, `${label} meta description`);
    assertIncludes(topicHtml, '<meta name="twitter:site" content="@dawson54068"', `${label} twitter:site`);
    assertIncludes(topicHtml, '<meta name="twitter:creator" content="@dawson54068"', `${label} twitter:creator`);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"DefinedTerm".*"@type":"ItemList".*<\/script>/s, `${label} JSON-LD`);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `${label} BreadcrumbList JSON-LD`);
    assertDiscoveryAlternates(topicHtml, label);
    // Back-link from per-topic DefinedTerm → taxonomy hub on /topics (closes the topic-graph subgraph-orphan).
    assertMatch(topicHtml, /"@type":"DefinedTerm"[\s\S]*?"inDefinedTermSet":\{"@id":"https:\/\/dawsonwang\.com\/topics#topic-taxonomy"\}/, `${label} DefinedTerm inDefinedTermSet → #topic-taxonomy back-link`);
    // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68) — wrapped in the TOPICS loop so future
    // topic growth ships green automatically (same pattern as the DefinedTermSet ref-count guard).
    assertIncludes(topicHtml, `"@id":"${siteUrl}/topics/${topic.slug}#breadcrumb"`, `${label} BreadcrumbList @id`);
    assertMatch(topicHtml, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/topics/${topic.slug}#breadcrumb"\\}`), `${label} CollectionPage breadcrumb → #breadcrumb graph link`);
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
  if (latestPublishedAt) {
    assertSitemapEntry(sitemap, '/', '1.0', 'weekly', latestPublishedAt);
    assertSitemapEntry(sitemap, '/proof', '0.9', 'weekly', latestPublishedAt);
    assertSitemapEntry(sitemap, '/days', '0.9', 'daily', latestPublishedAt);
    assertSitemapEntry(sitemap, '/topics', '0.7', 'weekly', latestPublishedAt);
    assertSitemapEntry(sitemap, '/search', '0.5', 'monthly', latestPublishedAt);
    assertSitemapEntry(sitemap, '/rss.xml', '0.6', 'daily', latestPublishedAt);
  }
  for (const [slug, publishedAt] of topicPublishedAtBySlug.entries()) {
    if (!publishedAt) continue;
    assertSitemapEntry(sitemap, `/topics/${slug}`, '0.7', 'weekly', publishedAt);
  }
  if (latestDay) {
    assertIncludes(sitemap, `<loc>${siteUrl}/day/${latestDay}</loc>`, 'sitemap');
    const latestDayPublishedAt = dayPublishedAtByNumber.get(latestDay);
    if (latestDayPublishedAt) assertSitemapEntry(sitemap, `/day/${latestDay}`, '0.8', 'monthly', latestDayPublishedAt);
  }
  const sitemapDayCount = Array.from(sitemap.matchAll(/<loc>https:\/\/dawsonwang\.com\/day\/\d+<\/loc>/g)).length;
  if (sitemapDayCount !== days.length) fail(`Sitemap day URL count mismatch: ${sitemapDayCount}/${days.length}`);

  const robots = readGenerated('robots.txt');
  assertIncludes(robots, `Sitemap: ${siteUrl}/sitemap.xml`, 'robots.txt');
  assertIncludes(robots, 'Disallow: /api/', 'robots.txt');

  const llms = readGenerated('llms.txt');
  assertIncludes(llms, '# Dawson Wang', 'llms.txt');
  for (const llmsCorePath of ['/', '/proof', '/days', '/topics', '/search']) {
    const expectedUrl = llmsCorePath === '/' ? `${siteUrl}/` : `${siteUrl}${llmsCorePath}`;
    assertIncludes(llms, expectedUrl, `llms.txt core page ${llmsCorePath}`);
  }
  assertIncludes(llms, `${siteUrl}/rss.xml`, 'llms.txt rss link');
  if (latestDay) assertIncludes(llms, `${siteUrl}/day/${latestDay}`, 'llms.txt');

  // /proof portfolio page — CollectionPage + BreadcrumbList JSON-LD with #website graph link
  const proof = readGenerated('proof/index.html');
  assertTitleStack(proof, 'AI 工具落地案例與作品集 | Dawson Wang', '/proof');
  assertIncludes(proof, `<link rel="canonical" href="${siteUrl}/proof"`, '/proof canonical');
  assertSelfHreflangAlternates(proof, '/proof', '/proof');
  assertMatch(proof, /<meta name="description" content="\d+ 天 AI 工具落地公開記錄：實作專案、工作流、開源工具、諮詢案例與可驗收成果，幫你快速判斷 Dawson Wang 是否適合導入你的團隊。"\s*\/?\s*>/, '/proof meta description');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*<\/script>/s, '/proof CollectionPage JSON-LD');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/proof BreadcrumbList JSON-LD');
  assertDiscoveryAlternates(proof, '/proof');
  assertIncludes(proof, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/proof JSON-LD isPartOf #website graph link');
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(proof, `"@id":"${siteUrl}/proof#breadcrumb"`, '/proof BreadcrumbList @id');
  assertMatch(proof, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/proof#breadcrumb"\\}`), '/proof CollectionPage breadcrumb → #breadcrumb graph link');
  // mainEntity ItemList of shipped projects — single source of truth in src/data/proof-projects.ts
  assertMatch(proof, /"@type":"CollectionPage"[\s\S]*?"mainEntity":\{[^}]*"@type":"ItemList"/, '/proof CollectionPage→ItemList mainEntity link');
  assertMatch(proof, new RegExp(`"mainEntity":\\{[^}]*"numberOfItems":${PROOF_PROJECTS.length}\\b`), '/proof ItemList numberOfItems matches PROOF_PROJECTS.length');
  // Count CreativeWork occurrences in the structuredData script (each PROOF_PROJECTS item emits exactly one
  // CreativeWork; BreadcrumbList items are not CreativeWork, so this isolates the project count without
  // accidentally counting BreadcrumbList ListItems that share the same script tag).
  const proofCreativeWorkCount = countMatches(proof, /"@type":"CreativeWork"/g);
  if (proofCreativeWorkCount !== PROOF_PROJECTS.length) {
    fail(`/proof CreativeWork count ${proofCreativeWorkCount} !== PROOF_PROJECTS.length ${PROOF_PROJECTS.length}`);
  }
  // Spot-check that each PROOF_PROJECTS entry's name appears inside the JSON-LD (escaped form).
  for (const project of PROOF_PROJECTS) {
    const escaped = JSON.stringify(project.name).slice(1, -1).replace(/</g, '\\u003c');
    assertIncludes(proof, escaped, `/proof ItemList contains project name ${project.name}`);
  }

  // RSS feed
  assertDiscoveryAlternates(allPosts, '/days');
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
  // /404 custom error page is noindexed via BaseLayout `noindex` prop and must navigate back into the content graph.
  const notFound = readGenerated('404.html');
  assertIncludes(notFound, '<meta name="robots" content="noindex, nofollow"', '/404 noindex meta robots');
  if (notFound.includes('content="index, follow')) fail('/404 leaks index,follow robots directive (should be noindex,nofollow)');
  // Negative-sitemap/llms probe: /404 must NOT appear in sitemap.xml or llms.txt.
  if (sitemap.includes(`${siteUrl}/404`)) fail('sitemap.xml leaks /404 (should be excluded)');
  if (llms.includes(`${siteUrl}/404`)) fail('llms.txt leaks /404 (should be excluded)');
  // Internal-link assertions: 404 page must navigate back into the content graph (no dead end).
  for (const href of ['href="/"', 'href="/days"', 'href="/topics"', 'href="/search"']) {
    assertIncludes(notFound, href, `/404 navigation link ${href}`);
  }
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
