## 本日讀者定位

基礎：見 /target-audience.md

## 本日主題對讀者的意義

過去一年多，AI 從「會聊天」變成「會做事」，但網路上「MCP 取代 X」、「skill 取代 MCP」的聲音很亂——這篇幫讀者把三層工具的角色定位清楚，下次選工具時知道哪一層在解什麼問題,不會被輿論帶著跑。

## 讀者起點

- 知道 AI 可以幫忙寫東西、查資料，但對「AI 怎麼接外部工具」沒概念
- 可能聽過 MCP、skill、CLI 這幾個詞,但不確定差在哪
- 不知道為什麼有時候叫 AI 做事它能做、有時候不行
- 對 API、auth、context window 等開發者語彙陌生

## 需要翻譯的概念

- MCP（Model Context Protocol） → 一條讓 AI 連到你私人帳號／資料的專用通道（已在原文括弧定義）
- skill → 一份寫好的「步驟筆記」,AI 用到的時候才翻出來看
- CLI（Command Line Interface） → 在終端機輸入的指令工具,類似電腦版的「快捷指令」
- private data／私有資料 → 你帳號裡的東西(Gmail 信件、私人 Notion),不登入別人看不到
- API → 服務跟服務之間講話的方式
- context window → AI 一次能記住多少資訊的容量上限
- OAuth → 第三方登入授權(像「用 Google 登入」那種)
- --help → 大部分指令工具都附帶的說明書,在後面加上 --help 就會列出怎麼用
- deploy／部署 → 把程式放到伺服器上跑起來
- sub-command → 一個指令工具下面的子功能(例：git commit 的 commit)

## 讀完之後讀者應該能

1. 用一句話講清楚 MCP／skill／CLI 各自解什麼問題（不是誰取代誰）
2. 看到「想讓 AI 做某件事」的需求,大致判斷該找哪一層工具
3. 不再被「X 取代 Y」這類二元敘事帶風向
