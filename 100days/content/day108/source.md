Day 108 讓 AI 剪片，但不給它看畫面——browser-use 團隊 video-use 實測

browser-use 的 Gregor Zunic 前幾天丟了一個新東西叫 video-use，一個用 Claude Code 剪片的 skill，100% 開源。標語很直白："Talk to camera, get final.mp4"。

我本來以為就是再一個 LLM + ffmpeg 的殼，看到他寫的那句 "The LLM never watches the video. It reads it." 覺得有點意思。這個設計思路跟 browser-use 當初拿結構化 DOM 餵 LLM，而不是直接丟 screenshot 是完全同一套。這篇就是安裝、拿我自己錄的一段側專案示範影片跑一輪的完整筆記。


【為什麼 "不看影片，讀影片"】

你如果天真地讓 LLM 看影片，數字立刻會嚇死你。1080p、60fps、四分鐘——14,400 張 frame、每張 ≈1,500 tokens，光讀一次就是 21.6M tokens。99% 都是重複的 "人坐著說話" 畫面，token 全花在 noise 上。

video-use 用兩層結構把這件事壓到幾 KB 文字：

→ Layer 1（永遠載入）：每個 source 丟一次 ElevenLabs Scribe，拿到 word-level timestamp、speaker diarization、(laughter)/(applause)/(sigh) 這種 audio event。所有 take 打包成一個 takes_packed.md：

```
## C0103  (duration: 43.0s, 8 phrases)
  [002.52-005.36] S0 Ninety percent of what a web agent does is completely wasted.
  [006.08-006.74] S0 We fixed this.
```

每一句就是 [start-end] + speaker + 文字。LLM 讀這份檔案，就能做出 word-boundary 級別的 cut 決策。

→ Layer 2（on-demand）：timeline_view 吃 (video, start, end)，吐一張 filmstrip + 波形 + word label 疊在一起的 PNG。只在 "這個停頓是換氣還是忘詞？"、"這個 cut 點會不會跳？" 這種視覺疑問才打。

跟 browser-use 完全鏡像：DOM / transcript 當主要閱讀層，screenshot / timeline PNG 只在必要時用。LLM 要的是結構化的決策面，不是 raw pixel。


【Pipeline 跟幾條硬規則】

```
Transcribe → Pack → LLM Reasons → EDL → Render → Self-Eval
                                               │
                                               └─ issue? fix + re-render (max 3)
```

EDL 是 JSON：每個 range 帶 source、start、end、beat 標籤、quote、選這段的理由。render.py 做 per-segment extract → lossless concat → overlay → subtitles LAST。

SKILL.md 裡標 "不可違反" 的規則裡我覺得最有意思的兩條：

→ Subtitles 一定最後套。任何 overlay 都會把字幕蓋掉，而且是 silent failure。
→ 30ms audio fade 每個 segment 邊界都要加。不然每個 cut 都一個 pop。

最後那步 Self-Eval 是精神所在：render 完，LLM 自己對著輸出檔跑 timeline_view，每個 cut 邊界 ±1.5s 擷一張 PNG 自檢，過不了就 fix + re-render，最多三次。你看到 preview 時已經被它自己挑剔過了。


【實測：我拿自己的側專案示範影片餵進去】

手邊剛好有一段 4 分 48 秒的 screen recording（1920×1080@60fps），是我錄給學員看的課程平台走訪——首頁、課程列表、Google login、購買流程、coupon、付款、解鎖後觀看。一鏡到底、全程中文、中間有幾段 "呃" 跟 "那"。完美的測試素材。

裝完後對著影片資料夾開 claude：

> edit @intro.mov into a fancier version with subtitle that has different color with it's outer frame

接下來我跟它對話完全沒下過技術指令，只有這幾句：

→ "tighten pacing"（嫌它保留太多沉默）
→ "warm grade"（選 color grade preset）
→ "Dawson not 刀圣"（Scribe 把我的英文名聽成 "刀圣"）
→ "PingFang"（中文字幕字型）
→ "confirmed"

它自己跑完這套流程：Scribe 轉錄 → pack 成 36 個 phrase 的 takes_packed.md（約 5KB）→ 切 10 個 beat、gap > 1.5s 全砍 → spawn 三個 Agent 並行做 Remotion overlay（lower third / chapters / subtitle）→ per-segment 套 warm grade + 30ms afade → concat → 疊 overlay → subtitle 最後套 → 自己跑 timeline_view 檢查 → 輸出 263.26 秒的 final.mp4。從頭到尾沒 "看" 過一幀，所有剪輯決策都是從那份 5KB 文字推理出來的。


【那個 "刀圣"：文字介面的槓桿】

Scribe 把 Dawson 聽成 "刀圣" 本身不重要，重點在於 video-use 的 "文字即主要介面" 讓這個 bug 的修正變成一行自然語言。

我打 "Dawson not 刀圣"，它就去 takes_packed.md 把 "刀圣" 全部改掉、重 build subtitle overlay，其他 pipeline 一概沒動。如果主要介面是 timeline 上的視覺 marker，要改一個人名得拉時間軸、點字幕軌、一個個取代——對 LLM 都是噪音。文字介面以後，這件事退化成 sed。

這個 pattern 比 skill 本身更值得偷：很多 "看起來一定要視覺介面" 的工作流，背後都能找出一個決策夠用的文字代理層。找到那層，LLM 就能派得上場。


【ElevenLabs 的成本：免費額度能玩多久】

這個 skill 預設就是用 ElevenLabs Scribe——不是可選、是 pipeline 的第一步。沒 API key 根本跑不起來（helpers/transcribe.py 第一次執行會要你塞 ELEVENLABS_API_KEY 到 .env）。

我這次實測 5 分鐘左右的影片，ElevenLabs 數據：

- 總額度：10,000 credits
- 剩餘：9,613 credits
- 實際消耗：387 credits（約 77 credits/分鐘）

換算下來，免費方案一個月的 10,000 credits 大概可以餵 130 分鐘、兩小時出頭的音訊。個人用剪 1～2 部 30 分鐘 podcast 或 5～6 支 20 分鐘 demo 影片綽綽有餘。要處理一整季 podcast（10 集 × 1 小時）第三集就燒完——升級 Starter（$5/月，30,000 credits），或 fork helpers/transcribe.py 改成 Whisper / MLX Whisper 跑本地。整個 skill 只依賴 "word-level timestamp JSON" 這個抽象，真的可以換。

附帶一提：Scribe 對中文表現比我預期好——標點、斷句、speaker 切換都自己帶，除了英文名誤判（Dawson → 刀圣）以外相當穩。


【還能再改的地方】

→ Remotion 第一次跑會在 edit/remotion 底下 npm install 幾百 MB 的 node_modules，資料夾潔癖要忍一下。
→ Self-eval cap 只有 3 輪——我遇過第二輪字幕對位飄了它卻判過，得自己提一次才重 render。
→ 中文會被 skill 自動翻成簡體，連語助詞都翻；章節卡有時會跟背景重疊——都不是架構問題，是 skill 細節，自己改 prompt 就能調。


【結語】

video-use 值得看的點不在 "能不能取代 Premiere"，而在它把 "LLM-native 工具應該長什麼樣" 示範了一遍：不要餵 raw pixel，餵結構化的決策面，必要時讓它自己 drill 進原始資料。

如果你手邊有講解、demo、訪談這種以對話為主的影片懶得剪，這個 skill 跑一次大概就省一個下午。open source、規則全寫在 SKILL.md、沒黑箱。

repo: github.com/browser-use/video-use
x: https://x.com/gregpr07/status/2044554557221675380?s=20

下次做個對應的 audio-use？podcast 剪接是更純粹的 "純文字介面就夠" 場景——或許可以讓他幫忙產生畫面！？
