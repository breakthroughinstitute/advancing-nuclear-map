#!/usr/bin/env python3
"""
fetch_nrc_pipeline.py — Update data/nrc_pipeline.json from NRC website
=======================================================================
Fetches the NRC Expected Applications for Power Uprates page and writes
data/nrc_pipeline.json. Run this whenever the NRC updates their page.

Usage:
  python3 scripts/fetch_nrc_pipeline.py

The NRC site uses Akamai bot detection. This script uses curl_cffi to
impersonate Chrome's TLS fingerprint and bypass it automatically.

  pip3 install curl_cffi

If the fetch still fails, a manual browser fallback is available:
save the page tables as _nrc_raw.json and re-run with --from-file:

  python3 scripts/fetch_nrc_pipeline.py --from-file _nrc_raw.json

The _nrc_raw.json file is gitignored (temporary scratchpad).
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import date
from html.parser import HTMLParser

NRC_URL = (
    "https://www.nrc.gov/reactors/operating/licensing/power-uprates/"
    "status-power-apps/expected-applications.html"
)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH  = os.path.join(REPO_ROOT, "data", "nrc_pipeline.json")

# DOE UPRISE program targets (MWe)
DOE_TARGETS = {"2027": 2500, "2029": 5000}

# JavaScript snippet — paste in browser console on the NRC page.
# It copies the raw table data to your clipboard as JSON.
JS_SNIPPET = """
copy(JSON.stringify(Array.from(document.querySelectorAll('table')).map(t => ({
  headers: Array.from(t.querySelectorAll('tr')[0].querySelectorAll('th,td'))
            .map(c => c.innerText.trim()),
  rows: Array.from(t.querySelectorAll('tr')).slice(1)
        .map(r => Array.from(r.querySelectorAll('th,td')).map(c => c.innerText.trim()))
}))));
"""


# ── HTML parser ───────────────────────────────────────────────────────────────

class TableHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self._table, self._row, self._cell, self._in = [], None, None, '', False

    def handle_starttag(self, tag, attrs):
        if tag == 'table':   self._table = {'headers': [], 'rows': []}
        if tag == 'tr'   and self._table is not None: self._row = []
        if tag in ('td', 'th') and self._row is not None: self._in = True; self._cell = ''

    def handle_endtag(self, tag):
        if tag == 'table' and self._table:
            self.tables.append(self._table); self._table = None
        if tag == 'tr' and self._row is not None:
            if self._table:
                if not self._table['headers']:
                    self._table['headers'] = self._row
                else:
                    self._table['rows'].append(self._row)
            self._row = None
        if tag in ('td', 'th') and self._in:
            if self._row is not None:
                self._row.append(re.sub(r'\s+', ' ', self._cell).strip())
            self._in = False

    def handle_data(self, data):
        if self._in: self._cell += data


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_int(s):
    """Parse '1,014' → 1014."""
    return int(re.sub(r'[^\d]', '', s) or '0')


# ── Core: build JSON from parsed tables ──────────────────────────────────────

def build_json(tables, retrieved=None):
    summary, detail = tables[0], tables[1]

    # Summary table → per-year stats (skip TOTAL row)
    yearly = {}
    for row in summary['rows']:
        if row[0].upper() == 'TOTAL':
            continue
        year = str(int(row[0]))
        yearly[year] = {
            'total_applications': parse_int(row[1]),
            'mur': parse_int(row[2]),
            'spu': parse_int(row[3]),
            'epu': parse_int(row[4]),
            'mwt': parse_int(row[5]),
            'mwe': parse_int(row[6]),
        }

    # Cumulative MWe across years
    cumulative, cumulative_by_year = 0, {}
    for year in sorted(yearly):
        cumulative += yearly[year]['mwe']
        cumulative_by_year[year] = cumulative

    # Total row
    total_row = next(r for r in summary['rows'] if r[0].upper() == 'TOTAL')

    # Detail table → individual applications
    applications = []
    for row in detail['rows']:
        if len(row) < 5:
            continue
        applications.append({
            'year':        int(row[0]),
            'applicant':   row[1],
            'plant':       row[2],
            'type':        row[3],
            'submission':  row[4],
        })

    return {
        '_meta': {
            'source':      'NRC Expected Applications for Power Uprates',
            'url':         NRC_URL,
            'retrieved':   retrieved or str(date.today()),
            'note':        'Some plant names are listed as Proprietary by the NRC.',
        },
        'summary_by_year':      yearly,
        'cumulative_mwe_by_year': cumulative_by_year,
        'total_applications':   parse_int(total_row[1]),
        'total_mwt':            parse_int(total_row[5]),
        'total_mwe':            parse_int(total_row[6]),
        'doe_targets':          DOE_TARGETS,
        'applications':         applications,
    }


# ── Fetch ─────────────────────────────────────────────────────────────────────

def fetch_html():
    # curl_cffi impersonates Chrome's TLS fingerprint, bypassing Akamai bot detection
    try:
        from curl_cffi import requests as cffi_requests
        r = cffi_requests.get(NRC_URL, impersonate="chrome", timeout=30)
        if r.status_code == 200 and '<table' in r.text:
            print("  OK (via curl_cffi)")
            return r.text
        print(f"  curl_cffi returned status {r.status_code} — falling back to urllib")
    except ImportError:
        print("  curl_cffi not installed (pip3 install curl_cffi) — falling back to urllib")
    except Exception as e:
        print(f"  curl_cffi failed ({e}) — falling back to urllib")

    # urllib fallback
    req = urllib.request.Request(NRC_URL, headers={
        'User-Agent': (
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/124.0.0.0 Safari/537.36'
        ),
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', errors='replace')


def print_manual_instructions():
    print()
    print("=" * 60)
    print("MANUAL FALLBACK — NRC site blocked automated access")
    print("=" * 60)
    print(f"\n1. Open this URL in your browser:\n   {NRC_URL}\n")
    print("2. Open DevTools console:  Cmd+Option+J  (Mac)")
    print("                       or  F12 → Console  (Windows)\n")
    print("3. Paste and run this snippet (it copies JSON to clipboard):")
    print("-" * 60)
    print(JS_SNIPPET)
    print("-" * 60)
    print("4. Save clipboard to:  _nrc_raw.json  (project root)\n")
    print("5. Re-run:")
    print("   python3 scripts/fetch_nrc_pipeline.py --from-file _nrc_raw.json\n")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    from_file = None
    if '--from-file' in sys.argv:
        idx = sys.argv.index('--from-file')
        from_file = sys.argv[idx + 1]

    if from_file:
        print(f"Reading from {from_file} ...")
        with open(from_file) as f:
            tables = json.load(f)
        retrieved = str(date.today())

    else:
        print(f"Fetching {NRC_URL} ...")
        try:
            html = fetch_html()
            parser = TableHTMLParser()
            parser.feed(html)
            tables = [{'headers': t['headers'], 'rows': t['rows']} for t in parser.tables]
            print(f"  OK — found {len(tables)} tables")
            retrieved = str(date.today())
        except Exception as e:
            print(f"  Failed: {e}")
            print(f"\nExisting {OUT_PATH} left unchanged.")
            print_manual_instructions()
            sys.exit(0)

    if len(tables) < 2:
        print(f"ERROR: expected 2 tables, found {len(tables)}. Page structure may have changed.")
        sys.exit(1)

    data = build_json(tables, retrieved)

    with open(OUT_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"\nWrote {OUT_PATH}")
    print(f"  {data['total_applications']} applications  |  "
          f"{data['total_mwe']} MWe total  |  "
          f"retrieved {data['_meta']['retrieved']}")
    print(f"  Cumulative MWe: {data['cumulative_mwe_by_year']}")


if __name__ == '__main__':
    main()
