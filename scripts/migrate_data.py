#!/usr/bin/env python3
"""
migrate_data.py — Regenerate automated data/  files from archived JS sources
=============================================================================
Reads _archive/data.js and _archive/scenario-data.js (frozen WISdom outputs)
and writes the 10 automated JSON files to data/.

Safe to re-run anytime — NEVER touches manually curated files:
    data/uprate.json, data/orphan.json, data/state_policy.json,
    data/nrc_pipeline.json

Use this to recover the WISdom data files if they are lost or corrupted.

Usage:
    python3 scripts/migrate_data.py

Output files written to data/:
    plants.json           — WISdom plant siting per scenario/year (DATA.g)
    coal_sites.json       — Coal conversion sites per scenario (DATA.c)
    state_capacity.json   — Per-state capacity by tech/year/scenario (SC)
    state_scenarios.json  — State projections: reactors, jobs, capital (SD)
    geodata.json          — US states GeoJSON for map rendering (GD)
    national.json         — National aggregates: capacity, jobs, retail, syscost
    nuclear_detail.json   — Per-state nuclear project economics (ND)
    state_investment.json — State-level capital investment (STATE_INV)
    dispatch.json         — Dispatch data by scenario (DISP)
    plant_meta.json       — Plant names + state mapping (PN + PSTATE)
"""

import json
import os
import re

REPO_ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVE_DIR = os.path.join(REPO_ROOT, "_archive")
DATA_DIR    = os.path.join(REPO_ROOT, "data")
os.makedirs(DATA_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# Extraction helpers
# ─────────────────────────────────────────────────────────────────────────────

def extract_js_vars(js_path):
    """
    Extract all `const VARNAME = VALUE;` declarations from a JS file.
    Returns dict of {varname: parsed_python_object}.

    Handles one quirk: DATA = {g:..., c:...} uses unquoted JS object keys.
    The regex below quotes any bare identifier key (k:) that isn't already
    preceded by a double-quote, making it valid JSON.
    """
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all `const NAME =` positions
    pattern = re.compile(r"const ([A-Z_]+)\s*=\s*")
    matches = list(pattern.finditer(content))

    result = {}
    for i, m in enumerate(matches):
        name  = m.group(1)
        start = m.end()
        end   = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        raw   = content[start:end].rstrip().rstrip(";").rstrip()

        # Quote any unquoted JS object key:  {key:  or  ,key:
        # Only matches bare identifiers not already preceded by `"`
        fixed = re.sub(
            r'([{,])\s*([A-Za-z_]\w*)\s*:',
            lambda mo: mo.group(1) + '"' + mo.group(2) + '":',
            raw
        )

        result[name] = json.loads(fixed)

    return result


def write_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)
    size_kb = os.path.getsize(path) / 1024
    print(f"  {filename:35s}  {size_kb:7.0f} KB")
    return path


# ─────────────────────────────────────────────────────────────────────────────
# Extract source files
# ─────────────────────────────────────────────────────────────────────────────

print("=== Extracting _archive/data.js ===")
dv = extract_js_vars(os.path.join(ARCHIVE_DIR, "data.js"))
print(f"  Variables found: {list(dv.keys())}")

print("\n=== Extracting _archive/scenario-data.js ===")
sv = extract_js_vars(os.path.join(ARCHIVE_DIR, "scenario-data.js"))
print(f"  Variables found: {list(sv.keys())}")


# ─────────────────────────────────────────────────────────────────────────────
# Write automated files (sourced entirely from WISdom)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Writing automated JSON files ===")

# WISdom plant siting: {scenario → {year → [[lat, lon, total_MW, dom_tech, {tech: MW}], ...]}}
write_json("plants.json",          dv["DATA"]["g"])

# Coal conversion sites: {scenario → [[lat, lon, name, state, orig_cap, new_cap, orig_tech, new_tech, decom_yr, conv_yr], ...]}
write_json("coal_sites.json",      dv["DATA"]["c"])

# State capacity by tech: {scenario → {state → {year → {tech: MW, capNuke, capTotal, jobsNuke, jobsTotal}}}}
write_json("state_capacity.json",  dv["SC"])

# State scenario projections: {scenario → {state → {year → {capTotal, capNuke, reactors, rTotal, jobsNuke, jobsTotal}}}}
write_json("state_scenarios.json", sv["SD"])

# US states GeoJSON (static boundary data for map rendering)
write_json("geodata.json",         sv["GD"])

# Nuclear project economics by state: {scenario → {state → {year → {SMR/ARTES/HTGR: {roi, inv, rev, jobs}}}}}
write_json("nuclear_detail.json",  sv["ND"])

# State-level capital investment: {state_abbr → {scenario → {year → value}}}
write_json("state_investment.json", sv["STATE_INV"])

# Dispatch data: {scenario → [{tech: TWh, ...}, ...]}  (one entry per year)
write_json("dispatch.json",        sv["DISP"])

# National aggregates — bundle NAT, NAT_JOBS, RETAIL, SYSCOST together
national = {
    "capacity":   sv["NAT"],       # {scenario → {year → {tech: MW}}}
    "adv_nuke_jobs": sv["NAT_JOBS"], # {scenario → {year → jobs}}
    "retail_price":  sv["RETAIL"],  # {scenario → {year → ¢/kWh}}
    "system_cost":   sv["SYSCOST"], # {scenario → {year → $/MWh}}
}
write_json("national.json", national)


# Plant names + state mapping (from Plant Names spreadsheet tab)
plant_meta = {
    "names":  dv["PN"],      # {"lat,lon": "Plant Name"}
    "states": dv["PSTATE"],  # {"lat,lon": "State Name"}
}
write_json("plant_meta.json", plant_meta)


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

AUTO_FILES = [
    "plants.json", "coal_sites.json", "state_capacity.json",
    "state_scenarios.json", "geodata.json", "national.json",
    "nuclear_detail.json", "state_investment.json", "dispatch.json",
    "plant_meta.json",
]
MANUAL_FILES = ["uprate.json", "orphan.json", "state_policy.json", "nrc_pipeline.json"]

print("\n=== Done ===")
total_kb = sum(
    os.path.getsize(os.path.join(DATA_DIR, f)) / 1024
    for f in AUTO_FILES
    if os.path.exists(os.path.join(DATA_DIR, f))
)
print(f"  {len(AUTO_FILES)} automated files written  ({total_kb/1024:.1f} MB)")
print(f"  {len(MANUAL_FILES)} manual files untouched: {', '.join(MANUAL_FILES)}")
