Day 73

今天參加 Claude Code meetup，跟預期有點落差，原本期望聽到更 hard core 的技術分享，不過現場更偏向大眾面向的。即便如此還是有聽到一些不錯的重點，或是不同的切入角度。

1. davidchu 提到在 stop hook 加上 verify 的機制，五輪後可以讓單次完成度不高的模型也收斂到 90 幾％。但如果單純讓一個 80% 完成度的 agent 串聯在一起執行五次，最後準確率只剩下 30%。這用資料告訴了我們 verify 的重要性——即使是表現較差的模型，也有機會透過 verify 來提升表現。

這讓我聯想到一個比較少人提到的 eval 功能。/skill-creator v2 其實已經支援 eval，可以在建立 skill 的時候就進行評估，確保品質。雖然沒有資料佐證，但這件事對工程背景的人來說也是滿直覺的。

過去我們寫軟體都是 deterministic 的，所以用測試保護是非常廉價確保品質的方式。但現在到了 AI 時代，大家突然對 non-deterministic 的行為接受度高到不可思議。

我覺得 eval 是一個被大家低估的精神，跟 verify 有著異曲同工之妙。AI 的產出像是擲骰子，你不知道會擲出什麼；每次 model 更新就像是換一顆骰子，你無法確保相同的 prompt 會得出一樣的結果。即使是相同的 model，也常看到社群上有人反應降智，這些應該都要透過 eval 來驗證。

2. davidchu 提到的這篇 AI 分級，看看你現在在哪一級？
https://www.bassimeledath.com/blog/levels-of-agentic-engineering

3. 最近幾天已經陸續看到人分享 paperclip，沒想到今天 Jeffrey 的分享竟然已經出現了，這採用的速度真的快得不可思議。這個發展趨勢其實也挺合理的，OpenClaw 是一個強大的 agent，而 paperclip 想要達成的是 AI 自治公司。還沒上手其實不知道實際上差異如何，畢竟要用 OpenClaw 來設立自治公司也是辦得到的，之後有心得再來分享。
https://github.com/paperclipai/paperclip

如果大家對 hard core 的技術分享有興趣，4/9 還有一場，可以密切注意
https://www.threads.com/@debuguy.dev/post/DVsxTuNAJMb?xmt=AQF0uJs_Jk0TXQXvYGPvhU-UkO3-1CmfdtLXNwdBrRFlfw

還有什麼推薦的聚會也歡迎留言分享
