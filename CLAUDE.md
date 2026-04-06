# Advancing Nuclear Map — Claude Instructions

## DO NOT pull conversation history at session start. Read this file instead.

## Project
- **Live**: https://joyjiang97.github.io/advancing-nuclear-map/
- **Source**: `/private/tmp/advancing-nuclear-map/index.html` (single file, all inline)
- **GitHub**: JoyJiang97/advancing-nuclear-map (main branch, PAT embedded in remote URL)
- **Push**: `cd /private/tmp/advancing-nuclear-map && git add index.html && git commit -m "..." && git push`

## Current State (2026-04-06)

### Uprate Layer
- Data from FAI State Permitting Playbook (Nov 2025) + INL/EXT-24-78810
- `UR` object keyed by `"lat,lon"` → `{d, u, mwt, add, mkt, units?, note?, restart?, retYear?, restartYear?}`
- Summary card: **40 sites, 66 units, ~5,560 MWe** uprate potential (restarts excluded)
- Two policy anchors: NEI ~8,000 MWe and DOE UPRISE 5,000 MWe
- Dedup logic in `buildUprateCard()`: rounds lat/lon to 1dp to collapse coord-pair duplicates

### Restart Plants (`restart:true`)
- Crane/TMI `40.150,-76.731` and Palisades `42.319,-86.314`
- Excluded from uprate totals; shown as purple dot with dotted border + glow on uprate layer
- No uprate detail card on click; note says "Restarting ..."
- Restart MWe shown separately in summary card

### ORPHAN System
Plants absent from WISdom DATA.g, rendered separately:
- Ginna `43.276,-77.309` — no year limits
- Limerick `40.220,-75.585` — fromYear:2025, toYear:2045
- Davis-Besse `41.601,-83.083` — fromYear:2025, toYear:2035
- Diablo Canyon `35.203,-120.860` — fromYear:2025, toYear:2030 (CA SB846 extends to 2030; NRC renewed to 2044/2045 but state legislature must act)

### Uprate Detail Card `showUprateDetail(ur, pNm, stateName)`
- Header: plant name, **+MWe** large purple headline, reactor type subtitle
- Badges: CLEAR/RESTRICTED PATH (from SR data) + MERCHANT/REGULATED
- Per-unit table: orig capacity / done / now / remaining (MWt + %)
- Max uprate cap % shown below badges
- Note (yellow) shown if `ur.note` present

### Cap % by Reactor Type
W 4-Loop=9%, W 3-Loop=20%, W 2-Loop=18.5%, CE=18%, CE Sys80=5%, B&W=1.6%, GE BWR=20%, AP1000=0%

### PSTATE Lookup
`PSTATE` object maps `"lat,lon"` → state name, used for SR regulatory badge lookup.

### Key Per-Unit Splits (explicit `units[]`)
Diablo Canyon, ANO, Vogtle, Salem/Hope Creek, Catawba, Millstone, Nine Mile/FitzPatrick, Cook

### Markers
- Purple circle = nuclear plant (size = MW)
- Purple dashed ring = uprate potential (size = MWt headroom)
- Purple dot + dotted border + glow = restart plant
- Teal diamond = coal→nuclear conversion site

## Pending
- Move repo to BTI GitHub (manual)
