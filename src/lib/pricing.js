// ============================================================================
// The pricing algorithm — ported VERBATIM from the prototype Component class.
// This is the most valuable part of the handoff: two power-law fits (quotes vs
// bids fitted SEPARATELY — never one global curve), a P10–P90 band from
// residual ratios, multiplicative add-ons, and the comparables/confidence derive.
//
// Class methods that referenced `this.state` / `this.ADDONS` are converted to
// pure functions taking explicit args. The math is unchanged.
//
// Note on P50: P50 is the fitted-curve midpoint (fit(kVA) × factors), NOT an
// empirical 50th percentile. P10/P90 ARE true percentiles of residual ratios.
// This is intentional — keep it.
// ============================================================================

import { ADDONS } from './constants.js'
import { passesFilters } from './filters.js'

// Linear-interpolated percentile of a numeric array.
export function _pct(arr, q) {
  if (!arr.length) return 1
  const a = [...arr].sort((u, v) => u - v)
  const i = (a.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return a[lo] + (a[hi] - a[lo]) * (i - lo)
}

// Log-log least-squares power-law fit: price ≈ a · kVA^b.
// lo/hi are the 10th/90th percentiles of residual ratios (actual ÷ predicted).
export function fitOne(pts) {
  const n = pts.length
  if (n < 2) return null
  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (const p of pts) {
    const X = Math.log(p.x), Y = Math.log(p.y)
    sx += X; sy += Y; sxx += X * X; sxy += X * Y
  }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const a = Math.exp((sy - b * sx) / n)
  const ratios = pts.map((p) => p.y / (a * Math.pow(p.x, b)))
  return { a, b, lo: _pct(ratios, 0.1), hi: _pct(ratios, 0.9), n }
}

// Fit `quote` and `bid` sources SEPARATELY — the core insight of the model.
export function fitAll(rows) {
  const pf = (src) =>
    rows
      .filter((r) => r.is_latest && r.src === src && r.kva > 0 && r.ppu > 0)
      .map((r) => ({ x: r.kva, y: r.ppu }))
  return { quote: fitOne(pf('quote')), bid: fitOne(pf('bid')) }
}

// Select the active fit for a rating given the source filter.
// Both → piecewise split at 2.5 MVA (bids below, quotes at/above).
export function fitAt(kv, source, model) {
  if (!model) return null
  if (source === 'quote') return model.quote
  if (source === 'bid') return model.bid
  return kv < 2500 ? model.bid || model.quote : model.quote || model.bid
}

// Human-readable label for which curve produced the estimate.
export function regimeLabel(source, kva) {
  if (source === 'quote') return 'OEM-quote curve'
  if (source === 'bid') return 'public-bid curve'
  return kva < 2500 ? 'public-bid curve (<2.5 MVA)' : 'OEM-quote curve (≥2.5 MVA)'
}

// ---------- DERIVE ----------
// Assembles the central estimate, band, comparables (±50% size window),
// confidence reasons, and dot-strip data for the current spec + filters.
// `spec` carries: source, kva, addons, incoOff. `rows` is the live data.
export function derive(spec, rows, model) {
  const S = spec
  rows = rows || []
  const latest = rows.filter((r) => r.is_latest)
  const ikey = (r) => r.incoterm_basis || 'n/a'
  const srcSet = latest.filter((r) => (S.source === 'both' ? true : r.src === S.source))
  const visible = srcSet.filter((r) => !(S.incoOff || []).includes(ikey(r)) && passesFilters(r, S))
  const f = fitAt(S.kva, S.source, model)
  const base = f ? f.a * Math.pow(S.kva, f.b) : null
  let factor = 1
  ADDONS.forEach((a) => {
    if (S.addons[a.id]) factor *= a.factor
  })
  const adj = base != null ? base * factor : null
  let est = null
  if (f && adj != null) {
    est = {
      base, factor, adj,
      p10: adj * f.lo, p50: adj, p90: adj * f.hi,
      dpk10: (adj * f.lo) / S.kva, dpk50: adj / S.kva, dpk90: (adj * f.hi) / S.kva,
      lo: f.lo, hi: f.hi,
    }
  }
  const comps = [...visible]
    .sort((x, y) => Math.abs(Math.log10(x.kva / S.kva)) - Math.abs(Math.log10(y.kva / S.kva)))
    .slice(0, 8)
  const near = visible.filter((r) => Math.abs(Math.log10(r.kva / S.kva)) <= Math.log10(1.5))
  const basesNear = [...new Set(near.map((r) => r.incoterm_basis).filter(Boolean))]
  const pool = near.length ? near : visible
  const avgConf = pool.length ? pool.reduce((s, r) => s + (r.dpk_conf || 0), 0) / pool.length : 0
  let level
  if (near.length >= 8 && basesNear.length <= 1 && avgConf >= 0.8) level = 'Good'
  else if (near.length >= 4) level = 'Moderate'
  else level = 'Thin'
  const basesVis = [...new Set(visible.map((r) => r.incoterm_basis).filter(Boolean))]
  return { S, latest, visible, srcSet, f, base, factor, adj, est, comps, near, basesNear, avgConf, level, basesVis }
}
