/**
 * Browser-side semantic search.
 * Loads the precomputed BGE embedding index, embeds the user's query with
 * transformers.js, and ranks documents by cosine similarity.
 * Both index and model are lazy-loaded on first call.
 */

const MODEL = 'Xenova/bge-small-zh-v1.5';

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
let extractorPromise: Promise<any> | null = null;

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

async function loadExtractor() {
  if (extractorPromise) return extractorPromise;
  extractorPromise = (async () => {
    const { pipeline } = await import('@huggingface/transformers');
    // Must match the dtype used by scripts/build-semantic-index.ts so passage
    // and query embeddings come from identical weights.
    return pipeline('feature-extraction', MODEL, { dtype: 'q8' });
  })();
  return extractorPromise;
}

export async function warmUpSemantic(
  onProgress?: (stage: 'index' | 'model', done: boolean) => void,
): Promise<void> {
  const idxP = loadIndex().then(() => onProgress?.('index', true));
  const mdlP = loadExtractor().then(() => onProgress?.('model', true));
  await Promise.all([idxP, mdlP]);
}

export async function semanticSearch(query: string, topK = 15): Promise<SemanticHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const [idx, extractor] = await Promise.all([loadIndex(), loadExtractor()]);
  const out = await extractor(trimmed, { pooling: 'mean', normalize: true });
  const q = out.data as Float32Array;
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
