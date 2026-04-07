#!/usr/bin/env python3
"""
build_data.py — Nuclear Map Data Pipeline
Auto-generates data.js from source Excel/CSV files.

Usage:
    python3 build_data.py
"""

import json
import math
import os
from datetime import datetime

import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────

XLSX_INTERACTIVE = (
    "/Users/joyjiang/Library/CloudStorage/GoogleDrive-joy@thebreakthrough.org/"
    "Shared drives/Nuclear/Projects/2022/Advancing Nuclear Report (2022)/"
    "Interactive_Tool/nuclear_interactive_tool_data.xlsx"
)

SITING_IMAGES_BASE = (
    "/Users/joyjiang/Library/CloudStorage/GoogleDrive-joy@thebreakthrough.org/"
    "Shared drives/Nuclear/Projects/2022/Advancing Nuclear Report (2022)/"
    "WISdom outputs/Siting/Siting Images/"
)

SITING_CONV_BASE = (
    "/Users/joyjiang/Library/CloudStorage/GoogleDrive-joy@thebreakthrough.org/"
    "Shared drives/Nuclear/Projects/2022/Advancing Nuclear Report (2022)/"
    "WISdom outputs/Siting/"
)

SPREADSHEETS_BASE = (
    "/Users/joyjiang/Library/CloudStorage/GoogleDrive-joy@thebreakthrough.org/"
    "Shared drives/Nuclear/Projects/2022/Advancing Nuclear Report (2022)/"
    "WISdom outputs/Spreadsheets/"
)

OUTPUT_JS = "/private/tmp/advancing-nuclear-map/data.js"

# ─────────────────────────────────────────────────────────────────────────────
# Scenario / year constants
# ─────────────────────────────────────────────────────────────────────────────

SCENARIOS = ["LowCost LowLR", "LowCost HighLR", "HighCost LowLR", "HighCost HighLR"]

# N → year (files are numbered 1–7)
N_TO_YEAR = {1: "2020", 2: "2025", 3: "2030", 4: "2035", 5: "2040", 6: "2045", 7: "2050"}
YEARS = ["2020", "2025", "2030", "2035", "2040", "2045", "2050"]

# Scenario key → underscore form used in filenames
SCENARIO_FILE_KEY = {
    "LowCost LowLR":   "LowCost_LowLR",
    "LowCost HighLR":  "LowCost_HighLR",
    "HighCost LowLR":  "HighCost_LowLR",
    "HighCost HighLR": "HighCost_HighLR",
}

# Tech CSV column → JS key
TECH_COL_MAP = {
    "Coal":    "Coal",
    "NGCC":    "NG CC",
    "NGCT":    "NG GT",
    "Storage": "UtilStorage",
    "Nuclear": "Nuclear",
    "Hydro":   "Hydro",
    "Wind":    "Wind",
    "Offshore":"Offshore",
    "DPV":     "DPV",
    "UPV":     "UPV",
    "CSP":     "CSP",
    "Geo/Bio": "Geo/Bio",
    "CCS":     "CCS",
    "SMR":     "SMR",
    "ARTES":   "ARTES",
    "HTGR":    "HTGR",
}
TECH_COLS = list(TECH_COL_MAP.keys())
TECHS_CONV = ["ARTES", "SMR", "HTGR"]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def clean_val(v):
    """Return None if NaN/inf/None, else v unchanged."""
    if v is None:
        return None
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return None
    except (TypeError, ValueError):
        pass
    return v


def safe_int(v):
    v = clean_val(v)
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def fmt_key(lat, lon):
    """Format lat/lon as '%.3f,%.3f'."""
    return f"{float(lat):.3f},{float(lon):.3f}"


# ─────────────────────────────────────────────────────────────────────────────
# A. nuclear_interactive_tool_data.xlsx
# ─────────────────────────────────────────────────────────────────────────────

def build_plant_names_and_pstate():
    df = pd.read_excel(XLSX_INTERACTIVE, sheet_name="Plant Names")
    PN, PSTATE = {}, {}
    for _, row in df.iterrows():
        lat, lon = clean_val(row["Lat"]), clean_val(row["Lon"])
        name = clean_val(row["Plant Name"])
        if lat is None or lon is None or name is None:
            continue
        key = fmt_key(lat, lon)
        PN[key] = str(name)
        state = row.get("State")
        if clean_val(state) is not None:
            PSTATE[key] = str(state)
    print(f"  PN: {len(PN)}, PSTATE: {len(PSTATE)}")
    return PN, PSTATE


def build_per_unit_detail():
    df = pd.read_excel(XLSX_INTERACTIVE, sheet_name="Per-Unit Detail")
    units_by_key = {}
    for _, row in df.iterrows():
        lat, lon = clean_val(row["Lat"]), clean_val(row["Lon"])
        if lat is None or lon is None:
            continue
        key = fmt_key(lat, lon)
        unit = {}
        name = clean_val(row.get("Unit Name"))
        if name is not None:
            unit["name"] = str(name)
        mwt = clean_val(row.get("Thermal Capacity (MWt)"))
        if mwt is not None:
            unit["mwt"] = float(mwt)
        add = clean_val(row.get("Uprate Potential (MWt)"))
        if add is not None:
            unit["add"] = float(add)
        units_by_key.setdefault(key, []).append(unit)
    print(f"  Per-unit plants: {len(units_by_key)}")
    return units_by_key


def build_ur(units_by_key):
    df = pd.read_excel(XLSX_INTERACTIVE, sheet_name="Uprate Data")
    UR = {}
    for _, row in df.iterrows():
        lat, lon = clean_val(row["Lat"]), clean_val(row["Lon"])
        if lat is None or lon is None:
            continue
        key = fmt_key(lat, lon)
        e = {}
        rtype = clean_val(row.get("Reactor Type"))
        if rtype is not None:
            e["d"] = str(rtype)
        u = clean_val(row.get("Uprate Potential (MWe, est.)"))
        if u is not None:
            e["u"] = float(u)
        mwt = clean_val(row.get("Thermal Capacity (MWt)"))
        if mwt is not None:
            e["mwt"] = float(mwt)
        add = clean_val(row.get("Uprate Potential (MWt)"))
        if add is not None:
            e["add"] = float(add)
        mkt = clean_val(row.get("Market"))
        if mkt is not None:
            e["mkt"] = str(mkt)
        units_count = clean_val(row.get("Units"))
        if units_count is not None:
            try:
                e["units"] = int(float(units_count))
            except (TypeError, ValueError):
                pass
        note = clean_val(row.get("Note"))
        if note is not None and not isinstance(note, float):
            e["note"] = str(note)
        restart = clean_val(row.get("Restart?"))
        if isinstance(restart, str) and restart.strip().lower() == "yes":
            e["restart"] = True
        ret_year = safe_int(row.get("Ret Year"))
        if ret_year is not None:
            e["retYear"] = ret_year
        restart_year = safe_int(row.get("Restart Year"))
        if restart_year is not None:
            e["restartYear"] = restart_year
        if key in units_by_key:
            e["unitDetail"] = units_by_key[key]
        UR[key] = e
    print(f"  UR: {len(UR)}")
    return UR


def build_orphan():
    df = pd.read_excel(XLSX_INTERACTIVE, sheet_name="ORPHAN Plants")
    ORPHAN = {}
    for _, row in df.iterrows():
        lat, lon = clean_val(row["Lat"]), clean_val(row["Lon"])
        if lat is None or lon is None:
            continue
        key = fmt_key(lat, lon)
        e = {}
        mwe = clean_val(row.get("Capacity (MWe)"))
        if mwe is not None:
            e["mwe"] = float(mwe)
        from_year = safe_int(row.get("From Year"))
        if from_year is not None:
            e["fromYear"] = from_year
        to_year = safe_int(row.get("To Year"))
        if to_year is not None:
            e["toYear"] = to_year
        ORPHAN[key] = e
    print(f"  ORPHAN: {len(ORPHAN)}")
    return ORPHAN


def build_sr():
    df = pd.read_excel(XLSX_INTERACTIVE, sheet_name="SR Regulatory")
    SR = {}
    for _, row in df.iterrows():
        state = clean_val(row.get("State"))
        if state is None:
            continue
        e = {}
        env = clean_val(row.get("Env. Status"))
        if env is not None:
            e["env"] = str(env)
        mor = row.get("Moratorium")
        if clean_val(mor) is not None:
            e["mor"] = str(mor)
        waste = row.get("Waste Siting")
        if clean_val(waste) is not None:
            e["waste"] = str(waste)
        mkt = clean_val(row.get("Market Type"))
        if mkt is not None:
            e["mkt"] = str(mkt)
        SR[str(state)] = e
    print(f"  SR: {len(SR)}")
    return SR


# ─────────────────────────────────────────────────────────────────────────────
# B. WISdom siting CSVs → DATA.g
# ─────────────────────────────────────────────────────────────────────────────

def build_data_g():
    DATA_g = {}
    for scenario in SCENARIOS:
        folder = os.path.join(SITING_IMAGES_BASE, scenario)
        scenario_data = {}
        for n, year in N_TO_YEAR.items():
            fkey = SCENARIO_FILE_KEY[scenario]
            fname = f"{n}-InstalledCapacity_locations_WISdomP_Full_Run_BTI_{fkey}_RCP00.csv"
            fpath = os.path.join(folder, fname)
            if not os.path.exists(fpath):
                print(f"  WARNING: missing {fpath}")
                scenario_data[year] = []
                continue
            df = pd.read_csv(fpath)
            # Drop all-zero rows
            tech_sum = df[TECH_COLS].sum(axis=1)
            df = df[tech_sum > 0].copy()
            df["_total"] = df[TECH_COLS].sum(axis=1)
            df["_dom"] = df[TECH_COLS].apply(
                lambda row: TECH_COL_MAP[max(TECH_COLS, key=lambda c: row[c])], axis=1
            )
            df = df.nlargest(2000, "_total")
            rows = []
            for _, row in df.iterrows():
                lat = round(float(row["Latitude"]), 4)
                lon = round(float(row["Longitude"]), 4)
                total = round(float(row["_total"]), 1)
                dom = row["_dom"]
                techs = {
                    TECH_COL_MAP[c]: round(float(row[c]), 1)
                    for c in TECH_COLS if float(row[c]) > 0
                }
                rows.append([lat, lon, total, dom, techs])
            scenario_data[year] = rows
        DATA_g[scenario] = scenario_data
        total = sum(len(v) for v in scenario_data.values())
        print(f"  DATA.g [{scenario}]: {total} rows across {len(scenario_data)} years")
    return DATA_g


# ─────────────────────────────────────────────────────────────────────────────
# C. Coal conversion CSVs → DATA.c
# ─────────────────────────────────────────────────────────────────────────────

def build_data_c():
    DATA_c = {}
    for scenario in SCENARIOS:
        plants = {}  # plant_id_eia → row (dedup by max new capacity)
        for tech in TECHS_CONV:
            fname = f"sitesConverted_2_{tech}{scenario}.csv"
            fpath = os.path.join(SITING_CONV_BASE, fname)
            if not os.path.exists(fpath):
                print(f"  WARNING: missing {fpath}")
                continue
            df = pd.read_csv(fpath)
            cap_col = f"{tech} Capacity"
            if cap_col not in df.columns:
                alt = [c for c in df.columns if tech in c]
                cap_col = alt[0] if alt else None
            if cap_col is None:
                print(f"  WARNING: no capacity col for {tech} in {fname}")
                continue
            for _, row in df.iterrows():
                pid = clean_val(row.get("plant_id_eia"))
                if pid is None:
                    continue
                pid = int(float(pid))
                lat = clean_val(row.get("latitude"))
                lon = clean_val(row.get("longitude"))
                name = clean_val(row.get("plant_name_eia"))
                state = clean_val(row.get("State"))
                orig_cap = clean_val(row.get("nameplate_cap"))
                new_cap = clean_val(row.get(cap_col))
                orig_tech = clean_val(row.get("technology_description"))
                decom = safe_int(row.get("Decommision Year"))
                conv = safe_int(row.get("Convertion Year"))
                new_cap_v = float(new_cap) if new_cap is not None else 0.0
                record = [
                    float(lat) if lat is not None else None,
                    float(lon) if lon is not None else None,
                    str(name) if name is not None else "",
                    str(state) if state is not None else "",
                    round(float(orig_cap) if orig_cap is not None else 0.0, 2),
                    round(new_cap_v, 2),
                    str(orig_tech) if orig_tech is not None else "",
                    tech,
                    decom,
                    conv,
                ]
                if pid not in plants or plants[pid][5] < new_cap_v:
                    plants[pid] = record
        DATA_c[scenario] = list(plants.values())
        print(f"  DATA.c [{scenario}]: {len(DATA_c[scenario])} plants")
    return DATA_c


# ─────────────────────────────────────────────────────────────────────────────
# D. WISdom summary xlsx → SC
# ─────────────────────────────────────────────────────────────────────────────

def parse_sub_table(df, start_col):
    """Parse one state×year sub-table from a compound sheet."""
    data = {}
    for row_idx in range(2, df.shape[0]):
        state = clean_val(df.iloc[row_idx, start_col])
        if state is None or (isinstance(state, float) and math.isnan(state)):
            continue
        state = str(state).strip()
        state_data = {}
        for col_offset, year in enumerate(YEARS, start=1):
            val = clean_val(df.iloc[row_idx, start_col + col_offset])
            try:
                state_data[year] = float(val) if val is not None else 0.0
            except (TypeError, ValueError):
                state_data[year] = 0.0
        data[state] = state_data
    return data


def parse_reactors_by_state(xlsx_path):
    df = pd.read_excel(xlsx_path, sheet_name="Reactors by State", header=None)
    smr   = parse_sub_table(df, 0)
    artes = parse_sub_table(df, 9)
    htgr  = parse_sub_table(df, 18)
    nuke  = parse_sub_table(df, 27)
    all_states = set(smr) | set(artes) | set(htgr) | set(nuke)
    combined = {}
    for state in all_states:
        combined[state] = {}
        for year in YEARS:
            s = smr.get(state, {}).get(year, 0.0)
            a = artes.get(state, {}).get(year, 0.0)
            h = htgr.get(state, {}).get(year, 0.0)
            n = nuke.get(state, {}).get(year, 0.0)
            combined[state][year] = {
                "SMR": s, "ARTES": a, "HTGR": h, "Nuclear": n,
                "reactors": s + a + h,
            }
    return combined


def parse_capital_investment(xlsx_path, sheet_name):
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name, header=None)
    data = {}
    for row_idx in range(2, df.shape[0]):
        state = clean_val(df.iloc[row_idx, 0])
        if state is None or (isinstance(state, float) and math.isnan(state)):
            continue
        state = str(state).strip()
        state_data = {}
        for col_offset, year in enumerate(YEARS, start=1):
            val = clean_val(df.iloc[row_idx, col_offset])
            try:
                state_data[year] = float(val) if val is not None else 0.0
            except (TypeError, ValueError):
                state_data[year] = 0.0
        data[state] = state_data
    return data


def parse_jobs(xlsx_path):
    df = pd.read_excel(xlsx_path, sheet_name=" Jobs", header=None)
    sub_cols = [
        (col, str(df.iloc[0, col]).strip())
        for col in range(df.shape[1])
        if isinstance(df.iloc[0, col], str) and df.iloc[0, col].strip()
    ]
    all_tables = {name: parse_sub_table(df, col) for col, name in sub_cols}
    nuke_types = {"Nuclear Jobs", "ARTES Jobs", "SMR Jobs", "HTGR Jobs"}
    all_states = set()
    for tbl in all_tables.values():
        all_states.update(tbl.keys())
    combined = {}
    for state in all_states:
        combined[state] = {}
        for year in YEARS:
            jobs_nuke = sum(
                all_tables.get(jt, {}).get(state, {}).get(year, 0.0)
                for jt in nuke_types
            )
            jobs_total = sum(
                tbl.get(state, {}).get(year, 0.0)
                for tbl in all_tables.values()
            )
            combined[state][year] = {"jobsNuke": jobs_nuke, "jobsTotal": jobs_total}
    return combined


def build_sc():
    SC = {}
    for scenario in SCENARIOS:
        fkey = SCENARIO_FILE_KEY[scenario]
        xlsx_path = os.path.join(SPREADSHEETS_BASE, f"WISdomP_Full_Run_BTI_{fkey}_RCP00.xlsx")
        if not os.path.exists(xlsx_path):
            print(f"  WARNING: missing {xlsx_path}")
            SC[scenario] = {}
            continue
        print(f"  Parsing SC [{scenario}]...")
        reactors  = parse_reactors_by_state(xlsx_path)
        cap_artes = parse_capital_investment(xlsx_path, "Capital Investment ARTES")
        cap_smr   = parse_capital_investment(xlsx_path, "Capital Investment SMR")
        cap_htgr  = parse_capital_investment(xlsx_path, "Capital Investment HTGR")
        jobs      = parse_jobs(xlsx_path)
        all_states = set(reactors) | set(cap_artes) | set(cap_smr) | set(cap_htgr) | set(jobs)
        scenario_sc = {}
        for state in sorted(all_states):
            state_data = {}
            for year in YEARS:
                r = reactors.get(state, {}).get(year, {})
                cap_nuke = (
                    cap_artes.get(state, {}).get(year, 0.0)
                    + cap_smr.get(state, {}).get(year, 0.0)
                    + cap_htgr.get(state, {}).get(year, 0.0)
                )
                j = jobs.get(state, {}).get(year, {})
                state_data[year] = {
                    "reactors":  r.get("reactors", 0.0),
                    "Nuclear":   r.get("Nuclear", 0.0),
                    "SMR":       r.get("SMR", 0.0),
                    "ARTES":     r.get("ARTES", 0.0),
                    "HTGR":      r.get("HTGR", 0.0),
                    "capNuke":   cap_nuke,
                    "capTotal":  cap_nuke,  # NOTE: only advanced nuclear capital sheets available
                    "jobsNuke":  j.get("jobsNuke", 0.0),
                    "jobsTotal": j.get("jobsTotal", 0.0),
                }
            scenario_sc[state] = state_data
        SC[scenario] = scenario_sc
        print(f"    SC [{scenario}]: {len(scenario_sc)} states")
    return SC


# ─────────────────────────────────────────────────────────────────────────────
# Build all data objects (module-level so split-exec test command works)
# ─────────────────────────────────────────────────────────────────────────────

def build_all():
    print("=== Building nuclear map data ===\n")
    print("A. nuclear_interactive_tool_data.xlsx")
    PN, PSTATE = build_plant_names_and_pstate()
    units_by_key = build_per_unit_detail()
    UR = build_ur(units_by_key)
    ORPHAN = build_orphan()
    SR = build_sr()
    print("\nB. WISdom siting CSVs → DATA.g")
    DATA_g = build_data_g()
    print("\nC. Coal conversion CSVs → DATA.c")
    DATA_c = build_data_c()
    print("\nD. WISdom summary xlsx → SC")
    SC = build_sc()
    return PN, PSTATE, UR, ORPHAN, SR, DATA_g, DATA_c, SC


PN, PSTATE, UR, ORPHAN, SR, DATA_g, DATA_c, SC = build_all()

# Write data.js
print("\n=== Writing data.js ===")
sep = (",", ":")
timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
js_lines = [
    "// Auto-generated by build_data.py — do not edit manually",
    "// Source: nuclear_interactive_tool_data.xlsx + WISdom siting CSVs + WISdom summary xlsx",
    f"// Generated: {timestamp}",
    "",
    f"const PN = {json.dumps(PN, separators=sep)};",
    f"const UR = {json.dumps(UR, separators=sep)};",
    f"const ORPHAN = {json.dumps(ORPHAN, separators=sep)};",
    f"const PSTATE = {json.dumps(PSTATE, separators=sep)};",
    f"const SR = {json.dumps(SR, separators=sep)};",
    f"const DATA = {{g:{json.dumps(DATA_g, separators=sep)},c:{json.dumps(DATA_c, separators=sep)}}};",
    f"const SC = {json.dumps(SC, separators=sep)};",
    "",
]
with open(OUTPUT_JS, "w", encoding="utf-8") as f:
    f.write("\n".join(js_lines))

size_mb = os.path.getsize(OUTPUT_JS) / (1024 * 1024)
print(f"Wrote {OUTPUT_JS} ({size_mb:.1f} MB)")

print("\n=== Summary ===")
print(f"PN: {len(PN)}, PSTATE: {len(PSTATE)}, UR: {len(UR)}, ORPHAN: {len(ORPHAN)}, SR: {len(SR)}")
print("DATA.g row counts:")
for scen, ydata in DATA_g.items():
    counts = {yr: len(rows) for yr, rows in ydata.items()}
    print(f"  {scen}: {counts}")
print("DATA.c entry counts:")
for scen, rows in DATA_c.items():
    print(f"  {scen}: {len(rows)} plants")
print("SC state counts:")
for scen, sdata in SC.items():
    print(f"  {scen}: {len(sdata)} states")
