## 本日讀者定位

**本篇 TA 覆蓋全域設定。** 不適用 /target-audience.md 的非技術基礎 TA。

本日讀者：Claude Code / Codex 的 power user，符合以下任一條件：
1. 寫了太多 skill，context window 被白白佔用
2. 混用多個 LLM，想讓 skill 在各工具間共用

## 本日主題對讀者的意義

已經在用 Claude Code 或 Codex 並自己管理 skill 的使用者，可以用一套統一工具在多個 LLM 之間共享 skill，同時避免 context window 被用不到的 skill 白白吃掉。

## 讀者起點

- 知道 Claude Code 和 Codex 是什麼，也寫過或安裝過 skill
- 可能混用多個 AI 工具，但 skill 管理各管各的
- 對 bash 腳本和 CLI 有基本熟悉度
- 不一定了解 symlink（軟連結）的具體運作方式

## 需要翻譯的概念

- `symlink`（軟連結）→ 捷徑：指向真正檔案的「快速連結」，刪掉捷徑不影響原始檔
- `bullpen`（牛棚）→ 統一倉庫：所有 skill 的原始存放地，對外只透過捷徑曝光
- `context window` → AI 每次對話能「記住」的資訊量上限
- `fzf` → 終端機裡的互動選單工具
- `daemon` → 一直在背景執行的服務程式（本文提到「沒有 daemon」）
- `IPC` → 程式之間溝通的管道（本文提到「沒有 IPC」）
- `rsync` → 類似「同步複製資料夾」的命令列工具
- `reconcile` / `drift` → 同步/漂移：確認設定有沒有不小心跑掉

## 讀完之後讀者應該能

1. 用兩條指令裝好 skills-manager 插件，並在任何專案叫出互動選單
2. 知道需要在 CLAUDE.md 和 AGENTS.md 各加一條 rule，AI 才能自動走這套流程
3. 理解 bullpen + symlink 的核心邏輯：原始檔只放一份，多條捷徑決定哪個工具看得到
