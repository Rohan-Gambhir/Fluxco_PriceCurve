// Delivery basis · incoterm filter. One chip per incoterm present in the
// current source set, each with a color swatch + live count + shown/hidden.
// Toggling any off isolates the comparison and switches color-by to Incoterm.
// Does NOT refit the curve — filters display / comparables / confidence only.

import { INCO_ORDER, INCO_COLORS } from '../lib/constants.js'
import { cardStyle, overline } from '../lib/ui.js'

export default function IncotermFilter({ spec, persist, derived }) {
  const incoOffArr = spec.incoOff || []
  const anyOff = incoOffArr.length > 0

  // Count by basis over the current source set (pre-incoterm-filter).
  const counts = {}
  derived.srcSet.forEach((r) => {
    const k = r.incoterm_basis || 'n/a'
    counts[k] = (counts[k] || 0) + 1
  })
  const keys = INCO_ORDER.filter((k) => counts[k]).concat(
    Object.keys(counts).filter((k) => !INCO_ORDER.includes(k))
  )

  return (
    <section style={{ ...cardStyle, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={overline}>Delivery basis · incoterm</div>
        {anyOff && (
          <button
            onClick={() => persist({ incoOff: [] })}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 600, color: 'var(--accent)', padding: 0,
            }}
          >
            show all
          </button>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 14, lineHeight: 1.4 }}>
        Bases aren't apples-to-apples — EXW excludes freight + duty, DDP includes it. All shown &amp;
        colour-coded; toggle any off to isolate.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {keys.map((k) => {
          const on = !incoOffArr.includes(k)
          const col = INCO_COLORS[k] || '#b6bcc4'
          return (
            <button
              key={k}
              aria-pressed={on}
              onClick={() => {
                const next = on ? [...incoOffArr, k] : incoOffArr.filter((x) => x !== k)
                persist({ incoOff: next, colorBy: 'incoterm' })
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
                background: on ? 'var(--panel2)' : 'transparent',
                border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px',
                transition: 'all .15s', opacity: on ? 1 : 0.5,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span
                  style={{
                    width: 12, height: 12, borderRadius: 3, flex: 'none',
                    background: on ? col : 'transparent', border: '1.5px solid ' + col,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{k === 'n/a' ? 'Unspecified' : k}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{counts[k]}</span>
                <span
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
                    color: on ? 'var(--good)' : 'var(--faint)',
                  }}
                >
                  {on ? 'shown' : 'hidden'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
