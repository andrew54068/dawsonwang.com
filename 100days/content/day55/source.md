Day 55 Claude Code 的上下文污染

今天來聊一個用 Claude Code 做複雜任務時很容易踩到的坑：上下文污染（Context Pollution）。

問題：MCP 工具呼叫會吃光你的 context

當你透過 MCP 呼叫外部工具，每一次 tool call 的完整輸出都會直接灌進主對話的 context window。一個十步的 coding task，讀檔、改檔、跑測試、報錯、retry，全部堆在你的 context 裡。跑完之後，後面每一個 turn 都要重送這些中間過程的內容。Claude Code 在單次 MCP 輸出超過一萬 tokens 時會警告，預設上限是兩萬五。但警告歸警告，tokens 已經花掉了。

解法：用 Sub-agent 隔離中間過程

Claude Code 的 Task tool 可以產生獨立的 sub-agent，它有自己的 context window。中間過程全部留在 sub-agent 裡面，跑完只回傳精簡的摘要給你。同樣一個十步任務，MCP 可能吃掉幾萬 tokens，sub-agent 回來可能只有幾百 tokens。

實際做法是把 MCP 呼叫包在 foreground sub-agent 裡面：

你 → Task tool → sub-agent → MCP 呼叫 → 摘要回到你的 context

一個常見誤解：Skill 不等於 Sub-agent

有人會說"用 coding-agent skill 就能避免 上下文污染"，這其實混淆了兩個概念。Skill 只是一個 prompt 模板，載入後跑在你的主 context 裡面，本身沒有任何隔離效果。Sub-agent（Task tool）才是真正提供隔離的機制。Skill 可以指示 Claude 去開 sub-agent，但這是 skill 作者的設計選擇，不是 skill 的內建能力。

Foreground vs Background Sub-agent

Sub-agent 有前景跟背景兩種模式，關鍵差異：

- 前景：會等它跑完才繼續，但可以用 MCP 工具
- 背景：可以一邊跑一邊做別的事，但不能用 MCP 工具

所以"用 sub-agent 包 MCP 呼叫"這招只能用前景模式。不過前景也能平行——同一個訊息裡開多個前景 sub-agent，它們會同時跑。

其他緩解手段

- /compact：手動壓縮 context，但是事後補救，而且有資訊損失
- /clear：最後手段，整個 context 重來
- MAX_MCP_OUTPUT_TOKENS：限制 MCP 輸出大小，但這是截斷不是摘要
