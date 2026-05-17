> OVERRIDE：本篇不繼承全域 /target-audience.md

## 本日讀者定位

本篇是 Day 121 的延伸應用：把 `ralph-expert`（一個產生 ralph-loop 指令的 skill）、GAN 思維（生成器 vs 判別器）、`/codex:rescue`（Day 121 介紹的 Codex 子代理）三個東西組起來，做出一個半自動跑程式碼遷移的 prompt 範本。作者實測在自己的 Python → TypeScript 專案上跑過。

目標讀者：Claude Code 重度使用者，尤其是已經看過 Day 121、知道 `/codex:rescue` 是什麼的人。對 ralph-loop、subagent、context window 管理有基本概念，正在尋找把 Claude + Codex 組合起來打更難任務的具體模式。完全零技術背景的一般使用者不是本篇 TA。

## 本日主題對讀者的意義

跑程式碼遷移最大的痛點是「主對話 context 撐不住 + 沒有客觀完成條件」。這篇給一個現成的組合拳：ralph-expert 幫你包好骨架、GAN 結構讓不同模型互相把關、subagent 讓 30 輪迭代下來主對話只累積 5K token——直接拿去改自己的遷移任務就能用。

## 讀者起點

- 知道 Claude Code 是什麼，會用 slash command 跟 skill
- 知道 `/codex:rescue` 來自 Day 121 介紹的 codex-plugin-cc，是另一個模型的 subagent
- 聽過 ralph-loop 的概念（一個 prompt 自動迭代到完成），但可能沒實際跑過
- 知道 subagent 可以分擔 context、用完即丟
- 不一定知道：ralph-expert 是哪個 skill、`--max-iterations`、`--completion-promise` 這些 flag 的細節、GAN（生成對抗網路）原本在 ML 裡的意涵
- 對「程式碼遷移」（migration）這個情境有共鳴：Python 改 TypeScript、Vue 2 升 Vue 3、CommonJS 轉 ESM 之類

## 需要翻譯的概念

- ralph-expert → 一個 skill，輸入「我想做 X」，吐出結構良好的 ralph-loop 指令（含 max-iterations、completion-promise、phase 拆分）
- ralph-loop → 一種「跑同一個 prompt 直到完成條件達成」的迭代模式
- GAN（Generative Adversarial Network）→ 原本是 ML 概念，這裡借用「生成器寫東西、判別器挑剔」的對抗思維
- 生成器（Generator）／判別器（Discriminator）→ 寫 code 的角色 vs review 的角色
- /codex:rescue → 在 Claude Code 內呼叫 Codex 的 slash command，本質是另一個模型的 subagent（Day 121 詳解）
- subagent → 主對話之外、獨立 context 的子代理，做完即丟、不污染主對話
- context window → AI 一次能讀／記住的對話量，跑越久越會被歷史塞爆
- phase → 把大任務切成小段（schema → service → caller → test），一段一段過
- completion-promise → ralph-loop 的「完成條件」flag，要寫具體（如 ALL_PHASES_APPROVED）
- max-iterations → 最大迭代輪數，當判別器永遠不點頭時的安全網
- rollback → 回滾，做壞了把那個 phase 的改動退回去
- migration → 程式碼遷移，把專案從一個語言／框架改寫到另一個

## 讀完之後讀者應該能

1. 看懂「ralph-expert + GAN + /codex:rescue」這個組合拳的角色分工（誰寫、誰挑剔、誰當總指揮）
2. 知道為什麼要分 phase + 重度使用 subagent——不是潔癖，是 context window 撐不住的工程理由
3. 拿作者那段 prompt 當範本，改成自己的遷移任務（先小範圍試水溫，記得設 `--max-iterations` 跟具體的 `--completion-promise`）
