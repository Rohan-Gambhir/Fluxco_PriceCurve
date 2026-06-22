// ============================================================================
// useQuotes — fetch the live rows once on mount and compute the fitted model.
// Mirrors the prototype's load(): fetch → fitAll(rows) → expose
// {rows, model, synced, total, loading, error}.
// ============================================================================

import { useState, useEffect } from 'react'
import { fetchQuotes } from '../api/quotes.js'
import { fitAll } from '../lib/pricing.js'

export function useQuotes() {
  const [data, setData] = useState({
    rows: [],
    model: null,
    synced: '',
    total: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchQuotes()
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
  }, [])

  return data
}
