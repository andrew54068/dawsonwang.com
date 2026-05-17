Day 61 讓 Claude Code 自己學會不犯同樣的錯

延續昨天的記憶管理，今天來聊一個我覺得更實用的主題：怎麼讓 Claude Code 從過去的 session 中學習，不再重複犯同樣的錯誤。

你有沒有這種經驗：在某個 session 裡花了好幾輪才讓 Claude 理解 "這個專案不要用 npm，要用 yarn"，結果隔天開新 session，它又跑去用 npm。你再糾正一次，它又乖乖改回來。然後後天又忘了。

浪費 token、浪費 context、浪費時間，還浪費你的耐心。

問題的根源

Claude Code 每次開新 session 都是一張白紙（除了 CLAUDE.md 和 rules 裡面寫的東西）。你在對話中糾正它的那些經驗，全部留在上一個 session 裡，壓縮掉就沒了。

最直覺的解法當然是手動把這些教訓寫進 CLAUDE.md 或 .claude/rules/，但問題是你不可能記得每一條，而且很多教訓是在解決問題的過程中才冒出來的，當下你專注在解問題，根本不會想到要去更新規則檔。

自動化的解法：Stop Hook + Skill 提取

@affaanmustafa 在他的長文裡提出了一個很優雅的做法：用 Stop hook 在每次 session 結束時自動分析整段對話，把值得記住的模式提取出來，存成 skill 檔案。

流程是這樣的：

1. 你正常使用 Claude Code，該糾正的糾正，該解決的解決
2. Session 結束時，Stop hook 觸發一個分析腳本
3. 腳本會回顧整段對話，找出值得提取的模式：錯誤的解法、debug 技巧、專案特有的慣例、有效的 workaround
4. 把這些模式存成 skill 檔案，放在 ~/.claude/skills/learned/ 底下
5. 下次遇到類似情境，skill 會自動載入

為什麼是 Stop hook 而不是 UserPromptSubmit？因為 UserPromptSubmit 會在你每一次送出訊息時觸發，那代表每一個 prompt 都要多跑一次分析，增加延遲又浪費資源。Stop hook 只在 session 結束時跑一次，輕量、不影響工作流程，而且能看到整個 session 的全貌，提取出來的模式也更完整。

不想等到 session 結束？

有時候你剛解決了一個很難的問題，想要馬上把經驗記下來，不想冒險等到 session 結束才提取。這種情況可以用一個 /learn 指令，當場觸發提取流程：它會幫你整理剛才的經驗，產生一個 skill 草稿，確認內容後才存檔。

其他人的做法

除了 @affaanmustafa 的方案，還有兩個有趣的方向：

@RLanceMartin 的做法是在每次 session 結束後，讓一個 reflection agent 去回顧整段對話，提取出 "什麼做法有效、什麼失敗了、你做了哪些糾正"，然後更新一個 memory 檔案，下次 session 自動載入。像是在幫 Claude 寫日記。

@alexhillman 的做法更激進：每隔 15 分鐘主動檢查最近的互動，提出記憶更新的建議讓你決定要不要採納。時間久了它會從你的核准模式中學習，提議的內容也會越來越精準。

v1 vs v2：從 Skill 到 Instinct

everything-claude-code 的 repo 裡其實有兩個版本：continuous-learning（v1）和 continuous-learning-v2。

v1 就是上面講的做法：Session 結束時用 Stop hook 提取完整的 skill。簡單直接，馬上能用。

v2 的思路完全不同，它受到 Homunculus 專案的啟發，把學習的最小單位從 "skill" 縮小到 "instinct"——一個原子級的行為模式，帶有信心分數（0.3 到 0.9）和領域標籤（code-style、testing、git、debugging、workflow）。

v1 的觀察靠 Stop hook，一個 session 只看一次。v2 改用 PreToolUse/PostToolUse hook，每次 Claude 使用工具時都在觀察，觸發率 100%。觀察到的模式會先變成 instinct，累積到一定程度後再聚合成完整的 skill、command 或 agent。

v2 還加了專案隔離：透過 git remote URL 的 hash 來辨識不同專案，React 專案學到的 pattern 不會跑進 Python 專案裡。如果某個 instinct 在多個專案都出現，才會被提升為全域規則。

v2 的實作拆成幾個部分：observe.sh hook 負責攔截每次 tool 使用事件，寫入觀察日誌；detect-project.sh 透過 git remote URL 的 SHA256 hash 來辨識專案；一個 observer agent 在背景分析觀察紀錄並產生 instinct；以及一個 instinct-cli.py 提供完整的管理介面——查看狀態、匯入匯出、觸發演化（把相關的 instinct 聚合成 skill）、把專案級的 instinct 提升為全域規則。

不過 config.json 裡 observer 預設是 disabled，要手動開啟才會生效。如果你想要比較保守地開始，v1 的 Stop hook 做法更簡單直接；如果你想要更細緻的學習機制，v2 值得研究看看。

TLDR

- Claude Code 每次開新 session 都會忘記上次的教訓，手動更新規則檔又不現實，/learn 指令可以馬上提取經驗
- learn v1 做法：用 Stop hook 在 session 結束時自動提取值得記住的模式，存成 skill 檔案
- learn v2 做法：用 PreToolUse/PostToolUse hook 即時觀察，累積原子級的 "instinct"，帶信心分數和專案隔離，最終聚合成 skill
- 核心觀念：把知識從對話沉澱到檔案系統，對話會消失，檔案不會

原文連結：https://x.com/affaanmustafa/status/2014040193557471352
GitHub：https://github.com/affaan-m/everything-claude-code
