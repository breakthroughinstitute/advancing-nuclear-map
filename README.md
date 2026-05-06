# Advancing Nuclear Map

Interactive map of U.S. nuclear power — uprate potential, policy climate, and WISdom scenario projections.

**Live site:** https://breakthroughinstitute.github.io/advancing-nuclear-map/

---

## Running locally

The app loads data via `fetch()`, so it needs an HTTP server — opening `index.html` directly from the file system will fail.

```bash
cd advancing-nuclear-map
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step. All JS and CSS are plain files; the app is ready to run once the `data/` folder is populated.

---

## Repository layout

```
index.html            — App shell; loads all JS and CSS
constants.js          — Shared constants and state variables
data_loader.js        — Fetches data/*.json in parallel, calls initApp()
map.js                — Map tab (Leaflet, WISdom scenario dots)
uprate.js             — Uprate tab (uprate rings, restart markers, charts)
dashboard.js          — Dashboard tab (state explorer, national charts)
utils.js              — Shared helpers
styles.css

data/                 — JSON data files (source of truth, committed to repo)
  plant_meta.json     — Plant names and state mapping
  plants.json         — WISdom plant siting per scenario/year
  coal_sites.json     — Coal conversion opportunities per scenario
  state_capacity.json — Per-state installed capacity by tech/year/scenario
  state_scenarios.json— State projections: reactors, jobs, capital investment
  nuclear_detail.json — Per-state nuclear project economics
  state_investment.json — State capital investment ($B) by scenario/year
  national.json       — National aggregates: capacity, jobs, retail rates, system cost
  dispatch.json       — Hourly dispatch data (July 1–7, 2050, by scenario)
  geodata.json        — US states GeoJSON (static, never changes)
  uprate.json         — Uprate potential and restart data (56 sites)
  orphan.json         — Plants absent from WISdom (7 entries)
  state_policy.json   — Nuclear regulatory environment per state
  nrc_pipeline.json   — NRC expected uprate applications through 2032

scripts/              — Python scripts that regenerate data/*.json
_archive/             — Retired files (data.js, scenario-data.js, build_data.py)
```

---

## Updating data

### Python requirements

```bash
pip3 install openpyxl pandas pdfplumber curl_cffi
```

(`pdfplumber` is only needed by `fetch_uprate.py` and `fetch_state_policy.py`.)

### Which script does what

| Script | What it updates | Needs Google Drive? |
|---|---|---|
| `scripts/build_wisdom_data.py` | All WISdom-derived files (plants, scenarios, state capacity, national, dispatch, etc.) | **Yes** — BTI shared drive |
| `scripts/migrate_data.py` | Same files as above, but reads from frozen `_archive/` snapshots | No |
| `scripts/generate_orphan.py` | `data/orphan.json` — 7 plants absent from WISdom | No |
| `scripts/fetch_uprate.py` | `data/uprate.json` — uprate potential from FAI playbook + NRC data | No (fetches PDF) |
| `scripts/fetch_state_policy.py` | `data/state_policy.json` — regulatory environment per state | No (fetches web) |
| `scripts/fetch_nrc_pipeline.py` | `data/nrc_pipeline.json` — NRC expected applications pipeline | No (fetches NRC site — may require browser fallback) |

**If you don't have Google Drive access**, use `migrate_data.py` to regenerate WISdom data from the frozen archive. It produces identical output to `build_wisdom_data.py` using the April 2026 WISdom snapshot.

### Typical update workflow

```bash
# Refresh uprate potential when FAI updates their playbook
python3 scripts/fetch_uprate.py

# Refresh NRC pipeline when NRC updates expected applications
python3 scripts/fetch_nrc_pipeline.py

# Refresh state policy when deregulation or moratorium status changes
python3 scripts/fetch_state_policy.py

# Regenerate orphan.json if restart plants are added/removed
python3 scripts/generate_orphan.py

# Regenerate all WISdom data (BTI members with Google Drive access)
python3 scripts/build_wisdom_data.py

# Regenerate all WISdom data from frozen archive (no Google Drive needed)
python3 scripts/migrate_data.py
```

After updating any JSON file, verify locally with `python3 -m http.server 8000`, then commit and push.

---

## Deploying

The `main` branch is live at the GitHub Pages URL above. All development work stays on the `organize` branch. Never push to `main` without review.

```bash
git add data/uprate.json   # (or whichever files changed)
git commit -m "update uprate data — FAI playbook refresh"
git push
```

---

## Three-tab architecture

| Tab | What it shows |
|---|---|
| **Map** | WISdom scenario projections 2020–2050 with year slider and scenario selector |
| **Uprate** | Static 2025 snapshot of uprate potential, planned EPUs, and restart plants |
| **Dashboard** | State-level explorer and national summary charts |
