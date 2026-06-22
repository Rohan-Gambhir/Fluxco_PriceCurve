# Fluxco · Pricing Studio

Internal web tool that turns Fluxco's historical transformer quote/bid data into a
**defensible price band** (unit price + $/kVA, P10–P50–P90) with an honest confidence
read, the comparable historical quotes, and the market drivers behind the number.

Built from the design handoff in `../design_handoff_price_curve_frontend/` — recreated as a
real **React + Vite** app. All business logic (the two power-law fits, band, comparables,
confidence) is ported nearly verbatim from the design prototype.

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the Supabase URL + anon key (see below)
npm run dev               # http://localhost:5173
```

Other scripts: `npm run build` (production bundle to `dist/`), `npm run preview` (serve the build).

## Environment

The app reads live data from the Supabase **`clean_quotes`** view (a cleaned, denormalized
projection of `transformer_quotes`). Configure in `.env`:

```
VITE_SUPABASE_URL=https://tvjcqyrcyjpofnfjevpo.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable / read-only anon key>
```

The anon key is the **publishable, read-only** key and is safe in the browser *only because*
RLS limits the anon role to `SELECT` on `clean_quotes`. Never put a service-role key here.
`.env` is gitignored; `.env.example` is the committed template.

## Architecture

All data access is isolated behind one module (`src/api/quotes.js`) so the source can evolve
without touching the UI.

```
src/
  main.jsx                 # entry
  App.jsx                  # layout: header + 2-col (aside controls / main results)
  index.css                # global resets, fonts, keyframes
  api/quotes.js            # fetchQuotes() — the ONLY place we talk to Supabase
  lib/
    pricing.js             # PORTED: _pct, fitOne, fitAll, fitAt, regimeLabel, derive
    format.js              # PORTED: fmtMoney, fmtKva, cap, colorFor
    constants.js           # themes, categorical palettes, ADDONS, presets, defaults
    ui.js                  # shared inline-style helpers
  hooks/
    useSpec.js             # persisted spec state (localStorage 'fluxco.spec.v1')
    useQuotes.js           # fetch once on mount + compute fitAll(rows)
  components/
    Header.jsx             # wordmark, source filter, live status, theme switcher
    SpecPanel.jsx          # kVA slider/presets, HV/LV, units
    DriversPanel.jsx       # clickable add-on multipliers (with n badges)
    IncotermFilter.jsx     # delivery-basis chips
    EstimateCard.jsx       # central price band + dot-strip rail + driver chips
    ConfidencePanel.jsx    # "why this number" reason rows
    ChartsSection.jsx      # color-by control + legend + the two charts
    Chart.jsx              # ported buildChart() SVG (log-log scatter, fit, band, tooltips)
    Comparables.jsx        # nearest-quotes table
```

## The model (do not "fix" these)

- **Two separate power-law fits** — `quote` and `bid` sources are fitted independently. A single
  global curve is wrong (bids = small distribution units, steep & tight; quotes = large power
  transformers, flat & wide). `Both` is piecewise: `< 2.5 MVA` uses bids, `≥ 2.5 MVA` uses quotes.
- **P50 is the fitted-curve midpoint**, not an empirical 50th percentile. **P10/P90 are true
  percentiles** of residual ratios (actual ÷ predicted). Intentional.
- **Add-on factors are thin** (n = 1–3) and shown as directional evidence, not truth.
- **Incoterm bases are never silently mixed** — the filter isolates a basis and the charts warn on
  a mixed comparison. Bands, sample counts, and confidence are visible wherever an estimate appears.
