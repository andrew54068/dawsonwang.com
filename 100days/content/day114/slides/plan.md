# Day 114 slide plan — Claude Code 資安新手問答

## Hook
`AI 會偷我資料嗎？會刪我檔案嗎？到底能幫我做什麼？` — 三個非技術朋友每週都在問的問題。

## Visual system
- **Style:** `Dark Mode Tech`
- **Palette:** Electric Dark — charcoal `#1A1A2E`, blue `#4A90E2`, lime `#AAFF00`, white
- **Corner signature:** bottom-right, small white monospace `Day 114 · N/6`
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature

## Slide map

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaways only) | Hero element (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Collision | `三個問題` | — (cover, exempt) | `新手必問` |
| 2 | data-leak | The Reveal | `你才是漏洞` | `聊天型碰不到檔案，真正風險是你自己貼上去的合約客戶名單` | `自貼 > 被偷` |
| 3 | delete-risk | The Chasm | `agent 會刪檔` | `Windows 上 Claude Code 曾把整個個人資料夾砍光連相鄰專案賠進去` | `rm -rf` |
| 4 | deny-list | The Spotlight | `deny list 三分鐘` | `在 settings.json 擋掉 rm -rf、Remove-Item、sudo 等危險指令` | `第一層防線` |
| 5 | capability-ladder | The Path | `門檻由低到高` | `寫信用 ChatGPT、自動化用 Cowork、做小工具才進 Claude Code` | `三階上手` |
| 6 | three-rules | The Scale | `三條保命` | — (closing, exempt) | `贏過 95%` |

## Notes on key points
- **Slide 2:** surfaces the counterintuitive claim — the real risk isn't AI stealing, it's what users paste. Names the concrete sensitive items (合約/客戶名單) to make it feel real.
- **Slide 3:** drives the reality home with the specific Windows NTFS junction incident — not abstract "AI can delete files" but a real documented event.
- **Slide 4:** turns fear into action. Specific file, specific patterns being blocked. Screenshotter gets a working defense.
- **Slide 5:** addresses the beginner's biggest mistake — jumping straight to Claude Code. Maps tool to need.
- **Slide 6:** landing slide — the three rules you can follow to be safer than 95%.

## Archetype rhythm
Collision → Reveal → Chasm → Spotlight → Path → Scale — no two adjacent slides share an archetype.
