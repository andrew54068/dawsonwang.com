Day 70 Compaction 不是問題，是你沒在用 Sub-Agent

你是不是也常遇到 Claude Code 跳出 compaction？然後你按下去，繼續工作，過一陣子又跳出來？

大部分人的反應是：context window 不夠大、對話太長了、該 /compact 或 /clear 了。但如果你常常走到這一步，問題可能不在 context 太長，而是你把太多不該在主對話裡的東西，全部塞在同一個 context window 裡跑。

Compaction 是症狀，不是問題本身。真正的問題是：你沒有分流。

【心智模型：你是主管，Sub-Agent 是你的助理】

把你自己想成一個主管，context window 就是你桌上的空間。你不會把所有報告、所有原始資料、所有會議紀錄全堆在桌上——那桌面一定炸開。你會把調查工作交給助理，讓他去跑腿、查資料，最後只帶一頁摘要回來放你桌上。

但在 Claude Code 裡，很多人就是自己全部做——所有的 tool call 結果、MCP 輸出、探索過程、debug 紀錄，全部堆在同一個對話裡。每多一輪對話，context 就肥一點，直到系統幫你強制壓縮。

Day 60 聊過，auto compact 就像系統自動幫你清桌面——它不懂你的意圖，可能你正做到一半，壓縮完就把關鍵資訊吃掉了。所以比較好的做法是關掉 auto compact，改成在邏輯斷點手動壓縮。

但這還是在治標。你只是把壓縮的時機從系統決定改成自己決定，context 還是在膨脹。

真正的治本是：一開始就不要讓那些東西進到主 context。

【Sub-Agent 就是你的助理——重活交出去，結論帶回來】

Day 55 講過一個很具體的例子：透過 MCP 呼叫外部工具，每一次 tool call 的完整輸出都會直接灌進主對話的 context window。一個十步的 coding task——讀檔、改檔、跑測試、報錯、retry——全部堆在你的 context 裡。跑完之後，後面每一個 turn 都要重送這些中間過程。

但如果你用 sub-agent（Task tool）來做同樣的事，中間過程全部留在 sub-agent 自己的 context window 裡，跑完只回傳精簡的摘要。同樣一個十步任務，直接做可能吃掉幾萬 tokens，sub-agent 回來可能只有幾百 tokens。

這就像你交代助理去處理一個任務：他花了兩小時調查、跑了十幾個流程，但回來只跟你報告三句結論。你的桌面（主 context）完全沒被那些中間過程污染。

【什麼時候該開 Sub-Agent？】

判斷原則其實很簡單："這個中間過程，我後續還需要嗎？"

不需要？那就分流。

幾個我自己用下來的場景：

1. 查表型任務——查完就走

Day 68 聊的 skill context: fork 就是這個邏輯。我有一個 browser-mcp-selector skill，功能是根據任務推薦最適合的 Browser MCP。整個決策樹有 74 行，加上比較表 78 行，但最後的推薦結果只有 10 行。

用 inline 模式，那 74+ 行會永遠留在主 context 裡。用 context: fork，skill 在獨立的 sub-agent 裡執行，主對話只收到 10 行結論。省下來的空間去做真正的開發工作。

判斷關鍵不是 skill 多輕多重，而是推理過程要不要留在主 context——不需要就 fork。

2. 重度 MCP 操作——包在 Sub-Agent 裡

Day 27 做 Threads 自動發文的時候用了 Chrome DevTools MCP，需要攔截網路請求、分析 API 格式。這類操作每一次 tool call 都會回傳大量的 HTML、JSON、Network log，全部灌進主 context 的話很快就爆。

做法是把 MCP 操作包在 foreground sub-agent 裡，讓它去跟瀏覽器互動、分析完之後，只把"這個 API endpoint 要用 POST，參數是 XYZ"這樣的結論帶回來。

3. 分階段工作——每個階段一個 Agent

Day 65 聊的 sequential phases 模式：

Phase 1: RESEARCH（Explore agent）→ 產出 research-summary.md
Phase 2: PLAN（planner agent）→ 讀 summary，產出 plan.md
Phase 3: IMPLEMENT（tdd-guide agent）→ 讀 plan，先寫測試再寫 code

每個 agent 吃一個輸入、吐一個輸出，中間產物存成檔案。Agent 之間用 /clear 切換，context 永遠是乾淨的。這樣即使整個任務很複雜，每個 agent 面對的 context 都是精簡的。

【Compaction 是 Feedback】

回到最初的問題：如果你常常遇到 compaction，不要只是被動接受。把它當成一個 feedback——系統在告訴你，你的工作流需要重新分配。

問自己：
- 剛剛那些 tool call 的輸出，我後續真的會用到嗎？
- 這個探索過程的細節，我需要留在 context 裡嗎？
- 這個任務能不能拆成幾個階段，每個階段用獨立的 agent？

如果答案是"不需要"，那就分流。讓 sub-agent 去處理，把結論帶回來就好。

Context window 是寶貴的資源，不是垃圾桶。你塞越多進去，Claude 的注意力就越分散，回答品質也越低。保持主 context 精簡，不只是為了避免 compaction，更是為了讓 Claude 在整個工作過程中都維持高品質的輸出。

TL;DR

- Compaction 是症狀，代表你把太多東西塞在同一個 context 裡
- 把自己想成主管，context window 是你的桌面，sub-agent 是助理——重活交出去，結論帶回來
- 判斷原則："中間過程我還需要嗎？"不需要就用 sub-agent 分流
- 查表型 skill 用 context: fork（Day 68）、重度 MCP 操作包在 sub-agent 裡（Day 55）、複雜任務用 sequential phases（Day 65）
- Compaction 是 feedback，提醒你重新思考工作流的分配，而不是按下去繼續

相關：
Day 55 上下文污染
Day 60 記憶管理術
Day 65 Agent 與 Sub-Agent 協作
Day 68 Skill 的 context: fork
Day 69 claude-trace 管控 context
