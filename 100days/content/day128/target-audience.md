## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

別人推薦的 AI 工具/外掛/skill 不一定適合你，要先驗證再用，否則可能反而拖累你的 AI。

## 讀者起點

- 大多沒聽過 Claude Code 的「skill」是什麼，可能以為是某種付費課程或角色技能
- 知道 AI 會出錯，但不知道「裝錯插件」也會讓 AI 表現變差
- 對「Google 工程師出的東西」有天然信任，會覺得肯定比自己摸索的好
- 沒概念 API、schema、jq 這些技術細節，但能理解「過期說明書 vs. 直接問」的比喻

## 需要翻譯的概念

- skill → AI 的「外掛說明書」/「外掛技能包」，告訴 AI 遇到某類任務該怎麼做
- Claude Code → Anthropic 推出的命令列 AI 助手（給工程師用的 AI 終端機）
- Google Workspace CLI → Google 自家給工程師用的命令列工具，可以操作 Gmail/Forms 等
- gws-forms → 上述工具裡專門操作 Google 表單的那一組 skill
- API → 程式之間溝通的窗口（這裡先不展開，用「Google 表單的後台」也可以）
- schema → API 的「規格書」，列出能填哪些欄位
- 通過率 / 平均秒數 → 自動化測試的成績單
- bug → 程式裡的錯誤
- /skill-creator → Claude Code 裡的官方工具，幫你驗證 skill 好不好用
- jq → 處理 JSON 資料的小工具（可不展開，講「skill 裡有段處理資料的邏輯有錯」即可）
- live 偵測 / 現場偵測 → AI 直接問當下系統「你現在支援什麼」，而不是讀已經寫好的說明
- 模型 → AI 大腦的版本（例如 Claude 3.5、Claude 4）

## 讀完之後讀者應該能

1. 知道「skill」（或任何 AI 外掛）不能無腦裝，過期的說明書反而會讓 AI 出錯更多
2. 學會用 /skill-creator 驗證一個 skill 在自己情境下到底有沒有幫助（裝之前先 A/B 測試）
3. 理解「換新模型時要重新驗證 skill」這個維護成本
