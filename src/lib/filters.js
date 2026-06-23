// The four comparable-filter dimensions. Each narrows the visible set used for
// the charts, comparables, dot-strip and confidence — display only, like the
// incoterm filter; it does not refit the curve.

import { REGION_LABELS, REGION_COLORS, WIND_COLORS } from './constants.js'

function unitsBucket(u) {
  const n = Number(u) || 1
  return n <= 1 ? '1' : n <= 10 ? '2-10' : '10+'
}

export const FILTER_DIMS = [
  {
    key: 'winding', label: 'Winding', off: 'windOff', colorBy: 'winding',
    keyOf: (r) => r.winding || 'unk',
    order: ['copper', 'aluminum', 'unk'],
    labelOf: (k) => ({ copper: 'Copper', aluminum: 'Aluminum', unk: 'Unknown' }[k] || k),
    swatch: (k) => WIND_COLORS[k] || '#b6bcc4',
  },
  {
    key: 'region', label: 'Origin region', off: 'regionOff', colorBy: 'region',
    keyOf: (r) => r.region || 'Unknown',
    order: Object.keys(REGION_LABELS),
    labelOf: (k) => REGION_LABELS[k] || k,
    swatch: (k) => REGION_COLORS[k] || '#aab0b8',
  },
  {
    key: 'units', label: 'Order size', off: 'unitsOff', colorBy: null,
    keyOf: (r) => unitsBucket(r.units),
    order: ['1', '2-10', '10+'],
    labelOf: (k) => ({ '1': '1 unit', '2-10': '2–10 units', '10+': '10+ units' }[k] || k),
    swatch: null,
  },
  {
    key: 'hv', label: 'Primary voltage · HV', off: 'hvOff', colorBy: null,
    keyOf: (r) => (r.hv != null ? String(r.hv) : 'n/a'),
    order: null, // numeric sort
    labelOf: (k) => (k === 'n/a' ? 'Unspecified' : k + ' kV'),
    swatch: null,
  },
]

// A row passes when, for every dimension, its key is not in that dim's off-list.
export function passesFilters(r, spec) {
  return FILTER_DIMS.every((d) => !(spec[d.off] || []).includes(d.keyOf(r)))
}
