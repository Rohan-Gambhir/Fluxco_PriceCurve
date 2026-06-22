// "Why this number" — the trust panel. Reason rows (good = green dot, warn =
// copper dot) covering comparable count, average extraction confidence,
// incoterm-basis consistency (the mixed-basis honesty check), and band width.

import { fmtKva } from '../lib/format.js'
import { cardStyle, overline } from '../lib/ui.js'

export default function ConfidencePanel({ spec, derived }) {
  const d = derived
  const e = d.est
  if (!e) return null
  const basesNear = d.basesNear

  const reasons = [
    {
      text:
        d.near.length + ' comparable ' + (spec.source === 'both' ? 'quotes/bids' : spec.source + 's') +
        ' within ±50% of ' + fmtKva(spec.kva) + ' kVA' + (d.near.length < 3 ? ' — too thin to be precise' : ''),
      good: d.near.length >= 4,
    },
    {
      text: 'Average extraction confidence ' + Math.round(d.avgConf * 100) + '% on $/kVA for nearby rows',
      good: d.avgConf >= 0.8,
    },
    {
      text:
        basesNear.length > 1
          ? basesNear.length + ' incoterm bases mixed (' + basesNear.join(' / ') + ') — prices not apples-to-apples'
          : 'Consistent incoterm basis' + (basesNear[0] ? ' (' + basesNear[0] + ')' : ''),
      good: basesNear.length <= 1,
    },
    {
      text:
        'Band spans ' + Math.round((e.hi / e.lo - 1) * 100) + '% (P10→P90), fit from ' + d.f.n +
        ' points — wide by design on small data',
      good: true,
    },
  ]

  return (
    <section style={{ ...cardStyle, padding: '20px 22px' }}>
      <div style={{ ...overline, marginBottom: 13 }}>Why this number — how much data stands behind it</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {reasons.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
            <span
              style={{
                flex: 'none', width: 7, height: 7, borderRadius: '50%', marginTop: 6,
                background: r.good ? 'var(--good)' : 'var(--warn)',
              }}
            />
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
