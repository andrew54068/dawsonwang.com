/**
 * Browser-side semantic search.
 * Loads precomputed BGE-M3 embeddings; embeds queries via /api/embed
 * (proxied to Cloudflare Workers AI). No model download on the client.
 */

export interface SemanticDocMeta {
  day: number;
  subtitle: string;
  snippet: string;
}

export interface SemanticHit {
  doc: SemanticDocMeta;
  score: number;
}

interface LoadedIndex {
  dim: number;
  count: number;
  docs: SemanticDocMeta[];
  vectors: Float32Array;
}

let indexPromise: Promise<LoadedIndex> | null = null;

async function loadIndex(): Promise<LoadedIndex> {
  if (indexPromise) return indexPromise;
  indexPromise = (async () => {
    const [metaRes, vecRes] = await Promise.all([
      fetch('/search/semantic-meta.json'),
      fetch('/search/semantic-vectors.bin'),
    ]);
    if (!metaRes.ok || !vecRes.ok) {
      throw new Error(
        '語意搜尋索引找不到。請執行 `yarn search:semantic` 或完整 `yarn build`。',
      );
    }
    const meta = await metaRes.json();
    const buf = await vecRes.arrayBuffer();
    const vectors = new Float32Array(buf);
    if (vectors.length !== meta.count * meta.dim) {
      throw new Error('Semantic index dimension mismatch');
    }
    return { dim: meta.dim, count: meta.count, docs: meta.docs, vectors };
  })();
  return indexPromise;
}

export async function warmUpSemantic(
  onProgress?: (stage: 'index' | 'model', done: boolean) => void,
): Promise<void> {
  // No client-side model anymore. We still expose the same shape so the
  // search page UI does not need a rewrite; "model" is marked done immediately.
  onProgress?.('model', true);
  await loadIndex();
  onProgress?.('index', true);
}

async function embedQuery(query: string): Promise<Float32Array> {
  const resp = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`查詢向量化失敗 (${resp.status}) ${err}`.trim());
  }
  const data = (await resp.json()) as { vector?: unknown };
  if (!Array.isArray(data.vector)) throw new Error('Unexpected /api/embed response');
  const v = data.vector as number[];
  // Re-normalize defensively so cosine-as-dot-product is correct regardless
  // of upstream behavior.
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

export async function semanticSearch(query: string, topK = 15): Promise<SemanticHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const [idx, q] = await Promise.all([loadIndex(), embedQuery(trimmed)]);
  if (q.length !== idx.dim) {
    throw new Error(`Query dim ${q.length} ≠ index dim ${idx.dim}`);
  }

  const hits: SemanticHit[] = new Array(idx.count);
  for (let i = 0; i < idx.count; i++) {
    const base = i * idx.dim;
    let s = 0;
    for (let j = 0; j < idx.dim; j++) s += q[j] * idx.vectors[base + j];
    hits[i] = { doc: idx.docs[i], score: s };
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, topK);
}
