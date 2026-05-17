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
      'Claude Code 進駐你的團隊',
      '客製 skills、MCP server、agent 工作流',
      '把資料、流程、人接起來的端到端整合',
    ],
    ctaLabel: '聊聊合作',
    ctaHref: '#inquire',
  },
  {
    id: 'training',
    primary: false,
    title: '工作流培訓',
    blurb: '幫團隊建立持續使用 AI 的習慣與紀律。',
    examples: ['團隊工作坊', '1:1 教練', '長期顧問陪跑'],
    ctaLabel: '了解培訓',
    ctaHref: '#inquire',
  },
  {
    id: 'advisory',
    primary: false,
    title: '演講 / 顧問',
    blurb: '受邀演講、企業內訓、顧問會議。',
    examples: ['企業內訓', '線上活動', 'pick-my-brain 諮詢時段'],
    ctaLabel: '邀請演講',
    ctaHref: '#inquire',
  },
];
