## 本日讀者定位

> OVERRIDE：本篇不繼承全域 /target-audience.md，以下定義完整取代。

## 目標讀者

已在用 Claude Code 的技術用戶，正在評估或剛開始試 Codex。
熟悉 CLI、JSON 設定檔、基本 bash。
不需要解釋什麼是 agent、hook、plugin。

## 痛點（前三行必須命中至少一個）

1. 把 Claude Code 的習慣直接搬過去，發現根本行不通
2. 不清楚兩個工具的架構差在哪，只知道「感覺不一樣」
3. 想用 Codex 複製某個 Claude Code 的工作流，但找不到對應做法

## 他們想知道的

- Claude Code 裡的 X，在 Codex 裡對應的是什麼？
- 這個功能在 Codex 根本沒有的話，替代方案是什麼？
- 哪些坑是已知的，讓我不用自己踩一遍？

## 寫作調整方向

- 技術名詞不需要解釋，直接用（settings.json、Stop hook、plugin、binary 等）
- 可以貼 code block，讀者看得懂
- 對比格式有效：「Claude Code 是這樣，Codex 是這樣」
- 不需要「讓完全沒技術背景的人讀完覺得我也可以試」這個目標

## 讀完之後讀者應該能

1. 說清楚 Claude Code plugin hook 的注冊機制，理解為什麼在 Codex 沒有對應物
2. 知道 ralph-loop 的 Stop hook 依賴 plugin 系統，無法直接移植
3. 對「Claude Code → Codex 踩坑」系列產生期待，知道後面還有哪些差異會被拆解
