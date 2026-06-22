// Log-log scatter with fitted power-law curve + P10–P90 band + "your spec"
// marker + per-point hover tooltips. The buildChart() SVG logic is ported
// NEARLY VERBATIM from the prototype (it was already React.createElement);
// class/state references became explicit args, and hover is component-local.

import React, { useState } from 'react'
import { REGION_LABELS } from '../lib/constants.js'
import { fmtMoney, fmtKva, cap, colorFor } from '../lib/format.js'

function buildChart(kind, d, S, model, pal, hover, setHover) {
  const h = (t, p, ...c) => React.createElement(t, p, ...c)
  const m = model
  const accent = pal['--accent'], faint = pal['--faint'], line = pal['--line'],
    muted = pal['--muted'], text = pal['--text'], panel = pal['--panel']
  const W = 800, H = 440, mg = { l: 66, r: 22, t: 22, b: 50 }
  const x0 = mg.l, x1 = W - mg.r, yb = H - mg.b, yt = mg.t, lx = Math.log10
  const vis = d.visible.filter((r) => r.kva > 0 && (kind === 'price' ? r.ppu > 0 : r.dpk > 0))
  if (!vis.length || !m)
    return h('div', { style: { padding: '40px', textAlign: 'center', color: faint, fontSize: '13px' } }, 'No data for this source filter.')
  const kvas = vis.map((r) => r.kva).concat([S.kva])
  const kmin = Math.max(40, Math.min(...kvas) * 0.8), kmax = Math.max(...kvas) * 1.25
  const sx = (v) => x0 + ((lx(v) - lx(kmin)) / (lx(kmax) - lx(kmin))) * (x1 - x0)
  let sy, vals, fitY, yticks, fmtY
  if (kind === 'price') {
    const ys = vis.map((r) => r.ppu)
    let ymin = Math.min(...ys) * 0.7, ymax = Math.max(...ys) * 1.5
    if (d.est) { ymin = Math.min(ymin, d.est.p10 * 0.85); ymax = Math.max(ymax, d.est.p90 * 1.15) }
    sy = (v) => yb - ((lx(v) - lx(ymin)) / (lx(ymax) - lx(ymin))) * (yb - yt)
    yticks = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000].filter((v) => v >= ymin && v <= ymax)
    fmtY = (v) => fmtMoney(v); vals = (r) => r.ppu; fitY = (f, kv) => f.a * Math.pow(kv, f.b)
  } else {
    const ys = vis.map((r) => r.dpk)
    const ymax = Math.max(100, Math.max(...ys) * 1.12, d.est ? d.est.dpk90 * 1.1 : 0)
    sy = (v) => yb - (v / ymax) * (yb - yt)
    yticks = []; const step = ymax > 140 ? 50 : 25
    for (let t = 0; t <= ymax; t += step) yticks.push(t)
    fmtY = (v) => '$' + v; vals = (r) => r.dpk; fitY = (f, kv) => f.a * Math.pow(kv, f.b - 1)
  }
  const xticks = [50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 10000, 20000, 30000].filter((v) => v >= kmin && v <= kmax)
  const K = []
  K.push(h('defs', { key: 'defs' }, h('filter', { id: 'ttsh_' + kind, x: '-30%', y: '-30%', width: '160%', height: '180%' }, h('feDropShadow', { dx: 0, dy: 2, stdDeviation: 4, floodColor: 'rgba(36,49,66,0.22)' }))))
  yticks.forEach((v) => { const y = sy(v); K.push(h('line', { key: 'yg' + v, x1: x0, x2: x1, y1: y, y2: y, stroke: line })); K.push(h('text', { key: 'yl' + v, x: x0 - 7, y: y + 3.5, textAnchor: 'end', fontSize: 10, fill: faint }, fmtY(v))) })
  xticks.forEach((v) => { const x = sx(v); K.push(h('line', { key: 'xg' + v, x1: x, x2: x, y1: yb, y2: yt, stroke: line, opacity: 0.5 })); K.push(h('text', { key: 'xl' + v, x, y: yb + 15, textAnchor: 'middle', fontSize: 10, fill: faint }, fmtKva(v))) })
  K.push(h('text', { key: 'xax', x: (x0 + x1) / 2, y: H - 5, textAnchor: 'middle', fontSize: 10, fill: muted, fontWeight: 600 }, 'Rating (kVA · log scale)'))
  // fit + band, piecewise aware
  let segs = [[]], prev = null
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const kv = Math.pow(10, lx(kmin) + t * (lx(kmax) - lx(kmin)))
    const reg = S.source === 'both' ? (kv < 2500 ? 'bid' : 'quote') : S.source
    const f = reg === 'bid' ? m.bid : m.quote
    if (!f) { prev = null; continue }
    if (prev !== null && reg !== prev) segs.push([])
    prev = reg
    const cen = fitY(f, kv)
    segs[segs.length - 1].push({ x: sx(kv), c: sy(cen), lo: sy(cen * f.lo), hi: sy(cen * f.hi) })
  }
  segs.forEach((seg, si) => {
    if (seg.length < 2) return
    const pts = seg.map((p) => p.x + ',' + p.hi).concat([...seg].reverse().map((p) => p.x + ',' + p.lo)).join(' ')
    K.push(h('polygon', { key: 'bd' + si, points: pts, fill: accent, opacity: 0.1 }))
    K.push(h('path', { key: 'ft' + si, d: 'M' + seg.map((p) => p.x + ' ' + p.c).join(' L'), fill: 'none', stroke: accent, strokeWidth: 2, opacity: 0.9 }))
  })
  // points
  const hovIdx = hover && hover.kind === kind ? hover.i : -1
  const onEnter = (i) => () => setHover({ kind, i })
  const onLeave = () => setHover(null)
  vis.forEach((r, i) => {
    const cx = sx(r.kva), cy = sy(vals(r)), col = colorFor(r, S.colorBy), hov = i === hovIdx
    const evt = { onMouseEnter: onEnter(i), onMouseLeave: onLeave, style: { cursor: 'pointer' } }
    if (r.src === 'bid') {
      const s = hov ? 6 : 4.3
      K.push(h('path', { key: 'pt' + i, d: `M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z`, fill: col, opacity: hov ? 1 : 0.82, stroke: '#fff', strokeWidth: hov ? 1.4 : 0.7, ...evt }))
    } else {
      K.push(h('circle', { key: 'pt' + i, cx, cy, r: hov ? 6 : 4.4, fill: col, opacity: hov ? 1 : 0.82, stroke: '#fff', strokeWidth: hov ? 1.4 : 0.7, ...evt }))
    }
  })
  // target marker
  if (d.est) {
    const cx = sx(S.kva)
    const hiV = kind === 'price' ? d.est.p90 : d.est.dpk90, loV = kind === 'price' ? d.est.p10 : d.est.dpk10, mid = kind === 'price' ? d.est.p50 : d.est.dpk50
    const tm = []
    tm.push(h('line', { key: 'tx', x1: cx, x2: cx, y1: yb, y2: yt, stroke: text, strokeDasharray: '3 3', opacity: 0.4 }))
    tm.push(h('line', { key: 'tb', x1: cx, x2: cx, y1: sy(loV), y2: sy(hiV), stroke: accent, strokeWidth: 7, opacity: 0.24, strokeLinecap: 'round' }))
    tm.push(h('circle', { key: 'td', cx, cy: sy(mid), r: 5.5, fill: '#fff', stroke: accent, strokeWidth: 2.5 }))
    tm.push(h('text', { key: 'tt', x: cx, y: yt + 11, textAnchor: 'middle', fontSize: 11, fill: accent, fontWeight: 700 }, 'your spec'))
    K.push(h('g', { key: 'tm', style: { pointerEvents: 'none' } }, tm))
  }
  if (hovIdx >= 0) {
    const r = vis[hovIdx], cx = sx(r.kva), cy = sy(vals(r)), pc = colorFor(r, S.colorBy)
    const lines = [
      { t: r.oem_id + (r.rev > 0 ? '  · r' + r.rev : ''), w: 700, c: text, s: 13 },
      { t: (r.src === 'bid' ? 'Public bid' : 'OEM quote') + (r.region ? ' · ' + (REGION_LABELS[r.region] || r.region) : ''), w: 600, c: pc, s: 11.5 },
      { t: fmtKva(r.kva) + ' kVA · ' + cap(r.winding || '—') + ' · ' + (r.incoterm_basis || 'n/a'), w: 500, c: muted, s: 11.5 },
      { t: (r.hv != null ? r.hv : '—') + ' → ' + (r.lv != null ? r.lv : '—') + ' kV', w: 500, c: muted, s: 11.5 },
      { t: fmtMoney(r.ppu) + ' / unit     $' + Math.round(r.dpk) + '/kVA', w: 700, c: text, s: 12.5 },
      { t: 'extraction conf ' + Math.round((r.dpk_conf || 0) * 100) + '%', w: 500, c: faint, s: 10.5 },
    ]
    const pad = 11, lh = 17, boxW = Math.max(...lines.map((l) => l.t.length * l.s * 0.55)) + pad * 2, boxH = lines.length * lh + pad * 2 - 4
    let bx = cx + 14, by = cy - boxH - 14
    if (bx + boxW > W - 4) bx = cx - boxW - 14
    if (bx < 4) bx = 4
    if (by < 4) by = cy + 16
    const tt = []
    tt.push(h('rect', { key: 'r', x: bx, y: by, width: boxW, height: boxH, rx: 9, fill: panel, stroke: line, strokeWidth: 1 }))
    lines.forEach((l, li) => tt.push(h('text', { key: 'l' + li, x: bx + pad, y: by + pad + 12 + li * lh, fontSize: l.s, fontWeight: l.w, fill: l.c }, l.t)))
    K.push(h('g', { key: 'tooltip', style: { pointerEvents: 'none' }, filter: 'url(#ttsh_' + kind + ')' }, tt))
  }
  const lab = kind === 'price'
    ? `Unit price vs rating, log-log scatter of ${vis.length} historical quotes with fitted curve and P10 to P90 band. Your spec ${fmtKva(S.kva)} kVA estimated ${d.est ? fmtMoney(d.est.p10) : ''} to ${d.est ? fmtMoney(d.est.p90) : ''}.`
    : `Dollars per kVA vs rating; bids fall steeply with size while quotes stay flatter and more scattered.`
  return h('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': lab, style: { width: '100%', height: 'auto', display: 'block', fontFamily: 'Geist, sans-serif' } }, K)
}

export default function Chart({ kind, derived, spec, model, themeVars }) {
  const [hover, setHover] = useState(null)
  return buildChart(kind, derived, spec, model, themeVars, hover, setHover)
}
