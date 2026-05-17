Day 117 Claude Code → Codex 總結

最近幾天加入 Codex 行列，其實大致上該有的都有，只是開發者體驗差很多。如果本來就只用基礎功能，可以算是無痛轉移。

"這篇適合已經在用 Claude Code、正在考慮或剛開始嘗試 Codex 的人。"

## 設定檔對應關係

先講基本的對應：

- `CLAUDE.md`（告訴 AI 你的使用規則的說明書） → `AGENTS.md`
- `~/.claude/` → `~/.codex/`（但 Codex 也會去讀 `~/.agents/skills`）
- `~/.claude/settings.json` → `~/.codex/config.toml`

skill、tool、hook（生命週期事件鉤子）、subagent，這些該有的都有。

## 主要差異速查

| 項目 | Claude Code | Codex |
|------|-------------|-------|
| 快捷鍵 | 豐富 | 極少 |
| Agent Teams | ✅ | ❌ |
| Hook 支援 | 完整（20+ 事件） | 基本（6 事件） |
| rules 格式 | Markdown | rules/ 支援，但不支援 Markdown 格式 |

## Codex 的定位：工具型指令集

Codex 一些進階功能就沒有了，因為定位不同。Codex 不像 Claude Code 包山包海，它把自己定位成一個工具型的指令集。

可想而知，快捷鍵也沒 Claude Code 這麼齊全。我常用的 Claude Code 快捷鍵在 Codex 都沒有對應：

- 暫存打到一半的 prompt：`Ctrl + S`
- 切換 model：`Option + P`

## 沒有 Agent Teams，只有 Subagent

Codex 只有 Subagent，沒有 Agent Teams。兩者的差別主要是——**Subagent 之間能否溝通討論**。

而且看起來 Codex 也不打算實作，官方目前沒有計畫實作，可以用社群開發的專案（例如 vida-stack）達到一樣的效果。

## Hook 支援不完整

Codex 對 plugin hook 的支援不像 Claude Code 那麼完整，所以跟 hook 相關的 plugin 基本上不能直接用，需要額外改造。

例如 ralph-loop（Day 116 有介紹）在 Codex 上可用 CodexPotter 或自製 Stop hook 替代（Day 116 有比較兩條路線）。

## 我的混用策略：skills-bullpen + symlink

目前是 Codex + Claude Code 混用，所以需要設定 skill 的共享機制。

我把所有 skill 都搬到 `~/.agents/skills-bullpen/` 資料夾下（這樣 Claude Code 和 Codex 都能讀到），搭配自製的 `/skills-manager` 來管理。要變成 global 或是專案專屬的，都只要建立 symbolic link 到指定資料夾就可以。

這樣可以無腦把 skill 都丟進 bullpen，用到才連結，也不會擔心佔用 context window（AI 每次能記住的工作記憶上限）。

## 一個小坑：rules 格式

如果在 Claude Code 裡有用到 `~/.claude/rules/`，Codex 有 `rules/` 資料夾，但不支援 Markdown 格式——rules 的內容需要轉換格式才能用。

這是 Codex 遷移系列的第三篇。前幾篇：Day 115 講 Claude Code hook 機制，Day 116 講 ralph-loop 的三條替代路線。

大家還有什麼轉換上的經驗嗎？歡迎留言分享～
