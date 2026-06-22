// Data layer — the SINGLE place the frontend reads quote data.
// It now calls the gated `/api/quotes` serverless route (which verifies the
// Google ID token on the backend, then reads the cleaned `clean_quotes` view
// from Supabase). The Supabase key no longer ships to the browser.
//
// Pass the auth-aware `authFetch` from useAuth(); it attaches the Bearer token
// and handles 401s. Falls back to plain fetch when auth is disabled.

/**
 * Fetch all cleaned quote/bid rows via the gated API route.
 * Applies the documented fallback: if `ppu` is missing but `dpk > 0`,
 * compute ppu = dpk * kva.
 * @param {(url: string, opts?: object) => Promise<Response>} [authFetch]
 * @returns {Promise<Array<object>>}
 */
export async function fetchQuotes(authFetch) {
  const doFetch = authFetch || fetch
  const r = await doFetch('/api/quotes')
  if (!r.ok) {
    let detail = ''
    try {
      detail = (await r.json())?.error || ''
    } catch {
      /* non-JSON body */
    }
    throw new Error('HTTP ' + r.status + (detail ? ' — ' + detail : ''))
  }
  const raw = await r.json()
  return raw.map((row) => {
    const o = { ...row }
    if (!(o.ppu > 0) && o.dpk > 0) o.ppu = o.dpk * o.kva
    return o
  })
}
