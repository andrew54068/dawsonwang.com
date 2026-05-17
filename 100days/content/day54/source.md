Day 54 BDD 的三大實踐：Discovery → Formulation → Automation

前兩天介紹了 Cucumber 跟 Step Definitions 的實作，今天想往上拉一層，聊聊 BDD 的完整方法論。很多人以為 BDD 就是 "用 Gherkin 寫測試"，但其實 BDD 的核心是三個實踐：Discovery、Formulation、Automation。今天就來拆解這三個階段。

一、Discovery（探索）：搞清楚 "它可以做什麼"

Discovery 的核心是在寫任何程式碼之前，透過結構化對話來建立共識。

最常用的技巧是 Example Mapping，用四種顏色的卡片：
- 黃色：要討論的 User Story
- 藍色：治理這個 Story 的規則（Rule）
- 綠色：說明每條規則的具體範例（Example）
- 紅色：團隊當下無法回答的問題

搭配 Three Amigos（三劍客）：Business（業務）、Development（開發）、Testing（測試）三個角色一起參與。Three Amigos 定義 "誰來參與"，Example Mapping 定義 "怎麼對話"，Discovery 則是包含兩者的上層實踐。

二、Formulation（表述）：把共識寫成 "它應該做什麼"

Formulation 不是單純寫 Gherkin。它是一個協作活動，把 Discovery 階段已經建立的共識，用人跟機器都能讀懂的格式記錄下來。

好的 Formulation 遵循 BRIEF 原則：
- Business language：使用業務領域的術語
- Real data：使用真實具體的資料
- Intention-revealing：描述行為的 "為什麼"
- Essential：只包含理解該行為必要的資訊
- Focused：每個 Scenario 只說明一條規則

跟 "只是寫 Gherkin" 最大的差別是：Formulation 是協作產出的（不是測試人員獨自寫的），描述的是行為（宣告式）而非實作步驟（命令式），產出物是活文件（Living Documentation），不是測試腳本。

三、Automation（自動化）：驗證 "它實際做了什麼"

很多人以為 Automation 就是寫自動化測試，但 Cucumber 創辦人 Aslak Hellesøy 說得很直白："TDD 跟 BDD 是設計與開發軟體的技術，測試只是副產品。"

BDD 的 Automation 有幾個重點：
- 它是設計工具，不是事後驗證：自動化發生在寫正式程式碼之前
- 它產出活文件：自動化的 Example 會持續對系統做驗證，取代過時的文件
- 開發者必須主導：如果是測試人員在開發完成後才把 Gherkin 自動化，那就不是 BDD

最後分享一個有趣的資料：Specification by Example 的作者 Gojko Adzic 在 10 年回顧 (2020年) 中提到，29% 使用 Example 的團隊根本沒有做自動化，光是協作式的規格討論就已經帶來足夠的價值。這提醒我們，不管工具多厲害，Discovery 那個 "人跟人建立共識" 的過程始終是最有價值的。
