Feature: WebMCP 公開內容
  Scenario: 代理搜尋網站內容
    Given 瀏覽器支援 WebMCP
    When 代理搜尋文章或全站內容
    Then 工具回傳標題、摘要及同站原文連結
    And 頁面顯示相同搜尋結果
  Scenario: 讀取公開頁面
    When 代理讀取文章、專案、主題或服務頁
    Then 回傳公開正文及連結
    And 拒絕外部網址、API 與非公開路徑
  Scenario: 不支援 WebMCP
    Given 瀏覽器沒有 modelContext
    Then 一般瀏覽及搜尋仍可正常使用

  Scenario: 搜尋連結指向公開路徑
    When 從 Astro 的 dist/client 產生搜尋索引
    Then 結果網址不含建置目錄 client
