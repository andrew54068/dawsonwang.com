Day 65 Agent 與 Sub-Agent 的協作眉角

這是 @affaanmustafa 長文系列的最後一篇。延續昨天的平行化，今天來聊更細緻的協作模式：怎麼讓 orchestrator 和 subagent 之間的溝通更有效率，以及不同層級的 agent 抽象該怎麼選。

Subagent 的 Context 問題

Subagent 最大的價值是省 context——它回傳的是摘要而不是完整內容。但這也是它最大的問題：subagent 只知道你問了什麼，不知道你為什麼問。

@PerceptualPeak 用了一個很好的比喻："你老闆派你去開會，要你回來做摘要。十次有九次，他會有 follow-up questions，因為你的摘要不會包含所有他需要的東西——因為你沒有他的 implicit context。"

這就是 orchestrator 和 subagent 之間的根本矛盾：orchestrator 有語義上的 context（為什麼要做這件事、整體的目標是什麼），但 subagent 只有字面上的 query。

解法：Iterative Retrieval

不要期望 subagent 一次就給你完美的回覆。改成用迭代的方式：

1. Orchestrator 帶著 query + 目標 context 派任務給 subagent
2. Subagent 回傳摘要
3. Orchestrator 評估：夠不夠？
4. 不夠的話，提出 follow-up questions
5. Subagent 回去找答案，再回傳
6. 重複最多 3 輪，避免無限循環

關鍵是：派任務的時候不要只丟 query，要同時給 objective。告訴 subagent "我要做什麼"，它才知道摘要裡該優先保留什麼。

Sequential Phases 模式

比較複雜的任務適合用分階段的方式處理，每個階段用最適合的 agent：

Phase 1: RESEARCH（Explore agent）→ 產出 research-summary.md
Phase 2: PLAN（planner agent）→ 讀 summary，產出 plan.md
Phase 3: IMPLEMENT（tdd-guide agent）→ 讀 plan，先寫測試再寫 code
Phase 4: REVIEW（code-reviewer agent）→ 產出 review-comments.md
Phase 5: VERIFY（build-error-resolver）→ 跑測試、修問題

規則很簡單：

- 每個 agent 吃一個輸入、吐一個輸出
- 輸出變成下一個 phase 的輸入
- 中間的產物都存成檔案，不要只放在記憶裡
- Agent 之間用 /clear 切換，保持 context 乾淨
- 不要跳過任何 phase——每個都有它的價值

這個模式的好處是：每個 agent 只需要處理一個明確的範圍，不會因為 context 太雜而分心。而且因為中間產物都存成檔案，即使 session 斷了也能從上次的 phase 繼續。

Agent 抽象分級

@menhguin 整理了一個很實用的 tierlist，幫你判斷什麼時候該用什麼層級的 agent 抽象：

Tier 1：直接加分（容易用）

- Subagents：防止 context rot，比 multi-agent 簡單很多但有一半的效果
- Metaprompting：花 3 分鐘寫好 prompt，處理 20 分鐘的任務。直接提升穩定性，還能幫你 sanity-check 假設
- 在開頭多問使用者問題：一般來說是加分，雖然你要在 plan mode 裡回答問題

Tier 2：技術門檻高（不好用好）

- Long-running agents：需要理解 15 分鐘 vs 1.5 小時 vs 4 小時任務的差異和取捨，trial-and-error 的成本很高
- Parallel multi-agent：變異性很高，只有在高度複雜或切割得很好的任務上才有用。"如果 2 個任務各花 10 分鐘，你卻花了一堆時間在寫 prompt 或合併變更，那就是反效果"
- Role-based multi-agent：模型進化太快，hard-coded 的角色分工很難長期維護
- Computer use agents：還太早期，需要大量調教。"你在讓模型做一年前它根本不該做的事"

結論：從 Tier 1 開始。Tier 2 等你真的有需要、而且已經掌握 Tier 1 之後再說。

補充：用 CLI + Skills 取代 MCP

這點原文放在 Tips and Tricks，但跟 agent 協作也有關——因為 MCP 會吃 context window，直接影響 agent 的可用空間。

很多 MCP（GitHub、Supabase、Vercel、Railway…）本質上就是包裝既有的 CLI。方便是方便，但代價是佔 context window。

解法是把 MCP 提供的功能拆成 skills 和 commands。例如：不要一直掛著 GitHub MCP，改成寫一個 /gh-pr command 包住 gh pr create。不要讓 Supabase MCP 佔 context，改成用 Supabase CLI 寫成 skill。功能一樣、方便程度差不多，但 context window 空出來做正事。

後來 Boris 和 Claude Code 團隊加了 MCP lazy loading，context window 的問題大部分解了——MCP 不會一開 session 就全部載入了。但 token 用量和成本還是沒完全解決。CLI + skills 的做法仍然是有效的省 token 方法，尤其是重量級的 MCP 操作（資料庫查詢、部署），用 CLI 在背景跑比在 context 裡跑省很多 token。

TLDR

- Subagent 的核心問題是缺少 implicit context，解法是 iterative retrieval（最多 3 輪）+ 同時傳 query 和 objective
- 複雜任務用 sequential phases：每個 agent 一個輸入一個輸出，中間產物存檔案
- Agent 抽象從 Tier 1 開始（subagents、metaprompting），Tier 2（parallel multi-agent、long-running agents）等真的有需求再用
- MCP 佔 context window 又花 token，用 CLI + skills 包裝同樣功能可以省空間省成本

系列回顧

這六天（Day 60-65）的內容都整理自 @affaanmustafa 的長文 "The Longform Guide to Everything Claude Code"，加上我自己的使用經驗：

- Day 60：記憶管理——session 記憶、策略性壓縮、動態 system prompt、記憶持久化 hooks
- Day 61：持續學習——Stop hook 自動提取 skill、v1 vs v2 instinct 機制
- Day 62：省 Token——模型分配、工具最佳化、模組化 codebase、Skills 取代 CLAUDE.md
- Day 63：驗證與 Eval——checkpoint vs continuous eval、grader 類型、pass@k vs pass^k
- Day 64：平行化——多實例分工、git worktree、新專案雙實例開局、可重用模式的長期價值
- Day 65：Agent 協作——subagent context 問題、iterative retrieval、sequential phases、agent 抽象分級、MCP → CLI + Skills

核心觀念始終是同一個：把經驗從對話沉澱到檔案系統，把重複的工作變成可重用的模式。對話會消失，但 skill、hook、agent 定義會留下來，而且會隨著模型升級越來越強。

原文連結：https://x.com/affaanmustafa/status/2014040193557471352
GitHub：https://github.com/affaan-m/everything-claude-code
