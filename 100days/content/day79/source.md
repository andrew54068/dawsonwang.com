Day 79 — Claude Code Channels 挑戰 OpenClaw 龍蝦？

Claude Code 今天出了新功能 Channels，利用 MCP 把事件傳出來就可以達到用 Telegram 或是 Discord 來控制 Claude Code 的效果，這不就等於 OpenClaw 了嗎？

其實我覺得還是有細微的差異，如果你原本已經有在用龍蝦，那些配置也不是輕易就能接上 Claude Code 的，畢竟兩邊的架構差太多。

另外 Claude Code 的 Channels 也沒有 Heartbeat 機制，所以如果你的 Claude Code 沒有在執行任務的時候，它就不會回應你的訊息，這點跟 OpenClaw 還是有差異的。

那有什麼用途？可以建立一個 Claude Code 的 Channels，然後用它來幫你重啟龍蝦，因為一旦我們更改了 .openclaw.json 後，龍蝦就需要重啟才能生效。

【如何安裝？】

要先升級 Claude Code 到最新版本 2.1.80，然後才能使用 Channels 功能。

進入到 Claude Code 後，/plugin install telegram@claude-plugins-official

這時候我遇到一個錯誤：claude plugins install failed Plugin "telegram" not found in any marketplace

這是因為我之前已經有官方的這個 claude-plugins-official marketplace，在更新它之前是找不到 telegram 這個 plugin 的。

要去 /plugin 裡面選到 claude-plugins-official 更新到最新才會出現 telegram 這個 plugin。

這時候單純 /reload-plugins 還是不會出現相關指令，要重新啟動 Claude Code 才會出現。

實際上跟官方文件敘述的不太一樣，應該要找 /configure 來設定 Telegram 的 token，而不是 /telegram:configure

/configure <token>

在本地啟用 claude --channels plugin:telegram@claude-plugins-official

從 Telegram bot 發送訊息給 Claude Code 就會發現要先配對

回到 Claude Code 的介面，輸入顯示在 Telegram 上的指令 /telegram:access pair xxxxx

這裡流程跟當初設定龍蝦很像，感覺是直接抄過來的做法，設定完後就可以從 Telegram 上控制 Claude Code 了。

除了 Telegram 之外，Discord 也有官方的 Channel plugin，設定流程大同小異，就是建 bot、裝 plugin、配 token、配對。

另外官方還有一個 fakechat 的 demo channel，是跑在 localhost 的聊天 UI，不用連外部服務，很適合先拿來測試 channel 的運作流程。

附上官方的連結：
Channels → https://code.claude.com/docs/en/channels
Channels Reference → https://code.claude.com/docs/en/channels-reference

【那兩篇官方文件有什麼不同？】

第一篇 Channels 是使用者指南，教你怎麼安裝跟設定現有的 Telegram、Discord channel，還有安全機制跟企業版控管。

第二篇 Channels Reference 是開發者參考，教你怎麼自己寫一個 Channel。因為 Channel 的本質就是一個 MCP server，只要在 capabilities 裡宣告 claude/channel，然後透過 notifications/claude/channel 把事件推進 Claude Code 的 session 就好。

這代表什麼？你可以自己寫一個 webhook receiver，讓 CI pipeline 跑完自動推通知給 Claude Code，或是讓監控系統的警報直接進到你的 session 裡面，Claude 就會自動去處理。

Channel 分成單向跟雙向兩種。單向就是純推播，像是 CI 通知、監控警報，Claude 收到後自己去處理但不回覆。雙向就像聊天橋接，Telegram 跟 Discord 就是這種，Claude 讀完訊息後會透過 reply tool 把回覆傳回去。

安全性的部分，每個 channel 都有一個 sender allowlist，只有配對過的使用者 ID 才能推訊息進來，其他人的訊息會被靜默丟棄。這也是為什麼一開始要做 pairing 的原因，不然就變成 prompt injection 的入口了。

要注意的是目前 Channels 還在 Research Preview 階段，只有官方核准的 plugin 才能用 --channels 啟動。如果你自己寫了一個 channel，要用 --dangerously-load-development-channels 這個 flag 才能測試。

另外 Team 跟 Enterprise 方案預設是關閉 Channels 的，要管理員去 claude.ai 的 Admin settings 裡面手動開啟才能用。個人的 Pro / Max 方案則是預設可用。

