Day 74 自製 Nano Banana 的 skill

Day 72 有提到 Agent Browser 不能操作需要登入的平台，但其實官方有相關的文件可以使用 CDP 連線既有的 Chrome，之前雖然有看到但沒試成功，在網友的提醒下終於搞定了，今天就來更新一下。

故事是這樣的：我想讓 Claude Code 自動幫我用 Gemini 網頁版生圖，但問題來了——Gemini 需要登入 Google 帳號。一般的瀏覽器自動化（Playwright、Puppeteer）都是開一個全新的瀏覽器，沒有任何登入狀態。要怎麼讓 AI agent 用"你已經登入的瀏覽器"來操作？

答案就是 CDP（Chrome DevTools Protocol）。

CDP 是 Chrome 內建的除錯協定，開發者工具（DevTools）就是透過它跟瀏覽器溝通的。Playwright 和 Puppeteer 都支援用 connectOverCDP() 連上一個已經在跑的 Chrome，這樣就能直接用你的 cookies、登入狀態、所有已開的分頁。

但實作的時候踩了一個大坑：Chrome 136 以後加了安全限制，如果你用預設的 profile 啟動 Chrome 加上 --remote-debugging-port=9222，它會直接拒絕，跟你說 "DevTools remote debugging requires a non-default data directory"。這是因為 Google 發現攻擊者會利用 remote debugging 竊取 cookies，所以收緊了限制。

一開始它的做法是把 cookies 複製到 /tmp/ 暫存目錄，但後來發現這樣做其實正好繞過了 Chrome 的安全保護——複製出來的 cookies 失去了 App-Bound Encryption，本機任何程式都能讀取。

正確的做法是建立一個專用的 debug profile：

1. 用 --remote-debugging-port=9222 --user-data-dir=~/.chrome-debug-profile 啟動 Chrome
2. 第一次打開時手動登入 Google（之後 session 會永久保存在這個 profile 裡）
3. Playwright 用 chromium.connectOverCDP('http://localhost:9222') 連上去
4. 拿到第一個 context（帶著你的登入狀態），開新分頁就能操作了

這個 debug Chrome 跟你平常的 Chrome 是完全獨立的兩個 instance，可以同時開，互不影響。

連上之後，我讓 Playwright 自動導航到 gemini.google.com，找到輸入框（contenteditable div），打字、送出 prompt，然後輪詢等圖片生成。這邊又踩了一個坑：Gemini 生成的圖片是從 lh3.googleusercontent.com 載入的，因為跨域的關係，用 canvas.toDataURL() 會被 CORS 擋住（tainted canvas）。最後用 Playwright 的 page.request.get() 才成功下載。

以上其實是在睡前請 AI 幫我想辦法解決的，沒意外的話是用 default 的 medium effort 完成的。跟 AI 討論的過程中，它甚至幫我做了一個獨立的 debug 版 Chrome——專門給 skill 用來連 Gemini 生圖的。第一次點開它用非 headless 模式登入 Google，之後就全部設定好了，後續都能自動執行。

了解它的做法並詢問了一些問題後，有把原本的資安疑慮解決

整個流程跑通後，我把它做成了一個 Claude Code skill（gemini-web-image），以後只要說"幫我用 Gemini 生一張圖"，Claude 就會自動執行整套流程：開 debug Chrome → Playwright 自動化 → 下載圖片 → 關掉 debug Chrome。平常的 Chrome 完全不受影響。

後來我又進一步迭代，讓它用 headless 模式（--headless=new）執行。這樣整個過程完全在背景跑，不會彈出任何瀏覽器視窗。因為 Chrome 的 new headless 模式跑的是完整的瀏覽器引擎，Gemini 那些 JS 重度的 UI 一樣能正常運作。唯一的限制是第一次登入 Google 還是要用有畫面的模式，但登入一次之後 session 就會保存在 debug profile 裡，之後全部都能 headless 執行。

這個技巧不只適用於 Gemini。任何需要登入才能操作的網站，只要在 debug profile 裡登入一次，之後 AI agent 就能用你的身份去操作。想像一下：自動幫你在 Notion 整理筆記、在 Linear 更新 issue、在 Slack 回訊息，都是可能的。

安全性方面，專用 debug profile 比複製 cookies 到 /tmp/ 安全得多——登入資料有獨立的加密保護，不會暴露在暫存目錄。但你還是等於把瀏覽器的控制權交給 AI，所以要確保你信任執行的程式碼，也要注意不要讓 agent 操作到敏感的帳戶設定。

今天的重點：
- 遇到問題先請 AI 幫你解決直到找出解法
- 成功後，請 /skill-creator 幫你把流程封裝成 skill，下次可以直接用

參考：https://developer.chrome.com/blog/remote-debugging-port