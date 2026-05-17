Day 29 知識管理

先說結論，[Foam](spoiler) 是一個非常好的工具。

開始與 AI 協作後，總覺得知識管理越來越重要，甚至可以說產出的品質與之有極高的相關性，因為我們平常仰賴的是訓練好的強大 AI 模型。以之前的 day 24 https://www.threads.com/@andrew54068/post/DT5vH8oD7VQ 來說，AI 就是一個智力很高的大腦，但如果問它還未訓練過的資訊（例如新聞），它就一無所知。我們身為終端使用者，除了選擇比較適合的模型外，就只剩下提供模型相關的資料。所謂的 RAG 就是把相關的資料餵給模型，大部分的 AI 應用就是這塊做得比其他人好，才顯得很強大。
以我為例，平常用最多的例子是 SDD (Spec Driven Development)。一切的開發都以文件為準，BDD 有相關的流程，流程的每一步 Discovery、Formulation、Clarification 都有詳細的操作手冊。如果我們朝著一人公司的方向邁進，那麼使用越少的 Token、提供越精準的資訊是必要的，因為這決定了最後成果的品質。為了做到這件事，流程的知識管理以及針對專案發展出來的知識管理，都是我們要努力的方向。
Foam https://marketplace.visualstudio.com/items?itemName=foam.foam-vscode 是一套非常適合知識管理的工具，它是 VSCode 的 extension，跟我們平常使用 Markdown 的方式很像，只是當我們要連結檔案時，要用雙層中括號 [[]] 來連結檔案。例如其中一個檔案名稱是 day28.md，我們在 day29.md 連結 day28.md 的方式就是直接輸入 [[day28]]，它會幫你自動尋找該專案目錄底下檔名叫做 day28 的檔案。在 Mac 上 VSCode-based 的編輯器中，可以直接 Command + Click 跳轉到該檔案。也就是說，我們可以運用 Claude Skills 底下的重要精神，把檔案拆小，必要的時候才讀取到更詳細的資訊。另外有以下幾個特點讓它變得非常實用：

1. **雙向連結 (Backlinks)**：傳統 Markdown 連結是單向的，例如 Day29 連結到 Day28，但 Day28 檔案本身並不知道被誰引用。Foam 則提供雙向連結，在開啟 Day28 時，你可以透過 all links 面板看到所有引用它的來源，這對建立知識網路至關重要。因為在 SDD 開發中，文件是最重要的一環，而我們常常會遇到需求變更的情境，檔案維護就變成了最大的痛點。我們可以把文件當成是程式碼一樣對待，相同的內容應該要抽離成一個獨立檔案，這樣不同文件提及的時候，只需要修改一個檔案的內容即可；又或是當我們修改其中一個文件內容時，相關聯的文件可能也需要一併維護，這時候雙向連結就能幫上大忙。
2. **自動重構 (Refactoring)**：在標準 Markdown 中，搬移檔案位置（如從 `content/` 移至 `shared/`）會導致相對路徑失效。Foam 使用檔名 `[[filename]]` 作為唯一識別碼，因此無論檔案在專案中如何移動，連結都能保持有效。又或是檔案重新命名，Foam 也會自動幫你更新連結。
3. **視覺化圖譜 (Graph)**：Foam 會根據 `[[ ]]` 的連結關係自動繪製知識圖譜，將抽象的知識關聯轉化為直觀的視覺化地圖。Command Palette (Command + Shift + P) 搜尋 `Foam: Show Graph` 即可開啟圖譜，讓你視覺化看出各個檔案彼此之間的關聯。

**小技巧：提升 GitHub 相容性**
如果你希望在不支援 `[[ ]]` 的 GitHub 上也能正常點擊連結，可以使用 Foam 的「Link Reference Definitions」功能 https://foamnotes.com/user/features/link-reference-definitions.html 。它會自動在檔案底部生成標準 Markdown 參考連結：
- 原始內容：`I learned about [[Postgres]].`
- 自動生成：`[Postgres]: ../concepts/Postgres.md`
不過以上功能實測起來沒有反應，所以可以請 AI 幫我們設定 git hook，在每次 commit 時自動生成這種相容一般 Markdown 格式的連結，這讓你的知識庫在 VS Code 之外（如 GitHub 網頁版）也能擁有完整的跳轉功能。

用 Foam 適合在小專案裡面管理相關知識，但如果是很龐大且複雜的系統我還是會推薦用 Obsidian，因為它支援從不同標籤瀏覽檔案的功能。