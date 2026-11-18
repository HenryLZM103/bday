#!/bin/bash
# 双击这个文件：启动本地服务器，并在浏览器打开
cd "$(dirname "$0")"
PORT=8080

IP=$(ipconfig getifaddr en0 2>/dev/null)
[ -z "$IP" ] && IP=$(ipconfig getifaddr en1 2>/dev/null)

if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "端口 $PORT 已在运行，直接打开。"
else
  echo "启动服务器…"
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi

echo ""
echo "  电脑：http://127.0.0.1:$PORT"
echo "  手机：http://$IP:$PORT   （需要连同一个 WiFi）"
echo "  本机名：http://$(scutil --get LocalHostName).local:$PORT"
echo ""
echo "关掉这个窗口或按 Ctrl+C 就停止。"
open "http://127.0.0.1:$PORT"
wait
