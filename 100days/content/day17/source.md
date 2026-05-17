Day 17 自製 Threads 發文機器人-6 debugging

看來修復 Bug 並不如想像中簡單。即使遇到 Bug，我們還是得透過人工輔助引導才會更有效率。過去我習慣直接跟 AI 描述問題，並盡可能提供 Context，以免它往錯誤的方向猜測。但若要將大部分實作交給 AI，我們應該建立一套穩定的流程。現階段的目標是讓流程穩定，進而將其標準化為 Skills 或是 Workflow，之後再來思考如何節省 Token 的問題。

舉個實際的例子，AI 設計了一個 `BrowserThreadsService` 類別，其建構函式如下：

```typescript
constructor(
    private db: DatabaseService,
    private bot: any
  ) {
    this.ensureSessionDirectory();
  }
```

但我收到了這個錯誤訊息：
```
TypeError: this.bot.sendMessage is not a function               
  at BrowserThreadsService.sendMessage
```

這意味著注入的 `bot` 其實際型別與預期不符。由於使用了 `any`，這類錯誤無法在編譯時期被檢查出來，只能等到執行期 (Runtime) 才會發現。

如果是過去的我，可能會直接對 AI 說：「`any` 造成了一些問題，我們收到了 `TypeError`，請幫我修復它並盡量避免使用 `any`。」但這種方式雖然能解決當下的問題，卻錯失了從根本改善流程的機會。


之前提到 SDD 的優勢在於詳細記錄需求，這對從零開始的專案當然沒問題。但若專案已有雛形，在 Debug 階段如果沒有有意識地遵循 SDD 流程，很容易讓 SDD 文件過時，導致既有的 Feature Files 發揮的作用有限。這會造成 AI 雖然修好了 Bug，卻沒有相對應的文件記錄。雖然 Claude Code 常在完成任務後建立 Markdown 文件記錄過程，但那充其量只是更多的文字描述，遠不及 Gherkin 文件的精練。因此，我們要克制直接叫 AI 修 Bug 的衝動並明確告訴它：「我現在遇到什麼狀況，請先幫我修改 Gherkin 文件，再跑一次 TDD 流程。」這樣確保每一次修改都以 Feature Files 為出發點，才能維持 Live Documentation 的優勢。此外，這樣也能解決「AI 產出的說明文件不值得進入 Git，但每次都得花時間閱讀」的困擾，讓產出直接即是規格。

於是我跟 AI 進行了討論，它提出了一套「Bug 修復決策樹」，建議我們在遇到問題時先判斷這是哪種類型的 Bug，再決定處理方式。以下是討論歸納出的重點：

### 核心哲學 (Philosophy)

**黃金法則**：每一個 Bug 都代表規格說明書 (Spec) 的缺失。應先修復規格，再修復程式碼。

**為何「Feature-First」？**

Feature 檔應作為系統行為的「活體文件 (Living Documentation)」。將修復編寫為測試，不僅能防止問題再次發生 (Regression)，還能確保代碼與規格的一致性。

### 快速決策流程 (Decision Tree)

當 Bug 被回報時，請依序問這兩個問題：

1.  這個 Bug 有「可觀察」的執行期行為嗎？
    *   **否** (僅涉及設定檔/工具) → 走 **場景 C**。
    *   **是** (系統行為不如預期) → 繼續。
2.  現有的 Feature 檔是否涵蓋此行為？
    *   **是** → 走 **場景 B** (功能已定義，但實作錯誤)。
    *   **否** → 走 **場景 A** (功能未定義，需新增規格)。

**原則**：只要能寫出 Given/When/Then，就必須使用場景 A 或 B！

### 三大執行場景

#### 🔍 場景 A：需要新功能 (規格缺失)

**情況**：系統缺少了原本應該要有的行為，且原本的 Feature 檔沒寫到。

*   **識別缺失**：確認「應該發生什麼」。
*   **更新 Feature 檔**：在 `spec/features/` 中新增 Gherkin Scenario。
*   **執行 TDD**：紅燈 (寫測試再現 Bug) → 綠燈 (實作修復) → 重構。

#### 🛠️ 場景 B：現有功能錯誤 (實作錯誤)

**情況**：Feature 檔已經規範了正確行為，但程式碼跑出來結果不對。

*   **定位 Feature**：找到對應的 Scenario。
*   **驗證 Scenario**：確認 Spec 是否正確 (若 Spec 錯則先修 Spec)。
*   **執行 TDD**：直接從「紅燈」階段開始，修正代碼直到測試通過。

#### ⚙️ 場景 C：設定與工具問題 (不可測試)

**情況**：僅限無執行期行為的設定更改 (如 `.gitignore`, `.prettierrc`, `tsconfig.json`)。

*   **注意**：很多基礎建設 (如 Docker health check, DB migration) 其實是可測試的，應優先考慮場景 A/B。
*   **修正設定**：直接修改設定檔並手動驗證。
*   **文件化**：在 Commit Message 或 README 中解釋「為什麼 (Why)」。
*   **Commit**：使用 `chore:` 或 `build:` 前綴。

### 檢核清單 (Checklist)

*   [ ] **修復前**：是否已用 Gherkin 描述此問題？(能寫就寫！)
*   [ ] **修復中**：測試是否能精確再現 Bug？(先看到紅燈)
*   [ ] **修復後**：所有測試皆通過 (綠燈)，且無回歸錯誤。

### 成功指標

*   ✅ **Feature 檔持續增長**：隨 Bug 修復越趨完整。
*   ✅ **回歸率降低**：修好的 Bug 不再出現。
*   ✅ **文檔即代碼**：新成員看 Feature 檔就能懂系統行為。

至於那些目前難以用 Gherkin 描述的情境，通常也正是尚未能完全自動化的環節。這屬於目前 AI + SDD 流程尚未能完全覆蓋的範圍，此時工程師的經驗顯得格外重要，能大幅減少來回試錯的成本。至於未來該如何優化這部分的協作模式，則有待進一步探索。

以上是目前自己摸索的心得，歡迎賜教。