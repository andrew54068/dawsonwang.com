# Day 107 Slide Plan — 家裡另一台 Mac 當 LLM 伺服器

## Title
Day 107 家裡另一台 Mac 當 LLM 伺服器——Ollama + Tailscale + Raycast 全流程

## Hook
兩台 Mac，一台跑運算一台當客戶端，半小時架完私網 LLM——抽象層次對了 workflow 就升級了。

## Visual System (locked)
- **Style name:** `Dark Mode Tech`
- **Palette:** Electric Dark — charcoal `#1A1A2E`, accent blue `#4A90E2` + lime `#AAFF00`, white text
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- **Corner signature:** bottom-right corner, small lime monospace text `Day 107 · N/6`

## Slides

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero element (≤10) |
|---|------|-----------|---------------|----------------------------------|--------------------|
| 1 | cover | The Spotlight | `Day 107` | — (cover, exempt) | `半小時架完` |
| 2 | bind-network | The Reveal | `綁 tailnet IP` | `綁到 Tailscale 介面 IP，只有 utun 上開 port，實體網卡掃不到` | `100.x.y.z` |
| 3 | network-is-auth | The Chasm | `網路即驗證` | `Ollama 完全沒驗證機制，誰連到 port 誰就能跑你的 GPU` | `三選二` |
| 4 | cli-only | The Scale | `砍掉 GUI` | `客戶端用 brew 裝 CLI-only ollama，省下 daemon 的 RAM` | `brew install` |
| 5 | magicdns | The Path | `用 MagicDNS` | `綁 IP 重灌就掛掉，用主機名半年後不用改 .zshrc` | `寫一次` |
| 6 | raycast-frontend | The Collision | `本地 = 信任網` | — (closing, exempt) | `option+space` |

## Archetype rhythm
Spotlight → Reveal → Chasm → Scale → Path → Collision. No repeats in a row. Cover and closing are exempt from the three-tier informativeness rule (slide 1's job is hook, slide 6's job is the landing insight). Slides 2–5 each carry a 20–30 char key point that stands alone if screenshotted.

## Content fidelity check
- Slide 2 references `讓 Ollama 綁在 Tailscale 介面 IP`, utun-only listener, implicit contrast with `0.0.0.0` exposure — the point is selective exposure, not a toggle switch.
- Slide 3 references three deployment modes (127.0.0.1 / 0.0.0.0+Tailscale / 0.0.0.0 raw) — Tailscale ACL as authz layer.
- Slide 4 references the cleanup steps (`pkill -x Ollama`, `rm -rf /Applications/Ollama.app`, `sudo rm /usr/local/bin/ollama`, `brew install ollama`) and `OLLAMA_HOST=http://dawsons-macbook-pro:11434` env var.
- Slide 5 references MagicDNS hostname vs Tailscale IP — the IP changes on reinstall, hostname only changes when you change Sharing name.
- Slide 6 lands the abstraction-layer insight: Raycast's "Local Models" actually means "any machine on a network I trust" — `option+space` summons inference running in another room.
