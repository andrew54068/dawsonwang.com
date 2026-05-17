## 本日讀者定位

基礎：見 /target-audience.md

> 注意：本篇內容實際上是寫給**已在使用 Claude Code 的開發者**，不是全域的非技術讀者。這是本篇最大的 TA 張力，需在稿件中處理。

## 本日主題對讀者的意義

這篇對非技術讀者幾乎沒有入口——內容是「我從 Claude Code 換到 Codex 的踩坑筆記」，讀者需要先知道 Claude Code 是什麼、會自己設定 config 檔、懂得 skill/hook/subagent 等概念，才能接收文章的資訊。

若要讓全域 TA（非技術使用者）有收穫，需增加一段「沒在用 Claude Code 的人，這篇對你的意義是：AI 工具也開始要做跨工具整合設定了，以後這會是基本技能」。

## 讀者起點

**實際讀者（開發者）**：已使用 Claude Code 一段時間，聽說或嘗試過 Codex，想知道值不值得換或怎麼混用。

**全域 TA（非技術）**：不知道 Claude Code 是什麼，更不知道 Codex 是另一套工具，看到 `~/.claude/rules/` 這類路徑會直接跳過或關掉。

## 需要翻譯的概念

- `CLAUDE.md` / `AGENTS.md` → 就像切換工具時要改的「說明書檔案」，告訴 AI 助理你的規則
- `~/.claude/` / `~/.codex/` → 工具的「個人設定資料夾」，藏在系統裡，一般使用者看不到
- `config.toml` → 設定檔，純文字格式，記錄偏好
- skill / plugin → AI 工具的「擴充功能」，類似瀏覽器外掛
- hook → 觸發條件，「某件事發生時自動執行另一件事」
- subagent → 被派去執行子任務的 AI 小助理
- Agent Teams → 多個 subagent 可以互相討論、協作的模式
- symbolic link（symlink）→ 捷徑，指向原始檔案而不複製
- context window → AI 每次能記住的工作記憶上限
- skills-bullpen → 作者自訂的技能暫存區資料夾

## 讀完之後讀者應該能

（對開發者 TA）
1. 判斷自己要不要把 Claude Code workflow 搬到 Codex
2. 知道設定檔的對應關係，不用自己踩坑
3. 了解 skills-bullpen + symlink 共享 skill 的思路，可直接複製使用
