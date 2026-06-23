// App shell: themed root + sticky header + two-column body
// (aside controls / main results). One coherent state (useSpec) drives every
// view; data is fetched once (useQuotes) and the model is derived from it.

import { useState } from 'react'
import { useSpec } from './hooks/useSpec.js'
import { useQuotes } from './hooks/useQuotes.js'
import { derive } from './lib/pricing.js'
import { THEMES } from './lib/constants.js'

import Header from './components/Header.jsx'
import SpecPanel from './components/SpecPanel.jsx'
import DriversPanel from './components/DriversPanel.jsx'
import IncotermFilter from './components/IncotermFilter.jsx'
import ComparableFilters from './components/ComparableFilters.jsx'
import EstimateCard from './components/EstimateCard.jsx'
import ConfidencePanel from './components/ConfidencePanel.jsx'
import ChartsSection from './components/ChartsSection.jsx'
import Comparables from './components/Comparables.jsx'
import DocPreview from './components/DocPreview.jsx'
import { cardStyle } from './lib/ui.js'

export default function App() {
  const { spec, persist, setKva } = useSpec()
  const data = useQuotes()
  const [previewRow, setPreviewRow] = useState(null) // source-document preview
  // Brand theme is locked to FluxCo navy (index 0); the switcher was removed.
  const themeVars = THEMES[0].vars
  const loaded = !data.loading && !data.error && !!data.model
  const derived = loaded ? derive(spec, data.rows, data.model) : null
  const hasEstimate = loaded && derived && derived.est

  return (
    <div
      style={{
        ...themeVars,
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: "'Geist',system-ui,sans-serif",
        color: 'var(--text)',
      }}
    >
      <Header spec={spec} persist={persist} data={data} />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: 20,
          padding: '22px 26px 60px',
          maxWidth: 1560,
          margin: '0 auto',
        }}
      >
        {/* ===== LEFT RAIL: SPEC + DRIVERS + INCOTERM ===== */}
        <aside
          style={{
            flex: 'none',
            width: 316,
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <SpecPanel spec={spec} persist={persist} setKva={setKva} />
          {derived && <ComparableFilters spec={spec} persist={persist} derived={derived} />}
          <DriversPanel spec={spec} persist={persist} />
          {derived && <IncotermFilter spec={spec} persist={persist} derived={derived} />}
        </aside>

        {/* ===== MAIN: RESULTS ===== */}
        <main style={{ flex: 1, minWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.loading && (
            <div style={{ ...cardStyle, padding: 64, textAlign: 'center', color: 'var(--faint)' }}>
              <div
                style={{
                  width: 28, height: 28, border: '3px solid var(--line)', borderTopColor: 'var(--accent)',
                  borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite',
                }}
              />
              <div style={{ fontSize: 14 }}>Connecting to live quote database…</div>
            </div>
          )}

          {data.error && (
            <div style={{ ...cardStyle, border: '1px solid var(--bad)', boxShadow: 'none', padding: 28, color: 'var(--bad)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Couldn't reach the live data</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{data.error}</div>
            </div>
          )}

          {hasEstimate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <EstimateCard spec={spec} derived={derived} />
              <ConfidencePanel spec={spec} derived={derived} />
              <ChartsSection spec={spec} persist={persist} derived={derived} model={data.model} themeVars={themeVars} onPreview={setPreviewRow} />
              <Comparables derived={derived} onPreview={setPreviewRow} />
            </div>
          )}

          <footer style={{ fontSize: 11.5, color: 'var(--faint)', textAlign: 'center', padding: '8px 0', lineHeight: 1.5 }}>
            Internal pricing tool · fits recomputed live from{' '}
            <strong style={{ color: 'var(--muted)' }}>clean_quotes</strong> · bands are P10–P90, never point
            prices{loaded ? ` · round to ~$1k · ${data.total} live rows` : ''}
          </footer>
        </main>
      </div>

      <DocPreview row={previewRow} onClose={() => setPreviewRow(null)} />
    </div>
  )
}
