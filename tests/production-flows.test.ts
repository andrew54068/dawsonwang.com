import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('production-critical website flows', () => {
  test('homepage renders the correct business page and appointment request form', () => {
    const home = source('src/pages/index.astro');
    const inquiryForm = source('src/components/InquiryForm.astro');

    expect(home).toContain('<Hero />');
    expect(home).toContain('<ServiceExplainer />');
    expect(home).toContain('<InquiryForm />');
    expect(home).toContain('Dawson Wang 幫台灣團隊把 AI 工具落地到實際工作流');

    expect(inquiryForm).toContain('id="inquire"');
    expect(inquiryForm).toMatch(/<form[^>]+action="\/api\/inquiry"[^>]+method="POST"/s);
    expect(inquiryForm).toContain('告訴我你想用 AI');
  });

  test('appointment request form posts every field required by the API contract', () => {
    const inquiryForm = source('src/components/InquiryForm.astro');
    const requiredFields = [
      'name="name"',
      'name="email"',
      'name="company"',
      'name="goal"',
      'name="team_size"',
      'name="budget"',
      'name="timeline"',
      'name="hp_field"',
    ];

    for (const field of requiredFields) expect(inquiryForm).toContain(field);
    expect(inquiryForm).toMatch(/<input[^>]+type="email"[^>]+name="email"[^>]+required/s);
    expect(inquiryForm).toMatch(/<textarea[\s\S]+name="goal"[\s\S]+required[\s\S]+maxlength="300"/);
    expect(inquiryForm).toContain("{['1-5', '6-30', '31-100', '100+'].map");
    expect(inquiryForm).toContain("{ v: '300k-800k', l: '30–80 萬' }");
    expect(inquiryForm).toContain("{ v: 'this_quarter', l: '本季' }");
  });

  test('all articles page lists real content newest-first and links every post through PostCard', () => {
    const daysPage = source('src/pages/days.astro');

    expect(daysPage).toContain("getCollection('days')");
    expect(daysPage).toContain('b.data.dayNumber - a.data.dayNumber');
    expect(daysPage).toContain('sorted.map(day =>');
    expect(daysPage).toContain('<PostCard');
    expect(daysPage).toContain('dayNumber={day.data.dayNumber}');
    expect(daysPage).toContain('subtitle={day.data.subtitle}');
    expect(daysPage).toContain('共 {days.length} 篇，依日期倒序。');
  });

  test('search page supports both keyword and semantic search modes', () => {
    const searchPage = source('src/pages/search.astro');

    expect(searchPage).toContain('id="search-form"');
    expect(searchPage).toContain('type="search"');
    expect(searchPage).toContain('value="keyword" checked');
    expect(searchPage).toContain('value="semantic"');
    expect(searchPage).toContain('loadPagefind');
    expect(searchPage).toContain('/pagefind/pagefind.js');
    expect(searchPage).toContain('semanticSearch(q, RESULT_LIMIT)');
    expect(searchPage).toContain('id="search-fallback-index"');
    expect(searchPage).toContain('parseSearchFallbackIndexJson');
    expect(searchPage).toContain('runSearchFallback');
    expect(searchPage).toContain('Pagefind 未命中；精準字串補強找到');
    expect(searchPage).toContain('new URLSearchParams(window.location.search).get(\'q\')');
  });

  test('navigation exposes core production journeys', () => {
    const nav = source('src/components/Nav.astro');
    const footer = source('src/components/Footer.astro');

    for (const href of ['href="/"', 'href="/days"', 'href="/topics"', 'href="/search"', 'href="/#inquire"']) {
      expect(`${nav}\n${footer}`).toContain(href);
    }
  });
});
