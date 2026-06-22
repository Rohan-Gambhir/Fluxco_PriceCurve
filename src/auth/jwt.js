// Decode a JWT payload CLIENT-SIDE for DISPLAY ONLY (the signed-in email).
// This never decides access — the backend verifies the token's signature.
export function decodeJwt(token) {
  try {
    const part = token.split('.')[1]
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}
