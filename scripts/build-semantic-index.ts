import fs from 'node:fs/promises';
import path from 'node:path';
import { loadAllDays } from '../src/lib/content-loader';

const MODEL = '@cf/baai/bge-m3';
const CONTENT_DIR = path.resolve(import.meta.dirname, '../100days/content');
const OUT_DIR = path.resolve(import.meta.dirname, '../public/search');
const META_PATH = path.join(OUT_DIR, 'semantic-meta.json');
const VEC_PATH = path.join(OUT_DIR, 'semantic-vectors.bin');

const accountId = process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN;
if (!accountId || !apiToken) {
  console.error('[semantic-index] CF_ACCOUNT_ID and CF_API_TOKEN must be set');
  process.exit(1);
}
const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

const BATCH = 10;
const MAX_CHARS_PER_DOC = 4000;

function snippetFrom(body: string, max = 140): string {
  const cleaned = body.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

function embedText(subtitle: string, body: string): string {
  const joined = [subtitle, body].filter(Boolean).join('\n');
  return joined.length > MAX_CHARS_PER_DOC ? joined.slice(0, MAX_CHARS_PER_DOC) : joined;
}

function normalize(v: number[]): Float32Array {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch(CF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text: texts }),
  });
  if (!resp.ok) {
    throw new Error(`CF ${resp.status}: ${await resp.text()}`);
  }
  const data = (await resp.json()) as { result?: { data?: number[][] } };
  const out = data?.result?.data;
  if (!Array.isArray(out) || out.length !== texts.length) {
    throw new Error('Unexpected CF response: ' + JSON.stringify(data).slice(0, 200));
  }
  return out;
}

async function main() {
  const days = await loadAllDays(CONTENT_DIR);
  console.log(`[semantic-index] Loaded ${days.length} day entries.`);
  console.log(`[semantic-index] Embedding via Cloudflare Workers AI: ${MODEL}`);

  const meta: Array<{ day: number; subtitle: string; snippet: string }> = [];
  const normalized: Float32Array[] = [];
  let dim = 0;

  for (let i = 0; i < days.length; i += BATCH) {
    const batch = days.slice(i, i + BATCH);
    const texts = batch.map(d => embedText(d.subtitle, d.body));
    const result = await embedBatch(texts);
    batch.forEach((d, j) => {
      const v = normalize(result[j]);
      if (!dim) dim = v.length;
      if (v.length !== dim) throw new Error(`dim mismatch on day ${d.dayNumber}`);
      meta.push({ day: d.dayNumber, subtitle: d.subtitle, snippet: snippetFrom(d.body) });
      normalized.push(v);
    });
    console.log(`[semantic-index]   embedded ${Math.min(i + BATCH, days.length)}/${days.length}`);
  }

  const flat = new Float32Array(normalized.length * dim);
  for (let i = 0; i < normalized.length; i++) flat.set(normalized[i], i * dim);

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
