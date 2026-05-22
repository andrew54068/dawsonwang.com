import { afterEach, describe, expect, test, vi } from 'vitest';

async function importFreshClient() {
  vi.resetModules();
  return import('../src/lib/semantic-search-client');
}

function semanticMeta() {
  return {
    dim: 3,
    count: 3,
    docs: [
      { day: 1, subtitle: '客服自動化', snippet: '把客服流程串 AI' },
      { day: 2, subtitle: '創業心法', snippet: '產品定位與市場' },
      { day: 3, subtitle: 'Prompt 設計', snippet: '提示詞與 agent workflow' },
    ],
  };
}

function vectorResponse(values: number[]) {
  return new Response(new Float32Array(values).buffer);
}

describe('semantic search client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns no results and performs no network calls for blank queries', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { semanticSearch } = await importFreshClient();

    await expect(semanticSearch('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('loads the generated semantic index, embeds the query, and ranks by cosine score', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/search/semantic-meta.json') return Response.json(semanticMeta());
      if (url === '/search/semantic-vectors.bin') {
        return vectorResponse([
          1, 0, 0, // customer automation
          0, 1, 0, // startup
          0, 0, 1, // prompt design
        ]);
      }
      if (url === '/api/embed') {
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual({ 'content-type': 'application/json' });
        expect(JSON.parse(String(init?.body))).toEqual({ query: '客服 AI' });
        return Response.json({ vector: [10, 1, 0] });
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { semanticSearch } = await importFreshClient();

    const hits = await semanticSearch('  客服 AI  ', 2);

    expect(hits).toHaveLength(2);
    expect(hits[0].doc).toMatchObject({ day: 1, subtitle: '客服自動化' });
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('warms the semantic index once and reports model/index progress for the UI', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/search/semantic-meta.json') return Response.json(semanticMeta());
      if (url === '/search/semantic-vectors.bin') {
        return vectorResponse([
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ]);
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { warmUpSemantic } = await importFreshClient();
    const progress = vi.fn();

    await warmUpSemantic(progress);
    await warmUpSemantic(progress);

    expect(progress).toHaveBeenCalledWith('model', true);
    expect(progress).toHaveBeenCalledWith('index', true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
