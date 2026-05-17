Day 56 Claude Code 的一些進階小技巧

今天再分享一些我在 Mac 中使用 Claude Code 的小技巧：

control + s: 暫存目前輸入的 prompt。有時候先輸入了 prompt 才發現要換 model，就可以先存起來，有點像是 git stash 的概念。但要注意，當已經有暫存後如果輸入框有新的內容，再按 control + s 會直接覆蓋，所以記得要先清空輸入框後再按 control + s，才能把之前儲存的內容叫回來。

Esc: 在 Claude Code 執行任務時，按一次 Esc 會暫停任務；不過在沒有任務時連續按兩次，可以 Rewind 回之前任意的一個 prompt。

這招超好用，假設我需要 commit code，我可以請 Claude Code 幫我 commit 完後，再用這招回到請他幫我 commit 的那個 prompt，這樣接下來的 context window 就不會有 commit 過程產生的 context 佔用空間，可以省下很多 tokens。

或是如果在過程中我有問題問他，也可以用這招有意識地移除任何可能佔用 context window 的內容，這樣可以大量沿用有價值的 context，不需要 /clear 完後再次跟他說目前的進度之類的。

control + a: 快速將 cursor 移動到輸入框的開頭，這個在 terminal 中很常用，在 Claude Code 中也適用，可以省下不少時間。

control + e: 快速將 cursor 移動到輸入框的結尾，同上。

control + shift + -: 復原上一個 prompt 的輸入，有時候輸入一大堆 prompt 後不小心按錯鍵全部刪掉，可以用這招救回剛剛的心血。但記住他只能單向操作往前，不能向後復原。

control + r: 搜尋之前 prompt 的歷史紀錄，包含搜尋關鍵字的結果會出現，反覆再按 control + r 會出現下一個符合的 prompt。