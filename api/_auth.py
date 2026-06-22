"""Fluxco internal-tool Google ID-token gate (shared).

Verifies a Google ID token on the BACKEND against Google's public keys and
restricts access to verified @fluxco.com accounts. No-ops when GOOGLE_CLIENT_ID
is unset (so local dev runs unauthenticated). Mirrors the Fluxco standard so
every tool gates access identically; the only stack adaptation is that handlers
call verify_bearer(header) directly instead of via FastAPI's Depends/Header.
"""

import os
from typing import Optional

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

_GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip() or None
_ALLOWED_DOMAIN = os.getenv("FLUXCO_ALLOWED_DOMAIN", "fluxco.com").strip().lower() or "fluxco.com"
# Optional per-person allowlist (comma-separated). Unset = the whole domain.
_ALLOWED_EMAILS = {e.strip().lower() for e in os.getenv("FLUXCO_ALLOWED_EMAILS", "").split(",") if e.strip()}
_GOOGLE_REQUEST = google_requests.Request()  # reuse one transport across verifications


class AuthError(Exception):
    """Raised when a request fails the gate. Carries the HTTP status + detail."""

    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def auth_enabled() -> bool:
    return _GOOGLE_CLIENT_ID is not None


def config_payload() -> dict:
    """Public config the frontend reads on load to decide whether to sign in."""
    return {
        "auth_enabled": _GOOGLE_CLIENT_ID is not None,
        "google_client_id": _GOOGLE_CLIENT_ID,
        "allowed_domain": _ALLOWED_DOMAIN,
    }


def verify_bearer(authorization: Optional[str]) -> Optional[dict]:
    """Verify the `Authorization: Bearer <id_token>` header. Returns the claims,
    or None when auth is disabled. Raises AuthError(401/403) on any failure."""
    if _GOOGLE_CLIENT_ID is None:  # auth disabled (local dev)
        return None
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthError(401, "Missing Bearer token")
    token = authorization[len("Bearer "):].strip()
    try:
        claims = id_token.verify_oauth2_token(token, _GOOGLE_REQUEST, _GOOGLE_CLIENT_ID)
    except Exception as e:  # noqa: BLE001 — any verification failure is a 401
        raise AuthError(401, f"Invalid token ({type(e).__name__})")
    if not claims.get("email_verified"):
        raise AuthError(403, "Email not verified")
    email = (claims.get("email") or "").lower()
    if not email.endswith("@" + _ALLOWED_DOMAIN):
        raise AuthError(403, f"Access restricted to @{_ALLOWED_DOMAIN} accounts")
    if _ALLOWED_EMAILS and email not in _ALLOWED_EMAILS:
        raise AuthError(403, "Not on the access list")
    return claims
