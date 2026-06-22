// Source-document data layer. Asks the gated /api/doc route for a short-lived
// signed URL to a quote's source file in the private quote-pdfs bucket.

/**
 * Resolve a signed preview URL for a source document.
 * @param {(url: string, opts?: object) => Promise<Response>} authFetch
 * @param {{project?: string, file?: string}} ref  row's project_id + filename
 * @returns {Promise<{url: string, filename: string, kind: 'pdf'|'other'}>}
 */
export async function fetchDocUrl(authFetch, { project, file }) {
  const doFetch = authFetch || fetch
  const qs = new URLSearchParams({ project: project || '', file: file || '' })
  const r = await doFetch('/api/doc?' + qs.toString())
  if (!r.ok) {
    let detail = ''
    try {
      detail = (await r.json())?.error || ''
    } catch {
      /* non-JSON */
    }
    throw new Error('HTTP ' + r.status + (detail ? ' — ' + detail : ''))
  }
  return r.json()
}
