Day 14 自製 Thread 發文機器人 - Gherkin 文件實戰
承接昨天的話題
今天重點在於「寫文件」
我們需要與 AI 協作，產出符合標準的格式化文件，而非僅是單純的文字敘述
昨天提到的 BDD 即具備此標準：Given-When-Then

1. Given：給定的特定條件
2. When：使用者或系統接收的輸入
3. Then：預期的輸出或結果

Gherkin 是專為 BDD 發展的語言，Cucumber 則是搭配的框架。Gherkin 擁有既定語法來描述需求，讓 AI 能據此生成測試，接著透過 TDD 實作直至測試通過。雖然許多人強調 BDD，卻鮮少提及 Gherkin。其實它支援度極高，主流語言皆有對應版本。
Gherkin 的本質是將「需求文件」轉化為「驗收標準」，這正是與 AI 協作的關鍵拼圖。過去文件容易過時，是因為它與程式碼分離；但 Gherkin 透過 Cucumber 直接驅動測試，強制讓規格與實作保持同步。這對 AI 而言是最精確的指令：我們用結構化的語言定義「做什麼（What）」，而將「如何做（How）」的實作細節交給 AI。這不僅確保了開發方向的精確，更讓文件真正「活」了起來，成為驅動專案的核心。

AI 生成內容如下：

Feature: Daily Threads Feed Scanning
  As a 100 Days Challenge participant
  I want the bot to automatically scan my Threads home feed daily
  So that I can discover valuable AI/business content for inspiration

  Background:
    Given the system is running in Docker on macOS
    And Threads API credentials are stored and valid
    And timezone is set to Asia/Taipei (UTC+8)

  Rule: Scan runs automatically at 9:00 AM daily

    Example: First-time scan (no previous scan history)
      Given no previous scan_job exists
      When scheduled scan job triggers at 9:00 AM
      Then fetch posts from last 24 hours
      And store all posts to database
      And mark scan as completed

我們的目標是專注於生成詳細、具體且可執行的文件，接著讓 AI 生成測試並透過 TDD 實作，直至通過所有測試。我們僅需負責監督，換言之，寫完文件就差不多可以下班了。