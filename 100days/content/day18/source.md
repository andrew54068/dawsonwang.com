Day 18 自製 Threads 發文機器人-7 爬蟲實作

今天研究了一下 Threads API，發現其實並沒有 endpoint 可以直接取得塗鴉牆（Feed）上的貼文，所以只剩下網頁爬蟲或是透過逆向分析 GraphQL 的方式來獲取資料。

目前先嘗試以網頁爬蟲的方式實作。由於我們的 Telegram Bot 是透過 Puppeteer 來控制瀏覽器，為了跳過繁瑣的登入流程，先使用 EditThisCookie 擴充功能將目前瀏覽器的 Cookie 匯出，再透過 Telegram Bot 把 Cookie 傳入。因為在 Docker container 內沒有圖形介面 (GUI)，我們利用截圖功能來確認頁面是否正常開啟。

![screenshot from docker container](attachments/day18-1.png)

確認截圖顯示正確頁面後，接著請 AI 協助分析 HTML 結構並提取貼文資訊。目前已能成功抓取貼文內容、作者、發文時間、按讚數及回覆數等資訊並存入資料庫。

![screenshot of table](attachments/day18-2.png)

明天可以嘗試透過分析 GraphQL 請求來取得資料，否則若單純分析 HTML，還需額外處理串文結構或不同類型的媒體附件問題，會比較繁瑣。