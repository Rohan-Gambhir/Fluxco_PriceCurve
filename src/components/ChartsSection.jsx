// "Where this deal sits in the market" — the color-by control, the mixed-basis
// honesty warning, the two stacked charts (price vs kVA, $/kVA vs kVA), and the
// categorical legend for the active color-by dimension.

import { COLOR_BYS } from '../lib/constants.js'
import { cap, colorFor } from '../lib/format.js'
import { REGION_LABELS } from '../lib/constants.js'
import { segBtn, cardStyle } from '../lib/ui.js'
import Chart from './Chart.jsx'

// Distinct legend entries for the active color-by dimension (ported from legendItems).
function legendItems(d, colorBy) {
  const seen = new Map()
  d.visible.forEach((r) => {
    let k, l
    if (colorBy === 'region') { k = r.region; l = REGION_LABELS[r.region] || r.region }
    else if (colorBy === 'winding') { k = r.winding; l = cap(r.winding) }
    else if (colorBy === 'incoterm') { k = r.incoterm_basis || 'n/a'; l = k }
    else { k = r.src; l = r.src === 'bid' ? 'Public bid' : 'OEM quote' }
    if (!seen.has(k)) seen.set(k, { label: l, color: colorFor(r, colorBy) })
  })
  return [...seen.values()]
}

export default function ChartsSection({ spec, persist, derived, model, themeVars, onPreview }) {
  const d = derived
  const legend = legendItems(d, spec.colorBy)
  const mixedBasis = d.basesVis.length > 1
  const mixedBasisStr =
    'Chart mixes ' + d.basesVis.join(' / ') +
    ' incoterm bases — an EXW point excludes freight + duty a DDP point includes (15–30%+). Colour by Incoterm to separate them.'

  return (
    <section style={{ ...cardStyle, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Where this deal sits in the market</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>colour by</span>
          <div
            role="group"
            aria-label="Colour points by"
            style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 10 }}
          >
            {COLOR_BYS.map(([k, l]) => (
              <button key={k} onClick={() => persist({ colorBy: k })} aria-pressed={spec.colorBy === k} style={segBtn(spec.colorBy === k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mixedBasis && (
        <div style={{ margin: '8px 0 4px', padding: '9px 13px', background: 'rgba(155,78,39,.09)', border: '1px solid rgba(155,78,39,.32)', borderRadius: 9, fontSize: 12, color: 'var(--warn)', lineHeight: 1.4 }}>
          ⚠ {mixedBasisStr}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12 }}>
        <figure style={{ flex: 1, minWidth: '100%', margin: 0 }}>
          <figcaption style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
            Unit price vs rating <span style={{ color: 'var(--faint)', fontWeight: 500 }}>· log–log, fit + P10–P90 band</span>
          </figcaption>
          <Chart kind="price" derived={d} spec={spec} model={model} themeVars={themeVars} onPreview={onPreview} />
        </figure>
        <figure style={{ flex: 1, minWidth: '100%', margin: 0 }}>
          <figcaption style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
            $/kVA vs rating <span style={{ color: 'var(--faint)', fontWeight: 500 }}>· economies of scale</span>
          </figcaption>
          <Chart kind="scale" derived={d} spec={spec} model={model} themeVars={themeVars} onPreview={onPreview} />
        </figure>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        {legend.map((g, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color, display: 'inline-block' }} />
            {g.label}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>● OEM quote &nbsp; ◆ public bid &nbsp; ◎ your spec</span>
      </div>
    </section>
  )
}
