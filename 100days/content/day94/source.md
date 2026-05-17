Day 94 Claude Code 的秘密——第三方套殼時代正式終結了嗎？

結論先行：龍蝦還是可以用 Claude Code 訂閱的額度，只是要用對方法

之前其實一直搞錯，以為 Claude Code 是用 Agent SDK 打造出來的應用，但其實 Agent SDK 才是那個依賴於 Claude Code 的應用。

Agent SDK 其實就只是召喚 Claude Code 的一個介面而已，Claude Code 親自處理 Auth，所以驗證也由 Claude Code 自己負責。

搞清楚這個關係之後，最近發生的幾件事就更有意思了。

隨著 Claude Code 最近的洩漏事件，根據這篇 Threads 貼文（@dustin_gmat）https://www.threads.com/@dustin_gmat/post/DWqWHg4jwhR?xmt=AQF0ZASmnXrYw2FsUMymSzYoY4goTuj9OpR_I0DKwGKqRg 所述，已經有人研究 Claude Code 跟 Claude server 溝通的驗證機制。但可以預期的是，Claude Code 只要之後改了機制，再搭配強制更版，就可以有效抓出那些偽裝身份的工具。

而且 Anthropic 今天也正式寄了一封 email（附圖），主旨是 "Using third-party harnesses with your Claude subscription"：

從 4 月 5 日凌晨 3 點（UTC+8）起，你的 Claude 訂閱額度將不再涵蓋第三方套殼工具的使用，包含 OpenClaw 等。

注意：這不是說你不能繼續用 OpenClaw，而是你的訂閱方案額度不能再拿來用了。如果還是想繼續用，需要額外開啟 "pay-as-you-go" 的計費選項，費用與訂閱分開計算——本質上就等同於直接付 API 費用。

訂閱本身還是包含官方產品，例如 Claude Code 跟 Claude Cowork。

這邊有個很多人在問的問題：Agent SDK 呢？自己在本地跑的工具算嗎？

Eric Buess 直接在 X 上問了 Boris Cherny（Claude Code 的核心開發者）："用訂閱包的 Claude Code、Claude Code headless、Agent SDK 這種本地工具還是可以用吧？" Boris 回答："對，我們正在把說明寫得更清楚。"

https://x.com/EricBuess/status/2040207443636973927?s=20

所以自己用 Agent SDK 在本地搭工具、或是用 Claude Code headless 跑自動化，這些都還在訂閱範圍內，不受影響。

這個政策看起來就像是在拉出一條線：Anthropic 要把官方生態跟第三方套殼徹底切開。一邊是他們自己控制驗證的官方工具，一邊是需要另外付費的第三方包裝。

那這條線到底劃在哪？為什麼 OpenClaw 算第三方？自己照著 Agent SDK 刻的工具算不算？

我覺得差別在於：這些工具有沒有合法地透過官方 Agent SDK 去整合。

之前分享過，很多開源專案為了要同時支援各家 LLM，會使用一個叫 "pi" 的套件。這個套件的原始碼開宗明義就寫了——它是在偽裝成 Claude Code、欺騙 Claude server。

這就是貓捉老鼠的遊戲。今天沒事，不代表明天還能繼續跑。而且被抓到的代價可能是帳號直接被封。

況且 Anthropic 已經直接點名 OpenClaw 了，代表他們是有機制可以辨別 "pi" 這種偽造方式的。

OpenClaw 裡面的 "pi" 也是呼叫 Claude Agent SDK 沒錯，但它偽裝成 Claude Code。只要拿掉那些偽裝的程式碼，就可以繼續用訂閱的額度。如果沒有要用其他模型的需求，也可以乾脆直接把 "pi" 移除，單純接上 Claude Agent SDK，就變成了你自製的工具，從非法變合法了。

當然如果 Anthropic 真的是鐵了心要 ban 龍蝦，他們還是可以分析龍蝦的使用模式，那不管是用 claude -p 還是 agent SDK 都沒用了。

不過同一時間 Anthropic 也釋出了一個補償：為了慶祝 usage bundles 上線，他們給符合條件的訂閱者一筆等值訂閱金額的一次性額外用量額度：

- Pro：$20
- Max 5x：$100
- Max 20x：$200
- Team：$200

領取條件：在 2026 年 4 月 4 日凌晨 12 點（UTC+8）前已訂閱，且有開啟 extra usage 功能。領取期限是 4 月 3 日到 4 月 17 日，過期就無法再領。

領法很簡單：進 Settings > Usage，看到 banner 上的 "Claim" 按鈕按下去就好，不會扣你的信用卡。額度效期是領取後 90 天，可以用在 Claude、Claude Code、Claude Cowork，還有第三方工具。

換句話說，這筆贈送的 credit 就相當於 pay-as-you-go 的 API 額度，剛好可以拿來過渡這次政策的切換期。

如果你還沒收到這封信，或是還沒看到 Claim 按鈕，先別緊張——他們可能是批次釋出，再耐心等一下就好。

用 "pi" 偽造身分、蹭訂閱額度的時代，才是真的要結束了。

本文綜合自：
https://www.threads.com/@bobo52310/post/DWsGwRGD3lJ
https://www.threads.com/@cab_late/post/DWs5wfnFLfS

#ClaudeCode #Anthropic #AgentSDK #AI工具
