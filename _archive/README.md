# Archive

These files are retired and no longer used by the app.

| File | What it was | Why retired |
|------|-------------|-------------|
| `build_data.py` | Data pipeline: read from Google Drive (WISdom CSVs + nuclear_interactive_tool_data.xlsx) → wrote `data.js` and `scenario-data.js` | Replaced by `scripts/build_wisdom_data.py` which writes `data/*.json` directly. |
| `data.js` | 3.3MB JS file with all plant/uprate/policy data as global `const` declarations | Replaced by `data/*.json` loaded via `data_loader.js` |
| `scenario-data.js` | 616KB JS file with scenario projections, GeoJSON, national aggregates | Replaced by `data/*.json` loaded via `data_loader.js` |

## Active scripts (now in `scripts/`)

`scripts/migrate_data.py` reads the frozen `data.js` / `scenario-data.js` here in `_archive/` and re-writes the `data/*.json` files. It is **not** retired — it lives in `scripts/` and can be re-run if needed (e.g. to regenerate from the frozen snapshot without hitting Google Drive).

## Data provenance
See `build_data.py` for the full documented pipeline showing exactly where each piece of data originated (WISdom siting CSVs, WISdom summary xlsx, FAI State Permitting Playbook, NRC applications, NCSL state restrictions).
