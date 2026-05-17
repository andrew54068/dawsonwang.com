# Day 104 Slide Plan — RAG 沒死，它只是跟 LLM Wiki 不在同一個戰場

## Title
Day 104 RAG 沒死，它只是跟 LLM Wiki 不在同一個戰場

## Hook
每隔幾週就會有人喊某個技術死了，這次輪到 RAG。但 Karpathy 的 LLM Wiki 跟 RAG 根本不在同一個戰場。

## Thesis
Karpathy 的 LLM Wiki 是小規模（~100 份來源）的漂亮方案——讓 LLM 自己維護一池活水，主動更新交叉引用、跑 Lint 找矛盾。但同一套流程放到十萬份規模就崩潰：context 裝不下、Lint 是 O(N²)、resolution flow 留白沒人收尾。RAG 真正解決的是那個大規模戰場，而 GraphRAG / RAPTOR / HippoRAG / Self-RAG / Agentic RAG 這些變形正在把 Karpathy 留白的 resolution flow 強制形式化。

## Visual system (locked)
- **Style:** Dark Mode Tech
- **Palette:** Electric Dark — charcoal `#1A1A2E`, blue `#4A90E2`, lime `#AAFF00`, white
- **Typography:** bold sans-serif, strong size hierarchy — principle > hero element > caption
- **Corner signature:** bottom-right, small white monospace text `Day 104 · N/6`
- **Render spec:** flat vector, geometric shapes, high contrast, no photographs, no real people, `--ar 16:9`

## Slide set (6 slides)

| # | Slug | Archetype | Hero element | Chinese text (≤3) |
|---|---|---|---|---|
| 1 | cover | The Collision | Two glowing orbs colliding — `RAG` (blue) vs `LLM Wiki` (lime) locked at impact point, sparks radiating | `RAG 沒死` · `不同戰場` · `Day 104` |
| 2 | wiki-small-scale | The Spotlight | A single glowing lime-green book labeled `100` floating in isolation, neat cross-reference lines threading between its pages | `100 份來源` · `小規模贏` · `LLM Wiki` |
| 3 | living-water | The Chasm | Left: a rippling lime-green pool labeled `活水` with arrows circling; right: a stagnant blue-grey pool labeled `死水` with scattered dead chunks | `活水 vs 死水` · `Lint 找矛盾` · `主動更新` |
| 4 | scale-breaks | The Scale | A towering dark wall of `10 萬份` documents dwarfing a tiny flickering context window at its base, with a red `O(N²)` symbol cracking across the wall | `10 萬份` · `context 裝不下` · `O(N²) 崩潰` |
| 5 | rag-variants | The Path | A branching path of five lime waypoints labeled with the RAG variants, each node feeding into a central blue `resolution flow` hub | `GraphRAG` · `RAPTOR` · `強制形式化` |
| 6 | two-battlefields | The Chasm | Two distinct battlefields separated by a vast dark canyon — left a small lime wiki fortress, right a massive blue RAG grid stretching to the horizon | `兩個戰場` · `不是取代` · `規模不同` |

## Rhythm check
Collision → Spotlight → Chasm → Scale → Path → Chasm. No archetype repeats consecutively. The two Chasm slides (3 and 6) are intentional bookends — slide 3 frames the internal tension of Wiki's design, slide 6 lands the final "two battlefields" resolution.
