#!/usr/bin/env python3
"""
migrate_data.py — ONE-TIME data migration script
=================================================
Extracts all data from data.js and scenario-data.js into clean JSON files
in the data/ folder. Run once, then retire. All future data edits go directly
to data/*.json files in the repo — no Google Drive needed after this runs.

Usage:
    python3 migrate_data.py

Output files (data/*.json):
    Automated (from WISdom via data.js / scenario-data.js):
        plants.json         — WISdom plant siting per scenario/year (DATA.g)
        coal_sites.json     — Coal conversion sites per scenario (DATA.c)
        state_capacity.json — Per-state capacity by tech/year/scenario (SC)
        state_scenarios.json— State projections: reactors, jobs, capital (SD)
        geodata.json        — US states GeoJSON for map rendering (GD)
        national.json       — National aggregates: capacity, jobs, retail, syscost
        nuclear_detail.json — Per-state nuclear project economics (ND)
        state_investment.json — State-level capital investment (STATE_INV)
        dispatch.json       — Dispatch data by scenario (DISP)

    Manually curated (hand-verified, edit directly in repo):
        plant_meta.json     — Plant names + state mapping (PN + PSTATE)
        uprate.json         — Uprate headroom + NRC corrections (UR)
        orphan.json         — Plants missing/mishandled by WISdom (ORPHAN)
        state_policy.json   — State nuclear policy climate (SR)
        nrc_pipeline.json   — NRC expected uprate applications 2026-2032
"""

import json
import os
import re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(REPO_ROOT, "data")
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

print("=== Extracting data.js ===")
dv = extract_js_vars(os.path.join(REPO_ROOT, "data.js"))
print(f"  Variables found: {list(dv.keys())}")

print("\n=== Extracting scenario-data.js ===")
sv = extract_js_vars(os.path.join(REPO_ROOT, "scenario-data.js"))
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


# ─────────────────────────────────────────────────────────────────────────────
# Write manually curated files (hand-verified — edit these directly in repo)
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Writing manually curated JSON files ===")

# Plant names + state mapping (from Plant Names spreadsheet tab)
plant_meta = {
    "names":  dv["PN"],      # {"lat,lon": "Plant Name"}
    "states": dv["PSTATE"],  # {"lat,lon": "State Name"}
}
write_json("plant_meta.json",   plant_meta)

# Uprate data — see uprate.json comments for field schema
# Source: FAI State Permitting Playbook (Nov 2025) + NRC approved applications
# NRC corrections are hardcoded in build_data.py:apply_unit_d_overrides()
write_json("uprate.json",       dv["UR"])

# ORPHAN plants — absent from or mishandled by WISdom DATA.g
# Edit directly to add/remove plants (e.g. Duane Arnold restart)
write_json("orphan.json",       dv["ORPHAN"])

# State nuclear policy climate
# Source: NCSL state restrictions + BTI research (updated Apr 2026)
write_json("state_policy.json", dv["SR"])


# ─────────────────────────────────────────────────────────────────────────────
# NRC Pipeline — semi-manual (from NRC Expected Applications page)
# Source: https://www.nrc.gov/reactors/operating/licensing/power-uprates/status-power-apps/expected-applications.html
# Last retrieved: Apr 2026
# Edit directly in repo when NRC updates their page
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Writing NRC pipeline file ===")

NRC_PIPELINE = {
    "_meta": {
        "source": "NRC Expected Applications for Power Uprates",
        "url": "https://www.nrc.gov/reactors/operating/licensing/power-uprates/status-power-apps/expected-applications.html",
        "retrieved": "2026-04",
        "units": "MWe (converted from MWt at 33% efficiency)"
    },
    # Cumulative MWe added each year from NRC expected applications
    # Used in the uprate tab analysis charts
    "cumulative_mwe_by_year": {
        "2026": 335,
        "2027": 1210,
        "2028": 1845,
        "2029": 2042,
        "2030": 2291,
        "2031": 2357,
        "2032": 2422
    },
    # DOE UPRISE program targets
    "doe_targets": {
        "2027": 2500,   # 2.5 GW interim goal
        "2029": 5000    # 5 GW final goal
    },
    # Individual planned applications
    "applications": [
        {"plant": "McGuire",       "state": "NC", "type": "EPU",    "year_expected": 2026, "mwe_approx": 97},
        {"plant": "Hatch",         "state": "GA", "type": "EPU",    "year_expected": 2026, "mwe_approx": 55},
        {"plant": "Columbia",      "state": "WA", "type": "EPU",    "year_expected": 2026, "mwe_approx": 104},
        {"plant": "Catawba",       "state": "SC", "type": "EPU",    "year_expected": 2026, "mwe_approx": 79},
        {"plant": "Vogtle 1+2",    "state": "GA", "type": "EPU",    "year_expected": 2027, "mwe_approx": 292},
        {"plant": "Beaver Valley", "state": "PA", "type": "EPU",    "year_expected": 2027, "mwe_approx": 248},
        {"plant": "Davis-Besse",   "state": "OH", "type": "EPU",    "year_expected": 2028, "mwe_approx": 202},
        {"plant": "Perry",         "state": "OH", "type": "EPU",    "year_expected": 2029, "mwe_approx": 32}
    ]
}

write_json("nrc_pipeline.json", NRC_PIPELINE)


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

print("\n=== Migration complete ===")
files = sorted(os.listdir(DATA_DIR))
total_kb = sum(os.path.getsize(os.path.join(DATA_DIR, f)) / 1024 for f in files)
print(f"  {len(files)} files in data/,  total {total_kb/1024:.1f} MB")
print("\nNext steps:")
print("  1. Verify data/uprate.json and data/orphan.json look correct")
print("  2. git add data/ migrate_data.py && git commit")
print("  3. Rebuild index.html to load from data/*.json via fetch()")
print("  4. Retire data.js, scenario-data.js, build_data.py")
