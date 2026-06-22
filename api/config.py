"""GET /api/config — public. The frontend reads this on load to learn whether
auth is enabled and, if so, the Google client id + allowed domain to init GSI."""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))  # make sibling _auth.py importable on Vercel
from _auth import config_payload  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps(config_payload()).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
