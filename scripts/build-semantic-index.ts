import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline, env } from '@huggingface/transformers';
import { loadAllDays } from '../src/lib/content-loader';

const MODEL = 'Xenova/bge-small-zh-v1.5';
const CONTENT_DIR = path.resolve(import.meta.dirname, '../100days/content');
const OUT_DIR = path.resolve(import.meta.dirname, '../public/search');
const META_PATH = path.join(OUT_DIR, 'semantic-meta.json');
const VEC_PATH = path.join(OUT_DIR, 'semantic-vectors.bin');
const CACHE_DIR = path.resolve(import.meta.dirname, '../.cache/transformers');

env.cacheDir = CACHE_DIR;
env.allowLocalModels = false;

function snippetFrom(body: string, max = 140): string {
  const cleaned = body.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

function embedText(subtitle: string, body: string): string {
  return [subtitle, body].filter(Boolean).join('\n');
}

async function main() {
  const days = await loadAllDays(CONTENT_DIR);
  console.log(`[semantic-index] Loaded ${days.length} day entries.`);

  console.log(`[semantic-index] Loading model ${MODEL}…`);
  // q8 matches the browser default, so query and passage embeddings come from
  // identical weights — otherwise cosine scores drift slightly.
  const extractor = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });

  const meta: Array<{ day: number; subtitle: string; snippet: string }> = [];
  const vectors: Float32Array[] = [];
  let dim = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const text = embedText(d.subtitle, d.body);
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    const data = out.data as Float32Array;
    if (!dim) dim = data.length;
    if (data.length !== dim) throw new Error(`dim mismatch on day ${d.dayNumber}: ${data.length} vs ${dim}`);
    meta.push({
      day: d.dayNumber,
      subtitle: d.subtitle,
      snippet: snippetFrom(d.body),
    });
    vectors.push(data);
    if ((i + 1) % 20 === 0 || i === days.length - 1) {
      console.log(`[semantic-index]   embedded ${i + 1}/${days.length}`);
    }
  }

  const flat = new Float32Array(vectors.length * dim);
  for (let i = 0; i < vectors.length; i++) flat.set(vectors[i], i * dim);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    META_PATH,
    JSON.stringify({ model: MODEL, dim, count: meta.length, docs: meta }),
    'utf-8',
  );
  await fs.writeFile(VEC_PATH, Buffer.from(flat.buffer));
  console.log(`[semantic-index] Wrote ${meta.length} entries (dim=${dim}):`);
  console.log(`  ${path.relative(process.cwd(), META_PATH)}`);
  console.log(`  ${path.relative(process.cwd(), VEC_PATH)}`);
}

main().catch(err => {
  console.error('[semantic-index] failed:', err);
  process.exit(1);
});
