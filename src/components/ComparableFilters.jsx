// Comparable filters (Tier 1): Winding, Origin region, Order size, Primary
// voltage. Each chip narrows the historical set behind the estimate — the
// charts, comparables, dot-strip and confidence — without refitting the curve
// (same display-only behaviour as the incoterm filter). Counts are over the
// current source set, like the incoterm panel.

import { FILTER_DIMS } from '../lib/filters.js'
import { cardStyle, overline } from '../lib/ui.js'

function FilterGroup({ dim, spec, persist, srcSet }) {
  const counts = {}
  srcSet.forEach((r) => {
    const k = dim.keyOf(r)
    counts[k] = (counts[k] || 0) + 1
  })
  let keys = Object.keys(counts)
  if (dim.order) {
    keys = dim.order.filter((k) => counts[k]).concat(keys.filter((k) => !dim.order.includes(k)))
  } else {
    keys.sort((a, b) => (a === 'n/a' ? 1 : b === 'n/a' ? -1 : parseFloat(a) - parseFloat(b)))
  }
  if (!keys.length) return null
  const offList = spec[dim.off] || []

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 7 }}>{dim.label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {keys.map((k) => {
          const on = !offList.includes(k)
          const color = dim.swatch ? dim.swatch(k) : null
          return (
            <button
              key={k}
              aria-pressed={on}
              onClick={() => {
                const next = on ? [...offList, k] : offList.filter((x) => x !== k)
                const patch = { [dim.off]: next }
                if (dim.colorBy) patch.colorBy = dim.colorBy
                persist(patch)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, color: 'var(--text)', background: on ? 'var(--panel2)' : 'transparent',
                border: '1px solid var(--line)', borderRadius: 8, padding: '5px 9px',
                opacity: on ? 1 : 0.45, transition: 'all .15s',
              }}
            >
              {color && (
                <span style={{ width: 9, height: 9, borderRadius: 2, flex: 'none', background: on ? color : 'transparent', border: '1.5px solid ' + color }} />
              )}
              <span style={{ fontWeight: 600 }}>{dim.labelOf(k)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)' }}>{counts[k]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ComparableFilters({ spec, persist, derived }) {
  const anyOff = FILTER_DIMS.some((d) => (spec[d.off] || []).length > 0)

  return (
    <section style={{ ...cardStyle, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={overline}>Comparable filters</div>
        {anyOff && (
          <button
            onClick={() => persist({ windOff: [], regionOff: [], unitsOff: [], hvOff: [] })}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: 'var(--accent)', padding: 0 }}
          >
            reset
          </button>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 14, lineHeight: 1.4 }}>
        Narrow the historical set behind the estimate. Toggling a chip updates the charts, comparables
        and confidence — it doesn't refit the curve.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {FILTER_DIMS.map((dim) => (
          <FilterGroup key={dim.key} dim={dim} spec={spec} persist={persist} srcSet={derived.srcSet} />
        ))}
      </div>
    </section>
  )
}
