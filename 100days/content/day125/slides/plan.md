# Day 125 slide plan

**Title:** Day 125 把家裡的 Mac 變成 Claude 主機，用 Air 遙控
**Hook:** Air 出門會掉線、會蓋螢幕，但家裡 Pro 跑的 Claude Code 長任務不能被打斷。
**Visual system:** `Dark Mode Tech` + `Electric Dark` (charcoal `#1A1A2E`, blue `#4A90E2` + lime `#AAFF00`, white text)
**Corner signature:** bottom-right corner, small white monospace text `Day 125 · N/6`
**Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Chasm | `Day 125` | — (cover, exempt) | `Air ⇄ Pro` |
| 2 | three-stack | The Path | `三件式遙控` | `Tailscale 給位址、Mosh 自動重連、tmux 抓住長任務` | `三件套` |
| 3 | one-alias | The Spotlight | `一行 alias` | `mosh 進 Pro，tmux -As claude 接回 Claude session` | `claude-remote` |
| 4 | detach-not-kill | The Collision | `別按 Ctrl-C` | `離開要按 Ctrl-b d 暫退 tmux，背景 Claude 繼續跑` | `Ctrl-b d` |
| 5 | path-trap | The Reveal | `PATH 陷阱` | `非互動 zsh 只讀 zshenv，brew shellenv 沒載到` | `zshenv` |
| 6 | one-fix-all | The Scale | `一次修完` | `brew shellenv 搬到 zshenv，往後 ssh one-liner 都受惠` | `一次受惠` |

Archetype rhythm: Chasm → Path → Spotlight → Collision → Reveal → Scale (no repeats in a row).
