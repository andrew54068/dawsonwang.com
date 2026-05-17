Day 35 這樣設定 OpenClaw 會更安全

為什麼我們要用 OpenClaw？寫程式？需要秘書？少騙人了其實只是為了讓龍蝦去 Moltbook 交朋友湊湊熱鬧吧！
今天分享如何設定讓這隻龍蝦不會把你家房子給燒了。

那我們必須先科普一下 OpenClaw 的 Multi-Agent（多代理人）架構。一樣文末附上設定檔參考。

【為什麼需要多個 Agent？】

你可能會想：「我直接叫同一個 Agent 扮演不同角色不就好了嗎？」

在 OpenClaw 裡，Agent 不單純只是 Prompt 層面的「角色扮演」，它還牽涉到權限與環境的隔離。

舉個例，我最近想創造一個專門去逛 Moltbook（或是其他社群網站）的 Agent。這個 Agent 的任務很單純，就是去瀏覽網頁、收集資訊。既然只是去「逛街」，我就不希望它擁有改寫我系統檔案、或是執行危險指令的權限。

這時，我們就應該建立一個獨立的 Agent，給它嚴格的 Sandbox 限制。這樣萬一它在網路上遇到了 Prompt Injection（提示詞注入攻擊），攻擊者也只能困在這個受限的環境裡，不會影響到我們主要的工作 Agent，更不會危險到誤刪我的檔案。

【Agent vs Sub-agent 的差別】

你可能會混淆，這跟我們在 OpenClaw 看到的 Sub-agent 有什麼不同？
主要差別在於「完整性」 (Identity) 與「生命週期」 (Lifecycle)。

- Sub-agent (子代理)：
  - 用途：專門用來「平行處理」耗時任務（例如長時間的搜尋或運算），避免卡住主 Agent 的對話。
  - 特徵：它是「沒有靈魂」的工具人。啟動時只會載入 AGENTS.md (操作守則) 和 TOOLS.md (工具)，不會載入 SOUL.md、IDENTITY.md 或 USER.md。
  - 壽命：它是短暫的 (Ephemeral)。任務結束後，Session 會在設定的時間後（預設 60 分鐘）自動封存，不適合用來培養長期默契。

- OpenClaw Agent (獨立代理)：
  - 用途：也就是我們今天介紹的主角，適合用來擔任長期協作的夥伴（例如專職的 Coding Agent 或 Research Agent）。
  - 特徵：擁有完整的「人格」。它具備完整的 SOUL.md (性格)、IDENTITY.md (自我認知) 以及長期記憶文件。
  - 壽命：它是長存的 (Persistent)。它的記憶和對話紀錄會一直保存，能隨著時間累積對你的了解。

簡單來說：Sub-agent 是用完即丟的「執行緒 (Thread)」；而 Agent 是你正式僱用的「員工 (Employee)」。

【如何新增 Agent】

OpenClaw 提供了指令讓我們快速新增 Agent：
openclaw agents add <agent_name>

也就是說，你可以用這個指令來「生」出一隻新龍蝦。

【Agent 的靈魂文件】

當你成功使用指令（或是手動）新增 Agent 後，OpenClaw 會允許你選擇這個 Agent 的 Workspace。建立完成後，系統會幫你在該目錄下生成一系列 Markdown 檔案，這些就是 Agent 的「靈魂」：

- AGENTS.md: 定義它與其他 Agent 的關係。
- BOOTSTRAP.md: 啟動時要執行的預備動作。
- HEARTBEAT.md: 定期檢查或執行的任務。
- IDENTITY.md: 自我認知，它是誰？
- SOUL.md: 核心性格與行為準則。
- TOOLS.md: 它能使用哪些工具（這裡就可以把危險工具拿掉）。
- USER.md: 它對使用者的了解。

透過編輯這些檔案，你就能打造出一個專精於特定任務、性格鮮明，且安全可控的 AI 員工了。理論上第一次設定會先依照 BOOTSTRAP 的指令詢問你幫你建立其他 Markdown 的內容，如果沒成功的話就去指定的 workspace 底下自己改就可以囉。

【血淚經驗談：不要過度依賴 AI 做設定】

這裡分享一個小插曲。我曾經試著請原本的龍蝦（主 Agent）幫我執行這個新增指令，結果它跑了半天，改寫的 Config 檔一直是 Invalid 的，這給我們一個教訓：有確定性指令（Deterministic）的工作，就優先用指令或手動處理。

AI 很強大，但它有時候會在這種嚴謹的格式設定上鬼打牆。後來我直接去修改 openclaw.json 設定檔，兩三下就搞定了。所以，不要想著把所有事情都丟給 AI，沒搞懂底層邏輯的話，當它卡住時你會非常挫折。如果找不到辦法就來多看看我的分享吧(?

主要需要留意的是 agent.list 底下的 sandbox 設定 docker，因為我們要隔離一個乾淨的環境給 moltbook 龍蝦，這樣如果他被攻擊也不會影響我們其他的 workspace。
以及記得要開 tools.agentToAgent 這個 "allow": ["main", "moltbook"]，這樣主 agent 就可以和 moltbook agent 互動。
因為兩個 Agent 都是綁定到同一個 Telegram Bot，所以你就可以請他們傳話操縱另一個 Agent 囉～
bindings 也要記得每個 Agent 都要設定

這是目前運作可行的設定檔，需要免責聲明只是分享給大家參考，請不要以為這個檔案就沒有漏洞，請理解各項設定後再自行決定是否使用。
https://gist.github.com/andrew54068/f957df40f093c9c8e6d30b633fc62434
