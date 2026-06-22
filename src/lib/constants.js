// ============================================================================
// Design tokens, themes, categorical palettes, and the pricing add-on table.
// Ported verbatim from the design prototype (Fluxco Pricing.dc.html).
// These are reference values; the curve fits themselves are recomputed live.
// ============================================================================

// 3 brand themes — each is a CSS-custom-property token set applied to the root.
export const THEMES = [
  {
    name: 'FluxCo',
    vars: {
      '--bg': '#ffffff', '--panel': '#f8f5f1', '--panel2': '#efe9e0',
      '--text': '#0b1119', '--muted': '#495869', '--faint': '#8893a1',
      '--line': 'rgba(21,30,40,.18)', '--accent': '#1e488f', '--accentSoft': '#e7ecf5',
      '--good': '#2f7d5b', '--warn': '#9b4e27', '--bad': '#bd2828',
      '--radius': '16px',
      '--shadow': '0 1px 2px rgba(36,49,66,.04),0 10px 24px rgba(36,49,66,.06)',
    },
  },
  {
    name: 'Copper',
    vars: {
      '--bg': '#ffffff', '--panel': '#f8f5f1', '--panel2': '#efe9e0',
      '--text': '#0b1119', '--muted': '#495869', '--faint': '#8893a1',
      '--line': 'rgba(21,30,40,.18)', '--accent': '#9b4e27', '--accentSoft': '#f3e7dd',
      '--good': '#2f7d5b', '--warn': '#1e488f', '--bad': '#bd2828',
      '--radius': '16px',
      '--shadow': '0 1px 2px rgba(36,49,66,.04),0 10px 24px rgba(36,49,66,.06)',
    },
  },
  {
    name: 'Steel',
    vars: {
      '--bg': '#ffffff', '--panel': '#f7f6f3', '--panel2': '#ebe9e4',
      '--text': '#0b1119', '--muted': '#495869', '--faint': '#8893a1',
      '--line': 'rgba(21,30,40,.18)', '--accent': '#495869', '--accentSoft': '#e7eaee',
      '--good': '#2f7d5b', '--warn': '#9b4e27', '--bad': '#bd2828',
      '--radius': '12px',
      '--shadow': '0 1px 2px rgba(36,49,66,.04),0 10px 24px rgba(36,49,66,.06)',
    },
  },
]

// Multiplicative price drivers. Several rest on 1–3 observations (see `n`) —
// presented as directional evidence, not precise truths.
export const ADDONS = [
  { id: 'basis', label: 'Ship ex-works → delivered (DDP)', short: 'DDP', factor: 1.40, note: '+28–70% observed (freight + duty)', n: 3 },
  { id: 'wind',  label: 'Aluminium → copper winding',      short: 'copper', factor: 1.26, note: '≈ +$10.9k / unit @ 3 MVA', n: 1 },
  { id: 'oil',   label: 'Mineral oil → natural ester',      short: 'ester', factor: 1.10, note: 'ester fluid premium', n: 2 },
  { id: 'ul',    label: 'Add UL listing',                   short: 'UL', factor: 1.13, note: '≈ +$73.5k', n: 1 },
  { id: 'fat',   label: 'FAT / TÜV witness test',           short: 'FAT', factor: 1.005, note: '≈ +$2.4k (info only)', n: 1 },
]

// Categorical color + label maps for chart coloring and legends.
export const REGION_COLORS = { US: '#1e488f', EastAsia: '#9b4e27', SouthAsia: '#2f7d5b', EuropeTurkey: '#495869', LatinAmerica: '#bd2828', MiddleEast: '#b1873a', Unknown: '#aab0b8' }
export const REGION_LABELS = { US: 'United States', EastAsia: 'East Asia', SouthAsia: 'South Asia', EuropeTurkey: 'Europe / Turkey', LatinAmerica: 'Latin America', MiddleEast: 'Middle East', Unknown: 'Unknown' }
export const WIND_COLORS = { copper: '#9b4e27', aluminum: '#495869', unk: '#b6bcc4' }
export const INCO_COLORS = { EXW: '#495869', FOB: '#9b4e27', CIF: '#2f7d5b', CIP: '#3b9d6f', DDP: '#1e488f' }
export const SRC_COLORS = { quote: '#1e488f', bid: '#9b4e27' }

// kVA preset chips (spec panel).
export const PRESETS = [750, 2500, 3000, 5000, 10000, 20000, 30000]

// Incoterm display order in the filter.
export const INCO_ORDER = ['EXW', 'FOB', 'CIF', 'CIP', 'DDP', 'n/a']

// color-by dimensions for the charts
export const COLOR_BYS = [
  ['source', 'Source'],
  ['region', 'Origin'],
  ['winding', 'Winding'],
  ['incoterm', 'Incoterm'],
]

// Persisted spec defaults (localStorage key fluxco.spec.v1).
export const SPEC_STORAGE_KEY = 'fluxco.spec.v1'
export const DEFAULT_SPEC = {
  source: 'both',
  kva: 3000,
  hv: 34.5,
  lv: 0.208,
  units: 1,
  addons: { basis: false, wind: false, oil: false, ul: false, fat: false },
  colorBy: 'source',
  theme: 0,
  incoOff: [],
}
