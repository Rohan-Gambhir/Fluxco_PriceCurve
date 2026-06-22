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
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || ''
  const BUCKET = env.QUOTE_PDF_BUCKET || 'quote-pdfs'
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
        if (path === '/api/doc') {
          if (!SUPA_URL) return json(res, 500, { error: 'Dev server missing SUPABASE_URL (.env)' })
          if (!SERVICE_KEY) {
            return json(res, 501, { error: 'Set SUPABASE_SERVICE_ROLE_KEY in .env to preview source PDFs locally' })
          }
          const params = new URL(req.url, 'http://localhost').searchParams
          const file = (params.get('file') || '').split('#')[0]
          const project = params.get('project') || ''
          if (!file) return json(res, 400, { error: 'Missing file' })
          const objPath = project ? `${project}/${file}` : file
          if (objPath.includes('..')) return json(res, 400, { error: 'Bad path' })
          const enc = objPath.split('/').map(encodeURIComponent).join('/')
          try {
            const r = await fetch(`${SUPA_URL}/storage/v1/object/sign/${BUCKET}/${enc}`, {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ expiresIn: 120 }),
            })
            const text = await r.text()
            if (r.status !== 200) return json(res, r.status, { error: `Storage sign ${r.status}: ${text.slice(0, 140)}` })
            const signed = JSON.parse(text).signedURL || ''
            const full = signed.startsWith('/') ? SUPA_URL + '/storage/v1' + signed : signed
            return json(res, 200, { url: full, filename: file, kind: file.toLowerCase().endsWith('.pdf') ? 'pdf' : 'other' })
          } catch (e) {
            return json(res, 502, { error: 'Sign request failed: ' + String(e) })
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
