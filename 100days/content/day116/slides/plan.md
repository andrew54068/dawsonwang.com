# Day 116 Slide Plan

**Title:** Day 116 【Claude Code → Codex 踩坑 02】ralph-loop 三種路線比較
**Hook:** Codex 沒有 plugin hook 機制，ralph-loop 無法直接移植，得自己選路線
**Visual system:** Dark Mode Tech + Electric Dark
**Palette:** charcoal `#1A1A2E` · blue `#4A90E2` · lime `#AAFF00` · white
**Corner signature:** bottom-right, small white monospace `Day 116 · N/6`
**Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30) | Hero (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Spotlight | `Day 116` | — (cover, exempt) | `3 條路線` |
| 2 | no-auto-hook | The Chasm | `移植不了` | `Codex 無 plugin hook，ralph-loop 的 Stop hook 不能自動載入` | `手動選路` |
| 3 | route-a-stop-hook | The Path | `路線 A` | `codex_ralph.py start 裝 5 個檔案，Stop hook 攔截同一 session` | `5 個檔案` |
| 4 | state-file-switch | The Reveal | `狀態即開關` | `ralph-loop.local.json 存在就是 ON，刪掉就是 OFF，隨時可查` | `一個 JSON` |
| 5 | route-b-codexpotter | The Collision | `路線 B` | `CodexPotter 包住 app-server，每 round 清空 context 防污染` | `每輪重置` |
| 6 | choose-your-path | The Scale | `選哪條？` | — (closing insight, exempt) | `資安 vs 結果` |
