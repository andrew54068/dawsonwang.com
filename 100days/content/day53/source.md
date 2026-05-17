Day 53 Cucumber.js 自動產生 Step Definitions

昨天介紹了使用 Cucumber 的流程，但卻沒提到如何產生 feature file 以及 step definitions（簡稱 stepdefs）；今天來補完這塊。

feature file 的產生可以依據 BDD 經典的四個步驟：User Story -> Discovery -> Formulation -> Automation 來撰寫。這部分可以結合 Spec Kit 或是 OpenSpec，並搭配 Gherkin 語法規則來生成。

既然叫做 feature file，我們當然希望同一個 feature 用同一個檔案來管理。除非某個 feature 真的太大，那我們就可以用資料夾來分類管理，例如：login 和 sign up 就可以放在 onboarding 這樣的資料夾下。

而關於 stepdefs，不管你用的是 Java、Ruby、.NET 還是 JavaScript，只要 Cucumber 遇到一個「未定義的 step」（也就是 Gherkin 裡有寫，但尚未實作對應 stepdefs 的步驟），它就會自動幫你產生一段程式碼片段（snippet），並在 terminal 上印出來。

不過，這裡要先釐清一個常見的誤會：Cucumber.js 不會自動幫你「產生檔案」。它只是將 snippet 印在終端機（terminal）上，你需要自己將它們複製並貼到對應的 stepdefs 檔案裡。

在 Cucumber.js 中，有兩種方式可以取得這些 snippet：

方法一：直接執行測試

npx cucumber-js

當你的 feature file 裡包含尚未實作的 step 時，Cucumber.js 會將該 step 標示為 undefined，並在下方附上對應的 snippet。這種方式的好處是，你在執行測試的同時，就能直接看到哪些 step 還沒寫。

方法二：使用 Dry run 加上 snippets formatter（一次取得全部）

npx cucumber-js --dry-run --format snippets

這個指令不會真的執行測試，它的唯一作用是：將所有未定義 step 的 snippet 一次全部印出來。非常適合在你剛寫完一整個 feature file，想要一口氣取得所有 stub 的時候使用。

舉個例子，假設你的 feature file 長這樣：

Feature: 使用者登入
  Scenario: 正確帳號密碼登入
    Given 使用者在登入頁面
    When 使用者輸入帳號 "admin" 密碼 "1234"
    Then 應該看到首頁

Cucumber.js 會在 terminal 印出類似這樣的 snippet：

Given('使用者在登入頁面', function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

When('使用者輸入帳號 {string} 密碼 {string}', function (string, string2) {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

Then('應該看到首頁', function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending';
});

重點來了：這些 snippet 只會印在 terminal 上，不會自動幫你建立檔案。你需要手動將它們複製到你的 stepdefs 檔案中（例如 steps/login.steps.ts），然後再把裡面的 pending 替換為真正的實作邏輯。

它產生出來的內容就是個「空殼」，僅包含正確的 pattern match、對應的參數，以及一個 pending 標記，函式主體（function body）則是完全留白的。

這個功能的定位其實很明確：它就是個「鷹架」（scaffolding），旨在幫你快速搭建好測試骨架，剩下的實作細節則需要你親自填上。

鷹架的好處在於，它能讓 Feature file 中用到的 Given、When、Then 直接被拆解成對應的 Step Definition。舉例來說，我們經常會重複使用相同的 Given，這時就可以共用同一個 Step Definition。不難看出，Feature file 其實就是 Step Definition 的集合，只不過 Step Definition 負責用各種程式語法來將其具體呈現。這樣帶來的好處顯而易見：它能讓我們快速建立好可重複使用的測試骨架，而這通常也是 TDD 的起手式：紅燈。

整個流程可以總結為：

撰寫 feature file → 執行 Cucumber → 從 terminal 複製 snippet → 貼到 stepdefs 檔案 → 以 TDD 方式填入實作

如果搭配 AI 工具（像是 Claude）來使用，這個流程還能更進一步：先讓 Cucumber 產出 stub，再讓 AI 根據你的 feature file 語意來填寫實作內容，甚至可以搭配 TDD loop 來自動驗證產出的程式碼是否正確。這麼一來，就從單純的「鷹架」進化到了「自動實作」的層級。

小結一下今天的重點：
1. Cucumber 的所有主流實作都內建了產生 stepdefs snippet 的功能，但它只會印在 terminal 上，不會自動建立檔案。
2. 在 Cucumber.js 中有兩種取得 snippet 的方式：直接執行測試以查看 undefined 提示，或是使用 `--dry-run --format snippets` 一次取得全部。
3. 透過 `snippetInterface`，可以切換 async-await、callback、promise、synchronous 等四種程式風格。
4. 透過 `snippetSyntax`，可以支援 TypeScript 的自訂格式。
5. Cucumber 產生出來的 snippet 只是空殼，你需要自己複製貼上，然後再填入具體實作。
6. 將 Cucumber 搭配 AI 工具與 TDD loop 使用，可以把原本的測試鷹架變成全自動化的實作流程。
