// The central output. Big P50 unit-price + $/kVA bands, the P10–P90 band rail
// with a dot-strip of real comparables (navy circles = quotes, copper diamonds
// = bids), the base-curve → add-on → final chip breakdown, a confidence chip,
// and a thin-data warning. Honest ranges, never a false-precision point price.

import { ADDONS, SRC_COLORS } from '../lib/constants.js'
import { fmtMoney, fmtKva } from '../lib/format.js'
import { regimeLabel } from '../lib/pricing.js'
import { cardStyle, overline } from '../lib/ui.js'

export default function EstimateCard({ spec, derived }) {
  const e = derived.est
  const d = derived
  if (!e) return null

  const midLeft = (((1 - e.lo) / (e.hi - e.lo)) * 100).toFixed(0) + '%'

  // Band dot-strip: real comparables within ±50% size, placed on the P10→P90 axis.
  const span = e.p90 - e.p10
  const nearP = d.near.filter((r) => r.ppu > 0)
  const dots = nearP.map((r, i) => {
    const raw = span > 0 ? ((r.ppu - e.p10) / span) * 100 : 50
    const pos = Math.max(1.5, Math.min(98.5, raw))
    const isBid = r.src === 'bid'
    const col = SRC_COLORS[r.src] || '#999'
    const title =
      r.oem_id + (r.rev > 0 ? ' r' + r.rev : '') + ' · ' + fmtKva(r.kva) + ' kVA · ' +
      fmtMoney(r.ppu) + ' ' + (isBid ? '(bid)' : '(quote)')
    return (
      <span
        key={i}
        title={title}
        style={{
          position: 'absolute', top: '50%', left: pos.toFixed(1) + '%',
          width: isBid ? 8 : 9, height: isBid ? 8 : 9,
          transform: isBid ? 'translate(-50%,-50%) rotate(45deg)' : 'translate(-50%,-50%)',
          background: col, border: '1.5px solid var(--panel)',
          borderRadius: isBid ? 2 : '50%', boxShadow: '0 1px 2px rgba(36,49,66,.28)', cursor: 'default',
        }}
      />
    )
  })

  const below = nearP.filter((r) => r.ppu < e.p50).length
  const above = nearP.filter((r) => r.ppu >= e.p50).length
  const dotsCaption = nearP.length
    ? `${nearP.length} real ${spec.source === 'both' ? 'quotes/bids' : spec.source + 's'} within ±50% size · ${below} below midpoint · ${above} above`
    : 'No priced comparables within ±50% size — showing the model band only'

  // Breakdown chips: base curve → active add-ons → final estimate.
  const chips = [{ label: 'Base curve', val: fmtMoney(e.base), final: false }]
  ADDONS.forEach((a) => {
    if (spec.addons[a.id]) chips.push({ label: a.short, val: '+' + Math.round((a.factor - 1) * 100) + '%', final: false })
  })
  chips.push({ label: 'Estimate', val: fmtMoney(e.adj), final: true })

  const lvl = d.level
  const lvlColor = lvl === 'Good' ? 'var(--good)' : lvl === 'Moderate' ? 'var(--warn)' : 'var(--bad)'

  return (
    <section
      aria-label="Price estimate"
      style={{ ...cardStyle, padding: '24px 26px' }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={overline}>Estimated unit price</div>
        <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 48, fontWeight: 300, letterSpacing: '-.01em', lineHeight: 1, marginTop: 7 }}>
          {fmtMoney(e.p50)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>
          Midpoint of the P10–P90 band · {regimeLabel(spec.source, spec.kva)}
        </div>

        {/* secondary ranges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Unit-price range · P10–P90
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>
              {fmtMoney(e.p10)} – {fmtMoney(e.p90)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              $/kVA · mid · P10–P90
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>
              ${Math.round(e.dpk50)}{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· ${Math.round(e.dpk10)}–${Math.round(e.dpk90)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* band rail */}
      <div style={{ position: 'relative', height: 18, borderRadius: 9, background: 'var(--accentSoft)', margin: '10px 0 6px' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 3, transform: 'translateY(-50%)', background: 'var(--accent)', opacity: 0.22, borderRadius: 2 }} />
        {dots}
        <div style={{ position: 'absolute', top: -4, bottom: -4, width: 3, borderRadius: 2, background: 'var(--accent)', left: midLeft, boxShadow: '0 0 0 4px var(--panel)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Geist'", fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
        <span>P10 · {fmtMoney(e.p10)}</span>
        <span style={{ color: 'var(--accent)' }}>P50 · {fmtMoney(e.p50)}</span>
        <span>P90 · {fmtMoney(e.p90)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 11.5, color: 'var(--faint)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e488f', border: '1.5px solid var(--panel)', boxShadow: '0 1px 2px rgba(36,49,66,.28)', display: 'inline-block', flex: 'none' }} />
          OEM quote
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, transform: 'rotate(45deg)', background: '#9b4e27', border: '1.5px solid var(--panel)', boxShadow: '0 1px 2px rgba(36,49,66,.28)', display: 'inline-block', flex: 'none' }} />
          Public bid
        </span>
        <span style={{ color: 'var(--muted)' }}>{dotsCaption}</span>
      </div>

      {/* breakdown chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
        {chips.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'baseline', gap: 5, fontFamily: "'Geist'",
                fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 9,
                background: c.final ? 'var(--accent)' : 'var(--panel2)',
                color: c.final ? '#fff' : 'var(--text)',
                border: c.final ? 'none' : '1px solid var(--line)',
              }}
            >
              <span style={{ opacity: 0.62, fontWeight: 500 }}>{c.label}</span> {c.val}
            </span>
            {i < chips.length - 1 && <span style={{ color: 'var(--faint)', fontSize: 13, alignSelf: 'center' }}>→</span>}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 16 }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700,
            color: lvlColor, background: 'transparent', border: '1px solid ' + lvlColor, borderRadius: 8, padding: '4px 11px',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {lvl} confidence
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{d.near.length} comparables within ±50% size</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>·</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Band width ×{(e.hi / e.lo).toFixed(1)} (P10→P90)</span>
      </div>

      {d.near.length < 3 && (
        <div style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(189,40,40,.07)', border: '1px solid rgba(189,40,40,.3)', borderRadius: 10, fontSize: 12.5, color: 'var(--bad)', lineHeight: 1.45 }}>
          ⚠ Thin data near this spec — fewer than 3 close comparables. Treat this band as a rough indication, not a quote.
        </div>
      )}
    </section>
  )
}
