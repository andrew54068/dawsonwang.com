Day 48 千萬不要這樣玩 OpenClaw

TL;DR: 不要直接用 OpenClaw 串接你的訂閱帳號，非常有可能被 ban

之前由於 Antigravity 賬號被 ban 的緣故，想說來研究看看到底是什麼原因造成帳號可能會被鎖，不過因為 Antigravity 不是開源的所以沒得研究。
最近想重新把龍蝦拿出來改造一下，所以想研究看看能不能讓 OpenClaw 接上 Claude Code 的訂閱方案，不是說每次重置就叫他做事，但至少可以盡量把額度用好用滿。
研究後發現很多 AI 的應用都是用 pi-mono 這個套件來處理串接不同 LLM provider 的需求，所以就直接去翻他的原始碼來研究

為什麼這樣做可能會被 ban？

1. 違反服務條款：Claude Pro/Max 訂閱是給個人透過官方客戶端使用的，拿 OAuth token 去跑第三方工具很有可能違反服務條款 (ToS)。

2. 客戶端偽裝：專案直接在 packages/ai/src/providers/anthropic.ts 都寫了「Stealth mode」，用了 Claude Code 的 client ID、偽裝 user-agent、注入官方系統提示詞、對照工具名稱，就是要讓 Anthropic 的伺服器以為請求來自官方 CLI。

3. 異常使用模式：即使偽裝了，Anthropic 應該還是能偵測到不同的工具行為模式、IP/裝置指紋不一致、自動化使用的速率異常、自訂系統提示詞等。

4. OAuth scope 濫用：user:inference 這個 scope 本來是給 Claude Code 內部使用的，第三方應用程式拿來用並不在預期的授權範圍內。

結論是在使用訂閱額度前要先知道軟體是用什麼方式串接的，串接的方式是不是違反了 ToS。
所以之前 Antigravity 帳號被 ban 很可能就是 Antigravity Manager 也是用 pi-mono 然後 Google 那邊有去偵測 fingerprint 之類不符，知道是第三方工具在用訂閱額度就直接鎖帳號了。
如果想安全地使用 Claude 的能力來驅動自己的 agent，最正規的做法還是乖乖用 API key 搭配 pay-as-you-go 的方案，雖然要花錢但至少不會有帳號被鎖的風險。

有人提出那如果使用官方的 Claude Agent SDK 呢？就連 Claude Code 底下都是直接用這個 SDK，他本身也不處理 Oauth 而是包著 Claude CLI 的 binary，真正處理 request 的其實是那個不開源的 CLI，所以理論上如果我們用這個 SDK 走 Oauth 應該他就分辨不出來是第三方工具在用吧？那這樣可行嗎？
其實官方有明確的寫到：
Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Please use the API key authentication methods described in this document instead.

https://platform.claude.com/docs/en/agent-sdk/overview

這邊也是明令禁止使用，即使你是基於 Agent SDK 打造的應用也是不行的喔！？

你以為故事這就結束了？接下來可說是越來越詭譎了

在這裡 https://github.com/anthropics/claude-agent-sdk-python/issues/559 有人也提出了相同的需求，最下面大家都說可以用一個官方指令 claude setup-token，它會產生：

✓ Long-lived authentication token created successfully!

Your OAuth token (valid for 1 year):

sk-ant-oat01-xxxx

Store this token securely. You won't be able to see it again.

Use this token by setting: export CLAUDE_CODE_OAUTH_TOKEN=<token>

官方支援的指令讓我們可以產生效期一年的 OAuth token，這不是打臉了剛剛說的 ToS 嗎？

https://www.reddit.com/r/Anthropic/comments/1qxplzf/confused_about_claude_setuptoken_billing_with/
有人也有相同的疑惑，目前貌似還沒有官方的解答
留言說是給 CI/Docker 使用的，那感覺就是防君子不防小人囉？

到這裡我覺得這條路還是通的，只是一個小暗門，大家如果要用的話不要太招搖，例如若直接設定定時觸發，一旦被判定成是機器人而被直接封鎖帳號也不奇怪。