# Article Taxonomy Implementation Plan

**Goal:** 將所有文章依類型、主題、時效重新整理並提供交叉篩選。
**Architecture:** 現有 DAY_TOPICS 保持主題唯一來源；新增人工編輯的類型、時效與來源查核資料。共用 TypeScript 篩選與 URL 解析，由 Astro 產出完整文章，再用原生表單增強互動。
**Tech Stack:** Astro、TypeScript、Vitest、Yarn；不新增依賴。
**Spec:** ../specs/2026-10-18-article-taxonomy-design.md

## Global Constraints
- 保留原文章 URL、現有主題 URL、正文、人工分類與既有網站樣式。
- 以 canonical 100Days 全部文章為範圍；逐篇讀正文。未整理新文不可推定為基本觀念或長期參考。
- 僅私人預覽；不推送、不公開發佈。

## Review Focus
- 無效及重複 URL 參數須安全忽略；重新載入、返回、前進須保持篩選狀態。
- 同軸多選 OR、跨軸 AND、無結果與清除；關閉 JS 時仍可瀏覽所有文章。
- 混合文章可同時長期與版本相關；提及品牌不應失去基本觀念分類。
- 新文缺分類時仍可見，既有人工分類不被預設每日腳本改寫。
- 手機標籤及控制項不得造成水平溢出，所有控制項有可存取名稱。

### Task 1: Editorial reclassification and data contracts
- [x] 分三批閱讀全部文章，產出類型、主題、時效、理由及原檔 hash，並以較嚴格的持久性判準二次審閱。
- [x] 先測試完整涵蓋、已知標籤、數量上限、代表案例與來源 hash；確認新測試失敗。
- [x] 加入三軸定義、人工資料、主題規則與共用篩選函式；測試轉綠。

### Task 2: Browsing integration
- [x] 先加入 URL 與篩選行為測試，確認失敗。
- [x] 更新 /days 表單、/topics 分組、文章頁及列表標籤；維持舊 URL。
- [x] 驗證 URL 可重現、返回前進、清除、空結果、手機、原生 checkbox 與焦點樣式。

### Task 3: Verification and private delivery
- [x] 全測試、Astro 檢查、完整 build、SEO 驗證；修正實際問題。
- [x] 獨立 review，修正重要問題。舊 topic=cases 入口遺失條件問題經瀏覽器 RED→GREEN。
- [x] Tailscale 私人服務；實際建置的 HTTP、同來源素材及 16 項瀏覽器檢查通過，保留服務。
- [x] MacBook Air 端 HTTP 驗證：裝置恢復連線後，經 SSH 從 Air 讀取分類頁正文，文章索引、Day 186、Pagefind 與 CSS／JavaScript 素材均回傳 200。

## 完成證據

- 290 篇分類、0 缺漏、0 來源 hash 異動；基本觀念 38 篇、長期參考 167 篇。標籤可重疊。
- 33 個 Vitest 檔案、292 項測試通過；Astro check 0 errors、0 warnings，既有 RSS 未使用 import 留有 1 hint。
- 完整離線 build、290/290 文章頁、20/20 主題頁、SEO 檢查通過。
- 實際建置產物：16 項瀏覽器互動與 390px / 1280px 無水平溢出檢查通過；深淺主題經畫面檢視。
- 私人預覽已從 MacBook Air 驗證頁面及素材可讀取；瀏覽器互動測試在提供服務的機器執行，未宣稱 Air 瀏覽器端互動驗證。未公開發佈。
