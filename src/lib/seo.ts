export const SITE_URL = 'https://dawsonwang.com';
export const SITE_NAME = 'Dawson Wang';
export const SITE_LOCALE = 'zh_TW';
export const DEFAULT_DESCRIPTION = 'Dawson Wang — 幫台灣團隊把 AI 工具落地到實際工作流。9 年新創軟體開發經驗，從 PoC、客製 agent workflow 到團隊培訓與上線交付。';
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_ALT = 'Dawson Wang — AI 工具落地實踐者';

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, SITE_URL).toString();
}

export function cleanDescription(value: string, maxLength = 155) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).replace(/[，。、,;；:\s]+$/u, '')}…`;
}

export function canonicalPath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function jsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export interface BreadcrumbCrumb {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(crumbs: BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}

export const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: 'Dawson Wang',
  url: SITE_URL,
  image: absoluteUrl('/dawson.webp'),
  jobTitle: 'AI workflow implementation consultant',
  knowsAbout: [
    'AI workflow implementation',
    'Claude Code',
    'MCP server',
    'Agent workflow',
    'Full-stack software development',
    'Developer relations',
  ],
};

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'zh-Hant-TW',
  publisher: { '@id': `${SITE_URL}/#person` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};
