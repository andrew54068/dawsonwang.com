Day 7

不想用 claude --dangerously-skip-permissions，同時也受不了每次遇到新的 command 就需要 approve 一次嗎？那我做的這個小工具或許可以幫到你！

今天分享一下最近遇到的小痛點以及解決思路
過去我因為不想每次遇到 Claude Code 執行新的 command 就要親自決定是否放行，所以長期習慣用 claude --dangerously-skip-permissions，雖然知道危險但還是因為太方便的還沒探索其他解法，時不時又看到有人系統檔案被 AI 刪掉所以覺得終究還是得想個好方法來解決這個問題
官方正統的解法是每次遇到新的 command 就會問你一次，而其中有個選項是說以後只要遇到同一個 command 就自動允許，這樣子就不用每次都問了，而原理是他會在 project 的 .claude 裡面的 settings.json 裡面的 permissions 裡面新增一個 permissions" : "allow" 的 array 來記錄白名單，那是不是可以直接去分析現有專案找到一些關鍵檔案就自動幫我加到白名單，我只負責決定是否放行超出預期的 command。
那麼想到的解決方法有兩個
1. 是 VS Code 的 extension，靈感是來自於 Kiro for Claude Code，之前安裝這個 extension 的時候他會自動幫忙在 .claude 底下新增一些相關的 markdown 文件，代表他有個觸發的時間，如果我能在那個時機觸發我的程式，就不需要使用者主動安裝白名單
2. Claude 的 Skill 或是 Slash Command，skill 的使用方式還得提到它的名字，但如果意圖非常明確的話其實 Slash Command 反而可以再輸入的時候讓 Claude Code 幫你自動推斷，但 Skill 的好處是用到的檔案才載入可以節省對話空間 (context window)

最後我決定先在 Claude Code 實作 Skill，因為原本想說是當下即時讓 LLM 幫我分析專案的關鍵檔案例如 package.json 的 script command 通常應該都要進入白名單，而 VS Code 的 extension 的方式會需要使用者輸入 api key，這對一些單純用訂閱模式的使用者不是很方便。
這是我第一次創造一個 Skill，其實非常簡單完全不需要自己動手，跟 Claude 說你想要創建一個什麼功能的 Skill 即可，他會直接讀取 Skill 相關說明文件然後幫你搞定，於是我就忠實的描述我的想法跟需求給 Claude，他建議我直接針對常見的框架或是 tech stack 來 mapping 已知的 command 而不是透過 LLM 動態分析。當然雖然效果跟我預期的略差，但針對一個 MVP 來說已經足夠，想要建立新創的思維應該就是要快速試錯，過程中有任何 feedback 在反覆修改而不是閉門造車擴大 scope。
於是就誕生出了第一個版本的 Permission Guardian 大家可以直接用以下指令安裝

/plugin marketplace add git@github.com:andrew54068/claude-plugins.git
/plugin install permission-guardian@claude-plugins

當然再次提醒安裝前務必請 AI 幫你 review 一下自己裝的是什麼，怎麼運作才不會被有心人士有機可乘
