// Auth context for the Fluxco Google sign-in gate.
//
// Mirrors the standard boot()/authFetch flow:
//  - read /api/config on load → learn whether auth is enabled
//  - if enabled and no token → render a full-screen sign-in overlay (GSI)
//  - authFetch() attaches the Bearer token and, on a 401 (expired ~1h token),
//    clears it and re-prompts; the data hook then refetches once a fresh token
//    arrives — so an expired token doesn't surface as a failed action.
//
// When auth is disabled (GOOGLE_CLIENT_ID unset on the server), this is a no-op:
// `ready` flips true, `authEnabled` is false, and the app runs unauthenticated.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { decodeJwt } from './jwt.js'
import SignInOverlay from '../components/SignInOverlay.jsx'

const TOKEN_KEY = 'id_token'
const AuthCtx = createContext(null)

export function useAuth() {
  return useContext(AuthCtx)
}

export function AuthProvider({ children }) {
  const [config, setConfig] = useState(null) // null = still loading /api/config
  const [token, setTokenState] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  })

  const ready = config !== null
  const authEnabled = !!config?.auth_enabled

  // Load the public config once on mount. On failure, fail OPEN to auth-off so a
  // missing endpoint in pure-static hosting doesn't lock everyone out locally.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let cfg
      try {
        cfg = await (await fetch('/api/config')).json()
      } catch {
        cfg = { auth_enabled: false }
      }
      if (!cancelled) setConfig(cfg)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setToken = useCallback((t) => {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t)
      else sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore storage errors */
    }
    setTokenState(t || null)
  }, [])

  const signOut = useCallback(() => {
    try {
      window.google?.accounts?.id?.disableAutoSelect?.()
    } catch {
      /* ignore */
    }
    setToken(null)
  }, [setToken])

  // authFetch — use for EVERY protected /api/* call (never raw fetch).
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}) }
      if (authEnabled && token) headers.Authorization = 'Bearer ' + token
      const res = await fetch(url, { ...opts, headers })
      if (res.status === 401 && authEnabled) {
        // token expired / invalid → drop it and re-prompt; the data hook refetches.
        setToken(null)
      }
      return res
    },
    [authEnabled, token, setToken]
  )

  const email = useMemo(() => (token ? decodeJwt(token)?.email || null : null), [token])

  const value = useMemo(
    () => ({ ready, authEnabled, token, email, setToken, signOut, authFetch }),
    [ready, authEnabled, token, email, setToken, signOut, authFetch]
  )

  return (
    <AuthCtx.Provider value={value}>
      {children}
      {ready && authEnabled && !token && (
        <SignInOverlay
          clientId={config.google_client_id}
          hd={config.allowed_domain}
          onToken={setToken}
        />
      )}
    </AuthCtx.Provider>
  )
}
