Day 137 蓋一個自己的網站，讓人找得到你

如果你做的東西想被陌生人看到、想讓潛在客戶 Google 得到你，光靠社群帳號不夠用。

最近常看到創作者帳號被莫名其妙封鎖、申訴要等好幾週甚至直接消失的案例。Threads、LinkedIn、IG 都是租來的房子——演算法什麼時候不推你、帳號什麼時候被鎖，你都沒得選。

有自己的網站就不一樣。帳號被封不影響你自己的網域，明天還是可以叫人來看 yourname.com。

就算你沒寫過 code，這篇講的選擇用 Claude Code 都做得到。

今天我把 dawsonwang.com 蓋好了，整個流程用 Claude Code（Anthropic 的指令列 AI 助手）帶著走。把過程中每一個「我需要 X，所以選了 Y」記下來。


需求一：要在網路上有自己的地址，而且要穩

這件事拆兩塊：你擁有的網址（網域，就是 yourname.com 這串），跟網址背後的伺服器（hosting，實際放網站檔案的電腦）。

網域選 Cloudflare Registrar 買 dawsonwang.com。

同樣的 dawsonwang，.ai 一年要 $80 美金，.com 只要 $10。8 倍價差買不到 8 倍記憶點，除非品牌本身已經有流量，不然 .com 還是最不用解釋的選項。

不在 GoDaddy 買的理由不是 GoDaddy 不好。如果是不確定會經營多久的 side project，GoDaddy 確實有第一年只要 1 元台幣的方案，先佔下來、之後再看狀況很合理。但他們的續約價通常高於市場行情，而且之後要轉移到別家又是一道工。長期經營的個人首頁，直接買 Cloudflare Registrar（用成本價、不加 markup）反而省心。

Hosting 選 Vercel（提供網站上線空間的服務）。把檔案存到 GitHub（程式碼託管平台）就自動部署，免費額度個人站綽綽有餘，Astro 官方有專屬 adapter（兩個工具之間的轉接頭），部署設定我幾乎沒碰。


需求二：要有頁面內容，有設計感又不能看起來像 AI 做的

個人首頁九成是靜態內容（介紹、作品、文章），剩一成才是表單之類的互動。選工具的方向是「內容優先、互動少」。

前端框架選 Astro 6 + Tailwind v4，不選 Next.js。

Astro 預設不跑額外的 JavaScript，內容頁面下載就是純 HTML，載入快、Google 搜尋也比較容易找到。Next.js 是設計來做複雜互動 app 的（像 SaaS dashboard），每頁都要帶 React 那一套執行環境，對純內容站太重。Astro 還把 Markdown 當一等公民——`.md` 檔案丟進 `src/pages/` 就自動變成一頁，省掉一堆設定樣板。Tailwind v4 是 utility-first 排版工具，幫你跟 Claude Code 約定統一的顏色字級規格，AI 寫出來的樣式不會東一塊西一塊。

設計這件事比較棘手。一開始我直接叫 Claude Code 幫我寫網站，出來的東西能用，但就是「AI 寫出來的網站」那個味道——配色普通、字級鬆散、按鈕長得跟 Bootstrap 教學一樣。

市面上的產品 Claude Design 目前最有設計感，又因為知道模型是死的，做出好看的大功臣其實是背後的提示詞，所以去找了一下他的 system prompt：

https://github.com/elder-plinius/CL4R1T4S/blob/main/ANTHROPIC/Claude-Design-Sys-Prompt.txt

我把這份 prompt 改一改，丟給 Claude Code 當做寫網站的設計準則。同一個 Claude，輸出風格立刻一致——不用再為了字級、顏色、間距跟它來回吵。

啟發：讓 Claude 用它自己被訓練過的設計語言，比你自己編一套規則更有效。


需求三：要能讓人聯絡你

頁面光看不夠，有興趣的人要能直接留訊息。這需要兩塊：

訊息要存到一個結構化的地方，所以需要一個小 DB（資料庫）。只丟 email 不夠——重要的線索很快會被埋在收件匣裡，也沒辦法標 follow-up 狀態、加備註，後續真的要回頭找某一筆訊息時會很痛。

而且新訊息要 push 通知，不能等我心血來潮才打開那份名單。

DB 選 Notion。Supabase、Airtable 都是好選擇——如果之後要做更正規的後台或有多人協作需求，Supabase 反而比較適合；但對個人首頁這種量，Notion free tier 寫不完，API（兩個程式互相講話的介面）接起來夠簡單，要回頭找某一筆詢問訊息、加 follow-up 備註的時候，Notion 的 database UI 比 SQL query 順很多。

而且這樣安排的話日常我只要顧 Gmail 信箱就好——Notion 不用每天去看，要回查或追蹤狀態時再打開就行。

寄信通知選 Resend。SendGrid 本身沒問題，企業級寄信功能更完整；但對個人站來說，Resend API 3 分鐘接好、文件清爽，SendGrid 那種設定迷宮是 overkill。

兩邊都接當雙保險：Gmail 收到就知道有新訊息，Notion 那筆 row 之後拿來追狀態，任何一邊掛掉，訊息不會掉。


成本與時間結算

固定支出：

- 網域（Cloudflare Registrar，dawsonwang.com）：$10 美金/年
- Hosting（Vercel Hobby tier，個人免費方案）：免費
- DB（Notion 個人版）：免費
- 寄信（Resend free tier，3,000 封/月）：免費
- 框架（Astro 6 + Tailwind v4）：免費 open source

一年總共大約 $10 美金，等於兩杯精品咖啡的錢。

實際投入時間 4-6 小時，半天搞定。Claude Code 帶著走的速度很快，大部分時間其實是跟 AI 對話釐清要做什麼，不是在寫 code。Notion + Resend 接到能跑那段花最久，DNS 驗證（證明這個網域是你的）跟 Notion 權限的細節第一次踩會懵。

真的不想碰技術細節，花一兩千塊請熟悉 Astro 的工程師幫你架一次也是選項。


下一步：今天就開始

1. 去 Cloudflare Registrar 註冊帳號，搜尋你要的網域看價格（不滿意可以先不買）
2. 開一個 GitHub repo，用 `npm create astro@latest` 或請 Claude Code 帶你開（Tailwind v4 之後請 Claude Code 加上）
3. 在 Vercel 註冊，跟 GitHub repo 串好
4. Notion + Resend 表單最後接，先把網站第一版內容寫好上線


收尾：別人找你的時候，要找得到

社群是讓人遇到你，網站是讓人想找你的時候有地方可以去。

dawsonwang.com 現在就放在那裡——有詢問表單、有作品連結、有我在做什麼的說明。下次有人聽說我，Google 一下名字，就能直接走進來。

這比任何履歷或自介都更省解釋成本。
