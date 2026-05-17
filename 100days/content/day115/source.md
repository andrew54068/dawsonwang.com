Day 115 【Claude Code → Codex 踩坑 01】ralph-loop plugin 原理？

最近也加入了 Codex 的行列，第一個遇到的問題就是 ralph-loop 要怎麼移植過去。

發現其實沒有像 Claude Code 這麼容易。才回頭認真研究 ralph-loop 的機制，搞清楚它到底是怎麼做的。

翻了半天 settings.json，什麼都沒有。但 ralph-loop 裝完之後，它確實在攔截 Claude 的 Stop 事件——每次 Claude 想結束，它都會把同一個 prompt 重新丟回去，讓 Claude 繼續跑。

Hook 到底是怎麼進來的？

---

## 兩條不同的 Hook 註冊路徑

Claude Code 有兩種方式設定 hook：

**第一種：手動寫進 settings.json**

這是你平常看到的那種。PostToolUse 跑 formatter、Stop 做某件事，打開 `~/.claude/settings.json` 就看得到。

**第二種：plugin 的 hooks.json**

這個存在 plugin 的 cache 目錄裡，格式長這樣：

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "bash \"${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.sh\""
      }]
    }]
  }
}
```

這個 **不會寫進 settings.json**，是 Claude Code 啟動時自己去讀的。

兩條路最後都合進同一張 hook table，但儲存位置不同、所有權也不同。

---

## 完整流程

### 安裝時

```
/plugin install ralph-loop
→ 記一筆進 installed_plugins.json：{ installPath: "~/.claude/plugins/cache/.../1.0.0" }
```

僅此而已。settings.json 完全不動。

### 每次啟動時

Claude Code 內部有個函數（從 binary 反推出來的，minified 叫 `RC()`）：

1. 讀 `installed_plugins.json`
2. 對每個 plugin 去讀 `{installPath}/hooks/hooks.json`
3. 把這些 hook 載進記憶體，標上 `source: "pluginHook"`

然後另一個函數 `i_K()` 把 plugin hooks 和 settings.json hooks 合併成同一張表：

```js
// 重建自 minified binary
if ("pluginRoot" in hookConfig) {
  q[event][matcher].push({
    source: "pluginHook",
    pluginName: hookConfig.pluginId,
    // ...
  });
}
```

### 執行時

Stop 事件觸發 → 跑所有 `q["Stop"]` 裡的 hook → shell 出去執行 stop-hook.sh

執行前，Claude Code 會把 `CLAUDE_PLUGIN_ROOT` 設成該 plugin 的 `installPath` 當環境變數，所以 `${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.sh` 才能正確解析。

---

## Ralph-loop 的設計

ralph-loop 在這個機制上做了一件很有趣的事。

Stop hook 永遠都在跑，但 stop-hook.sh 一開始就先檢查：

```bash
RALPH_STATE_FILE=".claude/ralph-loop.local.md"

if [[ ! -f "$RALPH_STATE_FILE" ]]; then
  exit 0  # 放行，Claude 正常結束
fi
```

找不到 state 檔案 → exit 0，什麼都不做。

找到了 → 讀裡面的 prompt 和 iteration count → 回傳：

```json
{
  "decision": "block",
  "reason": "<原始 prompt>",
  "systemMessage": "🔄 Ralph iteration N | To stop: ..."
}
```

（systemMessage 實際還包含結束指令的提示，這裡節錄前半段。）

Claude Code 接到 `decision: "block"` 就不讓 Claude 退出，而是把 `reason` 的內容當新的 user message 重新注入，下一輪繼續。

**State 檔案 = on/off 開關。Hook 只是一個永遠在旁邊待命的監聽器。**

```
/ralph-loop "task"  → 建立 state 檔案  → loop ON
completion promise  → 刪除 state 檔案  → loop OFF
/cancel-ralph       → 刪除 state 檔案  → loop OFF
```

---

## 為什麼不寫進 settings.json？

有三個設計原因：

**1. 乾淨卸載**
移除 plugin 只要刪 cache 和 `installed_plugins.json` 那一行，不用改 settings.json。如果 hooks 混進 settings.json，卸載就變得麻煩。

**2. 所有權清楚**
你的 settings.json 是你的設定。Plugin 的 hook 是 plugin 的設定。混在一起會讓 "這個 hook 是誰的？" 變得模糊。

**3. 更新簡單**
Plugin 更新只要換掉 cache 裡的檔案，不需要 merge settings.json，不會有衝突。

---

## 怎麼看到所有 active hook？

因為 plugin hooks 不在 settings.json，你沒辦法靠翻文件來看完整清單。

正確做法：在 Claude Code 裡跑 `/hooks` 指令，它會顯示合併後的完整視圖，包含 `Plugin` 欄位標示哪些是從 plugin 來的。

---

## 系列預告

這是 "Claude Code → Codex 踩坑" 系列的第一篇。

ralph-loop 只是第一個坑。後面還有 rules 設定怎麼遷移、skills 系統在 Codex 裡沒有對應物該怎麼辦——每個都是從 "以為很簡單" 到 "原來根本不一樣" 的過程。

下一篇繼續寫。
