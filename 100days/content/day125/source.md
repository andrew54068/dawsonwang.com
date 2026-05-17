Day 125 把家裡的 Mac 變成 Claude 主機，用 Air 遙控

我的 MacBook Air M3 出門會跟著我跑，蓋上螢幕、離開咖啡廳、捷運上掉線都是常態。但我希望 Claude Code 那邊正在跑的長任務不要被打斷，也不要每次連回家網路再從零拉一次 context。如果你也有兩台 Mac、想在外面用 Air 遙控家裡那台跑 Claude Code 長任務，這篇是給你的。

解法其實不複雜：把家裡那台 M1 Pro 當主機，Air 只是一個遙控器。

整個流程需要三套軟體：

- Tailscale：家裡跟外面的私有網路，給 Pro 一個跑到哪都連得到的位址
- Mosh：取代 SSH，網路斷掉自動重連，不會凍住
- tmux：把 Claude Code 包在裡面，蓋上螢幕、斷網都不會殺掉 process

在 Air 上設定一個 alias 就搞定：

```
alias claude-remote='mosh dawson@dawsons-macbook-pro -- /opt/homebrew/bin/tmux new -As claude "claude --dangerously-skip-permissions --effort max"'
```

幾個旗標稍微解釋一下：tmux 的 `-A` 是 "有同名 session 就接回去、沒有就開新的"、`--effort max` 把 Claude 的思考預算拉滿、`--dangerously-skip-permissions` 是免每次按確認。`/opt/homebrew/bin/tmux` 這個絕對路徑是暫時 workaround，下面修完 PATH 之後可以拿掉。

在新分頁打 claude-remote，就直接落在 Pro 上正在跑的 Claude session 裡。要離開不要按 Ctrl-C（會把 Claude session 整個殺掉），按 Ctrl-b d（d 是 detach）暫時退出 tmux，背景繼續跑。下次回來再 claude-remote，無縫接回去。

這套搞起來不順的地方不是 Tailscale 也不是 Mosh，是 PATH。

我裝完 mosh，Air 連過去一直噴 mosh-server: command not found。SSH 進 Pro 手動 which mosh-server 又找得到。同一台機器、同一個帳號，怎麼會差這麼多？

原因是 SSH 跑非互動 shell 的時候，zsh 只會 source ~/.zshenv，不會 source ~/.zprofile。而 macOS 用 Homebrew 預設 brew shellenv（把 /opt/homebrew/bin 塞進 PATH 的那一行）是寫在 ~/.zprofile 裡——你開 terminal 看得到 /opt/homebrew/bin，因為那是互動 shell。Mosh 從外面打進來的那條路根本沒載到。

改法兩種選一：

- 把 brew shellenv 從 ~/.zprofile 搬到 ~/.zshenv
- 兩邊都寫也沒差，重點是 zshenv 要載得到

修完之後 mosh-server、tmux、claude 全部都找得到，alias 也不用再寫 /opt/homebrew/bin/tmux 那種絕對路徑硬塞。

這個坑不只影響 Mosh。你以後任何 ssh m1pro 'brew xxx' 之類的 one-liner，全部都吃同一個 PATH 規則。一次修，後面都受惠。