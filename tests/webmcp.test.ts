import { describe, expect, test, vi } from 'vitest';
import { publicPageUrl, registerWebMcp, type WebMcpTool } from '../src/lib/webmcp';

const origin = 'https://www.dawsonwang.com';
describe('WebMCP public content', () => {
  test.each(['/day/270', '/projects', '/topics/automation', '/', '/speaking', '/links', '/proof'])('allows public page %s', path => {
    expect(publicPageUrl(path, origin).pathname).toBe(path);
  });
  test.each(['https://evil.test/day/1', '//evil.test/projects', '/api/inquiry', '/inquiry-received', '/day/1?secret=x', '/unknown', '/day/../api/embed'])('rejects non-public URL %s', path => {
    expect(() => publicPageUrl(path, origin)).toThrow();
  });
  test('unsupported browsers do not register or execute anything', async () => {
    await expect(registerWebMcp(undefined, {} as never)).resolves.toBeUndefined();
  });
  test('validates inputs, limits article search and returns the same result it displays', async () => {
    const tools: WebMcpTool[] = [];
    const result = [{ title: '錄音', url: '/day/270', excerpt: '知識庫' }];
    const search = vi.fn(async () => result);
    const show = vi.fn();
    await registerWebMcp({ registerTool: tool => { tools.push(tool); } }, { search, show, read: vi.fn() });
    const tool = tools.find(t => t.name === 'search_articles')!;
    expect(JSON.parse(await tool.execute({ query: ' 錄音 ', limit: 3 }))).toEqual(result);
    expect(search).toHaveBeenCalledWith('錄音', 'keyword', 3, 'articles');
    expect(show).toHaveBeenCalledWith('錄音', result);
    await expect(tool.execute({ query: '', limit: 3 })).rejects.toThrow();
    await expect(tool.execute({ query: 'x', limit: 100 })).rejects.toThrow();
    await expect(tool.execute({ query: 'x', mode: 'bogus' })).rejects.toThrow();
    const site = tools.find(t => t.name === 'search_site')!;
    await site.execute({ query: '服務' });
    expect(search).toHaveBeenLastCalledWith('服務', 'keyword', 10, 'site');
  });
  test('search failures propagate instead of returning success', async () => {
    const tools: WebMcpTool[] = [];
    const show = vi.fn();
    await registerWebMcp({ registerTool: t => { tools.push(t); } }, {
      search: async () => { throw new Error('索引未就緒'); }, show, read: vi.fn(),
    });
    await expect(tools[0].execute({ query: 'MCP' })).rejects.toThrow('索引未就緒');
    expect(show).not.toHaveBeenCalled();
  });
});
