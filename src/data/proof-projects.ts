export interface ProofProject {
  name: string;
  description: string;
  dayRefs: string;          // human-readable day reference label (e.g. "Day 12–21")
  url?: string;             // optional absolute or root-relative URL for the project
}

// Source of truth for /proof "SHIPPED · N PROJECTS" section.
// Both the visible UI and the CollectionPage `mainEntity: ItemList` JSON-LD
// iterate over this array so they cannot drift.
export const PROOF_PROJECTS: ProofProject[] = [
  {
    name: 'Threads 海巡 Bot',
    description: 'SDD/BDD/TDD + Puppeteer + 本地 LLM Osaurus + Telegram 通知',
    dayRefs: 'Day 12–21',
  },
  {
    name: 'Permission Guardian Skill',
    description: 'Claude Code 權限白名單擴充，已開源',
    dayRefs: 'Day 7、19',
  },
  {
    name: '/security-scan',
    description: '6-agent 並行掃描指令，三方專案安全審查',
    dayRefs: 'Day 32、85、92',
  },
  {
    name: 'Antigravity-Manager Fork',
    description: '加入 Strategy Pool 並發佈 Homebrew Tap',
    dayRefs: 'Day 57、74',
  },
  {
    name: 'iPhone↔Mac 自動化系統',
    description: 'App 廣告自動點擊系統',
    dayRefs: 'Day 28',
  },
];
