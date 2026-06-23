"""GET /api/doc?project=&oem=&file=&rev= — GATED.

Verifies the Google ID token (no-op when auth disabled), then mints a short-lived
SIGNED URL for the source document in the private `quote-pdfs` bucket.

Storage layout (verified against the live bucket):
    {slug(project_id)}/{slug(oem_id)}/{slug(filename)}/rev{rev}.pdf
where slug() replaces every char outside [A-Za-z0-9._-] with "_" (so spaces and
parentheses become "_"). Files are stored as application/pdf with no attachment
disposition, so the browser renders them inline. The bucket stays private and the
service-role key never leaves the server.
"""

import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, quote, urlparse

import requests

sys.path.insert(0, os.path.dirname(__file__))  # make sibling _auth.py importable on Vercel
from _auth import AuthError, verify_bearer  # noqa: E402

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""  # server-ONLY
BUCKET = os.getenv("QUOTE_PDF_BUCKET", "quote-pdfs")
EXPIRES_IN = 120  # seconds
STORAGE = SUPABASE_URL + "/storage/v1"


def _slug(s):
    return re.sub(r"[^A-Za-z0-9._-]", "_", s or "")


def _headers():
    return {"Authorization": "Bearer " + SERVICE_KEY, "apikey": SERVICE_KEY, "Content-Type": "application/json"}


def _sign(object_path):
    """Return a full signed URL for an object path, or None if it doesn't exist."""
    enc = quote(object_path, safe="/")
    try:
        r = requests.post(f"{STORAGE}/object/sign/{BUCKET}/{enc}", headers=_headers(), json={"expiresIn": EXPIRES_IN}, timeout=10)
    except Exception:  # noqa: BLE001
        return None
    if r.status_code == 200:
        signed = (r.json() or {}).get("signedURL") or ""
        if signed:
            return STORAGE + signed if signed.startswith("/") else signed
    return None


def _list(prefix):
    try:
        r = requests.post(
            f"{STORAGE}/object/list/{BUCKET}", headers=_headers(),
            json={"prefix": prefix, "limit": 100, "sortBy": {"column": "name", "order": "asc"}}, timeout=10,
        )
        return r.json() if r.status_code == 200 else []
    except Exception:  # noqa: BLE001
        return []


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        try:
            verify_bearer(self.headers.get("Authorization"))
        except AuthError as e:
            return self._send(e.status, {"error": e.detail})
        if not SUPABASE_URL or not SERVICE_KEY:
            return self._send(500, {"error": "Doc preview not configured (set SUPABASE_SERVICE_ROLE_KEY)"})

        qs = parse_qs(urlparse(self.path).query)
        raw_file = (qs.get("file", [""])[0] or "").split("#")[0]
        project = _slug(qs.get("project", [""])[0])
        oem = _slug(qs.get("oem", [""])[0])
        fname = _slug(raw_file)
        try:
            rev = int(qs.get("rev", ["0"])[0])
        except (ValueError, TypeError):
            rev = 0
        if not oem or not fname:
            return self._send(400, {"error": "Missing oem/file"})
        folder = "/".join(p for p in [project, oem, fname] if p)
        if ".." in folder:
            return self._send(400, {"error": "Bad path"})

        # 1) Deterministic path for the requested revision.
        url = _sign(f"{folder}/rev{rev}.pdf")

        # 2) Fallback: list the document folder and pick the requested rev, else
        #    the highest revN.pdf, else any pdf (covers rev-numbering surprises).
        if not url:
            names = [it.get("name") for it in _list(folder) if it.get("id") is not None and (it.get("name") or "").lower().endswith(".pdf")]
            pick = f"rev{rev}.pdf" if f"rev{rev}.pdf" in names else None
            if not pick:
                revs = sorted(n for n in names if re.match(r"rev\d+\.pdf$", n))
                pick = revs[-1] if revs else (names[0] if names else None)
            if pick:
                url = _sign(f"{folder}/{pick}")

        if not url:
            return self._send(404, {"error": "Source document not found in storage"})
        return self._send(200, {"url": url, "filename": raw_file, "kind": "pdf"})
