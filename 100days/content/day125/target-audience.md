> OVERRIDE：本篇不繼承全域 /target-audience.md

## 本日讀者定位

對 CLI / 終端機已經熟悉的開發者或重度 AI Coding 使用者，特別是有兩台 Mac、會在外面用筆電遙控家裡那台跑長任務的人。已經在用 Claude Code，知道 session、context、permission 是什麼，會用 SSH，會看 .zshrc / .zprofile 但不一定知道差在哪。

## 本日主題對讀者的意義

讓你在外面用 Air 也能無縫接回家裡那台 M1 Pro 上正在跑的 Claude Code，不會因為合上蓋子、捷運斷網、進咖啡廳重連就把 Claude session 弄丟、context 重來。順便修掉 Mosh / SSH 找不到 Homebrew 命令的老坑。

## 讀者起點

- **知道**：SSH、tmux 大致用過、Homebrew、alias、知道 zsh 有設定檔但記不清誰先誰後
- **可能不知道**：Mosh 跟 SSH 差在哪、Tailscale 是什麼、為什麼 SSH 非互動 shell 不會載 .zprofile、`brew shellenv` 預設寫在哪、`tmux new -As` 的 `-A` 是什麼意思
- **痛點**：在外面遙控家裡 Mac 跑長任務時，掉線、context 重來、SSH 進去命令找不到

## 需要翻譯的概念

讀者已經是工程師，多數術語不需要白話化。但仍應在第一次出現時補一句作用說明：

- Tailscale → 「私有網路（不用設定 port forwarding，給每台機器一個跑到哪都連得到的位址）」
- Mosh → 「取代 SSH，網路斷掉自動重連、不會凍住」（原文已做到）
- tmux → 「把 process 包在裡面，斷線/關螢幕不會殺掉它」（原文已做到）
- `tmux new -As claude` → 可補「-A 表示 attach if exists, create otherwise；session 名 claude」
- `--dangerously-skip-permissions` / `--effort max` → 可補一句這是 Claude Code 的旗標，分別作用是什麼
- 互動 shell vs 非互動 shell、`.zshenv` vs `.zprofile` vs `.zshrc` → 這是文章的核心 payoff，已經有解釋

## 讀完之後讀者應該能

1. 在自己的 Air 上設一個 alias，無縫接回家裡 Pro 跑的 Claude Code session
2. 知道 Mosh / SSH one-liner 找不到 brew 命令時，是 `.zprofile` vs `.zshenv` 的差別，怎麼修
3. 理解這個修法的副作用範圍：以後所有 `ssh host 'brew xxx'` 都會吃到同一個 PATH
