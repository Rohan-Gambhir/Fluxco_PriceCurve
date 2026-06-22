// Full-screen sign-in gate. Loads Google Identity Services (script in index.html),
// initializes it with the client id from /api/config, and renders the official
// GSI button. `hd` is a UI hint to prefer the Workspace domain — the BACKEND
// enforces the @fluxco.com restriction; this only nudges the account chooser.

import { useEffect, useRef } from 'react'

export default function SignInOverlay({ clientId, hd, onToken }) {
  const buttonRef = useRef(null)
  const initedRef = useRef(false)

  useEffect(() => {
    if (initedRef.current) return
    let stop = false

    const init = () => {
      if (stop) return
      if (!window.google?.accounts?.id) {
        setTimeout(init, 100) // wait for the GSI script to load
        return
      }
      initedRef.current = true
      window.google.accounts.id.initialize({
        client_id: clientId,
        hd: hd || undefined,
        callback: (r) => {
          if (r?.credential) onToken(r.credential)
        },
      })
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
        })
      }
    }

    init()
    return () => {
      stop = true
    }
  }, [clientId, hd, onToken])

  return (
    <div
      id="signin-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11,17,25,.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: '90vw',
          background: 'var(--panel, #f8f5f1)',
          border: '1px solid var(--line, rgba(21,30,40,.18))',
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(36,49,66,.04),0 20px 50px rgba(36,49,66,.30)',
          padding: '32px 30px',
          textAlign: 'center',
          animation: 'fadeUp .25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, marginBottom: 18 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--accent, #1e488f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 13 q3 -7 6 0 t6 0 t6 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 22,
              letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text, #0b1119)',
            }}
          >
            Fluxco<span style={{ color: '#9b4e27' }}>.</span>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0b1119)', marginBottom: 6 }}>
          Pricing Studio · internal
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted, #495869)', lineHeight: 1.5, marginBottom: 22 }}>
          Sign in with your <strong>@{hd || 'fluxco.com'}</strong> Google account to continue.
        </div>

        <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center' }} />

        <div style={{ fontSize: 11, color: 'var(--faint, #8893a1)', marginTop: 20, lineHeight: 1.5 }}>
          Access is restricted to authorised Fluxco staff. Sign-in is verified on the server.
        </div>
      </div>
    </div>
  )
}
