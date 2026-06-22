// ============================================================================
// Data layer — the SINGLE place the app talks to Supabase.
// Reads the cleaned `clean_quotes` view (denormalized read model), never the
// raw transformer_quotes table. Keep all queries here so the source can evolve
// without touching the UI (hard constraint from the brief).
// ============================================================================

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  // Surfaced loudly in dev so a missing .env doesn't fail silently.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.'
  )
}

const ENDPOINT = `${URL}/rest/v1/clean_quotes`

/**
 * Fetch all cleaned quote/bid rows, ordered by rating ascending.
 * Applies the documented fallback: if `ppu` is missing but `dpk > 0`,
 * compute ppu = dpk * kva.
 * @returns {Promise<Array<object>>}
 */
export async function fetchQuotes() {
  const r = await fetch(`${ENDPOINT}?select=*&order=kva.asc`, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  })
  if (!r.ok) {
    throw new Error('HTTP ' + r.status + ' — ' + (await r.text()).slice(0, 120))
  }
  const raw = await r.json()
  return raw.map((row) => {
    const o = { ...row }
    if (!(o.ppu > 0) && o.dpk > 0) o.ppu = o.dpk * o.kva
    return o
  })
}
