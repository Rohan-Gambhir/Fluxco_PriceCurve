import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware that mirrors the Vercel serverless routes so `npm run dev`
// works without the Vercel CLI or Python. Auth is OFF locally by design (the
// standard says leave GOOGLE_CLIENT_ID unset locally), so /api/quotes does not
// verify tokens here — it just proxies the cleaned view. To exercise the REAL
// Google gate locally, run `vercel dev` (which runs the Python functions).
function devApiPlugin(env) {
  const SUPA_URL = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const SUPA_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
  const CLIENT_ID = (env.GOOGLE_CLIENT_ID || '').trim()
  const DOMAIN = (env.FLUXCO_ALLOWED_DOMAIN || 'fluxco.com').trim().toLowerCase()

  const json = (res, status, payload) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(payload))
  }

  return {
    name: 'fluxco-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (path === '/api/config') {
          return json(res, 200, {
            auth_enabled: !!CLIENT_ID,
            google_client_id: CLIENT_ID || null,
            allowed_domain: DOMAIN,
          })
        }
        if (path === '/api/quotes') {
          if (!SUPA_URL || !SUPA_KEY) {
            return json(res, 500, { error: 'Dev server missing SUPABASE_URL / SUPABASE_ANON_KEY (.env)' })
          }
          try {
            const r = await fetch(`${SUPA_URL}/rest/v1/clean_quotes?select=*&order=kva.asc`, {
              headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
            })
            const text = await r.text()
            res.statusCode = r.status
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-store')
            return res.end(text)
          } catch (e) {
            return json(res, 502, { error: 'Upstream fetch failed: ' + String(e) })
          }
        }
        return next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read ALL env (no prefix filter) so the dev middleware can see the
  // non-VITE_ Supabase / Google vars too.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devApiPlugin(env)],
    server: {
      port: 5173,
      open: true,
    },
  }
})
