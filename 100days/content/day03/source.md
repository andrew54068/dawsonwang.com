# Day 3｜Antigravity-Manager 實測心得 🛠️
稍微研究了一下這篇提到的神級工具 Antigravity-Manager，推薦理由如下：
✅ 額度聚合：整合多個 Google 帳號，即時監控額度資訊。
✅ 免費使用 Claude Code：透過建立 Proxy 使用 Antigravity 的額度。
只要照著 GitHub 說明開啟反向代理，並設定環境變數：
```
export ANTHROPIC_API_KEY="sk-antigravity"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8045"
```
就能用 Gemini Pro 的成本，體驗 Claude Code 的強大功能！🚀
以下附上參考來源
https://www.threads.com/@darkseoking/post/DSzbTOOk2L2

💡 這邊科普一個冷知識
Q：用 Antigravity/Cursor/Windsurf 這些 IDE 選 Claude 模型，跟直接用官方 Claude Code 差在哪？
1. 中間人 vs. 原廠直出
Antigravity 這類 IDE 是「模型聚合器」。因為模型是 無狀態 (Stateless) 的，為了延續對話，IDE 必須不斷把歷史訊息重複餵給模型。 這導致 Token 消耗是 疊加成長 的（第一次 10，第二次變成 10+10+10...）。IDE 的商業模式之一，就是透過演算法幫你「壓縮」這些上下文來賺取價差。
2. 穩定性 vs. 靈活性
IDE (Antigravity/Cursor/Windsurf)：強在可以無痛切換模型，且幫你優化 Token 管理，但依賴中間層的壓縮技術。
Claude Code：官方親兒子，完全由自家模型處理，沒有中間商賺價差，品質最穩，但就綁定在 Claude 生態。
結論：有意識地控制 Context（不同主題開新對話）才是省錢王道！工具沒有絕對好壞，端看你的需求。

![image](./attachments/day3.jpg)