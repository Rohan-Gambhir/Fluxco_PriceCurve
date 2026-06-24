// "The real quotes behind this estimate" — the credibility anchor. The historical
// quotes nearest the spec by rating, each with source badge, OEM (+ revision),
// source document, winding, incoterm, unit price and $/kVA. Columns are sortable
// and the list can expand from the nearest 8 to all comparables in the current
// source. Low extraction-confidence rows are muted; off-majority incoterm flagged.

import { useState } from 'react'
import { SRC_COLORS, WIND_COLORS } from '../lib/constants.js'
import { fmtMoney, fmtKva, cap } from '../lib/format.js'
import { cardStyle } from '../lib/ui.js'

const GRID = '1fr 1.8fr .5fr .55fr .85fr .65fr .9fr .55fr'

const srcName = (r) => (r.filename || '').split('#')[0] || '—'

const COLUMNS = [
  { key: 'oem', label: 'OEM', cmp: (a, b) => (a.oem_id || '').localeCompare(b.oem_id || '') },
  { key: 'doc', label: 'Document', cmp: (a, b) => srcName(a).localeCompare(srcName(b)) },
  { key: 'src', label: 'Src', cmp: (a, b) => (a.src || '').localeCompare(b.src || '') },
  { key: 'kva', label: 'Rating', cmp: (a, b) => a.kva - b.kva },
  { key: 'winding', label: 'Winding', cmp: (a, b) => (a.winding || '').localeCompare(b.winding || '') },
  { key: 'incoterm', label: 'Incoterm', cmp: (a, b) => (a.incoterm_basis || '').localeCompare(b.incoterm_basis || '') },
  { key: 'ppu', label: 'Unit price', align: 'right', cmp: (a, b) => (a.ppu || 0) - (b.ppu || 0) },
  { key: 'dpk', label: '$/kVA', align: 'right', cmp: (a, b) => (a.dpk || 0) - (b.dpk || 0) },
]

export default function Comparables({ derived, onPreview }) {
  const d = derived
  const specKva = d.S.kva
  const [sortKey, setSortKey] = useState('dist') // 'dist' = nearest by rating (default)
  const [sortDir, setSortDir] = useState('asc')
  const [showAll, setShowAll] = useState(false)

  const distOf = (r) => Math.abs(Math.log10(r.kva / specKva))
  const distSorted = [...d.visible].sort((a, b) => distOf(a) - distOf(b))
  const closestId = distSorted[0]?.id
  const pool = showAll ? distSorted : distSorted.slice(0, 8)

  const col = COLUMNS.find((c) => c.key === sortKey)
  const rows = [...pool]
  if (col) rows.sort(col.cmp) // sortKey 'dist' => keep nearest-first order
  if (sortDir === 'desc') rows.reverse()

  // The 'closest' row highlight only makes sense when the list is in distance order.
  const highlightClosest = sortKey === 'dist'

  // Majority incoterm basis among the DISPLAYED comparables (to flag outliers).
  const majBasis = (() => {
    const c = {}
    pool.forEach((r) => { if (r.incoterm_basis) c[r.incoterm_basis] = (c[r.incoterm_basis] || 0) + 1 })
    let mx = null, mc = 0
    for (const k in c) if (c[k] > mc) { mc = c[k]; mx = k }
    return mx
  })()

  const onSort = (key) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <section style={{ ...cardStyle, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>The real quotes behind this estimate</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
            {sortKey === 'dist' ? 'nearest by rating · ' : ''}
            {rows.length} of {d.visible.length} in current source
          </span>
          {sortKey !== 'dist' && (
            <button
              onClick={() => { setSortKey('dist'); setSortDir('asc') }}
              title="Reset to nearest by rating"
              style={{ border: '1px solid var(--line)', background: 'var(--panel2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: 'var(--accent)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}
            >
              ↺ Nearest
            </button>
          )}
          {d.visible.length > 8 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              style={{ border: '1px solid var(--line)', background: 'var(--panel2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: 'var(--accent)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}
            >
              {showAll ? 'Nearest 8' : `Show all ${d.visible.length}`}
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 14px' }}>
        Click a column to sort; click a quote row to open its source PDF. The Document column matches the chart
        tooltip, so you can tie a row to a point above. Low-trust values are muted.
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: GRID, gap: 0, fontSize: 11, fontWeight: 700,
          letterSpacing: '.04em', textTransform: 'uppercase',
          padding: '0 2px 8px', borderBottom: '1px solid var(--line)',
        }}
      >
        {COLUMNS.map((c) => {
          const active = sortKey === c.key
          return (
            <span
              key={c.key}
              onClick={() => onSort(c.key)}
              title={`Sort by ${c.label}`}
              style={{ cursor: 'pointer', userSelect: 'none', textAlign: c.align || 'left', color: active ? 'var(--accent)' : 'var(--faint)' }}
            >
              {c.label}
              {active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
            </span>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '16px 2px' }}>
          No comparables in the current source / filters.
        </div>
      )}

      {rows.map((r) => {
        const conf = Math.round((r.dpk_conf || 0) * 100)
        const dimmed = conf < 70
        const isBid = r.src === 'bid'
        const isClosest = r.id === closestId
        const basisOutlier = majBasis && r.incoterm_basis && r.incoterm_basis !== majBasis
        // Only quote rows have a source PDF in the bucket; bids are xlsx bid sheets.
        const canPreview = !!onPreview && r.src === 'quote'
        const sourceName = srcName(r)
        return (
          <div
            key={r.id}
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
              background: isClosest && highlightClosest ? 'var(--accentSoft)' : 'transparent',
              borderRadius: isClosest && highlightClosest ? 8 : 0, cursor: canPreview ? 'pointer' : 'default',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '.02em' }}>{r.oem_id}</span>
              {r.rev > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 5, padding: '1px 5px' }}>
                  r{r.rev}
                </span>
              )}
              {isClosest && (
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
