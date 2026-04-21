#!/usr/bin/env python3
"""
generate_orphan.py — Regenerate data/orphan.json from hardcoded entries
========================================================================
orphan.json provides fallback entries for the MAIN MAP tab for plants that
WISdom does not include or tracks with incorrect dates. The uprate tab
(uU() in dashboard.js) drives from uprate.json directly and does NOT use
orphan entries.

Each entry key is "lat,lon" (3 decimal places) matching the coordinate keys
used in uprate.json and plant_meta.json.

Fields:
  mwe       — nameplate capacity in MWe (used for dot sizing on the main map)
  fromYear  — first WISdom year this plant should appear (optional)
  toYear    — last WISdom year this plant should appear (optional)

Plants here fall into two categories:

  A. OPERATING plants WISdom drops or misses entirely
       R.E. Ginna      — not present in any WISdom scenario slice
       Limerick        — WISdom drops it after 2025; keep through 2045 license end
       Davis-Besse     — WISdom drops it after 2025; keep through 2035 license end
       Diablo Canyon   — CA law allows operation through 2030 (SB 846); WISdom
                         retires it early. toYear=2030 enforces this limit.

  B. RESTART plants WISdom never tracks (retired before WISdom baseline)
       Three Mile Island  — Crane Clean Energy Center restart (Constellation)
       Palisades          — Holtec / Palisades Power restart
       Duane Arnold       — NextEra / Google restart

UPDATE this file and re-run when:
  • A new plant restart is announced / confirmed
  • A state changes a plant's operating license period (e.g. Diablo Canyon extension)
  • WISdom is updated and starts covering a previously missing plant (remove that entry)

Usage:
    python3 scripts/generate_orphan.py
"""

import json
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH  = os.path.join(REPO_ROOT, "data", "orphan.json")

# ─────────────────────────────────────────────────────────────────────────────
# Orphan entries — UPDATE HERE when plant status changes
# ─────────────────────────────────────────────────────────────────────────────

ORPHAN = {
    # ── A. Operating plants WISdom drops or misses ────────────────────────────

    # R.E. Ginna (New York) — 582 MWe
    # Not present in any WISdom scenario; 20-year license renewal granted 2023
    # through 2029, further renewal pending. No fromYear/toYear: always show.
    "43.276,-77.309": {
        "mwe": 582.0,
    },

    # Limerick (Pennsylvania) — 1,296 MWe (2 units × 648 MWe)
    # WISdom retires after 2025; license runs to 2044/2045.
    "40.220,-75.585": {
        "mwe": 1296.0,
        "fromYear": 2025,
        "toYear":   2045,
    },

    # Davis-Besse (Ohio) — 925 MWe
    # WISdom retires after 2025; license runs to 2035.
    "41.601,-83.083": {
        "mwe": 925.0,
        "fromYear": 2025,
        "toYear":   2035,
    },

    # Diablo Canyon (California) — 2,256 MWe (2 units × 1,128 MWe)
    # SB 846 (2022) authorizes continued operation through 2030.
    # WISdom retires it earlier; toYear=2030 enforces the statutory limit.
    "35.203,-120.860": {
        "mwe": 2256.0,
        "fromYear": 2025,
        "toYear":   2030,
    },

    # ── B. Restart plants WISdom never tracks ─────────────────────────────────

    # Three Mile Island Unit 1 (Pennsylvania) — 856 MWe
    # Restarting as Crane Clean Energy Center (Constellation / Microsoft).
    # No fromYear/toYear: show in all scenario years once restarted.
    "40.150,-76.731": {
        "mwe": 856.0,
    },

    # Palisades (Michigan) — 855 MWe
    # Restarting under Holtec International.
    "42.319,-86.314": {
        "mwe": 855.0,
    },

    # Duane Arnold (Iowa) — 601 MWe
    # Restart planned by NextEra in partnership with Google.
    "42.101,-91.777": {
        "mwe": 601.0,
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=== generate_orphan.py ===\n")
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(ORPHAN, f, separators=(",", ":"), ensure_ascii=False)
    size_b = os.path.getsize(OUT_PATH)
    print(f"Wrote {OUT_PATH}  ({size_b} bytes)")
    print(f"  {len(ORPHAN)} entries:")
    for k, v in ORPHAN.items():
        label = f"  fromYear={v['fromYear']}→toYear={v['toYear']}" if "fromYear" in v else ""
        print(f"    {k}  mwe={v['mwe']}{label}")
    print("Done.")

if __name__ == "__main__":
    main()
