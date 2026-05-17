Day 78 — Claude in Antigravity vs Claude Code

今天想探討一個很多人在問的問題：Antigravity 裡的 Claude 跟 Claude Code 有什麼不同？

要了解這兩個差異，我們必須先挖出他們到底送了什麼樣的請求給模型。

Claude Code 還算簡單，用之前介紹的 Claude-trace 工具就可以看到所有資訊，但 Antigravity 就複雜很多。

這兩天我用 MITM（中間人攻擊）攔截了 Google Antigravity 發送給 Claude 的完整請求，看到了隱藏的 system prompt、所有 context、工具定義的真面目。然後跟 Claude Code 做了對比。

以下是完整的技術過程和發現。

【為什麼攔截這麼困難？】

正常的 HTTPS proxy（mitmproxy、Charles）對 Antigravity 無效，因為：

1. Go 二進位用 GOEXPERIMENT=boringcrypto 編譯（Google 的 FIPS 合規版本）
2. 內嵌 24 個 CA 憑證，完全不讀 macOS 系統鑰匙圈
3. 用 gRPC over HTTP/2 通訊，不是普通 REST API
4. 聊天訊息走 Unix domain socket（命名管道），tcpdump 抓不到

```
Electron UI ←→ language_server (Go binary) ←→ daily-cloudcode-pa.googleapis.com
              Unix domain socket                gRPC / BoringCrypto TLS
              (tcpdump 看不到)                  (自帶 CA，系統憑證無效)
```


【攔截方法：三步驟 Binary Cert Patching】

既然 Go 二進位自帶 CA bundle，那就把其中一個 CA 換成我們的。

Step 1：安裝 mitmproxy，產生 CA 憑證
```bash
brew install mitmproxy
mitmdump --listen-port 18080  # 短暫啟動產生 CA
# CA 產生在 ~/.mitmproxy/mitmproxy-ca-cert.pem（1172 bytes）
```

Step 2：Patch 二進位
```bash
# 備份原始檔案
cp language_server_macos_arm language_server_macos_arm.original

# 用 Python 找到 24 個內嵌 PEM 憑證
# 選一個大小 >= 1172 bytes 的（cert #9, 1228 bytes）
# 用 mitmproxy CA 替換，末尾補 newline 填滿相同長度
# 重新 ad-hoc 簽名（原始 code signature 會失效）
codesign --remove-signature language_server_macos_arm
codesign -s - --force --deep language_server_macos_arm
```

Step 3：DNS 重導向 + 反向代理
```bash
# /etc/hosts 把 Google API 導向 localhost
echo '127.0.0.1 daily-cloudcode-pa.googleapis.com' | sudo tee -a /etc/hosts

# mitmproxy 反向代理到 Google 真實 IP
sudo mitmproxy --mode reverse:https://142.250.196.202:443 \
  --listen-host 127.0.0.1 --listen-port 443 \
  --set keep_host_header=true --ssl-insecure
```

重啟 Antigravity，發送訊息——mitmproxy 成功攔截！


【完整請求結構】

當你在 Antigravity 輸入 "Hi" 並選擇 Claude Sonnet 4.6 時，實際發送的 HTTP 請求是：

```
POST /v1internal:streamGenerateContent?alt=sse
Host: daily-cloudcode-pa.googleapis.com
Content-Type: application/json
Authorization: Bearer ya29.a0ATkoCc5W...（Google OAuth token）
```

請求走的是 Google Gemini API 格式（`streamGenerateContent`），不是 Anthropic API 的 `/v1/messages`。Google 的後端負責轉發給 Claude。

完整 JSON body 結構：

model：claude-sonnet-4-6
systemInstruction：26,655 字元的隱藏 system prompt
contents[0]：<user_information> — OS、workspace 路徑
contents[1]：<mcp_servers> — 可用的 MCP server 列表
contents[2]：<artifacts> — artifact 目錄路徑
contents[3]：<user_rules> — 使用者自訂規則（3,749 字元）
contents[4]：<workflows> — 工作流程定義
contents[5]：<USER_REQUEST> — 你的實際訊息 + metadata（時間、打開的檔案、游標位置）
contents[6+]：完整的當前對話歷史（所有 turn），每個 user message 附帶 Step Id 編號與即時 metadata（時間、游標、開啟檔案）；過去 session 的歷史則以摘要形式注入（最近 10 個對話的 summary，非完整記錄）
tools：47 個工具定義

值得注意的是，每一個 user turn 都會附帶一段 <ADDITIONAL_METADATA>：

```
<ADDITIONAL_METADATA>
The current local time is: 2026-03-19T17:03:32+08:00.

The user's current state is as follows:
Active Document: /Users/dawson/Documents/100days/content/day70/source.md
Cursor is on line: 86
Other open documents:
- /Users/dawson/Documents/100days/content/day70/source.md
No browser pages are currently open.
</ADDITIONAL_METADATA>
```

這段 metadata 每輪都重新注入，不管內容有沒有變化。實驗中連續三個問題（Step Id 8、14、20）的 ADDITIONAL_METADATA 完全相同——同一個檔案、游標在同一行（第 86 行）——但仍然各自重複出現了三次。

Claude Code 沒有這種機制。環境資訊只在 session 開始時注入一次，不會每輪重送。


【Antigravity vs Claude Code 對照表】

用同樣的 Claude Sonnet 4.6 模型，兩者的請求差異驚人：

```
                                Antigravity      Claude Code
────────────────────────── ─────────────── ───────────────
Model                      claude-sonnet-4-6  claude-sonnet-4-6
System prompt 字元數             26,655           28,047
對話 message 數量                   51               25
工具數量                            47                9
請求 body 大小                    578 KB           175 KB
認證方式                    Google OAuth       API Key
Prompt caching                   無           37,149 tokens
```

關鍵差異：
- API 格式完全不同：Antigravity 用 Gemini API（`streamGenerateContent`），Claude Code 用 Anthropic API（`/v1/messages`）
- 工具集不同：Antigravity 47 個工具（含 chrome-devtools 整合），Claude Code 9 個核心工具。兩者零重疊。
- Context 管理：Antigravity 的請求 body 實際上是 Claude Code 的 3.3 倍大。每次請求都重新注入完整的 user_rules、workflows、mcp_servers、per-turn metadata，沒有用 prompt caching。Claude Code 透過 `context-management` beta + `clear_thinking` 清除思考 token，並大量命中 prompt cache（37K tokens）。


【Antigravity 的 Token 預算管理——CumulativePromptConfig】

對 Go 二進位做靜態分析（strings + protobuf 結構還原），發現 Antigravity 用一套叫 CumulativePromptConfig 的機制來控制送給 Claude 的 prompt 內容。

這些參數定義在 Google 內部路徑 `google3/third_party/jetski/prompt_pb/prompt_go_proto` 的 protobuf 裡，由 `CumulativePromptHandler.ConstructCumulativePrompt()` 在每次請求時執行：

```
參數                                    功能
─────────────────────────────────── ──────────────────────────────────────
EphemeralContextMultiplier           當前即時 context（打開的檔案、游標、最近編輯）的 token 預算比例
EphemeralActiveDocumentMultiplier    當前 active document 的 token 預算加權
EphemeralDocumentSuffixFrac          ephemeral document 保留尾部的比例（游標附近的內容）
EphemeralMaxCcisConsidered           最多考慮幾個 Code Context Items（相關程式碼片段）
PersistentContextMultiplier          持久 context（釘選檔案、完整對話）的 token 預算比例
PersistentActiveDocumentMultiplier   持久 active document 的 token 預算加權
PersistentDocumentSuffixFrac         persistent document 保留尾部的比例
PersistentMaxCcisConsidered          持久 context 的最大 CCI 數量
PersistentMaxTokensPerOpenDoc        每個開啟檔案的 token 上限
PersistentOpenDocsMultiplier         開啟文件總量的 token 預算加權
TrajectoryContextMultiplier          對話歷史的 token 預算比例
TrajectoryTruncationMultiplier       對話歷史截斷的激進程度（越低截越多）
TrajectoryStartIndex                 從第幾輪對話開始保留（更早的被丟棄）
TrajectoryIndexIncrement             每次截斷時跳過幾輪
TrajectoryRefreshThresholdMultiplier 觸發 context 重新整理的閾值
IntentReservationTokens              為模型回應預留的 token 數量
```

這些是從 Go 二進位的 protobuf 定義中直接提取的欄位名稱（全部經過 `strings` + `rg` 驗證存在於 `language_server_macos_arm` 中）。

重點：Antigravity 在客戶端嚴格管理 Claude 看到什麼。它不是把完整對話直接送過去，而是按三大類別分配 token 預算：

1. Ephemeral（即時）：當前打開的檔案、游標位置、最近的 code context
2. Persistent（持久）：釘選的檔案、開啟的文件列表
3. Trajectory（軌跡）：對話歷史

超出預算的部分會被壓縮或截斷。binary 中甚至有一個 `FormatCumulativePromptForDebug` 內建 debug function 用來檢查組裝結果。

Claude Code 的做法不同：它用 Anthropic 的 `context-management` beta 功能 + prompt caching，讓 Anthropic 的 API 層處理 context 管理，而不是在客戶端做截斷。


【47 個工具 vs 9 個工具】

Antigravity 的工具集：
- 檔案操作：`view_file`, `write_to_file`, `replace_file_content`, `multi_replace_file_content`, `find_by_name`, `grep_search`, `list_dir`
- 終端機：`run_command`, `command_status`, `send_command_input`, `read_terminal`
- 瀏覽器（Chrome DevTools MCP）：`click`, `fill`, `navigate_page`, `take_screenshot`, `evaluate_script` 等 25 個
- 其他：`browser_subagent`, `search_web`, `generate_image`, `read_url_content`

Claude Code 的工具集：
- `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Agent`, `Skill`, `ToolSearch`

設計哲學完全不同——Antigravity 給模型大量細粒度工具，Claude Code 給少量通用工具。


【兩個 System Prompt 的對比】

Antigravity 的 26,655 字元 system prompt：

1. 身份定義（`<identity>`）："你是 Antigravity，由 Google DeepMind 團隊設計"
2. 工具使用指南（`<tool_calling>`）：永遠用絕對路徑
3. Web 開發規範（`<web_application_development>`）：偏好 vanilla CSS、glassmorphism、vibrant colors
4. 設計美學要求："使用者第一眼要被 WOW，做不到是 UNACCEPTABLE"
5. 程式碼編輯規則：如何使用 replace/multi_replace 工具
6. 搜尋指南：如何用 grep_search 和 find_by_name
7. 終端機操作：命令執行、背景任務管理
8. 瀏覽器操作：Chrome DevTools 整合指南
9. artifact 管理：文件建立、知識項目管理
10. 子代理（subagent）系統：如何呼叫和管理子代理

Claude Code 的 28,047 字元 system prompt：

1. 身份定義："You are Claude Code, Anthropic's official CLI for Claude"
2. 安全規範：明確列出允許（CTF、授權滲透測試）與禁止（DoS、大規模攻擊、惡意規避偵測）的場景
3. 工程任務原則：只做被要求的事，避免過度工程化（"three similar lines of code is better than a premature abstraction"）
4. 執行謹慎原則：按可逆性分級——本地改檔可自由做，push / 刪 branch / 發 PR 要先確認
5. 工具使用原則：有專用工具就用專用工具，不用 bash 替代（Read 不用 cat、Grep 不用 grep）
6. 回應風格：不用 emoji、不說廢話、直接給答案
7. 記憶系統：file-based 持久記憶（MEMORY.md + 分類子檔案），跨 session 保留

兩者最明顯的哲學差異：Antigravity 的 system prompt 告訴模型"要讓使用者驚豔，不夠 WOW 是不可接受的"；Claude Code 的 system prompt 告訴模型"不要過度工程化，三行重複比一個多餘的抽象好"。一個追求視覺衝擊，一個追求保守正確。


【什麼時候用哪個？】

選 Antigravity agent（選 Claude 模型）：
- 需要瀏覽器自動化——內建 25 個 Chrome DevTools 工具，不用另外設定
- 用 Google Pro 額度，不想動到 Claude Pro 的用量
- 短對話、一次性任務——context 效率差距在短對話裡不明顯

選 Claude Code：
- 長對話或大型專案——prompt caching 在長 context 下省非常多（37K tokens cached vs 零）
- 你在用 Claude 的 Skills、Hooks、subagent 系統
- token 效率優先——同樣的對話，Claude Code 的請求 body 小 3.3 倍


【結論】

其實兩者最大的差異就是 context 管理。
呼應到昨天的主題 Context Engineering vs Harness Engineering。
Antigravity 更偏向是以人為主體操作的 IDE，比較接近 Context Engineering；
Claude Code 更偏向是以 AI 為主體的操作，比較接近 Harness Engineering。

看你的需求來選擇。我相信有些人覺得 Claude Code 效果比較好，應該是因為在很長的 context 下它比較少一些無用的資訊分散注意力。
如果只是單純問個問題而不是處理任務的話，兩者表現就只差在 system prompt 的角色扮演上。
