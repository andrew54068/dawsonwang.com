# 文章分類維護

官網以三個面向整理文章；同篇可有多個標籤。類型回答讀者能得到什麼，主題回答文章談什麼，時效性提示哪些資訊需要更新。分類標準見 [設計文件](superpowers/specs/2026-10-18-article-taxonomy-design.md)，逐篇理由見 [審閱紀錄](article-taxonomy-review.md)。

## 資料位置

- `src/data/topics.ts`：主題定義與每篇 `DAY_TOPICS`。第一個主題仍是 SEO 的 articleSection；先選主要內容，避免因提到工具就加標籤。
- `src/data/article-classification.json`：逐篇 `types`、`freshness`、`reason`、`sourceHash`。SHA-256 對應完整原始 `source.md` bytes；`reason` 記錄分類理由及原稿中的推測界線，不輸出到文章頁。
- `src/lib/article-taxonomy.ts`：七種文章類型、三種時效性與篩選規則。
- 舊 `/topics/beginner` 與 `/topics/cases` 保留為其他閱讀入口；前者代表讀者程度，後者保留既有案例／現場並納入案例復盤，並非新的主要主題。

## 新增或修訂文章

1. 讀完整正文，以主要讀者價值挑選 1–2 個類型、1–3 個主要主題及適用的時效性。
2. `fundamentals` 必須實質解釋可跨工具理解的定義、機制或限制。工具專屬設定、專案符號用法、單次排錯不因此成為基本觀念。
3. `evergreen` 需有充分且明確的可轉移原理、方法或經驗。只有工具介紹、比較排名、配置步驟、未落地構想或泛泛心得，不足以標記；不因提到品牌就排除真正的長期教學。
4. 若原理與版本資訊並存，可同時標 `evergreen` 和 `versioned`。活動／優惠／事件為主則用 `timely`。長期參考不是事實查核或保證永遠適用。
5. 更新主題及人工分類資料，填入簡短理由與新 SHA-256。可用既有 macOS `shasum -a 256 <source.md>`。
6. 執行 `yarn taxonomy:audit --strict` 檢查全部來源的缺漏、異動與統計，再執行 `yarn test`。

`yarn taxonomy:audit` 使用 `CONTENT_SRC` 指定路徑，否則優先 canonical `/Users/dawson/Documents/100Days/content`，不存在才使用 repo 的 `100days/content`。此行為與既有 categorize 腳本一致。其他機器以 `CONTENT_SRC=/path/to/content` 指定來源。

日常 `yarn categorize` 只補沒有主題的新文章，不覆蓋已有主題。`--retag` 或 `--day` 是既有的明確重新分類操作，會重算主題，但不改人工類型與時效。沒有人工分類的新文章仍顯示在全部文章／主題列表，不會自動宣稱為基本觀念或長期參考。audit 預設報告缺漏但不阻擋發文；`--strict` 才在缺漏或來源異動時回傳非零狀態。

## 網站入口與驗證

- `/topics`：依類型、主題、時效性分組的分類索引。
- `/days?type=fundamentals&topic=local-llm&freshness=evergreen`：可直接分享的交叉篩選。同軸 OR、跨軸 AND。`q` 只搜尋標題或 Day 編號；全文搜尋維持 `/search`。
- 篩選使用原生表單與少量 JavaScript；關閉 JavaScript 仍列出所有文章，並提供既有主題頁作為閱讀入口。
- `yarn taxonomy:verify-browser <preview-url>`：使用已安裝的 `chrome-devtools-axi` 驗證網址還原、交叉篩選、返回前進、清除、空結果、標題搜尋與手機／桌面溢出。此指令不安裝工具。

私人預覽使用現有 Tailscale 網路，啟動時查詢當前機器位址，不把舊 IP 當固定設定。不要將工作樹中的私人預覽路由視為已公開發佈。
