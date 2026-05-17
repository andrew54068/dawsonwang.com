Day 52 Cucumber - 用自然語言寫測試的 BDD 框架

之前常常介紹 SDD，但還是沒介紹到那實際開發該如何實作，今天來聊一個在 SDD 流程中扮演核心角色的工具：Cucumber。

很多人第一次看到測試跑出 254 scenarios、4028 steps 全部通過，卻在 src/tests 底下只找到 10 個 TypeScript 檔案，一定會覺得很奇怪，測試案例到底寫在哪？

答案是：測試案例寫在 .feature 檔案裡，用的是一種叫 Gherkin 的 DSL（Domain-Specific Language），而且完全可以用自然語言包含中文撰寫。

Cucumber.js 的核心概念是 BDD（Behavior-Driven Development），它把「測試什麼」跟「怎麼測」完全分開：

1. Feature 檔案（測什麼）：用自然語言描述業務行為
2. Step Definition（怎麼測）：用 TypeScript 實作每個步驟的執行邏輯

舉例來說，一個測試場景長這樣：

Example: 部門不存在時新增正式員工應失敗
  When (UID="$HRManager.id") 新增使用者, call table:
    | userNumber | userType | userName | dept          |
    | EMP101     | REGULAR  | 張三     | NOT_EXIST_DEP |
  Then 新增使用者(400)回應, with table:
    | |

Cucumber.js 在執行時做的事情：
1. 讀取 .feature 檔案，解析 Gherkin 語法
2. 載入所有 Step Definition（src/tests/stepdefs/*.ts）
3. 用 Regex 把每一行步驟文字配對到對應的 TypeScript 函式
4. 執行該函式

所以它是一個「直譯器」，不是「編譯器」，不會產生中間的 .test.ts 檔案，而是在 Runtime 直接解讀 .feature 並呼叫對應的程式碼。

這也是為什麼一個 Step Definition 可以服務上百個 Scenario，因為它只要寫一個 Regex Pattern，所有符合這個 Pattern 的步驟都會被這同一個函式處理。像是「新增使用者」這個 When Step，不管你是新增正式員工、技師、經銷商人員還是外包客服人員，通通都是同一個 Step Definition 在處理。

那它怎麼測到真正的實作呢？關鍵在 hooks.ts：

Before(async function () {
  this.prisma = sharedPrisma;             // 真實的 Prisma Client
  this.app = createApp(this.prisma);       // 真實的 Express App
  // 清空所有資料表，確保每個 Scenario 獨立
  await prisma.$executeRawUnsafe('DELETE FROM users');
});

每個 Scenario 執行前：
- 連接真實的 MySQL 資料庫（Docker）
- 建立真實的 Express App（含所有路由和 Handler）
- 清空資料庫確保測試隔離

Step Definition 裡面透過 supertest 發送 HTTP 請求：

const response = await request(this.app)
  .post('/api/users')
  .send(requestBody);

supertest 會在 in-process 呼叫 Express App，不需要真的啟動 Server 監聽 Port，但所有的 Handler 邏輯、Prisma ORM 查詢、MySQL 操作都是真實執行的。

整個流程：

.feature (Gherkin DSL)     → 定義「測什麼」（254 個場景）
       ↓ Runtime Regex 配對
stepdefs/*.ts (Given/When/Then) → 定義「怎麼測」（10 個檔案）
       ↓ supertest 呼叫
handlers/*.ts + Prisma          → 真實的商業邏輯 + 真實的資料庫

對 SDD 來說 Cucumber 非常適合，因為 Feature 檔案本身就是 Spec，AI 可以從 Spec 直接生成 Step Definition 和 Handler 的實作，形成一個從規格到程式碼的自動映射。而且因為是用中文寫的 Gherkin，PM 和 QA 也可以直接閱讀和驗證測試場景是否符合需求，真正做到「活文件」的效果。

另外一個好處是 Cucumber 已經是行之有年的套件，橫跨了許多常見的語言 https://cucumber.io/docs/installation/，不用自己從頭手刻，大家可以試試看！