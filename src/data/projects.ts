// Source of truth for /projects — the side-project showcase.
//
// Every entry here is something Dawson actually built (or forked and shipped)
// during the Day 1–219 public build log. Tools that were only *reviewed* on a
// given day (OpenUsage, open-slide, pxpipe, i-have-adhd, Vexa, gws, Cloudflare
// Drop, codex-plugin-cc …) deliberately do NOT belong in this file — this page
// claims authorship, so anything listed must be his own work.
//
// `days` links each project back to the write-ups that cover it. /projects
// resolves those numbers against the `days` collection at build time, so a typo
// fails the build rather than shipping a dead link. Keep them ascending.

export type ProjectStatus = 'open-source' | 'shipped' | 'building';

export interface Project {
  /** Stable anchor id — also the JSON-LD ListItem key. */
  slug: string;
  name: string;
  /** One line: what it is. Shown under the name. */
  tagline: string;
  /** The pain that started it. */
  problem: string;
  /** What it does now — the payoff. */
  outcome: string;
  status: ProjectStatus;
  /** Display category kicker (e.g. `MCP Server`). */
  kind: string;
  /** Tech tags, rendered as chips. Keep to ≤5 so cards stay scannable. */
  stack: string[];
  /** Day write-ups covering this project, ascending. */
  days: number[];
  /** Public source, when it exists. */
  repo?: string;
  /** Live demo / try-it URL. Root-relative is fine. */
  demo?: string;
  /** Label for the demo button. Defaults to `試用 →`. */
  demoLabel?: string;
  /** Featured projects render as large cards above the rest. Aim for 4. */
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    slug: 'line-cua-mcp',
    name: 'line-cua-mcp',
    tagline: '讓 AI 讀寫本機 LINE，全程不搶你的滑鼠和鍵盤',
    problem: '案子的需求跟一改再改的細節全散在 LINE 對話裡，做到一半還得回頭翻。既有的開源工具能用，但每次一動就把 LINE 搶到前景、奪走鍵盤焦點，我打到一半的字還會跑進 LINE。',
    outcome: '改走 macOS Accessibility API：不模擬滑鼠鍵盤，直接跟系統說「按下這一格」。讀訊息直接讀本機那份加密資料庫，拿到的是完整歷史而不是畫面上那幾則；送訊息預設只留草稿、預設只允許 1:1。',
    status: 'open-source',
    kind: 'MCP Server',
    stack: ['cua-driver', 'macOS AX API', 'MCP', 'Claude Code'],
    days: [98, 172, 175],
    repo: 'https://github.com/andrew54068/line-cua-mcp',
    featured: true,
  },
  {
    slug: 'ipas-quiz',
    name: 'iPAS 題庫',
    tagline: '195 題考古題，每題都有解析的證照練習網站',
    problem: '準備 iPAS AI 應用規劃師中級，想用 top-down 的方式從考題往回念。但市面上的題庫不是要登入、就是只有題目沒解析。',
    outcome: '三科各 65 題全部跟官方答案欄對過，每題都有「為什麼」面板（為什麼這個對、其他三個為什麼錯）並直連學習指引 PDF 對應頁。選項打亂、弱點追蹤、純鍵盤操作，紀錄只存在你自己的瀏覽器。Day 162 我用它考過了。',
    status: 'open-source',
    kind: 'Web App',
    stack: ['Claude Code', 'Vercel', 'localStorage'],
    days: [134, 162],
    repo: 'https://github.com/andrew54068/ipas-quiz',
    demo: 'https://ipas-quiz-eight.vercel.app/',
    demoLabel: '開始刷題 →',
    featured: true,
  },
  {
    slug: 'ez100pu-apple-silicon',
    name: 'ez100pu-apple-silicon',
    tagline: '讓 M 系列 Mac 讀得到 EZ100PU 自然人憑證讀卡機',
    problem: '廠商這幾年沒出過 arm64 驅動，HiPKI 讀不到卡，自然人憑證、健保查詢、線上報稅全卡住。官方文件寫得很明確：不支援 M 系列晶片。',
    outcome: '以開源的 ezIFD 驅動為底，修掉三個讓它在 macOS 上打不開的 bug、重做 ad-hoc 簽章、預編譯成 arm64 bundle，再加一支會先清掉舊驅動的安裝腳本。HiPKI 九項自我檢測全過，一行指令裝好。',
    status: 'open-source',
    kind: 'macOS Driver',
    stack: ['ezIFD', 'arm64', 'PC/SC', 'Claude Code'],
    days: [183, 184],
    repo: 'https://github.com/andrew54068/ez100pu-apple-silicon',
    featured: true,
  },
  {
    slug: 'skills-manager',
    name: '/skills-manager',
    tagline: 'Claude Code 和 Codex 共用同一套 skill，還能按專案開關',
    problem: 'skill 一多就吃掉 context window，每個專案其實只用得到其中幾個；混用多個 LLM 的話，同一份 skill 還得各維護一份。',
    outcome: 'bullpen + symlink 架構——skill 統一住在 ~/.agents/skills-bullpen/，專案要用哪些就 symlink 哪些。兩條指令安裝，任何專案打一次 /skills-manager 就出互動選單勾選。',
    status: 'open-source',
    kind: 'Claude Code Plugin',
    stack: ['Claude Code Plugin', 'Codex', 'symlink'],
    days: [117, 119, 166],
    repo: 'https://github.com/andrew54068/claude-plugins',
    featured: true,
  },
  {
    slug: 'permission-guardian',
    name: 'Permission Guardian',
    tagline: '自動維護 Claude Code 的權限白名單',
    problem: '不想長期掛著 --dangerously-skip-permissions（看太多人的系統檔案被 AI 砍掉），可是每個沒看過的指令都要按一次同意也受不了。',
    outcome: '針對常見框架和 tech stack 先把安全的指令 mapping 進 settings.json 的白名單，只有超出預期的指令才需要你親自決定放不放行。',
    status: 'open-source',
    kind: 'Claude Code Plugin',
    stack: ['Claude Code Skill', 'settings.json'],
    days: [7, 8],
    repo: 'https://github.com/andrew54068/claude-plugins',
  },
  {
    slug: 'threads-patrol-bot',
    name: 'Threads 海巡 Bot',
    tagline: '每天早上自動掃 200 篇貼文，篩完摘要推到 Telegram',
    problem: '每天花大量時間手動海巡 Threads 追新知，一篇一篇過濾。出門在外又不是隨時都適合開電腦。',
    outcome: 'Cronjob 定時收集 → 本地 LLM 篩出有興趣的主題 → 整理摘要 → 推到 Telegram。用看一篇文章的時間掃完 200 篇。整條線是拿 SDD + BDD + TDD 一路寫下來的。',
    status: 'shipped',
    kind: 'Automation Bot',
    stack: ['Puppeteer', 'Osaurus', 'qwen3-4b', 'Telegram Bot', 'SDD/BDD/TDD'],
    days: [12, 13, 14, 15, 16, 17, 18, 21, 27, 28],
  },
  {
    slug: 'devtown',
    name: 'DevTown',
    tagline: '六個 AI 專案住進一座像素小鎮，一眼看完誰還在忙',
    problem: '同時把工作丟給好幾隻 AI 之後，注意力被切碎了——一回頭就得重新問自己「這個專案剛剛卡在哪」。',
    outcome: '每個專案一間房間、每隻 AI 一個坐在桌前的角色，頭上掛著現在的狀態。WebSocket 保持即時連線，誰從閒置變成 working，畫面馬上動。把要記的東西從腦子搬到畫面上。',
    status: 'building',
    kind: 'Desktop Dashboard',
    stack: ['WebSocket', 'Pixel UI', 'Claude Code sessions'],
    days: [157, 188],
  },
  {
    slug: 'dawsonwang-com',
    name: 'dawsonwang.com',
    tagline: '你正在看的這個網站——文章發完就自動跟著上線',
    problem: 'Threads、LinkedIn、IG 都是租來的房子。演算法什麼時候不推你、帳號什麼時候被鎖，你都沒得選。',
    outcome: 'Astro 6 + Tailwind v4 部署在 Vercel，網域走 Cloudflare Registrar。100Days 內容以 git submodule 掛進來，GitHub Actions 定時 bump submodule pointer，Vercel 接手自動 build——100Days 那邊一行都不用改。',
    status: 'shipped',
    kind: 'Website',
    stack: ['Astro 6', 'Tailwind v4', 'Vercel', 'GitHub Actions'],
    days: [137, 138, 143, 148],
  },
  {
    slug: 'semantic-search',
    name: '站內語意搜尋',
    tagline: '關鍵字 + 語意雙模式，零月費、不用資料庫',
    problem: '朋友問我：「你之前那篇講 Raycast 本地模型的，是哪一天？」我自己也答不出來。文章散在三個平台，平台搜尋只找得到一模一樣的字串。',
    outcome: '搜「AI 焦慮」切到語意模式，連在講「擔心被取代」、「跟 AI 共存」的篇章都撈得出來——就算文章裡根本沒有「焦慮」兩個字。預設停在關鍵字（快、準），找不到再切語意。',
    status: 'shipped',
    kind: 'Site Feature',
    stack: ['Pagefind', 'Embeddings', 'Astro'],
    days: [139],
    demo: '/search',
    demoLabel: '試搜看看 →',
  },
  {
    slug: 'studio',
    name: 'Studio',
    tagline: '用瀏覽器遙控家裡那台 Mac 上的 Claude Code',
    problem: '從一個念頭到按下發佈，整條 pipeline 都得回終端機跑。人不在書桌前就等於做不了事。',
    outcome: '手機或筆電開個網頁，就能寫文、跑完整條 pipeline、看三個平台的草稿、按下發佈。跑在自己的 MBP 上、只在 Tailscale 私網裡通，用的是 Claude Code 訂閱額度而不是另外付一筆 API 錢。',
    status: 'building',
    kind: 'Internal Tool',
    stack: ['Tailscale', 'Claude Code', 'Web UI'],
    days: [208],
  },
  {
    slug: 'event-sidekick',
    name: 'Event Sidekick',
    tagline: '看到活動截個圖，Raycast 一鍵丟進 Google 日曆',
    problem: '活動資訊散在 LINE 對話、Luma、Accupass、獨立網頁、社群貼文，有時候甚至只出現在一張圖上，不見得都支援一鍵加入行事曆。',
    outcome: '剪貼簿是圖就讀圖、是網址就抓網頁；也能直接框選螢幕。AI 把名稱、時間、地點抽成結構化欄位，順手比對有沒有撞期——然後停在這裡等你確認。從一開始就定死：AI 可以抽、可以建議，但絕不自己寫進行事曆。',
    status: 'shipped',
    kind: 'Raycast Extension',
    stack: ['Raycast', 'Fable', 'Google Calendar'],
    days: [194],
  },
  {
    slug: 'obsidian-second-brain',
    name: 'Obsidian 第二大腦',
    tagline: '三層機制，讓 Claude 每次回話前先讀過我的筆記',
    problem: '個人脈絡塞不進 CLAUDE.md——這個專案為什麼這樣選、之前做過哪個小工具、上次解掉的 bug。而 103 個「等等再看」的分頁，永遠比消化的速度長得快。',
    outcome: 'UserPromptSubmit hook 在每次送出前用 fd + rg 撈出最相關的筆記注入背景；便宜的先跑、貴的用到才呼叫；寫入端有守門人，不讓 AI 亂改第二大腦。Day 180 把 151 則筆記整包搬到 Google 的 OKF 開放規格。',
    status: 'shipped',
    kind: 'Personal Workflow',
    stack: ['Obsidian', 'Claude Code Hooks', 'fd + rg', 'OKF'],
    days: [71, 105, 180],
  },
  {
    slug: 'security-scan',
    name: '/security-scan',
    tagline: '一鍵派出六隻 sub-agent 平行掃描專案資安',
    problem: '現在開源專案的門檻很低，看到想用的就 clone 下來——但沒先做資安檢查，等於幫駭客留了一道後門。',
    outcome: '一個 custom command，呼叫時同時派出 6 個獨立 sub-agent，各自負責不同的掃描面向，全部平行跑完再彙整成一份報告。',
    status: 'shipped',
    kind: 'Claude Code Command',
    stack: ['Claude Code', 'Sub-agents'],
    days: [57, 92],
  },
  {
    slug: 'gemini-web-image',
    name: 'gemini-web-image',
    tagline: '讓 Claude Code 用你已經登入的瀏覽器叫 Gemini 生圖',
    problem: 'Gemini 網頁版要登入 Google，但 Playwright、Puppeteer 開的都是全新、沒有任何登入狀態的瀏覽器。而 Chrome 136 之後，用預設 profile 開 remote debugging 會直接被擋。',
    outcome: '建一個專用的 debug profile 走 CDP 連上去（跟你平常的 Chrome 完全獨立，不會把 cookies 複製到暫存目錄）。後來改成 headless 全背景執行，不彈任何視窗。Day 76 再補上正體中文標題排版——AI 生圖寫中文幾乎都會缺筆畫，所以拆成兩步做。',
    status: 'shipped',
    kind: 'Claude Code Skill',
    stack: ['CDP', 'Playwright', 'Gemini', 'headless Chrome'],
    days: [74, 76],
  },
  {
    slug: 'autoclicker',
    name: 'AutoClicker',
    tagline: '會自我進化的 App 廣告自動點擊系統',
    problem: '為了拿 App 裡的免費獎勵點數，每天要手動點掉幾十支又長又煩的廣告。',
    outcome: 'iPhone 定時截圖傳給 Mac，Mac 判斷完回指令。第一層先比對已知的「X」按鈕圖，命中就秒點；沒見過的才呼叫 Claude 看圖。每次 Claude 破解一個新廣告，那個按鈕就自動存回第一層的樣本庫——跑越久越少需要呼叫 Claude。',
    status: 'shipped',
    kind: 'Automation',
    stack: ['iPhone ↔ Mac', 'Template Matching', 'Claude Vision'],
    days: [75],
  },
  {
    slug: 'antigravity-manager-fork',
    name: 'Antigravity-Manager fork',
    tagline: '幫模型路由加上 Strategy Pool，額度用完自動換手',
    problem: '付了多個 AI 訂閱，卻沒辦法把每個帳號的額度都用到極致——想認真跑的時候燒很快，忙別的事的時候又整個放著。',
    outcome: '看到社群有個加 strategy pool 的 PR，但有 conflict、不見得會被 merge，就 fork 一版改在自己的 branch 上。設好 candidates 順序後，第一個模型額度用完就自動接到下一個。',
    status: 'open-source',
    kind: 'Fork',
    stack: ['Model Router', 'Antigravity'],
    days: [19, 20, 21],
    repo: 'https://github.com/andrew54068/Antigravity-Manager',
  },
  {
    slug: 'open-source-prep',
    name: 'open-source-prep',
    tagline: '開源前那一串雜事，一句話跑完',
    problem: '手上幾個 side project 一直想開源，但每次都卡在同一個地方——不是 code 沒寫完，是 README 要重寫、授權要選、設定檔的金鑰要清乾淨。想到就累，專案就繼續躺在私有 repo 裡。',
    outcome: '把「只有我看得懂的私人專案」帶到「可以安全公開的 repo」，包含最容易漏掉也最危險的那一步，還有工程師最常略過的那關：你到底有沒有權利開源。',
    status: 'shipped',
    kind: 'Claude Code Skill',
    stack: ['Claude Code Skill'],
    days: [202],
  },
  {
    slug: 'zh-tw-usage-detector',
    name: 'zh-tw-usage-detector',
    tagline: '抓出 AI 中文裡「聽起來合理、但沒人這樣用」的詞',
    problem: '想做一份禁用詞清單當 lint，看到一個擋一個——結果當場破功：請 AI 幫忙想辦法，它在同一段對話裡又生出一個新的怪詞。怪詞是生成出來的，不是有限的。',
    outcome: '不靠清單，改用機制判斷：母語者是從腦裡「取」一個講定的固定講法，AI 是現場「組」一個聽起來合理的搭配。用這條線去掃，只回報候選、不自動改。',
    status: 'shipped',
    kind: 'Claude Code Skill',
    stack: ['Claude Code Skill'],
    days: [158],
  },
  {
    slug: 'mac-llm-server',
    name: '家用 LLM 伺服器',
    tagline: '書桌上的 MBP 當本地模型主機，Air 只當前端',
    problem: '家裡兩台 Mac，與其兩邊各裝一份、各下載一次模型，不如一次把架構做對——何況比較弱的那台本來就跑不動。',
    outcome: 'Ollama 沒有 API key、沒有任何驗證，「誰連得到那個 port」等於「誰能用你的 LLM」。所以把它綁在 Tailscale 的介面 IP 上，網路層直接當驗證層——咖啡店的 Wi-Fi 掃不出這個 port。MagicDNS 解名字就連得到，Raycast 接上去當前端。',
    status: 'shipped',
    kind: 'Home Infra',
    stack: ['Ollama', 'Tailscale', 'Raycast', 'MagicDNS'],
    days: [11, 107, 125, 169],
  },
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  'open-source': '開源',
  shipped: '已上線',
  building: '進行中',
};

/** Tailwind classes per status chip. Keyed so the page can't invent a variant. */
export const STATUS_CLASSES: Record<ProjectStatus, string> = {
  'open-source': 'chip chip-teal',
  shipped: 'chip chip-outline',
  building: 'chip chip-ochre',
};
