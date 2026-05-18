import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline, env } from '@huggingface/transformers';

const ROOT = path.resolve(import.meta.dirname, '..');
const META_PATH = path.join(ROOT, 'public/search/semantic-meta.json');
const VEC_PATH = path.join(ROOT, 'public/search/semantic-vectors.bin');
const CACHE_DIR = path.join(ROOT, '.cache/transformers');

env.cacheDir = CACHE_DIR;
env.allowLocalModels = false;

const QUERIES = process.argv.slice(2);
if (QUERIES.length === 0) {
  QUERIES.push('AI 焦慮', 'prompt 工程', '創業心法', '自動化工作流程');
}

const meta = JSON.parse(await fs.readFile(META_PATH, 'utf-8')) as {
  model: string;
  dim: number;
  count: number;
  docs: Array<{ day: number; subtitle: string; snippet: string }>;
};
const vecBuf = await fs.readFile(VEC_PATH);
const vectors = new Float32Array(
  vecBuf.buffer,
  vecBuf.byteOffset,
  vecBuf.byteLength / Float32Array.BYTES_PER_ELEMENT,
);
if (vectors.length !== meta.count * meta.dim) {
  console.error(`Index mismatch: got ${vectors.length}, expected ${meta.count * meta.dim}`);
  process.exit(1);
}
console.log(`Loaded ${meta.count} docs × ${meta.dim} dim from ${meta.model}\n`);

const extractor = await pipeline('feature-extraction', meta.model, { dtype: 'fp32' });

for (const q of QUERIES) {
  const out = await extractor(q, { pooling: 'mean', normalize: true });
  const qv = out.data as Float32Array;
  const scored = meta.docs.map((d, i) => {
    let s = 0;
    const base = i * meta.dim;
    for (let j = 0; j < meta.dim; j++) s += qv[j] * vectors[base + j];
    return { doc: d, score: s };
  });
  scored.sort((a, b) => b.score - a.score);
  console.log(`━━ "${q}" ━━`);
  scored.slice(0, 5).forEach(({ doc, score }) => {
    console.log(`  ${(score * 100).toFixed(1)}%  Day ${doc.day} — ${doc.subtitle}`);
  });
  console.log();
}
