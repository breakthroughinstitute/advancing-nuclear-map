# Advancing Nuclear Map — Claude Instructions

## Start here. Do NOT pull conversation history. Read memory instead:
`~/.claude/projects/-Users-joyjiang-Library-CloudStorage-GoogleDrive-joy-thebreakthrough-org-Shared-drives-Nuclear-Projects-2022-Advancing-Nuclear-Report--2022--WISdom-outputs/memory/project_nuclear_map.md`

## Project
- **Live URL**: https://breakthroughinstitute.github.io/advancing-nuclear-map/
- **GitHub**: breakthroughinstitute/advancing-nuclear-map (main branch = live)
- **Working branch**: `organize` (all new work; never merge to main without user confirmation)
- **App entry point**: `index.html` — loads all JS/CSS

## File Structure
```
index.html          — shell HTML + <script> tags
constants.js        — YEARS, N2A, colors, shared state vars (cY, cS, cT, cSt)
data_loader.js      — async parallel-fetch of all data/*.json → global vars
map.js              — Map tab (Leaflet, WISdom dots, layer toggles)
uprate.js           — Uprate tab (uU(), NRC/FAI/restart markers)
dashboard.js        — Dashboard tab (initDash, uDash, all Chart.js charts)
utils.js            — shared helpers
styles.css

data/               — 14 JSON files (source of truth, committed to repo)
  plant_meta.json   → PN (names), PSTATE (states)
  uprate.json       → UR  (56 sites, keyed "lat,lon")
  orphan.json       → ORPHAN (7 plants WISdom drops/misses)
  state_policy.json → SR  (ban/restrict status per state)
  plants.json       → DATA.g
  coal_sites.json   → DATA.c
  state_capacity.json → SC  {scenario → {full_state_name → {year → {tech: MW}}}}
  state_scenarios.json → SD {scenario → {state_abbrev → {...}}}
  geodata.json      → GD
  national.json     → NAT (national.capacity), NAT_JOBS, RETAIL, SYSCOST
  nuclear_detail.json → ND
  state_investment.json → STATE_INV
  dispatch.json     → DISP
  nrc_pipeline.json → (used by uprate sidebar)

scripts/            — Python scripts that regenerate data/*.json
  build_wisdom_data.py   — pulls from WISdom Google Drive XLSXs/CSVs → writes most JSON files
  migrate_data.py        — reads _archive/data.js + _archive/scenario-data.js → writes JSON (offline fallback)
  generate_orphan.py     — hardcoded 7-entry orphan table → orphan.json
  fetch_uprate.py        — fetches uprate.json from NRC/FAI sources
  fetch_state_policy.py  — fetches state_policy.json
  fetch_nrc_pipeline.py  — fetches nrc_pipeline.json

_archive/           — retired files (data.js, scenario-data.js, build_data.py); see _archive/README.md
```

## Push workflow
```bash
cd ~/advancing-nuclear-map
git add <specific files>
git commit -m "..."
git push   # PAT embedded in remote, no extra auth needed
```
**Never push to main without explicit user confirmation.** All work stays on `organize` branch.

## Three-Tab Architecture
| Tab | Function | Controls |
|-----|----------|----------|
| Map | WISdom scenario projections 2020–2050 | Year slider, scenario tabs, layer toggles |
| Uprate | Static uprate/restart tracker (from UR directly) | None |
| Dashboard | State explorer + national summary charts | State selector |

## YEARS Array — CRITICAL
`YEARS = [2020, 2025, 2030, 2035, 2040, 2045, 2050]` — WISdom only has these 7 years.
**Never reference a year outside this array in data lookups** — returns undefined → blank map.

## Data Globals & Structures
- `UR` — uprate.json, keyed `"lat,lon"`. Fields: `d, u, mwt, add, mkt, note?, proposed?, restart?, retYear?, restartYear?, units?`
- `ORPHAN` — orphan.json, keyed `"lat,lon"`. Fields: `mwe, fromYear?, toYear?`. Used only by main map tab for plants WISdom drops or never tracks. **Not used by Uprate tab.**
- `NAT` — `national.capacity` → `{scenario: {cap: {year: {tech: MW}}, costs: {...}, emissions: {...}}}`
- `SC` — state_capacity.json → `{scenario: {full_state_name: {year: {tech: MW}}}}`
- `SD` — state_scenarios.json → `{scenario: {state_abbrev: {...}}}`
- `N2A` — full state name → abbreviation map (in constants.js)

## uU() — Uprate Tab Renderer
Drives entirely from `Object.entries(UR).forEach(...)`. No WISdom dependency, no ORPHAN dependency.
- `ur.retYear && !ur.restart` → skip (retired plants)
- `ur.restart` → teal fill + dotted glow marker
- `ur.proposed` → green dashed ring
- `ur.add > 0` → amber dashed ring

## ORPHAN System (plants absent from WISdom — main map only)
```
"43.276,-77.309"  Ginna         582 MWe  (no year limits — always show)
"40.220,-75.585"  Limerick     1296 MWe  fromYear:2025  toYear:2045
"41.601,-83.083"  Davis-Besse   925 MWe  fromYear:2025  toYear:2035
"35.203,-120.860" Diablo Canyon 2256 MWe  fromYear:2025  toYear:2030
"40.150,-76.731"  TMI (Crane)   856 MWe  restart (no year limits)
"42.319,-86.314"  Palisades     855 MWe  restart (no year limits)
"42.101,-91.777"  Duane Arnold  601 MWe  restart (no year limits)
```
Regenerate with: `python3 scripts/generate_orphan.py`

## Technology Key Mismatches — CRITICAL
WISdom uses different key names. Both variants must exist in COLORS:
- WISdom `"NG CC"` / `"NG GT"` vs original `"NGCC"` / `"NGCT"`
- WISdom `"UtilStorage"` vs original `"Storage"`

## BTI Color Palette
- Coal `#252A2B`, NG CC `#6D7374`, NG GT `#C0C6C8`, CCS `#D62728`
- Nuclear `#814DB1`
- **Advanced Nuclear (SMR + ARTES + HTGR): all `#0DC3A8` — intentional, always combined, never break out**
- Wind `#2CA02C`, Offshore `#98DF8A`, UPV `#FFDE20`, DPV `#FF7F0E`
- Hydro `#003FFD`, Geo/Bio `#8C564B`, UtilStorage `#E82269`

## Dot Sizing & Rendering
```javascript
gR(mwe)       // dot radius — ≥5000→12, ≥2000→9, ≥1000→7, ≥500→5.5, ≥100→4, else→2.5
gUpR(addMWe)  // ring radius — continuous: Math.round(8 + addMWe * 0.03)
dotStroke(dom)// "#64748b" for light techs (NG CC/GT/UPV/CSP/Offshore), else "#fff"
```
- **Map tab**: dot sized from WISdom `total` MW
- **Uprate tab**: dot sized from `ur.mwt / 3` (MWt → MWe); ring from `gUpR(Math.round(ur.add / 3))`

## Units (Uprate Tab)
- `ur.mwt`, `ur.add` — **MWt** (NRC regulatory unit)
- Conversion: **MWt ÷ 3 ≈ MWe** (33% thermal efficiency)
- Summary headline: MWe; per-unit table: MWt (labeled); popup: "X MWt (~Y MWe)"

## Dashboard Chart Fix
Charts initialize while the dashboard section is `display:none`, causing Chart.js to record wrong canvas sizes. `swT("dashboard")` calls `setTimeout(() => Object.values(Chart.instances).forEach(c => c.resize()), 100)` to fix this. Do not remove.

## Key Design Decisions (do not revert)
1. Advanced Nuclear always combined as `#0DC3A8`, never broken out by type
2. Uprate tab is a static snapshot — no year slider, no scenario tabs ever
3. Uprate tab drives from `UR` directly — no WISdom/ORPHAN dependency
4. Uprate ring radius = continuous linear formula `Math.round(8 + addMWe*0.03)`, not discrete tiers
5. Dot sizes from `ur.mwt/3`, not WISdom total
6. Popup tooltip shows "X MWt (~Y MWe)" — both units intentional
