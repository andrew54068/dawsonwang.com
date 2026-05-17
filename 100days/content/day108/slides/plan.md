# Day 108 Slide Plan — 讓 AI 剪片，但不給它看畫面

## Scope
**Cover image only (1-slide special case).** No takeaway slides in this set.

## Title
Day 108 讓 AI 剪片，但不給它看畫面——browser-use 團隊 video-use 實測

## Hook
"The LLM never watches the video. It reads it." —— 給 LLM 讀的是結構化 transcript，不是 raw pixel。

## Core visual thesis
影片本體（1080p、60fps、4 分鐘 → 21.6M tokens）被壓縮成一份幾 KB 的純文字 transcript；LLM 靠讀那份文字就能做出 word-boundary 級別的 cut 決策。Cover 的張力來自「攝影機/影片」對上「文字介面」這兩個世界的並置。

## Visual system (locked)
- **Style name:** `Dark Mode Tech`
- **Palette:** Electric Dark — charcoal `#1A1A2E`, accent blue `#4A90E2` + lime `#AAFF00`, white text
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- **Corner signature:** bottom-right, small lime monospace text `Day 108 · 1/1`
- **Archetype:** The Chasm — raw video frames on one side, packed transcript text on the other, a clear gap between them

## Slide

| # | Slug | Archetype | Tagline (≤10) | Key point | Hero element (≤10) |
|---|------|-----------|---------------|-----------|--------------------|
| 1 | cover | The Chasm | `Day 108` | — (cover, exempt) | `21.6M → 5KB` |

## Composition notes
- **Left side (recedes, cool blue):** a grainy strip of repeated near-identical video frames — "人坐著說話" — faintly lit, suggesting wasted tokens.
- **Right side (towers, crisp):** a clean lime-accented transcript block showing `[002.52-005.36] S0 Ninety percent of what...` — structured, scannable, LLM-facing.
- **Gap between them:** the chasm — the conceptual jump from raw pixel to packed text.
- **Closed-eye motif:** implicit — the scene says "the LLM isn't looking at the video, it's reading the text".
- Upper-left reserves space for `Day 108` title block + subtitle `讓 AI 剪片，但不給它看畫面`.
- Lower band carries the hero metric `21.6M → 5KB` as the compression punchline.
