Day 109 Vibe Coding 作品要如何 demo 給別人看？兩個指令就搞定！

Claude Code 跑 30 分鐘，一個能動的小東西就在 localhost 上活起來了——然後你卡在下一步：怎麼讓朋友實際點進去玩玩看？

這是 vibe coding 時代最詭異的落差。生出一個 MVP 現在只要 30 分鐘，但「把它拿給別人看」這件事常常花掉一個下午。

先解釋一下卡在哪：vibe coding 完的東西通常都在本地跑（localhost:3000、localhost:8000 之類的）。直接丟連結給朋友，他只會看到「無法連線」——因為他的 localhost 指的是他自己那台機器。

要能對外分享，正式流程是「部署」到雲端伺服器（GCP、AWS，或輕量的 Vercel、Netlify、Zeabur）。原因是你打開 google.com，背後是你的電腦打一個請求到 Google 某台「永遠開機 + 有公開 IP」的機器。你的筆電兩個條件都不符合：會睡眠、IP 會變、家裡 wifi router 還把外部連線擋在門外。

但就算丟上 Vercel 這種輕量平台，對一個只想被玩 10 分鐘、驗證「這想法到底有沒有人要」的東西來說還是太麻煩——環境變數、build 設定、資料庫 URL 全部要處理一遍。那個下午就沒了。

如果只是為了 demo，把筆電當成暫時的伺服器就相對合理：開 tunnel，不用部署，在本地跑一條通道到雲端，拿一個公開 URL 就結束。朋友點開、你這邊 localhost 還是原本那個，程式改完存檔對方重整就看到。30 秒搞定。

我以前一直用 ngrok，這週才發現 Cloudflare 也做一樣的東西——而且一行指令、免費、沒警告頁、限制還少得多。中文圈叫 Cloudflare「賽博菩薩」不是沒有道理。


【tunnel 到底是什麼、怎麼運作？】

原理比想像中簡單：

1. 你在本地跑一個 agent（cloudflared、ngrok CLI）
2. Agent 主動從你電腦「往外」連到雲端伺服器，建立一條持續的加密通道
3. 雲端分配一個公開 URL（例如 `https://abc.trycloudflare.com`）
4. 外面有人點開 → 請求先到雲端 → 雲端透過通道送進你電腦 → localhost 處理完、回應走原路

關鍵在「主動往外連」。Router 預設擋外面打進來（不然太不安全），但從裡面往外連都放行（不然你根本連不上 Google）。tunnel 就是利用這個不對稱性：agent 打一通長連線出去，後續流量都走這條既有的路。

結論：你不用改 router、不用租公開 IP、不用部署——筆電還是那台會睡眠的筆電，但只要 agent 連線還在，你就等同有一個公開 URL。關機 tunnel 就斷，再開就重建一條新的。


【那資安上要注意什麼？】

tunnel 方便，但一開出去就等同把 localhost 掛到公開網路上。幾個坑先知道：

1. 網址隨機不等於密碼：外面人猜不到，但網址只要一外流（截圖、群組、瀏覽器歷史、Referer header）就等於全公開。別當驗證機制。

2. 沒有預設 auth，所有路由全暴露：dev server 有什麼外面就看得到什麼——`/admin`、`/debug`、`/api/*`、Prisma Studio、Adminer 全部。開 tunnel 前先看一眼自己 serve 了哪些 endpoint。

3. 會呼叫付費 API 的話小心被刷:後端有打 OpenAI / Anthropic，別人知道網址就能狂打消耗你的 credit。Demo 結束馬上關，或加個簡單 token 檢查。

4. provider 看得到明文流量：TLS 到 Cloudflare / ngrok 邊緣就終止，他們技術上看得到內容。Demo 沒差，但真實用戶資料、密碼、支付資訊就不該走 quick tunnel。

5. 不要拿來跑 production：TryCloudflare 官方寫明「no SLA、no uptime guarantee」。

簡單原則：demo 結束就關；要長期對外就改用 named tunnel + Cloudflare Access（可加一層 Google / GitHub 登入才准存取）。


【Cloudflare Quick Tunnel 快速上手】

不需付費、不需域名、不需 cloudflared login，最低成本長這樣：

```
brew install cloudflared
cloudflared tunnel --url http://localhost:8000  # 看你本地開發用哪個 port
```

跑起來會印出一個類似這樣的臨時網址：

```
https://amazing-foo-bar-baz.trycloudflare.com
```

走 HTTPS、有 Cloudflare 證書、沒有警告頁，點開就是你的 demo。底層是 cloudflared 對 Cloudflare 邊緣建一條外連的 QUIC/HTTP2 連線，把 request 反向 proxy 回 localhost——所以家裡防火牆不用開任何 port。


【Quick Tunnel 的四個隱形限制】

把官方文件翻完，quick tunnel（`--url` 那種無帳號版本）有下面這些明文寫的限制：

1. 200 個 concurrent in-flight request 上限，超過直接回 429。一個朋友點幾下不會撞到，但被丟到大群組瞬間湧入就會卡。

2. 不支援 Server-Sent Events (SSE)。這條對 vibe coding 做 AI 應用的人超關鍵——你刷一個 chatbot 要 demo，後端用 SSE 串 LLM token（OpenAI / Anthropic SDK 預設就是 SSE），quick tunnel 直接擋掉。朋友那邊會看到卡幾秒、一坨 buffer 一次吐出，沒有逐字效果。WebSocket 倒是可以（文件沒禁）。

3. 子網域每次重啟都變。對短暫 demo 沒差，但對 webhook（Telegram / LINE callback URL）每次都要重設一次很煩。

4. 沒有 SLA、不保證 uptime。Cloudflare 明確說這層是「meant to be used for testing and development, not for deploying a production website」。

補充：如果 `~/.cloudflared/` 已經有 `config.yaml`（之前設過 named tunnel），quick tunnel 就跑不起來。


【真的要長期用就升級到 Named Tunnel】

對個人 vibe coder 來說，一個 .xyz 或 .dev 域名（一年幾百塊）+ Cloudflare 免費 plan，就能取代 ngrok 所有付費功能。


【所以要怎麼選？】

我現在的分類：

- 純 demo 給朋友看 30 秒：`cloudflared tunnel --url`，用完就關
- 長期保留的小工具 / webhook 接收器、想要固定網址：Named Cloudflare Tunnel + 自己的域名
- AI chatbot 要用 SSE 串流：一定要 named tunnel，quick tunnel 會讓你 debug 到懷疑人生
- 要 TCP / 非 HTTP 協定：cloudflared quick 只支援 HTTP/HTTPS——這場合 ngrok 還有位置（付費版才支援 TCP；UDP 所有版本都不支援，需改用 Tailscale 等方案）
- 不想設定域名又要穩定 URL：乖乖付 ngrok 月費（$8），或看 Tailscale Funnel（day107 寫過的延伸，對端不用裝 Tailscale）
