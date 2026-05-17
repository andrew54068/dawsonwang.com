Day 95 Claude Code 的秘密(2)——原來是關鍵字在擋？

今天試了一下，的確訂閱的 Claude Code 不給用 OpenClaw 了

即使單純用 agent sdk 也還是會被擋下來

但我覺得太詭異了

明明這就是官方認證的方式

到底是用什麼機制辨認的？

於是我就去看到底送出的 prompt 有什麼貓膩

裡面無可避免的會包含

"_meta": {
  "name": "openclaw",
}

所以就在猜唯一的線索應該就是這個

於是我試著在 OpenClaw 呼叫 SDK 的 query() 之前，把所有 openclaw 的字都過濾掉，結果就通了

代表 Anthropic 根本是用關鍵字在擋 request 的

所以我強烈懷疑直接把整個專案改名就可以用訂閱帳號了 XD
