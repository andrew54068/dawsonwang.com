# Day 110 Slide Plan — 一段提示詞就能分享給朋友（白話版）

## Title
Day 110 自己做的工具只有自己能用？一段提示詞就能分享給朋友

## Hook
沒有工程師背景，Claude Code 生出一個能動的工具——把一段提示詞貼進去，同事直接點網址就能玩。「無法連線」這四個字，不該擋在你跟同事之間。

## Core visual thesis
Day 110 是 Day 109 的白話親民版，所以刻意走跟 Day 109 完全相反的視覺系統——暖色系、Editorial Magazine 的人文溫度，取代 Dark Mode Tech 的冷冽工程感。核心比喻是：localhost 是「鎖在你辦公桌抽屜裡」，cloudflared 是「臨時代理人」——用實體世界的畫面幫非工程師讀者建立 mental model，不用 NAT、reverse proxy 這些字。

## Visual system (locked)
- **Style name:** `Editorial Magazine`
- **Palette:** Warm Amber — espresso `#1C1917`, accent amber `#F59E0B`, cream text `#FEF3C7`
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- **Corner signature:** bottom-right corner, small amber monospace text `Day 110 · N/6`
- **Aesthetic rule:** flat vector, geometric shapes, high contrast, no photographs, no real people
- **Aspect ratio:** 1:1

## Slide list

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero element (≤10) |
|---|------|-----------|---------------|-----------------------------------|--------------------|
| 1 | cover | The Spotlight | `Day 110` | — (cover, exempt) | `一段提示詞` |
| 2 | the-drawer | The Reveal | `鎖在抽屜` | `localhost 是你電腦自己的抽屜，同事打開是他的抽屜` | `不是壞了` |
| 3 | the-proxy | The Path | `請代理人` | `工具留在你電腦，cloudflared 在外面幫你送件收件` | `一條專線` |
| 4 | one-prompt | The Collision | `一段就夠` | `貼提示詞叫它裝 cloudflared、跑 tunnel、印公開網址` | `貼 → 收` |
| 5 | two-warnings | The Chasm | `兩個提醒` | `網址不是密碼，接 AI 的工具外流帳單會爆` | `demo 完就關` |
| 6 | closing | The Scale | `最難過了` | — (closing, exempt) | `你已經過了` |

## Rhythm check
Spotlight → Reveal → Path → Collision → Chasm → Scale. No archetype repeats consecutively. Cover puts "一段提示詞" in dramatic isolation as the promise; slide 2 reveals what localhost actually is (the drawer); slide 3 walks the path of how a proxy solves it; slide 4 collides the one-prompt input with the public-URL output; slide 5 splits into two warnings (URL leak + AI bill); slide 6 scales the accomplishment — the hard part is already behind you.

## Key-point cold-read test
Each key point, read without its tagline, should still stand as a complete claim a reader could paste into a post:

- slide 2: `localhost 是你電腦自己的抽屜，同事打開是他的抽屜` — the metaphor does the work, no jargon
- slide 3: `工具留在你電腦，cloudflared 在外面幫你送件收件` — names the tool and what it does, without saying "reverse proxy"
- slide 4: `貼提示詞叫它裝 cloudflared、跑 tunnel、印公開網址` — names the prompt's three actions end-to-end
- slide 5: `網址不是密碼，接 AI 的工具外流帳單會爆` — both warnings compressed into one concrete claim

## Why this differs from Day 109
Day 109 shipped the same topic in engineer dialect — `Dark Mode Tech` + `Electric Dark` (charcoal + lime + blue), NAT asymmetry, SSE limits, dev-server exposure. Day 110 deliberately flips both the palette and the vocabulary: warm amber tones + everyday metaphors (抽屜、代理人、送件). Someone who couldn't follow Day 109's slides should be able to screenshot any Day 110 slide and still come away with the point.
