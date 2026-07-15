export interface LinkHubLink {
  id: string;
  label: string;
  href: string;
  description: string;
  external: boolean;
}

export interface LinkHubGroup {
  id: 'social' | 'explore' | 'collaborate' | 'contact';
  label: string;
  links: readonly LinkHubLink[];
}

export const LINK_GROUPS: readonly LinkHubGroup[] = [
  {
    id: 'social',
    label: '社群',
    links: [
      {
        id: 'threads',
        label: 'Threads',
        href: 'https://www.threads.com/@andrew54068',
        description: '每天拆解 AI 工具與實際工作流',
        external: true,
      },
      {
        id: 'facebook',
        label: 'Facebook',
        href: 'https://www.facebook.com/andrew.wang.716',
        description: '比較完整的近況與公開分享',
        external: true,
      },
      {
        id: 'instagram',
        label: 'Instagram',
        href: 'https://www.instagram.com/andrew54068',
        description: '工作之外，也記錄正在發生的事',
        external: true,
      },
    ],
  },
  {
    id: 'explore',
    label: '探索',
    links: [
      {
        id: 'proof',
        label: '作品集',
        href: '/proof',
        description: '看已經做出來的工具、流程與案例',
        external: false,
      },
      {
        id: 'days',
        label: '文章',
        href: '/days',
        description: '連續公開記錄 AI 落地的每一天',
        external: false,
      },
    ],
  },
  {
    id: 'collaborate',
    label: '合作',
    links: [
      {
        id: 'consultation',
        label: '諮詢預約',
        href: 'https://calendar.app.google/FBHsAyW6zJ529aAb6',
        description: '先聊 30 分鐘，釐清你現在卡在哪裡',
        external: true,
      },
      {
        id: 'partnership',
        label: '合作洽談',
        href: 'https://calendar.app.google/xLSLkAUNnc2MVSsd9',
        description: '談演講、培訓、顧問或 AI 工具落地',
        external: true,
      },
    ],
  },
  {
    id: 'contact',
    label: '聯絡',
    links: [
      {
        id: 'email',
        label: 'Email',
        href: 'mailto:dawsonwang54068@gmail.com',
        description: '直接寫信給我，聊聊你的需求',
        external: true,
      },
      {
        id: 'line',
        label: 'LINE',
        href: 'https://line.me/ti/p/~andrew54068',
        description: '加 LINE 好友，用訊息直接找我',
        external: true,
      },
    ],
  },
] as const;
