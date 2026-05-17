# Day 115 — Slide Plan

**Title:** Day 115 【Claude Code → Codex 踩坑 01】ralph-loop plugin 原理？
**Hook:** 翻了半天 settings.json 什麼都沒有，但 ralph-loop 確實在攔截 Claude 的 Stop 事件。Hook 到底怎麼進來的？

**Visual system:**
- Style: `Dark Mode Tech`
- Palette: `Electric Dark` — charcoal `#1A1A2E`, blue `#4A90E2`, lime `#AAFF00`, white text
- Typography: bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- Corner signature: bottom-right corner, small lime-green monospace text `Day 115 · N/6`

## Slides

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Reveal | `Hook 從哪來？` | — (cover, exempt) | `settings.json 找不到` |
| 2 | two-paths | The Chasm | `兩條註冊路徑` | `settings.json 手寫一條，plugin 的 hooks.json 自動載一條` | `兩條合一張` |
| 3 | startup-flow | The Path | `啟動時讀檔` | `Claude 啟動時讀 installed_plugins.json，再去載每個 plugin 的 hooks.json` | `RC() + i_K()` |
| 4 | state-switch | The Reveal | `State 開關` | `Stop hook 永遠在跑，找不到 state 檔就 exit 0 放行` | `state = on/off` |
| 5 | clean-design | The Scale | `為什麼分開放` | `Plugin hook 不寫進 settings.json，卸載只要刪 cache 一行` | `乾淨卸載` |
| 6 | hooks-command | The Spotlight | `/hooks 看全貌` | — (CTA, exempt) | `/hooks` |

## Rhythm check

Reveal → Chasm → Path → Reveal → Scale → Spotlight. No back-to-back archetype repeats except slides 1 and 4 (both Reveal but separated by two slides — acceptable).
