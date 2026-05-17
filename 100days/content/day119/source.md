Day 119 把 /skills-manager 開源了

Day 117 提到我用 `/skills-manager` 在 Claude Code + Codex 之間共享 skill。今天把它丟到 GitHub 上，兩條指令就能裝。

這篇適合：
1. 被過多 skill 佔用太多 context window（AI 每次能記住的資訊量）的人
或是
2. 混用多個 LLM 想要共用 skill 的人

## 安裝（兩條指令）

在 Claude Code 裡：

```bash
/plugin marketplace add https://github.com/andrew54068/claude-plugins
/plugin install skills-manager@andrew54068
```

裝完後直接在任何專案輸入 `/skills-manager`，會出一個互動選單，讓你勾選哪些 skill 要在這個專案啟用。

## 讓 Claude 和 Codex 自動用它

裝完外掛還不夠——要讓 AI 在處理任何 skill 管理需求時都先走這套流程，必須加一條 rule。

**Claude Code**：在 `~/.claude/CLAUDE.md` 加（或新建 `~/.claude/rules/skills-management.md`）：

```markdown
# Skills Management

Skills on this machine are managed via the **skills-manager** workflow (bullpen + symlink pattern).

- Skills live in `~/.agents/skills-bullpen/<skill-name>/`
- Global skills are symlinked into `~/.claude/skills/` and `~/.agents/skills/`
- Per-project skills are symlinked into `<project>/.claude/skills/` and `<project>/.agents/skills/`
- `~/.agents/skills-bullpen/.globals` is the source of truth for global skills
- For any skill management task, invoke the `skills-manager` skill first
```

**Codex**：同樣的內容貼到 `~/.codex/AGENTS.md`。Codex 不讀 `rules/*.md`，AGENTS.md 是唯一入口。

## 為什麼要這樣搞：bullpen + symlink

直接講核心問題——**skill 會吃 context window**。如果你寫過的 skill 全部都掛 global，每次對話都得付這份稅，就算 90% 的 skill 跟當下任務無關。

bullpen + symlink 把這件事拆乾淨：

1. **bullpen**（牛棚）= `~/.agents/skills-bullpen/`：所有 skill 都放這裡，永遠在這裡。一份原始檔。
2. **symbolic link（軟連結，下面簡稱 symlink）**決定哪些 skill 在哪裡啟用：
   - 連到 `~/.claude/skills/<name>` → 全 global，每個專案都吃得到
   - 連到 `<project>/.claude/skills/<name>` → 只在這個專案啟用
3. **`.globals` 檔案**：純文字，一行一個 skill 名稱，是 global 名單的唯一真相。`reconcile.sh` 會拿它來檢查 symlink 有沒有跑掉。
4. **檔案系統就是狀態**：沒有快取、沒有註冊表。`state.sh` 每次重讀 symlink。新增 skill = 丟一個資料夾進 bullpen。停用 = 砍一個 symlink。

## 為什麼 bullpen 放在 ~/.agents 而不是 ~/.claude

vendor-neutral（不綁特定廠商）的真正意思是：**skill 真檔只放一份在 `~/.agents/skills-bullpen/`**，Claude Code 和 Codex 都從這個 bullpen 拉。

但兩邊讀的入口資料夾不同：

- Claude Code 只讀 `~/.claude/skills/`
- Codex 讀 `~/.agents/skills/`

所以要讓一個 skill 在兩邊都 global，要在這兩個入口各建一條 symlink、都指回 bullpen 裡同一份真檔。`toggle-global.sh <skill> on` 會幫你一次建好兩條，不用手動。

（我自己測過：只在 `~/.agents/skills/` 建 symlink、`~/.claude/skills/` 沒建，Claude Code 看不到那個 skill。所以兩條都要建。）

寫一次（在 bullpen），兩邊都吃得到——前提是 symlink 兩邊都連好。

## 你會拿到什麼

裝完後 `/skills-manager` 給你一個互動選單。背後是 11 隻 bash script，常用的有：

- `state.sh <project>` — 一份 JSON 快照，列出所有可用、已啟用、global 的 skill / plugin / MCP
- `browse.sh <skills|plugins|mcp> <project>` — fzf（終端機互動選單工具）介面，空白鍵切換、enter 存檔
- `reconcile.sh [--fix]` — 檢查（或修復）`.globals` 跟 symlink 之間的 drift（不一致）
- `toggle-global.sh <skill> on|off` — 一鍵把某個 skill 升降為 global
- `migrate.sh` — 第一次跑，把 `~/.claude/skills/` 底下的 skill 全部搬進 bullpen

## 第一次跑的小坑

`/skills-manager` 第一次跑會偵測到 bullpen 不存在，提示你跑 `migrate.sh`。它會：

1. 把 `~/.claude/skills/<name>/` 底下的真資料夾搬進 `~/.agents/skills-bullpen/`
2. 已經是 symlink 的維持原樣
3. 掃 `~/.claude/settings.json` 的 hooks，自動把被 hook 引用的 skill 標為 global
4. 在兩邊（`~/.claude/skills/` + `~/.agents/skills/`）建好 global symlink

過程會把舊的 settings.json 備份成 `.bak`，遇到問題可以還原。

## 設計原則：filesystem as state

整套設計沒有 daemon（後台常駐程式）、沒有 IPC（程式間通訊）、沒有 SQLite。**檔案系統本身就是狀態**。

這帶來幾個好處：

- 不會壞——沒有可以壞掉的東西
- 用 `ls -la <project>/.claude/skills/` 就能看到當下狀態
- 換機器只要 rsync（同步複製工具）`~/.agents/skills-bullpen/` 過去就好
- 即使這個 skill 自己壞了，你的所有 skill 都還在 bullpen，沒丟

跨工具共享 skill 的痛點——你也遇到過嗎？歡迎留言聊聊。

想了解當初怎麼發現這個需求的，可以翻前一篇：Day 117

GitHub: https://github.com/andrew54068/claude-plugins
