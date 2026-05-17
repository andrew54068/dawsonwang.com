Day 49 AI Agent 的記憶力：OpenClaw vs ZeroClaw vs OpenViking

最近花了不少時間研究三個開源專案的記憶機制，直接去翻原始碼來比對官方文件的說法，結果發現蠻多有趣的差異。今天就來分享一下這三套系統到底是怎麼讓 AI「記住」東西的。

不過在開始之前，要先釐清一件事：這三個專案其實不在同一個層級。OpenClaw 跟 ZeroClaw 都是完整的 AI Agent 框架，記憶只是其中一個子系統；而 OpenViking 是字節跳動團隊出品的專門記憶/上下文解決方案，它不包含 Agent 迴圈、工具執行、沙箱等功能。所以嚴格來說，這不是三個「同類產品」的比較，而是「兩個框架的記憶子系統」對上「一個專精記憶的獨立專案」。

理解這個前提後，比較才有意義。

【三種截然不同的記憶哲學】

OpenClaw 走的是「檔案優先，搜尋其次」的路線。它把 Markdown 檔案當作唯一的真相來源（Source of Truth），所有記憶都是人類可讀的 .md 檔案，存在磁碟上。搜尋引擎只是建立在這些檔案之上的索引。你打開資料夾就能直接看到 AI 記了什麼，甚至可以用 Git 來版本控制記憶。除了記憶，OpenClaw 還有完整的 Agent 執行引擎、工具生態系（瀏覽器自動化、程式碼沙箱、排程任務等）、Sub-agent 協調、多頻道路由（Telegram、Discord、Signal、Slack 等）。

ZeroClaw 走的是「零依賴，全部自幹」的路線。整個系統用 Rust 寫，記憶全部塞進 SQLite 裡面，不需要任何外部服務。沒有 Pinecone（一種雲端向量資料庫服務，專門用來儲存跟搜尋 embedding 向量），沒有 Elasticsearch。除了記憶，ZeroClaw 同樣是完整的 Agent 框架，有 18 個以上的頻道整合、50+ 個工具、技能系統，甚至支援嵌入式硬體（STM32、Raspberry Pi）。

OpenViking（字節跳動 / 火山引擎團隊出品）走的是「Context Database」路線。它是專門為 AI Agent 設計的上下文資料庫，把記憶、資源、技能統一用一套虛擬檔案系統（viking:// URIs）來管理，搭配分層載入機制。它本身不是 Agent 框架，沒有 Agent 迴圈，沒有工具執行機制，而是作為一個獨立的後端服務，讓其他 Agent 框架來呼叫。

【搜尋機制大不同】

OpenClaw 的搜尋最成熟。它同時跑 BM25（Best Matching 25，一種經典的資訊檢索排序演算法，根據關鍵字出現頻率跟文件長度來計算相關性分數）關鍵字搜尋跟向量語意搜尋，然後用加權公式合併結果。還有時間衰減（越舊的記憶權重越低，半衰期 30 天）跟 MMR（Maximal Marginal Relevance，最大邊際相關性，一種重排序演算法，會在選下一筆結果時同時考慮「跟查詢有多相關」以及「跟已選結果有多不同」，避免搜尋結果太雷同）多樣性重排序。Embedding 支援本地端（用 GGUF 格式的量化模型跑，GGUF 是一種專為本地推論設計的模型檔案格式，可以在不需要 GPU 的情況下執行）、OpenAI、Gemini、Voyage，全部掛了還能退回純關鍵字搜尋。光 memory 相關的程式碼就有 78 個以上的檔案。

ZeroClaw 的搜尋比較直覺：先跑 FTS5（Full Text Search 5，SQLite 內建的全文搜尋引擎，第五代版本）關鍵字搜尋，再跑向量搜尋，最後混合排序。但有個關鍵問題，向量搜尋是暴力掃描（brute-force），也就是每次查詢都要把所有 embedding 掃一遍算 cosine similarity（餘弦相似度，一種衡量兩個向量方向有多接近的數學方法，值越接近 1 代表越相似）。資料量小的時候沒問題，量大了就會卡。而且預設的 embedding provider 是 none，等於開箱即用的狀態下只有關鍵字搜尋能用。

OpenViking 的搜尋策略最特別，它用的是階層式檢索。先用向量搜尋找到最相關的目錄，然後遞迴地往下鑽。搭配 L0/L1/L2 三層載入機制：L0 是摘要（約 100 tokens），L1 是概覽（約 2000 tokens），L2 才是完整內容。這設計很聰明，可以在不吃滿 context window 的情況下先大致判斷哪些記憶有用。

【記憶的寫入與維護】

寫入方式也是三套各有特色。

OpenClaw 有個很特別的機制叫「Pre-compaction flush」。當 session 快要觸發自動壓縮（也就是對話快要超出 context window）的時候，它會偷偷跑一個 agentic turn，把重要的記憶先寫到 memory/YYYY-MM-DD.md 裡面，避免有價值的資訊在壓縮過程中遺失。然後靠 file watcher 偵測檔案變動，自動觸發重新索引。

ZeroClaw 比較傳統，在 agent loop 裡面自動儲存使用者訊息跟 AI 回覆，直接寫入 SQLite。它有個 Hygiene 機制每 12 小時跑一次，會把超過 7 天的日記歸檔，超過 30 天的直接清掉。還有個有趣的「靈魂備份」功能，會把核心記憶匯出成 MEMORY_SNAPSHOT.md，如果資料庫不見了可以自動恢復。

OpenViking 最「智慧」但也最吃 LLM 額度。它在 session 結束時會用 LLM 從對話中萃取記憶，分成 6 個類別（個人檔案、偏好、實體、事件、案例、模式）。寫入前還會用向量預篩 + LLM 判斷是否重複（CREATE/MERGE/SKIP），個人檔案類的記憶則永遠走 LLM 合併更新。等於每次存記憶都要叫好幾次 LLM，延遲跟成本都比較高。

【翻原始碼的發現】

翻完三套的原始碼，有幾個有趣的發現：

1. OpenClaw 的所有官方宣稱功能都在程式碼中完全驗證了，100% 對得上。而且還藏了幾個沒寫在文件裡的功能，像是中英文雙語的查詢擴展、原子性的索引重建等等。

2. ZeroClaw 有些功能是寫了但沒接上的。Markdown chunker 存在但沒有被實際使用，reindex 函式標了 #[allow(dead_code)]，表示沒有任何地方呼叫它。README 範例寫 embedding_provider = "openai"，但程式碼預設其實是 "none"。

3. OpenViking 的 Dedup 機制只有三種決策（CREATE/MERGE/SKIP），沒有 UPDATE。這是刻意的設計：MERGE 已經涵蓋了 UPDATE 的語意，透過 LLM 把新舊內容合併改寫，等於非破壞性地原地更新。Rerank 功能的程式碼結構在，但 rerank client 是 None 加一個 TODO 註解代表還沒實作。

【那如果把 OpenClaw 跟 OpenViking 接在一起呢？】

既然 OpenViking 是獨立的記憶解決方案，而 OpenClaw 是完整的 Agent 框架，那最有趣的問題就是：能不能讓 OpenClaw 同時使用自己的內建記憶跟 OpenViking？

翻了 OpenClaw 的記憶架構之後，答案是：目前不行，但架構上有潛力。

OpenClaw 的記憶系統有一個乾淨的抽象層介面叫 MemorySearchManager（定義在 src/memory/types.ts），所有記憶後端只要實作 search()、readFile()、status() 這幾個方法就行。目前有兩個後端：內建的 SQLite 引擎（MemoryIndexManager）跟實驗性的 QMD 外部引擎（QmdMemoryManager）。

關鍵在於它的切換機制。OpenClaw 已經有一個 FallbackMemoryManager（在 src/memory/search-manager.ts），邏輯是「先試 QMD，失敗了就退回內建」。但這是序列式的 fallback，不是平行查詢。而且設定檔裡的 memory.backend 是一個 enum（"builtin" | "qmd"），一次只能選一個。

要真正讓兩套記憶系統同時運作，需要改幾件事：

1. 設定檔要支援多個後端（從 backend: "builtin" 改成 backends: [{type, weight}]）
2. 要新增一個 MemoryMultiplexManager，能平行查詢所有後端然後合併結果
3. 結果合併需要處理去重跟跨後端的分數正規化（不同後端的評分體系不一樣）
4. 狀態回報要能顯示每個後端各自的健康狀態

好消息是 MemorySearchManager 介面夠乾淨，加一個新後端不需要改動上層的工具或 system prompt。OpenViking 本身也有提供 Python client API 跟 REST server，要寫一個 OpenVikingMemoryManager 來 wrap 它的 API 是可行的。

壞消息是目前沒有現成的做法。OpenClaw 的 FallbackMemoryManager 是為「容錯」設計的，不是為「增強」設計的。你不能同時享受 OpenClaw 的 hybrid BM25+vector 搜尋跟 OpenViking 的階層式 L0/L1/L2 檢索。這不是改個設定就能搞定的事，牽涉到設定層重構、Multiplexer 實作跟結果合併邏輯，算是一個不小的工程。

不過反過來想，如果你願意「擇一」而不是「兩者兼得」，那 OpenClaw 的架構其實已經留好了口。它的 FallbackMemoryManager 模式可以直接套用：OpenViking 當 primary，內建引擎當 fallback。只要加一個 "openviking" 的 backend type 跟對應的 Manager 實作就行。

我已經動手把 OpenViking 整合進 OpenClaw 了。過程中發現 OpenViking 預設依賴 OpenAI 的 embedding 模型，對於想在本地跑的人來說不太友善，所以我順便把它換成了 nomic-embed-text，這是一個 GPT 風格的本地端 embedding 模型，不需要打外部 API 就能產生向量。等我實際用一段時間之後，再來分享整合後的使用心得跟踩到的坑。
