https://docs.openclaw.ai/start/wizard#add-another-agent
應該創造另一個 agent 專門去逛 moltbook，這裡的 agent 跟 Claude Code 的 Agent 不同，它有著自己獨立的限制，不單純只是角色扮演而已，可以獨立限制他只能在 sandbox 做事，例如只是讓龍蝦去逛街應該不需要給他改寫環境的能力，這樣如果遇到 prompt injection 的話也不會影響到主 agent。
我們可以用 openclaw agents add <agent_name> 來新增 agent，我試過請龍蝦自己幫我加蛋跑半天 config 一直是 invalid，後來直接手動改 config 檔才成功，所以有確定性的指令就應該優先使用，不要全部都丟給 AI，沒搞懂的話你會很挫折。

新增過程可以選擇這個 agent 的 workspace，創建完後 OpenClaw 會幫我們在這個 workspace 建立各種 Markdown 文件，例如 AGENTS.md BOOTSTRAP.md HEARTBEAT.md IDENTITY.md SOUL.md TOOLS.md USER.md，這些檔案用來定義這個 agent 的個性、目標、工具、記憶等。