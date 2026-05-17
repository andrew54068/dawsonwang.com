Day 121 在 Claude Code 裡直接呼叫 Codex

之前提到 Claude Code 的優勢是開發者體驗好太多，但有時候 Codex 的模型又更強大。那不如兩個一起用——OpenAI 出了個 codex-plugin-cc，裝在 Claude Code 裡就能直接呼叫 Codex，分享平常的三個用法。

如果你已經在用 Claude Code、又對 Codex 感興趣（或反過來），這篇是給你的。

安裝：
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/codex:setup

——

模式一：/codex:rescue（把任務整包交給 Codex）

這個指令的官方定位是 delegate investigation, fix, or follow-up work——白話就是把任務丟給 Codex，調查、修改、接力都算。
我自己常用的三種情境：
- 想要不同模型再看一遍（兩邊 context 分開，Codex 從零開始看，常會看到 Claude 的盲點）
- 任務量大，加 --background 讓它在背景跑，回來再用 /codex:status 查進度
- 想換模型角度，加 --model spark 切到 gpt-5.3-codex-spark 跑（OpenAI 速度導向的 Codex 變體，反應快很多，但深度推理跟複雜 debug 比主力模型弱）

day120 那次就是第一種情境（不同模型重看）：content-pipeline 跑到一半，6 個 Codex 任務並行、5 個完成、1 個永遠卡住。我把 log 丟給 /codex:rescue，它一看就指出是某個 skill 把 subagent（slash command 底下實際執行任務的子代理人）名字寫成 codex:rescue（那是 slash command 的名字），其實 subagent 應該叫 codex:codex-rescue。

模式二：/codex:adversarial-review（挑戰設計，不是抓 bug）

這個指令跟一般的 code review 不一樣——它預設要"質疑這個方案是否正確"、"這個設計在什麼條件下會失敗"。
我每次重要決策（新加 skill、改架構）前都跑一次。
跟 /codex:review 的差別（/codex:review 是這個 plugin 另一個指令，做傳統的程式碼審查、抓實作 bug）：review 找實作缺陷，adversarial-review 質疑設計選擇。前者抓蟲，後者問你"為什麼選這條路"。

模式三：圖片生成（直接讓 Codex 畫）

Codex 的原生圖片生成目前我覺得是最強的（贏過 Gemini Nano Banana）。
我每天的貼文投影片就是 dispatch 給 Codex 並行畫，6 張幾十秒搞定。

——

幾個需要注意的點：
- Codex 要另外登入 OpenAI / ChatGPT 帳號，跟 Claude 完全分開計費
- 不要把整包 monorepo 一次丟給 Codex，拆小一點效果好很多
- 背景跑（--background）任務不會自動回報，記得用 /codex:status 查進度

如果你已經訂了 Claude，再加 ChatGPT $20 就能把主要功能用起來（spark 那個子點需要 ChatGPT Pro $200），CP 值很高。

→ 想看 $100+$100 雙訂閱的進階策略，回去翻 day120。
