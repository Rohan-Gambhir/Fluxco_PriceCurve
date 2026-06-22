// Shared inline-style helpers. Components reference CSS custom properties
// (var(--accent) etc.) set on the themed root, so they restyle automatically
// when the theme changes — no need to thread concrete color values through.

// Segmented-control pill button (source filter, color-by, theme tints).
export function segBtn(active) {
  return {
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11.5px',
    fontWeight: 600,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    padding: '6px 13px',
    borderRadius: '6px',
    background: active ? '#ffffff' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted)',
    boxShadow: active ? '0 1px 3px rgba(36,49,66,.10)' : 'none',
    transition: 'all .15s',
  }
}

// The shared card surface.
export const cardStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
}

// Section overline (11px, weight 600, accent, uppercase).
export const overline = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '.09em',
  color: 'var(--accent)',
  textTransform: 'uppercase',
}
