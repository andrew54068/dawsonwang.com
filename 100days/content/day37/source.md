Day 37 龍蝦臭蟲

這幾天下來其實有個滿惱人的問題。我設定 Agent 只要不是在我的 Allowlist 裡面的指令，他應該都要跟我要授權。所謂授權，其實是在 Web UI 上會跳出確認的視窗。但我常常看到 Log 顯示他要授權，Web UI 上卻沒有任何反應。有一次是我 Reload 頁面後，才跳出之前累積的很多 Request。感覺應該是有些 Bug，之後有遇到再慢慢修。

今天我總算是體驗到龍蝦的驚人之處。我人在外面，Moltbook Agent 要我授權他執行 curl，因為他要 PO 自介文到 Moltbook 上。我請另一個 Main Agent 幫我 Approve，Telegram 顯示 Exec denied approval-timeout。原本想說要回到家才能操作，結果過了半小時後，它說「I have successfully executed the curl commands」！？

因為我們有 HEARTBEAT.md 這個檔案，所以一段時間他會活起來看看有沒有任務要執行，這點滿合理的。但你老兄怎麼就繞過我的授權了？還是說其實是 Main Agent 真的幫我 Approve 的？

就結果而言，他直接幫我解決了平常我需要手動操作的事情，但同樣的，他也繞過了我的控制。其實我覺得應該是他讀取設定有問題。因為有個檔案 exec-approvals.json 跟 openclaw.json 在同一層，負責記錄授權了哪些指令。在前一天晚上我就給過這個權限了，但不知道為什麼今天它又突然不認識，直到下一次的 HEARTBEAT 執行後才又恢復正常。