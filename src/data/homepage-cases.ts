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
  /** Sprite icon id for the tag (see HomeIcons.astro). */
  icon: string;
  /** Crafted one-line headline for the card. */
  headline: string;
  /** One-line "who" — the customer archetype, not their name. */
  who: string;
  /** One-line "pain" — the situation they were stuck in (本來). */
  pain: string;
  /** One-line "outcome" — what we shipped / unblocked (後來). */
  outcome: string;
}

export const RECENT_CONSULTATIONS: ConsultingCase[] = [
  {
    dayNumber: 96,
    vertical: '醫療',
    icon: 'i-pulse',
    headline: '把厚厚的 SOP，變成看診時查得到的決策樹',
    who: '診所主治醫師',
    pain: '每位病人只有 2–3 分鐘，療程選項卻很複雜；國際 SOP 每 3 個月更新一次，看完一版又出兩版。',
    outcome: '把 PDF 版的 SOP 拆成可以直接查詢的決策樹，看診時能當場帶病人看懂有哪些選項。',
  },
  {
    dayNumber: 99,
    vertical: '行銷 / KOL 經紀',
    icon: 'i-mega',
    headline: '一個案子橫跨 5 個工具，重新設計整條流程',
    who: '科技大廠的 KOL 合作社群經理',
    pain: '預算在試算表、跟代理商用 LINE 溝通，再加上 Email、檔案來回傳、社群平台發文——一個案子橫跨 5 個以上的工具。',
    outcome: '找出「會用 AI」跟「用得好」之間的落差，重新設計整條工作流程。',
  },
  {
    dayNumber: 98,
    vertical: '用 LINE 管工作的老闆',
    icon: 'i-phone',
    headline: '讓 AI 直接讀 LINE 對話，不用再自己慢慢翻',
    who: '把工作群開在 LINE 的老闆、PM',
    pain: '對話散在各個群組和私訊，每次要回顧某一段，都得自己慢慢往上翻。',
    outcome: '讓 AI 直接讀取電腦裡的 LINE 對話幫你整理——不用申請 API，也不用開發者帳號。',
  },
];

// "Personal tools I use every day" — these are demos of capability, not
// consulting deliverables. Each card has an external CTA (the live tool /
// page) on top of the standard "see the full write-up" link.

export interface PersonalTool {
  dayNumber: number;
  /** Short uppercase tag rendered as the card's kicker (e.g. 知識管理). */
  category: string;
  /** Sprite icon id for the doodle (see HomeIcons.astro). */
  icon: string;
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
    icon: 'i-book',
    headline: '把 103 個 Arc 分頁變成 Obsidian 結構化筆記',
    numberHook: '103 → 1',
    pain: '永遠看不完的「等等再看」分頁——資訊湧入的速度永遠比消化還快。',
    outcome: 'Claude Code 一次轉成可搜尋知識庫，未來想用時找得回來。',
  },
  {
    dayNumber: 134,
    category: '學習工具',
    icon: 'i-quiz',
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
    icon: 'i-chat-q',
    headline: '幫網站加上語意搜尋——零月費、不用資料庫',
    numberHook: '3 步 / $0 / 0 DB',
    pain: '朋友問：「你之前那篇講 Raycast 本地模型的，是哪一天？」我也答不出來。',
    outcome: '3 步上線關鍵字 + 語意雙模式搜尋，整本站變成可問答的知識庫。',
    demoHref: '/search',
    demoLabel: '試用本站搜尋 →',
  },
];
