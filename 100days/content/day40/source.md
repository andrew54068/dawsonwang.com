Day 40 Skills 已成為資安破口

之前就曾經預言 Skills 方便安裝一定會在未來變成攻擊的破口，果然在上週就已經有案例傳出，而且是一個散佈在多個 Skill 的惡意程式。

其實 Skill 本質上就是 Markdown，只是把指令寫在 Markdown 裡面而已。當今天建立在強大的 LLM 上，Markdown 其實就是一種安裝方式，因為 LLM 有能力執行 Markdown 裡面的指令，如果對於可能執行的指令不熟悉或沒有多加檢驗，那麼本質上就是門戶大開。

作者在瀏覽 ClawHub 時發現，當時下載量最高的一個 "Twitter" Skill，竟然就是一個惡意軟體投遞工具。它的 Skill 說明文件引導使用者（或 Agent）去下載一個「必要的依賴 (required dependency)」，結果那個連結其實是針對 macOS 的 Infostealer 病毒。

這種惡意軟體不只是單純「感染你的電腦」，它會搜刮裝置上所有值錢的東西：
- 瀏覽器 Session 和 Cookies
- 儲存的帳密和自動填入資料
- 開發者 Token 和 API Key
- SSH 金鑰
- 雲端憑證
- 任何可以用來接管帳戶的資料

MCP 的安全迷思
很多人以為有了 MCP (Model Context Protocol) 這種標準化的介面就很安全，所有的 Tool Call 都會受到管控。
但這篇文章指出這是個危險的誤解。惡意的 Skill 可以完全繞過 MCP，直接透過 Markdown 裡的文字誘導 Agent 去執行 Shell Command，或是透過 Bundle 在 Skill 裡的 Script 來繞過 MCP 的邊界。

給我們的警示
1.  不要在公司電腦裸奔：OpenClaw 權限很大，能存取檔案、瀏覽器、終端機，一旦中招，所有 Session、Token 和 SSH Key 都可能外洩。
2.  Skill 來源要查核：不要看到下載量高就無腦裝，Skill 內部的 SKILL.md 最好還是要掃過一遍，特別是那些叫你執行 curl | bash 或是下載不明 Binary 的步驟。
3.  隔離環境：最好在 Sandbox 或虛擬機裡跑 Agent。這點我們前幾天剛好有設定 Docker Sandbox，看來是走對路了。

這篇文章也提到，未來的 Agent 系統需要一個「信任層 (Trust Layer)」，權限必須是動態、可撤銷且有來源證明的，而不是像現在這樣一次給予所有權限。在那個未來到來之前，我們自己要多加小心。

文章連結：From magic to malware: How OpenClaw's agent skills become an attack surface
https://1password.com/blog/from-magic-to-malware-how-openclaws-agent-skills-become-an-attack-surface