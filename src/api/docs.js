// Source-document data layer. Asks the gated /api/doc route for a short-lived
// signed URL to a quote's source file in the private quote-pdfs bucket.

/**
 * Resolve a signed preview URL for a source document.
 * @param {(url: string, opts?: object) => Promise<Response>} authFetch
 * @param {{project?: string, oem?: string, file?: string, rev?: number}} ref  row fields
 * @returns {Promise<{url: string, filename: string, kind: 'pdf'|'other'}>}
 */
export async function fetchDocUrl(authFetch, { project, oem, file, rev }) {
  const doFetch = authFetch || fetch
  const qs = new URLSearchParams({
    project: project || '',
    oem: oem || '',
    file: file || '',
    rev: String(rev ?? 0),
  })
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
