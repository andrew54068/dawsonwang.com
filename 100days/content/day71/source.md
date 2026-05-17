Day 71 用 Claude Code 把 103 個 Arc 分頁變成 Obsidian 筆記

一直以來都有一個痛點，就是滑個 Threads、Facebook 又或是 X 的時候看到很多優質文章就會先開個分頁"等等再看"，結果新發現的資訊永遠比消化的還快，最後就變成一堆分頁永遠都看不完。

說真的，現在這個時代資訊爆炸的速度越來越快，真的不太可能全部看完，那我們回頭思考一下原本的目的是什麼？

我想了一下其實是希望未來能夠用上這個資訊，所以我先把這些資訊看過，希望下次能在對的時機想起來有這個工具或知識。

這個目的明確了之後，就可以開始思考除了原本都要自己親自消化的方式之外，有沒有能夠跟得上新知產生速度的做法？

當汽車發明後，人類不會試著跟汽車賽跑，那現在我們又為什麼需要每個資訊都親自消化呢？

如果我希望這些資訊之後能被用上，那麼其實我只是希望他能在我能觸及的地方留下麵包屑，那作為第二大腦的 Obsidian 就是最佳的選擇。

有點像是早期把紙本電子化的好處，我們把資訊都集中在 Obsidian 裡面，先不管如何存放，只要先建立好 Notes，之後都有整理、優化的空間。如果沒有把資訊集中處理，無論是 Threads、Facebook 還是 X 都會變成一個個孤島，我根本不會去看一個月前到底收藏了哪些貼文。況且如果資訊不是來自這些平台，那甚至連收藏的方式都沒有，心理壓力始終都在。

偶爾我去查看已收藏的文章，結果上下滑一滑早就忘記我曾經收藏過這些文章，那代表其實我一直都在自欺欺人。按下收藏的那一刻我已經暗示自己會記住，但卻經不起時間的考驗。

於是被 100 多個分頁困擾的我終於受不了了，我決定請 Claude Code 幫我把這些分頁資訊整理在 Obsidian 裡面，接下來我再想辦法請 AI 幫我整理這些資訊，他就可以有實際價值而不是自我滿足。

於是我跟 Claude Code 說：

Can you help me organize the current tabs under the xxx profile in Arc browser into Obsidian? You should figure out what the page do and extract useful information into a note and can be easily found in the future by tags or keywords. After making one tab into a Obsidian note then close it from Arc. Generate report in the end.


【第一個挑戰：怎麼讀取 Arc 的分頁？】

他一開始想用 AppleScript 列出所有分頁，但 Arc 的 AppleScript API 有 bug——iterate tabs 的時候會噴 "Can't convert types" 錯誤。JXA（JavaScript for Automation）也一樣。這是 Arc 的已知問題，不是他寫錯。

但 close tab 的指令是正常的。所以問題變成：怎麼拿到分頁清單？

答案是直接讀 Arc 的內部資料檔：

~/Library/Application Support/Arc/StorableSidebar.json

這個 JSON 檔大約 1MB，裡面存了所有的 spaces、containers、tabs。結構是這樣的：

- .sidebar.containers[1].spaces[] 是一個交替排列的陣列——UUID 字串和 space 物件交替出現
- 每個 space 有 title（空間名稱）和 containerIDs（包含 pinned 和 unpinned 容器的 UUID）
- .sidebar.containers[1].items[] 存了所有的項目（tabs、folders），用 parentID 關聯到所屬的容器

用 jq 就可以精確撈出特定 profile 下的所有分頁：

jq '[.sidebar.containers[1].items[] | select(type == "object") | select(.data | has("tab")) | select(.parentID == "UNPINNED_CONTAINER_UUID") | {title, url: .data.tab.savedURL, id}]'

拿到清單之後，用 AppleScript 關閉分頁就正常運作：

osascript -e 'tell application "Arc" to close tab id "UUID" of window 1'

【第二個挑戰：103 個分頁怎麼處理？】

扣掉 pinned tabs（Gmail、Calendar 這些常駐書籤），還有 103 個 unpinned tabs 要處理。一個一個做太慢了。

Day 70 剛聊完 sub-agent 的用法，這裡就是最好的實戰場景。他把分頁依 URL 分成四類，每一類開一個 parallel agent：

Agent 1：GitHub repos（33 個）→ 用 gh api 取得 repo 描述、星星數、語言、topics
Agent 2：文章和文件（25 個）→ 用 WebFetch 抓內容摘要
Agent 3：工具和 YouTube（23 個）→ 用 WebFetch 取得產品描述和影片資訊
Agent 4：社群媒體和搜尋（22 個）→ 解析 URL 參數或 WebFetch

四個 agent 同時跑，總共花了大約 8 分鐘處理完 103 個分頁。如果依序做，至少要 30 分鐘以上。

這就是 Day 70 講的 sub-agent 分流——每個 agent 獨立運作，中間過程不會污染主 context，最後只回傳處理結果。

【第三個挑戰：Obsidian 筆記怎麼寫入？】

Obsidian 有一個社群插件叫 "Local REST API"，會在本機開一個 HTTPS endpoint（port 27124）。API key 放在 vault 裡的 .obsidian/plugins/obsidian-local-rest-api/data.json。

用 curl 就可以直接建立筆記：

curl -sk -X PUT "https://127.0.0.1:27124/vault/3.%20Resources/Arc%20Tabs/note-name.md" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Content-Type: text/markdown" \
  --data-binary @/tmp/note.md

每個筆記都包含：
- YAML frontmatter（tags、source URL、date_saved、type）
- 內容摘要和重點整理
- 原始連結

這樣未來在 Obsidian 裡搜尋 tag 或關鍵字就能找到。

【第四個挑戰：抓取失敗怎麼辦？】

不是每個 URL 都能順利抓到內容。Facebook、Instagram 有 auth wall，Reddit 會擋爬蟲，X.com 需要 JS 渲染。大概有 12 個分頁抓取失敗。

一開始我的做法是：失敗就建一個簡單的書籤筆記，然後照樣關掉分頁。但這樣有問題——那些內容你還沒真正看過，關掉了就忘了。

改良後的策略：
1. 失敗的分頁不關閉——留在 Arc 裡讓你手動處理
2. 還是建立筆記，但加上 #needs-review tag
3. 報告裡單獨列出失敗的分頁和原因

這樣你在 Obsidian 搜尋 #needs-review 就知道哪些筆記需要手動補充，Arc 裡留著的分頁也提醒你還有東西要看。

【最後一步：做成可重用的 Skill】

整個流程驗證完之後，我把它做成了一個 Claude Code skill（organize-arc-tabs）。關鍵是把所有 hardcoded 的個人資訊抽出來：

- Arc profile 名稱 → 變成參數，沒給就列出所有 space 讓你選
- Obsidian vault 路徑 → 自動偵測（搜尋 iCloud Drive 下的 .obsidian 資料夾）
- API key → 自動從 plugin 的 data.json 讀取
- 目標資料夾 → 自動偵測 PARA 結構，有就放 3. Resources/Arc Tabs/，沒有就放根目錄

做成 skill 之後，下次只要使用 /organize-arc-tabs 就會自動觸發整個流程。

【結果】

103 個分頁 → 92 個 Obsidian 筆記（重複的合併了）→ 所有成功抓取的分頁關閉 → Mac 立刻順暢了。

最大的收穫不是清了分頁，而是那些"等等再看"的資源終於有了一個可搜尋的歸宿。之前開著分頁其實也不會回去看，但現在變成有 tag、有摘要的筆記，反而更容易在需要的時候找到。

實務上當然還有可以優化的部分，例如：

- 可以直接使用 Obsidian 的 MCP 來建立筆記，而不是透過 Local REST API
- 可以不只支援 Arc，但連一個相對冷門的瀏覽器都做得到，主流的難度更低
- 可以用 Claude-in-Chrome 把更多資訊整合進 notes 裡，增加以後被搜尋到的機會

大家總是吹捧龍蝦多神奇，其實神奇的不是龍蝦而是背後的模型，只是很多人不知道 Claude Code 也可以做到所以沒有嘗試過而已，現在 AI 已經越來越像神燈精靈，只要你敢問，有足夠的時間與 Token 就沒有實現不了的東西，前提是你要學會許願。

相關：
Day 65 Agent 與 Sub-Agent 協作
Day 70 Sub-Agent 分流
