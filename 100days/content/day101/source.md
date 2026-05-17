Day 101 — 從網頁到 Mac 劉海，工具一直在找新的落腳點

前幾天在 GitHub 上看到一個叫 Open Island 的專案（https://github.com/Octane0411/open-vibe-island），點進去看了一下，覺得滿有意思的。

不是因為它的功能多特別，是它讓我想到一件事——應用程式住的地方，這幾年一直在搬家。而且搬家的方向滿有規律的。


【應用程式住的地方，一直在變】

回頭看過去十幾年，軟體的生存空間其實變過很多次。

最早大家都在網頁上做。前端後端一整套，瀏覽器打開就能用。那個年代「做應用」幾乎等於「做網站」。

後來智慧型手機起來，原生 App 變成主戰場。iOS、Android 一人一套，大家的注意力從桌面螢幕轉到口袋。

再後來發現，瀏覽器可以擴充。Chrome extension 突然變成一個小生態——翻譯、截圖、密碼管理、標籤頁整理，全部直接附加在你已經在用的瀏覽器上，不需要再打開一個獨立的 App。

接著 VSCode 熱起來，VSCode extension 變成另一個生存空間。開發者 80% 的注意力都在編輯器裡，所以做在編輯器裡的工具天然就離使用者最近。GitHub Copilot、各種 AI 補全、各種 linter，全都住在這。

然後是 macOS 的 menu bar——右上角那一排小圖示。日曆、剪貼簿管理、網路監控、快捷筆記，越來越多工具選擇把自己變成 menu bar 上的常駐小應用。不需要一個完整視窗，點一下就能看。

現在——連 Mac 的劉海都變成應用程式的家了。


【Open Island：一個住在劉海裡的 AI coding 控制台】

Open Island 做的事情其實很具體：它是一個 macOS 原生 App，把 Mac 的劉海（或沒劉海的機型就是頂部 bar）變成 AI coding agent 的即時控制台。

它在那個位置顯示的東西包括：
→ 目前有幾個 AI coding session 正在跑
→ 誰在等你批准權限（Claude Code、Codex、Cursor 都有 hook 整合）
→ 點一下就能跳回對應的 terminal 或 IDE
→ Token 使用量追蹤

目前支援的 agent 包含 Claude Code、Codex、Cursor、OpenCode、Qoder、Qwen Code、Factory、CodeBuddy 這八個。terminal 和 IDE 那邊則有 Terminal.app、iTerm2、Ghostty、WezTerm、tmux、Zellij、VS Code、Cursor、Windsurf、JetBrains 系列。

而且它是：
→ 完全開源（GPL v3）
→ 本地優先，沒有 server、沒有遙測、沒有帳號
→ 原生 SwiftUI + AppKit，不是 Electron 包一層
→ 簽名加公證過，下載 DMG 就能跑

它的定位是 Vibe Island 的開源替代品。Vibe Island 是付費商業產品，Open Island 的口號是："You don't need to pay for a product you can vibe, since you are a vibe coder."


【實際用起來，真的有差】

我裝起來用了一下，體感意外地好。

過去我同時開好幾個 Claude Code session 的時候，最常踩的坑是——忘記哪個視窗正在等我批准。有時候 agent 卡住了我還不知道，要翻好幾個 terminal 才找到那個在等輸入的 session。

現在這些訊息直接長在劉海那個位置。眼睛掃過去就看到，不需要切視窗。再點一下就跳回對應的 terminal。

那個體感就是——劉海這個位置本來就該被拿來用，只是以前沒人拿來放正經工具。

仔細想，劉海有幾個很適合當工具常駐位的特性：

1. 永遠在視野範圍內——不管你開編輯器、瀏覽器、terminal，螢幕頂部永遠都在那裡
2. 它本來就是廢空間——notch 那塊區域以前根本是被硬體擋住的死角
3. 非侵入式——不會遮住你正在寫的程式碼，但又夠顯眼讓你知道有事情發生
4. Apple 自己用 Dynamic Island 在 iPhone 上示範過，大家都已經熟悉這個互動模式怎麼用

iPhone 其實走在前面。Dynamic Island 出現之後，凹槽從一塊被動的缺口變成一個可以放資訊的位置。同樣的設計思維擴散到 macOS，是滿自然的一件事。

Open Island 這種小專案看起來不起眼，但它背後的方向是對的。我猜接下來還會有更多人把工具往劉海上搬，因為那個位置的設計限制——小、常駐——其實非常適合現在 AI coding agent 這種"背景跑、偶爾需要你注意一下"的工具類型。
