import classification from '../data/article-classification.json';
import { TOPICS } from '../data/topics';

export const ARTICLE_TYPES = [
  { slug: 'fundamentals', title: '基本觀念', blurb: '理解名詞、運作原理，以及能力與限制。' },
  { slug: 'methods', title: '方法與流程', blurb: '可以反覆運用的判斷原則與做事方法。' },
  { slug: 'tutorials', title: '實作教學', blurb: '跟著具體步驟，完成一件事。' },
  { slug: 'tools', title: '工具介紹與評測', blurb: '認識工具的能力、比較與使用限制。' },
  { slug: 'cases', title: '案例與復盤', blurb: '從真實問題、嘗試、結果與踩坑中學習。' },
  { slug: 'reflections', title: '觀點與反思', blurb: '關於工作、學習、產品與 AI 的思考。' },
  { slug: 'updates', title: '動態與紀錄', blurb: '產品更新、活動現場與當時的生活紀錄。' },
] as const;

export const FRESHNESS = [
  { slug: 'evergreen', title: '長期參考', blurb: '核心是較少依賴當下產品的原理、方法或經驗；不代表每個細節都不會改變。' },
  { slug: 'versioned', title: '版本相關', blurb: '包含特定工具、模型、操作、價格或實測結果，使用前請留意版本。' },
  { slug: 'timely', title: '時效資訊', blurb: '主要與當時的新聞、活動、優惠或公告有關。' },
] as const;

export interface ArticleClassification {
  types: string[];
  freshness: string[];
  reason: string;
  sourceHash: string;
}

export interface ArticleFilters {
  types: string[];
  topics: string[];
  freshness: string[];
  query: string;
}

export interface FilterableArticle {
  dayNumber: number;
  title: string;
  types: string[];
  topics: string[];
  freshness: string[];
}

export function classificationForDay(day: number): ArticleClassification | undefined {
  return (classification as Record<number, ArticleClassification>)[day];
}

export function parseArticleFilters(params: URLSearchParams): ArticleFilters {
  const values = (key: string, vocabulary: readonly { slug: string }[]) => {
    const known = new Set(vocabulary.map(t => t.slug));
    return [...new Set(params.getAll(key).filter(value => known.has(value)))];
  };
  return {
    types: values('type', ARTICLE_TYPES),
    topics: values('topic', TOPICS),
    freshness: values('freshness', FRESHNESS),
    query: (params.get('q') ?? '').trim().slice(0, 200),
  };
}

export function articleFilterQuery(filters: ArticleFilters): string {
  const params = new URLSearchParams();
  for (const value of filters.types) params.append('type', value);
  for (const value of filters.topics) params.append('topic', value);
  for (const value of filters.freshness) params.append('freshness', value);
  if (filters.query) params.set('q', filters.query);
  return params.toString();
}

export function matchesArticleFilters(article: FilterableArticle, filters: ArticleFilters): boolean {
  return (['types', 'topics', 'freshness'] as const).every(axis =>
    filters[axis].length === 0 || filters[axis].some(slug => article[axis].includes(slug)),
  ) && (!filters.query || `${article.title} ${article.dayNumber}`.toLocaleLowerCase().includes(filters.query.toLocaleLowerCase()));
}

export function classificationLinksForDay(day: number) {
  const value = classificationForDay(day);
  return [
    ...ARTICLE_TYPES.filter(t => value?.types.includes(t.slug)).map(t => ({ ...t, axis: 'type', href: `/days?type=${t.slug}` })),
    ...FRESHNESS.filter(t => value?.freshness.includes(t.slug)).map(t => ({ ...t, axis: 'freshness', href: `/days?freshness=${t.slug}` })),
  ];
}
