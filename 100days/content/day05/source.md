Day 5：邁向自動化一人公司——Claude Code Agent 初探
我一直有個幻想：用 AI 打造一家全自動化的公司。就像當初爆紅的 ChatDev 專案，讓 AI 扮演公司內的不同職能，透過彼此對話與修正，自動完成產品開發與市場推廣。隨著 LLM 模型日益成熟，現在似乎是將這個想法落地的最佳時機。畢竟想做的 Side Project 越積越多，如果不建立一套自動化流程來解放時間，永遠也消化不完。我的目標是在這 100 天挑戰結束時，能夠將這套流程建立起來。
為什麼選擇 Claude Code？ 評估了一圈 AI 開發工具——Cursor、Windsurf、Antigravity、Claude Code——我發現只有 Claude Code 的體驗真正跳脫了傳統 IDE 的架構。要實現「自動化一人公司」，首要任務就是擺脫對人類操作的依賴，因此 Claude Code 成為了我的研究重心，練好它的基本功至關重要。
Agent vs. SubAgent 今天的重點是 Agent。雖然在 Claude Code 的介面指令是 /agent，但建議搜尋時使用關鍵字 SubAgent，更能精準定位到此功能（因為早期圍繞 LLM 打造的工具都泛稱為 Agent）。
推薦參考這篇文章：17 Claude Code SubAgents Examples，裡面分享了許多實用的 SubAgents。
實戰應用：Git-Committer 
連結：https://github.com/.../agents/blob/master/git-committer.md
我自己最常用的是 git-committer。 資深工程師都知道，「命名」佔據了開發過程極高的時間成本。為了方便日後 Debug 與搜尋，Commit Message 必須遵守既定的格式與原則，且 Commit 內容應保持「原子化（Atomic）」。
Git-Committer 解決了兩個痛點：
1. 判斷哪些檔案應該被放在同一個 Commit 中（解耦）。
2. 自動撰寫符合規範的 Commit Message。
以前我擔心 AI 上下文不足，還需要手動複製 Prompt；現在當檔案混雜時，我只需直接呼叫 git-committer，它就能自動幫我拆分並完成提交，大幅簡化了工作流。
核心概念：SubAgent 是角色，Skills 是能力
SubAgents（角色）：心中有一套既定流程，負責調用能力來完成任務。建立 SubAgent 時需決定它具備哪些技能。基於資安考量（最小權限原則），如果只是 Code Review 的角色，就不該賦予它「改寫」程式碼的能力，只能給予「讀取」權限。
Skills（能力）：用來擴充 Agent 功能的工具。
使用上的關鍵差異：
SubAgent：需要特別呼叫才會觸發。
Skills：只要語意相近，就有機會被自動調用。