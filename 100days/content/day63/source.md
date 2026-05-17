Day 63 驗證迴圈與 Eval——怎麼確保 Claude 的產出是對的

延續前面的記憶管理、持續學習、省 token，今天來聊品質保證。不管你的 workflow 設計得多好、agent 分工多精細，如果沒有驗證機制，你就是在迷霧裡開車。

為什麼需要驗證

Claude 很強，但它不是 100% 可靠的。它可能寫出看起來正確但邏輯有漏洞的 code，可能在重構時悄悄引入 regression，可能在長時間 session 裡逐漸偏離原本的目標。

這跟信不信任 Claude 沒關係，重點是你需要一個系統化的安全網。

可觀測性：先看得見才能管

在開始驗證之前，你需要先能 "看見" Claude 在做什麼。兩種做法：

1. 用 tmux 在背景追蹤 thinking stream 和輸出，每次 skill 被觸發時記錄
2. 用 PostToolUse hook 記錄每次 Claude 具體執行了什麼、改了什麼、輸出了什麼

有了這些 log，你才能事後回顧和分析。

兩種 Eval 模式

Checkpoint-Based：在工作流的每個階段設定明確的檢查點，驗證通過才能往下走。

- 在每個 checkpoint 用定義好的 criteria 驗證
- 驗證失敗的話，Claude 必須修好才能繼續
- 適合有明確里程碑的線性開發流程，比如 feature 開發

Continuous：每隔 N 分鐘或每次重大改動後自動跑完整的 test suite + lint。

- 發現 regression 就立刻停下來修
- 不需要預先定義階段
- 適合長時間的探索式重構或維護工作

怎麼選？看你的工作性質。有明確階段的任務用 checkpoint-based，沒有明確里程碑的探索性工作用 continuous。

用 strict rules 搭配驗證，Claude 就不會亂生 .md 檔案、不會產生重複的檔案、不會留下一堆 dead code。再加上持續更新的 codemap，你就有了一個在 repo 之外的 source of truth，記錄著 codebase 隨時間的演變。

Benchmark 你的 Skill

想知道某個 skill 或 workflow 到底有沒有效？用 worktree 做 A/B test：

1. 開兩個 git worktree
2. Worktree A 用 skill，Worktree B 不用
3. 跑同一個任務
4. 用 git diff 比較產出、token 用量和品質

這個方法也可以用來 benchmark 不同模型在同一個任務上的表現。

評級的類型

Anthropic 的 eval 指南把評級分成三種：

Code-Based：字串比對、測試通過與否、靜態分析、產出驗證。快、便宜、客觀，但對合理的變化比較脆弱——可能結果是對的，但格式不同就被判錯。

Model-Based：用 rubric 打分、自然語言斷言、兩兩比較。彈性好、能處理細節，但不穩定，而且比較貴。

Human：專家 review、crowdsource 判斷、抽樣檢查。品質最高，但慢又貴。

實務上通常是混合使用：先用 code-based grader 做初步篩選，有爭議的再用 model-based 或 human 判斷。

兩個衡量指標

pass@k：k 次嘗試中至少成功一次就算過。k=1 時 70% 成功率，k=3 就有 91%，k=5 有 97%。適合 "只要能 work 就好" 的場景。

pass^k：k 次嘗試全部都要成功。k=1 時 70%，k=3 剩 34%，k=5 只有 17%。適合需要一致性和確定性產出的場景。

簡單說：pass@k 測的是 "能不能做到"，pass^k 測的是 "能不能每次都做到"。

建立 Eval 的路線圖

Anthropic 的建議是：

1. 從 20-50 個簡單任務開始，來源是實際遇到的失敗案例
2. 把使用者回報的問題轉成 test case
3. 任務要寫到不含糊——兩個專家看了應該得出一樣的結論
4. 測試集要平衡——測 "應該做" 的行為，也測 "不應該做" 的行為
5. 每次 trial 都從乾淨的環境開始
6. 評的是產出，不是過程
7. 仔細閱讀每次嘗試的過程紀錄
8. 如果通過率到 100%，代表你該加更多測試了

系列回顧

原文連結：https://x.com/affaanmustafa/status/2014040193557471352
GitHub：https://github.com/affaan-m/everything-claude-code
Anthropic Eval 指南：https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

TLDR

- 驗證分 checkpoint-based（里程碑式，適合 feature 開發）和 continuous（持續式，適合探索重構）
- 用 PostToolUse hook 記錄 Claude 的每次操作，建立可觀測性
- 用 git worktree A/B test 來 benchmark skill 和 workflow 的效果
- Grader 三種：code-based（快但脆弱）、model-based（彈性但貴）、human（最準但最慢）
- pass@k 測能力上限，pass^k 測一致性，根據需求選擇
