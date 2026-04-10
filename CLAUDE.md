# Advancing Nuclear Map — Claude Instructions

## Start here. Do NOT pull conversation history. Read memory instead:
`~/.claude/projects/-Users-joyjiang-Library-CloudStorage-GoogleDrive-joy-thebreakthrough-org-Shared-drives-Nuclear-Projects-2022-Advancing-Nuclear-Report--2022--WISdom-outputs/memory/project_nuclear_map.md`

## Project
- **Live URL**: https://breakthroughinstitute.github.io/advancing-nuclear-map/
- **GitHub**: breakthroughinstitute/advancing-nuclear-map (main branch)
- **Single file app**: `~/advancing-nuclear-map/index.html` — all JS/CSS/HTML inline
- **Data file**: `~/advancing-nuclear-map/data.js` — 3.3MB auto-generated, do not hand-edit
- **Data pipeline**: `~/advancing-nuclear-map/build_data.py`
- **Color palette reference**: `~/advancing-nuclear-map/Color Palette.pptx`

## Push workflow
```bash
cd ~/advancing-nuclear-map
git add index.html
git commit -m "..."
git push
```
Git remote has PAT embedded — push works without extra auth.

## Three-Tab Architecture
| Tab | Function | Controls |
|-----|----------|----------|
| Map | WISdom scenario projections 2020–2050 | Year slider, scenario tabs, layer toggles |
| Uprate | Static 2025 WISdom fleet snapshot | None (hidden) |
| Dashboard | State explorer + national summary charts | State selector |

## YEARS Array — CRITICAL
`YEARS = [2020, 2025, 2030, 2035, 2040, 2045, 2050]` — WISdom only has these 7 years.
**Never reference a year outside this array in data lookups** — returns undefined → blank map.
Uprate tab uses `_uY = "2025"` even though footnote says "2026" (calendar year). Do not change `_uY` to "2026".

## Technology Key Mismatches — CRITICAL
WISdom data uses different key names. Both variants must exist in COLORS and TN:
- WISdom `"NG CC"` / `"NG GT"` vs original `"NGCC"` / `"NGCT"` — both now in COLORS ✅
- WISdom `"UtilStorage"` vs original `"Storage"` — both now in COLORS ✅
- Before adding any new tech, verify exact WISdom key:
```bash
python3 -c "import re; print(sorted(set(re.findall(r'\[[\d.-]+,[\d.-]+,[\d.]+,\"([^\"]+)\"', open('data.js').read()))))"
```

## BTI Color Palette (see Color Palette.pptx)
All current colors are correct per the 2022 Advancing Nuclear Report palette:
- Coal `#252A2B`, NG CC `#6D7374`, NG GT `#C0C6C8`, CCS `#D62728`
- Nuclear `#814DB1`
- **Advanced Nuclear (SMR + ARTES + HTGR): all `#0DC3A8` — intentional, keep combined, never break out**
- Wind `#2CA02C`, Offshore `#98DF8A`, UPV `#FFDE20`, DPV `#FF7F0E`
- Hydro `#003FFD`, Geo/Bio `#8C564B`, CSP `#FDFD4D`
- Storage `#E82269`

## Dot Sizing & Rendering
```javascript
gR(mwe)       // dot radius — ≥5000→12, ≥2000→9, ≥1000→7, ≥500→5.5, ≥100→4, else→2.5
gUpR(addMWe)  // ring radius — continuous: Math.round(8 + addMWe * 0.03)
dotStroke(dom)// "#64748b" for light techs (NG CC/GT/NGCC/NGCT/UPV/CSP/Offshore), else "#fff"
```
- **Map tab**: dot sized from WISdom `total` MW
- **Uprate tab**: dot sized from `ur.mwt / 3` (actual licensed MWe — WISdom undervalues some plants e.g. Fermi)
- **Uprate ring**: `gUpR(Math.round(ur.add / 3))` — `ur.add` is MWt, ÷3 for MWe

## Units (Uprate Tab)
- `ur.mwt`, `ur.add` — **MWt** (NRC regulatory unit, FAI/INL source)
- Conversion: **MWt ÷ 3 ≈ MWe** (33% thermal efficiency, same as Emmet's dashboard)
- Summary card headline: MWe; per-unit table: MWt (labeled); popup: "X MWt (~Y MWe)"

## UR Data Structure
`UR["lat,lon"] = {d, u, mwt, add, mkt, units?, note?, restart?, retYear?, restartYear?, proposed?}`
- `u`: integer unit count; `units`: per-unit array `[{name,mwt,add}]`
- `proposed:true` → green ring (EPU planned); `restart:true` → teal dot, no ring

## ORPHAN System (plants absent from WISdom)
```
"43.276,-77.309" Ginna        582 MWe  (no year limits)
"40.220,-75.585" Limerick    1296 MWe  fromYear:2025 toYear:2045
"41.601,-83.083" Davis-Besse  925 MWe  fromYear:2025 toYear:2035
"35.203,-120.860" Diablo Canyon 2256 MWe fromYear:2025 toYear:2030
```

## Map Z-Index Stack
```
tilePane z:200 → labelsPane z:250 (custom, pointerEvents:none) → overlayPane z:400 (dots) → popupPane z:700
```

## Layer Toggles (bTg())
- Nuclear, Conversion: single buttons, on by default
- Fossil, Renew: group buttons → open **checkbox dropdown panel** on click (first click = select all + open)
- Storage: single toggle
- Legend (bLg()): grouped Nuclear → Fossil → Renewables → Storage, matching toggle structure

## swT(t) — Tab Switching
- `"uprate"`: hides `#mainControls`, `#scenarioTabs`, shows `#uprateLegend`, hides `#legend`
- `"map"`: shows `#mainControls`, `#scenarioTabs`, shows `#legend`, hides `#uprateLegend`
- `"dashboard"`: hides `#mainControls`, shows `#scenarioTabs`

## Key Design Decisions (do not revert)
1. Advanced Nuclear always combined as `#0DC3A8`, never broken out by type
2. Uprate tab is a static snapshot — no year slider, no scenario tabs ever
3. Uprate ring radius = continuous linear formula `Math.round(8 + addMWe*0.03)`, not discrete tiers
4. Uprate tab dot sizes from `ur.mwt/3`, not WISdom total
5. Popup tooltip shows "X MWt (~Y MWe)" — both units intentional
6. `_uY = "2025"` in uU() — do not change to "2026" (no such WISdom slice)
