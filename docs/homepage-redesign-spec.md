# dawsonwang.com 首頁重設計 Spec v2 (locked)

> Status: 待你最後 sign-off → 進入實作 (Phase 1)。
> 與 v1 差異：見最後「Changelog v1 → v2」。

---

## 0. 你已拍板的決策

| # | 決策 |
|---|---|
| D1 | Hero 副標：**砍掉「iOS@Taipei 社群主持人」credential**，改為條列式 bullet credentials |
| D2 | 新增 credential：**iPAS AI 應用規劃師（中級）能力鑑定**——經濟部產業發展署發證 |
| D3 | Tools section 不用 D087 生日禮物，**改用 D134 iPAS 試題練習網站** |
| D4 | D139 語意搜尋卡的 CTA **直接連 `/search`**，不需要免責文字 |
| D5 | Proof 區塊 **不在本 spec 處理**——你已有 PR 在修 |
| D6 | **分 3 PR 漸進上線** |

---

## 1. 新版首頁結構（top → bottom）

```
1. Hero（小改 copy + 改 credentials 為 bullets）
2. 🆕 RecentConsultations「最近三場諮詢都在解什麼」 ← D096 / D099 / D098
3. 🆕 ToolsIBuilt「我自己也是重度使用者」      ← D071 / D134 / D139
4. Services（修 examples + 加 relatedDays 連結）
5. Proof（不動，等你的 PR）
6. Inquiry（加微 social proof）
```

---

## 2. Section-by-section spec

### Section 1：Hero

**保留**：左文右照、stats 列、漸層色塊、CTA 雙按鈕排版、kicker `Day N · shipping daily`、H1 `把 AI 工具搬進你的實際工作流。`

**改副標**：把現在一整段散文改成「一句定位 + bullet credentials」。

**新版 markup**：

```astro
<p class="font-display text-muted text-lg leading-relaxed max-w-xl mb-6">
  9 年新創軟體經驗。過去 {totalDays} 天每天公開實作 AI 工作流——
  現在幫你的團隊把這套方法搬進生產環境。
</p>
<ul class="font-display text-muted text-base leading-relaxed max-w-xl mb-9 list-none p-0 space-y-2">
  <li class="relative pl-5 before:absolute before:left-0 before:top-3 before:w-3 before:h-px before:bg-teal">
    iOS → DevRel → Full Stack 跨領域工程經驗
  </li>
  <li class="relative pl-5 before:absolute before:left-0 before:top-3 before:w-3 before:h-px before:bg-teal">
    iPAS AI 應用規劃師（中級）能力鑑定 · 經濟部產業發展署發證
  </li>
  <li class="relative pl-5 before:absolute before:left-0 before:top-3 before:w-3 before:h-px before:bg-teal">
    已協助旅遊業把 AI 接進實際業務流程改善效率
  </li>
</ul>
```

**改次 CTA**：

| 元素 | 現在 | 新版 |
|---|---|---|
| 主 CTA | `預約 30 分鐘 →` → `#inquire` | （保留） |
| 次 CTA | `查看 N 篇實作` → `/days` | `看最近 3 個諮詢案例 ↓` → `#cases` |

**Bullet 順序理由**：
- 工程經驗在最前（建立 technical credibility）
- 證照中間（建立 AI 領域官方背書）
- 實戰結果在最後（給客戶代入感，承接到下面的 case studies）

---

### Section 2：🆕 RecentConsultations「最近三場諮詢都在解什麼」

> 完全同 v1。

**Anchor**：`<section id="cases">` ← Hero 次 CTA 跳這裡

**Header**：
- Kicker：`CASE STUDIES · 最近 3 場諮詢`
- H2：`他們本來卡在哪裡，<br />後來怎麼動起來。`

**3 張卡**：

| Card | Day | 客戶 | 痛點 | 產出 |
|---|---|---|---|---|
| 1 | **D096** | 診所主治醫師 | 每位病人 2–3 分鐘，療程決策樹複雜；國際 SOP 每 3 個月更新 | PDF SOP 拆成可查詢決策樹（PyMuPDF + Claude） |
| 2 | **D099** | 科技大廠社群經理 | KOL 案散在 Spreadsheet / LINE / Email / 檔案 / 社群平台 5+ 個工具 | 找出「會用 AI」跟「用得好」之間的鴻溝，重設計工作流 |
| 3 | **D098** | LINE 重度使用者（PM/老闆） | 工作群散落 LINE 各群組，無法回顧 | LINE Desktop MCP：AI 直讀本機 LINE，零 API 零開發者帳號 |

**卡片元件**（每張）：
```
┌──────────────────────────────┐
│ [kicker mono] 諮詢 · 醫療      │
│ [大標 display] 把國際 SOP 變成 │
│              診間決策樹        │
│ [副本 muted]   一位醫師每位病人 │
│              2–3 分鐘 ...     │
│ ─────────────                 │
│ [mono] Day 096 · 看完整案例 → │
└──────────────────────────────┘
```

**Footer**：右下 `看所有 N 篇實作 →` → `/days`

---

### Section 3：🆕 ToolsIBuilt「我自己也是重度使用者」

**Header**：
- Kicker：`PERSONAL TOOLS · 我每天都在用`
- H2：`不只給客戶做，<br />我自己也每天用。`
- 副標：`下面這三個工具都從個人痛點出發，現在每天還在用——而且每一個都附完整源碼或步驟。`

**3 張卡**：

| Card | Day | 大標 | 痛點 | 產出 | 數字 hook | CTA |
|---|---|---|---|---|---|---|
| 4 | **D071** | 103 個 Arc 分頁 → Obsidian 結構化筆記 | 永遠看不完的「等等再看」分頁 | Claude Code 一次轉成可搜尋知識庫 | `103 → 1` | `Day 071 · 看完整流程 →` |
| 5 | **D134** | 把 iPAS 195 題變成可練習的網頁 | 準備證照沒有像樣的線上題庫 | 2 週上線：195 題、三科全包、每題有解析 | `195 題 / 3 科 / 2 週` | `試用題庫 →` → `https://ipas-quiz-eight.vercel.app/` |
| 6 | **D139** | 幫網站加上語意搜尋——零月費、不用資料庫 | 朋友找不到我寫過的舊文 | 3 步上線關鍵字 + 語意雙模式 | `3 步 / $0 / 0 DB` | `試用本站搜尋 →` → `/search` |

**特別說明**：
- Card 5 (D134) **CTA 連到外部 ipas-quiz-eight.vercel.app**——這是「他真的會 ship 產品」最強證明（而且自然帶出 iPAS 證照敘事，跟 Hero 那條 credential 互相印證）
- Card 6 (D139) **CTA 直接連 `/search`**——visitor 立刻體驗到「啊原來這就是你說的 AI 落地」。這是整頁最強的 self-demo

**敘事連動**（這組挑選的暗線）：
- Card 4：個人知識管理（給知識工作者代入）
- Card 5：學習工具 + iPAS 證照閉環（呼應 Hero 第 2 條 bullet）
- Card 6：本站功能 = 文中描述的產出（self-referential）

---

### Section 4：Services

**結構保留**。改三件事：

**4a. 改 examples（更具體、能對應到上面的 case studies）**

```ts
{
  id: 'implementation',
  title: 'AI 工具落地',
  examples: [
    'Claude Code 進駐你的團隊（skills、MCP、agent 工作流）',
    '把 PDF / SOP / 檔案變成可查詢的決策資產',
    '把散在 LINE / Email / Spreadsheet 的流程接起來',
  ],
  relatedDays: [96, 71],
},
{
  id: 'training',
  title: '工作流培訓',
  examples: [
    '團隊工作坊（半天 / 一天）',
    '1:1 教練（從個人工具出發）',
    '長期顧問陪跑（每週同步）',
  ],
  relatedDays: [99],
},
{
  id: 'advisory',
  title: '演講 / 顧問諮詢',
  examples: [
    '企業內訓（AI 工作流現況 / 落地路線圖）',
    '線上活動 / podcast 受訪',
    '1 hr pick-my-brain 諮詢時段',
  ],
  relatedDays: [98, 99, 96],
},
```

**4b. 加 `relatedDays` 連結**：在每張卡底部、CTA 同一行左邊加小字 `相關案例：Day 096, Day 071 →`，hover 進去個別連到 `/day/N`。

**4c. 空白 bullet bug**：在 Phase 2 PR 順手 audit production 渲染狀態，必要時補 fix。

---

### Section 5：Proof

**不動**——等你的 PR。本 spec 不負責。

---

### Section 6：Inquiry

**新增微 social proof**（在 H2 下方、表單上方）：

> `最近諮詢的客戶來自：旅遊 · 醫療 · KOL 經紀 · 自媒體`

理由：給 visitor 「我屬於這個 list 裡的人」的代入感。

list 來源對應：
- 旅遊 → Hero bullet 提到（案例未公開發文）
- 醫療 → D096
- KOL 經紀 → D099
- 自媒體 → D097 (YouTuber)

**其餘保留**。

---

## 3. 實作計畫（3 PR）

### PR 1 — Copy & data only（最低風險）
**檔案**：
- `src/components/Hero.astro`：改副標 → bullet credentials + 改次 CTA
- `src/data/services.ts`：改 examples + 加 `relatedDays` 欄位（暫不渲染）
- `src/components/InquiryForm.astro`：加 vertical list 一行

**驗收**：build pass、existing tests pass、視覺對比截圖 OK

### PR 2 — New sections（主要改動）
**檔案**：
- 新建 `src/components/RecentConsultations.astro`
- 新建 `src/components/ToolsIBuilt.astro`
- `src/pages/index.astro`：插入新 sections、調整順序
- 移除 / 隱藏舊 `FeaturedPosts` import（保留檔案以防回退）

**驗收**：build pass、新增 e2e 測試覆蓋 6 張卡的連結 + anchor scroll、視覺對比

### PR 3 — Polish
**檔案**：
- `src/components/ServiceExplainer.astro`：渲染 `relatedDays` 連結 + audit 空白 bullet bug
- 可能微調 spacing / typography

**驗收**：build pass、視覺對比

---

## 4. 還需要你回答的事

只剩兩個小問題：

1. `[ ]` **Hero bullet 第 3 條**：「已協助醫療、KOL 經紀、自媒體把 AI 接進實際業務流程」——這樣寫 OK？還是要更保守 / 更銳利？
2. `[ ]` **iPAS 證照狀態**：你目前是「已通過中級」還是「準備中」？我寫的版本是 assume 已通過。如果還在準備中，文案要改成「正在準備 iPAS AI 應用規劃師（中級）能力鑑定」，會比較誠實。

---

## Changelog v1 → v2

- Hero 副標：從單段散文 → 1 句定位 + 3 條 bullet credentials（新增 iPAS）
- ToolsIBuilt Card 5：D087 生日禮物 → **D134 iPAS 試題網站**
- D139 CTA：移除「免責」考量，直接連 `/search`
- Section 5 (Proof) scope：移出本 spec
- iPAS 證照查證：**iPAS AI 應用規劃師（中級）能力鑑定**，主辦＝經濟部產業發展署，執行＝財團法人工業技術研究院（iPAS 平台），官方頁：https://www.ipas.org.tw/AIAP

---

*Spec v2 · locked · 寫於 Day 165*
