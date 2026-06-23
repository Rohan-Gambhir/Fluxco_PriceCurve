// ============================================================================
// Formatting + categorical coloring helpers.
// Ported verbatim from the prototype's fmtMoney / fmtKva / cap / colorFor.
// Rounding follows the brief: currency to ~$1k, $/kVA to integers.
// ============================================================================

import { REGION_COLORS, WIND_COLORS, INCO_COLORS, SRC_COLORS } from './constants.js'

// $1.23M / $352k / $987 — human-rounded currency.
export function fmtMoney(v) {
  if (v == null || isNaN(v)) return '—'
  if (v >= 1e6) return '$' + (Math.round(v / 1e4) / 100).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'k'
  return '$' + Math.round(v)
}

// 3k / 750 — compact kVA labels.
export function fmtKva(v) {
  if (v >= 1000) {
    const k = v / 1000
    return Math.round(k * 10) / 10 + 'k'
  }
  return String(Math.round(v))
}

// Capitalize first letter (winding labels etc.).
export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// Signed percent delta for an add-on factor: +40%, +26%, +0.5% (one decimal
// only when < 1%, so the FAT driver reads +0.5% rather than rounding to +1%).
export function pctLabel(factor) {
  const rounded = Math.round((factor - 1) * 100 * 10) / 10
  return '+' + rounded + '%'
}

// Pick a point's color for the active color-by dimension.
export function colorFor(r, colorBy) {
  if (colorBy === 'region') return REGION_COLORS[r.region] || '#aab0b8'
  if (colorBy === 'winding') return WIND_COLORS[r.winding] || '#b6bcc4'
  if (colorBy === 'incoterm') return INCO_COLORS[r.incoterm_basis] || '#c2c7cf'
  return SRC_COLORS[r.src] || '#999'
}
