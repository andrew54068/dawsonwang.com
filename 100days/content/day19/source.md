Day 19 工具升級篇

今天先把重點放在工具的升級上。我相信很多人一定都有「額度焦慮」，總覺得付了錢卻沒把 AI 額度用完很浪費。想要認真用 Claude Code 的時候（例如 **ralph-loop** 時）就會大量消耗 Token，而忙其他事情的時候，又沒有把付費帳號用到極致，感覺虧了！今天就先來解決這件事 (搓手)。

之前分享過我的配置是：Gemini Pro + Antigravity Manager + Claude Code。因為現在開發導入了軟體工程方法論，模型對我來說差別不大。雖然還是以 Claude 優先，但如果額度用完，我不介意切換用 Gemini Pro。所以我的目標不只是把多個帳號的 Claude 額度用完，而是要讓多個帳號的 Model 額度都用到極致。理想情況是優先把多個帳號的 Claude 用完後，就自動換成 Gemini Pro。

所以我先看了一下 Antigravity Manager 的 **GitHub** repo 的新功能以及 PR，看有沒有符合我的需求，如果沒有的話就只能「自給自足」了。結果目前在 https://github.com/lbjlaq/Antigravity-Manager/pull/465 看到一個 PR，似乎在 Model Router 新增了一個 strategy pool，只是 UI 有點醜 XD，而且又因為有 conflict，最後不見得會被 merge 進去。

因此，我打算基於這個 PR 來改一版，並且把一些新功能加一加。可以暫時先 fork 一個版本，把這些修改放在一個 branch 裡面，方便之後可以 sync 最新的功能。修正後看起來如附圖，在 strategy pool 那邊設定：
Strategy ID: claude-4.5-fallback
Candidates: claude-sonnet-4*, gemini-3-pro
按 save 後就可以在 series groups 那邊選到這個 strategy id，意思是當第一個 model 用完額度後，就會自動換到第二個 model。
https://github.com/andrew54068/Antigravity-Manager/tree/feat/routing-strategy 大家可以試試看這個 branch feat/routing-strategy

credit to mikewong23571