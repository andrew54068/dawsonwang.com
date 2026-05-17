Day 34 OpenClaw 進階記憶與工具

昨天我們聊到了最重要的 Embedding，但其實 OpenClaw 在記憶管理上還有很多值得挖掘的細節。如果你想要把這隻龍蝦養得更好，可以先了解以下幾個觀念。一樣文末附上設定檔範例。

## 記憶的層次

OpenClaw 的記憶其實是分層級的，主要有兩個檔案：
1. `memory/YYYY-MM-DD.md`：這是每日的流水帳。它會記錄當天的對話摘要和筆記。預設情況下，龍蝦啟動時會讀取「今天」和「昨天」的紀錄。這就像是人類的短期記憶，幫你接續昨天未完成的工作。
2. `MEMORY.md`：這是長期記憶。這裡存放的是事實、偏好、決策等「不會變」的資訊。例如你的專案架構、Coding Style 偏好等等。這份文件是經過精心策展（Curated）的，只會在主要對話中載入。

## 自動記憶保存 (Auto-flush)

這是一個很聰明的設計。我們都知道 context window 是有限的，當對話太長，舊的資訊會被「擠出去」（Compaction）。OpenClaw 有一個 `memoryFlush` 機制，當它發現 context 快滿了，準備要進行壓縮前，會自動觸發一個 prompt 叫 AI 把重要的資訊寫入 `memory/YYYY-MM-DD.md`。

最有趣的是，這個動作是「靜默」的。系統會送出一個 prompt 叫它寫記憶，並規定它如果沒事要寫就回 `NO_REPLY`，這樣使用者就不會被一堆「我正在存檔...」的訊息打擾。

## QMD Backend (實驗性功能)

如果你跟我一樣是數位乞丐，不想依賴雲端向量資料庫，除了預設的 gemma embedding model 外，OpenClaw 最近推出了一個實驗性的後端 `QMD`。它利用 SQLite + 本地 LLM (透過 Bun 和 node-llama-cpp) 來處理向量搜尋。這意味著你可以完全在本地端建立和搜尋向量索引，不需要依賴外部 API，對於隱私和成本控制都是一大福音，據說精準度可以提高。
來源：https://x.com/wangray/status/2017624068997189807

## Session Pruning (對話修剪)

另一個幫你省錢省 Token 的功能是 Session Pruning。

當我們在操作 Agent 時，常常會呼叫工具（Tool），例如列出檔案列表 (`ls`) 或讀取網頁。這些工具的回傳內容往往非常長，而且用完即丟。如果這些內容一直佔用 context，很快就會爆掉。

OpenClaw 引入了 Pruning 機制，特別是針對 Anthropic 的 Prompt Caching。當快取過期（TTL）後，系統會自動把那些舊的 tool output 修剪掉（只保留最後幾次的結果），這樣下次送出請求時，就不需重新快取那些已經不重要的舊資料，大幅節省成本。

## Web Tools

最後提一下，OpenClaw 當然也內建了上網能力，主要分為兩個不同的工具，各有用途：

1. **web_search (搜尋)**：這就像是讓 AI 去搜尋引擎查找資料。
   - **用途**：當你問它「最近的 AI 新聞」或「某個 Error Code 的解法」時，它會去網路上撈相關的搜尋結果摘要。
   - **設定**：你需要設定 `BRAVE_API_KEY` (Brave Search) 或是 `PERPLEXITY_API_KEY` (Perplexity) 才能啟用。

2. **web_fetch (讀取)**：這像是讓 AI 點開網頁進去「精讀」內容。
   - **用途**：當你給它一個具體的網址 (URL) 請它總結，或是搜尋完畢後需要深入閱讀某篇結果時使用。它會利用 Readability 演算法（或是透過 Firecrawl，AI 爬蟲工具）把網頁轉成乾淨的 Markdown 格式，讓 AI 只專注在內文。

這兩者通常是搭配使用的：先 Search 找到目標，再 Fetch 進去讀取細節。有了這兩個左膀右臂，它就能跨越封閉系統的限制，成為一個能與真實世界互動的 Agent。

把這些設定摸熟，你的 OpenClaw 就會從一個單純的 Chatbot，進化成一個真正能長期協作、越用越聰明的 AI 夥伴。

設定檔範例：https://gist.github.com/andrew54068/f34e745a8ba94644449104d129605992
我並沒有使用以上所有功能，例如 QMD 目前還是設定失敗，有興趣的朋友可以研究看看。