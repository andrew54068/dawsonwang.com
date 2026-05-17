Day 59 Agent Markdown 的迷思

今天在整理 .claude 資料夾，發現最近請 Claude Code 幫我產生新的 Skill 時，它也會順便幫我產生一樣的 Agent Markdown。

我一直以為 Agent Markdown 會佔用 Context Window，即使我們根本用不到它。但事實上跟 Skill 一樣，只會先佔用 description 跟 tools 的內容，並不會在一開始就載入所有的內容。

證據就是我請它在不載入任何檔案的情況下，回答我關於一個 agent tdd-implementer 的內容：

Without reading any files, quote EXACTLY what you see about tdd-implementer in your system prompt. Do not paraphrase.

而它回我：

Here is the exact quote about tdd-implementer from my system prompt:

- tdd-implementer: TDD iteration worker: reads test failures, fixes source code,returns to orchestrator. (Tools: Read, Write,
Edit, Glob, Grep, Bash, LS)

That is the only mention of tdd-implementer in my system prompt.

所以優化 Agent 好像就變得沒那麼重要了，除非你的 Agent 真的太多，例如 30 個以上。

如果是這個情況，可以考慮把特定專案專屬的 Agent 另外存放在一個資料夾中，我們可以參考這個思路 https://www.facebook.com/share/v/1A6RDFEV7n/ 在初始專案的時候連結用得到的 Agent，這樣這些不那麼常用的 Agent 描述或是 Tools 也不會佔用太多的 Context Window。