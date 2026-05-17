## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

如果你已經照 day107 在 Mac 上架了 local LLM，這篇告訴你另一條效能更好的路——以及換過去會踩到的三個坑。

## 讀者起點

- 讀過 day107，知道 Ollama + Tailscale + Raycast 的基本架構概念
- 可能碰過 Ollama 長對話變慢的問題
- 不熟悉 MLX 框架、llama.cpp 等推理層差異
- 不知道 oMLX 是什麼，也不知道它跟 Ollama 的預設差在哪

## 需要翻譯的概念

- MLX-native → 專門為 Apple 晶片設計的跑法，不繞路
- llama.cpp → 一個通用的模型推理引擎（oMLX 不用這個，直接走 Apple 自己的路）
- context / long context → 對話記憶的長度，越長模型要處理越多東西
- 吞吐 (throughput) → 模型回答的速度
- SSD cache → 把模型暫存在硬碟上，切換時不用重新載入
- Bearer token → 一把通行密碼，每次打 API 都要附上
- OpenAI-compatible / Anthropic-compatible → 講同一種語言的接口，不同工具都能接
- bind 到 tailnet → 把服務掛到你的私人網路上
- BYOM (Bring Your Own Model) → Raycast 讓你接自己模型的功能
- ACL → 存取控制清單，決定誰能連到你的服務

## 讀完之後讀者應該能

1. 知道 oMLX 跟 Ollama 的核心差別在哪，什麼情況下值得換
2. 避開從 Ollama 換到 oMLX 時最常踩的兩個坑（auth 預設、Raycast 入口）
3. 判斷自己該不該保留 API key 驗證，還是純靠 Tailscale 就夠
