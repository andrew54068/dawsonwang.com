Day 77 — Prompt Engineering → Context Engineering → Harness Engineering：AI 工程師的三次進化

你有沒有發現，"prompt engineering" 這個詞最近越來越少人提了？

它沒有過時，但光靠它已經不夠了。2023 到 2026，短短三年，AI 工程的核心技能經歷了三次典範轉移。今天來聊聊這條演化路徑，以及為什麼搞懂它會直接影響你跟 AI 協作的效率。


【第一階段：Prompt Engineering（2023-2024）】

2023 年 ChatGPT 爆紅後，所有人都在研究怎麼 "問對問題"。Chain-of-thought、few-shot、role-playing，各種 prompting 技巧層出不窮。那時候的核心信念是：只要你寫對 prompt，模型就能給你好答案。

這確實有效——但前提是任務簡單、單輪對話、不需要太多背景知識。


【第二階段：Context Engineering（2025）】

2025 年 6 月，Shopify CEO Tobi Lütke 在 X 上發了一則貼文：

"我很喜歡 context engineering 這個詞勝過 prompt engineering。它更能描述這個核心技能：提供所有必要的上下文，讓 LLM 有可能完成任務的藝術。"

幾乎同時，Andrej Karpathy（前 OpenAI、前 Tesla AI 負責人）也公開表態支持。他指出："人們把 prompt 聯想成簡短的任務描述，但在每個工業級 LLM 應用中，context engineering 是精心填滿 context window 的微妙藝術與科學。"

Anthropic 在工程部落格發表了 "Effective Context Engineering for AI Agents" 一文，正式定義：context engineering 是策略性地管理和維護 LLM 推論時最佳 token 集合的方法——包括系統指令、工具定義、MCP、外部資料、對話歷史等所有會進入 context window 的東西。

核心轉變：從 "怎麼問" 變成 "帶什麼資訊進場"。Prompt 只是 context 的一小部分。

Gartner 預測到 2028 年，80% 的 AI 開發工具將內建 context engineering 功能，能提升 agentic AI 準確度至少 30%。


【第三階段：Harness Engineering（2026）】

2026 年 2 月，OpenAI 發表了 "Harness Engineering: Leveraging Codex in an Agent-First World"，正式為這個新範式命名。

他們的 Codex 團隊用五個月時間，讓 AI agent 從零建構了一個超過一百萬行程式碼的產品——沒有任何一行是人類手寫的。工程師的工作不再是寫程式碼，而是設計讓 AI 能可靠工作的環境。

ThoughtWorks 的 Kief Morris 隨後在 Martin Fowler 的 Exploring Gen AI 系列中撰文解釋：harness（韁繩）是包圍在 agent 周圍的規格、品質檢查和工作流程指引的集合。Harness Engineering 就是人類 "在迴圈上"（on the loop）而非 "在迴圈中"（in the loop）工作的實踐。

最驚人的資料：同一個 AI 模型，在沒有 harness 的情況下 coding benchmark 成功率只有 42%，加上適當的 harness 後跳到 78%。模型沒變，變的是圍繞它的系統。

Philipp Schmid（現 Google DeepMind，前 Hugging Face Technical Lead）把 agent harness 比喻為作業系統：它管理 context、處理啟動序列（prompt、hooks）、提供標準驅動程式（工具處理）。

Harness 的核心組件包括：
→ 約束條件和分層架構
→ 回饋迴圈（linter、CI、自動測試）
→ 文件系統和知識管理
→ 生命週期管理
→ 子 agent 協調


【三階段對照】

Prompt Engineering：你在寫咒語，希望模型聽懂
Context Engineering：你在策展資訊，確保模型有足夠背景
Harness Engineering：你在建造系統，讓模型持續可靠地產出

用開車來比喻的話：
→ Prompt Engineering 是學會怎麼跟車子說 "左轉"
→ Context Engineering 是確保車子有地圖、知道路況、了解目的地
→ Harness Engineering 是建造整條公路系統——護欄、號誌、車道標線——不管誰在開都能安全到達

但這不代表後面出現了，前面就過時了。恰好相反，前面用得不純熟，後面的價值就發揮不出來。每個階段的技巧都像是種樹，根扎得夠深，後面的森林才會茂密。


---

參考資料：
1. OpenAI — Harness engineering: leveraging Codex in an agent-first world (2026/02) https://openai.com/index/harness-engineering/
2. Anthropic — Effective context engineering for AI agents https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
3. Birgitta Böckeler — Harness Engineering (2026/02) https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html
3b. Kief Morris — Humans and Agents in Software Engineering Loops https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html
4. Tobi Lütke (Shopify CEO) — X post on context engineering (2025/06) https://x.com/tobi/status/1935533422589399127
5. Andrej Karpathy — Context engineering as the new vibe coding (2025/06)
6. Philipp Schmid — The importance of Agent Harness in 2026 https://www.philschmid.de/agent-harness-2026
7. Gartner — Context engineering: Why it's Replacing Prompt Engineering for Enterprise AI Success https://www.gartner.com/en/articles/context-engineering
8. InfoQ — OpenAI Introduces Harness Engineering (2026/02) https://www.infoq.com/news/2026/02/openai-harness-engineering-codex/
9. Nate B Jones — Same model, 78% vs 42%: the harness made the difference https://natesnewsletter.substack.com/p/same-model-78-vs-42-the-harness-made
10. Aakash Gupta — 2025 Was Agents. 2026 Is Agent Harnesses. https://aakashgupta.medium.com/2025-was-agents-2026-is-agent-harnesses-heres-why-that-changes-everything-073e9877655e
