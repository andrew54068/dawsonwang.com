Day 90 你的本地 LLM 為什麼跑不了長對話？KV Cache 壓縮

Google 最近發表了一個叫 TurboQuant 的技術，直接讓記憶體相關股價下跌。一個壓縮演算法而已，為什麼能動到股價？

因為它打到了 AI 硬體需求的痛點：KV Cache。

你可能有這樣的經驗：用 llama.cpp 跑一個 7B 模型，短對話很順，但一旦把 context 拉到 32K，要嘛直接 OOM，要嘛慢到沒辦法用。問題就出在 KV Cache。

先解釋一下 KV Cache 是什麼。

Transformer 在生成每一個 token 的時候，都需要"回頭看"前面所有的 token。具體來說，它會對每一個 token 計算一組 Key 和 Value 向量，然後用 Attention 機制去查詢。

為了避免每次都重新算，已經算好的 Key 和 Value 會被存下來，這就是 KV Cache。

問題是，KV Cache 的大小跟 context 長度成正比。每多一個 token，每一層、每一個 attention head 都要多存一組向量。一個 35B 的 dense 模型（全 MHA）在 32K context 下，KV Cache 可以吃掉 7-8GB 的記憶體。這對本地跑模型的人來說是很大的壓力。

那怎麼辦？壓縮它。

這就是前面說的 TurboQuant（被 ICLR 2026 收錄）。Google 官方宣稱能把 KV Cache 壓縮到 3 bit，記憶體縮小 6 倍，而且"零精度損失"。社群實測的數字比較保守——從 16-bit 壓到 3-4 bit，壓縮比大約 4-5 倍，回答品質幾乎不受影響——但已經非常實用。記憶體股會跌就是因為這個——壓縮技術成熟的話，同樣的硬體能撐更長的 context，對記憶體容量的需求就沒那麼急迫了。

它的核心思路很有意思。

正常的向量資料分佈很不均勻，有些維度的值特別大（outlier），直接量化效果會很差。TurboQuant 的做法是：先用一個數學變換（Walsh-Hadamard Transform，一種快速旋轉）把向量"攪勻"。

旋轉之後，每個維度的值都變成接近高斯分佈（鐘形曲線），而且標準差可以精確預測。這時候你就可以用最佳的量化器（Lloyd-Max）來壓縮每一個維度，效率非常高。

打個比方：如果你有一堆大小差異很大的東西要裝箱，直接裝很浪費空間。但如果你先把它們磨成差不多大小的顆粒，就能裝得非常緊密。旋轉就是那個"磨碎"的步驟。

實際效果怎麼樣？

Google 官方的測試是在 H100 GPU 上跑 Gemma、Mistral、Llama 等模型，宣稱零精度損失。但更貼近一般人使用情境的是社群資料——以 turboquant_plus 專案在 M5 Max 上跑 Qwen3.5-35B 為例：turbo4（4-bit）壓縮 3.8 倍，回答品質跟 q8_0 幾乎一樣。turbo3（3-bit）壓縮 4.6 倍，品質也只有極微小的下降。Prefill 速度跟 q8_0 打平，甚至更快——因為壓縮後的 cache 佔的頻寬更少。

不過這個技術有一個很重要的限制：它只對本地跑模型的人有用。

如果你用的是 Claude、ChatGPT、Gemini 這些遠端 API，KV Cache 是在提供者的 GPU 上，你根本碰不到。API 的抽象層在 token 層級，不在 tensor 層級。你送出去的是文字，拿回來的也是文字，中間的 KV Cache 跟你無關。

而且你也不可能在本地算好 KV Cache 再傳給遠端——因為你沒有他們的模型權重，tensor 格式也不相容。

所以這邊有一個很清楚的分界線：

本地推理（llama.cpp、vLLM、自架伺服器）→ KV Cache 壓縮直接幫到你，更長的 context、更少的記憶體。

遠端 API（Claude、OpenAI、Gemini）→ 這個問題不存在，提供者已經在他們那端處理了（Prompt Caching 之類的機制）。

如果你有在本地跑模型，而且常常被 context 長度限制住，KV Cache 壓縮值得關注。這不是什麼遙遠的研究——已經有人把它整合進 llama.cpp 了，30+ 人在不同硬體上測試過，Metal、CUDA、AMD 都支援。甚至有人用 Claude Code 把 TurboQuant 實作成一個獨立專案（https://github.com/TheTom/turboquant_plus），可以看到 AI 寫 AI 基礎建設已經是現在進行式。

那 Ollama 跟 Osaurus 能不能用？

很多人跑本地模型用的是 Ollama 或 Osaurus（一個 Apple Silicon 原生的 AI 執行環境，底層用 MLX），而不是直接操作 llama.cpp。答案是：目前都還不行。

Ollama 的底層就是 llama.cpp，但它用的是自己打包的版本，TurboQuant 還沒被合併進 llama.cpp 主線。流程是這樣的：TurboQuant fork → 合併進上游 llama.cpp（預計 2026 Q3）→ Ollama 更新它的 llama.cpp → Ollama 開放 turbo cache type 設定。

Osaurus 的底層是 Apple 的 MLX 框架，路徑不同但一樣還沒到位：MLX TurboQuant 實作（社群已經有了）→ 合併進 mlx-lm → Osaurus 採用。

LM Studio、vLLM 也都有 feature request 開著，但都還沒落地。

所以現在唯一的路是直接用 llama.cpp 的 TurboQuant fork。

但這裡有一個門檻：你需要自己 build。

如果你沒碰過 llama.cpp，先搞清楚幾個東西：

llama.cpp 是什麼？一個用 C/C++ 寫的程式，專門在你的電腦上跑 AI 模型。Ollama 的底層引擎就是它。差別在於 Ollama 幫你包好了下載、管理、啟動——llama.cpp 是那個裸引擎。

.gguf 是什麼？AI 模型的檔案格式，就像 .mp3 是音樂檔，.gguf 是模型檔。裡面裝的是幾十億個數字（模型權重）。Qwen、Llama、Mistral 都會被打包成 .gguf 給本地推理用。你用 ollama pull 下載的其實就是 .gguf。

cmake 那串指令在幹嘛？把原始碼編譯成你的電腦可以執行的程式。就像把食譜（原始碼）變成一道菜（可執行檔）。DGGML_METAL 那個參數是告訴它"用 Mac 的 GPU"。

build 完之後你會得到 llama-server，它跟 Ollama 提供的 API 格式一樣（OpenAI 相容），所以你原本接 Ollama 的程式，改個 port 就能接上。

整個流程長這樣：

你輸入"你好"→ llama-server 收到 → 從 .gguf 載入模型權重 → 計算 attention（產生 KV Cache）→ KV Cache 用 TurboQuant 壓縮存在記憶體裡 → 回傳回應。

TurboQuant 不會改變模型本身，它只壓縮"對話過程中的記憶"。模型檔 .gguf 完全不變。

重點整理：

Ollama / Osaurus / LM Studio 使用者 → 等 2026 下半年，上游合併後就會支援。
想現在就用 → 自己 build llama.cpp TurboQuant fork，用同樣的 .gguf 檔案。
用遠端 API（Claude、ChatGPT）→ 跟你無關，提供者自己處理 KV Cache。
