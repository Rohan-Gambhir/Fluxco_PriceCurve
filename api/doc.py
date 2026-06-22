"""GET /api/doc?project=<project_id>&file=<filename> — GATED.

Verifies the Google ID token (no-op when auth disabled), then mints a short-lived
SIGNED URL for the source document in the private `quote-pdfs` bucket
(objects laid out as `<project_id>/<filename>`). The browser embeds that signed
URL; the bucket stays private and the service-role key never leaves the server.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, quote, urlparse

import requests

sys.path.insert(0, os.path.dirname(__file__))  # make sibling _auth.py importable on Vercel
from _auth import AuthError, verify_bearer  # noqa: E402

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
# Server-ONLY: reads the private bucket. Never VITE_-prefixed, never sent to the browser.
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
BUCKET = os.getenv("QUOTE_PDF_BUCKET", "quote-pdfs")
EXPIRES_IN = 120  # seconds — the signed URL is short-lived


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # 1) Gate.
        try:
            verify_bearer(self.headers.get("Authorization"))
        except AuthError as e:
            return self._send(e.status, {"error": e.detail})

        if not SUPABASE_URL or not SERVICE_KEY:
            return self._send(500, {"error": "Doc preview not configured (set SUPABASE_SERVICE_ROLE_KEY)"})

        # 2) Resolve the object path from project + filename.
        qs = parse_qs(urlparse(self.path).query)
        project = (qs.get("project", [""])[0] or "").strip()
        file = (qs.get("file", [""])[0] or "").strip().split("#")[0]  # drop spreadsheet row anchors
        if not file:
            return self._send(400, {"error": "Missing file"})
        path = (project + "/" + file) if project else file
        if ".." in path:
            return self._send(400, {"error": "Bad path"})
        enc = quote(path, safe="/")

        # 3) Ask Supabase Storage to sign it (service-role key).
        try:
            r = requests.post(
                f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET}/{enc}",
                headers={"Authorization": "Bearer " + SERVICE_KEY, "Content-Type": "application/json"},
                json={"expiresIn": EXPIRES_IN},
                timeout=10,
            )
        except Exception as e:  # noqa: BLE001
            return self._send(502, {"error": f"Sign request failed ({type(e).__name__})"})
        if r.status_code != 200:
            status = r.status_code if r.status_code in (400, 401, 403, 404) else 502
            return self._send(status, {"error": f"Storage sign HTTP {r.status_code} — {r.text[:140]}"})

        signed = (r.json() or {}).get("signedURL") or ""
        if not signed:
            return self._send(502, {"error": "No signedURL in storage response"})
        full = SUPABASE_URL + "/storage/v1" + signed if signed.startswith("/") else signed
        kind = "pdf" if file.lower().endswith(".pdf") else "other"
        return self._send(200, {"url": full, "filename": file, "kind": kind})
