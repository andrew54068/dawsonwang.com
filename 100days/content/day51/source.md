Day 51 Skills Debug 經驗談

今天分享一下關於 Skills 的 debug 流程。使用了昨天提到的 Obsidian-Secretary skill 後，意外發現這會讓常用的 ralph-loop 壞掉。在請 AI 幫忙 debug 的過程中，我發現即使修改了 marketplace 底下的 ralph-loop，依然無法修復問題。後來才發現原來系統還有一個 .claude/plugins/cache 的版本，而且會優先調用 cache 裡的版本。因此要特別注意，如果要進行開發或是 debug，可以先將 cache 的版本清空，之後也要記得重新安裝這些 plugins。

這兩者會衝突的原因，是因為 Obsidian-Secretary 以及 ralph-loop 都是使用 stop hook 來實作，而多個 stop hook 是並行執行的，無法控制啟動順序，因此有可能會出現 race condition，進而導致非預期的結果。

另外我也發現，在使用 ralph-loop 時，opus 4.6 會自己偷吃步。例如我單純給他一個 1 到 10 的遞增功能要他跑，他可能會直接把結果修改成 10，而不是乖乖地執行 10 次。因此，如果要測試 ralph-loop 的運作，不能使用太過簡單的例子來測試。這其實有點麻煩，因為有些細節官方文件並沒有寫得很清楚，讓規格本身變得有點模糊。甚至當有些判斷是交由 LLM 來處理時，這就代表規格不是那麼穩定，會需要累積大量的經驗，才比較好駕馭複雜的 Skills 交互作用。

總而言之(不是什麼總的來說)，我們還是得徹底弄清楚 Skills 的底層運作機制，不然可能連要怎麼 debug 都會是個問題；尤其是當 Skills 的數量一多，甚至可能會面臨無從下手的窘境。
