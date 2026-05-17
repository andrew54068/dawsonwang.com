# Day 122 Slide Plan

**Title:** Day 122 ralph-expert + GAN 跑遷移：給 Claude Code 重度使用者的半自動模板
**Hook:** Claude 寫 code、Codex 當挑剔的判別器——每個 phase 都要對手點頭才能往下走
**Visual system:** `Dark Mode Tech` + `Electric Dark` (charcoal `#1A1A2E`, blue `#4A90E2`, lime `#AAFF00`, white)
**Corner signature:** bottom-right, small white monospace: `Day 122 · N/6`
**Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature

The takeaway slides (2–5) carry three text tiers. Cover (1) and closing reminder (6) are exempt — their job is hook and landing.

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30, takeaway only) | Hero element (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Collision | `Day 122` | — (cover, exempt) | `Generator vs Critic` |
| 2 | ralph-expert | The Path | `骨架先包` | `ralph-expert 自動補完成條件、最大迭代、phase 拆分` | `--max-iterations` |
| 3 | gan-loop | The Collision | `對抗點頭` | `Claude 寫 code、Codex 當判別器，點頭才能進下一個 phase` | `跨模型 review` |
| 4 | phase-split | The Scale | `切小再跑` | `schema → service → caller → test，每 phase 走完整四步` | `4 個 phase` |
| 5 | subagent-relay | The Reveal | `主對話空著` | `生成、判別都派 subagent，30 輪後主對話僅 5K token` | `5K token` |
| 6 | reminders | The Spotlight | `先試小的` | — (CTA, exempt) | `Day 122` |

Cover uses Collision (Generator × Discriminator face-off). Slides 2–5 vary Path → Collision → Scale → Reveal for rhythm. Slide 6 uses Spotlight to land the four reminders.

The key points read cold:
- 2: ralph-expert 自動補完成條件、最大迭代、phase 拆分 (states the skill's mechanism)
- 3: Claude 寫 code、Codex 當判別器，點頭才能進下一個 phase (defines the GAN gating)
- 4: schema → service → caller → test，每 phase 走完整四步 (concrete phase order)
- 5: 生成、判別都派 subagent，30 輪後主對話僅 5K token (concrete context cost)
