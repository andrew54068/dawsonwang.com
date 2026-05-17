# Day 109 Slide Plan — Cloudflare Quick Tunnel：Vibe Coding demo 救星

## Title
Day 109 Vibe Coding 作品要如何 demo 給別人看？兩個指令就搞定！

## Hook
Claude Code 跑 30 分鐘生出的 MVP，卡在「怎麼讓朋友點進去玩」——Cloudflare quick tunnel 一行指令，localhost 秒變公開 URL。

## Core visual thesis
Vibe coding 時代最詭異的落差：生 MVP 只要 30 分鐘，但把它拿給別人看卻要一個下午。Tunnel 利用 NAT 的不對稱路由（出可入不可），用一條主動往外連的長連線把外面的請求反向 proxy 回你筆電——免部署、免域名、免公開 IP，30 秒搞定。

## Visual system (locked)
- **Style name:** `Dark Mode Tech`
- **Palette:** Electric Dark — charcoal `#1A1A2E`, accent blue `#4A90E2` + lime `#AAFF00`, white text
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- **Corner signature:** bottom-right corner, small lime monospace text `Day 109 · N/6`
- **Aesthetic rule:** flat vector, geometric shapes, high contrast, no photographs, no real people
- **Aspect ratio:** 1:1

## Slide list

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero element (≤10) |
|---|------|-----------|---------------|-----------------------------------|--------------------|
| 1 | cover | The Scale | `Day 109` | — (cover, exempt) | `30 秒搞定` |
| 2 | the-gap | The Chasm | `時代落差` | `MVP 30 分鐘生得出來，拿給朋友看卻卡一個下午` | `30 分 vs 一下午` |
| 3 | how-tunnel-works | The Reveal | `不對稱路由` | `router 擋外面打進來，但從裡面往外連一律放行` | `出可入不可` |
| 4 | two-commands | The Path | `兩行搞定` | `brew 裝 cloudflared，一行指令拿到公開網址` | `trycloudflare.com` |
| 5 | security | The Collision | `全路由裸奔` | `dev server 所有路由對外全開，/admin API 全看光` | `demo 完就關` |
| 6 | four-limits | The Spotlight | `四個地雷` | `200 並發上限、SSE 被擋、子網域會變、沒 SLA 保證` | `SSE 會壞` |

## Rhythm check
Scale → Chasm → Reveal → Path → Collision → Spotlight. No archetype repeats consecutively. Cover frames the 30-second magic; slide 2 plants the pain (time-to-demo gap); slide 3 reveals why tunnel works (NAT asymmetry); slide 4 shows the two-command ritual; slide 5 warns about exposure; slide 6 lands the four hidden quick-tunnel limits — SSE being the one that actually breaks AI chatbot demos.

## Key-point cold-read test
Each key point read without its tagline should still stand as a complete claim a reader could paste into a post:

- slide 2: "MVP 30 分鐘生得出來，拿給朋友看卻卡一個下午" — names the gap with concrete numbers
- slide 3: "router 擋外面打進來，但從裡面往外連一律放行" — explains the actual mechanism, not just a label
- slide 4: "brew 裝 cloudflared，一行指令拿到公開網址" — names the tool, the command, the outcome
- slide 5: "dev server 所有路由對外全開，/admin API 全看光" — specifies what gets exposed, not just "be careful"
- slide 6: "200 並發上限、SSE 被擋、子網域會變、沒 SLA 保證" — names all four limits in one line
