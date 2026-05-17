Day 116 【Claude Code → Codex 踩坑 02】ralph-loop 三種路線比較

上一篇解釋了 Claude Code 的 ralph-loop 為什麼能自動載入 Stop hook——靠的是 plugin 系統在啟動時去讀 `hooks/hooks.json`，合進記憶體裡的 hook table。

Codex 沒有這個機制。Plugin hook 不會自動載入，所以 ralph-loop 沒辦法直接移植，得自己選路線。

---

## 路線 A：自製 Stop hook（project-local）

最快讓 loop 跑起來的方式。用 `codex_ralph.py` 在專案目錄裡裝一個 Stop hook，之後由 Codex 自己觸發。

```bash
python3 ~/.agents/skills-bullpen/codex-ralph-loop/scripts/codex_ralph.py start \
  --project . \
  --prompt-file .codex/ralph-prompt.md \
  --max-iterations 50 \
  --completion-promise TASK_COMPLETE
```

裝完會在專案裡產生五個關鍵檔案：

```
.codex/hooks.json                 ← 把 Stop hook 註冊進去
.codex/hooks/codex_ralph_stop.py  ← hook 本體
.codex/ralph-loop.local.json      ← loop 狀態（on/off 開關）
.codex/ralph-prompt.md            ← 每次重新注入的 prompt
.codex/ralph-loop.last.json       ← loop 結束後才產生，記錄最終結果
```

### Stop hook 的判斷邏輯

每次 Codex 想結束，hook 就跑一次：

1. 找不到 `ralph-loop.local.json` → `exit 0`，放行
2. 找到了 → 看最後一則 assistant message 有沒有 `<promise>TASK_COMPLETE</promise>`
3. 有 → 停止，把結果寫進 `ralph-loop.last.json`，刪掉 state 檔案
4. 沒有，但已達 `max_iterations` → 同上停止
5. 都不是 → 回傳 `{"decision":"block","reason":"Ralph iteration N/50..."}`，Codex 繼續跑

Codex 接到 `decision: "block"` 就把 `reason` 當新的 user message 重新注入，行為和 Claude Code 的 ralph-loop 完全一樣。

### on/off 開關

**State 檔案 = 開關。**

```
start → 建立 ralph-loop.local.json → loop ON
completion promise → 刪掉 state 檔案 → loop OFF
cancel → python3 codex_ralph.py cancel → 刪掉 state 檔案 → loop OFF
```

想臨時做一件跟 loop 無關的事？刪掉 `ralph-loop.local.json`，做完再重建。這比 Claude Code 的版本更透明——狀態就是一個 JSON 檔案，隨時可以打開看當前 iteration 和 prompt。

---

## 路線 B：CodexPotter

[CodexPotter](https://github.com/breezewish/CodexPotter) 走的是完全不同的路線。它是一個獨立的 Rust binary，不是靠 Stop hook——而是直接包住 `codex app-server` protocol（Codex 的內部通訊介面），從外部驅動 Codex。

```bash
npm install -g codex-potter
codex-potter --yolo  # 自動確認所有操作
```

### 核心設計：每 round 清空 context

CodexPotter 的 "round" 概念：每個 round 是一個全新的 Codex session，**刻意不共享上下文**。

> "every follow up prompt turns into a new task, not sharing previous contexts"

這是故意的設計，目的是避免 context poisoning——長任務跑下去，早期的錯誤決策會一直污染後面的輸出。

每個 round 結束後，靠 `MAIN.md` 的結構做跨 round 記憶。Codex 每次啟動都去讀這份 `MAIN.md`，知道目前做到哪、下一步做什麼。

停止方式：當 agent 認為任務完成，會自動在 MAIN.md 的 front matter 寫入 `finite_incantatem: true` 觸發停止；也可以用 `--rounds` 限制執行輪數。

---

## 兩條路線的差異

|  | 自製 Stop hook | CodexPotter |
|--|---------------|-------------|
| **架構** | hook 攔截同一 session | 外部 process 包 app-server |
| **context** | 同一 session 持續累積 | 每 round 重置 |
| **記憶方式** | prompt 檔案 + iteration counter | MAIN.md 任務板 |
| **停止方式** | 刪 state 檔案 或 `<promise>TAG</promise>` | agent 寫入 `finite_incantatem: true` 或 round budget |
| **安裝** | project-local hook | `npm install -g` |
| **一次性中斷** | 刪 state 檔案，做完重建 | 不需要，每 round 本來就獨立 |

### 什麼情況選哪條

重視結果用 CodexPotter，擔心資安用自製 hook。

---

## 系列進度

踩坑系列第二篇。

第一篇（Day 115）搞清楚 Claude Code 的 hook 機制，第二篇選定 Codex 路線。下一個坑：Claude Code 的 rules 系統在 Codex 裡沒有完整對應物——AGENTS.md 能做到什麼、做不到什麼，繼續寫。
