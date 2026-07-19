export interface LinkHubLink {
  id: string;
  label: string;
  href: string;
  description: string;
  external: boolean;
  /** Icon key resolved by `Icon.astro`. */
  icon: string;
  /** Accent colour for the icon tile — brand colour or a site accent var. */
  accent: string;
}

export interface LinkHubGroup {
  id: 'social' | 'explore' | 'collaborate' | 'contact';
  label: string;
  links: readonly LinkHubLink[];
}

export const LINK_GROUPS: readonly LinkHubGroup[] = [
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
        icon: 'mail',
        accent: 'var(--color-teal)',
      },
      {
        id: 'line',
        label: 'LINE',
        href: 'https://line.me/ti/p/~andrew54068',
        description: '加 LINE 好友，用訊息直接找我',
        external: true,
        icon: 'line',
        accent: '#06C755',
      },
    ],
  },
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
        icon: 'threads',
        accent: 'var(--color-ink)',
      },
      {
        id: 'facebook',
        label: 'Facebook',
        href: 'https://www.facebook.com/andrew.wang.716',
        description: '比較完整的近況與公開分享',
        external: true,
        icon: 'facebook',
        accent: '#4599FF',
      },
      {
        id: 'instagram',
        label: 'Instagram',
        href: 'https://www.instagram.com/andrew54068',
        description: '工作之外，也記錄正在發生的事',
        external: true,
        icon: 'instagram',
        accent: '#E1306C',
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
        icon: 'briefcase',
        accent: 'var(--color-brick)',
      },
      {
        id: 'days',
        label: '文章',
        href: '/days',
        description: '連續公開記錄 AI 落地的每一天',
        external: false,
        icon: 'newspaper',
        accent: 'var(--color-teal)',
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
        icon: 'calendar',
        accent: 'var(--color-ochre)',
      },
      {
        id: 'partnership',
        label: '合作洽談',
        href: 'https://calendar.app.google/xLSLkAUNnc2MVSsd9',
        description: '談演講、培訓、顧問或 AI 工具落地',
        external: true,
        icon: 'handshake',
        accent: 'var(--color-brick)',
      },
    ],
  },
] as const;
