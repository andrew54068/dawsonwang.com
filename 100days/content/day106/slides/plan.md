# Day 106 Slide Plan — Token 不夠用的解法--Subagent

## Title
Day 106 Token 不夠用的解法--Subagent

## Hook
同份工作量，Sonnet 4.6 佔 context：無 subagent 61%，有 subagent 22%——快三倍的結構性差距。

## Visual system (locked)
- **Style name:** `Dark Mode Tech`
- **Palette:** Midnight Authority — navy `#0A1628`, coral `#E53E3E`, white
- **Typography:** bold sans-serif, strong size hierarchy — tagline > key point > hero element > corner signature
- **Corner signature:** bottom-right corner, small white monospace text `Day 106 · N/7`
- **Aesthetic rule:** flat vector, geometric shapes, high contrast, no photographs, no real people
- **Aspect ratio:** 1:1

## Slide list

| # | Slug | Archetype | Tagline (≤10) | Key point (20–30) | Hero (≤10) |
|---|---|---|---|---|---|
| 1 | cover | The Chasm | `Day 106` | — (cover, exempt) | `61% vs 22%` |
| 2 | skill-vs-subagent | The Collision | `不同層級` | `skill 打包知識，subagent 開新房間做完再回報結論` | `知識 vs 房間` |
| 3 | inheritance | The Reveal | `帶與不帶` | `MCP 和 CLAUDE.md 繼承，skill 和主對話歷史完全不帶` | `啟動快照` |
| 4 | builtin-trio | The Path | `三個內建` | `Explore 只讀搜尋、Plan 先研究、general-purpose 多步驟` | `Haiku 省錢` |
| 5 | skill-plus | The Scale | `疊加組合` | `frontmatter 的 skills 欄位注入規範，context: fork 搬家做` | `不互斥` |
| 6 | mcp-plus | The Spotlight | `關進小房間` | `mcpServers 欄位把重 MCP 搬進 subagent，schema 和回傳都鎖住` | `兩層疊加` |
| 7 | hook-plus | The Chasm | `兩層 hook` | `frontmatter 內管 PreToolUse，settings.json 外管 SubagentStart` | `內外雙層` |

## Rhythm check
Chasm → Collision → Reveal → Path → Scale → Spotlight → Chasm. No archetype repeats consecutively. Slides 1 and 7 both use The Chasm intentionally — slide 1 teases the structural gap, slide 7 lands the "two layers" dual-hook closing.

## Narrative arc
1. Cover — hooks with the 61% vs 22% contrast (the experiment result proving subagent is structural, not cosmetic).
2. Skill vs Subagent — corrects the biggest misconception (they're different layers, not competitors).
3. Inheritance — maps the subagent's starting context so readers know what's carried in.
4. Built-in trio — the zero-learning-curve move: just call Explore / Plan / general-purpose by name.
5. Skill + Subagent — the frontmatter `skills` field + skill's `context: fork` — composition, not either-or.
6. MCP + Subagent — the most underrated combo; kills both schema bloat and response bloat.
7. Hook + Subagent — subagent as a lifecycle-managed worker, with frontmatter hooks inside and settings.json hooks outside.

Every slide shares palette, type system, and `Day 106 · N/7` in the bottom-right corner.
