Day 127 Cowork vs. Claude Code CLI

身邊很多新手最近開始接觸 Claude，幾乎全部都是裝 Claude Desktop（桌面 app），不是 Claude Code（terminal 裡的 CLI）。我懂，點開就用、有對話框、不用設定，學習曲線低。如果你在用 Cowork 或 Claude Desktop，這篇是寫給你的。

Desktop 上大家最常用的模式是 Cowork — 可以跨檔案、跨 app 幫你跑任務 — Cowork 的 skill最近也被很多人介紹，看起來很強。

我想提醒一件事：CLI 上一樣的東西已經用了兩三個月。你在 Cowork 上看到的"新功能"，CLI 用戶大部分早就磨過，進入下一輪了。

具體在哪四件事：

——

第一件：CLI skill 比 Cowork 早兩個月

當你看到「Cowork 開始有 skill」這件事被介紹的時候，CLI 上的 skill 其實已經跑了兩個月。

兩個月差距不只是時間 — 是這段期間 CLI 累積了 plugin marketplace（像 App Store）、社群在分享、別人寫的 skill 你看一眼就拿來用。

——

第二件：Cowork 的 skill 很難裝，而且跟 CLI 的 skill 完全不互通

CLI 裝別人的 skill 是 `/plugin install <marketplace>/<skill-name>` 一行打完，大神寫的 skill 三秒就用上。

Cowork 自己做 skill 點一下「save skill」很直覺，但你要去安裝別人寫的 skill，路徑藏得很深，不是那麼好找。更重要的是：Cowork 和 Claude Code 的 skill 裝在不同路徑，不會自動共用。你在 CLI 裝好的 skill，Cowork 不會看到；反過來也一樣。想兩邊都能用，要分別安裝兩次。兩個生態是分開跑的。

——

第三件：CLI 早就有 agent team，Cowork 還沒有

CLI 上我們天天在用 subagent（Claude 派出去的分身）— Claude 主對話派一個 subagent 出去做事、subagent 跑完回報結果，主對話的記憶不會撐爆。

再進階一點是 agent team（多個 AI 分身互相辯論）— 多個 agent 彼此討論、用不同視角辯論，收斂出比單一 agent 更好的答案。一個 AI 負責產出 code、另一個專門挑毛病，互相對抗直到結果通過。

這個在 Cowork 上還做不到。Cowork 目前還是「一個 agent 幫你跨 app 做事」的階段，多個 agent 互相討論收斂的協作模式還沒有。

對 CLI 用戶來說，agent team 是家常便飯。

——

第四件：CLI 有 hook，可以在特定時機自動做事

Hook 簡單說就是：你寫一段命令，讓 Claude 在"特定時機"自動跑。

例如：

對話結束前，自動跑一遍驗證 — 確認剛剛說好要做的任務真的做完了，沒有跳掉。

對話結束後，把剛剛聊出來的東西整理成小抄 — 下次做類似事情時拿來複習，不用每次從零開始想。

CLI 支援一連串可以掛 hook 的時機：你送出訊息之前、Claude 用工具之前、用工具之後、整段對話結束前等等。每個時機你都可以掛一段你寫的事情上去，自動發生。

Cowork 上還沒有 hook 系統。所以"對話結束自動驗證"、"自動寫小抄留給未來的自己"這些事，Cowork 沒辦法做 — 你只能每次都手動。

——

不管是 Cowork 還是 Claude Desktop，其實都是呼叫同一個 Claude API，底層模型能力是一樣的，只是包裝不同。

Cowork 對標對象是 OpenClaw（龍蝦），讓 AI 可以協助你管理日常會在電腦上操作的事，但又沒有 OpenClaw 那麼強大。

這也不是說 Cowork 沒有用。如果你不寫 code，只想 AI 幫你在檔案、文件、app 之間跨來跨去做點瑣事，Cowork 設計給你的場景比 CLI 友善很多 — 介面好、不用 terminal、學習成本低。

但如果可以，我還是會強烈建議大家克服 Terminal 的障礙，你會看見新世界。

或是其實出一個 GUI 版本的 Claude Code 大家會更有興趣？
