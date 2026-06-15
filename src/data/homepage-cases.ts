// Hand-picked consulting case studies for the homepage RecentConsultations
// section. Each entry pulls its subtitle live from the day's source.md via
// `getCollection('days')` at build time, so the only thing maintained here is
// the customer framing — the underlying post can be reworded without touching
// this file.
//
// Ordering = display order. Aim for 3 cards covering 3 distinct verticals so
// a visitor scanning the strip self-identifies in at least one of them.

export interface ConsultingCase {
  /** Day number that holds the full write-up. */
  dayNumber: number;
  /** Short uppercase tag rendered as the card's kicker (e.g. 醫療). */
  vertical: string;
  /** One-line "who" — the customer archetype, not their name. */
  who: string;
  /** One-line "pain" — the situation they were stuck in. */
  pain: string;
  /** One-line "outcome" — what we shipped / unblocked. */
  outcome: string;
}

export const RECENT_CONSULTATIONS: ConsultingCase[] = [
  {
    dayNumber: 96,
    vertical: '醫療',
    who: '診所主治醫師',
    pain: '每位病人 2–3 分鐘，但療程的決策樹很複雜；國際 SOP 每 3 個月更新一次，看完一版就出兩版。',
    outcome: '把 PDF SOP 拆成可查詢的決策樹（PyMuPDF + Claude），診間可即時帶病人理解選項。',
  },
  {
    dayNumber: 99,
    vertical: 'KOL 經紀',
    who: '科技大廠 KOL 合作社群經理',
    pain: '一個案子分散在 Spreadsheet 預算、LINE 跟 agency、Email、檔案來回、社群平台發文 5+ 個工具。',
    outcome: '找出「會用 AI」跟「用得好」之間的鴻溝，重新設計工作流。',
  },
  {
    dayNumber: 98,
    vertical: 'LINE 重度使用者',
    who: '把工作群開在 LINE 的 PM / 老闆',
    pain: '對話散落 LINE 各群組和私聊，每次回顧某段都得自己慢慢翻。',
    outcome: '用 LINE Desktop MCP 讓 AI 直接讀本機 LINE 對話——不用 API、不用申請開發者帳號。',
  },
];

// "Personal tools I use every day" — these are demos of capability, not
// consulting deliverables. Each card has an external CTA (the live tool /
// page) on top of the standard "see the full write-up" link.

export interface PersonalTool {
  dayNumber: number;
  /** Short uppercase tag rendered as the card's kicker (e.g. 知識管理). */
  category: string;
  /** Big, headline-sized one-liner — the "what". */
  headline: string;
  /** Punchy stat line, mono font (e.g. `103 → 1`). */
  numberHook: string;
  /** One-line "pain" — why the tool exists. */
  pain: string;
  /** One-line "outcome" — what visitors get if they try it. */
  outcome: string;
  /** Live demo / external URL. Leave undefined to omit the demo button. */
  demoHref?: string;
  /** Label on the demo button. */
  demoLabel?: string;
}

export const PERSONAL_TOOLS: PersonalTool[] = [
  {
    dayNumber: 71,
    category: '知識管理',
    headline: '把 103 個 Arc 分頁變成 Obsidian 結構化筆記',
    numberHook: '103 → 1',
    pain: '永遠看不完的「等等再看」分頁——資訊湧入的速度永遠比消化還快。',
    outcome: 'Claude Code 一次轉成可搜尋知識庫，未來想用時找得回來。',
  },
  {
    dayNumber: 134,
    category: '學習工具',
    headline: '把 iPAS 195 題變成可以練習的網頁',
    numberHook: '195 題 / 3 科 / 2 週',
    pain: '準備 iPAS AI 應用規劃師中級沒有像樣的線上題庫。',
    outcome: '2 週上線一個證照題庫站，每題附解析，自己 ship 自己用。',
    demoHref: 'https://ipas-quiz-eight.vercel.app/',
    demoLabel: '試用題庫 →',
  },
  {
    dayNumber: 139,
    category: '網站功能',
    headline: '幫網站加上語意搜尋——零月費、不用資料庫',
    numberHook: '3 步 / $0 / 0 DB',
    pain: '朋友問：「你之前那篇講 Raycast 本地模型的，是哪一天？」我也答不出來。',
    outcome: '3 步上線關鍵字 + 語意雙模式搜尋，整本站變成可問答的知識庫。',
    demoHref: '/search',
    demoLabel: '試用本站搜尋 →',
  },
];
