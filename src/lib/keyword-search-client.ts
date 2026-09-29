export interface KeywordHit {
  url: string;
  excerpt: string;
  meta?: { day?: string; title?: string };
}
interface Pagefind {
  options?: (options: { excerptLength: number }) => Promise<void>;
  search: (query: string) => Promise<{ results: { data: () => Promise<KeywordHit> }[] }>;
}
let pagefindPromise: Promise<Pagefind> | undefined;
export function loadPagefind(): Promise<Pagefind> {
  if (!pagefindPromise) {
    const url = `${window.location.origin}/pagefind/pagefind.js`;
    pagefindPromise = import(/* @vite-ignore */ url).then(async mod => {
      await mod.options?.({ excerptLength: 30 });
      return mod;
    }).catch(() => {
      pagefindPromise = undefined;
      throw new Error('關鍵字索引尚未產生。請執行 yarn build 後在 preview 模式測試。');
    });
  }
  return pagefindPromise;
}
