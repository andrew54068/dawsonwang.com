Day 114 Claude Code 資安新手問答：偷資料、刪檔、能幫我什麼

最多非技術背景的朋友問我的三個問題，我每週都要回一遍：

- AI 會不會偷我資料？
- 會不會把我檔案刪光？
- 到底能幫我做什麼？

今天一次回完。

先講結論：
- 會不會偷資料：看你用哪種 AI，但最該擔心的其實是你自己貼上去的東西
- 會不會刪檔：聊天型 AI 不會，agent 型（像 Claude Code）會——但有三層防線可以擋
- 工作上能用在哪：從寫信到自動化流程到做自己的小工具，門檻由低到高

一個一個講。

## Q1：AI 會不會偷我資料？

AI 工具現在分兩種，風險差很多。

聊天型：ChatGPT、Claude.ai 的對話視窗、預設的 Claude Desktop。你貼什麼它才看到什麼，碰不到你本機檔案。

agent 型：Claude Code、Claude Cowork、以及裝了 MCP server 的 Claude Desktop。能讀你電腦的檔、上網、幫你跑指令——權限大很多。

所以同一個 Claude Desktop，在你「只拿來聊天」跟「裝了 filesystem MCP 之後」，根本是兩個風險等級。

說白了，風險不是 AI 主動來偷，而是你給了它多少。

但對一般上班族，最該擔心的其實不是 AI 公司——是你自己主動貼上去的東西。合約、客戶名單、公司財報、密碼。

一句話規則：不能給外人看的，也不要給 AI 看。條款寫得再漂亮都一樣。

plugin 跟供應鏈攻擊的部分我 Day 92 寫過，這篇不重複。

## Q2：AI 會不會把我檔案刪光？

聊天型 AI 不會。它根本碰不到你的檔案。

但 Claude Code 或是 Codex 這種 agent 型的——會。Windows 上有好幾起真實事件（Mac 社群也有人回報類似事故，但沒留下具體 issue 編號）：

- **專案被整個刪掉**：有 Flutter 工程師早上打開電腦，整個專案資料夾被清空。
- **連個人資料夾都炸光**：Claude Code 跑了 `Remove-Item -Recurse -Force`，跟著 pnpm 留下的「假捷徑」（NTFS junction）一路往外刪，最後把使用者整個 Windows 個人資料夾砍光——連不相干的專案和文件都一起賠進去。

Mac／Linux 上最常炸的指令是 `rm -rf`，Windows 上是 `Remove-Item -Recurse -Force` 或 `rmdir /s /q`。白話版都一樣：把整個資料夾直接撕掉，不進垃圾桶，救不回。

但有三層防線可以擋。

### 第一層：在設定檔裡直接禁用危險指令

Mac 打開 `~/.claude/settings.json`（`~` 就是你的 home 資料夾，Finder 按 Cmd+Shift+. 顯示隱藏檔），Windows 是 `%USERPROFILE%\.claude\settings.json`，沒有就自己新建，貼這段：

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "Bash(rm -rf /*)",
      "Bash(sudo *)",
      "Bash(Remove-Item * -Recurse*)",
      "Bash(Remove-Item * -Force*)",
      "Bash(rmdir /s*)",
      "Bash(rmdir /q*)",
      "Bash(del /f /s*)",
      "Bash(format *)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)"
    ],
    "defaultMode": "acceptEdits"
  }
}
```

前三條 Mac／Linux 專用，中間 Windows 專用，最後兩條跨平台。混合寫就兩邊都擋。

用 Codex 或其他 agent 型工具的讀者，原則一樣：找它的設定檔，把 approval 調嚴或開 sandbox 模式。每家做法不同（Codex 沒有指令層級的 deny list，靠 approval policy + sandbox），但目的都是「不讓它自作主張跑危險指令」。

Claude Desktop 沒有原生的 Bash 工具，所以 `Bash(rm -rf *)` 這種 pattern 用不上——它能碰檔案、跑指令都是透過 MCP server。防線要做在 MCP 那一層：不想啟用的 server 用 `disabledMcpjsonServers` 擋掉；filesystem MCP 只綁必要的資料夾（不要給整個 home 或根目錄）；exec／shell 類 MCP 謹慎安裝。沒裝 MCP 的 Claude Desktop 就是聊天型，沒這個煩惱。

### 第二層：PreToolUse hook

寫一小段程式，在 Claude 跑指令前先檢查。比 deny list 更細——例如你可以擋「所有想刪掉 home 底下東西的指令」，不只擋死幾條 pattern。

### 第三層：git worktree 隔離

git 像是遊戲的存檔機制，可以讓你回到之前的存檔點復活。

而其中的 worktree 是直接幫你把專案複製一份，這樣做更安全。

高風險的事丟到 git worktree（隔離的實驗環境）去跑，炸了也只炸實驗環境，主專案不受影響。

結論不是「AI 會不會刪檔」，是「你有沒有設好防線」。

## Q3：AI 到底能幫我做什麼？

按門檻由低到高：

**寫信／整理文件／改表格**：ChatGPT 或 Claude.ai 就夠了。最容易上手，風險也最低，因為它不會碰你電腦。

**重複性工作自動化**：Claude Cowork（Anthropic 給非工程師用的 agent 產品，不用寫 code），告訴它流程它幫你跑。例：每週把一堆 email 整理成週報、把 PDF 表格整理成 Excel。

**做自己的小工具**：這就進 Claude Code 了。門檻高一點，但做出來的東西是別人沒有的。

給新手的建議：循序漸進。

很多人第一次就直接跳去玩 Claude Code，被權限、設定檔、terminal 嚇到，就覺得「AI 這東西不是我能用的」——真的太可惜。

工具越強大也就意味著能造成更多傷害，所以要衡量自己是否有能力應對，不要越級打怪。

## 最後

AI 資安跟詐騙訊息一樣，你知道手法就不會上當。

- 不要把「不能給外人看的東西」貼給 AI
- 想玩 Claude Code 或 Codex 這類 agent 工具，先把權限／deny list 設好
- 不要裝來路不明的 plugin（Day 92 詳細）

做到這三條，已經比 95% 的使用者安全了。

你身邊也有朋友在問「AI 到底安不安全」嗎？這篇轉給他，省掉一整個下午的踩坑。或你自己被問過類似的問題，是怎麼回的？留言聊聊。

## 參考資料

- Day 92〈Claude Code 有沒有資安問題〉— plugin 與供應鏈攻擊詳解
- [anthropics/claude-code issue #29082 — rm -rf unexpected deletion](https://github.com/anthropics/claude-code/issues/29082)
- [anthropics/claude-code issue #29249 — Remove-Item on Windows NTFS junction traversal](https://github.com/anthropics/claude-code/issues/29249)
- [Claude Code --dangerously-skip-permissions: Safe Usage Guide + Configs](https://www.ksred.com/claude-code-dangerously-skip-permissions-when-to-use-it-and-when-you-absolutely-shouldnt/)
- [Stop asking me: configuring Claude Code permissions — Rajiv Pant](https://rajiv.com/blog/2026/03/31/stop-asking-me-configuring-claude-code-permissions-for-uninterrupted-flow/)
- [How to Use Claude Code Safely: Non-Technical Guide](https://www.producttalk.org/how-to-use-claude-code-safely/)
