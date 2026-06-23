// Price drivers card: clickable multiplicative add-ons. Each row leads with its
// exact price delta (the +% multiplier) as a large, bold headline tied to the
// bar, with the On/Add state beside it and the supporting evidence note + sample
// count n below (n flagged red when ≤ 1 — thin evidence, per the brief).

import { ADDONS } from '../lib/constants.js'
import { pctLabel } from '../lib/format.js'
import { cardStyle, overline } from '../lib/ui.js'

export default function DriversPanel({ spec, persist }) {
  return (
    <section style={{ ...cardStyle, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={overline}>Price drivers</div>
        <div style={{ fontSize: 11, color: 'var(--faint)' }}>click to apply</div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 14, lineHeight: 1.4 }}>
        Each adds the price delta shown to the estimate. Directional multipliers — several rest on
        1–3 observations. Treat as evidence, not truth.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ADDONS.map((a) => {
          const on = !!spec.addons[a.id]
          const pctRaw = (a.factor - 1) * 100
          const thin = a.n <= 1
          return (
            <button
              key={a.id}
              onClick={() => persist({ addons: { ...spec.addons, [a.id]: !on } })}
              aria-pressed={on}
              aria-label={`${a.label}: ${pctLabel(a.factor)} price delta`}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', color: 'var(--text)',
                background: on ? 'var(--accentSoft)' : 'var(--panel2)',
                border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                borderRadius: 11, padding: '12px 13px', transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'left', lineHeight: 1.2 }}>{a.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7,
                      background: on ? 'var(--accent)' : 'var(--panel2)',
                      color: on ? '#fff' : 'var(--muted)',
                      border: on ? 'none' : '1px solid var(--line)',
                    }}
                  >
                    {on ? 'On' : 'Add'}
                  </span>
                  {/* The headline price delta — the obvious number for each driver. */}
                  <span
                    style={{
                      fontFamily: "'Geist'", fontSize: 19, fontWeight: 800, letterSpacing: '-.01em',
                      lineHeight: 1, color: on ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {pctLabel(a.factor)}
                  </span>
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--line)', margin: '10px 0 7px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%', width: (Math.min(pctRaw, 50) / 50) * 100 + '%',
                    background: on ? 'var(--accent)' : 'var(--faint)', borderRadius: 4, transition: 'width .2s',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: 'var(--faint)', textAlign: 'left' }}>{a.note}</span>
                <span
                  style={{
                    flex: 'none', fontSize: 11, fontWeight: 700,
                    color: thin ? 'var(--bad)' : 'var(--muted)',
                    background: thin ? 'rgba(189,40,40,.10)' : 'transparent',
                    padding: thin ? '1px 7px' : '1px 0', borderRadius: 6,
                  }}
                >
                  n = {a.n}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
