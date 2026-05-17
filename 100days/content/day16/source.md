Day 16 自製 Threads 發文機器人-5

這幾天遇到一些問題。首先是在申請 Threads API Key 時，發現我的 Meta Developer 帳號遭到限制。不知道是什麼原因，也一直找不到可以聯絡客服的方式。要處理恐怕得花幾個月的時間——沒錯，之前公司為了申請 Sign in with Facebook 的功能，等了至少兩年都還沒通過，甚至公司都收掉了，申請都還沒過......

既然這條路暫時不通，那就試試創另一個 Threads 帳號，卻發現一定要有 Facebook 帳號才能進 Meta Developer 申請 Threads API Key。而 Facebook 的帳號並非新創一個就能審核通過，於是只剩下一個方法：模擬網頁操作。透過登入後記住 Cookie 或是 Token 的方式來跳過登入驗證，這也是現在看到比較多人在 Threads 上分享的做法。畢竟不是所有人都想用 API 的方式來「海巡」（抓取資料），只是缺點是有機會被官方 Ban 掉，導致整個帳號消失，所以不能太頻繁地抓取資料以降低風險。

承接前幾天的 AI + SDD 開發方式，首先當然是要跟 AI 進行溝通，讓它提出問題來釐清我們心中的雛形，並給出選項，這樣我們就只要當選擇題點選即可。討論完後的成果應該要是 Gherkin .feature 的文件格式，反覆多執行幾輪就會有詳細的 Feature Files，接著就是跑 TDD 的紅燈、綠燈、Refactor 流程，讓它開始實作我們的功能。

我是用 Antigravity Manager 來整合多個 Gemini Pro 的帳號，讓 Claude Code 可以使用 Antigravity 的 Claude 額度，用完之後可以設定 Mapping 的 Model 切換模型。原理是 Antigravity Manager 幫你把調用模型的 Request 換成了其他模型的 Request，所以你表面上是在用 Claude Code，但背後服務的 Model 可以切換。又因為我們已經把詳細的文件生出來了，所以模型不需要很強大就都可以完成任務，甚至是 Claude Haiku 4.5 的模型就已經夠用了。

執行了一個下午，目前所有程式碼都不是出自我手，就有了以下的結果。明天來 Debug，希望明天就可以透過這個平台發文了！