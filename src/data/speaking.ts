// Source of truth for /speaking — the lecturer / 講師 page.
//
// Engagements and decks are hand-maintained. `days` links back to the write-ups
// in the days collection; /speaking resolves them at build time, so a wrong day
// number fails the build rather than shipping a dead link.

export interface Deck {
  /** Public deck URL — these are live open-slide deployments. */
  url: string;
  /** Deck title as it appears on the deck itself. */
  title: string;
  /** Which segment of the engagement this deck covers. */
  segment: string;
}

/**
 * How attendees joined. Maps 1:1 onto schema.org's eventAttendanceMode in
 * /speaking's Event markup, so keep it honest with `format`.
 */
export type Attendance = 'offline' | 'online' | 'mixed';

export interface Engagement {
  slug: string;
  /** Host organisation. */
  venue: string;
  /** Course / talk title. */
  title: string;
  /** When it ran, human-readable. */
  when: string;
  /**
   * Machine-readable start, ISO 8601. Emitted as the Event's `startDate`, which
   * schema.org and Google both require — an Event without it is rejected whole.
   *
   * Reduced precision is allowed (`2026-06`, `2026`) and is the right answer when
   * the exact day isn't recorded anywhere: a month we can source beats a day we
   * made up. Tighten it whenever the real date turns up.
   */
  start: string;
  /** Machine-readable end, ISO 8601. Only for multi-day / multi-session runs. */
  end?: string;
  /** Format + scale, e.g. `兩天工作坊 · 實體 24 人 + 線上 40+`. */
  format: string;
  /** Physical, online, or both — drives eventAttendanceMode. */
  attendance: Attendance;
  /** Who was in the room. */
  audience: string;
  /** What the session covered, in order. */
  outline: string[];
  /** The concrete thing attendees walked out with. */
  takeaway: string;
  decks: Deck[];
  /** Day write-ups covering this engagement, ascending. */
  days: number[];
  featured?: boolean;
}

export const ENGAGEMENTS: Engagement[] = [
  {
    slug: 'ccvs',
    venue: '高雄市立中正高工',
    title: '教師 AI 應用研習',
    when: '2026 年 8 月 4–5 日',
    start: '2026-08-04',
    end: '2026-08-05',
    format: '兩天工作坊 · 實體與線上同步',
    attendance: 'mixed',
    audience: '一般科目、專業科目、實習科目的老師——不預設任何一門專業知識',
    outline: [
      'AI 現在發展到哪裡，以及其他人實際怎麼用',
      '練習解決大家平常遇到的 AI 協作問題',
      '直接碰 skill 跟 vibe coding',
      '資安意識',
      '版本控制，還有怎麼把做出來的東西部署出去',
    ],
    takeaway: '不是「聽完覺得有收穫」，是電腦裡真的多出一份可以編輯的 Word 補救教材，而且自己做的東西真的掛得上網路、別人打得開。',
    decks: [
      { url: 'https://ccvs.dawsonwang.com', title: '讓 AI 加班，你準時下班', segment: 'Day 1 上午' },
      { url: 'https://ccvs2.dawsonwang.com', title: '換成一個會自己動手的工具', segment: 'Day 1 下午' },
      { url: 'https://ccvs3.dawsonwang.com', title: '體驗一日軟體工程師', segment: 'Day 2 上午' },
      { url: 'https://ccvs-wall.dawsonwang.com/', title: '成果牆', segment: '學員作品' },
    ],
    days: [219],
    featured: true,
  },
  {
    slug: 'chimei',
    venue: '奇美醫院',
    title: 'AI 簡報工作流',
    when: '2026 年',
    // Month precision: Day 170 is the prep write-up, published 2026-06-20. The
    // exact session day isn't written down anywhere.
    start: '2026-06',
    format: '院內內訓 · 概念講解加實作',
    attendance: 'offline',
    audience: '從醫師到行政，三十幾人同場',
    outline: [
      '同一份內容為什麼你做了三次——真正省時的不是「生」第一份，是「重製」',
      '用 AI 做簡報的三個層次',
      '拿這次備課本身當示範，看真實的來回而不是做好的成品',
    ],
    takeaway: '換對象的第二份、第三份簡報，幾乎一句話就改完。',
    decks: [
      { url: 'https://slide.dawsonwang.com/s/tainan-hospital', title: 'AI 簡報工作流', segment: '完整簡報' },
    ],
    days: [170],
    featured: true,
  },
  {
    slug: 'moh-hospital-series',
    venue: '醫療院所系列課程',
    title: '衛福部支持的 AI 應用課程',
    when: '2026 年 · 多場',
    // A run of sessions, not one date: Day 179 covers the June one, Day 187 the
    // two in July. Month precision for the same reason as 奇美.
    start: '2026-06',
    end: '2026-07',
    format: '2.5 小時起 · 概念加實作',
    attendance: 'offline',
    audience: '非工程師為主。同一間教室裡，有人連介面都還不熟，也有人已經在自己 vibe code',
    outline: [
      '四個大家對 AI 共同的不安：怕它講錯、回答空泛、成果有 AI 味、用久了失憶',
      'AI 1.0 / 2.0 / 3.0——每個人口中的「AI」其實不是同一種東西',
      '留時間讓大家拿自己手上的案例動手改',
    ],
    takeaway: '簡報由簡入深準備，搭配事前問卷和現場互動調查，動態調整整場的內容跟難度。',
    decks: [],
    days: [179, 187],
  },
];

// How the sessions are designed — this is the part that gets the feedback,
// so it earns its own section rather than being buried in an engagement card.
export interface Principle {
  title: string;
  body: string;
  day: number;
}

export const PRINCIPLES: Principle[] = [
  {
    title: '從受眾自己有感的例子開始',
    body: '中正高工那場的共同案例是國中七年級的一元一次方程式：八題隨堂測驗加 30 位匿名學生的作答資料，要把全班分成三個學習群組、產出 15 分鐘的補救教材。選案例卡兩個條件——受益的必須是老師本人，而且不能預設任何一門專業知識。',
    day: 219,
  },
  {
    title: '一步只處理一個痛點',
    body: '案例底下掛六個痛點，一個痛點對一個實作步驟：說不清楚需求、回答太長、不敢直接相信、不知道怎麼改、常失憶、AI 味太重。六步走下來是同一條備課工作流，不是六個彼此無關的工具展示。',
    day: 219,
  },
  {
    title: '實作 > 觀念',
    body: '大家對 AI 的依賴已經到了每天都會用的程度，直接破解平常遇到的狀況、讓大家當場實作，比單純分享來得重要。對一些人來說，動手做才有辦法真正吸收。',
    day: 187,
  },
  {
    title: '別預期他們會主動發問',
    body: '即使一直鼓勵發問也不要期待踴躍。要在實作的時候走到台下私下問——有些人根本不知道「原來這個可以問」，或不知道自己卡住的地方是一個需要發問的問題。',
    day: 187,
  },
  {
    title: '工具教了，煞車要在同一堂課教完',
    body: '教 vibe coding 特別重要。當一個人第一次發現可以把一段不知道誰寫的東西貼進來、然後它就動了——那個當下最需要有人在旁邊踩煞車。',
    day: 219,
  },
  {
    title: '這一場的問題，是下一場的教材',
    body: '根據每次的互動蒐集常見問題，加進下次的分享裡。簡報一場一場迭代，就越能跟不同的受眾產生共鳴。',
    day: 187,
  },
];

// Attendee feedback pulled from the post-session surveys.
//
// Keep quotes exact, attribution non-identifying (role + venue, never a name),
// and include only feedback cleared for public sharing.
export interface Testimonial {
  id: string;
  engagementSlug: Engagement['slug'];
  theme: string;
  /** The response, quoted. Trim to the sharp sentence — don't paraphrase. */
  quote: string;
  /** Non-identifying attribution, e.g. `專業科目教師 · 中正高工`. */
  attribution: string;
  shareApproved: true;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'ccvs-individual-help',
    engagementSlug: 'ccvs',
    theme: 'individual-help',
    quote: '講師單獨講解時 有確實解答我的問題',
    attribution: '專業群科教師 · 中正高工',
    shareApproved: true,
  },
  {
    id: 'ccvs-hands-on-result',
    engagementSlug: 'ccvs',
    theme: 'hands-on-result',
    quote: '感謝講師細心的指導 我聽得懂 也做得出來 超讚的',
    attribution: '專業群科教師 · 中正高工',
    shareApproved: true,
  },
  {
    id: 'ccvs-audience-fit',
    engagementSlug: 'ccvs',
    theme: 'audience-fit',
    quote: '教學準備充足，能從學生的角度思考其需求，讚！',
    attribution: '語文／社會科教師 · 中正高工',
    shareApproved: true,
  },
  {
    id: 'ccvs-systematic-clarity',
    engagementSlug: 'ccvs',
    theme: 'systematic-clarity',
    quote: '對ai的認識有更系統化的理解，除了教導大家做出成品，還具體説明是如何做出來，這部份講解的很清楚。',
    attribution: '數學／自然科教師 · 中正高工',
    shareApproved: true,
  },
  {
    id: 'ccvs-security-balance',
    engagementSlug: 'ccvs',
    theme: 'theory-security-balance',
    quote: '反重力智慧程式設計，好棒！深入淺出的授課，實作與理論及資安並重，很讚！',
    attribution: '語文／社會科教師 · 中正高工',
    shareApproved: true,
  },
];

export interface SpeakingProofSlide {
  id: string;
  engagementSlug: Engagement['slug'];
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  caption: string;
  testimonialId?: Testimonial['id'];
}

export const SPEAKING_PROOF_SLIDES: SpeakingProofSlide[] = [
  {
    id: 'ccvs-teaching',
    engagementSlug: 'ccvs',
    image: {
      src: '/speaking/ccvs-teaching.webp',
      alt: 'Dawson Wang 在中正高工電腦教室中穿梭於老師座位之間講解 AI 實作流程',
      width: 1600,
      height: 1200,
    },
    caption: '中正高工教師 AI 應用研習 · 實作中穿梭講解',
    testimonialId: 'ccvs-hands-on-result',
  },
  {
    id: 'ccvs-front',
    engagementSlug: 'ccvs',
    image: {
      src: '/speaking/ccvs-2026-front.webp',
      alt: 'Dawson Wang 站在中正高工電腦教室白板前，用麥克風說明課程開場',
      width: 1600,
      height: 1200,
    },
    caption: '從共同案例開始，先把 AI 協作的問題講清楚',
    testimonialId: 'ccvs-audience-fit',
  },
  {
    id: 'ccvs-room',
    engagementSlug: 'ccvs',
    image: {
      src: '/speaking/ccvs-2026-room.webp',
      alt: '中正高工電腦教室內，多位老師坐在桌機前跟著課程完成 AI 實作',
      width: 1600,
      height: 1200,
    },
    caption: '不是工具展示，而是把同一條備課工作流走完',
    testimonialId: 'ccvs-systematic-clarity',
  },
  {
    id: 'ccvs-helping',
    engagementSlug: 'ccvs',
    image: {
      src: '/speaking/ccvs-2026-helping.webp',
      alt: 'Dawson Wang 走到老師座位旁，陪同檢查螢幕上的 AI 實作成果',
      width: 1600,
      height: 1200,
    },
    caption: '實作時間走到台下，處理每個人真正卡住的地方',
    testimonialId: 'ccvs-individual-help',
  },
  {
    id: 'ccvs-group',
    engagementSlug: 'ccvs',
    image: {
      src: '/speaking/ccvs-group.webp',
      alt: '兩天工作坊結束後，Dawson Wang 與中正高工老師們在電腦教室合照',
      width: 1600,
      height: 1200,
    },
    caption: '兩天工作坊結束後，和中正高工老師們合照',
    testimonialId: 'ccvs-security-balance',
  },
];
