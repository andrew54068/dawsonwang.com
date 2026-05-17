Day 62 Claude Code 省 Token 的實戰技巧

延續前兩天的記憶管理和持續學習，今天來聊一個大家很關心的主題：怎麼省 token。

不管你是 API power user 還是 Pro/Max 訂閱使用者，token 用量都直接影響成本或使用限額。原文作者 @affaanmustafa 也特別提到，這是他收到最多問題的主題之一。

核心策略：Subagent 的模型分配

省 token 最有效的方式，不是少用，而是用對模型。

Claude Code 的 subagent 可以在 agent 定義裡指定要用哪個模型。關鍵是：不是每個任務都需要 Opus。大部分的程式碼任務用 Sonnet 就夠了，簡單重複的任務用 Haiku 就能搞定。

實際的選擇邏輯：

- 預設用 Sonnet：90% 的程式碼任務都用 Sonnet 處理
- 升級到 Opus：第一次嘗試失敗、跨 5 個以上檔案、架構決策、安全性相關的程式碼
- 降級到 Haiku：重複性高的任務、指令很明確的工作、multi-agent 裡的 worker 角色

在 agent 定義裡指定模型很簡單：

---
name: quick-search
description: Fast file search
tools: Glob, Grep
model: haiku
---

目前各模型的價格（以最新的 4.6/4.5 世代為例）：

- Opus：Input $5/M tokens、Output $25/M tokens
- Sonnet：Input $3/M tokens、Output $15/M tokens
- Haiku：Input $1/M tokens、Output $5/M tokens

有趣的是，Sonnet 的定位有點尷尬。比 Opus 便宜約 40%，但絕對金額來說差異不大。真正有感的是 Haiku vs Opus，不管 input 還是 output 都差了 5 倍。所以如果你要省錢，最合理的組合是 Haiku + Opus，而不是 Sonnet + Opus。

想更精確地知道哪些任務該用哪個模型？可以設計一個 benchmark：

1. 準備一個有明確目標和任務的 repo
2. 用 git worktree 開多個分支，每個分支的 subagent 統一用同一個模型
3. 跑完一輪任務後，用統一的 unit test、integration test、E2E test 來評分
4. 比較各模型在不同任務類型上的表現

這個方法比較花時間，但如果你的用量很大，花一次時間做 benchmark 可以省下長期的開銷。

工具層面的最佳化

除了選對模型，還可以從工具下手。

mgrep 取代 grep：Claude 預設用 ripgrep 搜尋程式碼，但 mgrep（mixedbread-ai 出的）在各種任務上平均可以減少一半的 token 用量。這是因為它的搜尋結果更精準，回傳的雜訊更少。

背景程序用 tmux 跑：如果你有長時間執行的命令（build、test suite、server log），不要讓 Claude 直接跑然後串流所有輸出。改用 tmux 在背景跑，完成後只擷取你需要的部分餵給 Claude。Input token 是成本的大頭（Opus input $5/M vs output $25/M），減少不必要的輸入最有效。

模組化程式碼的隱藏好處

這點可能不是第一時間會想到的，但程式碼的結構直接影響 token 成本。

如果你的主要檔案動輒上千行，Claude 每次讀取都要花大量 tool call 才能讀完，中間還可能遺失資訊。相反地，如果你的 codebase 是模組化的——主要檔案在幾百行以內、utility 和 hooks 都獨立拆開——Claude 讀取更快、理解更準確，自然也更省 token。

另一個角度：精簡的 codebase 本身就更省錢。用 skill 定期清理 dead code、用 refactor 消除重複邏輯，這些維護工作不只是程式碼品質的問題，也是 token 經濟學。

進階：System Prompt 瘦身

如果你真的很在意每一個 token，有一個有趣的數字：Claude Code 的系統 prompt 大約佔 18,000 tokens，差不多是 200k context window 的 9%。透過 patch 可以縮減到約 10,000 tokens，省下 7,300 tokens（41% 的固定開銷）。

https://agenticcoding.substack.com/i/180970862/tip-14-slim-down-the-system-prompt

不過原文作者自己也說他沒在用這個，而且 Anthropic 隨時可能更新系統 prompt 導致 patch 失效，所以這比較像是一個 "知道就好" 的選項。

其實比起 patch system prompt，我覺得更值得關注的趨勢是：大家玩 Skills 玩得越來越熟練之後，根本不太需要把太多東西往 CLAUDE.md 裡塞了。

以前的做法是團隊共享一個 CLAUDE.md，把所有規則、偏好、專案 context 全部塞在裡面。但現在比較好的做法是團隊一起維護 Skills——每個 skill 是一個獨立的知識單元，需要的時候才載入，不需要的時候不佔 token。

我自己目前 personal CLAUDE.md 是空的，也很少需要 project-based 的 CLAUDE.md，可能是因為最近都用 BDD 的方式在開發，如果真的有需要交代 context 的場景，就直接叫 Claude 去讀 README.md 或相關文件就好。這樣做的好處是：CLAUDE.md 裡的內容每次 session 都會載入，不管用不用得到都佔 token；但 skill 和檔案引用只在需要時才進入 context，天生就更省。


原文連結：https://x.com/affaanmustafa/status/2014040193557471352
GitHub：https://github.com/affaan-m/everything-claude-code

TLDR

- 省 token 的核心是用對模型：Haiku 做簡單任務、Opus 做複雜任務，Haiku + Opus 的組合比 Sonnet + Opus 更划算（成本差 5 倍 vs 1.67 倍）
- 工具面：mgrep 取代 grep 可省一半 token、長時間命令用 tmux 背景執行只擷取需要的輸出
- 程式碼面：模組化 + 精簡 codebase 不只是好習慣，也直接省 token
- CLAUDE.md 的內容每次載入都佔 token，現在的趨勢是把知識放進 Skills，需要時才載入

