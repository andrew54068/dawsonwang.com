#!/bin/bash
# Headless Chrome screenshot that doesn't hang: Chrome 154 writes the PNG but
# never exits, so poll for the file and kill the throwaway profile's processes.
# usage: shot.sh <url> <out.png> [width=1440] [height=900]
URL=$1; OUT=$2; W=${3:-1440}; H=${4:-900}
rm -f "$OUT"
PROFILE=$(mktemp -d /tmp/chrome-shot.XXXXXX)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --force-prefers-reduced-motion --no-first-run --no-default-browser-check --user-data-dir="$PROFILE" \
  --window-size="$W,$H" --virtual-time-budget=6000 --screenshot="$OUT" "$URL" >/dev/null 2>&1 &
for _ in $(seq 1 80); do [ -s "$OUT" ] && break; sleep 0.5; done
sleep 0.5
pkill -f "$PROFILE" 2>/dev/null
rm -rf "$PROFILE"
if [ -s "$OUT" ]; then echo "ok $OUT"; else echo "FAILED $OUT"; exit 1; fi
