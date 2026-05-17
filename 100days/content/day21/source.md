Day 21 自製 Threads 發文機器人-8 取得塗鴉牆貼文

昨晚為了搞定 Antigravity Tools 的發布弄到超晚，一直鬼打牆，後來才發現是要手動建立 Release 才會吐出 .dmg 檔，而且 Cask 設定檔還得跟軟體名稱對上才行。不過修正後，終於能順利透過 Homebrew 安裝了：

brew tap andrew54068/antigravity-manager https://github.com/andrew54068/Antigravity-Manager

brew install --cask andrew54068/antigravity-manager/antigravity-tools

搞定工具後，終於可以回頭來處理 Threads 貼文抓取了。之前雖然已經能用 Headless Browser 硬抓，但這種依賴 HTML 結構的做法只要改版就容易壞掉，而且要處理各種媒體附件（圖片、影片、串文等）也挺麻煩的。如果能直接用 GraphQL 拿到原始資料，就能跟畫面結構脫鉤，不只穩定還能少維護很多程式碼。

睡午覺前，我使用了 /ralph-loop 這個會反覆執行直到完成的指令。「工欲善其事，必先利其器」，這就是為什麼要將 Antigravity Manager 升級成可以自動切換 Model 的版本，這樣在面對需要長時間或消耗大量 Token 的任務時，才有足夠的資源。因為我有兩個付費的 Gemini Pro 帳號，加上 Claude 4.5 及 Gemini 3 Pro，共有四個額度可以使用。

指令格式如下：
/ralph-loop:ralph-loop "請 AI 幫忙研究要如何用 GraphQL 來取得塗鴉牆貼文，並請他自己驗證直到可以取到資料為止" --completion-promise "DONE"

這裡有些小細節，/ralph-loop:ralph-loop 需要在一開始輸入才會觸發 Slash Command 的推薦功能，這時候按 Tab 就可以自動補齊；若是先輸入了 Prompt 後再回到最前面輸入，就不會出現自動補齊的選項。
再來是一定要在最後加上 --completion-promise "DONE"，這樣 AI 才會知道何時該停下來。之前我以為那是 Optional 的，結果睡了一覺醒來它還在執行，而且只是一直更新嘗試次數，沒做任何其他事情。
Ralph Loop 其實只是把每次嘗試的結果用同一個 Markdown 文件紀錄，其中包含嘗試次數及目前狀態是否完成，以此判斷是否繼續執行。當然，指令也有參數 --max-iterations 來限制最多嘗試次數，以控制 Token 用量。因為有些人是使用 API Key 來執行 Claude Code，若未加限制，帳單可能會很可觀。

午覺醒來後，發現它還是沒有達成任務，因為我沒有提供足夠的資訊（例如 API 範例），除非它有辦法自行開啟 Browser、存取所有網路請求並過濾出我們要的塗鴉牆貼文。所以算是我給的線索不足，它無法完成也合情合理。這時給它一些提點就能解決這個障礙：首先，網頁取得資料的方式就是呼叫 API，而在請求資料時，頂多在 Request Header 中加入身分驗證資料，並沒有什麼黑魔法，我們只要找出哪些是關鍵的 Token 或 Cookies 並模擬這些行為即可，這部分可以交由 AI 幫我們實驗得出，最後終於得出我們要的結果。

因為今天的任務是研究如何用 GraphQL 取得塗鴉牆貼文，跟 Feature File 關聯較小，所以不用以 SDD 為出發點，直接請 AI 研究並整合進原本的流程，最後再請它幫忙更新 Feature File 即可。