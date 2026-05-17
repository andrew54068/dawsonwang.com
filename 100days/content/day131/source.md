Day 131 從 MCP 到 skill 再到 CLI——AI 用工具這一年多怎麼演進

昨天講 gws 怎麼幫我接住 Google 表單的最後一哩。今天往回退一步，講 AI 拿來 "用工具" 這件事這一年多的三個轉折——MCP、skill、CLI——以及為什麼這三個不是替代關係，是各解各的問題。

先講結論：MCP 解決 "AI 怎麼讀你的私人資料"，skill 解決 "AI 怎麼學某件事的步驟"，CLI 則把私有資料存取打包成現成工具，知識面靠 AI 自己讀 --help 就拿到——三者不是替代，是分工。下面從時間軸講。

——

最早 MCP（Model Context Protocol，模型上下文協定）出來，想處理 know how 跟私有資料的存取兩件事——但回頭看，私有資料才是 MCP 最不可取代的價值，know how 那塊後來被 skill 接走。

像你想讓 AI 查 Gmail，這就是私有資料——沒登入你的帳號，AI 再聰明也告訴不了你新信寫什麼。這種情境 MCP 很好用：MCP server 用你的帳號跟 Gmail API 講話，AI 透過 MCP 拿到你才能拿到的東西。

——

後來 Claude 把 know how 包裝成 skill。skill 是 prompt template + 操作守則，優勢是漸進式載入：要用到的時候才把那塊資訊塞進上下文，不會一開始就吃掉 context window。

那段時間網路上一波 "skill 取代 MCP" 的聲音很大。

但這群人忘了私有資料這件事——功能就在別人那邊，要互動還是得透過 API。skill 沒辦法替你登入別人的服務，這時候 MCP 還是直接。"MCP 載入時吃掉太多上下文" 這個老問題，後來也有解法。

skill 的確取代了部分的 MCP 情境，但不完全替代。

——

再往後，大家發現很多服務本來就有 CLI——gcloud、aws、gh 這些早就在，只是 AI 拿來用是這一兩年才比較成熟。CLI 等於是被官方完整包裝過的 API：自帶說明書（--help）、自帶 auth 流程、自帶錯誤訊息。

於是出現一個新組合：先在裝置裝好 CLI，再寫一個 skill 告訴 AI "這台機器有這個工具，遇到 Workspace 任務就用它"。

實驗結果（前幾天 "不要迷信 skill" 那篇講過）更有意思——你甚至不用寫 skill 把每個 sub-command 列出來，AI 看到 CLI 名稱自己會去 --help。

CLI 本身就是知識來源，skill 包一層反而多餘。

——

三層擺在一起，各解一個問題：

MCP："我帳號裡的東西，AI 怎麼讀"
skill："執行某件事的步驟，AI 怎麼學"
CLI：把 MCP 那層工具化，知識來源也內建——AI 自己會去問

實際工作場景常常是組合：
- 想讓 AI 操作你的 Workspace？裝 gws CLI（它包了 OAuth + API + 文件）
- 想讓 AI 學會公司獨有的流程（內部 review SOP、特殊命名規則）？寫 skill
- 想讓 AI 拿到只有你帳號才有的資料（公司內部 Slack、私有 Notion）？裝 MCP server

——

下次挑選工具的時候可以稍微有點概念哪個更適合你。

——

延伸閱讀：Day 128 "不要迷信 skill" 聊過為什麼有些 skill 不值得裝；Day 130 講了 gws 怎麼接 Google 表單。
