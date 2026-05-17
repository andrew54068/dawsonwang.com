Day 32 OpenClaw 安全性體檢

接續昨天的話題，我們解決了拉力，有了為什麼要使用 OpenClaw 的動機後，接下來要解決的是兩個強大的推力：
1. 設定有夠不友善跟不直覺，例如 openclaw onboard，選了核選方塊之後竟然要回去選 skip，不是應該偵測到已經有選項就不該描述 skip for now 嗎？文末直接分享基礎設定檔！
2. 大家在呼籲安全性問題，於是在搜集了資料以及跟 OpenClaw 聊了一下之後，我決定來做個安全性體檢。

用到目前為止，我對 OpenClaw 的印象是他的進入門檻太高，所以有些髒活勢必得有人來做，而我不入地獄誰入地獄？選項太多是對新手的最大進入障礙，那我直接分享我的做法，可以幫大家省下不少時間。
今天搞了一整個下午，總算把 OpenClaw 的安全性設定搞定了，以下是我的設定以及一些心得。文末會直接分享設定檔 ~/.openclaw/openclaw.json

主要是根據這篇 https://x.com/DanielMiessler/status/2015865548714975475?s=20 做的檢查

我的配置是 MacOS + OpenClaw + Gemini 3 Pro + Telegram

1. Gateway 暴露在 0.0.0.0:18789，Gateway 可以理解成是 OpenClaw 的 Server
gateway.bind 已設定為 "loopback"，這表示它只監聽本機 (127.0.0.1)，不會對外暴露。
    如何驗證？
        使用 lsof -i :18789 確認連線僅限於 localhost。
        如果看到 0.0.0.0:18789，表示它對外暴露，如果沒有特殊需求其實搭配 Telegram 不需要對外開放這個 port

2. DM 策略允許所有使用者
channels.telegram.dmPolicy 設定為 "pairing"，限制僅能與配對過的使用者傳訊。
    所謂的 pairing 就是你身為 OpenClaw 需要手動放行，所以我覺得這個設定就可以了，如果家人或是朋友要一起共用的話也可以放行他們一起使用同一個 Telegram bot。

3. 沙箱 (Sandbox) 預設為停用
比較尷尬的是，原本想得很美好，要開好開滿 (mode: "all", network: "none")，結果發現這樣一搞，很多工具直接廢掉跑不動。為了讓 Agent 能做事，只好暫時先關閉沙箱設定。這大概就是安全性與便利性永遠的拉鋸戰吧...

4. 憑證以明碼存在於 oauth.json (或其他設定檔)
原本在 openclaw.json 中硬編碼了一些敏感的 API 金鑰 (例如用於 local-proxy 和影像生成的技能)。這些現在都已替換為引用環境變數 ${ANTIGRAVITY_MANAGER_API_KEY}。
    主要是針對洩漏 API Key 的問題，但因為我用的是 Antigravity Manager Proxy 製造的假的 API Key，所以換不換都無所謂，但為了維持好的習慣還是換掉比較好。我是在 ~/.zshrc 中加入變數，記得要 source ~/.zshrc，然後再重新啟動 openclaw gateway restart 即可。

5. 透過網頁內容進行 Prompt Injection (提示注入)
這需要從程式碼層級去審查網頁內容在輸入給 Prompt 之前是如何被處理與消毒的。目前沒有直接的設定選項可以驗證這一點。不過我們可以用下面幾個來防禦。

6. 危險指令阻擋
使用 tools.exec.security: "deny"，這會指示 OpenClaw 強制執行其內部的黑名單 (denylist) 來阻擋危險的 Shell 指令。例如把這種指令加入黑名單 rm -rf 就會被阻擋。搭配 tools.exec.ask 為 "on-miss" 來詢問使用者是否要執行該指令。

7. 授予了提權工具存取 (Elevated Tool Access)
使用 tools.elevated.enabled: false，主動停用任何潛在的提權工具存取。
elevated 代表什麼意思？為什麼要設為 false？在 OpenClaw 中，tools.elevated 指的是特定工具或動作能夠繞過標準安全限制或以更高權限執行的能力（例如：存取 Agent 沙箱外的敏感系統資源、以 root 權限執行指令，或繞過網路/進程隔離）。設定 elevated: false 遵循「最小權限原則 (Principle of Least Privilege)」。這能最小化攻擊面，並減少 Agent 若被入侵或因誤解而嘗試非預期動作時可能造成的損害。這能防止工具取得廣泛的高層級權限。

https://gist.github.com/andrew54068/cd1aa880909eeb1efc7f5fc326bd1816

當然這只是初步的設定，只是讓大家做一開始簡單的設定可以先保有基本安全防護的情況下體驗看看 OpenClaw 的威力，不代表這已經是完整的安全性設定，也不代表這樣就可以防禦所有攻擊，一定還有很多需要考慮的面向，不過這就要看大家怎麼使用了。目前先能讓 OpenClaw 跑起來就可以先去 Moltbook 放養了 XDD
如果以上內容有誤歡迎糾正，或是有什麼希望我補充或是研究的也歡迎留言