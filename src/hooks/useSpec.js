// ============================================================================
// useSpec — the persisted spec state (the prototype's `persist` pattern).
// Every control writes through `persist`, which updates state AND mirrors the
// whitelisted keys to localStorage['fluxco.spec.v1']. Restored on load.
// ============================================================================

import { useState, useCallback, useEffect } from 'react'
import { DEFAULT_SPEC, SPEC_STORAGE_KEY } from '../lib/constants.js'

function loadInitial() {
  try {
    const s = JSON.parse(localStorage.getItem(SPEC_STORAGE_KEY) || 'null')
    if (s && typeof s === 'object') {
      // 'source' color-by was removed — fall back to the default.
      if (s.colorBy === 'source') s.colorBy = DEFAULT_SPEC.colorBy
      // Merge so newly-added defaults survive an older saved blob.
      return { ...DEFAULT_SPEC, ...s, addons: { ...DEFAULT_SPEC.addons, ...(s.addons || {}) } }
    }
  } catch (e) {
    /* ignore malformed storage */
  }
  return DEFAULT_SPEC
}

export function useSpec() {
  const [spec, setSpec] = useState(loadInitial)

  // Mirror the persisted subset to localStorage whenever spec changes.
  useEffect(() => {
    try {
      const { source, kva, hv, lv, units, addons, colorBy, theme, incoOff, windOff, regionOff, unitsOff, hvOff } = spec
      localStorage.setItem(
        SPEC_STORAGE_KEY,
        JSON.stringify({ source, kva, hv, lv, units, addons, colorBy, theme, incoOff, windOff, regionOff, unitsOff, hvOff })
      )
    } catch (e) {
      /* ignore quota / private-mode errors */
    }
  }, [spec])

  // persist(patch) — merge a partial update into spec (mirrors this.persist).
  const persist = useCallback((patch) => {
    setSpec((prev) => ({ ...prev, ...patch }))
  }, [])

  // setKva — clamp to [50, 40000] and round (mirrors this.setKva).
  const setKva = useCallback((v) => {
    v = Math.max(50, Math.min(40000, Math.round(v)))
    persist({ kva: v })
  }, [persist])

  return { spec, persist, setKva }
}
