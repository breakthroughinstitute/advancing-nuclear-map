# Archive

These files are retired and no longer used by the app.

| File | What it was | Why retired |
|------|-------------|-------------|
| `build_data.py` | Data pipeline: read from Google Drive (WISdom CSVs + nuclear_interactive_tool_data.xlsx) → wrote `data.js` and `scenario-data.js` | Replaced by `data/*.json` files which live directly in the repo. No more Google Drive dependency. |
| `migrate_data.py` | One-time migration script: extracted all JS variables from `data.js` / `scenario-data.js` → wrote the 14 JSON files in `data/` | Ran once (Apr 2026), job done. |
| `data.js` | 3.3MB JS file with all plant/uprate/policy data as global `const` declarations | Replaced by `data/*.json` loaded via `data_loader.js` |
| `scenario-data.js` | 616KB JS file with scenario projections, GeoJSON, national aggregates | Replaced by `data/*.json` loaded via `data_loader.js` |

## Data provenance
See `build_data.py` for the full documented pipeline showing exactly where each piece of data originated (WISdom siting CSVs, WISdom summary xlsx, FAI State Permitting Playbook, NRC applications, NCSL state restrictions).
