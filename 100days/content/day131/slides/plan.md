# Day 131 Slide Plan — 從 MCP 到 skill 再到 CLI

**Title:** Day 131 從 MCP 到 skill 再到 CLI——AI 用工具這一年多怎麼演進
**Hook:** MCP、skill、CLI 不是替代關係，是各解一個問題——分工不是取代

**Visual system:**
- Style: `Dark Mode Tech` (tools / tech discovery — sleek, authoritative, modern)
- Palette: Electric Dark — charcoal `#1A1A2E` background, blue `#4A90E2` + lime `#AAFF00` accents, white text
- Typography: bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- Corner signature: bottom-right, small white monospace `Day 131 · N/6`

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Collision | `Day 131` | — (cover, exempt) | `三層分工` |
| 2 | mcp-private-data | The Reveal | `MCP 接私料` | `MCP server 用你的帳號跟 Gmail API 拿信，AI 才讀得到` | `沒登入拿不到` |
| 3 | skill-know-how | The Path | `skill 教步驟` | `skill 是 prompt template，用到才載入，不會一開始就吃 context` | `漸進式載入` |
| 4 | cli-self-discover | The Scale | `CLI 自帶說明書` | `gcloud、aws、gh 早就在，AI 看到名稱就會自己讀 --help` | `--help` |
| 5 | three-layers | The Chasm | `各解一題` | `MCP 解私有資料、skill 解步驟、CLI 把工具與知識打包成一層` | `三題各有解` |
| 6 | recipe | The Spotlight | `組合使用` | — (closing recipe, exempt) | `Workspace→gws` |

Slides 1 and 6 are exempt from the key-point rule (cover hooks, closing slide lands the practical recipe). Slides 2–5 carry all three text tiers.

Archetype rhythm (Collision → Reveal → Path → Scale → Chasm → Spotlight) — every adjacent pair differs.

Read the key points cold:
- 2: names the literal mechanism (MCP server uses your account to talk to Gmail API).
- 3: names the actual concepts (prompt template, used-when-loaded, context window).
- 4: names the literal CLIs (gcloud, aws, gh) and the auto-discovery move (read --help).
- 5: maps each layer to the problem it solves — explicit and parallel.

Each is a complete claim, not a slogan.
