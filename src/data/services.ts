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
    blurb: '從 PoC 到上線、再到團隊接手。',
    examples: [
      'Claude Code 進駐你的團隊（skills、MCP、agent 工作流）',
      '把 PDF / SOP / 檔案變成可查詢的決策資產',
      '把散在 LINE / Email / Spreadsheet 的流程接起來',
    ],
    ctaLabel: '聊聊合作',
    ctaHref: '#inquire',
  },
  {
    id: 'training',
    primary: false,
    title: '工作流培訓',
    blurb: '幫團隊建立持續使用 AI 的習慣與紀律。',
    examples: ['團隊工作坊（半天 / 一天）', '1:1 教練（從個人工具出發）', '長期顧問陪跑（每週同步）'],
    ctaLabel: '了解培訓',
    ctaHref: '#inquire',
  },
  {
    id: 'advisory',
    primary: false,
    title: '演講 / 顧問諮詢',
    blurb: '受邀演講、企業內訓、單次諮詢時段。',
    examples: ['企業內訓（AI 工作流現況 / 落地路線圖）', '線上活動 / podcast 受訪', '1 hr pick-my-brain 諮詢時段'],
    ctaLabel: '邀請演講',
    ctaHref: '#inquire',
  },
];
