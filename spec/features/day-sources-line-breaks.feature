Feature: 文章最後的出處一行一個連結
  source.md 的出處寫在最後一條 --- 之後，一行一個「標籤：網址」，行和行之間沒有空行。
  Markdown 會把連續的行併成同一段，出處在文章頁擠成一整團（Day 290）。

  Scenario: 最後一條 --- 之後，每一行各自換行
    Given source.md 最後一條 --- 之後有三行「標籤：網址」
    When 文章頁渲染內文
    Then 三個連結之間各有一個 <br>，每一行只有一個連結

  Scenario: 內文的段落不受影響
    Given 內文有一段跨兩行、中間沒有空行的文字
    When 文章頁渲染內文
    Then 那兩行照舊併成同一段，沒有 <br>

  Scenario: 沒有 --- 的文章照舊渲染
    Given source.md 沒有任何 --- 分隔線
    When 文章頁渲染內文
    Then 輸出跟原本一樣
