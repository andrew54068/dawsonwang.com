Day 46 讓 Gherkin 變聰明：VAR、CAS 與 TIME 系統

昨天提到我們使用了 Linter 來規範 Gherkin 的產出，但光有規範還不夠。原生的 Gherkin 雖然擅長描述行為，但在面對真實世界的 API 整合測試 (E2E Testing) 時，往往會遇到三個棘手的問題：資料傳遞、複雜驗證以及時間相依性。

為了讓 Gherkin 腳本從單純的文件變成可執行的程式邏輯，我們引入了三個核心系統。

1. VAR-System (變數符號系統)，它的作用是給測試記憶力。原生的 Gherkin 步驟是獨立的，容易有「失憶症」。例如在第一步創建了一個使用者，系統產生了 ID 9527，接著在第二步要查詢這個使用者。如果沒有變數系統，測試人員只能去猜 ID 是多少，或者被迫在測試前寫死 ID (Hardcode)，這會導致測試脆弱且不可重複執行。

VAR-System 透過 >contextKey、<executionKey 與 $var 等符號解決了這個問題。它能捕獲 API 回傳的 id 並存成變數，接著在下一個步驟告訴系統使用剛才的變數去進行查詢。這讓資料能在步驟間流動，模擬真實的使用者操作情境。

2. CAS-System (約束斷言系統)，用於描述更複雜的驗證。Gherkin 的表格比對通常是字串全等，但在 API 測試中，我們需要的往往不是全等，而是邏輯判斷。例如 ID 應該要大於 0、建立時間應該是今天，或是 Email 應該符合格式。

CAS-System 讓我們可以直接在 Gherkin 表格中使用 & 開頭的斷言函數。底層的 CasExecutor 會自動解析這些規則並執行 JUnit 或 AssertJ 等級的驗證，讓我們不用寫一行 Java 或 Python 程式碼就能完成複雜驗證。

3. TIME-System (時間轉換系統)，用來解決時區與過期問題。時間是測試最大的殺手，寫死日期的測試，過了一年就會因為過期而失敗。

TIME-System 允許我們使用 @time 搭配相對時間語法，例如七天後或一小時前。系統會在執行當下自動計算正確的時間戳記，並統一處理 ISO 8601 與時區轉換。

總結來說，這三個系統的核心在於「通用步驟定義 (Universal Step Definition)」。我們不再需要為每個 Scenario 寫特定的 Glue Code，而是實作了一套通用的 Step Definition，內建了 ScenarioContext (變數容器) 和 CasExecutor (斷言執行器)。這套通用程式碼能讀懂 >、$、& 和 @ 等符號，自動處理資料的流轉與驗證。

如此一來，Gherkin 就不再只是靜態的規格書，而是具備了變數、邏輯與時間觀念的動態執行腳本。這樣有什麼好處？如果你想寫好一份文件就下班，那麼這些約束其實就是讓文件向程式碼靠攏，把上面的規則寫成 Linter，就等於是會得了自動導航系統，可以幫我們省下許多約束的 prompt。

這是我發明的嗎？當然不是，這是我最近研究一個半開源專案 SDD.os 時，學到的概念
有興趣的朋友可以去這裡看看 https://sdd.tw/ 只要寫個簡單的入會小任務就能取得 https://github.com/SDD-TW/sdd.os 的使用權限
入會的小任務其實就是設計讓你體驗 SDD 的威力，認真做的話 1 個小時就可以搞定，從此你會需要多花時間思考上班的時間該如何利用。
shout out to https://www.threads.com/@johnny850807 以及 https://www.threads.com/@waterballsa.tw
