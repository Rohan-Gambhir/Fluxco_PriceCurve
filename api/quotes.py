"""GET /api/quotes — GATED. Verifies the Google ID token (no-op when auth is
disabled), then reads the cleaned `clean_quotes` view from Supabase server-side
and returns the rows. This is what makes the gate real: the Supabase key lives
only on the server, never in the browser bundle."""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

import requests

sys.path.insert(0, os.path.dirname(__file__))  # make sibling _auth.py importable on Vercel
from _auth import AuthError, verify_bearer  # noqa: E402

# Server-side Supabase config. Accept the VITE_-prefixed names too so the env
# vars already set on Vercel keep working without renaming.
SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # 1) Gate: verify the bearer token (returns None / passes through when auth disabled).
        try:
            verify_bearer(self.headers.get("Authorization"))
        except AuthError as e:
            return self._send(e.status, {"error": e.detail})

        # 2) Read the cleaned view from Supabase, server-side.
        if not SUPABASE_URL or not SUPABASE_KEY:
            return self._send(500, {"error": "Server missing SUPABASE_URL / SUPABASE_ANON_KEY"})
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/clean_quotes",
                params={"select": "*", "order": "kva.asc"},
                headers={"apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY},
                timeout=10,
            )
        except Exception as e:  # noqa: BLE001
            return self._send(502, {"error": f"Upstream fetch failed ({type(e).__name__})"})
        if r.status_code != 200:
            return self._send(502, {"error": f"Upstream HTTP {r.status_code} — {r.text[:120]}"})
        return self._send(200, r.json())
