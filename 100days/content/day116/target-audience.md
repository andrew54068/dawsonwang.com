## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

這篇屬於「Claude Code → Codex 踩坑」系列第二篇，對象是已在用 AI coding agent（Claude Code 或 Codex）、想把自動化 loop 搬到 Codex 的開發者；對一般非技術讀者幾乎沒有直接意義。

## 讀者起點

讀者在讀這篇之前：
- 知道 Claude Code 和 Codex 是什麼，且有實際使用經驗
- 讀過系列第一篇（了解 ralph-loop 和 Stop hook 概念）
- 不熟悉 Codex 的 hook 機制，想知道 ralph-loop 怎麼移植
- 可能知道 Python hook script 怎麼跑，但不一定理解 app-server protocol

## 需要翻譯的概念

這篇面向開發者 TA，以下術語對該 TA 不需要解釋；但若文章試圖觸及更廣泛讀者，則需要翻譯：
- Stop hook → 「AI 每次想結束時會被攔下來跑一段程式，用來決定要不要真的停」
- plugin 系統 → 「Claude Code 的擴充套件框架，可以在特定事件時自動觸發自訂程式」
- context poisoning → 「長任務越跑越歪，因為早期的錯誤資訊一直留在記憶裡」
- app-server protocol → 「Codex 內部用來通訊的規格，CodexPotter 直接對接這一層」
- ralph-loop → 「自動化反覆執行任務的 loop 機制，需要第一篇作為前提知識」
- `decision: "block"` → 「hook 回傳給 Codex 的指令，意思是『不要停、繼續跑』」
- finite_incantatem → CodexPotter 的停止旗標，對非 CodexPotter 用戶是孤立術語

## 讀完之後讀者應該能

1. 判斷自己的 Codex 自動化需求適合路線 A（自製 Stop hook）或路線 B（CodexPotter）
2. 跑 `codex_ralph.py start` 指令並知道產出的四個檔案各有什麼作用
3. 理解 CodexPotter 每 round 清空 context 的設計意圖，以及 MAIN.md 的記憶角色
