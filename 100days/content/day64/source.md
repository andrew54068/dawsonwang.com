Day 64 Claude Code 的平行化與新專案開局

延續昨天的驗證迴圈，今天來談怎麼有效地同時跑多個 Claude 實例，還有從零開始一個新專案的最佳開局方式。

平行化：不是開越多視窗越好

Claude Code 創作者 Boris Cherny（@bcherny）分享過他同時跑 5 個 Claude 實例的工作方式。這聽起來很酷，但原文作者的建議是：不要隨意開一堆終端機。每多開一個實例，都應該有明確的理由和用途。

他自己大多時候只用 2–3 個實例，最多 4 個。原則是：用最少的平行化來完成最多的事。

如果你是新手，甚至建議先不要做平行化，把單一實例的操作搞熟再說。

實際的分工模式

作者偏好的做法是：主要的 chat 負責寫程式碼，fork 出去的 session 負責查資料——查 codebase 的狀態、搜尋 GitHub 上有沒有適用的 open source、拉外部文件進來參考。這樣主 session 的 context 就能專注在實際的程式碼工作上。

如果真的需要多個實例同時改程式碼，就一定要用 git worktree。每個 worktree 有獨立的工作目錄，不會互相衝突。

git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b

cd ../project-feature-a && claude

好處是：
- 實例之間不會有 git 衝突
- 每個都有乾淨的工作目錄
- 容易比較不同做法的產出
- 可以用來 benchmark 同一個任務的不同方式

管理多個實例的小技巧：用 /rename 幫每個 chat 命名，才不會搞混哪個 worktree 在做什麼。然後用 "cascade" 模式管理——新任務開在右邊的 tab，從左到右掃過去，專注在最多 3–4 個任務，再多就會適得其反。

再來是新專案的開局模式

開始一個全新的 repo 時，作者建議用兩個 Claude 實例同時起步：

實例 1：Scaffolding Agent
- 建立專案結構
- 設定 config（CLAUDE.md、rules、agents）
- 建立 conventions
- 把骨架搭好

實例 2：Deep Research Agent
- 連接所有需要的服務、搜尋資料
- 產生詳細的 PRD（Product Requirements Document）
- 畫架構的 mermaid diagram
- 從實際文件中擷取參考片段

左邊的終端機負責寫 code，右邊負責問問題。等兩邊都完成，你就有了一個結構完整的專案骨架加上一份詳盡的需求文件。

llms.txt：餵文件的捷徑

一個實用的小技巧：很多文件網站都有 llms.txt 可以用。只要在文件網站的 URL 後面加上 /llms.txt，就能拿到為 LLM 最佳化過的版本，直接餵給 Claude 比讓它自己去爬網頁效率高很多。

不過根據我自己的經驗，大部分時候你不需要特別去處理文件引入。Claude Code 本身搜尋能力已經很強，只有當它明顯用了過時的語法或 API 時，才需要手動餵文件進去。這時候用 Context7 MCP、Firecrawl、或直接丟連結讓它爬都是可行的做法。

建立可重用的模式

@omarsar0 說過一句我很認同的話："Early on, I spent time building reusable workflows/patterns. Tedious to build, but this had a wild compounding effect as models and agent harnesses improved."

前期花時間建立的 subagents、skills、commands、planning patterns，隨著模型升級會越來越強。而且這些模式可以跨工具轉移——你為 Claude Code 建立的 workflow，很多概念可以直接搬到其他 agent 框架上。

投資在模式上，比投資在特定模型的技巧上更有長期價值。

TL;DR

- 平行化不是越多越好，2–3 個實例就夠，主 session 寫 code、fork 做 research
- 多實例改 code 一定要用 git worktree，用 /rename 和 cascade 模式管理
- 新專案用兩個實例起步：一個搭骨架、一個做研究
- 投資在可重用的模式上（skills、agents、commands），這些會隨模型升級而增值

原文連結：https://x.com/affaanmustafa/status/2014040193557471352
GitHub：https://github.com/affaan-m/everything-claude-code
