Day 111 oMLX 是什麼？Mac 跑 local LLM 為什麼該認識這條路

（前提：你已經照 day107 在 Mac 上架好 Ollama + Tailscale + Raycast。還沒架的先回去看那篇。）

day107 那套 Ollama + Tailscale + Raycast 架構跑短對話沒問題，但 context（對話記憶）一長就開始撞 timeout——Raycast 端等不到回應、curl 有時要快一分鐘才回。換 oMLX 之後同樣的長 context 場景順很多，MLX-native 在 Apple Silicon 上的長對話回應速度確實有差。

oMLX 是一個專為 Apple Silicon Mac 設計的 local LLM server，直接用 Apple 自己的 MLX 框架跑。Ollama 從 0.19 preview 開始也在 Mac 上改用 MLX 了，所以 "MLX vs llama.cpp" 已經不是重點。oMLX 真正的差異在兩個地方：一是 mlx-community（MLX 格式的模型庫）上有的模型它都能直接跑，不用等 Ollama 官方目錄收錄；二是它有自己的 SSD cache（把推理過程的 KV cache 暫存在硬碟，切換模型再切回來時不用重算先前的 context）機制。

架構上跟 day107 幾乎一樣（bind 到 tailnet、客戶端用 Raycast），但 oMLX 有一些跟 Ollama 完全相反的 default，每一個都被我踩到——這篇把坑跟 diff 一起寫。

【auth 是 default on——跟 Ollama 完全相反】

day107 那篇寫過一句 "Ollama 沒有 API key、沒有 token、沒有任何驗證——誰連到那個 port 直接等於誰能用你的 LLM"。在 Ollama 的世界這是對的。oMLX 反過來——

第一次啟動就會在 settings.json 裡塞一把自動生成的 API key：

```json
"auth": {
  "api_key": "uty5xxx...czu",
  "skip_api_key_verification": false
}
```

沒帶 Bearer token（通行密碼）打 `/v1/models` 直接吐：

```json
{"error": {"message": "API key required", "type": "authentication_error"}}
```

兩種處理方式：

→ 保留驗 key，把 key 複製到 Raycast——雙層保護（tailnet + bearer）
→ 改 `skip_api_key_verification: true`，純靠 Tailscale ACL 擋

我選第一種。Tailscale ACL（存取控制規則）雖然夠嚴，但哪天 laptop 被偷、tailnet 被 compromise，bearer token 多卡一層沒壞處。

這個預設差異值得記：同一族工具（local LLM server on Mac），Ollama 認為 "網路邊界 = auth 邊界"，oMLX 認為 "network + token 雙因素"。沒有絕對對錯，但架構上要先知道自己在用哪種假設。


【Raycast 那端的雷：Local Models 看不到 oMLX】

day107 在 Raycast 用的是 Local Models 功能（Settings → AI → Local Models），那個是 Ollama-only、寫死 port 11434 的 Ollama API。oMLX 是 OpenAI-compatible + Anthropic-compatible 雙協議（跟 ChatGPT 和 Claude 講同一種 API 語言），Local Models 根本看不到它。

要走另一個入口：Custom Providers（Raycast 叫這功能 BYOM——Bring Your Own Model）。Settings → AI → Custom Providers → Reveal Providers Config，會跳出 `~/.config/raycast/ai/providers.yaml`。

貼這段進去：

```yaml
providers:
  - id: omlx-pro
    name: oMLX @ Pro
    base_url: http://dawsons-macbook-pro:8000/v1
    api_keys:
      omlx: u......czu
    models:
      - id: Qwen3.6-35B-A3B-4bit
        name: Qwen3.6 35B A3B (4-bit) — Pro
        provider: omlx
        context: 32768
```

第一次我寫成 `api_key:`（單數、string）就爆了，Raycast 跳 `unable to access AI — authorization failed`——看起來像訂閱或帳號問題，繞了一大圈才發現只是欄位名寫錯。

對 oMLX 有興趣的話可以參考這篇 https://hackmd.io/@BASHCAT/r1X6UfQc-x

還沒看 day107 的可以回去補——那篇從零架 Ollama + Tailscale + Raycast，是這篇的前置作業。
