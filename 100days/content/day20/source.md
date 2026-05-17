Day 20 工具升級篇-2

沒想到今天還在繼續跟 Antigravity Manager 纏鬥。後來發現昨天的設定其實根本沒作用，因為那個 PR 其實不支援 Wildcard 的 Strategy 設定，應該是要根據 Model 名稱各自設定，例如：

Strategy ID: claude-opus-4.5-fallback
Candidates: claude-opus-4-5*, gemini-3-pro-high

Strategy ID: claude-sonnet-4.5-fallback
Candidates: claude-sonnet-4-5*, gemini-3-pro-high

Strategy ID: claude-haiku-4.5-fallback
Candidates: claude-haiku-4-5*, gemini-3-flash

刪除所有預設的 Mapping，並且新增客製化 Mapping 到上面的 Strategy ID:
claude-opus-4-5* -> claude-opus-4.5-fallback
claude-sonnet-4-5* -> claude-sonnet-4.5-fallback
claude-haiku-4-5* -> claude-haiku-4.5-fallback

另外我還發現，原本 PR 的作者直接把 Claude 降級到 Gemini 比較初階的模型（可能是為了節省 Token？），而且還寫死在程式碼中無法設定！？於是我把這個邏輯改掉，多加了一個 Feature Flag，讓使用者可以選擇是否自動降級。

此外，也一直遇到 `Request contains an invalid argument` 的錯誤，查了一下似乎是新版本才有的問題。只好順手修復，否則降版回去可能又要再解一次 Conflict，沒完沒了。
https://github.com/lbjlaq/Antigravity-Manager/issues/790

還發現如果同時呼叫同一個 Thinking Model 做不同事情，也會遇到 `RESOURCE_EXHAUSTED` 或 `MODEL_CAPACITY_EXHAUSTED` 的問題，所以再加了一個 Queue 機制，限制同一時間只能有一個請求，其他請求必須排隊。

為了方便大家使用，我發布了一個新版本。為了跟原作者區分，我把顯示名稱改為 **Antigravity Tools Maximizer**。

brew tap andrew54068/antigravity-manager https://github.com/andrew54068/Antigravity-Manager

brew install --cask andrew54068/antigravity-manager/antigravity-tools

分享我的配置截圖如下：

Antigravity Manager 是用 Tauri 開發的。剛好最近看到有人在討論並拿來跟 Electron 比較，因為 Tauri 不是打包整個 Chromium，所以更輕巧；加上使用 Rust 做後端，啟動時間更短、記憶體佔用更少。看來以往 Electron 被詬病的問題都解決了，值得推薦！

Telegram Bot 目前正在研究 GraphQL 的方式，明天繼續。