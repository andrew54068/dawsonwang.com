## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

如果你平常都用 Google 表單／文件做事（蒐集客戶資料、寫工作報告、整理會議紀錄），這篇示範了一個新流程：把素材丟進資料夾、叫 AI 幫你產出對應的 Google 表單／文件，不用再手動點 UI 慢慢拉。重點不是工具炫技，是「素材在資料夾、產出在 Google」這條鏈路怎麼接起來。

## 讀者起點

- 用過 Google 表單／文件，知道平常怎麼手動建立和分享
- 聽過 Claude／ChatGPT 但不一定用過 Claude Code（在終端機跟 AI 對話的版本）
- 對「終端機」「指令」「CLI」這些詞印象模糊，可能覺得「那是工程師的東西」
- 不熟悉 API、JSON、OAuth、token 等技術名詞
- 前天讀過 Day 128 的 gws-forms skill 實驗（這篇是延續討論）

## 需要翻譯的概念

- gws / Google Workspace CLI → Google 官方出的命令列工具，一個指令就能操作 Drive、Gmail、表單、文件等等；像是不用打開瀏覽器，直接從鍵盤對 Google 下指令
- CLI（Command Line Interface） → 命令列工具，在終端機（黑底白字那個視窗）打指令做事
- Discovery Service → Google 提供的「API 目錄」，工具去問 Google「現在有哪些功能」，自動學會新指令；像是一份每天自動更新的菜單
- API → 程式之間溝通的窗口（Day 128 已經出現過）
- batchUpdate / FormID / formId → Google 表單 API 的內部術語，一般讀者不需要懂細節
- skill（在 Claude 脈絡下） → 給 AI 用的「使用說明書」（Day 128 已經介紹過）
- OAuth → 第一次授權登入的流程，告訴 Google「我同意這個工具代我做事」；像是去櫃台簽授權書
- token → 授權後拿到的「通行密碼」，之後不用每次都重新登入
- MCP / sub-command → 太底層，本篇不必展開，可留到結尾「明天那篇」
- requirements.md → 一份用 markdown 寫的需求文件（純文字檔，副檔名 .md）

## 讀完之後讀者應該能

1. 知道「把素材放本地資料夾 → 叫 AI 讀 → 產出 Google 表單／文件」這條工作流大致長什麼樣
2. 理解 gws 這類工具的價值不在指令本身，而在把「本地素材」跟「Google Workspace 產出」接起來
3. 知道自己如果要試，安裝指令是哪一行、第一次要做 OAuth；不確定時可以請工程師朋友協助
