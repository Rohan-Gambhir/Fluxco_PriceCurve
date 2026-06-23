// "The real quotes behind this estimate" — the credibility anchor. The nearest
// historical quotes by rating, each with source badge, OEM (+ revision), winding,
// incoterm basis, unit price and $/kVA. Low extraction-confidence rows are muted;
// incoterm bases that differ from the majority are flagged copper.

import { SRC_COLORS, WIND_COLORS } from '../lib/constants.js'
import { fmtMoney, fmtKva, cap } from '../lib/format.js'
import { cardStyle } from '../lib/ui.js'

const GRID = '1fr 1.8fr .5fr .55fr .85fr .65fr .9fr .55fr'

export default function Comparables({ derived, onPreview }) {
  const d = derived

  // Majority incoterm basis among the comparables (to flag outliers).
  const majBasis = (() => {
    const c = {}
    d.comps.forEach((r) => { if (r.incoterm_basis) c[r.incoterm_basis] = (c[r.incoterm_basis] || 0) + 1 })
    let mx = null, mc = 0
    for (const k in c) if (c[k] > mc) { mc = c[k]; mx = k }
    return mx
  })()

  return (
    <section style={{ ...cardStyle, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>The real quotes behind this estimate</div>
        <div style={{ fontSize: 11.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
          nearest by rating · {d.visible.length} in current source
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 14px' }}>
        Extraction confidence shown per row — low-trust values are muted. The Document column is the source file
        name (matches the chart tooltip, so you can tie a row to a point); click a quote row to open it.
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: GRID, gap: 0, fontSize: 11, fontWeight: 700,
          letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--faint)',
          padding: '0 2px 8px', borderBottom: '1px solid var(--line)',
        }}
      >
        <span>OEM</span><span>Document</span><span>Src</span><span>Rating</span><span>Winding</span><span>Incoterm</span>
        <span style={{ textAlign: 'right' }}>Unit price</span><span style={{ textAlign: 'right' }}>$/kVA</span>
      </div>

      {d.comps.map((r, i) => {
        const conf = Math.round((r.dpk_conf || 0) * 100)
        const dimmed = conf < 70
        const isBid = r.src === 'bid'
        const basisOutlier = majBasis && r.incoterm_basis && r.incoterm_basis !== majBasis
        // Only quote rows have a source PDF in the bucket; bids are xlsx bid sheets.
        const canPreview = !!onPreview && r.src === 'quote'
        const sourceName = (r.filename || '').split('#')[0] || '—'
        return (
          <div
            key={r.id || i}
            role={canPreview ? 'button' : undefined}
            tabIndex={canPreview ? 0 : undefined}
            title={canPreview ? 'View source document' : undefined}
            onClick={canPreview ? () => onPreview(r) : undefined}
            onKeyDown={
              canPreview
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onPreview(r)
                    }
                  }
                : undefined
            }
            style={{
              display: 'grid', gridTemplateColumns: GRID, gap: 0, alignItems: 'center',
              padding: '10px 2px', borderBottom: '1px solid var(--line)',
              background: i === 0 ? 'var(--accentSoft)' : 'transparent',
              borderRadius: i === 0 ? 8 : 0, cursor: canPreview ? 'pointer' : 'default',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '.02em' }}>{r.oem_id}</span>
              {r.rev > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 5, padding: '1px 5px' }}>
                  r{r.rev}
                </span>
              )}
              {i === 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accentSoft)', borderRadius: 5, padding: '1px 6px' }}>
                  closest
                </span>
              )}
            </span>
            <span
              title={canPreview ? 'Open ' + sourceName : sourceName}
              style={{
                fontFamily: "'Geist'", fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', color: canPreview ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {sourceName}
            </span>
            <span
              style={{
                fontSize: 11, fontWeight: 700, color: SRC_COLORS[r.src],
                background: isBid ? 'rgba(155,78,39,.10)' : 'rgba(30,72,143,.09)',
                borderRadius: 6, padding: '2px 7px', justifySelf: 'start',
              }}
            >
              {isBid ? 'bid' : 'quote'}
            </span>
            <span style={{ fontFamily: "'Geist'", fontSize: 13, fontWeight: 500 }}>{fmtKva(r.kva)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: WIND_COLORS[r.winding] || '#b6bcc4', display: 'inline-block', flex: 'none' }} />
              {cap(r.winding)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: basisOutlier ? 'var(--warn)' : 'var(--muted)' }}>
              {r.incoterm_basis || 'n/a'}
            </span>
            <span style={{ fontFamily: "'Geist'", fontSize: 13, fontWeight: 600, textAlign: 'right', opacity: dimmed ? 0.5 : 1 }}>
              {fmtMoney(r.ppu)}
            </span>
            <span style={{ fontFamily: "'Geist'", fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--accent)' }}>
              ${Math.round(r.dpk)}
            </span>
          </div>
        )
      })}
    </section>
  )
}
