export type ChipVariant = 'teal' | 'brick' | 'ochre' | 'sage' | 'outline';

export interface Topic {
  slug: string;
  title: string;       // zh-TW display title
  blurb: string;       // 1-line description for /topics page
  chipVariant: ChipVariant; // color slot in Apartamento palette
}

export const TOPICS: Topic[] = [
  { slug: 'claude-code',        title: 'Claude Code',     blurb: 'Skills、hooks、MCP、harness 設計與實戰',     chipVariant: 'teal' },
  { slug: 'agents',             title: 'AI Agents',       blurb: '多代理協作、orchestration、agent SDK',       chipVariant: 'ochre' },
  { slug: 'browser-automation', title: '瀏覽器自動化',     blurb: 'CDP、Puppeteer、social media 自動化',       chipVariant: 'outline' },
  { slug: 'social-platforms',   title: '社群平台',         blurb: 'Threads、Facebook、LinkedIn 演算法與發文策略', chipVariant: 'brick' },
  { slug: 'content-workflow',   title: '內容工作流',       blurb: '從 source.md 到上線的端到端流程',           chipVariant: 'sage' },
  { slug: 'dev-tooling',        title: '開發工具',         blurb: 'CLI、IDE、生產力工具',                      chipVariant: 'outline' },
  { slug: 'security',           title: '資安',            blurb: 'AI 工具攻擊向量與防禦',                     chipVariant: 'outline' },
  { slug: 'personal-workflow',  title: '個人工作流',       blurb: 'AI 個人助理、自動化、生產力',               chipVariant: 'outline' },
];

// Day-to-topics mapping. A day can belong to multiple topics. Days not listed
// here appear in /days but not in any topic cluster — review and tag before launch.
export const DAY_TOPICS: Record<number, string[]> = {
  121: ['claude-code'],
  120: ['claude-code', 'agents'],
};
