day 27 自製 Threads 發文機器人-9 網頁也可以自動化？

今天來分享一個很少人提但我覺得很強大的東西：Chrome DevTools MCP
https://github.com/ChromeDevTools/chrome-devtools-mcp

舉 Threads 自動發文為例，我需要知道發文的 api 格式是如何？Request 參數有哪些，Response 又是什麼？
過去的流程是我打開瀏覽器操作過一次後開 DevTools，切到 Network 的 Tab，開啟錄製功能，操作任何我想要研究的動作對應的 Request，找到相關的 Request 後右鍵複製 cURL，丟去給 AI 請他幫我寫成本地執行的 API Request，因為我們要的是未來的自動化不用依賴網頁的操作，所以我要的不是類似以前按鍵精靈的腳本，也不是 Selenium，寫死的 UI 操作。
導入 MCP 後我們可以先測試看看是否 AI 會學會這項技能。
我是使用 Antigravity，只要設定好 MCP 的 raw config

{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222",
        "-y"
      ]
    }
  }
}

後按 refresh 就可以用以下 prompt 測試：

Check the performance of https://developers.chrome.com

看他的流程中調用到 chrome-devtools 就表示成功囉！

接著我需要在 Antigravity 的內建 chrome browser 中先登入好 Threads，接著我只是跟他說：

Now I've logged into the https://www.threads.com/ . It's a social media platform, help me create a 3 parts multi threads post with tag "testing tag" and record the relevent request. After that we can verify if the api-spec.yml is correct or not.

接著我們再請他用 api-spec.yml 去 TDD，就省下原本開發流程大約 80% 的時間，等到程式實作完我們再請他用 script 去發測試文看看是否有成功即可。
目前已經用這個方式成功實作出 po 文跟刪文的自動化囉～

如果你看到這篇文，那就代表我的自動拆分串文並發文的流程已經成功串接！！這個系列也就到此告一段落了，接下來就會用其他 Side project 來繼續深化 SDD 的能力，歡迎大家來交流！