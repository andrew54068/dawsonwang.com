// Copy for the homepage-only sections that have no existing data source:
// 痛點 (pain points), 合作流程 (process), 常見問題 (FAQ), and the 授課單位
// (venue) strip. These are hand-maintained marketing copy written for the
// 35–55 中小企業主 audience — plain language, no MCP/repo/agent jargon.
//
// `icon` values are symbol ids defined once in src/components/home/HomeIcons.astro
// and referenced via <use href="#..."> inside the warm homepage components.

export interface PainPoint {
  /** Sprite symbol id, e.g. 'i-chat'. */
  icon: string;
  /** The situation the owner recognises, one sentence. */
  text: string;
}

export const PAIN_POINTS: PainPoint[] = [
  { icon: 'i-chat', text: '客戶需求、改來改去的細節，全散在 LINE 群組裡，要回頭找得翻半天。' },
  { icon: 'i-files', text: '同一個案子分散在 Excel、LINE、Email、雲端檔案，資料一直複製貼上。' },
  { icon: 'i-book', text: 'SOP、規範一改版就是一大疊，員工看不完，要用的時候又找不到。' },
  { icon: 'i-spark', text: '公司買了 AI 帳號，大家卻只拿來翻譯、改錯字。' },
];

export interface ProcessStep {
  /** Short step title. */
  title: string;
  /** One-line explanation. */
  body: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { title: '填表', body: '告訴我你想用 AI 解決什麼。' },
  { title: '1–2 個工作日內回覆', body: '合適會附上預約連結，不合適也會直接說。' },
  { title: '30 分鐘聊聊', body: '了解你的團隊，和最花時間的那件事。' },
  { title: '第二輪對話後報價', body: '先把範圍談清楚，再談價格。' },
];

export interface Promise {
  icon: string;
  text: string;
}

export const PROMISES: Promise[] = [
  { icon: 'i-heart', text: '沒有電子報，不會自動把你加進群組' },
  { icon: 'i-lock', text: '所有對話內容保密' },
  { icon: 'i-chat-q', text: '報價在第二輪對話後才給' },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: '我們公司沒有工程師，也能導入嗎？',
    a: '可以。醫院課程的學員多數不是工程背景；中正高工的課也不預設任何一門專業知識。重點是從你們每天在做的事開始。',
  },
  {
    q: '要換掉現在用的系統嗎？',
    a: '不用砍掉重練。我做的是把 AI 接進你原本就在做的那條流程。',
  },
  {
    q: '費用怎麼算？',
    a: '看範圍而定。第一次先了解狀況，第二輪對話後才報價；表單上的預算量級只是幫我抓方向。',
  },
  {
    q: '公司資料交給 AI 安全嗎？',
    a: '所有諮詢對話都會保密。課程裡也會教資安意識——工具教了，煞車要在同一堂課教完。',
  },
];

// Venues Dawson has been invited to teach at. These are TEACHING VENUES, not
// clients or partners — label them accordingly in the UI. Sourced from
// speaking.ts ENGAGEMENTS/LECTURE_SESSIONS (all already public).
export const VENUES: readonly string[] = [
  '奇美醫院總院',
  '柳營奇美醫院',
  '佳里奇美醫院',
  '部立臺南醫院',
  '臺南新樓醫院',
  '高雄市立中正高工',
];
