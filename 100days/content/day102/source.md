Day 102 — Hermes Agent 原始碼拆解：skill 自我改進、多模型切換、與 Claude Agent SDK 的差異

繼 OpenClaw 之後，最近另一個讓我很感興趣的 agent 專案是 Hermes Agent。它是 Nous Research 做的開源 AI agent，我本來只是想看看別人怎麼做 tool calling 的，結果看到一個讓我很在意的設計。先講幾個讓我印象深刻的特色：


【Hermes Agent 的特色】

第一，模型不鎖死。它透過 OpenRouter 支援 200 多個模型，也直接整合 OpenAI、Anthropic、Kimi 等 API。你隨時可以用 hermes model 指令切換模型，不用改任何程式碼。而且它有 fallback 機制——如果當前模型遇到 rate limit、server error 或認證失敗，會自動切換到備用 provider（每個 session 最多觸發一次）。

第二，它的 skill 系統不只是存文件。當 agent 成功完成一個任務，它會自動建立一個 skill（存在 ~/.hermes/skills/），下次遇到類似情境時，這個 skill 會被注入到對話的 context 裡。而且 agent 可以用 skill_manage patch 自己修改既有的 skill。這就是 README 上寫的 "Skills self-improve during use"。

第三，它的對話迴路有很精細的資源管理。有 iteration budget 系統，parent agent 跟 child agent 各自有獨立的額度上限；context 接近滿的時候（預設 50% 閾值）會自動壓縮，開新 session 繼續；還有 Anthropic prompt caching 的自動啟用，省了大約 75% 的 API 成本。


【Hermes 的學習迴路】

Hermes Agent 的 README 上寫著一句話："Skills self-improve during use."

我很好奇這是怎麼做到的，於是研究了一下。

它的核心機制是這樣的：每次 agent 完成一輪比較複雜的操作（通常是 5 次以上的 tool call），它會在背景偷偷 fork 出一個迷你 agent。

這個迷你 agent 拿到的是完整的對話記錄，然後收到一個 prompt："剛才這段對話中，有沒有什麼非顯而易見的做法？有沒有走過彎路、試過錯、或是使用者其實期待不同的結果？如果有，幫我更新或建立一個 skill。"

簡單說，它在每輪複雜操作後回頭反省，把學到的東西寫成 skill，下次遇到類似情境就能直接用。


【它的限制】

但仔細看完之後，我發現它的改進是 "被動式" 的。

它只在複雜任務完成後觸發，不會主動去檢視既有的 skill 有沒有問題。如果一個 skill 寫得不好，但使用者沒有在對話中踩到那個坑，它就不會被更新。

而且背景 agent 的判斷品質取決於那次回顧的當下。它沒有 A/B 比較，不知道修改後的版本是不是真的比原本好。改完就用了。

這讓我想到一個問題：如果我們能更系統化地做這件事呢？這個我明天再展開。


【為什麼改不成 Claude Agent SDK】

我原本想：既然它已經支援 Anthropic API，那能不能直接把底層換成 Claude Agent SDK，讓它變成一個更簡潔的 Claude-native agent？

試了之後發現行不通，核心原因有三個。

第一，Hermes 的對話迴路是完全手刻的。run_agent.py 這個檔案超過 9500 行，裡面一個 while loop 就處理了多種不同的 API 格式：OpenAI 的 chat.completions、Anthropic 的 Messages API 等。每種格式的回應結構不同，tool call 的格式不同，結束條件的判斷也不同。Claude Agent SDK 是託管式的——它管理自己的對話迴路，你可以透過 hooks 監聽和介入，但沒辦法直接改寫迴路邏輯。更關鍵的是，它只支援 Claude，你沒辦法在裡面塞多種 API 模式的分支邏輯。

第二，Hermes 在每次呼叫 LLM 之前，會偷偷把 ephemeral context 注入到當前的 user message 裡。這些 context 包括外部記憶系統（Honcho）的資料、plugin 的 pre_llm_call hook、以及 skill 內容。這些東西不會被存到 session 紀錄裡，只在那次 API call 時存在。Claude Agent SDK 雖然也有 hooks 機制（例如 UserPromptSubmit 可以在 prompt 送出時注入額外 context），但 Hermes 的注入粒度更細，可以在每次 LLM call 前動態組裝完全不同的 context。

第三，工具系統的設計哲學不同。Hermes 的工具管理是完全手刻的，支援 per-tool 的可用性檢查（例如某個工具需要特定環境變數才能啟用）、async-to-sync 的橋接。Claude Agent SDK 也支援自定義工具和透過 MCP server 動態連接外部服務，但它的設計是讓你在啟動時定義好工具集，而不是在執行過程中隨意增減。

簡單說，Hermes 不是一個 "用了某個 LLM SDK 的 agent"，它是一個自己做了整套 agent runtime 的專案。要換成 Claude Agent SDK，等於要重寫 80% 的東西，那就失去用 SDK 的意義了。


Hermes Agent：https://github.com/nousresearch/hermes-agent

不管你是什麼領域，如果你在工作上有想用 AI 解決的問題，歡迎預約免費諮詢：
https://calendar.app.google/4ex59LH1wSif96NU9
