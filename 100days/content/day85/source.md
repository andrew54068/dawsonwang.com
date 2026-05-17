Day 85 — 你的 OpenClaw 用 Claude 訂閱帳號安全嗎？

昨天在 OpenClaw meetup 分享了怎麼用 Claude 訂閱帳號搭配第三方工具，迴響蠻大的，今天把重點整理出來，也附上教學。

先講結論：如果你在用 OpenClaw 或任何第三方工具串接 Claude Code 訂閱額度，請不要用內建的 OAuth 登入方式。改用官方的 Claude Agent SDK，安全很多。我選擇用 SDK 加上不要把額度用的太極致的低調做法，目前也是這樣一段時間了。

為什麼不能用 OAuth？

OpenClaw 底層用的是一個叫 Pi Mono 的套件（badlogic/pi-mono），作者是 Mario Zechner。這套件本身功能很強大，是一個統一的 LLM 整合架構，可以串接 Anthropic、OpenAI、Google 等多家服務。

但問題出在它怎麼處理 Claude 訂閱帳號的認證。

我去看了 Pi Mono 的原始碼 https://github.com/search?q=repo:badlogic/pi-mono%20Stealth%20mode&type=code，裡面有一段程式碼的註解直接寫著 "Stealth mode"，翻譯成中文就是 "做壞事模式"。它做了什麼？

第一，偽造身分。它把 HTTP request 的 user-agent 改成 claude-cli/2.1.75，並設定 x-app: cli。意思就是：讓 Anthropic 的伺服器以為這些請求是從官方的 Claude Code CLI 發出來的，但實際上不是。

第二，偽裝工具名稱。它把所有的工具名稱都改成跟 Claude Code 一模一樣的命名——Read、Write、Edit、Bash、Grep、Glob⋯⋯。程式碼裡甚至還附了一個對照表，專門把自訂的工具名轉換成 Claude Code 的標準名稱。

說白了，這就是在欺騙 Anthropic 的伺服器。

那 OAuth 本身是不是非法的？嚴格來說不是。Anthropic 之前有提供 OAuth 給 CI/CD 的機器使用。但官方對於第三方工具透過 OAuth 存取訂閱額度的態度一直很曖昧。重點是，Pi Mono 做的不只是用 OAuth 拿 token，它還主動偽裝成 Claude CLI。這已經不是灰色地帶了，這就是明確的欺騙行為。

OpenClaw 剛出的時候滿多人的 Claude Code 訂閱帳號被封了。
被封的原因可能有兩種：
1. 繞過 Claude Code 的使用介面去直接存取 API 服務。不管你用的是 OpenClaw、OpenCode、Antigravity 還是什麼其他工具，只要它是透過訂閱方案拿到 OAuth Token 再直接打 API，就是在挑戰使用條款的界線。
2. 用太兇，額度都用好用滿，被系統檢測到異常使用。

那正確的做法是什麼？

Anthropic 官方認可的方式只有兩種：

1. Claude Agent SDK
2. Claude CLI Process（也就是 claude -p）

今天主要教大家第一種。

Claude Agent SDK 是 Anthropic 官方出的套件，讓你可以把 Claude Code 當作程式庫來用。你的程式碼透過 SDK 去呼叫 Claude，走的是官方認可的管道，不會偽裝成別的東西。

怎麼裝？

npm install @anthropic-ai/claude-agent-sdk

裝完之後先確認你的 Claude Code 已經登入 Pro 或 Max 方案。如果還沒登入，先在終端機輸入：

claude login

然後你就可以在自己的程式裡這樣用：

import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "幫我看一下這個專案的結構",
  options: { allowedTools: ["Read", "Glob", "Grep"] }
})) {
  if ("result" in message) console.log(message.result);
}

就這麼簡單。SDK 內建了 Claude Code 的所有工具——讀檔案、寫檔案、跑指令、搜尋程式碼，全部都有。你不需要自己實作工具執行的邏輯，SDK 會幫你處理。

如果你現在的專案已經用了 Pi Mono 來串接 Claude，建議趕快換掉。你甚至可以請 OpenClaw 自己幫你改——叫它把程式碼中透過 pi 套件串接 Claude Code 的邏輯替換成 Agent SDK。

值得注意的是，pi 本身的價值是讓你可以串接不同的 LLM 供應商。所以如果要請 OpenClaw 換，可以跟他說只有 Claude Code 的部分換成 Agent SDK，不要影響其他 provider。

如果目前你用官方的 OpenClaw 使用 Claude Code 訂閱也沒出事，你也可以評估是否要換做法，畢竟可能因此把目前能正常運作的東西搞壞，或是要麻煩身邊會用的人幫你處理。

免責聲明：
1. 昨天聚會大概有 1/3 的人也是直接用訂閱帳號串接 OpenClaw 也沒出事，身邊也有朋友用了一段時間也沒事，所以我也不是完全確定會出事。
2. 我也不敢保證換成 SDK 後就一定不會有事，畢竟上述提到的第二點——用太兇——還是沒有解法，不管是用 SDK 或是 claude -p 都一樣可以被偵測到，加上 Anthropic 的政策有可能隨時調整。但至少安全程度差很多。Pi Mono 的做法是主動欺騙伺服器，SDK 走的是官方管道。一個是翻牆進去，一個是走正門。

這篇不是瞎猜，這裡附上官方說明：
Anthropic 工程師 Thariq 在這篇推文裡有說明：https://x.com/trq212/status/2024212380142752025?s=20
以及附上 cab_late 大的文佐證：https://www.threads.com/@cab_late/post/DUFVt8MksUw?xmt=AQF09OfypJ8zUu49eOX_WO-UTaKXiDON5BY9G3y8tNBwSQ

最後整理一下什麼可以做、什麼不能做：

可以做的：
- 是個人專案，例如 OpenClaw 或是自製的版本
- Max 方案搭配 Agent SDK 來建自己的工具
- 用 claude -p 在腳本中呼叫 Claude

不能做的：
- 充當第三方軟體替他人提供服務
- 篡改 HTTP header 試圖欺騙供應商

祝大家都能安全地使用 Claude 訂閱帳號！