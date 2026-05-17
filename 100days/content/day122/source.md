Day 122 ralph-expert + GAN 跑遷移：給 Claude Code 重度使用者的半自動模板

昨天聊到 /codex:rescue 可以讓不同模型重看一次工作。今天用 ralph-expert（一個幫你包 ralph-loop 指令的 skill；ralph-loop 就是讓同一個 prompt 自動迭代到完成條件達成的模式），把這招接到 ralph-loop 上面，做出一個半自動跑遷移的 prompt——Claude 寫 code、Codex 當挑剔的判別器（GAN 思維：生成器 vs 判別器，互相對抗到判別器點頭），每個 phase 都要 Codex 點頭才能往下走。

（這篇接 Day 121，沒看過建議先補。）

這是我今天丟給 Claude 的 prompt：

ralph-expert help me create a prompt to make a iteration to fulfill the whole migration process for the phase one by one with /gan and ask the /codex:rescue to be the critic (Discriminator) and use subagent as much as possible to better manage context window

實際遇到的狀況是原本的程式碼 AI 探索完後是用 Python，但後來的一些功能跟前端以及架站有關，所以想改成全部用 TypeScript 來改寫，於是就請他幫我整個專案在維持品質的情況下改寫。

通常這種改寫要靠前後對照的測試保護成果，但寫測試資料本身就很花時間。我用偷懶的方式——不產生對照測試，改讓 Codex 來把關，犧牲一點穩定度換速度。先確定技術上可以轉移就好，細節之後再修。

——

組合的三個東西：

Ralph loop：一個 prompt 自動迭代到完成條件達成（最多 N 輪當安全網）。
GAN 思維：生成器（Generator）寫 code、判別器（Discriminator）挑剔，互相對抗到判別器點頭。
Subagent 重度使用：實作跟 review 都丟給 subagent，主對話只當總指揮，context 不會爆。

——

為什麼用 ralph-expert 而不直接寫 prompt？

ralph-expert 是一個 skill，吃一個粗略的任務想法，吐出一個結構好的 ralph-loop 指令——它會幫你補完成條件（completion-promise）、最大迭代數、phase 拆分、verification step，最後直接幫你 launch loop。

我自己直接寫 ralph-loop prompt 常常忘記設 max-iterations、或寫太模糊的完成條件，跑起來不是無限燒錢就是亂收斂。讓 ralph-expert 先把骨架搭好，再把 GAN 結構（generator + discriminator）接上去，省掉很多 trial and error。

簡單說：ralph-expert 負責 "ralph-loop 該怎麼包"，我只負責 "我想做什麼、判別器是誰"。

——

為什麼要 GAN 結構？

ralph-loop 預設是 "一個 agent 一直做到完成"，但遷移很多時候沒有客觀完成條件——code 跑得起來不代表遷移做對。所以加一層判別器：每個 phase 都要 /codex:rescue 點頭才能往下。

關鍵是判別器要跟生成器不同模型。同一個模型扮演不同身份也行，但我個人更相信跨模型的 review 訊號比較硬。

——

為什麼分 phase 跑？

直接說 "把整包專案從 X 遷移到 Y" 會壞掉——第一輪就把所有檔案動完、subagent context 撐不住、判別器也沒辦法好好 review。

切小：phase 1 動 schema、phase 2 動 service layer、phase 3 動 caller、phase 4 動 test。每個 phase 走完整的 "生成→批評→修正→批准" 才進下一個。失敗了 rollback 範圍也小。

——

為什麼 subagent 比想像中關鍵？

Ralph 跑 30 輪，主對話 context 早就被歷史塞爆。所以實際做事的部分都派出去：

生成階段：dispatch 一個 subagent 去寫 code、跑測試、回報結果。
判別階段：dispatch /codex:rescue（本身就是 subagent）去 review，回報 approve 或 reject + 理由。
主對話只持有 phase 狀態：目前在哪個 phase、判別器最近一次 verdict、要不要進下一個。

30 輪跑完主對話可能才累積 5K token，subagent 各自獨立、用完即丟。

——

實際用之前的提醒：

- /codex:rescue 跟 Claude 分開計費，先 /codex:setup
- 第一次先用小遷移試（單檔 refactor 之類），不要一上來就丟整個 repo
- ralph-loop 一定要設 --max-iterations，不然判別器永遠不點頭會無限跑（燒錢）
- 完成條件（--completion-promise）要具體，例如 ALL_PHASES_APPROVED，不要寫 DONE 這種模糊的

——

想試試 ralph-expert？我把 plugin 公開了：
/plugin marketplace add andrew54068/claude-plugins
/plugin install ralph-expert
（詳細看 README：https://github.com/andrew54068/claude-plugins）

——

GAN 思維搬到 agent workflow 的標準化做法，可以看 GAN-Thinking 的 gan-skill：
https://github.com/GAN-Thinking/gan-skill

——

→ 還沒裝 Codex plugin？可以看看 day121。
