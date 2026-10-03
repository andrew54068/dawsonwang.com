#!/usr/bin/env python3
"""Private preview server for the home-page style picker.

Serves this folder on one interface (the Tailscale IP, so only the tailnet can
reach it) plus a single write endpoint for the picker's feedback button:

    POST /api/pick  {"style": "...", "note": "..."}  -> appended to picks.jsonl

Usage: python3 serve.py <bind-host> <port>
"""
import json
import os
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PICKS = os.path.join(ROOT, 'picks.jsonl')


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Designs change while the user is reviewing; never serve a stale copy.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/api/pick':
            self.send_error(404)
            return
        length = min(int(self.headers.get('Content-Length') or 0), 8192)
        try:
            data = json.loads(self.rfile.read(length) or b'{}')
        except ValueError:
            self.send_error(400)
            return
        entry = {
            'ts': time.strftime('%Y-%m-%d %H:%M:%S'),
            'style': str(data.get('style', ''))[:60],
            'note': str(data.get('note', ''))[:2000],
            'from': self.client_address[0],
        }
        with open(PICKS, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        body = b'{"ok":true}'
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 4610
    server = ThreadingHTTPServer((host, port), partial(Handler, directory=ROOT))
    print(f'serving {ROOT} on http://{host}:{port}/', flush=True)
    server.serve_forever()
