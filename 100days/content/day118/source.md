Day 118 Claude Design 的本質：一份 system prompt 的解剖課

前一陣子很多人在瘋傳 Claude Design 有多神——生出來的 UI 品質比普通 Claude 好很多。

其實背後沒有什麼特別的模型訓練，就是一份 system prompt（給 AI 的行為說明書）。

這篇適合有在用 Claude、想知道為什麼 Claude Design 輸出比較好的人。不需要工程背景。

所以厲害的基礎是 Claude 這個模型本身，但那份設定決定了你能用出多少——設計這份設定本身是一門學問。
今天來拆一下，這份 system prompt 做到了哪些一般人自己寫 prompt 做不到的事。

（Source: github.com/elder-plinius/CL4R1T4S）

## 角色 + 關係，一句話定清楚

```
"You are an expert designer working with the user as a manager."
```

一句話做兩件事：
- 設定身份（expert designer）
- 設定權力關係（使用者是主管，模型是員工）

這個框架決定了整個互動的動態。模型不會反客為主，會主動問問題、提早 show 成果等待確認，而不是一口氣生出一個大東西讓你面對。

## 把 LLM 的壞習慣列成禁令

這份 prompt 裡有很多 "never do X"。每一條都不是隨便寫的，背後是踩過的坑：

```
Never use 'scrollIntoView' -- it can mess up the web app.
```

還有這個：版本號和驗證碼直接寫死在 prompt 裡。原因：如果只給 AI 一個大概版本號，它會自己補齊細節，補錯了就頁面爆炸。把正確答案直接寫死，AI 就沒有發揮空間了。

把失敗案例轉成規則，這是這份 prompt 很多地方在做的事。

## 不只防爆炸，還防 AI 味

技術禁令防的是頁面爆炸，但這份 prompt 還有另一層：防止「AI 味設計」。

幾個例子：

- 顏色要從品牌設計系統取，不要自己發明
- 表情符號只在設計系統本來就有用到的情況下才能用
- `"Avoid web design tropes"` — 除非真的在做網頁，否則別用那套 AI 最愛的視覺模板

這些規則防的不是技術問題，而是「一眼看出是 AI 做的」那種設計感。

把品味也直接寫死在 prompt 裡——這是比技術禁令更有趣的一層，也是比較少人注意到的。

## 把設計 SOP 轉成預設流程

一般人問 Claude「幫我做個 UI」，通常得到 generic 的結果。這份 prompt 強制走六步驟：

1. 先問問題，搞清楚需求
2. 找現有的設計系統、UI kit（設計師的標準零件庫）
3. 列 todo
4. 建資料夾結構
5. 完成後確認沒有 error
6. 只說後續步驟，不用總結

其中最關鍵的是步驟 2，prompt 明確寫著：

> "Good hi-fi designs do not start from scratch — they are rooted in existing design context."

（hi-fi 指接近成品品質的設計）

這是資深設計師的直覺：先找現有設計語言，不要從白紙開始。沒有這條規則，模型的預設就是從零生成，風格往往不一致。

---

把資深設計師才知道的 SOP，直接 hardcode 進提示詞，讓它變成所有人的起點。

prompt 工程是可以拆解、可以學習的技藝。你也可以用同樣的思路設計自己的 AI 工具。

下次你在寫 ChatGPT 或 Claude 的 prompt，可以試試：先定好角色和關係、把你踩過的坑列成禁令、把你想要的流程一步一步寫進去。
