今天開發時遇到一個奇怪的 bug。

一開始是 Telegram Bot 沒有反應，重新 `docker compose up` 後恢復正常，但過一陣子後，無論怎麼重啟都無效。檢查後發現似乎是連不到 Telegram Server，於是寫了個 script 測試，果然發現從我電腦無法連接 Telegram Server，但其他網路連線卻正常。

起初懷疑是 DNS 問題，將 DNS 換成 4.4.4.4 後，雖然連線變慢但暫時可以連上，不過過一陣子後又失敗了。嘗試開啟 VPN，也是僅能成功一陣子。

接著，我直接用瀏覽器開啟 `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe` 測試，是有成功回應的，在本地使用 `curl` 也成功。隨後我直接進入 Telegram Bot 的 container 內部測試，發現 `curl` 可以成功，但使用 Node.js 的 `fetch` 卻會失敗。

詢問 AI 後，它提到 local 的 `curl` 可能會走 VPN，但 Node.js 的 `fetch` 可能會繞過 VPN 直接連線（雖然這聽起來有點奇怪）。後來發現是我本地開啟了 Tailscale 導致本地無法使用 `node fetch`，關掉 Tailscale 後，本地的 `node fetch` 就恢復正常了。

但奇怪的是，Container 裡面的 `fetch` 依然無法成功，即使重新 build image 也不行。重點是，今天以前用同樣的方法都沒問題。雖然我有更換 Wi-Fi 環境，但嘗試讓 Mac 直接連接手機網路，Container 內的連線依然失敗，這真的非常詭異。

後來再次跟 Gemini 討論我的狀況。雖然同樣是用 Gemini 3 Pro，但網頁版似乎比 CLI 版更聰明。它推測問題出在 Alpine Linux 使用的 musl libc，其 DNS 解析器行為與標準的 glibc (Debian/Ubuntu/CentOS) 不同。Tailscale 或 VPN 只是讓問題「更容易」顯現，但即便在乾淨的網路環境下，Alpine (musl libc) 天生處理 DNS 的機制就存在缺陷。因為 Node.js 在解析網域時，預設會同時發出 IPv4 (A) 和 IPv6 (AAAA) 的查詢：

*   **Debian (glibc)**：它有一個很複雜的快取和排序機制（遵循 RFC 3484）。即使 IPv6 回應得比較快，如果它偵測到你的 Docker 容器根本沒有 IPv6 的路由能力（通常 Docker 預設關閉 IPv6），它會聰明地忽略 IPv6 結果，直接使用 IPv4。
*   **Alpine (musl)**：它的邏輯是「誰先回應就用誰」或者是「嚴格遵守標準」。Telegram 的 DNS Server 有 IPv6 紀錄。如果你所在的網路環境（即使是手機熱點或家用網路）的 DNS Server 回傳了 IPv6 地址，musl 就會老實地把這個 IPv6 地址丟給 Node.js。
    *   **結果**：Node.js 拿到 IPv6 地址試圖連線，但 Docker 容器內部網路其實不通 IPv6，於是連線請求就像丟進黑洞一樣，直到超時（ETIMEDOUT）。

最後把 Base Image 換成 Debian 版本就順利解決了。

至於最大的疑問是：「怎麼會昨天是好的，今天就壞了？」

後來才發現，這是因為我重構專案，將 Telegraf 換成了 Grammy 才出現的問題。由於之前有其他專案使用 Grammy + Alpine 都相安無事，所以第一時間也沒懷疑是因為更換套件而造成這種奇怪的狀況。

其實第一次跟 AI 討論時，我曾請它用 `git bisect` 檢查問題，但它很肯定地跟我說：「It is not a code issue (which is why git bisect wouldn't help)」。現在回想起來，如果當時我堅持用 `git bisect` 去排查，應該就能更快找到問題核心了……