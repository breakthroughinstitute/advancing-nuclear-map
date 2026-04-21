#!/usr/bin/env python3
"""
fetch_state_policy.py — Regenerate data/state_policy.json from FAI + Electric Choice
=====================================================================================
Two data sources:

  1. FAI State Permitting Playbook (Nov 2025 edition) — Appendix A
       → env  (nuclear regulatory environment classification)
       → mor  (new-plant moratorium/restriction citation — hardcoded from FAI)
       → waste (waste-specific restriction citation — hardcoded from FAI)

  2. Electric Choice — https://www.electricchoice.com/map-deregulated-energy-markets/
       → mkt  (electricity market structure — auto-fetched, changes as states deregulate)

`env` classification:
  "Moratorium"  — full construction ban or requires legislative/voter approval
                  (Hawaii, Maine, Massachusetts, Oregon, Rhode Island, Vermont)
  "Restricted"  — substantial non-approval restriction
                  (California — HLW repo req.; Minnesota — cert-of-need ban)
  "Mixed"       — limited geographic restriction, partial repeal, SMR carve-out,
                  or waste-only ban that affects new-plant siting decisions
                  (Connecticut, Illinois, Louisiana, Nevada, New Jersey, New Mexico,
                   New York, North Dakota, Texas, Utah, Washington, Wyoming)
  "Clear"       — no nuclear-specific restrictions (32 states)

Usage:
    python3 scripts/fetch_state_policy.py

Requirements:
    pip install pdfplumber   (only used to cache-check the FAI PDF; not for parsing)

Re-run when:
  • Electric Choice updates their deregulation table (mkt changes)
  • A state passes new nuclear legislation (update ENV, MOR_CITATIONS, or WASTE_CITATIONS
    below, then re-run)
"""

import json
import os
import re
import sys
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH  = os.path.join(REPO_ROOT, "data", "state_policy.json")

ELEC_CHOICE_URL = "https://www.electricchoice.com/map-deregulated-energy-markets/"

ALL_STATES = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
    "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
    "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
    "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
]

# ─────────────────────────────────────────────────────────────────────────────
# env classification
# Source: FAI State Permitting Playbook, Appendix A (Nov 2025)
# ─────────────────────────────────────────────────────────────────────────────

# Full bans / approval requirements (Table 1 in FAI Appendix A)
MORATORIUM_STATES = {
    "Hawaii",        # 2/3 legislative supermajority required (Haw. Const. art. XI, § 8)
    "Maine",         # statewide voter approval + HLW disposal capability required
    "Massachusetts", # voter + legislative approval + operating federal HLW facility required
    "Oregon",        # federally licensed HLW repository + statewide voter approval required
    "Rhode Island",  # General Assembly retains final approval/denial authority
    "Vermont",       # General Assembly must approve before cert. of public good issued
}

# Substantial restrictions that don't require affirmative approval to proceed
RESTRICTED_STATES = {
    "California",    # no certification until federally approved HLW reprocessing/disposal exists
    "Minnesota",     # statutory cert-of-need ban on new nuclear plants (§ 216B.243)
}

# Limited geographic/authority restrictions, partial repeals, SMR carve-outs, or waste-only bans
MIXED_STATES = {
    "Connecticut",   # partial repeal — opt-in pathway for Millstone site
    "Illinois",      # large-reactor HLW moratorium remains; SMR carve-out ≥ Jan 2026
    "Louisiana",     # HLW import/transport ban (waste only)
    "Nevada",        # HLW storage ban (waste only)
    "New Jersey",    # coastal area approvals require NRC-compliant waste disposal method
    "New Mexico",    # HLW storage/disposal ban — state consent + federal repository required
    "New York",      # prohibition limited to LIPA (Long Island) service area
    "North Dakota",  # HLW placement, storage, and disposal ban (waste only)
    "Oregon",        # also has post-license HLW storage ban (handled in WASTE_CITATIONS)
    "Texas",         # HLW disposal/storage ban — limited on-site exceptions (waste only)
    "Utah",          # nuclear waste placement/storage/treatment restrictions (waste only)
    "Washington",    # out-of-state radioactive waste storage and import ban (waste only)
    "Wyoming",       # HLW storage facility requires specific legislative authorization (waste only)
}
# Note: Oregon is both Moratorium (Table 1) and Mixed (Table 2 waste ban).
# env is set by the stricter classification — Moratorium takes precedence.


# ─────────────────────────────────────────────────────────────────────────────
# mor citation strings  (new-plant moratoria / siting restrictions)
# Source: FAI State Permitting Playbook, Appendix A, Table 1 (Nov 2025)
# UPDATE these when states pass new nuclear legislation.
# ─────────────────────────────────────────────────────────────────────────────

MOR_CITATIONS = {
    "California":    "HLW repository requirement (Cal. Pub. Res. Code § 25524.1–25524.2)",
    "Connecticut":   "Partial repeal — opt-in pathway for Millstone site "
                     "(Conn. Gen. Stat. § 22a-136; 2022 H.B. 5202; 2025 S.B. 4)",
    "Hawaii":        "Legislature 2/3 supermajority approval required "
                     "(Haw. Const. art. XI, § 8)",
    "Illinois":      "Large-reactor HLW moratorium; SMR carve-out ≥ Jan 2026 "
                     "(220 ILCS 5/8-406; 2023 H.B. 2473, P.A. 103-0569)",
    "Maine":         "Statewide voter approval + HLW disposal capability required "
                     "(35-A M.R.S. § 4302; § 4374)",
    "Massachusetts": "Voter + legislative approval + operating federal HLW facility required "
                     "(M.G.L. ch. 164 App. § 3-3)",
    "Minnesota":     "Statutory cert-of-need ban on new nuclear plants "
                     "(Minn. Stat. § 216B.243, subd. 3b)",
    "New Jersey":    "Coastal area approvals require NRC-compliant waste disposal method "
                     "(N.J.S.A. 13:19-11)",
    "New York":      "Prohibition limited to LIPA (Long Island) service area "
                     "(N.Y. Pub. Auth. Law § 1020-t)",
    "Oregon":        "HLW repository + statewide voter approval required "
                     "(ORS § 469.595; § 469.597)",
    "Rhode Island":  "General Assembly retains final approval/denial authority "
                     "(R.I. Gen. Laws § 42-64-14.1)",
    "Vermont":       "General Assembly must approve before cert. of public good issued "
                     "(30 V.S.A. § 248(e)(1))",
}

# ─────────────────────────────────────────────────────────────────────────────
# waste citation strings  (waste-specific moratoria / bans)
# Source: FAI State Permitting Playbook, Appendix A, Table 2 (Nov 2025)
# UPDATE these when states pass new nuclear waste legislation.
# ─────────────────────────────────────────────────────────────────────────────

WASTE_CITATIONS = {
    "Louisiana":    "HLW import and transport ban (La. Rev. Stat. § 30:2113(D))",
    "Nevada":       "HLW storage ban (NRS § 459.910)",
    "New Mexico":   "HLW storage/disposal ban — state consent + federal repository required "
                    "(2023 S.B. 53, Ch. 25)",
    "North Dakota": "HLW placement, storage, exploration, and disposal ban "
                    "(N.D.C.C. ch. 38-23)",
    "Oregon":       "HLW storage ban after license expiry (ORS § 469.594)",
    "Texas":        "HLW disposal/storage ban — limited on-site exceptions "
                    "(2021 H.B. 7, 87th Called Session)",
    "Utah":         "Nuclear waste placement/storage/treatment restrictions "
                    "(Utah Code § 19-3-301)",
    "Washington":   "Out-of-state radioactive waste storage and import ban "
                    "(RCW 70A.390.030)",
    "Wyoming":      "HLW storage facility requires specific legislative authorization "
                    "(Wyo. Stat. § 35-11-1506)",
}


# ─────────────────────────────────────────────────────────────────────────────
# Electric Choice fetch  (mkt field — auto-updated)
# ─────────────────────────────────────────────────────────────────────────────

def fetch_merchant_states():
    """
    Fetch Electric Choice deregulation table and return set of state names
    classified as Merchant Generator (any level of retail electricity choice).
    """
    print(f"  Fetching {ELEC_CHOICE_URL} …")
    req = urllib.request.Request(
        ELEC_CHOICE_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        html = r.read().decode("utf-8", errors="replace")

    from html.parser import HTMLParser

    class _TP(HTMLParser):
        def __init__(self):
            super().__init__()
            self.rows = []
            self._row = None
            self._cell = ""
            self._in = False

        def handle_starttag(self, tag, attrs):
            if tag == "tr":
                self._row = []
            if tag in ("td", "th") and self._row is not None:
                self._in = True
                self._cell = ""

        def handle_endtag(self, tag):
            if tag == "tr" and self._row is not None:
                self.rows.append(self._row)
                self._row = None
            if tag in ("td", "th") and self._in:
                if self._row is not None:
                    self._row.append(re.sub(r"\s+", " ", self._cell).strip())
                self._in = False

        def handle_data(self, data):
            if self._in:
                self._cell += data

    tp = _TP()
    tp.feed(html)

    merchant = set()
    for row in tp.rows:
        if not row or len(row) < 2:
            continue
        name = row[0].strip()
        if name in ("Washington D.C.", "Washington DC") or not name:
            continue
        if name in ALL_STATES:
            merchant.add(name)

    return merchant


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=== fetch_state_policy.py ===\n")

    # 1. Fetch electricity market structure from Electric Choice
    print("Fetching electricity market structure …")
    try:
        merchant_states = fetch_merchant_states()
        print(f"  {len(merchant_states)} merchant-generator states found")
    except Exception as e:
        sys.exit(f"  ERROR fetching Electric Choice: {e}")

    # 2. Build state_policy.json
    print("\nBuilding state_policy.json …")
    policy = {}

    for state in ALL_STATES:
        entry = {}

        # env
        if state in MORATORIUM_STATES:
            entry["env"] = "Moratorium"
        elif state in RESTRICTED_STATES:
            entry["env"] = "Restricted"
        elif state in MIXED_STATES:
            entry["env"] = "Mixed"
        else:
            entry["env"] = "Clear"

        # mor (new-plant moratorium citation)
        if state in MOR_CITATIONS:
            entry["mor"] = MOR_CITATIONS[state]

        # waste (waste-specific citation)
        if state in WASTE_CITATIONS:
            entry["waste"] = WASTE_CITATIONS[state]

        # mkt (auto-fetched)
        entry["mkt"] = "Merchant Generator" if state in merchant_states else "Cost Recovery"

        policy[state] = entry

    # 3. Write
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(policy, f, indent=2, ensure_ascii=False)

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"Wrote {OUT_PATH}  ({size_kb:.0f} KB)")

    from collections import Counter
    env_c = Counter(v["env"] for v in policy.values())
    mkt_c = Counter(v["mkt"] for v in policy.values())
    print(f"  env:  {dict(env_c)}")
    print(f"  mkt:  {dict(mkt_c)}")
    print(f"  mor:  {sum(1 for v in policy.values() if v.get('mor'))} states with citations")
    print(f"  waste:{sum(1 for v in policy.values() if v.get('waste'))} states with citations")
    print("Done.")


if __name__ == "__main__":
    main()
