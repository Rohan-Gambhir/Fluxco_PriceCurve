// Source-document preview modal. Opened by clicking a chart point; fetches a
// short-lived signed URL via the gated /api/doc route and embeds the PDF.
// Non-PDF sources (e.g. bid spreadsheets) and errors degrade gracefully.

import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { fetchDocUrl } from '../api/docs.js'
import { fmtKva } from '../lib/format.js'

export default function DocPreview({ row, onClose }) {
  const { authFetch } = useAuth()
  const [state, setState] = useState({ loading: true, error: null, doc: null })

  // Close on Escape.
  useEffect(() => {
    if (!row) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [row, onClose])

  // Resolve the signed URL whenever the selected row changes.
  useEffect(() => {
    if (!row) return undefined
    let cancelled = false
    setState({ loading: true, error: null, doc: null })
    ;(async () => {
      try {
        const doc = await fetchDocUrl(authFetch, {
          project: row.project_id,
          oem: row.oem_id,
          file: row.filename,
          rev: row.rev,
        })
        if (!cancelled) setState({ loading: false, error: null, doc })
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: String((e && e.message) || e), doc: null })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [row, authFetch])

  if (!row) return null
  const { loading, error, doc } = state
  const sourceName = (row.filename || '').split('#')[0] || '—'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={'Source document for ' + (row.oem_id || 'quote')}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 900, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        background: 'rgba(11,17,25,.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(960px, 94vw)', height: 'min(88vh, 1000px)', display: 'flex', flexDirection: 'column',
          background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14,
          boxShadow: '0 1px 2px rgba(36,49,66,.04),0 24px 60px rgba(36,49,66,.34)', overflow: 'hidden',
          animation: 'fadeUp .2s ease',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📄 {sourceName}</span>
              {row.rev > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 5, padding: '1px 5px' }}>
                  r{row.rev}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.oem_id} · {fmtKva(row.kva)} kVA · {(row.src === 'bid' ? 'public bid' : 'OEM quote')}
              {row.project_id ? ' · ' + row.project_id : ''}
            </div>
          </div>
          {doc?.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
                border: '1px solid var(--line)', borderRadius: 8, padding: '6px 11px', background: 'var(--panel2)', whiteSpace: 'nowrap',
              }}
            >
              Open ↗
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{
              border: '1px solid var(--line)', background: 'var(--panel2)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: 'var(--muted)',
              width: 30, height: 30, borderRadius: 8, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, minHeight: 0, background: 'var(--panel2)', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--faint)' }}>
              <div style={{ width: 26, height: 26, border: '3px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', marginBottom: 12, animation: 'spin .8s linear infinite' }} />
              <div style={{ fontSize: 13 }}>Loading source document…</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <div style={{ maxWidth: 420, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bad)', marginBottom: 6 }}>Couldn't load this document</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{error}</div>
                <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 10, lineHeight: 1.5 }}>
                  Source: <strong style={{ color: 'var(--muted)' }}>{sourceName}</strong>
                  {row.project_id ? ` in ${row.project_id}/` : ''}
                </div>
              </div>
            </div>
          )}

          {!loading && !error && doc && doc.kind === 'pdf' && (
            <iframe title={'Source document: ' + sourceName} src={doc.url} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
          )}

          {!loading && !error && doc && doc.kind !== 'pdf' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <div style={{ maxWidth: 420, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Not an inline-previewable file</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>
                  This source is <strong>{sourceName}</strong> (e.g. a bid spreadsheet). Open it to download.
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--accent)', borderRadius: 9, padding: '8px 16px', textDecoration: 'none' }}>
                  Open / download ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
