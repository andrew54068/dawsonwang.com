import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TOPICS, DAY_TOPICS } from '../src/data/topics';
import { PROOF_PROJECTS } from '../src/data/proof-projects';
import { SERVICES } from '../src/data/services';
import { PERSON_SAME_AS_URLS, PERSON_X_URL } from '../src/data/profiles';

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
const siteLanguage = 'zh-Hant-TW';
const siteLocale = 'zh_TW';
const defaultOgImageUrl = `${siteUrl}/og-default.png`;
const defaultOgImageAlt = 'Dawson Wang — AI 工具落地實踐者';
const socialXHandle = '@dawson54068';
const expectedPersonSameAsUrls = Array.from(new Set([...PERSON_SAME_AS_URLS, PERSON_X_URL]));

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

function assertCountEquals(actual: number, expected: number, label: string) {
  if (actual !== expected) fail(`${label} count ${actual} !== expected ${expected}`);
}

function extractRequired(haystack: string, pattern: RegExp, label: string) {
  const match = haystack.match(pattern);
  if (!match?.[1]) {
    fail(`${label} missing pattern ${pattern}`);
    return '';
  }

  return match[1];
}

function decodeJsonStringLiteral(value: string, label?: string) {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    if (label) fail(`${label} is not a valid JSON string literal`);
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

function escapeJsonString(value: string) {
  return JSON.stringify(value).slice(1, -1).replace(/</g, '\\u003c');
}

function assertTitleStack(haystack: string, expectedTitle: string, label: string) {
  const escapedTitle = escapeHtml(expectedTitle);
  assertIncludes(haystack, `<title>${escapedTitle}</title>`, `${label} title`);
  assertIncludes(haystack, `<meta property="og:title" content="${escapedTitle}"`, `${label} og:title`);
  assertIncludes(haystack, `<meta name="twitter:title" content="${escapedTitle}"`, `${label} twitter:title`);
}

function assertDescriptionStack(haystack: string, label: string) {
  const renderedDescription = extractRequired(
    haystack,
    /<meta name="description" content="([^"]*)"\s*\/?\s*>/,
    `${label} meta description`
  );
  if (!renderedDescription) return;

  assertIncludes(haystack, `<meta property="og:description" content="${renderedDescription}"`, `${label} og:description`);
  assertIncludes(haystack, `<meta name="twitter:description" content="${renderedDescription}"`, `${label} twitter:description`);
}

function assertCanonicalOgUrlParity(haystack: string, label: string) {
  const canonicalUrl = extractRequired(
    haystack,
    /<link rel="canonical" href="([^"]+)"\s*\/?\s*>/,
    `${label} canonical href`
  );
  if (!canonicalUrl) return;

  assertIncludes(haystack, `<meta property="og:url" content="${canonicalUrl}"`, `${label} og:url matches canonical`);
}

function assertDiscoveryAlternates(haystack: string, label: string) {
  assertIncludes(haystack, '<link rel="alternate" type="text/plain" title="Dawson Wang AI-readable site summary" href="/llms.txt"', `${label} llms alternate link`);
  assertIncludes(haystack, '<link rel="alternate" type="application/rss+xml" title="Dawson Wang RSS" href="/rss.xml"', `${label} rss alternate link`);
}

function assertLocaleStack(haystack: string, label: string) {
  assertIncludes(haystack, `<html lang="${siteLanguage}">`, `${label} html lang`);
  assertIncludes(haystack, `<meta property="og:locale" content="${siteLocale}"`, `${label} og:locale`);
}

function assertSelfHreflangAlternates(haystack: string, routePath: string, label: string) {
  const href = routePath === '/' ? `${siteUrl}/` : `${siteUrl}${routePath}`;
  assertIncludes(haystack, `<link rel="alternate" hreflang="${siteLanguage}" href="${href}"`, `${label} hreflang ${siteLanguage}`);
  assertIncludes(haystack, `<link rel="alternate" hreflang="x-default" href="${href}"`, `${label} hreflang x-default`);
}

function assertNonArticleSharedLayoutContract(haystack: string, routePath: string, label: string) {
  assertIncludes(haystack, '<meta property="og:type" content="website"', `${label} og:type website`);
  assertSelfHreflangAlternates(haystack, routePath, label);
  assertCountEquals(countMatches(haystack, /<link rel="alternate" hreflang="[^"]+"/g), 2, `${label} hreflang alternate link`);
  assertDiscoveryAlternates(haystack, label);
  assertCountEquals(countMatches(haystack, /<link rel="alternate" type="[^"]+"/g), 2, `${label} discovery alternate link`);

  const leakedArticleMetaProperties = Array.from(haystack.matchAll(/<meta property="(article:[^"]+)"/g))
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value));
  if (leakedArticleMetaProperties.length > 0) {
    const leakedPropertyList = Array.from(new Set(leakedArticleMetaProperties)).join(', ');
    fail(`${label} leaks article:* meta (${leakedPropertyList}) (should be type=website)`);
  }
}

function assertDefaultSocialCardStack(haystack: string, label: string) {
  assertIncludes(haystack, `<meta property="og:image" content="${defaultOgImageUrl}"`, `${label} og:image default absolute URL`);
  assertIncludes(haystack, '<meta property="og:image:width" content="1200"', `${label} og:image:width`);
  assertIncludes(haystack, '<meta property="og:image:height" content="630"', `${label} og:image:height`);
  assertIncludes(haystack, `<meta property="og:image:alt" content="${defaultOgImageAlt}"`, `${label} og:image:alt`);
  assertIncludes(haystack, '<meta name="twitter:card" content="summary_large_image"', `${label} twitter:card`);
  assertIncludes(haystack, `<meta name="twitter:site" content="${socialXHandle}"`, `${label} twitter:site`);
  assertIncludes(haystack, `<meta name="twitter:creator" content="${socialXHandle}"`, `${label} twitter:creator`);
  assertIncludes(haystack, `<meta name="twitter:image" content="${defaultOgImageUrl}"`, `${label} twitter:image default absolute URL`);
  assertIncludes(haystack, `<meta name="twitter:image:alt" content="${defaultOgImageAlt}"`, `${label} twitter:image:alt`);
}

function assertJsonLdInLanguage(haystack: string, nodeType: string, label: string) {
  assertMatch(
    haystack,
    new RegExp(`"@type":"${escapeRegExp(nodeType)}"[\\s\\S]*?"inLanguage":"zh-Hant-TW"`),
    `${label} ${nodeType} inLanguage`
  );
}

function extractJsonLdScript(haystack: string, label: string) {
  return extractRequired(
    haystack,
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    `${label} JSON-LD script`
  );
}

function extractArticleHeadline(haystack: string, label: string) {
  const encodedHeadline = extractRequired(
    haystack,
    /"@type":"Article"[\s\S]*?"headline":"((?:\\.|[^"])*)"/,
    `${label} Article headline`
  );
  return encodedHeadline ? decodeJsonStringLiteral(encodedHeadline, `${label} Article headline`) : '';
}

function assertDayArticleOwnershipTrustCluster(dayHtml: string, dayNumber: number, label: string) {
  const dayJsonLd = extractJsonLdScript(dayHtml, `${label} JSON-LD`);
  assertJsonLdInLanguage(dayJsonLd, 'Article', label);
  assertIncludes(dayJsonLd, `"author":{"@id":"${siteUrl}/#person"}`, `${label} Article author → #person graph link`);
  assertIncludes(dayJsonLd, `"publisher":{"@id":"${siteUrl}/#person"}`, `${label} Article publisher → #person graph link`);
  assertIncludes(dayJsonLd, `"isPartOf":{"@id":"${siteUrl}/#website"}`, `${label} Article isPartOf`);
  assertIncludes(dayJsonLd, '"isAccessibleForFree":true', `${label} Article isAccessibleForFree`);
  assertIncludes(dayJsonLd, `"copyrightHolder":{"@id":"${siteUrl}/#person"}`, `${label} Article copyrightHolder → #person graph link`);
  assertIncludes(dayJsonLd, `"creator":{"@id":"${siteUrl}/#person"}`, `${label} Article creator → #person graph link`);
  assertIncludes(dayJsonLd, `"accountablePerson":{"@id":"${siteUrl}/#person"}`, `${label} Article accountablePerson → #person graph link`);
  assertIncludes(dayJsonLd, `"editor":{"@id":"${siteUrl}/#person"}`, `${label} Article editor → #person graph link`);
  assertIncludes(dayJsonLd, `"mainEntityOfPage":{"@type":"WebPage","@id":"${siteUrl}/day/${dayNumber}"}`, `${label} Article mainEntityOfPage WebPage`);
  if (/"mainEntityOfPage":"https:/.test(dayJsonLd)) fail(`${label} Article mainEntityOfPage regressed to bare URL string`);
  assertIncludes(dayHtml, `<meta property="article:author" content="${siteUrl}/#person"`, `${label} article:author`);
}

function assertRootEntityGraph(jsonLd: string, label: string) {
  assertMatch(jsonLd, new RegExp(`"@type":"Person"[\\s\\S]*?"@id":"${siteUrl}/#person"`), `${label} Person root node @id`);
  assertMatch(jsonLd, new RegExp(`"@type":"Person"[\\s\\S]*?"mainEntityOfPage":\\{"@id":"${siteUrl}/#website"\\}`), `${label} Person mainEntityOfPage → #website graph link`);
  assertMatch(jsonLd, new RegExp(`"@type":"WebSite"[\\s\\S]*?"@id":"${siteUrl}/#website"`), `${label} WebSite root node @id`);
  assertMatch(jsonLd, new RegExp(`"@type":"WebSite"[\\s\\S]*?"publisher":\\{"@id":"${siteUrl}/#person"\\}`), `${label} WebSite publisher → #person graph link`);
  assertMatch(jsonLd, new RegExp(`"@type":"WebSite"[\\s\\S]*?"mainEntity":\\{"@id":"${siteUrl}/#person"\\}`), `${label} WebSite mainEntity → #person graph link`);
  assertMatch(jsonLd, new RegExp(`"@type":"WebSite"[\\s\\S]*?"copyrightHolder":\\{"@id":"${siteUrl}/#person"\\}`), `${label} WebSite copyrightHolder → #person graph link`);
  assertMatch(jsonLd, /"@type":"WebSite"[\s\S]*?"potentialAction":\{"@type":"SearchAction","target":"https:\/\/dawsonwang\.com\/search\?q=\{search_term_string\}","query-input":"required name=search_term_string"\}/, `${label} WebSite SearchAction`);
}

function assertOmitsRootEntityGraph(haystack: string, label: string) {
  if (/"@type":"Person"/.test(haystack)) fail(`${label} should omit root Person JSON-LD on noindex utility pages`);
  if (/"@type":"WebSite"/.test(haystack)) fail(`${label} should omit root WebSite JSON-LD on noindex utility pages`);
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
    for (const candidate of [manifest.threads?.published_at, manifest.facebook?.published_at, manifest.linkedin?.published_at]) {
      const normalized = candidate?.trim();
      if (normalized) return normalized;
    }
    return undefined;
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
  const lastmodPattern = lastmod
    ? `<lastmod>${escapeRegExp(lastmod)}<\\/lastmod>\\s*`
    : `(?!<lastmod>)`;
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
  const sourceDayNumberSet = new Set(days.map(day => day.number));
  const dayPublishedAtByNumber = new Map(days.map(day => [day.number, readDayPublishedAt(day.publishManifestPath)]));
  const latestPublishedAt = Array.from(dayPublishedAtByNumber.values())
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const topicTitleBySlug = new Map(TOPICS.map(topic => [topic.slug, topic.title]));
  const activeTopicSlugSet = new Set(
    Object.entries(DAY_TOPICS)
      .filter(([dayNumber]) => sourceDayNumberSet.has(Number(dayNumber)))
      .flatMap(([, slugs]) => slugs)
  );
  const activeTopics = TOPICS.filter(topic => activeTopicSlugSet.has(topic.slug));
  const zeroPostTopics = TOPICS.filter(topic => !activeTopicSlugSet.has(topic.slug));
  const topicDayCountBySlug = new Map(activeTopics.map(topic => {
    const topicDayCount = Object.entries(DAY_TOPICS)
      .filter(([dayNumber, slugs]) => sourceDayNumberSet.has(Number(dayNumber)) && slugs.includes(topic.slug))
      .length;
    return [topic.slug, topicDayCount];
  }));
  const topicPublishedAtBySlug = new Map(activeTopics.map(topic => {
    const slug = topic.slug;
    const publishedAt = Object.entries(DAY_TOPICS)
      .filter(([dayNumber, slugs]) => sourceDayNumberSet.has(Number(dayNumber)) && slugs.includes(slug))
      .map(([dayNumber]) => dayPublishedAtByNumber.get(Number(dayNumber)))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);
    return [slug, publishedAt];
  }));
  const generatedDayPages = days.filter(day => existsSync(path.join(outDir, `day/${day.number}/index.html`)));
  const latestGeneratedDayWithPublishedAt = generatedDayPages
    .slice()
    .reverse()
    .find(day => Boolean(dayPublishedAtByNumber.get(day.number)))
    ?.number;
  note(`source day count: ${days.length}${latestDay ? `, latest day: ${latestDay}` : ''}`);
  if (latestGeneratedDayWithPublishedAt && latestGeneratedDayWithPublishedAt !== latestDay) {
    note(`latest published day for positive article-date probes: ${latestGeneratedDayWithPublishedAt} (latest generated day ${latestDay} has no publish timestamp)`);
  }

  const home = readGenerated('index.html');
  const expectedHomeTitle = 'Dawson Wang — AI 工具落地實踐者';
  assertIncludes(home, `<link rel="canonical" href="${siteUrl}/"`, 'home');
  assertCanonicalOgUrlParity(home, 'home');
  assertLocaleStack(home, 'home');
  assertNonArticleSharedLayoutContract(home, '/', 'home');
  assertTitleStack(home, expectedHomeTitle, 'home');
  assertDescriptionStack(home, 'home');
  assertMatch(home, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, 'home');
  assertDefaultSocialCardStack(home, 'home');
  assertMatch(home, /<script type="application\/ld\+json"[^>]*>.*"@type":"Person".*"@type":"WebSite".*<\/script>/s, 'home JSON-LD');
  const homeJsonLd = extractJsonLdScript(home, 'home');
  assertRootEntityGraph(homeJsonLd, 'home');
  assertJsonLdInLanguage(home, 'WebSite', 'home');
  assertMatch(home, /"@type":"Person"[^}]*"description":"/, 'home Person description');
  assertMatch(home, /"@type":"Person"[\s\S]*?"knowsLanguage":\["zh-Hant-TW","en"\]/, 'home Person knowsLanguage');
  // Root-graph link: Person → ProfessionalService (joins the commercial-intent subtree into the Person node).
  assertMatch(home, new RegExp(`"@type":"Person"[\\s\\S]*?"worksFor":\\{"@id":"${siteUrl}/#ai-workflow-service"\\}`), 'home Person worksFor → #ai-workflow-service graph link');
  // Knowledge Graph entity-linking: Person.sameAs array of canonical off-site profiles
  // (sourced from src/data/profiles.ts). At minimum the GitHub URL must be present.
  assertMatch(home, /"@type":"Person"[\s\S]*?"sameAs":\[[^\]]*"https:\/\/github\.com\/andrew54068"/, 'home Person sameAs contains GitHub URL');
  assertMatch(home, /"@type":"Person"[\s\S]*?"sameAs":\[[^\]]*"https:\/\/x\.com\/dawson54068"/, 'home Person sameAs contains X URL');
  for (const profileUrl of expectedPersonSameAsUrls) {
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
  assertMatch(homeJsonLd, new RegExp(`"@type":"ProfessionalService"[\\s\\S]*?"founder":\\{"@id":"${siteUrl}/#person"\\}`), 'home ProfessionalService founder → #person graph link');
  assertMatch(homeJsonLd, /"@type":"ProfessionalService"[\s\S]*?"areaServed":"Taiwan"/, 'home ProfessionalService areaServed Taiwan');
  assertMatch(homeJsonLd, /"@type":"ProfessionalService"[\s\S]*?"inLanguage":"zh-Hant-TW"/, 'home ProfessionalService inLanguage zh-Hant-TW');
  assertMatch(homeJsonLd, new RegExp(`"@type":"ProfessionalService"[\\s\\S]*?"contactPoint":\\{"@type":"ContactPoint","url":"${siteUrl}/#inquire","contactType":"consulting inquiries","areaServed":"Taiwan","availableLanguage":\\["zh-Hant-TW","en"\\]\\}`), 'home ProfessionalService contactPoint → #inquire');
  assertMatch(home, new RegExp(`"@type":"OfferCatalog"[\\s\\S]*?"isPartOf":\\{"@id":"${siteUrl}/#website"\\}`), 'home OfferCatalog isPartOf → #website graph link');
  assertIncludes(home, `"@id":"${siteUrl}/#ai-workflow-service-catalog"`, 'home OfferCatalog @id');
  const homeOfferCount = countMatches(homeJsonLd, /"@type":"Offer","position":\d+/g);
  assertCountEquals(homeOfferCount, SERVICES.length, 'home OfferCatalog Offer count matches SERVICES.length');
  assertMatch(home, /"@type":"Offer"[\s\S]*?"itemOffered":\{"@type":"Service"[\s\S]*?"provider":\{"@id":"https:\/\/dawsonwang\.com\/#person"\}/, 'home Offer.itemOffered Service.provider -> #person graph link');
  assertMatch(home, /"@type":"Offer"[^}]*"url":"https:\/\/dawsonwang\.com\/#inquire"/, 'home Offer.url absolute -> #inquire');
  for (const service of SERVICES) {
    const escapedTitle = escapeJsonString(service.title);
    const escapedDescription = escapeJsonString(service.blurb);
    const escapedServiceTypeList = service.examples.map(example => `"${escapeJsonString(example)}"`).join(',');
    assertIncludes(
      homeJsonLd,
      `"itemOffered":{"@type":"Service","name":"${escapedTitle}","description":"${escapedDescription}","serviceType":[${escapedServiceTypeList}]`,
      `home OfferCatalog serviceType list for ${service.title}`
    );
    assertMatch(
      homeJsonLd,
      new RegExp(`"itemOffered":\\{"@type":"Service","name":"${escapeRegExp(escapedTitle)}"[\\s\\S]*?"provider":\\{"@id":"${siteUrl}/#person"\\},"areaServed":"Taiwan"`),
      `home OfferCatalog itemOffered areaServed Taiwan for ${service.title}`
    );
  }
  assertIncludes(home, 'Dawson Wang', 'home');
  assertIncludes(home, 'AI 工具落地', 'home');
  assertIncludes(home, 'action="/api/inquiry"', 'home inquiry form');
  assertIncludes(home, 'method="POST"', 'home inquiry form');
  for (const field of ['name', 'email', 'company', 'goal', 'team_size', 'budget', 'timeline', 'hp_field']) {
    assertIncludes(home, `name="${field}"`, `home inquiry form field ${field}`);
  }
  assertIncludes(home, 'href="/#inquire"', 'home appointment CTA');
  // rel=me identity profile links — BaseLayout emits site-wide; asserted on home (issue #144).
  for (const profileUrl of expectedPersonSameAsUrls) {
    assertIncludes(home, `<link rel="me" href="${profileUrl}"`, `home rel=me ${profileUrl}`);
  }
  // Analytics client wiring (PR #119). The SiteAnalytics script must be a bundled/processed
  // module, never a `define:vars` inline script — the latter ships the bare specifier
  // `../lib/analytics-client` to the browser unresolved, silently disabling all analytics.
  // Guard both directions: the inert JSON config island must exist, and no unbundled
  // analytics-client import may survive in the shipped HTML.
  assertIncludes(home, 'id="dw-analytics-config"', 'home analytics config island');
  if (/from\s*["'][./]*lib\/analytics-client/.test(home)) {
    fail('home ships an unbundled analytics-client import (define:vars inline-script regression)');
  }

  const allPosts = readGenerated('days/index.html');
  assertTitleStack(allPosts, 'AI 工具落地文章索引 | Dawson Wang', 'all posts');
  assertIncludes(allPosts, `<link rel="canonical" href="${siteUrl}/days"`, 'all posts');
  assertCanonicalOgUrlParity(allPosts, 'all posts');
  assertLocaleStack(allPosts, 'all posts');
  assertNonArticleSharedLayoutContract(allPosts, '/days', 'all posts');
  assertDescriptionStack(allPosts, 'all posts');
  assertMatch(allPosts, /<meta name="description" content="瀏覽 Dawson Wang 連續 \d+ 天公開的 AI 工具落地文章：[^"]+"\s*\/?\s*>/, 'all posts meta description');
  assertIncludes(allPosts, '所有', 'all posts');
  assertIncludes(allPosts, '文章', 'all posts');
  assertDefaultSocialCardStack(allPosts, '/days');
  assertJsonLdInLanguage(allPosts, 'CollectionPage', '/days');
  assertIncludes(allPosts, '共 ', 'all posts');
  const allPostsJsonLd = extractJsonLdScript(allPosts, '/days');
  assertRootEntityGraph(allPostsJsonLd, '/days');
  assertMatch(allPostsJsonLd, new RegExp(`"mainEntity":\\{[^}]*"numberOfItems":${days.length}\\b`), '/days ItemList numberOfItems matches source day count');
  const allPostsDayLinks = countMatches(allPosts, /href="\/day\/\d+"/g);
  if (allPostsDayLinks < days.length) fail(`All posts page links only ${allPostsDayLinks}/${days.length} day pages`);
  // Count absolute ItemList day URLs inside the extracted JSON-LD instead of the full HTML:
  // the rendered card list also links every day page, so a broken ItemList payload could hide behind visible copy.
  const allPostsJsonLdDayUrlCount = countMatches(allPostsJsonLd, /"url":"https:\/\/dawsonwang\.com\/day\/\d+"/g);
  assertCountEquals(allPostsJsonLdDayUrlCount, generatedDayPages.length, '/days ItemList absolute day URL');
  assertMatch(allPosts, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"ItemList".*<\/script>/s, '/days CollectionPage+ItemList JSON-LD');
  assertMatch(allPosts, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/days BreadcrumbList JSON-LD');
  assertMatch(allPostsJsonLd, /"url":"https:\/\/dawsonwang\.com\/day\/\d+"/, '/days ItemList contains absolute day URLs');
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(allPostsJsonLd, `"@id":"${siteUrl}/days#breadcrumb"`, '/days BreadcrumbList @id');
  assertMatch(allPostsJsonLd, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/days#breadcrumb"\\}`), '/days CollectionPage breadcrumb → #breadcrumb graph link');
  // Spot-check BaseLayout rel=me propagation on a non-home stable public page (issue #144).
  for (const profileUrl of expectedPersonSameAsUrls) {
    assertIncludes(allPosts, `<link rel="me" href="${profileUrl}"`, `/days rel=me ${profileUrl}`);
  }

  const search = readGenerated('search/index.html');
  assertTitleStack(search, 'AI 工作流文章搜尋 | Dawson Wang', 'search');
  assertIncludes(search, `<link rel="canonical" href="${siteUrl}/search"`, 'search');
  assertCanonicalOgUrlParity(search, 'search');
  assertLocaleStack(search, 'search');
  assertNonArticleSharedLayoutContract(search, '/search', 'search');
  assertDescriptionStack(search, 'search');
  assertDefaultSocialCardStack(search, '/search');
  assertMatch(search, /<meta name="description" content="從 \d+ 篇 Dawson Wang 的 AI 工具落地日誌中，用關鍵字或語意搜尋 Claude Code、MCP、automation、內容流程與團隊導入案例。"\s*\/?\s*>/, 'search meta description');
  assertIncludes(search, 'id="search-form"', 'search form');
  assertIncludes(search, 'type="search"', 'search form');
  assertIncludes(search, 'value="keyword"', 'search keyword mode');
  assertIncludes(search, 'value="semantic"', 'search semantic mode');
  assertIncludes(search, 'id="search-results"', 'search results');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"SearchResultsPage".*<\/script>/s, '/search SearchResultsPage JSON-LD');
  assertMatch(search, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/search BreadcrumbList JSON-LD');
  const searchJsonLd = extractJsonLdScript(search, '/search');
  assertRootEntityGraph(searchJsonLd, '/search');
  assertJsonLdInLanguage(search, 'SearchResultsPage', '/search');
  assertIncludes(search, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/search JSON-LD isPartOf #website graph link');
  assertMatch(search, /"target":"https:\/\/dawsonwang\.com\/search\?q=\{search_term_string\}"/, '/search SearchAction target');
  // BreadcrumbList @id + SearchResultsPage → BreadcrumbList graph link (issue #68).
  assertIncludes(search, `"@id":"${siteUrl}/search#breadcrumb"`, '/search BreadcrumbList @id');
  assertMatch(search, new RegExp(`"@type":"SearchResultsPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/search#breadcrumb"\\}`), '/search SearchResultsPage breadcrumb → #breadcrumb graph link');

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
    const dayJsonLd = extractJsonLdScript(dayHtml, `${label} JSON-LD`);
    const headline = extractArticleHeadline(dayHtml, label);
    const expectedTitle = headline ? `${headline} | Dawson Wang` : '';
    assertIncludes(dayHtml, `<link rel="canonical" href="${siteUrl}/day/${day.number}"`, `${label} canonical`);
    assertCanonicalOgUrlParity(dayHtml, label);
    assertLocaleStack(dayHtml, label);
    assertSelfHreflangAlternates(dayHtml, `/day/${day.number}`, label);
    assertTitleStack(dayHtml, expectedTitle, label);
    assertDescriptionStack(dayHtml, label);
    assertDiscoveryAlternates(dayHtml, label);
    assertIncludes(dayHtml, '<meta property="og:type" content="article"', `${label} og:type article`);
    if (/"datePublished":""/.test(dayHtml)) fail(`${label} Article datePublished is an empty string`);
    if (/"dateModified":""/.test(dayHtml)) fail(`${label} Article dateModified is an empty string`);
    if (/<meta property="article:published_time" content=""\s*\/?>/.test(dayHtml)) fail(`${label} article:published_time is an empty string`);
    if (/<meta property="article:modified_time" content=""\s*\/?>/.test(dayHtml)) fail(`${label} article:modified_time is an empty string`);
    assertRootEntityGraph(dayJsonLd, label);
    assertDayArticleOwnershipTrustCluster(dayHtml, day.number, label);
    // Issue #162: social-card aspect-ratio guard. `twitter:card=summary_large_image`
    // requires a 2:1 image; 1:1 square slide covers degrade the card. Assert that
    // every generated day page declares `og:image:width` / `og:image:height` whose
    // ratio lands in [1.85, 2.05] — covers Facebook's 1.91:1 OG recommendation and
    // Twitter's 2:1 hard requirement. Reading from the rendered meta values (not the
    // file on disk) catches the silent-regression class where a future code change
    // re-routes a square image through og:image with mismatched declared dimensions.
    const ogWidthMatch = dayHtml.match(/<meta property="og:image:width" content="(\d+)"/);
    const ogHeightMatch = dayHtml.match(/<meta property="og:image:height" content="(\d+)"/);
    if (!ogWidthMatch || !ogHeightMatch) {
      fail(`${label} missing og:image:width or og:image:height meta`);
    } else {
      const ogWidth = Number(ogWidthMatch[1]);
      const ogHeight = Number(ogHeightMatch[1]);
      if (!Number.isFinite(ogWidth) || !Number.isFinite(ogHeight) || ogHeight === 0) {
        fail(`${label} og:image dimensions unparseable: ${ogWidthMatch[1]} x ${ogHeightMatch[1]}`);
      } else {
        const ratio = ogWidth / ogHeight;
        if (ratio < 1.85 || ratio > 2.05) {
          fail(`${label} og:image aspect ratio ${ratio.toFixed(3)} (${ogWidth}x${ogHeight}) outside [1.85, 2.05] required by twitter:card=summary_large_image`);
        }
      }
    }
    // Issue #162: og:image and twitter:image must continue to reference the SAME
    // absolute URL (acceptance criterion 6) so the fallback path doesn't divide
    // social-share previews across two assets.
    const ogImageMatch = dayHtml.match(/<meta property="og:image" content="([^"]+)"/);
    const twitterImageMatch = dayHtml.match(/<meta name="twitter:image" content="([^"]+)"/);
    if (!ogImageMatch || !twitterImageMatch) {
      fail(`${label} missing og:image or twitter:image meta`);
    } else if (ogImageMatch[1] !== twitterImageMatch[1]) {
      fail(`${label} og:image (${ogImageMatch[1]}) and twitter:image (${twitterImageMatch[1]}) diverged`);
    }
  }
  note(`day Article ownership/trust cluster asserted across ${generatedDayPages.length} generated pages`);
  note(`day og:image aspect ratio in [1.85, 2.05] asserted across ${generatedDayPages.length} generated pages`);

  if (latestDay) {
    const dayHtml = readGenerated(`day/${latestDay}/index.html`);
    const latestDayPublishedAt = dayPublishedAtByNumber.get(latestDay);
    const latestDayHeadline = extractArticleHeadline(dayHtml, `day ${latestDay}`);
    const expectedLatestDayTitle = latestDayHeadline ? `${latestDayHeadline} | Dawson Wang` : '';
    assertTitleStack(dayHtml, expectedLatestDayTitle, `day ${latestDay}`);
    assertIncludes(dayHtml, '<meta name="twitter:site" content="@dawson54068"', `day ${latestDay} twitter:site`);
    assertIncludes(dayHtml, '<meta name="twitter:creator" content="@dawson54068"', `day ${latestDay} twitter:creator`);
    assertMatch(dayHtml, /<meta name="description" content="[^"]{40,200}"\s*\/?\s*>/, `day ${latestDay}`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"Article".*<\/script>/s, `day ${latestDay} Article JSON-LD`);
    assertMatch(dayHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `day ${latestDay} BreadcrumbList JSON-LD`);
    // BreadcrumbList @id + Article → BreadcrumbList graph link (issue #68).
    assertIncludes(dayHtml, `"@id":"${siteUrl}/day/${latestDay}#breadcrumb"`, `day ${latestDay} BreadcrumbList @id`);
    assertMatch(dayHtml, new RegExp(`"@type":"Article"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/day/${latestDay}#breadcrumb"\\}`), `day ${latestDay} Article breadcrumb → #breadcrumb graph link`);
    // Keep richer latest-day assertions for representative-page details that are not part of the full-collection ownership/trust ratchet.
    assertMatch(dayHtml, /"wordCount":\d+/, `day ${latestDay} Article wordCount`);
    // image promoted to typed ImageObject with declared dimensions (large-image rich-result eligibility).
    // Primary image is always the og-default fallback (1200x630) so dimensions are stable across days.
    assertMatch(dayHtml, /"image":(\[\{|\{)"@type":"ImageObject","url":"https:\/\/dawsonwang\.com\/og-default\.png","width":1200,"height":630/, `day ${latestDay} Article image ImageObject`);
    // Latest-day pages may legitimately omit article dates when the source day has no publish timestamp.
    if (latestDayPublishedAt) {
      assertMatch(dayHtml, /<meta property="article:published_time" content="[^"]+"/, `day ${latestDay} article:published_time`);
      assertMatch(dayHtml, /<meta property="article:modified_time" content="[^"]+"/, `day ${latestDay} article:modified_time`);
    } else {
      if (/"datePublished":/.test(dayHtml)) fail(`day ${latestDay} should omit Article datePublished without a publish timestamp`);
      if (/"dateModified":/.test(dayHtml)) fail(`day ${latestDay} should omit Article dateModified without a publish timestamp`);
      if (/<meta property="article:published_time"/.test(dayHtml)) fail(`day ${latestDay} should omit article:published_time without a publish timestamp`);
      if (/<meta property="article:modified_time"/.test(dayHtml)) fail(`day ${latestDay} should omit article:modified_time without a publish timestamp`);
    }
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
    if (dayHtml.includes(`alt="Day ${latestDay} slide 1"`)) fail(`day ${latestDay} slide alt regressed to generic Day N slide M pattern`);
    assertIncludes(dayHtml, `alt="${latestDayHeadline} — 投影片 1"`, `day ${latestDay} first slide alt`);
  }

  if (latestGeneratedDayWithPublishedAt) {
    const dayHtml = readGenerated(`day/${latestGeneratedDayWithPublishedAt}/index.html`);
    assertMatch(dayHtml, /<meta property="article:published_time" content="[^"]+"/, `day ${latestGeneratedDayWithPublishedAt} article:published_time`);
    assertMatch(dayHtml, /<meta property="article:modified_time" content="[^"]+"/, `day ${latestGeneratedDayWithPublishedAt} article:modified_time`);
    note(`article publish/modified date probes asserted on day ${latestGeneratedDayWithPublishedAt}`);
  } else {
    note('no generated day with a publish timestamp found; article publish/modified date probes skipped');
  }

  // article:tag is only emitted when the day has topic chips; assert on the latest day that has topics
  // (stable-subset gate per the skill — avoids hiding a baseline gap for older days without topic mappings).
  const latestDayWithTopics = Object.keys(DAY_TOPICS)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && (DAY_TOPICS[n] ?? []).length > 0 && existsSync(path.join(outDir, `day/${n}/index.html`)))
    .sort((a, b) => b - a)[0];
  if (latestDayWithTopics) {
    const dayHtml = readGenerated(`day/${latestDayWithTopics}/index.html`);
    const expectedArticleSection = topicTitleBySlug.get(DAY_TOPICS[latestDayWithTopics]?.[0] ?? '');
    if (!expectedArticleSection) {
      fail(`day ${latestDayWithTopics} missing primary topic title for articleSection probe`);
    } else {
      assertMatch(
        dayHtml,
        new RegExp(`"@type":"Article"[\\s\\S]*?"articleSection":"${escapeRegExp(expectedArticleSection)}"`),
        `day ${latestDayWithTopics} Article articleSection`
      );
    }
    assertMatch(dayHtml, /<meta property="article:tag" content="[^"]+"/, `day ${latestDayWithTopics} article:tag`);
    assertMatch(dayHtml, /"about":\[\{"@id":"https:\/\/dawsonwang\.com\/topics\/[^"]+#term"\}/, `day ${latestDayWithTopics} Article about → DefinedTerm graph link`);
    note(`articleSection, article:tag, and Article about asserted on day ${latestDayWithTopics}`);
  } else {
    note('no day with topics found; articleSection, article:tag, and Article about probes skipped');
  }

  const topicsIndex = readGenerated('topics/index.html');
  assertTitleStack(topicsIndex, 'AI 工具落地主題索引 | Dawson Wang', 'topics index');
  assertIncludes(topicsIndex, `<link rel="canonical" href="${siteUrl}/topics"`, 'topics index');
  assertCanonicalOgUrlParity(topicsIndex, 'topics index');
  assertLocaleStack(topicsIndex, 'topics index');
  assertNonArticleSharedLayoutContract(topicsIndex, '/topics', 'topics index');
  assertDescriptionStack(topicsIndex, 'topics index');
  assertDefaultSocialCardStack(topicsIndex, '/topics');
  assertMatch(topicsIndex, new RegExp(`<meta name="description" content="依主題瀏覽 Dawson Wang 的 ${activeTopics.length} 個 AI 工具落地分類：[^\"]+。"\\s*\\/?\\s*>`), 'topics index meta description');
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"ItemList".*<\/script>/s, 'topics index JSON-LD');
  assertMatch(topicsIndex, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/topics BreadcrumbList JSON-LD');
  assertJsonLdInLanguage(topicsIndex, 'DefinedTermSet', '/topics');
  assertJsonLdInLanguage(topicsIndex, 'CollectionPage', '/topics');
  const topicsIndexJsonLd = extractJsonLdScript(topicsIndex, '/topics');
  assertRootEntityGraph(topicsIndexJsonLd, '/topics');
  assertMatch(topicsIndexJsonLd, new RegExp(`"mainEntity":\\{[^}]*"numberOfItems":${activeTopics.length}\\b`), '/topics ItemList numberOfItems matches active topic source of truth');
  // Count absolute topic URLs inside the extracted JSON-LD rather than the full HTML: topic cards render
  // the same links visibly, so whole-document matches can go false-green if the ItemList drifts.
  const topicsIndexItemListUrlCount = countMatches(topicsIndexJsonLd, /"url":"https:\/\/dawsonwang\.com\/topics\/[^"]+"/g);
  assertCountEquals(topicsIndexItemListUrlCount, activeTopics.length, '/topics ItemList absolute topic URL');
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(topicsIndexJsonLd, `"@id":"${siteUrl}/topics#breadcrumb"`, '/topics BreadcrumbList @id');
  assertMatch(topicsIndexJsonLd, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/topics#breadcrumb"\\}`), '/topics CollectionPage breadcrumb → #breadcrumb graph link');
  // DefinedTermSet hub: models topics as a controlled vocabulary, with isPartOf graph link up to #website
  // and one hasDefinedTerm reference per active-topic entry (generated from src/data/topics.ts — no literal slugs in JSON-LD source).
  assertMatch(topicsIndexJsonLd, /"@type":"DefinedTermSet"[\s\S]*?"@id":"https:\/\/dawsonwang\.com\/topics#topic-taxonomy"/, '/topics DefinedTermSet @id');
  assertMatch(topicsIndexJsonLd, /"@type":"DefinedTermSet"[\s\S]*?"isPartOf":\{"@id":"https:\/\/dawsonwang\.com\/#website"\}/, '/topics DefinedTermSet isPartOf → #website graph link');
  for (const topic of activeTopics) {
    assertIncludes(topicsIndexJsonLd, `{"@id":"${siteUrl}/topics/${topic.slug}#term"}`, `/topics DefinedTermSet hasDefinedTerm → ${topic.slug}#term graph link`);
  }
  // Count guard: future active-topic growth ships green automatically without a literal-number edit.
  const taxonomyTermRefCount = countMatches(topicsIndexJsonLd, /"@id":"https:\/\/dawsonwang\.com\/topics\/[^"]+#term"/g);
  if (taxonomyTermRefCount !== activeTopics.length) fail(`/topics DefinedTermSet term-ref count ${taxonomyTermRefCount} !== active topic count ${activeTopics.length}`);
  for (const topic of activeTopics) {
    const label = `topic ${topic.slug}`;
    const topicHtml = readGenerated(`topics/${topic.slug}/index.html`);
    const expectedTopicDayCount = topicDayCountBySlug.get(topic.slug) ?? 0;
    assertTitleStack(topicHtml, `${topic.title} AI 實作文章 | Dawson Wang`, label);
    assertIncludes(topicHtml, `<link rel="canonical" href="${siteUrl}/topics/${topic.slug}"`, label);
    assertCanonicalOgUrlParity(topicHtml, label);
    assertLocaleStack(topicHtml, label);
    assertNonArticleSharedLayoutContract(topicHtml, `/topics/${topic.slug}`, label);
    assertDescriptionStack(topicHtml, label);
    assertDefaultSocialCardStack(topicHtml, label);
    assertMatch(topicHtml, /<meta name="description" content="[^"]+ 收錄 \d+ 篇 Dawson Wang 的 AI 工具落地文章與案例。"\s*\/?\s*>/, `${label} meta description`);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*"@type":"DefinedTerm".*"@type":"ItemList".*<\/script>/s, `${label} JSON-LD`);
    assertMatch(topicHtml, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, `${label} BreadcrumbList JSON-LD`);
    assertJsonLdInLanguage(topicHtml, 'CollectionPage', label);
    const topicPageJsonLd = extractJsonLdScript(topicHtml, label);
    assertRootEntityGraph(topicPageJsonLd, label);
    assertMatch(topicPageJsonLd, new RegExp(`"mainEntity":\\{[^}]*"numberOfItems":${expectedTopicDayCount}\\b`), `${label} ItemList numberOfItems matches tagged day count`);
    const topicItemListDayUrlCount = countMatches(topicPageJsonLd, /"url":"https:\/\/dawsonwang\.com\/day\/\d+"/g);
    assertCountEquals(topicItemListDayUrlCount, expectedTopicDayCount, `${label} ItemList absolute day URL`);
    // Back-link from per-topic DefinedTerm → taxonomy hub on /topics (closes the topic-graph subgraph-orphan).
    assertMatch(topicPageJsonLd, /"@type":"DefinedTerm"[\s\S]*?"inDefinedTermSet":\{"@id":"https:\/\/dawsonwang\.com\/topics#topic-taxonomy"\}/, `${label} DefinedTerm inDefinedTermSet → #topic-taxonomy back-link`);
    // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68) — wrapped in the TOPICS loop so future
    // topic growth ships green automatically (same pattern as the DefinedTermSet ref-count guard).
    assertIncludes(topicPageJsonLd, `"@id":"${siteUrl}/topics/${topic.slug}#breadcrumb"`, `${label} BreadcrumbList @id`);
    assertMatch(topicPageJsonLd, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/topics/${topic.slug}#breadcrumb"\\}`), `${label} CollectionPage breadcrumb → #breadcrumb graph link`);
  }
  for (const topic of zeroPostTopics) {
    const zeroPostTopicPath = path.join(outDir, `topics/${topic.slug}/index.html`);
    if (existsSync(zeroPostTopicPath)) fail(`zero-post topic page should not be generated: ${path.relative(root, zeroPostTopicPath)}`);
    if (topicsIndex.includes(`href="/topics/${topic.slug}"`)) fail(`/topics page leaks zero-post topic link /topics/${topic.slug}`);
    if (topicsIndex.includes(`"@id":"${siteUrl}/topics/${topic.slug}#term"`)) fail(`/topics DefinedTermSet leaks zero-post topic ${topic.slug}#term`);
  }
  note(`generated topic pages: ${activeTopics.length}/${activeTopics.length}`);

  const sitemap = readGenerated('sitemap.xml');
  assertIncludes(sitemap, `<loc>${siteUrl}/</loc>`, 'sitemap');
  assertIncludes(sitemap, `<loc>${siteUrl}/days</loc>`, 'sitemap');
  assertIncludes(sitemap, `<loc>${siteUrl}/topics</loc>`, 'sitemap');
  for (const topic of activeTopics) {
    assertIncludes(sitemap, `<loc>${siteUrl}/topics/${topic.slug}</loc>`, 'sitemap');
  }
  const sitemapTopicCount = Array.from(sitemap.matchAll(/<loc>https:\/\/dawsonwang\.com\/topics\/[^<]+<\/loc>/g)).length;
  if (sitemapTopicCount !== activeTopics.length) fail(`Sitemap topic URL count mismatch: ${sitemapTopicCount}/${activeTopics.length}`);
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
    assertSitemapEntry(sitemap, `/topics/${slug}`, '0.7', 'weekly', publishedAt);
  }
  for (const topic of zeroPostTopics) {
    if (sitemap.includes(`<loc>${siteUrl}/topics/${topic.slug}</loc>`)) fail(`sitemap.xml leaks zero-post topic /topics/${topic.slug}`);
  }
  if (latestDay) {
    assertIncludes(sitemap, `<loc>${siteUrl}/day/${latestDay}</loc>`, 'sitemap');
    const latestDayPublishedAt = dayPublishedAtByNumber.get(latestDay);
    if (latestDayPublishedAt) assertSitemapEntry(sitemap, `/day/${latestDay}`, '0.8', 'monthly', latestDayPublishedAt);
  }
  for (const day of days) {
    assertSitemapEntry(sitemap, `/day/${day.number}`, '0.8', 'monthly', dayPublishedAtByNumber.get(day.number));
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
  for (const topic of activeTopics) {
    assertIncludes(llms, `${siteUrl}/topics/${topic.slug}`, `llms.txt topic ${topic.slug}`);
  }
  for (const topic of zeroPostTopics) {
    if (llms.includes(`${siteUrl}/topics/${topic.slug}`)) fail(`llms.txt leaks zero-post topic /topics/${topic.slug}`);
  }

  // /proof portfolio page — CollectionPage + BreadcrumbList JSON-LD with #website graph link
  const proof = readGenerated('proof/index.html');
  assertTitleStack(proof, 'AI 工具落地案例與作品集 | Dawson Wang', '/proof');
  assertIncludes(proof, `<link rel="canonical" href="${siteUrl}/proof"`, '/proof canonical');
  assertCanonicalOgUrlParity(proof, '/proof');
  assertLocaleStack(proof, '/proof');
  assertNonArticleSharedLayoutContract(proof, '/proof', '/proof');
  assertDescriptionStack(proof, '/proof');
  assertDefaultSocialCardStack(proof, '/proof');
  assertMatch(proof, /<meta name="description" content="\d+ 天 AI 工具落地公開記錄：實作專案、工作流、開源工具、諮詢案例與可驗收成果，幫你快速判斷 Dawson Wang 是否適合導入你的團隊。"\s*\/?\s*>/, '/proof meta description');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"CollectionPage".*<\/script>/s, '/proof CollectionPage JSON-LD');
  assertMatch(proof, /<script type="application\/ld\+json"[^>]*>.*"@type":"BreadcrumbList".*<\/script>/s, '/proof BreadcrumbList JSON-LD');
  assertJsonLdInLanguage(proof, 'CollectionPage', '/proof');
  const proofJsonLd = extractJsonLdScript(proof, '/proof');
  assertRootEntityGraph(proofJsonLd, '/proof');
  assertIncludes(proofJsonLd, `"isPartOf":{"@id":"${siteUrl}/#website"}`, '/proof JSON-LD isPartOf #website graph link');
  // BreadcrumbList @id + CollectionPage → BreadcrumbList graph link (issue #68).
  assertIncludes(proofJsonLd, `"@id":"${siteUrl}/proof#breadcrumb"`, '/proof BreadcrumbList @id');
  assertMatch(proofJsonLd, new RegExp(`"@type":"CollectionPage"[\\s\\S]*?"breadcrumb":\\{"@id":"${siteUrl}/proof#breadcrumb"\\}`), '/proof CollectionPage breadcrumb → #breadcrumb graph link');
  // mainEntity ItemList of shipped projects — single source of truth in src/data/proof-projects.ts
  assertMatch(proofJsonLd, /"@type":"CollectionPage"[\s\S]*?"mainEntity":\{[^}]*"@type":"ItemList"/, '/proof CollectionPage→ItemList mainEntity link');
  assertMatch(proofJsonLd, new RegExp(`"mainEntity":\\{[^}]*"numberOfItems":${PROOF_PROJECTS.length}\\b`), '/proof ItemList numberOfItems matches PROOF_PROJECTS.length');
  // Count CreativeWork occurrences in the structuredData script (each PROOF_PROJECTS item emits exactly one
  // CreativeWork; the rendered proof cards duplicate the same names in visible copy, so count/assert inside
  // the extracted JSON-LD blob rather than the full HTML document.
  const proofCreativeWorkCount = countMatches(proofJsonLd, /"@type":"CreativeWork"/g);
  if (proofCreativeWorkCount !== PROOF_PROJECTS.length) {
    fail(`/proof CreativeWork count ${proofCreativeWorkCount} !== PROOF_PROJECTS.length ${PROOF_PROJECTS.length}`);
  }
  // Spot-check that each PROOF_PROJECTS entry's name appears inside the JSON-LD (escaped form).
  for (const project of PROOF_PROJECTS) {
    const escaped = escapeJsonString(project.name);
    assertIncludes(proofJsonLd, escaped, `/proof ItemList contains project name ${project.name}`);
  }

  // RSS feed
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
  assertTitleStack(inquiry, '收到了 | Dawson Wang', '/inquiry-received');
  assertIncludes(inquiry, `<link rel="canonical" href="${siteUrl}/inquiry-received"`, '/inquiry-received canonical');
  assertCanonicalOgUrlParity(inquiry, '/inquiry-received');
  assertLocaleStack(inquiry, '/inquiry-received');
  assertNonArticleSharedLayoutContract(inquiry, '/inquiry-received', '/inquiry-received');
  assertDescriptionStack(inquiry, '/inquiry-received');
  assertDefaultSocialCardStack(inquiry, '/inquiry-received');
  assertIncludes(inquiry, '<meta name="robots" content="noindex, nofollow"', '/inquiry-received noindex meta robots');
  assertOmitsRootEntityGraph(inquiry, '/inquiry-received');
  if (inquiry.includes('content="index, follow')) fail('/inquiry-received leaks index,follow robots directive (should be noindex,nofollow)');
  // Negative-sitemap probe: /inquiry-received must NOT appear in sitemap.xml or llms.txt.
  if (sitemap.includes(`${siteUrl}/inquiry-received`)) fail('sitemap.xml leaks /inquiry-received (should be excluded)');
  if (llms.includes(`${siteUrl}/inquiry-received`)) fail('llms.txt leaks /inquiry-received (should be excluded)');
  // /404 custom error page is noindexed via BaseLayout `noindex` prop and must navigate back into the content graph.
  const notFound = readGenerated('404.html');
  assertTitleStack(notFound, '找不到頁面 | Dawson Wang', '/404');
  assertIncludes(notFound, `<link rel="canonical" href="${siteUrl}/404"`, '/404 canonical');
  assertCanonicalOgUrlParity(notFound, '/404');
  assertLocaleStack(notFound, '/404');
  assertNonArticleSharedLayoutContract(notFound, '/404', '/404');
  assertDescriptionStack(notFound, '/404');
  assertDefaultSocialCardStack(notFound, '/404');
  assertIncludes(notFound, '<meta name="robots" content="noindex, nofollow"', '/404 noindex meta robots');
  assertOmitsRootEntityGraph(notFound, '/404');
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
