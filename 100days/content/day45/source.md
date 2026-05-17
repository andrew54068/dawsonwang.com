Day 45 一次不行，你有試過做兩次嗎？

延續之前的 SDD [[day43/source]] 話題，今天來聊實際執行遇到的問題。

既然是 SDD，首先我們要完成的是 Gherkin 文件，也就是 feature files（副檔名為 .feature），並使用 Gherkin 預定義的格式來描述需求，範例如下：

Feature: Guess the word
  Scenario: Breaker joins a game
    Given the Maker has started a game with the word "silky"
    When the Breaker joins the Maker's game
    Then the Breaker must guess a word with 5 characters

不過這個檔案當然不會由人工撰寫，而是由 AI 生成。若要讓 AI 產出高品質的 Gherkin 文件，勢必要有明確的準則與範例；有了這些 prompt，AI 才能產出符合規格的 Gherkin 文件。

不過，光是這些規則便可能佔據 2000 至 3000 行的篇幅。身為工程師，一個檔案若超過 1000 行，便已散發出程式碼異味 (bad smell)，因為這會導致程式難以維護。將檔案拆小能強制我們將性質相同的內容分離，隱藏實作細節以利於閱讀和理解，但在這裡單純把部分 prompt 內容拆分出去的確能提高可讀性但對於我們的產出品質來說，一點用處都沒有，而且現在我們將文件視為唯一的資訊來源，那麼用於產出這些文件的 prompt 便顯得異常重要。若我們只是一味地疊加規則，AI 想必會手足無措，且這也會大幅消耗有限的 Context Window。

因此，我們需要讓這些規則變得具確定性 (deterministic)，換言之，我們需要一種方式來引導 AI 到達預期目標。結合一堆規則與確定性的產出，即是 Linter 的概念。藉由 Linter 的輔助，我們可以省略繁瑣的規則描述，prompt 僅需簡單提及可用語法、保留字元的用法，並附上簡單範例即可。

如此一來，原本冗長的自然語言描述篇幅可縮減至約三分之一，試想從原本的 4000 至 5000 行大幅縮減至 1000 行左右的效果。這不僅節省了 Context Window，更重要的是能讓 AI 專注於產出有價值的內容，而非被繁雜的規則束縛。

因此，流程轉變為：先不提供過多明確規範，讓 AI 初步產出 feature files，接著利用 Linter 檢測錯誤，再根據這些錯誤訊息請 LLM 進行修正。其核心精神在於：若無法一次到位，不妨分兩次完成。

明天再來聊聊為何需要如此多的規則，究竟是什麼樣的額外需求導致了規則的膨脹。
