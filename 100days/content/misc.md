AI 越來越發達後，依賴性一定是越來越高，那麼是否在交付 AI 任務時要多想想這件事有沒有什麼依然要保持敏感度的地方，例如版控這件事，交給 AI 全權處理會有什麼問題？可能要先從這件事對我來說的意義下手，如果版控的意義只是讓我快速定位到 bug 的話，那麼確實不需要佔用我的時間，但如果他同時也訓練我的分類能力的話那麼全權交給 AI 是不是會讓我這方面的肌肉退化？
我們可能需要更有意識的去思考這個問題，哪些肌肉是需要我們去維護的？
我們小時候花了 6 年的時間在練習寫國字，但現在說真的實際寫到字的時機已經屈指可數，那麼寫國字這項技能是否是人生的必修？我能理解其中有包含文化的傳承，或是毛筆的陶冶心性，但如果平常寫字只是為了結果而非過程的話，那麼是否其實應該要重新思考在這項技藝所投資的時間是否值得？又舉例來說現在寫文章已經可以讓 AI 產生，但聽身邊的人開始有 AI 排斥感，是否我們反而會追求人類的不正確甚至是稍微邏輯不通順的"人味"？
目前能想到的一些東西是不能交給 AI 代理的，有關價值觀以及路線的選擇，同樣的題目不同人做出來就是會呈現不同的風格，也同樣會區分出不同的 TA，創業其實是讓你的靈魂具象化的過程，而 AI 是讓他加速的工具，過程中每個決策都在反覆雕琢一個作品，你的靈魂是什麼形狀還得由我們自己來決定



MCP 有個弊病是會在一開始把手用說明載入進來，佔據不少
這篇其實有提到有個隱藏方法 https://www.threads.com/@sakeeb.rahman/post/DTJHW8LEXjW



軟體 vs 硬體
昨天講到的是整個產業的改變，而今天想講的是不同產業的區別，gen1 gen2 gen3，有朋友在硬體產業寫軟體，因為環境相對封閉，如果只是代工的話護城河通常是智慧財產權，一旦危及到知識的竊取等同於危害到商業利益，所以資安敏感度非常高，同樣的也就代表著對於新技術的擁抱不會這麼迅速


行銷 > 技術
而因為 AI 大幅降低了軟體生產成本所以競爭對手會越來越多，AI 讓資訊爆炸的程度加快也就是說如何行銷才會是關鍵，


Skills 被捧上天
直到最近幾天都還是有滑到把 Skills 捧上天的文章，不太能理解原因，說白了 Skills 就是一個優化版的 Agent，本質上都只是 Markdown 文件為主體，只是 Skills 多了漸進式揭露的功能，以及它直接支援各種語言的 script，但真的沒什麼好驚訝的，這本來就是 Agent 應該有的功能，有人說 Skills 出來一堆 AI 工具就被取代，如果會被取代老早就該被 Agent 取代了，根本輪不到 Skills 出手，現在的 AI 工具基本上分成兩種類型一種是以自己訓練獨有模型的，另一種是基於現有模型但是在 context engineering 上下功夫，


馬太效應
大者恆大，創業越來越不容易？


------

為了實踐第二大腦，我找了一些文章，有一些有意思的 takeaway:
1. 當不知道要怎麼架構筆記時，可以先用 PARA
2. 與其把任何東西都記在筆記裡，不如把想想什麼東西不應該記上去

花了滿多時間在設定 Obsidian + MCP 的環境，


-------

day xx 自製 Claude Code Bot？從 TOS 到 Agent SDK 的深度解析

最近試著想做一個像 OpenClaw 那樣的全自動 AI Bot，但直接接 API 實在太燒錢（雖然現在已經便宜很多了）。 靈機一動：能不能用我有訂閱的 Claude Code 配額來做？ 但我之前有過 Google 帳號因為類似操作被 Ban 的慘痛經驗，這次決定先當個乖寶寶，把 TOS (服務條款) 跟 SDK 原始碼翻個底朝天。

這篇分享給同樣想「魔改」Claude Code 的開發者們，避免踩雷！

1. 真的能用配額嗎？TOS 怎麼說？
我翻遍了 Claude 的 Consumer Terms of Service，在第 3.7 條找到了關鍵條款： 「除非透過 API Key 或我們明確允許的方式，否則禁止透過機器人、腳本等自動化方式存取服務。」

這句話很有意思，什麼是「明確允許」？ Claude Agent SDK (claude-agent-sdk) 就是官方出的，當然算明確允許。 但如果你寫一個 Python script 去模仿瀏覽器請求？那就是違規，Ban 帳號預定。

2. Agent SDK 有比較厲害嗎？能繞過配額？
有些人說用 SDK 走 OAuth 可以繞過限制或不計入 Quota，我深入看了一下 code (它開源在 Github)。 答案是：不行。

SDK 的底層其實非常「單純」，它在 
subprocess_cli.py
 裡面直接 spawn 了一個 
claude
 CLI 的子程序。 也就是說，SDK 用的就是你電腦裡那個 
claude
 執行檔，吃的也是同一個登入 Session，當然也共用同一個 Quota。 它並沒有什麼神奇的後門，只是幫你把指令自動化而已。

3. 那我能不能自己寫 Proxy 模仿 SDK？
這就是最危險的地方。 雖然 SDK 是開源的，可以設定 CLAUDE_CODE_ENTRYPOINT=sdk-py 這樣的環境變數。 但是！
claude
 CLI 本身是閉源的 (Compiled Binary)。

當 CLI 發送請求時，它並不僅僅是帶個 Header 而已。 現在的後端防禦都有 TLS 指紋識別 (JA3 Fingerprint)。 Node.js 寫的 CLI 發出的 TLS 握手特徵，跟 Python requests 或 curl 發出的特徵完全不同。 加上 CLI 內部可能還有傳送遙測數據 (Telemetry) 或硬體資訊。

如果你試著用 Proxy 去模仿，你的 TLS 握手特徵一看就不對。 這就像是「拿著正確的鑰匙，但是指紋不對」，在大廠的風控系統眼裡，這就是標準的 Bot 行為。 這也是為什麼很多人用 headless browser 或 curl 模仿請求最後都會被鎖的原因。

結論
想省錢用 Quota 做自動化？請乖乖用 claude-agent-sdk。 它是官方認證的「合法外掛」，雖然 Quota 還是照算，至少你的帳號是安全的。 不要試著去逆向或 Proxy 那個 CLI Binary，那是一條通往被 Ban 的捷徑 🙏

-----

對於 AI 防禦 prompt injection 的一些想法，如果我們把讀取跟寫入的角色拆開，是不是有機會防止自己的 bot 被人攻擊？

------

BDD 規格驅動開發：Discovery → Formulation → Automation（訂單範例）

這套 Prompt 工作流把 BDD 的三階段（Discovery、Formulation、Automation）各自拆成獨立的 AI Prompt，形成一條從「需求釐清」到「可部署應用」的全自動化 Pipeline。

【Discovery（探索階段）】
目的：掃描現有規格，找出所有歧義與遺漏，產出結構化的「釐清項目」清單。
做法：
- 用一份詳細的 Checklist 對規格做結構化掃描，涵蓋四大面向：
  A. 領域與資料模型（實體完整性、屬性定義、邊界條件、跨屬性不變條件、關係、狀態生命週期）
  B. 功能模型（功能識別、規則完整性、Example 覆蓋度、邊界條件、錯誤處理）
  C. 術語一致性（詞彙表、同義詞衝突）
  D. 其他品質（TODO 標記、模糊描述）
- 每個 Partial 或 Missing 的項目會產出一份 .clarify/ 資料夾下的 Markdown 檔案，包含：問題、定位、多選題選項、影響範圍、優先級
- 同時產出 overview.md 統整所有釐清項目的優先順序與建議處理策略
- 關鍵原則：此階段是純偵測角色，不做任何互動式釐清，只產出檔案

【Formulation（表述階段）】
目的：將原始規格文本轉換成結構化的規格模型，並透過互動式問答釐清所有歧義。
包含三份 Prompt：
1. formulation.md — 主流程，從規格文本萃取資料模型（DBML）與功能模型（Gherkin Feature Files）
2. formulation-rules.md — 萃取規則手冊，定義：
   - 核心原則：「無腦補或任意假設」，規格沒寫的就不加
   - 資料模型用 DBML 格式（Table、Column、Note、Relationship）
   - 功能模型用 Gherkin 三層結構（Feature > Rule > Example）
   - Rule 必須原子化（每條只驗證一件事）
   - Example 的 Then 只能描述系統的「實際狀態資料」，不能寫描述性語句
   - 沒有 Example 的 Rule 標記 #TODO
3. clarify-and-translation.md — 互動式釐清流程：
   - 讀取 Discovery 階段產出的 .clarify/ 檔案，按優先序逐題向使用者提問
   - 一次一題，使用者回答後立即整合進 spec/erm.dbml 或 spec/features/*.feature
   - 提問前會將技術術語白話翻譯（例如 price → 價格），確保非技術人員也能理解
   - 已解決的項目歸檔至 .clarify/resolved/，並從 overview.md 移除
   - 結束後產出完整的釐清統計與覆蓋度報告

【Automation（自動化階段）】
目的：基於完整規格，全自動開發出可部署的全端應用程式。
做法：
- 技術棧可自定義（預設 Next.js 14 + PostgreSQL + Docker）
- 六大階段依序執行：
  1. 深度理解規格 — 逐條讀取 ERM 與 Feature Files
  2. 資料庫設計 — 從 DBML 產生 PostgreSQL Schema，所有約束用 SQL Constraints 實作，建立豐富的測試 Seed Data
  3. 後端開發 — 每條 Rule 以註解逐條抄寫在程式碼中，確保規格與程式 1:1 對應
  4. 前端開發 — 重點不在美觀而在「展示業務規則計算過程」，觀眾要能透過操作重現 Feature File 中的 Example
  5. 容器化 — Docker + Docker Compose 一鍵部署
  6. 自動化驗收 — AI 必須實際 build、run、訪問網頁，驗證每條規則計算正確
- 核心原則：
  - 功能正確性 >>> 程式碼架構（不需要 DDD、Clean Architecture）
  - 絕對忠於規格，不腦補任何功能
  - 前端必須展示計算過程而非只有結果
  - 驗收不是「能跑」就好，而是「規則算對」才行

------

STARTUP GRAVEYARD

https://www.loot-drop.io/ideas


----

BMAD

https://blog.es2idea.com/posts/bmad-methodology-for-ai-driven-agile-teams/


----

subagents vs agent teams

https://code.claude.com/docs/en/agent-teams


----

今天在整理 .claude 資料夾，發現最近請 Claude Code 幫我產生新的 Skill 時也會順便幫我產一樣的 Agent Markdown，這其實不是個好現象，因為不像 Skill，Agent 會佔用 Context Window 即使我們根本用不到他。
解法是我們要回歸到這個 Agent 是否值得放在全域？如果是特定專案專屬的我們可以參考這個思路 https://www.facebook.com/share/v/1A6RDFEV7n/ 在初始專案的時候可以連結到用的到的 Agent

--------

分享 Claude Code sysyem prompt

--------

發文平台分享：不要想著一次到位，先求有再求好

-------

hook add verifier

-------

rm -rf

-------

Harness ELI5

-------

最近常被問到的問題

Claude 有沒有資安問題？
要如何避免資料被刪除？ rm -rf
能怎麼用在工作上？

----

https://github.com/karpathy/llm-council


----

Open CoDesign

https://github.com/OpenCoworkAI/open-codesign


-----