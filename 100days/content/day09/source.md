# Day 9: 被罵「套殼」的 Manus AI，憑什麼月入千萬美金？

Manus AI 最近引爆矽谷討論，月費 $40 美金，用戶破千萬。但很多技術人員不屑：「不就是套殼嗎？用別人的模型包一層 UI 而已。」

但真的是這樣嗎？

**答案可能讓你意外：套殼，但值錢。**

Manus 的秘密武器不是「更強的模型」，而是 **執行層 (Execution Layer)** 和 **Context Engineering (脈絡工程)**。

Meta 花 20 億美金買的，其實不是另一個 LLM，而是「讓 AI 擁有四肢」的能力。
根據分析，Manus 擁有 **147 兆 (Trillion) token** 的強化學習數據，並在 **8000 萬個虛擬環境** 中訓練過。這讓它能跨越「機率性 (Probabilistic)」的 LLM 回答，透過多代理人協作 (Multi-agent Orchestration)，達成「確定性 (Deterministic)」的任務執行。

這正如符合 Steve Jobs 哲學的一句話：「你買公司是為了買時間 (You buy companies to buy time)。」Meta 買的是通往未來的這張「執行力」門票。

但對我們個人開發者來說，現在就要這種能力怎麼辦？

Manus 的核心邏輯其實是：**把大腦清空，把事情記在筆記本上。** (Context Offloading)

現在，你不需要等 Manus 產品上市。開源專案 **"Planning with Files"** 已經完美復刻了這個邏輯！

---

### 為什麼你需要 Planning with Files？

這個 Claude Code Skill 強迫 AI 進入「Deep Work」模式，遵守 **3-File Pattern**：
1.  `task_plan.md`: 規劃任務步驟
2.  `findings.md`: 紀錄研究發現
3.  `progress.md`: 追蹤執行進度

## 🧐 超級比一比：Planning with Files vs Claude Plan vs Spec Kit

市面上有幾種主流的 AI 規劃工具，但它們解決的問題其實完全不同。我幫大家整理了這張比較表：

| 工具 | 角色 | 專長 | 關鍵差異 (大白話) |
| :--- | :--- | :--- | :--- |
| **Claude Code Plan Mode** | 🧠 **軍師 (Strategist)** | **高層次戰略**。它是一次性的、Read-only 的。它看完你的程式碼後，給你一個戰略建議。 | **這是一張地圖 (Map)** 🗺️<br>出發前看一眼，但開始跑之後它就不見了。走到一半迷路它救不了你。 |
| **GitHub Spec Kit** | 📐 **建築師 (Architect)** | **定義規格 (Spec-Driven)**。它強迫你先把 "Intent" (意圖) 寫清楚，產出一份不可動搖的「憲法」。 | **這是一份藍圖 (Blueprint)** 🏗️<br>確保蓋出來的房子不會歪掉，適合需求還很模糊的時候用。 |
| **Planning with Files** | 👷 **專案經理 (PM)** | **落地執行 (Deep Execution)**。它是唯一能「持久化」追蹤進度的工具。它強迫 AI 邊做邊紀錄。 | **這是有語音導航的 GPS** 📍<br>它會跟著你走。走錯路了？它會重新規劃路線。它把記憶存在硬碟，不會因為對話太長就忘記要去哪。 |

這聽起來根本是 AI 的過動矯正器！原本 Claude 常常做一半跑題，或者無限迴圈，如果有這個 skill 輔助，理論上它能變得更專注，一步步劃掉待辦事項。

Structured AI > Vibes-based AI. 結構化的 AI 才是真正的生產力。

推薦大家立刻去安裝試試看！

🔗 Repo: [planning-with-files](https://github.com/OthmanAdi/planning-with-files)
🔗 靈感來源: [Threads Post](https://www.threads.net/@koksinghewvvvv/post/DTQakN8kolf)
🔗 參考: [Threads Post](https://www.threads.com/@fomo_soc/post/DTG9QV2Acgf?xmt=AQF0rlVEcMiMrcNgw3kqnXYEWWgDx6l2TibBuoDxreS3Zg)