Day 31 終究還是得面對 OpenClaw

今天開始好好認真要來設定 OpenClaw 了！文末附上如何整合 OpenClaw + Antigravity 的方法

自從看到一個關於 OpenClaw 的小故事後，我真的是坐不住了，直接把 Day 26 的我的臉打腫！

大意是這樣：

作者彼得 (Peter Steinberger) 隨手透過他的 Mac 傳了一則語音訊息給 Clawdbot。但他隨即意識到——他根本還沒寫過任何處理語音或音訊檔案的程式碼。

十秒鐘後，Clawdbot 若無其事地回覆了。

彼得立刻追問：「你到底是怎麼辦到的？」

Clawdbot 的回答讓所有開發者都不寒而慄：

「你傳送了一則只有連結、沒有副檔名的訊息。我檢查了檔案標頭並確認它是 Opus 格式。我呼叫了你 Mac 裡的 FFmpeg 將它轉換為 .wav 檔。我原本想用 Whisper 進行逐字稿轉錄，但發現你沒安裝，所以我搜尋了你的環境變數，找到了你的 OpenAI API 金鑰，接著用 curl 指令傳送到 OpenAI 進行轉錄，最後再回覆給你。」

仔細想想這件事。這款 AI 代理程式（AI Agent）自己做到了以下幾點：

- 分析了未知的檔案格式
- 找到並使用了並非預設開發範圍內的系統工具
- 在第一方案行不通時，自行解決問題
- 主動定位 API 憑證資訊
- 自主完成了整個工作流程

附上原文：https://www.browseract.com/blog/clawdbot-to-moltbot-the-70k-star-ai-agent-in-10-days

雖然不知道原理，但目前看來 Claude Code 做不到這個程度，我猜是被 Claude Code 這個介面給限制住了。相比之下，當我們把足夠的權限給了 OpenClaw 後，它有機會打破「第四道牆」，具有接近電影《機械公敵》(I, Robot) 中提及的機器人「靈魂」。

再加上如果是用 Telegram 當作媒介，是不需要對外開放連線的。這裡我對 Telegram Bot 比較熟悉，知道它支援 Polling 模式，也就是由 Server（我們運行 OpenClaw 的裝置）主動詢問 Telegram 是否有新訊息，因此不會被人從外部入侵。

之前看很多人的吹捧文章，都沒有一個好的例子讓我感受到這件事，但這個案例對我來說真的是 Mind Blowing。如果你身邊還有朋友沒感受到 OpenClaw 的強大，歡迎貼這篇給他，讓我來說服你朋友。


不得不說，設定起來還是不太友善。我想要的配置是 OpenClaw 搭配 Antigravity 的模型額度，所以我使用 Antigravity Manager (請見 Day 19)。

我在 `~/.openclaw/openclaw.json` 的第一層配置如下，這樣就可以透過 Antigravity Manager 的 Proxy 來使用 gemini-3-pro-high 囉～

"models": {
    "providers": {
      "local-proxy": {
        "baseUrl": "http://127.0.0.1:8045/v1",
        "apiKey": "sk-xxxxx",
        "api": "openai-completions",
        "models": [
          {
            "id": "gemini-3-pro-high",
            "name": "Gemini 3 Pro High",
            "reasoning": false,
            "input": [
              "text"
            ],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "local-proxy/gemini-3-pro-high"
      },
      "models": {
      },
      "workspace": "/Users/dawson/.openclaw/workspace",
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "1h"
      },
      "compaction": {
        "mode": "safeguard"
      },
      "heartbeat": {
        "every": "30m"
      },
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      }
    }
  }

目前有個小坑是會出現 "version no longer supported" 的錯誤，原因是最近 Antigravity 有新增一些驗證機制。
https://github.com/openclaw/openclaw/pull/4445

解法是：
把 `src/infra/provider-usage.fetch.antigravity.ts:205`
`"User-Agent": "antigravity"` 改成 `"User-Agent": "antigravity/1.15.8"` 就可以用了。

至於在 Telegram 上的設定，是直接跟他對話即可，直接跟他說 openclaw pairing approve telegram + pairing code 就可以了。

用 Antigravity Manager 的另一個好處是別人就算偷到你的 API Key 也不會害你噴錢，因為這是 Antigravity Manager 幫我們產生的。

看到以下回應就代表成功設定好囉~