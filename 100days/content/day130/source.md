Day 130 我怎麼用 gws 做 Google 表單

前天那篇我實驗後決定不裝 gws-forms skill（Day 128：不要迷信 skill）。但它背後的工具叫 gws — Google Workspace CLI，這個我留著用。

這篇主要分享最近怎麼用它。

先給結論：把素材丟進一個資料夾，對 Claude Code 說一句「use gws to create the google form for me」，幾秒後就拿到一個能填的 Google 表單編輯 URL。下面拆給你看怎麼運作。

——

gws 是什麼？為什麼是它？（想先了解可以看這段，趕時間可以直接跳到下面工作流。）

CLI（Command Line Interface）就是命令列工具——在終端機打指令就能做事，不用開瀏覽器點來點去。

gws 用一個 CLI 接管 Drive、Gmail、Calendar、Sheets、Docs、Chat、Admin。它比較好玩的設計是執行時直接讀 Google 的 Discovery Service（可以理解為 Google 的 API 目錄），動態建出它能做的事——意思是 Google 推出新 API，gws 隔天就能用，不用等工具更新。

——

最近接了一個顧問案，需要先蒐集對方的背景資訊。第一步：給他們填一份背景調查表，了解個人背景、技術技能、工作習慣、AI 工具使用程度。

我的工作流是這樣：

第一步：素材放本地

把客戶需求寫進 requirements.md（這份顧問案要解的問題、團隊現況），丟進 freelance/ 資料夾。

第二步：讓 Claude 設計題目

不是直接叫 Claude 產表單，先讀 requirements.md 設計題目。它輸出 personal-background-survey.md，20 題分四段——個人背景、技術技能、工作習慣、AI 工具使用，每一題都對到顧問案的核心關注點。

第三步：gws 把 markdown 變成 Google 表單

一句指令：「use gws to create the google form for me」。AI 自動執行：

以下是 AI 在背後實際跑的指令，你不用看懂——重點是你只說了一句話，下面這些它自己生出來。

1. 建空表單

gws forms forms create --json '{"info": {"title": "顧問案 — 個人背景與技術調查"}}'

拿到 FormID。

2. Claude 寫一支小程式，把題目轉成 API 看得懂的格式。

3. 推題目進去

gws forms forms batchUpdate --params '{"formId": "..."}' --json "$(cat /tmp/form-payload.json)"

以上執行完後會拿到編輯 URL

接著人工檢查一遍、調整一些設定後，就可以貼給客戶填。

——

小訣竅：

把素材放某個本地資料夾，Claude Code 就有足夠 context 幫你產出符合需求的東西。產 Google 表單是這樣，產 Google Doc 報告也是這樣——把專案進度紀錄、會議筆記丟進資料夾，叫 Claude 整理成 Doc 給老闆看，換成 gws docs 上場。差別只在最後一段指令是 forms 還是 docs，交給 AI 判斷即可。

——

安裝方式：

npm install -g @googleworkspace/cli

或是 Homebrew：

brew install googleworkspace-cli

看不懂指令也沒關係，找會的人幫你裝一次，之後你只要對 Claude 說人話就行。

第一次要授權登入（瀏覽器會跳出來問「允許這個工具用你的 Google 帳號嗎」，按同意就好）。

——

前天說 gws-forms skill 實驗後決定不裝，但 gws 這個工具本身我會留著。不是因為它取代什麼，是因為它把「素材在資料夾、產出在 Workspace」這條鏈路接上了。
