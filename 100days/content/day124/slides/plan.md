# Day 124 Slide Carousel Plan

Title line: Day 124 模型不是工具：為什麼 Spark 不能靠自己產圖

Hook: 換成 Spark 不會自動多出產圖能力；真正的邊界在 runtime 有沒有注入 image_gen 這類工具。

Visual system:
- Style: Retro Terminal
- Palette: Electric Dark — charcoal #1A1A2E, blue #4A90E2, lime #AAFF00, white text
- Typography: bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- Corner signature: bottom-right small white monospace text `Day 124 · X/6` with a tiny lime terminal cursor block beside it
- Rendering language: flat vector, geometric shapes, high contrast, no photographs, no real people

Slides:
1. Cover — Hook the misconception: Spark cannot produce images by itself.
2. Text-only — Spark currently being text-only means the model cannot directly output images.
3. Model vs Tool — The model thinks and plans; the tool executes.
4. Runtime Gate — Runtime decides whether image_gen exists in this session.
5. Prompt Is Not Import — Saying a tool exists in prompt text does not register a real tool.
6. Ability Formula — Agent capability is model + runtime + tools + permissions + instructions.
