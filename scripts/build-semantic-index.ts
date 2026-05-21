import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadAllDays } from '../src/lib/content-loader';

const MODEL = '@cf/baai/bge-m3';
const CONTENT_DIR = path.resolve(import.meta.dirname, '../100days/content');
const OUT_DIR = path.resolve(import.meta.dirname, '../public/search');
const META_PATH = path.join(OUT_DIR, 'semantic-meta.json');
const VEC_PATH = path.join(OUT_DIR, 'semantic-vectors.bin');

const accountId = process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN;
if (!accountId || !apiToken) {
  const message = '[semantic-index] CF_ACCOUNT_ID and CF_API_TOKEN not set; skipping semantic index generation.';
  if (process.env.SEMANTIC_SEARCH_REQUIRED === 'true') {
    console.error(`${message} Set SEMANTIC_SEARCH_REQUIRED=false to allow builds without an index.`);
    process.exit(1);
  }
  console.warn(message);
  process.exit(0);
}
const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

const BATCH = 10;
// bge-m3 accepts up to 8192 tokens. 7500 chars is a safe upper bound for
// mixed CJK+English content (≈ 1 token/char worst case for Chinese).
const MAX_CHARS_PER_DOC = 7500;

interface DocMeta {
  day: number;
  subtitle: string;
  snippet: string;
  hash: string;
}

interface IndexFile {
  model: string;
  dim: number;
  count: number;
  docs: DocMeta[];
}

function snippetFrom(body: string, max = 140): string {
  const cleaned = body.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

function embedText(subtitle: string, body: string): string {
  const joined = [subtitle, body].filter(Boolean).join('\n');
  return joined.length > MAX_CHARS_PER_DOC ? joined.slice(0, MAX_CHARS_PER_DOC) : joined;
}

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function normalize(v: number[]): Float32Array {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

async function loadCache(): Promise<Map<string, Float32Array> | null> {
  let metaRaw: string;
  let vecBuf: Buffer;
  try {
    metaRaw = await fs.readFile(META_PATH, 'utf-8');
    vecBuf = await fs.readFile(VEC_PATH);
  } catch {
    return null;
  }
  let meta: Partial<IndexFile>;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return null;
  }
  if (meta.model !== MODEL || !meta.dim || !Array.isArray(meta.docs)) return null;
  const expectedBytes = meta.docs.length * meta.dim * Float32Array.BYTES_PER_ELEMENT;
  if (vecBuf.byteLength !== expectedBytes) return null;

  const flat = new Float32Array(
    vecBuf.buffer,
    vecBuf.byteOffset,
    vecBuf.byteLength / Float32Array.BYTES_PER_ELEMENT,
  );
  const map = new Map<string, Float32Array>();
  for (let i = 0; i < meta.docs.length; i++) {
    const d = meta.docs[i];
    if (!d.hash) continue;
    map.set(d.hash, flat.slice(i * meta.dim, (i + 1) * meta.dim));
  }
  return map;
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

interface Slot {
  day: number;
  subtitle: string;
  snippet: string;
  hash: string;
  text: string;
  vec?: Float32Array;
}

async function main() {
  const days = await loadAllDays(CONTENT_DIR);
  console.log(`[semantic-index] Loaded ${days.length} day entries.`);

  const cache = await loadCache();
  if (cache) {
    console.log(`[semantic-index] Cache: ${cache.size} prior vectors available for reuse.`);
  } else {
    console.log(`[semantic-index] No reusable cache (first run, model change, or shape mismatch).`);
  }

  const slots: Slot[] = days.map(d => {
    const text = embedText(d.subtitle, d.body);
    return {
      day: d.dayNumber,
      subtitle: d.subtitle,
      snippet: snippetFrom(d.body),
      hash: hashText(text),
      text,
    };
  });

  const toEmbed: number[] = [];
  let reused = 0;
  for (let i = 0; i < slots.length; i++) {
    const cached = cache?.get(slots[i].hash);
    if (cached) {
      slots[i].vec = cached;
      reused++;
    } else {
      toEmbed.push(i);
    }
  }
  const charsSent = toEmbed.reduce((sum, i) => sum + slots[i].text.length, 0);
  console.log(
    `[semantic-index] Reusing ${reused}/${slots.length}. Embedding ${toEmbed.length} new/changed ` +
      `(~${charsSent.toLocaleString()} chars / ${MODEL}).`,
  );

  for (let i = 0; i < toEmbed.length; i += BATCH) {
    const indices = toEmbed.slice(i, i + BATCH);
    const texts = indices.map(idx => slots[idx].text);
    const result = await embedBatch(texts);
    indices.forEach((idx, j) => {
      slots[idx].vec = normalize(result[j]);
    });
    console.log(`[semantic-index]   embedded ${Math.min(i + BATCH, toEmbed.length)}/${toEmbed.length}`);
  }

  let dim = 0;
  for (const s of slots) {
    if (!s.vec) throw new Error(`Missing vector for day ${s.day}`);
    if (!dim) dim = s.vec.length;
    if (s.vec.length !== dim) throw new Error(`dim mismatch on day ${s.day}`);
  }

  const flat = new Float32Array(slots.length * dim);
  slots.forEach((s, i) => flat.set(s.vec!, i * dim));

  const meta: IndexFile = {
    model: MODEL,
    dim,
    count: slots.length,
    docs: slots.map(s => ({ day: s.day, subtitle: s.subtitle, snippet: s.snippet, hash: s.hash })),
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(META_PATH, JSON.stringify(meta), 'utf-8');
  await fs.writeFile(VEC_PATH, Buffer.from(flat.buffer));
  console.log(`[semantic-index] Wrote ${slots.length} entries (dim=${dim}):`);
  console.log(`  ${path.relative(process.cwd(), META_PATH)}`);
  console.log(`  ${path.relative(process.cwd(), VEC_PATH)}`);
}

main().catch(err => {
  console.error('[semantic-index] failed:', err);
  process.exit(1);
});
