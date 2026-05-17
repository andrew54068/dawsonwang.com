Day 42 Gemini 帳號被鎖，Claude Code 重回寶座

今天終究是遇到 Gemini Pro 帳號被鎖的問題了。最近已經幾天沒有跑龍蝦，昨天原本想要 Demo 給其他人看，結果隔天就發現被鎖了。看來過去使用 Antigravity Manager 這套方式已經不可行了，至少好消息是不用再跟這個工具纏鬥了。為了支援自動切換 Model，常常會跑出新的 Bug，總是要 rebase 到最新的節點，實在是很麻煩。今天被強制畢業後，發現網路上也是哀鴻遍野。

https://github.com/lbjlaq/Antigravity-Manager/issues/1822

之前因為 Gemini Pro 的額度相當大方，Gemini 3 Pro 也相當好用，所以我才一直沒有回去訂閱 Claude Code，因為我個人使用起來並沒有明顯感到差異。但現在被鎖之後，應該也不少人和我一樣被 Google 推去訂閱 Claude Code，恐怕這也是 Google 沒想到的吧 XD

借鏡 Antigravity Manager 提供的 Warm Up 功能，我查詢了一下有沒有人在 Claude Code 上做類似的事情。果不其然，有個老兄用 Telegram Bot 做出類似的控制功能。

思路其實就是讓我們「最頻繁使用的時間」盡可能橫跨 5 小時 CD 重置的時間。因為如果一直沒使用，計時器是不會自動開始倒數的（例如你有 8 個小時都沒用，它會在你開始用的時候才往後抓 5 小時，這其實變相浪費了一些額度）。

所以策略上，如果預計早上 10 點開始用 Claude Code 工作，我們可以往前推 3 ~ 4 小時觸發 Warm Up，讓我們可以在 11 點或是 12 點剛好遇到重置，這樣在密集的工作時間就可以享受到雙倍的額度。當然後來新增了一週的額度後其實用處就不大了，但對於使用額度不平均的人來說，這招還是可以稍微提升使用體驗。

https://dev.to/sleeyax/stop-wasting-hours-on-claude-code-pros-session-cooldown-4mak