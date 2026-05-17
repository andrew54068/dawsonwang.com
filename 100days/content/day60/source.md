Day 60 Claude Code 的記憶管理術

最近看到有人分享 Anthropic 黑客松冠軍 @affaanmustafa 的 Claude Code 配置，他也寫了篇長文 "The Longform Guide to Everything Claude Code"，所以接下來幾天來分享一些從中整理出來的內容，加上我自己的理解。

一開始其實我覺得這是個奇怪的連結，畢竟各種分享文直接把 "冠軍" 跟 "配置" 連結在一起，常打黑客松的人就會知道，配置不見得跟冠軍有直接關係。而且他的 GitHub repo 好像也看不出什麼貓膩，不過他的確發佈了長文，分享了他的思路，那就值得一探究竟。

https://x.com/affaanmustafa/status/2014040193557471352

用 Claude Code 寫程式，你有沒有遇過這種情況：昨天明明跟 Claude 討論了半天，今天開新 session 又得從頭解釋一遍？或是寫到一半 context window 爆了，壓縮之後 Claude 突然忘記前面講過什麼？

今天來聊聊怎麼管理 Claude Code 的 "記憶"，讓它不只是單次對話的工具，而是能跨 session 延續工作進度的開發夥伴。

Session 記憶：用檔案延續工作進度

最基本的做法是：讓 Claude 在每次 session 結束前，把目前的工作進度寫進一個 .tmp 檔案，存在 .claude 資料夾裡。下次開新 session 的時候，把這個檔案路徑丟給它，它就能接著做。

關鍵是每次 session 建一個新檔案，不要一直疊加到同一個檔案裡，這樣舊的 context 不會污染新的工作。這些檔案裡面應該記錄：哪些做法確認可行（附上證據）、哪些做法試過不行、哪些還沒嘗試、以及還剩什麼要做。

久了之後你會累積一整個資料夾的 session 記錄，定期備份或清理不需要的就好。

策略性清理 Context

很多人開著 auto compact 讓系統自動壓縮 context，但問題是自動壓縮往往在最不恰當的時候觸發——可能你正在做到一半，壓縮完就把關鍵資訊吃掉了。

比較好的做法是關掉 auto compact，改成手動在邏輯上的斷點壓縮。比如說你剛完成探索階段要進入實作，這時候壓縮一次，把前面的探索紀錄清掉；或是完成一個里程碑要開始下一個，這時候壓縮最安全。

你甚至可以寫一個 skill 掛在 PreToolUse hook 上，讓它在你累積了一定數量的 tool call 之後提醒你："嘿，要不要考慮壓縮一下？"

動態注入 System Prompt

除了把規則寫在 CLAUDE.md 或 .claude/rules/ 裡面，還有一個進階技巧：用 CLI flag 動態注入 context。

claude --system-prompt "$(cat memory.md)"

這跟用 @file 引用檔案有什麼差別？差在指令的優先層級。System prompt 的權重高於 user message，user message 又高於 tool result。大部分情況下這個差異可以忽略，但如果你有一些絕對不能被忽略的行為規則或專案限制，用 system prompt 注入能確保 Claude 優先遵守。

實際的用法是設定不同場景的 alias：

alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'

這樣你可以根據當下要做的事情，切換不同的 context 組合，不用每次都載入所有東西。

不過老實說，對大多數人來說 .claude/rules/ 就已經夠用了，CLI alias 算是比較進階的最佳化，多出來的管理成本不一定划算。

記憶持久化 Hooks

Claude Code 有幾個跟 session 生命週期相關的 hook，善用它們可以實現跨 session 的自動記憶：

- PreCompact Hook：在 context 壓縮之前，先把重要狀態存到檔案裡
- Stop Hook（session 結束）：把這次 session 學到的東西寫入 ~/.claude/sessions/
- SessionStart Hook：新 session 開始時，自動載入上次的 context

把這三個串起來，就能實現完全自動化的跨 session 記憶，不需要手動複製貼上任何東西。

持續學習：讓 Claude 記住教訓

最後一個我覺得最有價值的概念：讓 Claude 自動從錯誤中學習。

如果你曾經在不同 session 裡反覆糾正 Claude 同一個問題，你一定知道那有多浪費時間和 token。解法是：在 session 結束時讓一個 Stop hook 去分析整個對話，把值得記住的模式（debug 技巧、踩過的坑、專案特有的慣例）提取出來，存成 skill 檔案。下次遇到類似問題，skill 會自動載入。

你也可以不等 session 結束，在解決了一個不好處理的問題之後，直接叫 Claude 把這個經驗提取出來存起來。

這整套思路的核心其實就一句話：不要把知識只放在對話裡，要把它沉澱到檔案系統中。對話會過期、會被壓縮、會遺失，但檔案會留下來。

GitHub 範例：https://github.com/affaan-m/everything-claude-code

我個人目前也是用 Stop Hook 來請我的 obsidian-secretary 來幫我看看哪些東西值得記錄，並且在 Obsidian 用 dataview 來管理這些筆記，每個筆記都需要我確認內容才會從 overview 的等待清單中消失，這是一個長期管理知識的方法，未來只要在完善 RAG 的機制就能變成我的第二大腦。