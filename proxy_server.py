#!/usr/bin/env python3
"""
Local CORS proxy for blog-import.js
Usage: python3 proxy_server.py

Listens on http://localhost:8002
Accepts: GET /proxy?url=<encoded-url>
Returns: the fetched HTML with CORS headers set
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.parse import parse_qs, urlparse, unquote
import urllib.error
import ssl
import sys

# macOS ships Python without system cert access; skip verification for this local dev proxy.
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

PORT = 8002

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}


class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != '/proxy':
            self.send_error(404, 'Use /proxy?url=<url>')
            return

        params = parse_qs(parsed.query)
        target = params.get('url', [None])[0]
        if not target:
            self.send_error(400, 'Missing url parameter')
            return

        target = unquote(target)

        try:
            req = Request(target, headers=HEADERS)
            with urlopen(req, timeout=20, context=SSL_CTX) as resp:
                content = resp.read()
                content_type = resp.headers.get('Content-Type', 'text/html; charset=utf-8')

            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self._cors()
            self.end_headers()
            self.wfile.write(content)

        except urllib.error.HTTPError as e:
            self.send_error(e.code, 'Target returned: ' + str(e.reason))
        except urllib.error.URLError as e:
            self.send_error(502, 'Could not reach target: ' + str(e.reason))
        except Exception as e:
            self.send_error(500, str(e))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def log_message(self, fmt, *args):
        # Only print errors
        if args and str(args[1]) not in ('200', '204'):
            print(f'[proxy] {self.address_string()} {fmt % args}', file=sys.stderr)


if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), ProxyHandler)
    print(f'CORS proxy running → http://localhost:{PORT}/proxy?url=<url>')
    print('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
