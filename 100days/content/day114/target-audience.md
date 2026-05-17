## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

這篇是給正在觀望 AI 工具、或身邊被問過「AI 安不安全」的讀者——尤其是非技術背景的上班族，以及想試 Claude Code 卻被「會不會把檔案刪光」嚇到的人。給他們一個具體的安全認知框架，而不是模糊的恐懼。

## 讀者起點

讀者可能：
- 用過 ChatGPT，偶爾貼公司資料進去，心裡有一點不安但沒系統性想過風險
- 聽過「AI 刪檔」的新聞，但不知道是哪種 AI、是不是所有 AI 都會
- 想試 Claude Code / Vibe Coding,但不敢真的讓它跑在自家電腦
- 對 settings.json、terminal、deny list 等概念完全陌生

## 需要翻譯的概念

- agent 型 AI → 會替你執行任務的 AI,例如直接讀你的檔、幫你跑指令的那種
- MCP server → 幫 AI 接外掛的小程式,例如讓 Claude Desktop 能碰你的檔案、跑指令
- filesystem MCP → 一種外掛,裝了之後 Claude Desktop 就能讀寫你指定資料夾裡的檔案
- rm -rf → Mac／Linux 上「把整個資料夾直接撕掉、不進垃圾桶」的指令
- Remove-Item -Recurse -Force → Windows PowerShell 上對應 rm -rf 的指令
- NTFS junction → Windows 的一種「假捷徑」,會讓刪除指令跨過資料夾邊界一路往外刪
- settings.json → Claude Code 的設定檔,就是一個文字檔,用記事本就能開
- deny list → 黑名單,把危險指令列進去,以後 Claude Code 就不會跑
- approval policy / sandbox → Codex 等工具用來擋危險指令的機制,跟 deny list 目的相同
- PreToolUse hook → Claude 跑任何指令之前,會先讓你的小程式檢查一次的機制
- git worktree → 從同一個專案開一個隔離的實驗分身,在裡面炸了不會影響主專案
- Claude Cowork → 2026 推出給非技術用戶的 Claude agent 產品,不用寫 code
- plugin / 供應鏈攻擊 → 外掛本身被動了手腳,或外掛用到的函式庫被植入惡意程式碼(Day 92 專文)

## 讀完之後讀者應該能

1. 分清楚聊天型 AI(ChatGPT／Claude.ai)和 agent 型 AI(Claude Code／Cowork)風險等級完全不同
2. 知道「AI 偷資料」真正的風險點不是 AI 公司偷,而是自己主動貼進去的東西
3. 如果要試 Claude Code,能照著 settings.json 範本擋掉 rm -rf、Remove-Item -Recurse 等破壞性指令
4. 知道 Claude Cowork 是比 Claude Code 更適合非技術用戶的選項,可以從寫信、整理文件開始
