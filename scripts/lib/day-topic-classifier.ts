// day-topic-classifier.ts — offline, deterministic topic classification for a
// 100Days source.md.
//
// Why keyword scoring and not an LLM: deploy-local.ts deliberately builds
// OFFLINE by default so a third-party outage can never block a publish. A
// classifier that needs the network would either break that guarantee or need a
// fallback path that is itself a keyword table — so this is the fallback, used
// directly. It is also free, reproducible, and diffable: the same source.md
// always yields the same slugs, which matters because the output is committed.
//
// Scoring model (see scoreTopics):
//   - Each topic owns STRONG patterns (near-conclusive: a product name, a term
//     of art) and WEAK patterns (supporting: generic vocabulary that only means
//     something in aggregate).
//   - Repeat matches have diminishing returns — 1 + ln(n) — so a word repeated
//     20 times cannot outvote genuine topical breadth.
//   - Matches in the title/subtitle count TITLE_MULTIPLIER times more than body
//     matches, because the day's title is the author's own summary.
//
// Accuracy against the 226 hand-tagged days in src/data/topics.ts, as of day228:
//
//   at least one overlap   91.6%   the day lands in a topic you'd have picked
//   exact primary topic    62.8%   slugs[0] matches your slugs[0]
//   slug precision         55.0%   predicted slugs that were in your tags
//   slug recall            68.1%   your tags that were recovered
//
// So: treat it as a good first pass, not a final word. It is wired into deploy
// so /topics is never missing a day; correcting a slug afterwards is a one-line
// edit to src/data/topics.ts and is never overwritten (only untagged days are
// classified, unless you pass --retag).
//
// After editing any pattern list, re-run `yarn categorize --eval` to re-measure
// and `yarn categorize --tune` to refit the damp column.

export interface TopicRule {
  slug: string;
  strong: RegExp[];
  weak: RegExp[];
  /**
   * Per-topic score multiplier correcting for how ambient that topic's
   * vocabulary is in THIS corpus (a daily AI build log). Keyword weights alone
   * can't express "the word agent is everywhere, so seeing it means less here" —
   * this can. Fitted, not guessed: `yarn categorize --tune` runs coordinate
   * ascent against the hand-tagged days and prints the table below; `--eval`
   * re-measures. Refit after editing any pattern list.
   */
  damp: number;
}

export interface TopicScore {
  slug: string;
  score: number;
}

export interface ClassifyResult {
  slugs: string[];
  scores: TopicScore[];
  /** True when nothing scored above FLOOR and the result is a bare fallback. */
  lowConfidence: boolean;
}

export const STRONG_WEIGHT = 3;
export const WEAK_WEIGHT = 1;
export const TITLE_MULTIPLIER = 2.5;

/** A topic joins the result only if it reaches this absolute score… */
export const FLOOR = 3;
/** …and holds at least this fraction of the top topic's score. */
export const RELATIVE_FLOOR = 0.34;
export const MAX_SLUGS = 3;

/** Used when a day matches nothing at all — rare, and always reported. */
export const FALLBACK_SLUG = 'ai-trends';

// Patterns are matched case-insensitively against the raw text. Chinese terms
// need no word boundaries; Latin terms use them so `RAG` does not match
// `dragging` and `IDE` does not match `video`.
export const TOPIC_RULES: TopicRule[] = [
  {
    slug: 'beginner',
    strong: [/零技術/, /沒有技術背景/, /不會寫程式/, /新手/, /小白/, /手把手/, /第一次用/, /完全不懂/, /從零開始/],
    weak: [/入門/, /初學/, /第一步/, /基礎/, /簡單來說/, /白話/, /看不懂/, /沒學過/, /門檻/, /先講結論/],
    damp: 2.2,
  },
  {
    slug: 'claude-code',
    // Deliberately narrow. Claude Code is this author's daily driver, so it gets
    // name-dropped in posts about everything — day116 ("Claude Code → Codex 踩坑")
    // is hand-tagged dev-tooling/dev-method, not claude-code. The tag is reserved
    // for posts teaching the tool's own machinery, so only its internals score.
    strong: [/\bCLAUDE\.md\b/, /\bMCP\b/i, /\bsubagent/i, /\bslash\s*command/i, /\bharness\b/i, /\bhooks?\b/i, /\bskills?\b/i, /\bplugin/i],
    weak: [/claude\s*code/i, /\/(commands?|agents?)\b/, /設定檔/, /\bpermission/i, /權限模式/, /上下文視窗/, /\bcontext\s*window/i],
    damp: 1,
  },
  {
    slug: 'agents',
    strong: [/多代理/, /\bmulti-?agent/i, /\borchestrat/i, /代理人/, /\bswarm\b/i, /子代理/, /agent\s*框架/i, /代理協作/, /\bagents?\b/i, /agent\s*sdk/i],
    weak: [/協作/, /分工/, /自動化流程/, /\bworkflow/i, /並行/, /派工/, /\bautonomous/i, /自己跑/, /丟給\s*AI/],
    damp: 1,
  },
  {
    slug: 'dev-method',
    strong: [/\bSDD\b/, /\bBDD\b/, /\bTDD\b/, /\bGherkin\b/i, /測試驅動/, /規格驅動/, /方法論/, /\bloop\s*engineering/i, /\bscenario/i],
    weak: [/規格/, /需求/, /重構/, /設計模式/, /流程設計/, /驗收/, /單元測試/, /\bspec\b/i, /迭代/],
    damp: 0.9,
  },
  {
    slug: 'dev-tooling',
    // Also narrow: 工具/安裝/設定 are ambient filler in a daily build log, so only
    // named tools and concrete dev surfaces count.
    strong: [/\bVS\s?Code\b/i, /\bIDE\b/, /\bDocker\b/i, /\bgit(hub|lab)?\b/i, /部署/, /\bdeploy/i, /\bterminal\b/i, /終端機/, /\bnpm\b|\byarn\b|\bpnpm\b/i, /\bCodex\b/i, /\bCursor\b/i, /\bVercel\b/i],
    weak: [/套件/, /指令列/, /環境設定/, /\bnode\b/i, /腳本/, /\bscript/i, /\bPR\b/, /\bmerge\b/i, /\breview\b/i, /版本控制/, /\bCI\b/],
    damp: 1.1,
  },
  {
    slug: 'token-cost',
    strong: [/\btokens?\b/i, /額度/, /用量/, /\bquota\b/i, /訂閱/, /省錢/, /成本/, /計費/, /\brate\s*limit/i],
    weak: [/價格/, /費用/, /方案/, /便宜/, /貴/, /預算/, /\bpricing\b/i, /\busage\b/i, /美元/, /月費/],
    damp: 0.7,
  },
  {
    slug: 'security',
    strong: [/資安/, /prompt\s*injection/i, /注入攻擊/, /外洩/, /\bsandbox/i, /沙箱/, /權限控管/, /個資/, /憑證/, /\bcredential/i],
    weak: [/安全/, /權限/, /風險/, /攻擊/, /\bapi\s*key\b/i, /金鑰/, /密碼/, /隱私/, /防護/, /漏洞/],
    damp: 1.1,
  },
  {
    slug: 'knowledge',
    strong: [/\bObsidian\b/i, /\bRAG\b/, /第二大腦/, /知識庫/, /知識管理/, /\bembedding/i, /向量/, /語意搜尋/],
    weak: [/筆記/, /\bNotion\b/i, /整理資訊/, /檢索/, /\bvector\b/i, /歸檔/, /標籤/, /知識/, /隱性知識/, /提煉/],
    damp: 1,
  },
  {
    slug: 'content-workflow',
    strong: [/source\.md/i, /多平台/, /發文流程/, /內容工作流/, /一份.{0,4}發/, /排程發/, /草稿/],
    weak: [/發文/, /貼文/, /內容/, /寫作/, /產出/, /上線流程/, /改稿/, /文章/, /素材/, /轉檔/],
    damp: 1.4,
  },
  {
    slug: 'browser-automation',
    strong: [/\bPuppeteer\b/i, /\bPlaywright\b/i, /\bCDP\b/, /\bRPA\b/i, /瀏覽器自動化/, /電腦操作/, /\bcomputer\s*use\b/i, /\bselenium\b/i],
    weak: [/瀏覽器/, /\bbrowser\b/i, /\bchrome\b/i, /自動點/, /爬蟲/, /\bscrap/i, /分頁/, /網頁自動/],
    damp: 1.25,
  },
  {
    slug: 'local-llm',
    strong: [/\bOllama\b/i, /\bMLX\b/i, /量化/, /本地模型/, /地端/, /自架/, /\bGGUF\b/i, /\bllama\.cpp\b/i, /\bLM\s*Studio\b/i],
    weak: [/\bllama\b/i, /推論/, /顯卡/, /\bVRAM\b/i, /\bGPU\b/i, /離線跑/, /開源模型/, /\bqwen\b|\bmistral\b|\bgemma\b/i],
    damp: 1,
  },
  {
    slug: 'social-platforms',
    strong: [/\bThreads\b/i, /\bLinkedIn\b/i, /粉專/, /演算法/, /觸及/, /社群經營/, /\bInstagram\b|\bIG\b/],
    weak: [/\bFacebook\b|\bFB\b/i, /互動率/, /追蹤者/, /粉絲/, /留言/, /按讚/, /流量/, /曝光/, /社群/],
    damp: 0.5,
  },
  {
    slug: 'personal-workflow',
    strong: [/多裝置/, /遠端遙控/, /生活自動化/, /跨裝置/, /\bTailscale\b/i, /\bshortcuts?\b/i, /捷徑/, /手機遙控/, /用手機/, /在外面/],
    weak: [/遠端/, /同步/, /\biPhone\b|\biPad\b/i, /\bMac(Book)?\b/i, /日常/, /習慣/, /個人流程/, /提醒/, /行事曆/, /通勤/, /手機/, /出門/, /隨身/, /一整天/],
    damp: 1,
  },
  {
    slug: 'cases',
    strong: [/企業內訓/, /內訓/, /演講/, /講座/, /工作坊/, /小聚/, /商案/, /顧問/, /學員/, /分享會/, /研討會/, /諮詢/],
    weak: [/案例/, /客戶/, /上課/, /現場/, /報價/, /接案/, /合作/, /提案/, /聽眾/, /一場/, /來上/, /業主/],
    damp: 0.9,
  },
  {
    slug: 'ai-trends',
    strong: [/裁員/, /職涯/, /學習路徑/, /取代/, /失業/, /產業變化/, /轉職/, /還需要學/, /飯碗/],
    weak: [/趨勢/, /產業/, /未來/, /市場/, /薪水/, /心態/, /人力/, /世代/, /衝擊/, /機會/],
    damp: 1.6,
  },
];

function countMatches(text: string, re: RegExp): number {
  // Force a global, case-insensitive copy so callers can write plain patterns.
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const global = new RegExp(re.source, flags.includes('i') ? flags : flags + 'i');
  return (text.match(global) ?? []).length;
}

/** Repeat matches saturate: 1 hit = 1.0, 2 = 1.69, 5 = 2.61, 20 = 4.0. */
function diminishing(count: number): number {
  return count <= 0 ? 0 : 1 + Math.log(count);
}

function scoreOne(rule: TopicRule, title: string, body: string): number {
  let score = 0;
  for (const [patterns, weight] of [[rule.strong, STRONG_WEIGHT], [rule.weak, WEAK_WEIGHT]] as const) {
    for (const re of patterns) {
      const titleHits = countMatches(title, re);
      const bodyHits = countMatches(body, re);
      if (titleHits > 0) score += weight * TITLE_MULTIPLIER * diminishing(titleHits);
      if (bodyHits > 0) score += weight * diminishing(bodyHits);
    }
  }
  return score * rule.damp;
}

export function scoreTopics(title: string, body: string, rules: TopicRule[] = TOPIC_RULES): TopicScore[] {
  return rules
    .map(rule => ({ slug: rule.slug, score: Number(scoreOne(rule, title, body).toFixed(2)) }))
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

/**
 * Classify one day into 1–MAX_SLUGS topic slugs, highest-confidence first.
 * Always returns at least one slug: src/data/topics.ts must cover every day
 * (tests/topics.test.ts enforces it), so an empty result is never valid.
 */
export function classifyDay(title: string, body: string, rules: TopicRule[] = TOPIC_RULES): ClassifyResult {
  const scores = scoreTopics(title, body, rules);
  const top = scores[0];

  if (!top || top.score < FLOOR) {
    return { slugs: [top?.slug ?? FALLBACK_SLUG], scores, lowConfidence: true };
  }

  const slugs = scores
    .filter(s => s.score >= FLOOR && s.score >= top.score * RELATIVE_FLOOR)
    .slice(0, MAX_SLUGS)
    .map(s => s.slug);

  return { slugs, scores, lowConfidence: false };
}
