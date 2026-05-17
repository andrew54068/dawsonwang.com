> OVERRIDE：本篇不繼承全域 /target-audience.md

## 本日讀者定位

本篇介紹 OpenAI 推出的 codex-plugin-cc——一個裝在 Claude Code 裡、可以直接呼叫 Codex 的官方 plugin。內容大量涉及 slash command（`/codex:rescue`、`/codex:adversarial-review`、`/plugin install`）、subagent、background job、model 切換等開發者操作。

目標讀者：Claude Code 的活躍使用者（開發者、AI 內容工作流重度使用者），且至少聽過 Codex CLI、考慮過或正在使用兩邊工具。完全零技術背景的一般使用者不是本篇 TA。

## 本日主題對讀者的意義

不用切換 terminal、不用維護兩套指令風格——在 Claude Code 內就能借用 Codex 的不同模型、不同視角，把單一 AI 工作流升級成雙 AI 互相補位。

## 讀者起點

- 知道 Claude Code 是 Anthropic 的 CLI / coding agent
- 知道 Codex 是 OpenAI 的 coding agent（可能用過、也可能只聽過）
- 熟悉 slash command（`/foo`）跟 plugin 的概念
- 看過 Day 120 的雙訂閱策略（$100+$100），但不一定記得細節
- 不一定知道：plugin marketplace、`codex:rescue` 跟 `codex:codex-rescue` 的 subagent 命名差異、`gpt-5.3-codex-spark` 是什麼、`--background` flag 的行為

## 需要翻譯的概念

- plugin / plugin marketplace → Claude Code 的擴充套件市集，跟 VSCode extension 同概念
- slash command → 在 Claude Code 對話框打 `/xxx` 觸發的快捷指令
- subagent → 主 agent 底下分工的子代理人，名字跟 slash command 不一定一樣
- delegate → 把任務「外包」給另一個 agent 跑
- adversarial review → 對抗式審查，不是抓 bug，而是質疑「這個方案本身對不對」
- `--background` → 讓任務在背景跑，不卡住當下對話
- `--model spark` → 切換到 OpenAI 的另一個模型版本（gpt-5.3-codex-spark）
- dispatch → 把每張投影片分派給不同的 Codex job 並行處理
- monorepo → 把多個專案放在同一個 git repo 的做法
- CP 值 → 性價比（這個是中文用語，不需要翻譯）

## 讀完之後讀者應該能

1. 知道 codex-plugin-cc 的安裝三行指令，並理解這是 OpenAI 官方出的
2. 區分 `/codex:rescue`（外包任務）、`/codex:adversarial-review`（質疑設計）、Codex 圖片生成這三種使用情境
3. 判斷自己的工作流是否值得多花 ChatGPT $20 解鎖這個組合
