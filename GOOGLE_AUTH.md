# Google Sign-In — Fluxco internal-tool standard (Pricing Studio)

This tool gates access with the Fluxco standard: a Google **ID-token** gate that
restricts access to verified **@fluxco.com** Google Workspace accounts, **enforced
on the backend**, that **no-ops when unconfigured** (so local dev runs auth-off).

## How it's wired here (stack adaptation)

This tool is a **React + Vite static SPA on Vercel** — it has no FastAPI server.
To honor the standard's invariants (the frontend must never decide access; the
data must be gated, not just the screen), the backend the standard assumes is
implemented as **Vercel serverless functions**, and the data read is routed
through a gated route so the Supabase key never reaches the browser.

| Standard (FastAPI) | Here (Vercel) |
|---|---|
| `GET /api/config` (public) | `api/config.py` |
| `verify_google_token` dependency | `api/_auth.py` → `verify_bearer()` (same checks, `google-auth`) |
| gated `/api/*` routes | `api/quotes.py` — verifies token, then reads `clean_quotes` server-side |
| browser `authFetch` + GSI overlay | `src/auth/AuthProvider.jsx`, `src/components/SignInOverlay.jsx` |
| local dev = run the server | `npm run dev` uses a Vite dev middleware (`vite.config.js`) that serves `/api/*` with **auth off**; `vercel dev` runs the real Python gate |

## Security invariants (do not break)

- Every protected route (`/api/quotes`) requires a valid Google ID token whose
  email is `email_verified` and ends in `@fluxco.com`. Verified on the **backend**
  against Google's public keys (`id_token.verify_oauth2_token`).
- The frontend may decode the token only to **display** the email; it never
  decides access.
- `GET /api/config` and the HTML shell are public; everything else is gated.
- Domain-wide (any @fluxco.com) unless `FLUXCO_ALLOWED_EMAILS` is set.
- When `GOOGLE_CLIENT_ID` is unset, the gate is a **no-op** (local dev).
- New protected route → must call `verify_bearer(...)`. New frontend call → must
  use `authFetch` (from `useAuth()`). These gaps throw no error until a real user
  hits them.

## Env vars (Vercel → Settings → Environment Variables, **Production scope**)

| Var | Required | Meaning |
|---|---|---|
| `GOOGLE_CLIENT_ID` | yes (the on-switch) | OAuth **Web** client ID for THIS tool (`…apps.googleusercontent.com`). |
| `FLUXCO_ALLOWED_DOMAIN` | no | defaults to `fluxco.com`. |
| `FLUXCO_ALLOWED_EMAILS` | no | comma-separated allowlist; restrict to specific people. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | yes | read server-side by `api/quotes.py`. The `VITE_`-prefixed names are also accepted. |

Leave `GOOGLE_CLIENT_ID` **unset locally** so the app runs auth-off.
**Env-var changes take effect only on a redeploy.**

## Manual one-time setup in Google Cloud Console (collect ONE value)

Sign in at <https://console.cloud.google.com> with an @fluxco.com account.

1. Use the shared Fluxco Cloud project (or create one). **OAuth consent screen →
   User type: Internal** (one-time per project; restricts sign-in to the
   fluxco.com Workspace).
2. **Create a NEW OAuth 2.0 Client ID** → Application type: **Web application**,
   named for this tool. One client per tool — don't share across tools.
3. **Authorized JavaScript origins** = this tool's **stable** URLs, exact,
   `https://`, no trailing slash, no path. **For this deployment:**
   - `https://fluxco-price-curve.vercel.app` (production)
   - `http://localhost:5173` (local testing)
   - plus any custom domain you later attach
   - ⚠️ Do **NOT** add per-deployment Vercel URLs (`<tool>-<hash>-<team>.vercel.app`)
     — they change each deploy and cause `origin_mismatch`. Use the stable alias.
4. **Authorized redirect URIs** = leave **EMPTY** (this flow doesn't use them).
5. Collect exactly one value: the **Client ID**. No client secret, no API key,
   no service account. The Client ID is public (it ships to the browser).

Set the Client ID as `GOOGLE_CLIENT_ID` in Vercel (Production) → **redeploy**.

## Gotchas

- `origin_mismatch` at sign-in = the page's exact origin isn't a registered
  JavaScript origin — usually a per-deployment URL, a trailing slash, http vs
  https, or it was pasted into the redirect-URIs box instead of JS origins.
- Changing an env var requires a **redeploy** to take effect.
- ID tokens last ~1 hour; the 401 handler clears the token and re-prompts, and
  `useQuotes` refetches once a fresh token arrives.
