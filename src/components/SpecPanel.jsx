// Transformer spec card: kVA number + log-scale slider + preset chips,
// HV / LV / Units inputs, and a plain-language spec summary.

import { PRESETS } from '../lib/constants.js'
import { fmtKva } from '../lib/format.js'
import { cardStyle, overline } from '../lib/ui.js'

// Slider maps log-space between 750 and 33,000 kVA onto 0..1000.
const SLIDER_LO = Math.log10(750)
const SLIDER_HI = Math.log10(33000)

export default function SpecPanel({ spec, persist, setKva }) {
  const sliderVal = Math.round(
    Math.max(0, Math.min(1, (Math.log10(Math.max(50, spec.kva)) - SLIDER_LO) / (SLIDER_HI - SLIDER_LO))) * 1000
  )

  const inputStyle = {
    width: '100%', fontSize: 14, fontFamily: "'Geist'", border: '1px solid var(--line)',
    borderRadius: 9, background: 'var(--panel2)', padding: '8px 10px', color: 'var(--text)', outline: 'none',
  }

  return (
    <section style={{ ...cardStyle, padding: 20 }}>
      <div style={{ ...overline, marginBottom: 16 }}>Transformer spec</div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <label htmlFor="kvaNum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          Base rating (ONAN)
        </label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <input
            id="kvaNum"
            type="number"
            value={spec.kva}
            onInput={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) setKva(v)
            }}
            style={{
              width: 84, textAlign: 'right', fontSize: 20, fontWeight: 700, border: 'none',
              borderBottom: '2px solid var(--line)', background: 'transparent', color: 'var(--text)',
              padding: '1px 2px', outline: 'none',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>kVA</span>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="1000"
        value={sliderVal}
        onInput={(e) => {
          const t = +e.target.value / 1000
          setKva(Math.pow(10, SLIDER_LO + t * (SLIDER_HI - SLIDER_LO)))
        }}
        aria-label="Base rating in kVA"
        style={{ width: '100%', margin: '8px 0 12px' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PRESETS.map((v) => {
          const on = spec.kva === v
          return (
            <button
              key={v}
              onClick={() => setKva(v)}
              style={{
                border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                padding: '5px 9px', borderRadius: 8,
                background: on ? 'var(--accentSoft)' : 'transparent',
                color: on ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {fmtKva(v)}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="hvNum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
            HV (kV)
          </label>
          <input
            id="hvNum" type="number" step="0.01" value={spec.hv}
            onInput={(e) => { const v = parseFloat(e.target.value); persist({ hv: isNaN(v) ? spec.hv : v }) }}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="lvNum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
            LV (kV)
          </label>
          <input
            id="lvNum" type="number" step="0.001" value={spec.lv}
            onInput={(e) => { const v = parseFloat(e.target.value); persist({ lv: isNaN(v) ? spec.lv : v }) }}
            style={inputStyle}
          />
        </div>
        <div style={{ width: 84 }}>
          <label htmlFor="unNum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
            Units
          </label>
          <input
            id="unNum" type="number" value={spec.units}
            onInput={(e) => { const v = parseInt(e.target.value); persist({ units: isNaN(v) ? 1 : Math.max(1, v) }) }}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 12, lineHeight: 1.4 }}>
        {fmtKva(spec.kva)} kVA · {spec.hv}→{spec.lv} kV · {spec.units > 1 ? spec.units + ' units' : '1 unit'}.
        Voltages &amp; quantity contextualise the comparables; the base curve is driven by rating.
      </div>
    </section>
  )
}
