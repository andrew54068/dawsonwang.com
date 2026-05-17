# Day 22: AI + SDD + BDD + TDD 的實戰反思：理想與現實的差距

在這段時間的實踐中，我嘗試整合 **AI + SDD (Specification-Driven Development) + BDD (Behavior-Driven Development) + TDD (Test-Driven Development)** 的開發流派。這套組合拳聽起來很夢幻，但在實際落地時，我發現即使有 AI 的加持，仍然會撞上許多現實的牆。

今天的分享主要集中在我們遇到的四大挑戰，以及我對這些問題的思考與調整方向。

## 1. 需求變更：Research 必須走在 SDD 之前

我們最初的假設是：「用 SDD 定義好規格，AI 就能把程式碼寫出來。」但這個假設忽略了一個巨大的變因——**外部機制的不可預測性**。

以 Threads 功能為例，我原本規劃用 API Key 來抓取 Feeds，規格都寫好了，結果實作時才發現：
1.  帳號被限制無法申請 API Key。
2.  就算有了 API Key，官方 API 根本沒有提供我們需要的 Endpoint。

這導致我們必須回頭修改所有的 Feature Files 和規格，造成了大量的浪費。

**調整思路 (A)：調整開發流程**
如果專案涉及外部變因（如第三方 API、逆向工程），SDD 不應該是第一步。流程應該調整為：
`Research (可行性驗證) -> Formulation (規格制定) -> Discovery (探索邊界) -> Clarify (釐清細節)`
只有在 Research 階段確認「技術可行」後，才進入 SDD 的規格撰寫。

**調整思路 (B)：介面先行 (Interface First)**
另一個解法是「抽象化」。我們可以先不管實作細節，只定義架構：
例如定義一個 `get_feeds()` 功能，並預期它會回傳 Posts。在實作層，我們可以先 Return 一個 Mock Post。至於到底是用 API 還是 Cookie 爬蟲？留到後面再說。這能讓我們的架構不被實作細節綁死。

## 2. Feature File 的粒度與維護地獄

在寫 Cucumber/Gherkin 的 Feature File 時，我們很容易犯一個錯誤：**把實作細節寫進規格裡**。

如果 Feature File 描述了太多「如何做 (How)」而不是「做什麼 (What)」，一旦實作改變，我們就得回頭修改 Feature File。
當專案規模變大，Feature Files 數量可能破百，這時會衍生出新的問題：**Context Window 限制**。
AI 很難一次讀取上百個 Feature Files 來理解全貌，這會讓維護變得極其困難。

**調整思路：引入 DDD 與微服務思維**
我們應該極力避免在 Feature File 提及實作細節。同時，借鏡 **DDD (Domain-Driven Development)** 的概念，將 Feature 切分成不同的 Domain 或 Context，甚至像微服務一樣隔離。這樣不僅能保持 Feature File 的簡潔，也能讓 AI 在有限的 Context Window 內更精準地工作。

## 3. SDD 無法保證架構品質 (Architecture Quality)

這是最讓我頭痛的一點：**功能會動，但程式碼可能是災難。**

舉個實際例子，我請 AI 幫我產生一個 Telegram Bot。它通過了所有的 BDD 測試，功能完全符合需求。但我打開程式碼一看，發現它竟然用一個 Global Handler 處理所有訊息：

```javascript
bot.on('text', async (ctx, next) => {
  const text = ctx.message.text;
  // 把所有邏輯都塞在這裡...
  return next();
});
```

這意味著無論我在哪個對話流程，所有的輸入都會經過這個 Global Handler。這完全破壞了程式的可讀性與模組化，讓後續針對特定流程的處理變得極其困難。

**反思：**
SDD 和 BDD 關注的是「行為 (Behavior)」，它們無法限制「架構 (Architecture)」。AI 為了讓測試通過，可能會選擇「最快路徑」——也就是寫出這種像義大利麵一樣的程式碼。
這提醒我們，即使是用 SDD，**架構設計 (Design)** 和 **Code Review** 依然不能省。我們需要在 Prompt 中更明確地規範架構模式 (Pattern)。

## 4. 貪心的代價：MVP 與 Scope Management

即使有最強的 AI 和最好的方法論，一次想把太大的 Scope 做出來，結果通常是失敗。

我們應該回歸 **MVP (Minimum Viable Product)** 的原則。不要試圖一次生成完美的系統，而是先切分出核心功能，驗證通過後，再一個 Feature 一個 Feature 往上加。
這能有效降低一開始的複雜度 (Initial Complexity)，讓 AI 與我們都能專注在當下的任務，而不是被龐大的上下文淹沒。

---

**總結**

AI + SDD + BDD 是一個強大的加速器，但它不是自動駕駛。
它需要我們成為更好的**架構師 (Architect)** 和 **產品經理 (PM)**：
1.  做好事前的 **Research**。
2.  控制好 **Scope**。
3.  嚴格把關 **Feature File 的粒度**。
4.  盯緊 **程式碼架構**。

這就是我們在 Day 22 學到的寶貴一課。
