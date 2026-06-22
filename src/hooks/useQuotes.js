// useQuotes — fetch the live rows via the gated /api/quotes route and compute
// the fitted model. Waits until auth is ready, and (when auth is enabled) until
// a token exists, before fetching. Refetches when the token changes — so after
// an expired-token re-sign-in, the data transparently reloads.

import { useState, useEffect } from 'react'
import { fetchQuotes } from '../api/quotes.js'
import { fitAll } from '../lib/pricing.js'
import { useAuth } from '../auth/AuthProvider.jsx'

export function useQuotes() {
  const { ready, authEnabled, token, authFetch } = useAuth()
  const [data, setData] = useState({
    rows: [],
    model: null,
    synced: '',
    total: 0,
    loading: true,
    error: null,
  })

  // Gate fetching on auth state: don't hit /api/quotes until we're allowed to.
  const canFetch = ready && (!authEnabled || !!token)

  useEffect(() => {
    if (!canFetch) return
    let cancelled = false
    setData((d) => ({ ...d, loading: true, error: null }))
    ;(async () => {
      try {
        const rows = await fetchQuotes(authFetch)
        const model = fitAll(rows)
        const synced = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        if (!cancelled) {
          setData({ rows, model, synced, total: rows.length, loading: false, error: null })
        }
      } catch (e) {
        if (!cancelled) {
          setData((d) => ({ ...d, error: String((e && e.message) || e), loading: false }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // Refetch when auth becomes ready or the token changes (post re-auth).
  }, [canFetch, token, authFetch])

  return data
}
