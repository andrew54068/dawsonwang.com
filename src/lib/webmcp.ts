export interface ContentHit { title: string; url: string; excerpt: string }
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: Record<string, unknown>) => Promise<string>;
}
export interface ModelContext {
  registerTool: (tool: WebMcpTool) => void | Promise<void>;
}
interface Dependencies {
  search: (query: string, mode: 'keyword' | 'semantic', limit: number, scope: 'articles' | 'site') => Promise<ContentHit[]>;
  show: (query: string, results: ContentHit[]) => void;
  read: (path: string) => Promise<unknown>;
}
// Only published content routes; never APIs, form responses, or arbitrary URLs.
export function publicPageUrl(path: string, origin: string): URL {
  const url = new URL(path, origin);
  if (url.origin !== origin || url.username || url.password || url.search ||
      !/^\/(?:day\/[1-9]\d*|topics(?:\/[a-z0-9-]+)?|projects|cases|speaking|links|days|business-registration)?\/?$/.test(url.pathname)) {
    throw new Error('僅能讀取本站公開內容頁面。');
  }
  url.hash = '';
  return url;
}
export async function registerWebMcp(context: ModelContext | undefined, deps: Dependencies): Promise<void> {
  if (!context?.registerTool) return;
  for (const scope of ['articles', 'site'] as const) {
    await context.registerTool({
      name: scope === 'articles' ? 'search_articles' : 'search_site',
      description: scope === 'articles'
        ? '搜尋 Dawson Wang 的 AI 實作日誌。支援 keyword 關鍵字或 semantic 語意搜尋，回傳標題、摘要及原文網址，並在頁面顯示結果。'
        : '以關鍵字搜尋 Dawson Wang 的公開網站內容：文章、案例、專案、AI 導入服務、演講、主題、連結與商業登記指南。回傳標題、摘要及網址，並在頁面顯示結果。',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 500 },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
          ...(scope === 'articles' ? { mode: { type: 'string', enum: ['keyword', 'semantic'], default: 'keyword' } } : {}),
        }, required: ['query'],
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input) => {
        const { query, limit = 10, mode = 'keyword' } = input;
        if (typeof query !== 'string' || !query.trim() || query.length > 500 ||
            typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 20 ||
            (mode !== 'keyword' && mode !== 'semantic') || (scope === 'site' && mode !== 'keyword')) {
          throw new Error('請提供 1–500 字的 query、1–20 的 limit，以及支援的搜尋模式。');
        }
        const results = await deps.search(query.trim(), mode, limit, scope);
        deps.show(query.trim(), results);
        return JSON.stringify(results);
      },
    });
  }
  await context.registerTool({
    name: 'read_page',
    description: '讀取本站公開頁面的正文及連結。path 可用搜尋結果的網址，或 /（服務）、/cases、/projects、/speaking、/topics、/links、/days、/day/編號、/business-registration。',
    inputSchema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', maxLength: 2000 } }, required: ['path'] },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async ({ path }) => {
      if (typeof path !== 'string' || !path || path.length > 2000) throw new Error('請提供公開頁面路徑。');
      return JSON.stringify(await deps.read(path));
    },
  });
}
