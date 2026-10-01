// `ctaHref` defaults to "#inquire", which is the InquiryForm anchor on the
// homepage. ServiceExplainer is currently rendered only on `/`. If it's ever
// reused on a non-root page, change ctaHref to "/#inquire" so the anchor
// still points to the homepage form.

export interface Service {
  id: 'implementation' | 'training' | 'advisory';
  primary: boolean;
  title: string;
  blurb: string;
  examples: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const SERVICES: Service[] = [
  {
    id: 'implementation',
    primary: true,
    title: 'AI 工具落地',
    blurb: '從試做、上線，到交接給你的團隊。',
    examples: [
      '把散在 LINE、Email、Excel 的流程串起來',
      '把 PDF、SOP、手冊變成查得到答案的資料',
      '幫團隊設定好專屬的 AI 工具和自動化流程',
    ],
    ctaLabel: '聊聊合作',
    ctaHref: '#inquire',
  },
  {
    id: 'training',
    primary: false,
    title: '團隊培訓',
    blurb: '幫團隊養成持續使用 AI 的習慣。',
    examples: ['團隊工作坊（半天／一天）', '1 對 1 教練（從個人工具出發）', '長期顧問陪跑（每週同步）'],
    ctaLabel: '了解培訓',
    ctaHref: '#inquire',
  },
  {
    id: 'advisory',
    primary: false,
    title: '演講／顧問諮詢',
    blurb: '受邀演講、企業內訓、單次諮詢。',
    examples: ['企業內訓（AI 工作流現況／導入路線圖）', '線上活動／Podcast 受訪', '1 小時單次諮詢'],
    ctaLabel: '邀請演講',
    ctaHref: '#inquire',
  },
];
