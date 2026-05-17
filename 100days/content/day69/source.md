Day 69 你一定要知道的管控 Claude Code context 的小工具

前幾天聊了 subagent 的 context 問題、skill 的 context: fork，但有個更根本的問題：你怎麼知道 Claude Code 的 context 裡到底塞了什麼？

答案是：你看不到。Claude Code 的對話過程是封裝的，system prompt 有多長、tool call 傳了什麼、每次 API call 用了多少 token，正常使用下完全是黑盒。

今天介紹一個開源工具：claude-trace，讓你可以完整攔截並檢視 Claude Code 的每一次 API 呼叫。

GitHub：https://github.com/loki-zhou/claude-trace

它是什麼

claude-trace 是一個 CLI wrapper，你用它來啟動 Claude Code，它會在背後攔截所有送往 Anthropic API 的 fetch() 請求，把完整的 request/response 記錄成 JSONL 檔案，然後生成一個獨立的 HTML 報告，用瀏覽器打開就能看。

不需要改任何設定，不需要 proxy server，裝好直接用。

前提是你的 Claude Code 必須是透過 npm 安裝的版本（npm install -g @anthropic-ai/claude-code），因為 claude-trace 的原理是注入 Node.js 的 fetch() interceptor，需要 Claude Code 跑在 Node.js 環境裡才能攔截。

安裝與使用

npm install -g @loki-zhou/claude-trace

然後用 claude-trace 取代 claude 來啟動：

claude-trace

它會在 .claude-trace/ 目錄下自動產生 log-YYYY-MM-DD-HH-MM-SS.jsonl 和對應的 .html 檔。對話結束後用瀏覽器打開 HTML 就能看到完整紀錄。

運作原理

核心機制很簡單：攔截 fetch()。

Claude Code 在執行時，所有跟 Anthropic API 的通訊都透過 fetch() 發出。claude-trace 注入一個 interceptor，在每次 fetch() 呼叫時攔截，把 request 和 response 的完整內容（headers、body、status code）寫入 JSONL 檔。

預設只記錄 /v1/messages 的請求（也就是真正的對話 API call），而且只抓超過 2 則訊息的對話，過濾掉初始化之類的雜訊。如果你想看全部，可以加 --include-all-requests。

記錄完之後，它會把前端程式碼嵌入生成一個獨立的 HTML 檔案，不需要任何 server 就能在瀏覽器裡檢視。

三個檢視模式

打開 HTML 報告，上方有三個 tab：

1. conversations——對話檢視

這是最有用的模式。它把 raw API call 還原成可讀的對話流，你可以看到：

→ System Prompt 的完整內容（展開 [+] System Prompt 就能看到）
→ 每個 Tool 的定義和 schema（展開 [+] Tools 可以看到所有可用工具）
→ 每一輪 USER / ASSISTANT 的完整訊息
→ tool_use 和 tool_result 的詳細內容

（截圖 01-overview：主介面，顯示對話列表和展開的訊息）
（截圖 02-system-prompt：展開的 System Prompt，可以看到完整的系統指令）

這讓你第一次能"看見"Claude Code 到底把什麼塞進 context。比如我打開一看，光是 system prompt 就包含了 billing header、完整的行為指令、所有 tool 的定義、CLAUDE.md 的內容、MCP server 的說明⋯⋯全部加起來佔了非常可觀的 token 數。

2. raw calls——原始 API 呼叫

顯示每一次 POST /v1/messages 的 request/response pair，包含：

→ 使用的 model（例如 claude-opus-4-6、claude-haiku-4-5-20251001）
→ HTTP status code
→ 時間戳
→ 完整的 request body 和 response body

（截圖 05-raw-calls：8 個 API call 的清單，可以展開看完整 request/response）

這邊有個有趣的發現：一次對話裡，第一個 API call 用的是 claude-haiku，後續才是 claude-opus。看起來像是自動選 model？但仔細看 raw call 就知道不是。

那個 haiku call 的 request：max_tokens 設成 1，messages 只傳了一個字 "quota"。回來的 response body 也只有一個 "#" 字，stop_reason 是 max_tokens。Claude Code 根本不在意這個回答。

它真正要的是 response headers 裡的 rate limit 資訊：

→ anthropic-ratelimit-unified-5h-utilization: 0.06（5 小時內已用 6% 額度）
→ anthropic-ratelimit-unified-7d-utilization: 0.25（7 天內已用 25% 額度）
→ anthropic-ratelimit-unified-overage-status: rejected（沒有超額額度）
→ anthropic-ratelimit-unified-overage-disabled-reason: out_of_credits

所以這是一個用最便宜的方式（haiku、1 token）發的 quota 探測——確認 API key 有效、查詢剩餘額度和限制重置時間，然後才開始用 opus 進行正式對話。

我之前一直都是用 https://github.com/hamed-elfayome/Claude-Usage-Tracker 來查看 quota，他其實是要從網頁導出 cookies 來運作，多少還是怕被 ban，所以一旦知道這個方式，我其實自己用這個機制查看就更安全。

這種細節，不看 raw call 你永遠不會知道。

3. json debug——JSON 除錯

最底層的檢視，直接顯示 response 的 JSON 結構，包含：

→ token usage 明細：input_tokens、output_tokens
→ cache 統計：cache_creation_input_tokens、cache_read_input_tokens
→ ephemeral cache：ephemeral_5m_input_tokens、ephemeral_1h_input_tokens
→ stop_reason（為什麼停止：end_turn、max_tokens 等）
→ service_tier、inference_geo 等 metadata

（截圖 06-token-usage：response JSON 結構，顯示完整的 token 使用細節和 cache 資訊）

這對理解 context 管理特別重要。你可以看到每次 API call 實際用了多少 input token、有多少是 cache hit（省錢的部分）、output 產出多少 token。

跟 context 管理的關係

為什麼說這是"管控 context 的小工具"？因為：

1. 你終於能量化 context 成本——之前聊的 skill body 74 行佔多少 context？用 claude-trace 看 input_tokens 的差異就知道了
2. 你能看到 system prompt 有多肥——所有 CLAUDE.md、MCP server instructions、tool definitions 全部展開在眼前
3. 你能追蹤 cache 效率——cache_read_input_tokens 越高代表 cache hit 越多，成本越低
4. 你能發現隱藏行為——像是啟動時用 haiku 發 quota 探測，這種不看 raw call 根本不會知道的機制

知道了這些資訊你才知道從什麼地方下手優化。

Day 65 聊 subagent context、Day 68 聊 skill context: fork，都是在"概念上"理解 context 的問題。claude-trace 讓你從"概念"進入"實測"——看到實際數字，才能做出正確的優化決策。

TL;DR

- claude-trace 是一個攔截 Claude Code API 呼叫的開源工具
- 核心原理：注入 fetch() interceptor，記錄所有 /v1/messages 的 request/response
- 三個檢視模式：conversations（對話流）、raw calls（原始 API）、json debug（token 明細）
- 讓你能"看見"Claude Code 的 system prompt、tool definitions、token usage、cache 統計
- 搭配前幾天聊的 context 管理概念，從定性分析升級到定量分析

參考：
https://github.com/loki-zhou/claude-trace
