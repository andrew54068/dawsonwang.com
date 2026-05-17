Day 32 OpenClaw 健檢

今天的挑戰是根據一份「Top 10 漏洞與修復」清單，對我的 OpenClaw 設定進行一次安全性強化檢查。這包含了檢視目前的設定檔，並應用必要的變更來提升安全性。

## 漏洞與修復總結

以下是執行的檢查項目細節與目前的狀態：

### 1. Gateway 暴露在 `0.0.0.0:18789`
*   **狀態**：**未受影響 (NOT VULNERABLE)**。`gateway.bind` 已設定為 `"loopback"`，這表示它只監聽本機 (127.0.0.1)，不會對外暴露。
*   **驗證**：使用 `lsof -i :18789` 確認連線僅限於 `localhost`。
*   **建議**：為了符合最佳實踐，建議將 `gateway.auth.token` 移至環境變數中。

### 2. DM 策略允許所有使用者
*   **狀態**：**未受影響 (NOT VULNERABLE) (大致上)**。`channels.telegram.dmPolicy` 設定為 `"pairing"`，限制僅能與配對過的使用者傳訊。
*   **建議**：若要更嚴格的控制，最理想的作法是將 `dmPolicy` 設為 `"allowlist"` 並指定明確的使用者 ID (User IDs)。

### 3. 沙箱 (Sandbox) 預設為停用
*   **狀態**：**已緩解 (暫時回滾)**。原本我們應用了 `agents.defaults.sandbox.mode: "all"` 和 `agents.defaults.sandbox.docker.network: "none"` 來進行全面的沙箱化與網路隔離。但為了暫時恢復工具的存取權限，我們先回滾了這項設定。
*   **全面強化行動**：當有直接的手動設定權限，或 OpenClaw 架構允許這種程度的隔離且不影響 Agent 控制時，應重新應用 `agents.defaults.sandbox.mode: "all"` 和 `agents.defaults.sandbox.docker.network: "none"`。

### 4. 憑證以明碼存在於 `oauth.json` (或其他設定檔)
*   **狀態**：**已緩解**。原本在 `openclaw.json` 中硬編碼了一些敏感的 API 金鑰 (例如用於 local-proxy 和影像生成的技能)。這些現在都已替換為引用環境變數 `${ANTIGRAVITY_MANAGER_API_KEY}`。
*   **行動**：確保 `ANTIGRAVITY_MANAGER_API_KEY` 已在你的 Shell 環境中正確設定 (如 `~/.zshrc` 或類似檔案)。

### 5. 透過網頁內容進行 Prompt Injection (提示注入)
*   **狀態**：**未知**。這需要從程式碼層級去審查網頁內容在輸入給 Prompt 之前是如何被處理與消毒的。目前沒有直接的設定選項可以驗證這一點。

### 6. 危險指令未被阻擋
*   **狀態**：**部分緩解**。已應用 `tools.exec.security: "deny"`，這會指示 OpenClaw 強制執行其內部的黑名單 (denylist) 來阻擋危險的 Shell 指令。
*   **建議**：驗證 OpenClaw 內部黑名單的有效性。

### 7. 無網路隔離 (針對沙箱化進程)
*   **狀態**：**已緩解 (暫時回滾)**。原本我們應用了 `agents.defaults.sandbox.docker.network: "none"` 以將沙箱化的 Docker 容器與網路隔絕。為了暫時恢復工具存取權，我們回滾了此設定。
*   **全面強化行動**：作為完整沙箱設定的一部分，應重新應用 `agents.defaults.sandbox.docker.network: "none"`。

### 8. 授予了提權工具存取 (Elevated Tool Access)
*   **狀態**：**已緩解**。已明確應用 `tools.elevated.enabled: false` 設定，主動停用任何潛在的提權工具存取。

### 9. 未啟用稽核日誌 (Audit Logging)
*   **狀態**：**已緩解 (部分)**。OpenClaw 擁有 `hooks.internal.entries.command-logger.enabled: true` 和 `hooks.internal.entries.session-memory.enabled: true` 設定，顯示指令執行與對話歷史均被記錄。這提供了基礎程度的稽核日誌功能。

### 10. 薄弱/預設的配對碼 (Pairing Codes)
*   **狀態**：**未知/潛在漏洞**。雖然使用了 `dmPolicy: "pairing"`，但目前沒有明確的設定選項來控制配對碼的隨機性或速率限制 (Rate limiting)。這部分我們依賴 OpenClaw 的內部預設值。

## 今天採取的關鍵強化行動：
*   應用了 `tools.exec.security: "deny"` 以阻擋危險指令。
*   更新 API Key 改用 `${ANTIGRAVITY_MANAGER_API_KEY}` 環境變數，移除 `openclaw.json` 中的明碼密鑰。
*   應用 `tools.elevated.enabled: false` 來停用提權工具存取。
*   識別出 (並暫時回滾) `agents.defaults.sandbox.mode: "all"` 和 `agents.defaults.sandbox.docker.network: "none"` 為沙箱與網路隔離的關鍵項目。這些需要謹慎地重新應用，以免將 Agent 鎖在外面。

這對於提升 OpenClaw 的安全性姿態來說，是個收穫滿滿的一天！


### 關於工具權限與同意的討論 (Day 32 - 安全性強化)

#### `tools.elevated.enabled` (訊息 ID: 77)

*   **問題**：`elevated` 代表什麼意思？為什麼要設為 `false`？
*   **解釋**：在 OpenClaw 中，`tools.elevated` 指的是特定工具或動作能夠繞過標準安全限制或以更高權限執行的能力（例如：存取 Agent 沙箱外的敏感系統資源、以 root 權限執行指令，或繞過網路/進程隔離）。
*   **設為 `false` 的原因**：設定 `elevated: false` 遵循「最小權限原則 (Principle of Least Privilege)」。這能最小化攻擊面，並減少 Agent 若被入侵或因誤解而嘗試非預期動作時可能造成的損害。這能防止工具取得廣泛的高層級權限。
*   **目前狀態**：您的設定已應用 `tools.elevated.enabled: false`。

#### 在同意下給予權限 (`tools.exec.ask`) (訊息 ID: 79)

*   **問題**：如何在被詢問時給予機器人權限，但不允許在未經同意下執行破壞性動作？
*   **解決方案**：這可以透過設定的組合來達成：
    *   **`exec.security: "deny"` (已應用)**：阻擋本質上危險的指令 (例如 `rm -rf`, `git push --force`)。這是第一道防線。
    *   **`tools.elevated.enabled: false` (已應用)**：防止一般性的權限提升。
    *   **`tools.exec.ask` (同意的關鍵)**：此設定控制 OpenClaw 是否需要在透過 `exec` 工具執行 Shell 指令前徵求您的明確批准。
        *   `"off"`：(預設) 不需批准。
        *   `"on-miss"`：僅針對不熟悉或有風險的指令詢問。
        *   `"always"`：針對 *每個* `exec` 指令都詢問。
*   **建議**：為了確保最大的安全性與同意權，請設定 `tools.exec.ask: "always"`。這能提供對 Shell 執行的完全透明度與控制權。
