// Sticky header: FluxCo wordmark + logo mark, source segmented control,
// live status pill (row count · last sync, green pulse / offline), theme tints.

import { THEMES } from '../lib/constants.js'
import { segBtn } from '../lib/ui.js'
import { useAuth } from '../auth/AuthProvider.jsx'

const SOURCES = [
  ['quote', 'Quotes'],
  ['bid', 'Bids'],
  ['both', 'Both'],
]

export default function Header({ spec, persist, data }) {
  const { loading, error, total, synced } = data
  const loaded = !loading && !error && !!data.model
  const statusLabel = loaded ? `${total} rows · ${synced}` : error ? 'offline' : 'connecting…'
  const { authEnabled, email, signOut } = useAuth()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '14px 26px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--panel)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 7, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 13 q3 -7 6 0 t6 0 t6 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div
            style={{
              fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 20,
              letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text)', whiteSpace: 'nowrap',
            }}
          >
            Fluxco<span style={{ color: '#9b4e27' }}>.</span>{' '}
            <span style={{ fontSize: 13, letterSpacing: '.04em', color: 'var(--muted)' }}>Pricing Studio</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2, letterSpacing: '.02em' }}>
            Transformer quote intelligence · internal
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        role="group"
        aria-label="Source filter"
        style={{
          display: 'flex', gap: 3, padding: 3, background: 'var(--panel2)',
          border: '1px solid var(--line)', borderRadius: 11,
        }}
      >
        {SOURCES.map(([k, l]) => (
          <button
            key={k}
            onClick={() => persist({ source: k })}
            aria-pressed={spec.source === k}
            style={segBtn(spec.source === k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div
        title="Live from the clean_quotes view"
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px',
          background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 10,
          fontSize: 12, color: 'var(--muted)',
        }}
      >
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: error ? 'var(--bad)' : 'var(--good)',
            boxShadow: error ? 'none' : '0 0 0 3px rgba(47,125,91,.18)',
            animation: error ? 'none' : 'pulse 2s ease-in-out infinite',
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{statusLabel}</span>
      </div>

      {authEnabled && email && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px 5px 12px',
            background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 10,
            fontSize: 12, color: 'var(--muted)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </span>
          <button
            onClick={signOut}
            title="Sign out"
            style={{
              border: '1px solid var(--line)', background: 'var(--panel)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: 'var(--muted)',
              padding: '4px 9px', borderRadius: 7,
            }}
          >
            Sign out
          </button>
        </div>
      )}

      <div role="group" aria-label="Visual theme" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {THEMES.map((t, i) => (
          <button
            key={t.name}
            onClick={() => persist({ theme: i })}
            title={t.name}
            aria-label={`${t.name} theme`}
            style={{
              width: 22, height: 22, borderRadius: 7, cursor: 'pointer',
              background: t.vars['--accent'],
              border: i === spec.theme ? '2px solid var(--text)' : '2px solid transparent',
              boxShadow: i === spec.theme ? '0 0 0 2px var(--panel)' : 'none',
              padding: 0,
            }}
          />
        ))}
      </div>
    </header>
  )
}
