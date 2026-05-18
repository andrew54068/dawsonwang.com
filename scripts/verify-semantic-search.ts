import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const META_PATH = path.join(ROOT, 'public/search/semantic-meta.json');
const VEC_PATH = path.join(ROOT, 'public/search/semantic-vectors.bin');

const accountId = process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CF_API_TOKEN;
if (!accountId || !apiToken) {
  console.error('CF_ACCOUNT_ID and CF_API_TOKEN must be set');
  process.exit(1);
}

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

const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${meta.model}`;

function normalize(v: number[]): Float32Array {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

async function embed(query: string): Promise<Float32Array> {
  const resp = await fetch(CF_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: [query] }),
  });
  if (!resp.ok) throw new Error(`CF ${resp.status}: ${await resp.text()}`);
  const data = (await resp.json()) as { result?: { data?: number[][] } };
  const v = data?.result?.data?.[0];
  if (!Array.isArray(v)) throw new Error('Unexpected CF response');
  return normalize(v);
}

for (const q of QUERIES) {
  const qv = await embed(q);
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
