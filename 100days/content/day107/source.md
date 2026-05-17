Day 107 家裡另一台 Mac 當 LLM 伺服器——Ollama + Tailscale + Raycast 全流程

最近 Gemma 4、MLX 的新版、TurboQuant 都很熱門，感覺應該要來研究一下本地模型了。

家裡兩台 Mac，與其兩邊各裝一份、各下載模型，不如一次把架構做對——比較強的 MacBook Pro 當 Ollama Server 跑運算，比較弱的 MacBook Air 當 thin client 只下指令，Raycast 接上去當前端。主幹三段（主機、客戶端、前端），外加 MagicDNS 與 MCP 兩個補強，中間被 Ollama 一個 anti-DNS-rebinding 檢查擋了半個晚上，這篇連坑一起寫。


【主機：讓 Ollama 只在 tailnet 露出，網路層就是驗證層】

Ollama 預設綁 127.0.0.1:11434，只有本機能連。關鍵：Ollama 沒有 API key、沒有 token、沒有任何驗證——"誰連到那個 port" 直接等於 "誰能用你的 LLM"。網路層就是 authz layer，port 能在哪些介面上露出必須精準控制。

要讓 Air 連得到，網路上常見的做法是打開 Ollama App 的 "Expose Ollama on the network"，或 launchctl setenv OLLAMA_HOST "0.0.0.0:11434"。但這兩個都是把 port 綁到**所有**介面——咖啡店、機場、共用會議室的 Wi-Fi 上任何人都能打到你的 11434。Tailscale ACL 只管 tailnet overlay 那層的流量，管不到實體 LAN。

讓 Ollama 自己綁在 Tailscale 介面 IP：

```
tailscale ip -4                               # 查這台 Pro 的 tailnet IP
launchctl setenv OLLAMA_HOST "100.x.y.z:11434"
pkill -x Ollama && open -a Ollama
```

綁在**特定非 loopback IP** 有兩個作用：

→ 只有 utun（tailscaled 的虛擬介面）上開 listener。實體 Wi-Fi / 有線網卡的 socket 沒開，同網段掃不出 port
→ Ollama 判定自己進了遠端模式，Host header 檢查放寬（任何 Host 都收）

Air 這邊什麼都不用動——MagicDNS 把 `dawsons-macbook-pro` 解成同一個 `100.x.y.z`，本來就打得到。

驗證：

```
lsof -iTCP:11434 -sTCP:LISTEN   # 只看到 100.x.y.z:11434
```

小代價：Tailscale IP 在裝置重新註冊時會換、launchctl setenv 重開機會忘——要持久就寫 `~/Library/LaunchAgents/*.plist`。不用架 reverse proxy、不用發 bearer token，架構最簡單。


【客戶端：砍掉 GUI 只留 CLI】

Air 這邊要做減法。原本的 Ollama.app bundle 包了 GUI、menu bar icon、背景 daemon、一條指向 /usr/local/bin/ollama 的 symlink。既然 Air 不自己跑模型，daemon 就是純粹浪費 RAM。清掉重裝成 CLI-only：

```
pkill -x Ollama
rm -rf /Applications/Ollama.app ~/.ollama
sudo rm /usr/local/bin/ollama
brew install ollama
```

Homebrew 的 ollama formula 是純執行檔，沒 GUI、沒 daemon，之後 brew uninstall 一句話清乾淨，不會像 .app 版那樣到處留東西。

再把指向主機的環境變數寫進 ~/.zshrc：

```
export OLLAMA_HOST=http://dawsons-macbook-pro:11434
```

source 一下，ollama list 就會列出主機上的模型，ollama run gemma4:e4b 的輸出也會串流回 Air 的終端機。體感跟本機跑一樣。


【用 MagicDNS 不要用 IP】

Tailscale IP（100.x.y.z）綁在這次的裝置註冊——重灌 Tailscale、移除再加回 tailnet，IP 都會換，.zshrc 要跟著改。MagicDNS 主機名稱綁在 tailnet 裡的名字，只有你自己去 System Settings 改 Sharing hostname 才會變。

能用 MagicDNS 就用 MagicDNS，設完忘掉。


【把 Raycast 接上去】

一旦接好，按 option+space 呼出 Raycast AI，背後跑的卻是另一間房那台 Pro 的本地模型。

Raycast 有一個叫 Local Models 的功能（Settings → AI → Local Models），預設找 localhost:11434。改成指向主機：

→ Ollama Host 欄位填 http://dawsons-macbook-pro:11434
→ 按 Sync Models

Raycast 會把主機上的模型同步過來（我這邊是 6 個），Quick AI、AI Chat、自訂 Command 都能選它們當底層模型。

Raycast 把這個叫 "Local Models" 很有意思。體驗上確實是本地的——免費、私密、資料不進雲端。但推論可能跑在隔壁房、跑在公司、甚至跑在你家客廳。"本地" 的定義被放寬成 "我信任的網路範圍內任何一台機器"，遠端主機在 UI 層完全隱形。


【讓模型能上網搜資料】

本地模型被訓練資料的時間點鎖死，問它 "最近"、"最新" 的東西就瞎掉。我補這塊的方式是 Raycast + SearXNG MCP server——整條 query 不出私網，而且不用另外開一個前端。

Raycast 的 AI Extensions / Chat With Ollama 其實支援 MCP server，也能對 Ollama 做 tool calling——只是 Ollama 那邊 streaming tool calls 官方剛補齊，Raycast 整合這塊還標成 Experimental。實測穩定度夠日常用。

先在 Pro 上起 SearXNG。建 ~/searxng/settings.yml（formats 必須開 json，MCP 會用 JSON API 打它；limiter 關掉避免被自己 polling 擋住）：

```yaml
use_default_settings: true
server:
  secret_key: "用 openssl rand -hex 32 產一把"
  limiter: false
  image_proxy: true
search:
  formats:
    - html
    - json
```

起 container（Docker 容器不好直接綁 host 的 utun IP，這邊換做法：只綁 loopback，再用 tailscale serve 露到 tailnet）：

```
docker run -d --name searxng \
  -p 127.0.0.1:8080:8080 \
  -v ~/searxng:/etc/searxng \
  --restart always \
  searxng/searxng

tailscale serve --bg --http=8080 http://localhost:8080
```

從 Air 打 curl "http://dawsons-macbook-pro:8080/search?q=test&format=json" 能拿到 results 陣列就對了。

Air 這邊不用另外 install，Raycast 啟動 MCP server 時 npx 會自己拉 ihor-sokoliuk/mcp-searxng 這包。Raycast 開 Install Server，把這段 JSON 先 copy 到剪貼簿，它會自動填表：

```json
{
  "mcpServers": {
    "searxng": {
      "command": "/Users/你/.nvm/versions/node/vXX/bin/npx",
      "args": ["-y", "mcp-searxng"],
      "env": {"SEARXNG_URL": "http://dawsons-macbook-pro:8080"}
    }
  }
}
```

command 要用絕對路徑指到 npx。Raycast 不吃 nvm 的 PATH shim，寫 "npx" 直接會找不到。

接下來打開 Raycast，option + 空格叫出面板後 tab，就可以直接跟 LLM 對話，在對話裡直接：

→ @searxng 最近 Ollama 有什麼新功能？

模型會發出 searxng_web_search 的 tool call，結果從 Pro 的 SearXNG 吐回來、Pro 的 Ollama 合成答案——整條 query 完全沒出過私網。

（Ollama 自家還有一個 Web Search API，但 query 會過 ollama.com 雲端，跟 "資料不出私網" 這條線衝突，就不考慮了。）


【結語】

整套設定下來我最喜歡的，是那個抽象層次真的對了。硬體放哪裡、連線怎麼走、用哪個模型，全部變成 Raycast 看不到的細節。客戶端只知道 "我有本地 AI 可以用"。

如果你手邊有兩台 Mac、一台常用一台閒置，又還在兩邊各裝一份 Ollama——推薦把架構砍乾淨。強的那台重新有事做，弱的那台少吃幾 GB RAM，CPU 也不會原地起飛。
