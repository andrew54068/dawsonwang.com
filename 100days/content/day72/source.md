Day 72 Agent Browser vs Claude in Chrome——不是每次實驗都會成功

最近試了 Agent Browser 這個工具，它是 Vercel 出的一個 Claude Code skill，底層用 Stagehand + Playwright 來操作瀏覽器。聽起來很美好——自動開瀏覽器、自動點擊、自動填表單，而且不需要你的 Chrome 介入。

結果？我放棄了。

工具本身沒有 bug，問題出在 Playwright 底層：它啟動的是一個全新的自動化瀏覽器實例，會被大量主流網站的反爬蟲機制偵測到。Facebook、Instagram、Google、Reddit⋯⋯基本上你日常會用到的網站，幾乎都會擋你。

這就是今天想聊的：不是每次嘗試都會帶來更好的結果，但每次嘗試都會帶來學習。

【兩種方法的根本差異】

先搞清楚這兩個工具的本質差異：

Agent Browser（Stagehand/Playwright）：它會啟動一個全新的、獨立的瀏覽器實例。這個實例沒有你的登入狀態、沒有 cookies、沒有瀏覽器指紋。對網站來說，這就是一個機器人。

Claude in Chrome：它透過 Chrome extension 操作你正在使用的瀏覽器。你的登入狀態、cookies、瀏覽器指紋全部都在。對網站來說，這就是一個正常的使用者在操作。

一個是派一個機器人去幫你做事，另一個是在你的手上裝了一個自動化的手套。

【Token 用量比較——我自己跑的實驗資料】

很多人選工具只看功能，但在 AI 時代，token 用量才是真正的成本。網路上的資料看看就好，我決定自己跑一次實驗。

我用三個工具——Agent Browser（Vercel 的 CLI）、Playwright MCP（Agent Browser 底層引擎的原始版本）以及 Claude in Chrome——同時開 Hacker News、Threads、Facebook，測量每個工具實際回傳的資料量。

實驗 1：Hacker News（簡單頁面，無登入限制）

Agent Browser snapshot：46,693 bytes（約 11,600 tokens）
Playwright MCP snapshot：58,259 bytes（約 14,500 tokens）
Claude in Chrome read_page：約 27,000 chars（約 6,800 tokens）
Claude in Chrome get_page_text：約 2,800 chars（約 700 tokens）

Agent Browser 確實比原始 Playwright MCP 精簡了約 20%，它對 accessibility tree 做了壓縮處理。但意外的是，Claude in Chrome 的 read_page 比 Agent Browser 還小——只要 6,800 tokens，接近 Agent Browser 的六成。如果只需要文字內容，get_page_text 更是只要 700 tokens。

實驗 2：Threads（需要登入才有完整內容）

Agent Browser snapshot：7,047 bytes（約 1,760 tokens）——只看到公開首頁和"Log in or sign up"
Playwright MCP snapshot：15,817 bytes（約 3,950 tokens）——同樣只看到公開頁面
Claude in Chrome read_page：約 10,000 chars（約 2,500 tokens）——看到完整的"為你推薦"個人化動態

Agent Browser 在 Threads 上比 Playwright MCP 精簡了 55%，壓縮效果確實好。但這裡的重點不是 token 數量，而是內容品質。Agent Browser 和 Playwright 看到的都是"請登入 Threads"，Claude in Chrome 看到的是你的 feed 裡有誰發了什麼文。Token 少但什麼都看不到，有什麼用？

實驗 3：Facebook（重度反爬蟲 + 需要登入）

Agent Browser snapshot：4,918 bytes（約 1,230 tokens）——只有登入頁面
Playwright MCP snapshot：約 5,000 bytes（約 1,250 tokens）——同樣只有登入頁面
Claude in Chrome read_page：約 61,000 chars（約 15,000 tokens）——完整的登入後頁面，動態消息、好友邀請、社團貼文、Messenger 聯絡人、限時動態、廣告，全部都有。

Agent Browser 和 Playwright MCP 在 Facebook 面前毫無差別——兩個都只看到登入頁面，沒有 feed、沒有朋友、沒有任何內容。

這就是最殘酷的現實：不管你的 snapshot 壓縮做得多好，Playwright 底層開出來的自動化瀏覽器，navigator.webdriver 會被設成 true，Facebook 和 Cloudflare 看一眼就知道你是機器人。Claude in Chrome 用的是你正在使用的 Chrome，所有身份驗證都已經完成，所以能看到一切。

Agent Browser 在自己的網站上測試，確實比 Playwright MCP 精簡很多。從我的實驗來看，同一個頁面 Agent Browser 比 Playwright MCP 省了 20-55% 的 token。外部測試資料更誇張，同樣的 10 步操作從 114,000 tokens 降到 7,000 tokens。

【什麼時候該用 Agent Browser？】

Agent Browser 在它擅長的場景裡是真的強：

- 測試自己開發的 Web App：自動化測試、操作不會被擋，Token 效率碾壓其他方案。跑 CI/CD 裡的 E2E 測試，省下的 token 成本很可觀。
- 公開網站的資料擷取：像 Hacker News 這種不需要登入的頁面，Agent Browser 比 Playwright MCP 省 20-55%，而且 snapshot 格式乾淨好解析。
- 需要平行跑大量頁面的場景：Agent Browser 可以同時開多個獨立的瀏覽器實例，不受你本機 Chrome 限制。Stagehand 還有自動 caching 功能，重複操作同一個網站後續幾乎零 token。

簡單說，如果你的對象是"你能控制的網站"或"不擋 bot 的公開頁面"，Agent Browser 是更省錢的選擇。

【什麼時候該用 Claude in Chrome？】

但如果你的場景涉及：

- 需要登入的網站（社群媒體、Email、各種 SaaS）
- 有反爬蟲機制的主流平台（Facebook、Instagram、Google）
- 你的日常工作流程自動化——因為你日常用的就是 Chrome

那 Claude in Chrome 是唯一可行的選項。它吃的 token 比較多，但它能用你的身份完成任務。

啟用方式：用 --chrome flag 啟動 Claude Code，或直接在設定裡啟用（/chrome）。要注意啟用後瀏覽器工具會常駐載入，會稍微增加 context 的消耗。如果不是每次都需要瀏覽器操作，可以只在需要時用 --chrome 啟動。

【這次實驗的收穫】

1. Agent Browser 的壓縮確實有效——同一個頁面比 Playwright MCP 省了 20-55%。如果你是在測自己的產品，這個省下來的 token 是實打實的。

2. 但有趣的是，在公開頁面上，Claude in Chrome 的 read_page 居然比 Agent Browser 還精簡（HN 上是 6,800 vs 11,600 tokens），而 get_page_text 只要 700 tokens 就能讀完整個首頁。所以即使是公開頁面，Claude in Chrome 也不一定比較貴。

3. 真正的分水嶺是登入和反爬蟲。在 Facebook 面前，Agent Browser 的 1,230 tokens 只能換到一個登入頁面，Claude in Chrome 的 15,000 tokens 換到的是完整的 feed。便宜但什麼都看不到，跟貴但能完成任務，你選哪個？

4. 不是每次實驗都會成功，但放棄一個工具不代表浪費時間。現在我很清楚什麼場景該用什麼工具，這就是這次實驗最大的價值。

相關：
Day 68 Skill 的 context: fork
Day 70 Sub-Agent 分流
Day 71 用 Claude Code 把 Arc 分頁變成 Obsidian 筆記
