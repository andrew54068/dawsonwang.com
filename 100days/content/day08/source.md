Day 8

今天來分享一下最近發現的新攻擊手法，這是北韓駭客組織 Lazarus Group 的 "Contagious Interview" 行動的最新演進版本。

## 什麼是新的？

過去 Contagious Interview 使用 "ClickFix" 等手法來感染受害者，但最近發現了一個**全新的感染技術**：利用 VSCode 的 tasks.json 檔案來執行惡意程式。

手法跟當初這個差不多，只是真正攻破裝置的手法置換了而已：
https://medium.com/@dawson54068/%E6%8E%89%E4%BA%86%E4%B8%80%E5%8F%B0%E9%80%B2%E5%8F%A3%E8%BB%8A%E7%9A%84%E6%95%85%E4%BA%8B-609421ca2e09?sk=7cb053a2b19bb5671ad5ba5fa8358c6d

## 攻擊流程

1. **社交工程起手式**：駭客會在 LinkedIn 上偽裝成招募人員，用高薪職缺或是程式測驗來吸引軟體工程師
2. **惡意專案陷阱**：受害者會被要求 clone 一個看似正常的 GitHub/GitLab/Bitbucket repository
3. **VSCode Task File 執行惡意程式（新招式）**：只要你用 VSCode 打開這個專案並且點擊「信任」，攻擊者就可以透過 `.vscode/tasks.json` 執行任意的 script，讓你的裝置處於危險當中

這個新手法從 2025 年 4 月開始被觀察到，完全取代了之前的 "ClickFix" 感染方式。搭配大量投放惡意 npm packages（一個月內將近 200 個套件，下載量超過 31,000 次），讓這個攻擊變得更加危險。

## 攻擊者會竊取什麼？

- 鍵盤輸入記錄、螢幕截圖、剪貼簿內容
- 瀏覽器儲存的憑證
- 加密貨幣錢包資料（包括助記詞）
- 原始碼與內部敏感文件

## 如何防範？

### 基本原則
不要任意打開不明專案，即使是工作需求也要謹慎。看到 LinkedIn 上要求你 clone repository 做測驗的面試邀請，請提高警覺。

### 進階防護：使用 Dev Containers

如果真的有需要開啟不信任的專案，可以使用 VSCode 的 **Dev Containers** 擴充功能。

Dev Containers 是微軟開發的 VS Code 擴充，可以讓你在 Docker 容器內進行開發。它的運作原理是在容器內安裝 VS Code Server，讓你從本地的 VS Code 連接到開發用的 Container，透過 Volume 掛載程式碼。

**為什麼 Dev Containers 可以提升安全性？**

1. **隔離環境**：即使惡意程式碼執行，也只會影響容器內的環境，不會直接危害你的本機系統
2. **用完即丟**：可以隨時刪除容器，不留痕跡
3. **標準化開發環境**：順便解決 "it's working on my machine" 的問題

**如何使用？**

1. 安裝 [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 擴充
2. 在專案中按下 `Cmd + Shift + P` (macOS) 或 `Ctrl + Shift + P` (Windows)
3. 輸入 `Dev Containers: Reopen in Container`
4. 選擇適合的容器環境（或使用專案現有的 Dockerfile）

這樣一來，即使專案內有惡意的 `tasks.json`，執行的範圍也被限制在容器內，大幅降低風險。

### Claude Code 的額外好處

如果你是 Claude Code 的使用者，[官方文件](https://code.claude.com/docs/en/devcontainer)中有提到一個實用技巧：

在 Dev Container 環境下，你可以相對安全地使用 `claude --dangerously-skip-permissions`，因為即使 AI 執行了危險指令，影響範圍也被限制在容器內。

這樣做的好處是：
- 不用每次都手動批准 command 執行權限
- 享受 AI 自動化的便利性
- 同時保有容器隔離的安全性

**但請注意**：前提是你要先確認 mount 進容器的檔案範圍。如果你把整個家目錄或是敏感資料都 mount 進去，那容器隔離也救不了你。建議只 mount 必要的專案目錄。

這個概念其實跟我昨天分享的 [Permission Guardian](https://github.com/andrew54068/claude-plugins) 有異曲同工之妙，都是在追求便利性與安全性之間找到平衡點。

**延伸閱讀**：
- 原文：https://opensourcemalware.com/blog/contagious-interview-vscode
- Dev Containers 詳細介紹：https://myapollo.com.tw/blog/vscode-dev-containers/