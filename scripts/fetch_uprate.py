#!/usr/bin/env python3
"""
fetch_uprate.py — Refresh data/uprate.json from FAI playbook + NRC data
========================================================================
Updates two derived fields in uprate.json:
  • add      — theoretical uprate potential (MWt) from FAI State Permitting Playbook
  • doneMWt  — NRC-approved uprate total (MWt) per site (hardcoded from NRC approved
               applications page; update DONE_NRC below when NRC approves new uprates)

Also sets/clears the `proposed` flag from data/nrc_pipeline.json (expected applications).

All other fields (d, mwt, mkt, u, units, restart, retYear, restartYear, note) are
preserved from existing uprate.json unchanged.

Usage:
    python3 scripts/fetch_uprate.py

Requirements:
    pip install pdfplumber

FAI playbook PDF URL (auto-fetched):
    https://cdn.sanity.io/files/d8lrla4f/staging/9e2a5353446351e4bde9480b6610f905b49106aa.pdf

When the FAI playbook is updated, re-run this script to pick up new 'add' values.
When NRC approves new uprate applications, update the DONE_NRC dict below and re-run.
"""

import json
import os
import re
import sys
import urllib.request

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber not installed. Run: pip install pdfplumber")

REPO_ROOT     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPRATE_PATH   = os.path.join(REPO_ROOT, "data", "uprate.json")
PIPELINE_PATH = os.path.join(REPO_ROOT, "data", "nrc_pipeline.json")
PDF_CACHE     = os.path.join(REPO_ROOT, "_fai_playbook_cache.pdf")   # gitignored temp file

FAI_PDF_URL = (
    "https://cdn.sanity.io/files/d8lrla4f/staging/"
    "9e2a5353446351e4bde9480b6610f905b49106aa.pdf"
)

# ─────────────────────────────────────────────────────────────────────────────
# DOCKET → site coordinate mapping
# Each docket number maps to the lat/lon key used in uprate.json.
# Source: FAI Appendix B docket numbers matched to NRC plant coordinates.
# Retired / restart plants not in FAI are handled separately (see RESTART_PLANTS).
# ─────────────────────────────────────────────────────────────────────────────

DOCKET_TO_COORD = {
    # Alabama
    "05000348": "31.221,-85.112",   "05000364": "31.221,-85.112",   # Farley 1+2
    "05000259": "34.706,-87.113",   "05000260": "34.706,-87.113",   # Browns Ferry 1+2
    "05000296": "34.706,-87.113",                                    # Browns Ferry 3
    # Arkansas
    "05000313": "35.322,-93.226",   "05000368": "35.322,-93.226",   # ANO 1+2
    # Arizona
    "05000528": "33.392,-112.858",  "05000529": "33.392,-112.858",  # Palo Verde 1+2
    "05000530": "33.392,-112.858",                                   # Palo Verde 3
    # California
    "05000275": "35.203,-120.860",  "05000323": "35.203,-120.860",  # Diablo Canyon 1+2
    # Connecticut
    "05000336": "41.295,-72.156",   "05000423": "41.295,-72.156",   # Millstone 2+3
    # Florida
    "05000335": "27.346,-80.259",   "05000389": "27.346,-80.259",   # St. Lucie 1+2
    "05000250": "25.448,-80.330",   "05000251": "25.448,-80.330",   # Turkey Point 3+4
    # Georgia
    "05000321": "31.923,-82.347",   "05000366": "31.923,-82.347",   # Hatch 1+2
    "05000424": "33.144,-81.746",   "05000425": "33.144,-81.746",   # Vogtle 1+2
    "05200025": "33.144,-81.746",   "05200026": "33.144,-81.746",   # Vogtle 3+4
    # Illinois
    "05000456": "41.230,-88.222",   "05000457": "41.230,-88.222",   # Braidwood 1+2
    "05000454": "42.063,-89.275",   "05000455": "42.063,-89.275",   # Byron 1+2
    "05000373": "41.235,-88.654",   "05000374": "41.235,-88.654",   # La Salle 1+2
    "05000254": "41.722,-90.295",   "05000265": "41.722,-90.295",   # Quad Cities 1+2
    "05000461": "40.164,-88.825",                                    # Clinton
    "05000237": "41.397,-88.272",   "05000249": "41.397,-88.272",   # Dresden 2+3
    # Kansas
    "05000482": "38.249,-95.701",                                    # Wolf Creek
    # Louisiana
    "05000458": "30.763,-91.319",                                    # River Bend
    "05000382": "29.988,-90.483",                                    # Waterford 3
    # Maryland
    "05000317": "38.438,-76.455",   "05000318": "38.438,-76.455",   # Calvert Cliffs 1+2
    # Michigan
    "05000315": "41.961,-86.555",   "05000316": "41.961,-86.555",   # D.C. Cook 1+2
    "05000341": "41.977,-83.260",                                    # Fermi 2
    # Minnesota
    "05000263": "45.322,-93.866",                                    # Monticello
    "05000282": "44.610,-92.622",   "05000306": "44.610,-92.622",   # Prairie Island 1+2
    # Mississippi
    "05000416": "32.010,-91.062",                                    # Grand Gulf
    # Missouri
    "05000483": "38.772,-91.772",                                    # Callaway
    # Nebraska
    "05000298": "40.354,-95.647",                                    # Cooper
    # New Hampshire
    "05000443": "42.894,-70.850",                                    # Seabrook
    # New Jersey
    "05000354": "39.461,-75.535",                                    # Hope Creek
    "05000272": "39.461,-75.535",   "05000311": "39.461,-75.535",   # Salem 1+2
    # New York
    "05000333": "43.526,-76.425",                                    # FitzPatrick
    "05000244": "43.276,-77.309",                                    # Ginna
    "05000220": "43.526,-76.425",   "05000410": "43.526,-76.425",   # Nine Mile Pt 1+2
    # North Carolina
    "05000369": "35.435,-80.957",   "05000370": "35.435,-80.957",   # McGuire 1+2
    "05000400": "35.641,-78.951",                                    # Shearon Harris
    "05000324": "33.965,-78.005",   "05000325": "33.965,-78.005",   # Brunswick 1+2
    # Ohio
    "05000346": "41.601,-83.083",                                    # Davis-Besse
    "05000440": "41.793,-81.136",                                    # Perry
    # Pennsylvania
    "05000334": "40.628,-80.436",   "05000412": "40.628,-80.436",   # Beaver Valley 1+2
    "05000352": "40.220,-75.585",   "05000353": "40.220,-75.585",   # Limerick 1+2
    "05000277": "39.763,-76.270",   "05000278": "39.763,-76.270",   # Peach Bottom 2+3
    "05000387": "41.099,-76.148",   "05000388": "41.099,-76.148",   # Susquehanna 1+2
    # South Carolina
    "05000269": "34.803,-82.894",   "05000270": "34.803,-82.894",   # Oconee 1+2
    "05000287": "34.803,-82.894",                                    # Oconee 3
    "05000261": "34.408,-80.154",                                    # Robinson 2
    "05000395": "34.309,-81.304",                                    # Summer
    "05000413": "35.042,-81.077",   "05000414": "35.042,-81.077",   # Catawba 1+2
    # Tennessee
    "05000327": "35.231,-85.078",   "05000328": "35.231,-85.078",   # Sequoyah 1+2
    "05000390": "35.606,-84.781",   "05000391": "35.606,-84.781",   # Watts Bar 1+2
    # Texas
    "05000445": "32.308,-97.775",   "05000446": "32.308,-97.775",   # Comanche Peak 1+2
    "05000498": "28.796,-96.062",   "05000499": "28.796,-96.062",   # South Texas 1+2
    # Virginia
    "05000338": "38.066,-77.795",   "05000339": "38.066,-77.795",   # North Anna 1+2
    "05000280": "37.151,-76.691",   "05000281": "37.151,-76.691",   # Surry 1+2
    # Washington
    "05000397": "46.457,-119.337",                                   # Columbia
    # Wisconsin
    "05000266": "44.289,-87.527",   "05000301": "44.289,-87.527",   # Point Beach 1+2
}

# ─────────────────────────────────────────────────────────────────────────────
# NRC-approved uprate totals (MWt) per site
# Source: https://www.nrc.gov/reactors/operating/licensing/power-uprates/
#         status-power-apps/approved-applications.html  (retrieved Apr 2026)
# UPDATE THIS when the NRC approves new uprate applications.
# Retired plants (Indian Point) are intentionally excluded.
# Restart plants with no approved uprates are intentionally excluded.
# ─────────────────────────────────────────────────────────────────────────────

DONE_NRC = {
    "25.448,-80.330":  888,    # Turkey Point 3+4
    "27.346,-80.259":  920,    # St. Lucie 1+2
    "28.796,-96.062":  106,    # South Texas 1+2
    "29.988,-90.483":  326,    # Waterford 3
    "30.763,-91.319":  197,    # River Bend
    "31.221,-85.112":  338,    # Farley 1+2
    "31.923,-82.347":  736,    # Hatch 1+2
    "32.010,-91.062":  575,    # Grand Gulf
    "32.308,-97.775":  402,    # Comanche Peak 1+2
    "33.144,-81.746":  429.2,  # Vogtle 1+2 (W 4-Loop only; AP1000 units not uprated)
    "33.392,-112.858": 570,    # Palo Verde 1+2+3
    "33.965,-78.005":  974,    # Brunswick 1+2
    "34.309,-81.304":  125,    # V.C. Summer
    "34.408,-80.154":  139,    # H.B. Robinson
    "34.706,-87.113": 1977,    # Browns Ferry 1+2+3
    "34.803,-82.894":  126,    # Oconee 1+2+3
    "35.042,-81.077":  116,    # Catawba 1+2
    "35.203,-120.860":  73,    # Diablo Canyon 1 only (Unit 2 has no approved uprate yet)
    "35.231,-85.078":   88,    # Sequoyah 1+2
    "35.322,-93.226":  211,    # ANO 1+2
    "35.435,-80.957":  116,    # McGuire 1+2
    "35.606,-84.781":   96,    # Watts Bar 1+2
    "35.641,-78.951":  173,    # Shearon Harris
    "37.151,-76.691":  292,    # Surry 1+2
    "38.066,-77.795":  336,    # North Anna 1+2
    "38.249,-95.701":  154,    # Wolf Creek
    "38.438,-76.455":  354,    # Calvert Cliffs 1+2
    "38.772,-91.772":  154,    # Callaway
    "39.461,-75.535":  778,    # Salem 1+2 + Hope Creek
    "39.763,-76.270": 1446,    # Peach Bottom 2+3
    "40.164,-88.825":  579,    # Clinton
    "40.220,-75.585":  444,    # Limerick 1+2
    "40.354,-95.647":   38,    # Cooper
    "40.628,-80.436":  496,    # Beaver Valley 1+2
    "41.099,-76.148": 1318,    # Susquehanna 1+2
    "41.230,-88.222":  468,    # Braidwood 1+2
    "41.235,-88.654":  446,    # LaSalle 1+2
    "41.295,-72.156":  438,    # Millstone 2+3
    "41.397,-88.272":  860,    # Dresden 2+3
    "41.601,-83.083":   45,    # Davis-Besse
    "41.722,-90.295":  892,    # Quad Cities 1+2
    "41.793,-81.136":  179,    # Perry
    "41.961,-86.555":  111,    # D.C. Cook 1+2
    "41.977,-83.260":  193,    # Fermi 2
    "42.063,-89.275":  468,    # Byron 1+2
    "42.894,-70.850":  237,    # Seabrook
    "43.276,-77.309":  255,    # Ginna
    "43.526,-76.425":  765,    # Nine Mile Pt 2 + FitzPatrick
    "44.289,-87.527":  563,    # Point Beach 1+2
    "44.610,-92.622":   54,    # Prairie Island 1+2
    "45.322,-93.866":  334,    # Monticello
    "46.457,-119.337": 221,    # Columbia
}

# ─────────────────────────────────────────────────────────────────────────────
# Plant names that match NRC pipeline "plant" field → site coordinates
# Used to set `proposed` flag from nrc_pipeline.json expected applications.
# Key: lowercase partial plant name; value: site coord in uprate.json.
# ─────────────────────────────────────────────────────────────────────────────

PIPELINE_PLANT_TO_COORD = {
    "brunswick 1":  "33.965,-78.005",
    "brunswick 2":  "33.965,-78.005",
    "wolf creek":   "38.249,-95.701",
    "mcguire 1":    "35.435,-80.957",
    "mcguire 2":    "35.435,-80.957",
    "salem 1":      "39.461,-75.535",
    "salem 2":      "39.461,-75.535",
    "hatch 1":      "31.923,-82.347",
    "hatch 2":      "31.923,-82.347",
    "columbia":     "46.457,-119.337",
    "catawba 1":    "35.042,-81.077",
    "vogtle unit 1":"33.144,-81.746",
    "vogtle unit 2":"33.144,-81.746",
    "perry 1":      "41.793,-81.136",
    "beaver valley 1": "40.628,-80.436",
    "beaver valley 2": "40.628,-80.436",
    "davis besse":  "41.601,-83.083",
    "davis-besse":  "41.601,-83.083",
}

# ─────────────────────────────────────────────────────────────────────────────
# FAI PDF parsing
# ─────────────────────────────────────────────────────────────────────────────

def fetch_fai_pdf():
    """Fetch the FAI playbook PDF; use cache if present and < 30 days old."""
    import time
    if os.path.exists(PDF_CACHE):
        age_days = (time.time() - os.path.getmtime(PDF_CACHE)) / 86400
        if age_days < 30:
            print(f"  Using cached FAI PDF ({age_days:.0f} days old): {PDF_CACHE}")
            return PDF_CACHE
    print(f"  Fetching FAI PDF from {FAI_PDF_URL} ...")
    req = urllib.request.Request(FAI_PDF_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(PDF_CACHE, "wb") as f:
        f.write(data)
    print(f"  Saved {len(data)//1024} KB → {PDF_CACHE}")
    return PDF_CACHE


def parse_fai_appendix_b(pdf_path):
    """
    Parse FAI Appendix B 'Nuclear Uprates Calculator' table.

    Returns dict: {docket: {ref_cap, current_uprate, theoretical_cap, add_mwt}}

    The PDF lays out each plant as two text lines before the numbers:
      Line 1: "Plant Name N"
      Line 2: "ST  ref  current_frac  theoretical_frac  add_mwt"
      Line 3: "0500xxxx"   ← docket number

    We use raw text extraction (not table extraction) because pdfplumber's
    table parser doesn't reliably split the multi-line layout.
    """
    records = {}

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        in_appendix = False
        for page in pdf.pages:
            text = page.extract_text() or ""
            if "Appendix B" in text:
                in_appendix = True
            if in_appendix:
                full_text += "\n" + text

    # Each plant block looks like (after stripping the repeated header):
    #   Farley 1\nAL 2775 0.062736 0.2 358.4216588\n05000348
    # Strip repeated page headers
    full_text = re.sub(
        r"PLANT NAME\s+REFERENCE\s+CURRENT\s+THEORETICAL.*?ADDITION \(MWT\)",
        "", full_text, flags=re.DOTALL
    )
    full_text = re.sub(r"The State Permitting Playbook.*?thefai\.org\s*\d*", "", full_text)
    full_text = re.sub(r"Appendix B\s*Nuclear Uprates Calculator", "", full_text)
    full_text = re.sub(r"THEORETICAL\s*", "", full_text)

    # Match pattern: state + 4 numbers + docket on the line after
    # Pattern: 2-letter state, ref_cap (int), current_uprate (float), theo_cap (float|N/A), add (float)
    pattern = re.compile(
        r"([A-Z]{2})\s+"            # state abbr
        r"(\d+)\s+"                 # reference capacity (MWt)
        r"([\d.]+)\s+"              # current uprate fraction
        r"([\d.]+|N/A)\s+"          # theoretical uprate cap (or N/A for AP1000)
        r"([\d.]+)\s*\n"            # theoretical capacity addition (MWt)
        r"\s*(0\d{6,7})",           # docket number on next line
        re.MULTILINE
    )

    for m in pattern.finditer(full_text):
        _state, ref_cap, cur, theo, add, docket = m.groups()
        records[docket] = {
            "ref_cap":        float(ref_cap),
            "current_uprate": float(cur),
            "theoretical_cap": None if theo == "N/A" else float(theo),
            "add_mwt":        float(add),
        }

    return records


# ─────────────────────────────────────────────────────────────────────────────
# Proposed flag from nrc_pipeline.json
# ─────────────────────────────────────────────────────────────────────────────

def proposed_coords_from_pipeline(pipeline_path):
    """
    Return set of coord keys for sites with planned EPU or SPU applications.

    MUR (Measurement Uncertainty Recapture) applications are intentionally
    excluded — they are administrative precision fixes, not real capacity
    additions, and would create misleading green rings on plants that are
    already at theoretical uprate capacity.
    """
    if not os.path.exists(pipeline_path):
        print("  WARNING: nrc_pipeline.json not found — skipping proposed flags")
        return set()

    with open(pipeline_path) as f:
        pipe = json.load(f)

    proposed = set()
    for app in pipe.get("applications", []):
        plant_name = app.get("plant", "").strip().lower()
        uprate_type = app.get("type", "").strip()
        # Skip proprietary entries and MUR-only applications
        if plant_name in ("", "proprietary"):
            continue
        if uprate_type == "Measurement Uncertainty Recapture":
            continue   # MUR = administrative precision fix, not a real capacity add
        for key, coord in PIPELINE_PLANT_TO_COORD.items():
            if key in plant_name or plant_name in key:
                proposed.add(coord)
                break

    return proposed


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=== fetch_uprate.py ===\n")

    # 1. Load existing uprate.json
    print("Loading existing uprate.json ...")
    with open(UPRATE_PATH) as f:
        uprate = json.load(f)
    print(f"  {len(uprate)} sites loaded")

    # 2. Fetch + parse FAI PDF
    print("\nFetching FAI State Permitting Playbook ...")
    pdf_path = fetch_fai_pdf()

    print("Parsing FAI Appendix B ...")
    fai = parse_fai_appendix_b(pdf_path)
    print(f"  {len(fai)} docket records parsed")

    # 3. Aggregate FAI 'add' by site coordinate
    add_by_coord = {}
    unmatched_dockets = []
    for docket, rec in fai.items():
        coord = DOCKET_TO_COORD.get(docket)
        if coord is None:
            unmatched_dockets.append(docket)
            continue
        add_by_coord.setdefault(coord, 0.0)
        add_by_coord[coord] += rec["add_mwt"]

    if unmatched_dockets:
        print(f"  WARNING: {len(unmatched_dockets)} unmatched dockets: {unmatched_dockets}")

    # 4. Load nrc_pipeline.json → determine proposed coords
    print("\nDeriving proposed flags from nrc_pipeline.json ...")
    proposed_coords = proposed_coords_from_pipeline(PIPELINE_PATH)
    print(f"  {len(proposed_coords)} sites flagged as proposed")

    # 5. Apply updates
    print("\nApplying updates to uprate.json ...")
    add_updated, done_updated, proposed_set, proposed_cleared = 0, 0, 0, 0

    for coord, site in uprate.items():
        # 5a. Update 'add' from FAI
        if coord in add_by_coord:
            if "units" in site:
                # Site has per-unit detail: keep existing per-unit add values
                # (they already have manual corrections, e.g. Catawba 2 UNIT_ADD_FIX),
                # and recompute site-level add as sum of units.
                new_add = round(sum(u.get("add", 0) for u in site["units"]), 4)
            else:
                new_add = round(add_by_coord[coord], 4)
            if site.get("add") != new_add:
                site["add"] = new_add
                add_updated += 1

        # 5b. Update 'doneMWt' from DONE_NRC
        if coord in DONE_NRC:
            new_done = DONE_NRC[coord]
            if site.get("doneMWt") != new_done:
                site["doneMWt"] = new_done
                done_updated += 1

        # 5c. Set/clear 'proposed' flag from pipeline
        # Only touch proposed flag for non-restart plants
        if not site.get("restart"):
            if coord in proposed_coords:
                if not site.get("proposed"):
                    site["proposed"] = True
                    proposed_set += 1
            else:
                if site.get("proposed"):
                    del site["proposed"]
                    proposed_cleared += 1

    print(f"  add updated:      {add_updated} sites")
    print(f"  doneMWt updated:  {done_updated} sites")
    print(f"  proposed set:     {proposed_set} sites")
    print(f"  proposed cleared: {proposed_cleared} sites")

    # 6. Write updated uprate.json
    with open(UPRATE_PATH, "w") as f:
        json.dump(uprate, f, indent=2, ensure_ascii=False)
    size_kb = os.path.getsize(UPRATE_PATH) / 1024
    print(f"\nWrote {UPRATE_PATH}  ({size_kb:.0f} KB)")
    print("Done.")


def _find_unit_docket(unit_name, coord):
    """Try to look up the docket for a named unit at a given site."""
    # Build reverse: (coord, unit_name_fragment) → docket
    # This is a best-effort heuristic for per-unit add updates
    unit_lower = unit_name.lower()
    for docket, c in DOCKET_TO_COORD.items():
        if c != coord:
            continue
        # Use docket suffixes as a rough match (not robust, but harmless)
    return None   # Per-unit docket lookup not implemented; site-level is sufficient


if __name__ == "__main__":
    main()
