# WebMCP 公開內容工具

所有可索引頁面在支援 `document.modelContext` 的瀏覽器註冊：

- `search_articles({ query, mode?, limit? })`：文章限定，keyword 或 semantic；預設 keyword、10 筆，上限 20。
- `search_site({ query, limit? })`：Pagefind 全站關鍵字搜尋，包含文章、服務、專案、演講、主題、連結與指南。
- `read_page({ path })`：讀取公開內容正文與連結；接受本站絕對網址或路徑。拒絕外站、API、未知路徑與查詢參數；最多回傳 40,000 字及 100 個連結，截斷時標示 truncated。

搜尋結果會顯示在頁面的「AI 助理搜尋結果」區域。工具沒有發信、送出表單或修改資料的能力。不支援 API 的瀏覽器繼續使用一般網站。

## 驗證

1. `yarn test`、`yarn astro check`、`yarn build`、`yarn check:seo`。
2. Chrome 開啟 `chrome://flags/#enable-webmcp-testing` 並重啟，使用 HTTPS 或 localhost。
3. 使用 Model Context Tool Inspector 或 `document.modelContext.getTools()` 確認三個工具。
4. 搜尋 MCP 文章、搜尋 Permission Guardian（應包含 /projects/）、讀取 /projects 與一篇文章、測試語意搜尋。
5. 檢查頁面顯示結果、連結可用，並確認一般 /search?q=MCP 正常。

Chrome 154 的 executeTool 使用 JSON 字串引數；更新版本請依官方文件使用物件。本站註冊的 execute callback 接收已解析的物件。

Pagefind 必須以 `dist/client` 為輸入、`dist/pagefind` 為輸出，否則 URL 會錯誤包含 /client/。正式部署繼續沿用既有 sync-pagefind-to-vercel 流程。

語意搜尋沿用 /api/embed 的 Cloudflare 設定與 ALLOWED_ORIGINS。私有預覽需把實際預覽來源加入啟動環境，不要放寬正式環境的來源檢查。

WebMCP 仍是實驗 API。正式網域若要提供免旗標試用，需依 Chrome Origin Trial 當期規則設定有效 token；本變更未申請 token。

官方文件：https://developer.chrome.com/docs/ai/webmcp/imperative-api
