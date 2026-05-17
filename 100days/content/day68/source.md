Day 68 Skill 的 context: fork——讓查詢型技能不污染主對話

延續 Day 65 聊到的 subagent context 問題，今天用一個實際案例來探討 skill 的 context 管理：怎麼讓一個"查表推薦"型的 skill 不佔用主對話的 context window。

問題的起源

我之前做了一個 browser-mcp-selector skill，功能很單純：根據你的任務需求，從五個 Browser MCP（Chrome DevTools MCP、Playwright MCP、Chrome MCP、Browser MCP、BrowserTools MCP）中推薦最適合的。

Skill 的運作分三層：
1. Metadata（name + description）—— 一開始就會被 load 進主 context，大約 100 字
2. SKILL.md body——skill 被觸發時載入
3. Reference files——需要時才讀

問題出在第二層。當 skill 觸發時，整個 SKILL.md body 會載入主對話的 context。我的 SKILL.md 有 74 行（決策樹、五個工具簡介、任務對照表），遇到模糊案例還會去讀 comparison.md（78 行的完整比較表）。這些全部會永久留在主對話的 context window 裡。

對一個"查完就走"的推薦型 skill 來說，這很浪費。

實測 inline 模式的 context 成本

我用一個測試情境來觸發 skill："我需要在 Chrome、Firefox、Safari 上測試登入流程，還要檢查無障礙標準。"

觸發後，74 行的 SKILL.md 全部載入主對話 context。Claude 看了決策樹後很快就給出答案：跨瀏覽器用 Playwright MCP，無障礙審計用 BrowserTools MCP。整個推薦大概 10 行就講完了。

也就是說，為了得到 10 行的答案，我付出了 74 行的 context 成本，而且這 74 行會一直留到對話結束。如果後續還要繼續開發、debug、寫測試，這些無關的 skill 內容就是在白白佔空間。

解法：context: fork

Claude Code 的 skill 支援一個 frontmatter 選項：context: fork。加上這個之後，skill 不再 inline 載入，而是在一個獨立的 subagent 裡執行。

改造前（inline）：
---
name: browser-mcp-selector
description: Select the best browser MCP tool...
---
# 完整的決策樹、工具簡介、對照表（74 行）

改造後（fork）：
---
name: browser-mcp-selector
description: Select the best browser MCP tool...
context: fork
---
# Browser MCP Selector
Read references/comparison.md.
Based on the user's task: $ARGUMENTS
Return: MCP name, reason, key tools, setup notes.

差異一目了然：

SKILL.md 載入位置
→ inline：佔用主對話 context
→ fork：subagent（用完即丟）

comparison.md
→ inline：佔用主對話（如果讀了）
→ fork：subagent（如果讀了）

主對話 context 成本
→ inline：~74+ 行
→ fork：~5 行（只有回傳結果）

能看到查詢細節
→ inline：可以
→ fork：不行

$ARGUMENTS 的難題

context: fork 最大的 tradeoff 是：subagent 看不到對話歷史。所有需要的資訊都必須透過 $ARGUMENTS 傳入。

如果是使用者手動觸發（/browser-mcp-selector 我要測跨瀏覽器登入），$ARGUMENTS 就是使用者打的那段文字，沒問題。

但如果是 Claude 自動觸發呢？Claude 在主對話中判斷"這個任務需要選 browser MCP"，然後呼叫 Skill tool 並傳入 args。問題是：Claude 怎麼知道該傳什麼？

它只能看到 skill 的 description，看不到 SKILL.md body 裡面寫的"請傳入任務類型、瀏覽器需求、特殊需求"。所以你只能把提示塞進 description 裡，但 description 是永遠在 context 裡的，寫太長反而抵銷了 fork 省下的空間。

這其實就是 Day 65 提到的 implicit context 問題——orchestrator 有語義上的理解（為什麼要做這件事），但 subagent 只拿到字面上的 query。

什麼時候該用 context: fork？

經過這次實驗，我的結論是：

適合 fork 的 skill：
- "我只要答案，不要過程"——像 browser-mcp-selector 這種，我不在乎它怎麼查的，決策樹、比較表這些推理細節不需要留在主 context
- Skill body 很大（200+ 行）或需要讀大量 reference files
- 重量級處理（研究、多步驟工作流、程式碼生成）

判斷關鍵不是 skill 多輕多重，而是：那些推理過程你還需要嗎？不需要就 fork，讓 subagent 處理完把結論丟回來就好。

不適合 fork 的 skill：
- 需要對話歷史來做判斷的
- 會影響後續工作流程、需要 context 延續的

TL;DR

- Skill 觸發時，SKILL.md body 會 inline 載入主對話 context，用完也不會消失
- context: fork 讓 skill 在獨立 subagent 裡執行，主對話只收到回傳結果
- 代價是 subagent 看不到對話歷史，所有資訊必須透過 $ARGUMENTS 傳入
- 判斷關鍵不是 skill 多重，而是推理過程要不要留在主 context——不需要就 fork
- 核心問題還是 Day 65 提到的 implicit context——怎麼在精簡傳遞的同時不丟失關鍵資訊

參考：
https://code.claude.com/docs/en/skills
https://github.com/andrew54068/claude-plugins（browser-mcp-selector 原始碼）
https://my.feishu.cn/sheets/Nb1CshTENhG2bjtCy2fcbp0Cnwg（五大 Browser MCP 比較表原始資料）
