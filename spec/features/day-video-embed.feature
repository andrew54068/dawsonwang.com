Feature: 文章內嵌影片
  source.md 用 ![alt](attachments/clip.mp4) 內嵌影片，跟內嵌照片同一種寫法。
  100Days 的發佈前檢查會問這個網站：建置有沒有複製這支影片、頁面有沒有 <video> 播它。
  兩個都沒有，影片日就不能上線（Day 282）。

  Scenario: 內嵌的 mp4 會跟著建置上線
    Given source.md 內嵌 attachments/clip.mp4
    When 建置複製當天的素材
    Then public/content/dayNN/attachments/clip.mp4 存在

  Scenario: 沒被引用的影片不會上線
    Given attachments/ 裡還有一支 clip.original.MOV 沒被 source.md 引用
    When 建置複製當天的素材
    Then 它不會被複製

  Scenario: 內嵌的 mp4 在文章頁是可以播放的影片
    Given source.md 內嵌 ![現場](attachments/clip.mp4)
    When 文章頁渲染內文
    Then 那個位置是 <video controls>，src 是 /content/dayNN/attachments/clip.mp4
    And alt 文字放進 aria-label，並經過跳脫
    And 照片照舊渲染成 <img>
