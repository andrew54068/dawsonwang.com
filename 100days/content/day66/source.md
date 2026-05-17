Day 66 雜記

1. 如果明明是用 Claude Max 而且額度還沒用完卻遇到這個
API Error: Rate limit reached
檢查一下是不是 model 選成了 1M context 的版本，這個版本會比較容易觸發 rate limit，選回 Default 的就可以解決囉

2. claude remote control failed:
bad option: --sdk-url session_xxxx
https://github.com/anthropics/claude-code/issues/28747

解法：
這是發生在 npm install -g 的版本
如果改成官方的 curl -fsSL https://claude.ai/install.sh | bash 就不會有這個問題，下次要更新就直接在用一樣的指令就可以更新
這裡的一個小毛病是，官方 curl 安裝的版本會自動安裝 npm 版本所以如果你只是單純刪掉 npm uninstall -g @anthropic-ai/claude-code，隔一小段時間他又幫你裝回來，但因為安裝的路徑不同所以根本不會生效，所以我們需要在 ~/.claude/settings.json 裡面設定：
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
這樣才不會讓我的 Mac 同時存在多個版本

/Users/xxx/.local/bin/claude -> 官方 curl 安裝的版本
/Users/xxx/.nvm/versions/node/v22.19.0/bin/claude -> npm 安裝的版本 or auto-updates 的版本

只要在 command line 裡面輸入 `where claude` 如果只有顯示第一個就代表完成啦

3. 受這篇啟發，因為的確有這個痛點，研究了一下後發現其實官方有提供內建的指令 /statusline 他去讀了我的 zsh 相關設定，接著顯示上有點問題請它修復即可，不需要因此安裝別人開發的 skill，而且就算是用別人的套件也要記得先掃描有沒有惡意的程式碼，裝完還要記得刪掉

https://code.claude.com/docs/en/statusline

https://www.threads.com/@yuhaooo0x/post/DVcba0JASmD?xmt=AQF0G7vr3Jqg6TSqotA3mfnyHrBOrcavcgaRSyL6OdCaFw

4. 最近把 Antigravity 換掉，因為實在是太吃記憶體了，感覺是 Antigravity 本身程式沒寫好，所以有時候會出現渲染問題，或是整個很卡，換成其他 editor 就不會有這個問題，現在訂閱了 Claude Code 也不太需要再使用 Antigravity 了，另外最近 Google 把之前違反 ToS 的停權帳號恢復了，但可能還是沒有好解法來使用其中的 Claude Model，所以現在也不用 Antigravity Manager 了。