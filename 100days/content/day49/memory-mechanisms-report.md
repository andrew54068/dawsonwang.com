# Memory Mechanisms: OpenClaw vs. ZeroClaw vs. OpenViking

**Research Date**: 2026-02-18
**Methodology**: Web research (official sites, docs, GitHub) + local source code analysis with file:line references

---

## Table of Contents

1. [OpenClaw](#1-openclaw)
2. [ZeroClaw](#2-zeroclaw)
3. [OpenViking](#3-openviking)
4. [Comparison Table](#4-comparison-table)
5. [Overall Analysis](#5-overall-analysis)

---

## 1. OpenClaw

**Language**: TypeScript/Node.js | **Source**: `/Users/dawson/Documents/openclaw/`

### 1.1 Official Claims

From official documentation at `docs.openclaw.ai/concepts/memory`:

- **"Plain Markdown in the agent workspace"** — files are the source of truth; the model only "remembers" what gets written to disk
- **Two memory layers**: Daily logs (`memory/YYYY-MM-DD.md`) as append-only ephemeral memory, and `MEMORY.md` as curated long-term memory
- **Automatic memory flush (pre-compaction)**: When sessions approach auto-compaction, a silent agentic turn persists durable memories before context is lost
- **Hybrid search (BM25 + vector)**: Combines semantic vector similarity with BM25 keyword relevance
- **Two tools**: `memory_search` (semantic query) and `memory_get` (read specific file/lines)
- **SQLite storage**: Per-agent SQLite database at `~/.openclaw/memory/<agentId>.sqlite`
- **Temporal decay**: Exponential decay on older memories with configurable half-life (default 30 days), "evergreen" files exempt
- **MMR re-ranking**: Maximal Marginal Relevance for diversity-aware result re-ranking
- **Embedding providers**: Auto-selection cascade: local (node-llama-cpp) → OpenAI → Gemini → Voyage; FTS-only fallback when none available
- **QMD backend (experimental)**: Optional local-first search sidecar combining BM25 + vectors + reranking
- **Session memory (experimental)**: Optional indexing of session transcripts
- **sqlite-vec acceleration**: Optional SQLite extension for fast in-database vector distance queries
- **Embedding cache**: Chunk-level SQLite caching to avoid re-embedding unchanged text
- **File watchers**: Changes to memory files detected with debounced watcher (1.5s), triggering async reindexing

### 1.2 Code Reality

| Feature | Implementation | File:Line Reference |
|---------|---------------|-------------------|
| **Markdown source of truth** | `listMemoryFiles()` scans for `MEMORY.md`, `memory.md`, and recursively walks `memory/` for `.md` files | `src/memory/internal.ts:78-144` |
| **Memory path validation** | `isMemoryPath()` validates paths against `MEMORY.md` or `memory/` prefix | `src/memory/internal.ts:46-55` |
| **Markdown chunking** | `chunkMarkdown()` splits content by lines, target 400 tokens (1600 chars), 80 token overlap (320 chars). Each chunk tracks `startLine`, `endLine`, `text`, SHA-256 `hash` | `src/memory/internal.ts:166-247` |
| **Chunk defaults** | `DEFAULT_CHUNK_TOKENS = 400`, `DEFAULT_CHUNK_OVERLAP = 80` | `src/agents/memory-search.ts:84-85` |
| **SQLite schema** | Tables: `meta`, `files`, `chunks`, `embedding_cache`, `chunks_fts` (FTS5), `chunks_vec` (vec0) | `src/memory/memory-schema.ts:1-96` |
| **Vector table** | `chunks_vec` as `vec0` virtual table with `FLOAT[dimensions]` | `src/memory/manager-sync-ops.ts:215-221` |
| **Store path** | `~/.openclaw/memory/<agentId>.sqlite` | `src/agents/memory-search.ts:122-130` |
| **Embedding cascade** | `auto` mode: tries local → openai → gemini → voyage; returns `null` for FTS-only | `src/memory/embeddings.ts:138-244` |
| **Local embeddings** | `node-llama-cpp` with lazy loading, model: `embeddinggemma-300m-qat-Q8_0.gguf` | `src/memory/embeddings.ts:90-136` |
| **Hybrid search** | FTS-only fallback (no provider) or parallel keyword + vector → `mergeHybridResults()` | `src/memory/manager.ts:203-289` |
| **Hybrid merge formula** | `vectorWeight * vecScore + textWeight * textScore`, with normalization | `src/memory/hybrid.ts:51-149` |
| **BM25 score conversion** | `1 / (1 + max(0, rank))` | `src/memory/hybrid.ts:46-49` |
| **Vector search** | `vec_distance_cosine()` via sqlite-vec, JS cosine similarity fallback | `src/memory/manager-search.ts:20-94` |
| **Keyword search** | FTS5 MATCH with BM25 ranking | `src/memory/manager-search.ts:136-191` |
| **Temporal decay** | Exponential decay: `Math.exp(-lambda * clampedAge)`, lambda = `ln(2) / halfLifeDays` | `src/memory/temporal-decay.ts:17-34` |
| **Decay defaults** | `enabled: false`, `halfLifeDays: 30` | `src/memory/temporal-decay.ts:9-12` |
| **Evergreen detection** | `isEvergreenMemoryPath()` exempts `MEMORY.md` and non-dated files | `src/memory/temporal-decay.ts:71-80` |
| **Date extraction from paths** | `parseMemoryDateFromPath()` extracts dates from `memory/YYYY-MM-DD.md` | `src/memory/temporal-decay.ts:44-69` |
| **MMR re-ranking** | Cites Carbonell & Goldstein (1998); Jaccard similarity; `lambda * relevance - (1-lambda) * maxSimilarity` | `src/memory/mmr.ts:1-183` |
| **MMR defaults** | `enabled: false`, `lambda: 0.7` | `src/memory/mmr.ts:23-26` |
| **Pre-compaction flush** | Triggers when `totalTokens >= contextWindow - reserve - softThreshold(4000)` | `src/auto-reply/reply/memory-flush.ts:113-144` |
| **Flush execution** | Runs embedded Pi agent with flush prompt; appends to `memory/YYYY-MM-DD.md` | `src/auto-reply/reply/agent-runner-memory.ts:33-195` |
| **memory_search tool** | Semantic query of chunked Markdown | `src/agents/tools/memory-tool.ts:40-98` |
| **memory_get tool** | Read specific file/lines from memory | `src/agents/tools/memory-tool.ts:101-140` |
| **System prompt integration** | "Before answering... run memory_search" instruction | `src/agents/system-prompt.ts:49-54` |
| **QMD backend** | Full `QmdMemoryManager` class (1239 lines), spawns external `qmd` CLI binary | `src/memory/qmd-manager.ts:55-1239` |
| **Fallback manager** | `FallbackMemoryManager` tries QMD first, degrades to builtin | `src/memory/search-manager.ts:19-73` |
| **Session memory** | Session listener with delta-based sync (5s debounce), `deltaBytes: 100K`, `deltaMessages: 50` | `src/memory/manager-sync-ops.ts:395-460` |
| **sqlite-vec** | `loadSqliteVecExtension()` loads native extension | `src/memory/sqlite-vec.ts:1-24` |
| **Embedding cache** | `embedding_cache` table, composite primary key on (provider, model, provider_key, hash) | `src/memory/memory-schema.ts:38-52` |
| **File watcher** | `chokidar` with `awaitWriteFinish`, configurable debounce (default 1500ms) | `src/memory/manager-sync-ops.ts:351-393` |
| **Query expansion** | Stop word filtering for English AND Chinese | `src/memory/query-expansion.ts:1-357` |
| **Atomic reindex** | Temp DB → swap to prevent corruption | `src/memory/manager-sync-ops.ts:978-1084` |
| **Snippet cap** | `SNIPPET_MAX_CHARS = 700` | `src/memory/manager.ts:31` |
| **Batch embeddings** | OpenAI, Gemini, Voyage batch providers | `src/memory/batch-openai.ts`, `batch-gemini.ts`, `batch-voyage.ts` |

### 1.3 Claim vs. Reality

| Claim | Verdict | Notes |
|-------|---------|-------|
| Markdown files as source of truth | **FULLY VERIFIED** | Scans `MEMORY.md` + `memory/*.md` |
| Daily logs + curated MEMORY.md | **FULLY VERIFIED** | Both paths implemented |
| Pre-compaction memory flush | **FULLY VERIFIED** | Full agentic turn with token threshold trigger |
| Hybrid BM25 + vector search | **FULLY VERIFIED** | Parallel execution, weighted merge |
| Temporal decay (exponential) | **FULLY VERIFIED** | Half-life formula, evergreen exemption |
| MMR re-ranking | **FULLY VERIFIED** | Jaccard-based diversity re-ranking |
| SQLite per-agent index | **FULLY VERIFIED** | Full schema with FTS5 + vec0 |
| sqlite-vec acceleration | **FULLY VERIFIED** | Native extension + JS fallback |
| Embedding cache | **FULLY VERIFIED** | SQLite table with composite key |
| Provider cascade (local→openai→gemini→voyage) | **FULLY VERIFIED** | Auto mode with graceful fallback |
| FTS-only fallback | **FULLY VERIFIED** | When no embedding provider available |
| QMD experimental backend | **FULLY VERIFIED** | 1239-line implementation |
| Session memory | **FULLY VERIFIED** | Delta-based sync with debounce |
| File watchers | **FULLY VERIFIED** | chokidar with 1.5s debounce |
| Two agent tools | **FULLY VERIFIED** | memory_search + memory_get |

**Undocumented features found in code:**
- Multilingual query expansion (EN + ZH stop words)
- Atomic index rebuilding via temp DB swap
- Fallback memory manager wrapping QMD → builtin
- Batch embedding support for all 3 remote providers
- Session transcript export to Markdown for QMD

**Soft enforcement noted:**
- `MEMORY.md` "only in private sessions" is enforced via system prompt instruction, not hard access control

### 1.4 Architecture

```
USER MESSAGE
    │
    ▼
┌──────────────────────────────────────────┐
│          AGENT LOOP (Pi Runtime)         │
│  System Prompt: "Before answering...     │
│  run memory_search"                      │
│  Tools: memory_search, memory_get        │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
memory_search         memory_get
    │                     │
    ▼                     ▼
┌──────────────────────────────────────────┐
│      SEARCH MANAGER                      │
│  1. QMD (experimental) ──► qmd CLI       │
│  2. Builtin SQLite ──────► (fallback)    │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
VECTOR SEARCH         KEYWORD SEARCH
(sqlite-vec or        (FTS5 MATCH +
 JS cosine)            BM25 rank)
    │                     │
    └──────────┬──────────┘
               ▼
        HYBRID MERGE
        score = vW*vec + tW*text
               │
               ▼
        POST-PROCESSING
        1. Temporal Decay (exp, 30d half-life)
        2. Sort by score
        3. MMR Re-ranking (Jaccard diversity)
        4. Top-K + minScore filter
               │
               ▼
        SEARCH RESULTS

=== WRITE PATH ===

PRE-COMPACTION FLUSH ──► Silent agentic turn
    │                     writes to memory/YYYY-MM-DD.md
    ▼
WORKSPACE (filesystem)
    MEMORY.md (long-term, curated)
    memory/YYYY-MM-DD.md (daily logs)
    │
    ▼ (chokidar watcher, 1.5s debounce)
INDEX SYNC
    1. Hash comparison (skip unchanged)
    2. Chunk Markdown (~400 tokens)
    3. Embed (provider cascade)
    4. Store in SQLite (chunks + FTS + vec)

=== STORAGE ===

~/.openclaw/memory/<agentId>.sqlite
    ├── meta (version/config)
    ├── files (path, hash, mtime)
    ├── chunks (text, embedding, lines)
    ├── chunks_fts (FTS5 full-text)
    ├── chunks_vec (vec0 vector)
    └── embedding_cache

=== EMBEDDING PROVIDERS (auto-cascade) ===

1. Local (node-llama-cpp, embeddinggemma GGUF)
2. OpenAI (text-embedding-3-small)
3. Gemini (gemini-embedding-001)
4. Voyage (voyage-4-large)
5. NULL → FTS-only mode
```

---

## 2. ZeroClaw

**Language**: Rust | **Source**: `/Users/dawson/Documents/zeroclaw/`

### 2.1 Official Claims

From README and web sources:

- **Full-stack search engine**: "All custom, zero external dependencies — no Pinecone, no Elasticsearch, no LangChain"
- **Vector DB layer**: Embeddings stored as BLOB in SQLite, cosine similarity search
- **Keyword search**: FTS5 virtual tables with BM25 scoring
- **Hybrid merge**: Custom weighted merge function (default 0.7 vector + 0.3 keyword)
- **Embeddings**: `EmbeddingProvider` trait — OpenAI, custom URL, or noop
- **Chunking**: Line-based markdown chunker with heading preservation
- **Caching**: SQLite `embedding_cache` table with LRU eviction
- **Safe reindex**: Rebuild FTS5 + re-embed missing vectors atomically
- **Four backends**: sqlite, lucid, markdown, none
- **Agent auto-management**: Auto recall before LLM, auto-save after response

### 2.2 Code Reality

| Feature | Implementation | File:Line Reference |
|---------|---------------|-------------------|
| **Memory trait** | 7 methods: `name`, `store`, `recall`, `get`, `list`, `forget`, `count`, `health_check` | `src/memory/traits.rs:42-68` |
| **MemoryEntry struct** | `id`, `key`, `content`, `category`, `timestamp`, `session_id`, `score` | `src/memory/traits.rs:6-14` |
| **MemoryCategory enum** | `Core`, `Daily`, `Conversation`, `Custom(String)` | `src/memory/traits.rs:17-28` |
| **SQLite schema** | `memories` table (id, key, content, category, embedding BLOB, timestamps) | `src/memory/sqlite.rs:82-127` |
| **FTS5 table** | `memories_fts` with content-sync triggers (insert/delete/update) | `src/memory/sqlite.rs:97-115` |
| **Embedding cache** | `embedding_cache` table: `content_hash` PRIMARY KEY, `embedding` BLOB, LRU via `accessed_at` | `src/memory/sqlite.rs:118-124` |
| **SQLite tuning** | WAL mode, normal sync, 8MB mmap, 2MB cache, memory temp_store | `src/memory/sqlite.rs:60-66` |
| **Store operation** | Computes embedding async, upserts to `memories` with `ON CONFLICT(key) DO UPDATE` | `src/memory/sqlite.rs:358-390` |
| **Recall operation** | FTS5 BM25 → vector cosine → hybrid_merge() → LIKE fallback | `src/memory/sqlite.rs:392-507` |
| **FTS5 search** | `fts5_search` using `bm25(memories_fts)` | `src/memory/sqlite.rs:228-268` |
| **Vector search** | Brute-force scan of ALL embeddings, computes cosine similarity | `src/memory/sqlite.rs:271-298` |
| **Cosine similarity** | `dot_product / (norm_a * norm_b)`, clamped [0,1], NaN/Inf safe | `src/memory/vector.rs:4-35` |
| **BLOB serialization** | Little-endian f32 to/from BLOB | `src/memory/vector.rs:38-55` |
| **Hybrid merge** | `final = vw * normalized_cosine + kw * normalized_bm25`, dedup by ID | `src/memory/vector.rs:72-132` |
| **Embedding providers** | `EmbeddingProvider` trait: `OpenAiEmbedding`, `NoopEmbedding`, `custom:URL` | `src/memory/embeddings.rs:4-180` |
| **Markdown backend** | Stores to `MEMORY.md` (core) or `memory/YYYY-MM-DD.md` (daily), keyword matching recall | `src/memory/markdown.rs` |
| **Markdown forget** | Always returns false — append-only by design (audit trail) | `src/memory/markdown.rs:203-207` |
| **Lucid backend** | Wraps SQLite + shells out to `lucid` CLI, 15s failure cooldown | `src/memory/lucid.rs:12-374` |
| **Noop backend** | All operations no-op | `src/memory/none.rs` |
| **Chunker** | `chunk_markdown()`: splits on headings/paragraphs/lines, ~4 chars/token, max 512 tokens | `src/memory/chunker.rs:22-107` |
| **Hygiene** | Runs every 12h: archive daily >7d, purge >30d, prune conversation rows >30d | `src/memory/hygiene.rs:41-319` |
| **Memory snapshot** | Exports Core memories to `MEMORY_SNAPSHOT.md`; auto-hydrates on cold boot if brain.db missing | `src/memory/snapshot.rs:27-199` |
| **Response cache** | Separate `response_cache.db`, SHA-256 keyed, TTL 60min, LRU 5000 entries | `src/memory/response_cache.rs` |
| **Auto-save input** | `mem.store(user_msg, Conversation)` in agent loop | `src/agent/loop_.rs:830-834` |
| **Auto-recall** | `build_context(mem, msg)` → `mem.recall(msg, 5)` injected before LLM | `src/agent/loop_.rs:126-142` |
| **Auto-save output** | Stores truncated response (100 chars) as Daily | `src/agent/loop_.rs:872-878` |
| **Agent tools** | `memory_store`, `memory_recall`, `memory_forget` | `src/tools/memory_store.rs`, `memory_recall.rs`, `memory_forget.rs` |
| **DB location** | `workspace_dir/memory/brain.db` | `src/memory/sqlite.rs:46` |
| **Config defaults** | backend="sqlite", auto_save=true, vector_weight=0.7, keyword_weight=0.3, embedding_provider="none", dims=1536, cache=10K | `src/config/schema.rs:711-837` |

### 2.3 Claim vs. Reality

| Claim | Verdict | Notes |
|-------|---------|-------|
| Full-stack, no external deps | **CONFIRMED** | Everything in SQLite, no Pinecone/ES/LC |
| Vector DB: BLOB + cosine | **CONFIRMED** | But **brute-force linear scan**, not indexed ANN — degrades at scale |
| FTS5 + BM25 | **CONFIRMED** | Properly implemented with sync triggers |
| Hybrid merge (weighted fusion) | **CONFIRMED** | `vw * cosine + kw * bm25`, with normalization |
| EmbeddingProvider trait (3 options) | **CONFIRMED** | OpenAI, custom:URL, Noop |
| Markdown chunker | **PARTIALLY CONFIRMED** | Chunker **exists** but is **NOT wired** into the memory pipeline. Memories stored as-is. |
| Embedding cache + LRU | **CONFIRMED** | SHA-256 keyed, 10K max |
| Safe reindex | **PARTIALLY CONFIRMED** | `reindex()` exists but is `#[allow(dead_code)]` — no production callers |
| Four backends | **CONFIRMED** | sqlite, lucid, markdown, none |
| Auto recall + save | **CONFIRMED** | Recall before LLM, save after response |

**Key discrepancy:**
- README example config shows `embedding_provider = "openai"` but **code default is `"none"`** (`schema.rs:773-774`). Out of the box, only keyword search works.

**Undocumented features found in code:**
- Memory Snapshot / Soul Backup (`MEMORY_SNAPSHOT.md`) with cold-boot auto-hydration
- Response cache (separate SQLite DB, TTL+LRU)
- Conversation history compaction (auto-summarizes old turns)
- Conversation retention pruning (deletes >30d rows)
- Lucid CLI bridge with failure cooldown
- OpenClaw migration support (`zeroclaw migrate openclaw`)

### 2.4 Architecture

```
USER MESSAGE
    │
    ▼
┌──────────────────────────────────────────┐
│            AGENT LOOP (Rust)             │
│                                          │
│  1. Auto-save user msg (Conversation)    │
│  2. build_context() → recall(msg, 5)     │
│  3. Inject [Memory context] prefix       │
│  4. LLM call (with memory tools)         │
│  5. Auto-save response (Daily, 100 char) │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
Memory Trait          Agent Tools
(pluggable)           memory_store
    │                 memory_recall
    │                 memory_forget
    │
    ├── SQLite (primary)
    │     │
    │     ├── FTS5 BM25 keyword search
    │     ├── Brute-force cosine vector scan
    │     ├── Hybrid merge (0.7v + 0.3k)
    │     └── LIKE fallback
    │
    ├── Lucid (bridge)
    │     └── SQLite local + lucid CLI remote
    │         (15s failure cooldown)
    │
    ├── Markdown (file-based)
    │     ├── MEMORY.md (core, append-only)
    │     └── memory/YYYY-MM-DD.md (daily)
    │
    └── None (noop)

=== STORAGE ===

workspace/memory/brain.db
    ├── memories (id, key, content, category, embedding BLOB)
    ├── memories_fts (FTS5, content-synced via triggers)
    └── embedding_cache (content_hash → embedding, LRU 10K)

workspace/memory/response_cache.db (opt-in)
    └── response_cache (prompt_hash → response, TTL 60min)

MEMORY_SNAPSHOT.md (soul backup, opt-in)

=== LIFECYCLE ===

Hygiene (every 12h):
    1. Archive daily/session files >7d → archive/
    2. Purge archives >30d
    3. Prune conversation rows >30d from SQLite

Snapshot (opt-in):
    Export Core → MEMORY_SNAPSHOT.md
    Auto-hydrate on cold boot if brain.db missing

=== EMBEDDING PROVIDERS ===

1. OpenAI (text-embedding-3-small, 1536d)
2. custom:URL (OpenAI-compatible endpoint)
3. Noop (keyword-only, DEFAULT)
```

---

## 3. OpenViking

**Language**: Python | **Source**: `/Users/dawson/Documents/OpenViking/`
**Origin**: ByteDance / Volcengine Viking team

### 3.1 Official Claims

From official website (`openviking.ai`), GitHub, and README:

- **"Context Database for AI Agents"** — rejects traditional RAG's fragmented vector storage; adopts a filesystem paradigm
- **Filesystem management paradigm**: Unified context management treating all context (memory, resources, skills) as directories/files under `viking://` URIs
- **Tiered context loading (L0/L1/L2)**: L0 (Abstract, ~100 tokens), L1 (Overview, ~2k tokens), L2 (Detail, full content) — loaded on demand
- **Directory recursive retrieval**: Combines directory positioning with semantic search for hierarchical drilling
- **Visualized retrieval trajectory**: Observable context with visible directory retrieval trajectories
- **Automatic session management / context self-iteration**: Automatic compression, memory extraction at session end, making the agent "smarter with use"
- **6 memory categories**: User (profile, preferences, entities, events) + Agent (cases, patterns)
- **LLM-powered deduplication**: CREATE/UPDATE/MERGE/SKIP decisions
- **Dual-layer storage**: AGFS (content) + Vector Index (semantic search)

### 3.2 Code Reality

| Feature | Implementation | File:Line Reference |
|---------|---------------|-------------------|
| **6 memory categories** | `MemoryCategory` enum: PROFILE, PREFERENCES, ENTITIES, EVENTS, CASES, PATTERNS | `openviking/session/memory_extractor.py:27-38` |
| **Category→directory mapping** | Profile→`memories/profile.md`, others→`user/memories/` or `agent/memories/` | `openviking/session/memory_extractor.py:57-65` |
| **LLM memory extraction** | Takes session messages, detects language, calls LLM with `compression.memory_extraction` template | `openviking/session/memory_extractor.py:113-185` |
| **Extraction prompt** | 232-line YAML template with category definitions, few-shot examples, L0/L1/L2 output spec | `openviking/prompts/templates/compression/memory_extraction.yaml` |
| **Memory persistence** | Profile: LLM merge append to `viking://user/memories/profile.md`; Others: UUID file `mem_{uuid}.md` via AGFS | `openviking/session/memory_extractor.py:187-254` |
| **VikingFS** | Wraps `AGFSClient`, translates `viking://` URIs to `/local/` paths | `openviking/storage/viking_fs.py:102-122` |
| **Deduplication** | Vector pre-filter (threshold=0.7, top 5) → LLM decision (CREATE/MERGE/SKIP) | `openviking/session/memory_deduplicator.py:56-179` |
| **Dedup prompt** | `compression.dedup_decision` template, returns JSON | `openviking/prompts/templates/compression/dedup_decision.yaml` |
| **Session compression** | `Session.commit()`: archives to `history/archive_NNN/`, LLM summary, clears messages | `openviking/session/session.py:201-274` |
| **Structured summary** | LLM-generated `.abstract.md` (L0) + `.overview.md` (L1) for archives | `openviking/session/session.py:357-418` |
| **Memory extraction trigger** | `SessionCompressor.extract_long_term_memories()` called during commit | `openviking/session/session.py:238-251` |
| **Session compressor** | Orchestrates: extract → dedup → persist → create relations | `openviking/session/compressor.py:45-207` |
| **Profile always merges** | Skips dedup, always LLM-merges old+new content | `openviking/session/compressor.py:87-94` |
| **Memory merge prompt** | `compression.memory_merge` template: removes duplicates, keeps latest | `openviking/prompts/templates/compression/memory_merge.yaml` |
| **L0/L1/L2 tiered loading** | `VikingFS.abstract()` reads `.abstract.md`, `overview()` reads `.overview.md`, L2 = full content | `openviking/storage/viking_fs.py:348-372` |
| **Bottom-up L0/L1 generation** | `SemanticProcessor._process_single_directory()`: collect child abstracts → LLM summarize → write L0/L1 | `openviking/storage/queuefs/semantic_processor.py:195-229` |
| **Hierarchical retriever** | Priority queue traversal, score propagation `alpha=0.5` (50% embed + 50% parent), convergence after 3 stable rounds | `openviking/retrieve/hierarchical_retriever.py:34-407` |
| **Global vector search** | Finds top-3 relevant directories globally, then drills recursively | `openviking/retrieve/hierarchical_retriever.py:165-189` |
| **Root URI mapping** | Memory→`viking://user/memories`+`viking://agent/memories`; Resources→`viking://resources`; Skills→`viking://agent/skills` | `openviking/retrieve/hierarchical_retriever.py:392-400` |
| **Intent analysis** | LLM analyzes session context → 0-5 `TypedQuery` with type (MEMORY/RESOURCE/SKILL), intent, priority | `openviking/retrieve/intent_analyzer.py:35-97` |
| **Vector collection schema** | Unified `context` collection: id, uri, type, context_type, vector (dense), sparse_vector, active_count, parent_uri, is_leaf, abstract | `openviking/storage/collection_schemas.py:29-72` |
| **Local vector DB** | In-memory (`VolatileCollection`) and persistent (`PersistCollection`), dense+sparse hybrid, scalar filtering, TTL | `openviking/storage/vectordb/collection/local_collection.py` |
| **Embedding handler** | `TextEmbeddingHandler.on_dequeue()`: generates dense+sparse vectors, writes to vector DB | `openviking/storage/collection_schemas.py:94-206` |
| **Active count tracking** | `Session.commit()` increments `active_count` for used contexts | `openviking/session/session.py:276-299` |
| **Relation management** | `.relations.json` in directories, `link()`/`unlink()` for bidirectional relations | `openviking/storage/viking_fs.py:586-640` |
| **Context model** | `Context` class with uri, parent_uri, is_leaf, abstract, context_type, category, active_count, vector | `openviking/core/context.py:42-189` |
| **Language detection** | Regex-based CJK/Korean/Russian/Arabic script detection for memory output language | `openviking/session/memory_extractor.py:71-111` |
| **Rerank** | Structurally coded but `self._rerank_client = None` with `# TODO` comment | `openviking/retrieve/hierarchical_retriever.py:63-73` |
| **MCP converter** | Model Context Protocol support | `openviking/core/mcp_converter.py` |

### 3.3 Claim vs. Reality

| Claim | Verdict | Notes |
|-------|---------|-------|
| Filesystem paradigm (viking:// URIs) | **CONFIRMED** | Full VikingFS + AGFS implementation |
| 3 context types (Resource/Memory/Skill) | **CONFIRMED** | `ContextType` enum, all code paths use it |
| 6 memory categories | **CONFIRMED** | Enum + extraction prompt + directory mapping |
| L0/L1/L2 tiered loading | **CONFIRMED** | `.abstract.md`, `.overview.md`, content files; bottom-up LLM generation |
| Directory recursive retrieval | **CONFIRMED** | heapq priority queue, score propagation, convergence detection |
| Automatic session compression | **CONFIRMED** | `Session.commit()` archives + summarizes + clears |
| Memory self-iteration / extraction | **CONFIRMED** | LLM-powered 6-category extraction from sessions |
| Dedup: CREATE/UPDATE/MERGE/SKIP | **PARTIAL** | Code only implements CREATE/MERGE/SKIP. **UPDATE is missing** from `DedupDecision` enum |
| Visualized retrieval trajectory | **PARTIAL** | Data exists (`searched_directories`, `query_plan`), but **no visualization layer** |
| Rerank | **NOT FUNCTIONAL** | Code structure present, but client is `None` with `# TODO` |
| Dual-layer storage (AGFS + Vector) | **CONFIRMED** | Both initialized and synchronized |
| Multiple VLM providers | **CONFIRMED** | volcengine, openai, anthropic, deepseek, gemini, etc. |

**Undocumented features found in code:**
- Language detection for memory output (CJK/Korean/Russian/Arabic regex)
- Dense + sparse hybrid vector search
- TTL-based data expiration in vector DB
- Background index maintenance and scheduled rebuilds
- MCP (Model Context Protocol) converter support

---

## 4. Comparison Table

| Dimension | OpenClaw | ZeroClaw | OpenViking |
|-----------|----------|----------|------------|
| **Language** | TypeScript/Node.js | Rust | Python |
| **Philosophy** | Markdown is source of truth; human-readable files first | Zero external deps; full-stack in SQLite | Context Database; filesystem paradigm for AI agents |
| **Memory Model** | 2 layers: Daily logs + curated MEMORY.md | 4 categories: Core, Daily, Conversation, Custom | 6 categories: profile, preferences, entities, events, cases, patterns |
| **Storage Backend** | SQLite per-agent (`~/.openclaw/memory/<agentId>.sqlite`) | SQLite (`workspace/memory/brain.db`) | AGFS virtual filesystem (local/S3/memory) + Vector DB |
| **Content Storage** | Markdown files on disk (source of truth) → indexed into SQLite | SQLite `memories` table (text + embedding BLOB) | Markdown files in AGFS virtual filesystem |
| **Vector Storage** | `chunks_vec` (vec0 virtual table) or JS fallback | Embedding BLOB column in `memories` table | Dedicated vector DB (local persistent/volatile) |
| **Vector Search** | sqlite-vec `vec_distance_cosine()` or JS cosine | Brute-force linear scan of all BLOBs | Dense + sparse hybrid in custom vector DB |
| **Keyword Search** | FTS5 with BM25 ranking | FTS5 with BM25 ranking | Not explicitly BM25; relies on vector search + sparse vectors |
| **Hybrid Strategy** | Parallel BM25 + vector → weighted merge | Sequential: FTS5 → vector → hybrid merge → LIKE fallback | Hierarchical: global vector → recursive directory drill-down |
| **Hybrid Weights** | Configurable (default varies) | 0.7 vector + 0.3 keyword | Score propagation alpha=0.5 (50% embed + 50% parent) |
| **Temporal Decay** | Exponential, 30d half-life, evergreen exemption | None (hygiene-based: archive >7d, purge >30d) | None (usage-based: active_count tracking) |
| **MMR / Diversity** | Jaccard-based MMR re-ranking (Carbonell & Goldstein) | None | Rerank structure exists but not functional |
| **Embedding Providers** | 4+1: local (GGUF), OpenAI, Gemini, Voyage, FTS-only | 3: OpenAI, custom:URL, Noop | Multiple: volcengine, openai, anthropic, deepseek, gemini, etc. |
| **Local Embeddings** | Yes (node-llama-cpp, embeddinggemma GGUF) | No | No |
| **Embedding Cache** | SQLite `embedding_cache` table | SQLite `embedding_cache` table (LRU 10K) | Not explicit; handled by vector DB layer |
| **Chunking** | Markdown line-based, 400 tokens, 80 overlap | Exists (heading-aware, 512 tokens) but **not wired in** | Not chunk-based; L0/L1/L2 tiered abstraction instead |
| **Memory Write Path** | Agent writes to disk → file watcher → async reindex | Direct SQLite insert (store API) | LLM extracts from session → dedup → persist to AGFS + vectorize |
| **Memory Lifecycle** | File watcher detects changes, debounced reindex | Hygiene: archive/purge/prune on schedule (12h) | Session commit → compress → extract → dedup → merge |
| **Auto-Save** | Pre-compaction flush (silent agentic turn) | Auto-save user msgs + assistant responses | Auto-extraction of memories at session commit |
| **Session Memory** | Experimental: indexes session transcripts | Conversation category in SQLite | Session archives with structured summaries |
| **Agent Tools** | 2: memory_search, memory_get | 3: memory_store, memory_recall, memory_forget | Intent-driven search + hierarchical retrieval |
| **Deduplication** | Hash-based (skip unchanged chunks) | Upsert on key conflict | LLM-powered: vector pre-filter → LLM CREATE/MERGE/SKIP decision |
| **Memory Merge** | N/A (files are source of truth) | N/A (upsert overwrites) | LLM-powered merge for profile/preferences/entities/patterns |
| **Retrieval Strategy** | Flat semantic search (query → results) | Flat semantic search (query → results) | **Hierarchical** directory recursive retrieval with score propagation |
| **Multi-Query** | Single query | Single query | Intent analysis → 0-5 typed queries (MEMORY/RESOURCE/SKILL) |
| **Context Tiering** | No (full chunks returned) | No (full content returned) | **L0/L1/L2**: Abstract (~100 tok) → Overview (~2K tok) → Detail (full) |
| **Relation Tracking** | No | No | Bidirectional relations between memories, resources, skills |
| **Usage Tracking** | No | No | `active_count` incremented per session |
| **Multiple Backends** | 2: Builtin SQLite, QMD sidecar | 4: SQLite, Lucid, Markdown, None | AGFS (local/S3/memory) + multiple vector backends |
| **Atomic Operations** | Temp DB → swap (atomic reindex) | Reindex exists but is dead code | AGFS handles atomicity |
| **Code Maturity** | High: 78+ files in `src/memory/`, comprehensive tests | Medium: ~15 files, some dead code paths | High: well-structured Python package, extensive prompt engineering |

---

## 5. Overall Analysis

### Design Philosophy Spectrum

The three projects represent distinct philosophies along a spectrum:

1. **OpenClaw** — **"Files First, Search Second"**: Markdown files are the canonical source of truth. The entire memory system is a search index built on top of human-readable, Git-friendly files. The agent writes to disk; the system indexes and retrieves. This makes memory auditable, portable, and debuggable. The sophistication is in the retrieval layer (hybrid search, temporal decay, MMR).

2. **ZeroClaw** — **"Zero Dependencies, Full Control"**: Everything is self-contained in Rust + SQLite. No external services required. The Memory trait abstraction allows swapping backends, but the primary value is the all-in-one SQLite implementation. The philosophy is minimalism and reliability. Memory is a database, not a filesystem.

3. **OpenViking** — **"Context is a Database"**: The most ambitious architecture. Goes beyond simple memory to unify all agent context (memories, resources, skills) into a hierarchical virtual filesystem with tiered loading (L0/L1/L2). LLM is used not just for querying but for memory extraction, deduplication, and merging. This is the most "intelligent" system but also the most LLM-dependent.

### Strengths

| Project | Key Strength |
|---------|-------------|
| **OpenClaw** | Most mature retrieval pipeline: hybrid BM25+vector with temporal decay, MMR diversity, and 4-provider embedding cascade. Pre-compaction flush is a unique innovation. All claims are fully verified in code. |
| **ZeroClaw** | True zero-dependency architecture in Rust. Cleanest trait-based abstraction. Memory snapshot/hydration enables cold-boot recovery. Response cache saves LLM costs. |
| **OpenViking** | Most sophisticated memory management: LLM-powered extraction/dedup/merge, 6-category taxonomy, hierarchical retrieval with score propagation, L0/L1/L2 tiered loading, intent analysis for multi-query plans. |

### Weaknesses

| Project | Key Weakness |
|---------|-------------|
| **OpenClaw** | Complexity — 78+ files in the memory subsystem. QMD, session memory, multiple embedding providers create a large surface area. Temporal decay and MMR are disabled by default. |
| **ZeroClaw** | Vector search is brute-force (scans ALL embeddings). Default embedding_provider is "none" (keyword-only out of box). Chunker and reindex are dead code. Less retrieval sophistication (no temporal decay, no MMR, no multi-query). |
| **OpenViking** | Heavy LLM dependency — extraction, dedup, merge, summary, intent analysis all require LLM calls, adding latency and cost. Rerank is not functional. UPDATE dedup decision is missing. No traditional keyword/BM25 search path. |

### Scalability Assessment

- **OpenClaw**: Best positioned for scale — sqlite-vec provides indexed vector search, atomic reindex prevents corruption, file watcher enables incremental updates. Designed for continuous operation.
- **ZeroClaw**: Will hit a wall at scale due to brute-force vector scan (O(n) per query). Fine for hundreds/low thousands of memories. Hygiene system keeps data bounded.
- **OpenViking**: Hierarchical retrieval is theoretically the most scalable approach (log-scale directory drilling vs. flat search), but the LLM-in-the-loop for every memory operation adds latency. Best for quality over speed.

### Recommendation

- **For production agents with large memory**: OpenClaw — most mature retrieval, best scalability story
- **For self-hosted/embedded with minimal deps**: ZeroClaw — Rust performance, zero external services, smallest footprint
- **For intelligent memory management (quality over speed)**: OpenViking — most sophisticated extraction/dedup/merge, best for agents that need to "learn" from interactions

---

*Report generated by parallel subagent analysis. Each project was independently researched (web + code) and then compared by the main agent.*
