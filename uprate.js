function showUprateDetail(ur, pNm, stateName) {
  const siteD = ur.d;
  const _units = ur.units || (function() {
    const pm = Math.round(ur.mwt / ur.u),
      pa = Math.round(ur.add / ur.u);
    const a = [];
    for (let i = 0; i < ur.u; i++) a.push({
      mwt: pm,
      add: pa
    });
    return a;
  })();
  const capPct = getCapPct(siteD);
  let h = '<div style="font-size:10px;color:#814DB1;cursor:pointer;margin-bottom:8px;font-weight:600" onclick="buildUprateCard()">\u2190 All plants</div>';
  h += '<div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px">' + (pNm || "Nuclear Plant") + '</div>';
  if (ur.restart) {
    h += '<div style="font-size:13px;font-weight:700;color:#0d9488;line-height:1.1;margin-bottom:1px">Restarting</div>';
  } else if (ur.add > 0) {
    h += '<div style="font-size:22px;font-weight:800;color:#814DB1;line-height:1.1;margin-bottom:1px">+' + Math.round(ur.add / 3).toLocaleString() + ' <span style="font-size:13px;font-weight:600">MWe potential</span></div>';
  }
  h += '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px">' + siteD + (ur.u > 1 ? ' &mdash; ' + ur.u + ' units' : '') + '</div>';
  if (capPct !== null) h += '<div style="font-size:10px;color:#64748b;margin-bottom:8px">Max uprate cap: <strong>' + (capPct * 100) + '%</strong></div>';
  var _isRestart = !!ur.restart;
  h += '<table style="width:100%;font-size:10px;border-collapse:collapse">';
  h += '<tr style="border-bottom:1px solid #e2e8f0">';
  h += '<th style="text-align:left;padding:2px 3px;color:#64748b">Unit</th>';
  h += '<th style="text-align:right;padding:2px 3px;color:#64748b">Orig. MWt</th>';
  h += '<th style="text-align:right;padding:2px 3px;color:#94a3b8">Done MWt</th>';
  h += '<th style="text-align:right;padding:2px 3px;color:#1e293b">Now MWt</th>';
  if (!_isRestart) h += '<th style="text-align:right;padding:2px 3px;color:#4ade80">Left MWt</th>';
  h += '</tr>';
  var tRef = 0,
    tDone = 0,
    tNow = 0,
    tLeft = 0;
  _units.forEach(function(u, i) {
    var uD = u.d || siteD;
    var cap = getCapPct(uD);
    var max = u.mwt + u.add;
    var ref = (cap !== null && cap > 0) ? Math.round(max / (1 + cap)) : u.mwt;
    var done = u.mwt - ref;
    var donePct = ref > 0 ? Math.round(done / ref * 1000) / 10 : 0;
    var remPct = ref > 0 ? Math.round(u.add / ref * 1000) / 10 : 0;
    tRef += ref;
    tDone += done;
    tNow += u.mwt;
    tLeft += u.add;
    h += '<tr style="border-bottom:1px solid #f1f5f9">';
    h += '<td style="padding:2px 3px;color:#334155">' + (u.name || "Unit " + (i + 1)) + '</td>';
    h += '<td style="text-align:right;padding:2px 3px;color:#64748b">' + ref.toLocaleString() + '</td>';
    h += '<td style="text-align:right;padding:2px 3px;color:#94a3b8">' + (done > 0 ? '+' + done.toLocaleString() + ' <span style="font-size:9px">(' + donePct + '%)</span>' : '—') + '</td>';
    h += '<td style="text-align:right;padding:2px 3px;font-weight:600">' + u.mwt.toLocaleString() + '</td>';
    if (!_isRestart) h += '<td style="text-align:right;padding:2px 3px">' + (u.add > 0 ? '<span style="color:#4ade80">+' + u.add.toLocaleString() + ' <span style="font-size:9px">(' + remPct + '%)</span></span>' : '<span style="color:#f87171">maxed</span>') + '</td>';
    h += '</tr>';
  });
  var tDonePct = tRef > 0 ? Math.round(tDone / tRef * 1000) / 10 : 0;
  var tRemPct = tRef > 0 ? Math.round(tLeft / tRef * 1000) / 10 : 0;
  h += '<tr style="font-weight:700;border-top:2px solid #e2e8f0">';
  h += '<td style="padding:3px 3px;color:#1e293b">Total</td>';
  h += '<td style="text-align:right;padding:3px 3px;color:#64748b">' + tRef.toLocaleString() + '</td>';
  h += '<td style="text-align:right;padding:3px 3px;color:#94a3b8">' + (tDone > 0 ? '+' + tDone.toLocaleString() + ' <span style="font-size:9px">(' + tDonePct + '%)</span>' : '—') + '</td>';
  h += '<td style="text-align:right;padding:3px 3px">' + tNow.toLocaleString() + '</td>';
  if (!_isRestart) h += '<td style="text-align:right;padding:3px 3px;color:#4ade80">+' + tLeft.toLocaleString() + ' <span style="font-size:9px">(' + tRemPct + '%)</span></td>';
  h += '</tr></table>';
  if (ur.note) h += '<div style="font-size:10px;color:#fbbf24;margin-top:3px">' + ur.note + '</div>';
  h += '<div class="uc-note">Plant-level headroom in MWt (thermal). MWe headline = MWt &divide; 3 (assumes ~33% thermal efficiency, per DOE/INL methodology).<br>Source: FAI State Permitting Playbook (Nov 2025) &bull; INL/EXT-24-78810 &bull; NRC</div>';
  document.getElementById("uprate-card-content").innerHTML = h;
}

function buildUprateCard() {
  const _seen = new Set();
  let grandMWt = 0,
    upSites = 0,
    upUnits = 0,
    restartMWt = 0,
    doneMWt = 0;
  Object.entries(UR).forEach(([k, ur]) => {
    const rk = parseFloat(k.split(',')[0]).toFixed(1) + ',' + parseFloat(k.split(',')[1]).toFixed(1);
    if (_seen.has(rk)) return;
    _seen.add(rk);
    if (ur.retYear && ur.retYear <= 2025 && !ur.restart) return;
    if (ur.restart) return;
    if (ur.doneMWt) doneMWt += ur.doneMWt;
    if (!ur.add || ur.add <= 0) return;
    upSites++;
    upUnits += ur.units ? ur.units.filter(function(x) {
      return x.add > 0;
    }).length : (ur.u || 1);
    grandMWt += ur.add;
  });
  // Also count restartMWt separately (restarts excluded from done total)
  Object.entries(UR).forEach(([k, ur]) => {
    if (ur.restart) restartMWt += ur.mwt;
  });
  const grandMWe = Math.round(grandMWt / 3);
  const restartMWe = Math.round(restartMWt / 3);
  const doneMWe = Math.round(doneMWt / 3);
  // Summary bar — 3 groups: Already Done | Potential | Policy Targets
  let sb = '<div class="usb-row">';
  // Group 1: Already Done
  sb += '<div class="usb-group">';
  sb += '<div class="usb-group-hdr">Already Done</div>';
  sb += '<div class="usb-group-stats"><div class="usb-stat"><div class="usb-val" style="color:#64748b">+' + doneMWe.toLocaleString() + ' MWe</div><div class="usb-lbl">NRC approved uprates</div></div></div>';
  sb += '</div>';
  sb += '<div class="usb-div"></div>';
  // Group 2: Potential
  sb += '<div class="usb-group">';
  sb += '<div class="usb-group-hdr">Potential</div>';
  sb += '<div class="usb-group-stats">';
  sb += '<div class="usb-stat"><div class="usb-val">+' + grandMWe.toLocaleString() + ' MWe</div><div class="usb-lbl">Uprate headroom &bull; ' + upSites + ' sites &bull; ' + upUnits + ' units</div></div>';
  if (restartMWe > 0) sb += '<div class="usb-stat"><div class="usb-val" style="color:#0d9488">&#8635; +' + restartMWe.toLocaleString() + ' MWe</div><div class="usb-lbl">Restarts (Palisades &bull; Crane &bull; Duane Arnold)</div></div>';
  sb += '</div></div>';
  sb += '<div class="usb-div"></div>';
  // Group 3: Planned
  sb += '<div class="usb-group">';
  sb += '<div class="usb-group-hdr">Planned</div>';
  sb += '<div class="usb-group-stats">';
  sb += '<div class="usb-stat"><div class="usb-val" style="color:#0ea5e9">2,422 MWe</div><div class="usb-lbl">Expected uprate applications to 2032</div></div>';
  sb += '</div></div>';
  sb += '<div class="usb-div"></div>';
  // Group 4: Policy Targets
  sb += '<div class="usb-group">';
  sb += '<div class="usb-group-hdr">Policy Targets</div>';
  sb += '<div class="usb-group-stats">';
  sb += '<div class="usb-stat"><div class="usb-val" style="color:#818cf8">~8,000 MWe<sup style="font-size:8px;font-weight:400">*</sup></div><div class="usb-lbl">NEI 2025 Survey</div></div>';
  sb += '<div class="usb-stat"><div class="usb-val" style="color:#fb923c">5,000 MWe</div><div class="usb-lbl">DOE UPRISE Target</div></div>';
  sb += '</div></div>';
  sb += '<div style="margin-left:auto;align-self:center;font-size:8px;color:#94a3b8;text-align:right;line-height:1.5">Plant-level headroom in MWt (thermal). MWe = MWt &divide; 3 (~33% thermal efficiency, per DOE/INL).<br>Source: FAI State Permitting Playbook (Nov 2025) &bull; INL/EXT-24-78810 &bull; NRC &bull; NRC Expected Uprate Applications &bull; Double-click state &rarr; Dashboard<br><sup>*</sup>NEI 2025 survey covers uprates, restarts, <em>and</em> fuel-cycle extensions; this map shows uprates and restarts only.</div>';
  sb += '</div>';
  // Legend row
  sb += '<div class="usb-legend">';
  sb += '<span class="usb-legend-hdr">Map Symbols</span>';
  sb += '<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;background:#814DB1;border:2px solid #4a1d7a;flex-shrink:0;box-sizing:border-box"></div>Uprates done</div>';

  sb += '<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;border:2px dashed #f59e0b;flex-shrink:0"></div>Uprate potential</div>';
  sb += '<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;border:2px dashed #22c55e;flex-shrink:0"></div>EPU planned</div>';
  sb += '<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;background:#0d9488;border:2px dotted rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(13,148,136,.5);flex-shrink:0"></div>Restart</div>';
  sb += '<span class="usb-legend-hdr" style="margin-left:8px">Plant Size (MWe)</span>';
  [
    [8, '500'],
    [18, '2k'],
    [24, '5k']
  ].forEach(function(s) {
    sb += '<div class="usb-legend-item"><div style="width:' + s[0] + 'px;height:' + s[0] + 'px;border-radius:50%;background:rgba(129,77,177,.2);border:1.5px solid #814DB1;flex-shrink:0"></div>' + s[1] + '</div>';
  });
  sb += '<span class="usb-legend-hdr" style="margin-left:8px">Headroom (MWe)</span>';
  [
    [14, '50'],
    [21, '150'],
    [28, '300']
  ].forEach(function(s) {
    sb += '<div class="usb-legend-item"><div style="width:' + s[0] + 'px;height:' + s[0] + 'px;border-radius:50%;border:1.5px dashed #f59e0b;flex-shrink:0"></div>' + s[1] + '</div>';
  });
  sb += '</div>';
  document.getElementById("uprate-summary-content").innerHTML = sb;
  // Show charts in panel
  const _uc = document.getElementById("uprate-card-content");
  if (_uc) {
    _uc.style.display = "block";
    // Chart A: stacked bar — Done | Planned-to-2029 | Unplanned | Restarts vs DOE 5 GW goal
    // Values: done=doneMWe, planned2029=2042, unplanned=(grandMWe-2042), restarts=restartMWe
    // DOE goal marker at done+5000 relative to total
    const _planned2029 = 2042;
    const _unplannedMWe = Math.max(0, grandMWe - _planned2029);
    const _totalA = doneMWe + grandMWe + restartMWe; // grandMWe already includes planned2029
    const _doeX = doneMWe + 5000;
    const _doePct = Math.min(100, (_doeX / _totalA) * 100).toFixed(1);
    const _donePct = (doneMWe / _totalA * 100).toFixed(1);
    const _plan2029Pct = (_planned2029 / _totalA * 100).toFixed(1);
    const _unplanPct = (_unplannedMWe / _totalA * 100).toFixed(1);
    const _restartPct = (restartMWe / _totalA * 100).toFixed(1);
    // Chart B: timeline SVG — cumulative NRC pipeline vs DOE UPRISE goals
    // Scale: 0–5500, SVG height 150px. y = 150-(val/5500*150)
    // Cumulative: 335,1210,1845,2042,2291,2357,2422
    // X: 15,51.7,88.3,125,161.7,198.3,235
    const _pts = [{
      x: 15,
      y: (150 - 335 / 5500 * 150).toFixed(1),
      v: '335'
    }, {
      x: 51.7,
      y: (150 - 1210 / 5500 * 150).toFixed(1),
      v: '1,210'
    }, {
      x: 88.3,
      y: (150 - 1845 / 5500 * 150).toFixed(1),
      v: '1,845'
    }, {
      x: 125,
      y: (150 - 2042 / 5500 * 150).toFixed(1),
      v: '2,042'
    }, {
      x: 161.7,
      y: (150 - 2291 / 5500 * 150).toFixed(1),
      v: '2,291'
    }, {
      x: 198.3,
      y: (150 - 2357 / 5500 * 150).toFixed(1),
      v: '2,357'
    }, {
      x: 235,
      y: (150 - 2422 / 5500 * 150).toFixed(1),
      v: '2,422'
    }];
    const _yrs = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'];
    const _doe25y = (150 - 2500 / 5500 * 150).toFixed(1); // 2.5 GW at 2027
    const _doe5y = (150 - 5000 / 5500 * 150).toFixed(1); // 5 GW at 2029
    let ch = '';
    // ── Chart A ──
    ch += '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:2px">How much more can we add?</div>';
    ch += '<div style="font-size:9px;color:#64748b;margin-bottom:14px">All figures in MWe &bull; additional capacity vs. DOE UPRISE goal</div>';
    ch += '<div style="position:relative;margin-bottom:10px">';
    // DOE 5 GW label
    ch += '<div style="position:absolute;top:-16px;left:' + _doePct + '%;transform:translateX(-50%);white-space:nowrap;text-align:center"><span style="font-size:8px;font-weight:700;color:#fb923c">5 GW goal</span></div>';
    // Stacked bar
    ch += '<div style="display:flex;height:30px;border-radius:4px;overflow:hidden;width:100%">';
    ch += '<div style="width:' + _donePct + '%;background:#94a3b8;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Already done: ' + doneMWe.toLocaleString() + ' MWe">' + doneMWe.toLocaleString() + '</div>';
    ch += '<div style="width:' + _plan2029Pct + '%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Planned to 2029: 2,042 MWe">2,042</div>';
    ch += '<div style="width:' + _unplanPct + '%;background:#814DB1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Unplanned potential: ' + _unplannedMWe.toLocaleString() + ' MWe">' + (_unplannedMWe > 200 ? _unplannedMWe.toLocaleString() : '') + '</div>';
    ch += '<div style="width:' + _restartPct + '%;background:#0d9488;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Restarts: ' + restartMWe.toLocaleString() + ' MWe">' + restartMWe.toLocaleString() + '</div>';
    ch += '</div>';
    // DOE marker line
    ch += '<div style="position:absolute;top:0;left:' + _doePct + '%;transform:translateX(-50%);width:2px;height:30px;background:#fb923c"></div>';
    ch += '</div>';
    // Legend
    ch += '<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin-bottom:10px">';
    ch += '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#94a3b8;flex-shrink:0"></div>Already done</div>';
    ch += '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#0ea5e9;flex-shrink:0"></div>Planned (NRC, to 2029)</div>';
    ch += '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#814DB1;flex-shrink:0"></div>Unplanned potential</div>';
    ch += '<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#0d9488;flex-shrink:0"></div>Restarts</div>';
    ch += '</div>';
    // Analysis
    ch += '<div style="border-top:1px solid #f1f5f9;padding-top:8px;font-size:9px;color:#475569;line-height:1.7;margin-bottom:6px">';
    ch += '<div>&#8594; NRC planned covers only <strong style="color:#0ea5e9">' + Math.round(_planned2029 / 5000 * 100) + '%</strong> of the DOE UPRISE 5 GW goal</div>';
    ch += '</div>';
    ch += '<div style="font-size:8px;color:#94a3b8;line-height:1.5;border-top:1px solid #f1f5f9;padding-top:6px;margin-bottom:20px">Planned (2,042 MWe) = NRC expected applications to 2029. Restarts = Palisades, Crane, Duane Arnold. MWe &asymp; MWt &divide; 3.</div>';
    // ── Chart B ──
    ch += '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:2px">Uprate Timeline: Planned vs. UPRISE Goal</div>';
    ch += '<div style="font-size:9px;color:#64748b;margin-bottom:8px">Cumulative planned MWe (NRC pipeline) vs. DOE targets</div>';
    ch += '<div style="display:flex;gap:6px">';
    // Y-axis labels
    ch += '<div style="display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;padding-right:2px;height:150px">';
    ['5k', '4k', '3k', '2k', '1k', '0'].forEach(function(l) {
      ch += '<span style="font-size:7px;color:#94a3b8;line-height:1">' + l + '</span>';
    });
    ch += '</div>';
    // SVG
    ch += '<div style="flex:1"><svg viewBox="0 0 250 160" style="width:100%;height:170px;overflow:visible">';
    // Gridlines
    ch += '<line x1="0" y1="150" x2="250" y2="150" stroke="#e2e8f0" stroke-width="1"/>';
    [122.7, 95.5, 68.2, 40.9].forEach(function(y) {
      ch += '<line x1="0" y1="' + y + '" x2="250" y2="' + y + '" stroke="#f1f5f9" stroke-width="1"/>';
    });
    // DOE 2.5 GW marker at 2027 (x=51.7)
    ch += '<line x1="33" y1="' + _doe25y + '" x2="71" y2="' + _doe25y + '" stroke="#fb923c" stroke-width="2" stroke-dasharray="4,2"/>';
    ch += '<text x="51.7" y="' + (parseFloat(_doe25y) - 4.5) + '" text-anchor="middle" fill="#fb923c" font-size="7.5" font-weight="700">2.5 GW goal</text>';
    // DOE 5 GW marker at 2029 (x=125)
    ch += '<line x1="107" y1="' + _doe5y + '" x2="143" y2="' + _doe5y + '" stroke="#f97316" stroke-width="2" stroke-dasharray="4,2"/>';
    ch += '<text x="125" y="' + (parseFloat(_doe5y) - 4.5) + '" text-anchor="middle" fill="#f97316" font-size="7.5" font-weight="700">5 GW goal</text>';
    // Connecting polyline
    ch += '<polyline points="' + _pts.map(function(p) {
      return p.x + ',' + p.y;
    }).join(' ') + '" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-linejoin="round"/>';
    // Dots and labels
    _pts.forEach(function(p, i) {
      ch += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="#0ea5e9" stroke="#fff" stroke-width="1.5"/>';
      ch += '<text x="' + p.x + '" y="' + (parseFloat(p.y) - 7) + '" text-anchor="middle" fill="#475569" font-size="7">' + p.v + '</text>';
      ch += '<text x="' + p.x + '" y="168" text-anchor="middle" fill="#64748b" font-size="8">' + _yrs[i] + '</text>';
    });
    ch += '</svg></div></div>';
    // Analysis
    ch += '<div style="border-top:1px solid #f1f5f9;padding-top:8px;margin-top:2px;font-size:9px;color:#475569;line-height:1.7">';
    ch += '<div>&#8594; Falls <strong style="color:#fb923c">52% short</strong> of the 2.5 GW 2027 UPRISE goal</div>';
    ch += '<div>&#8594; Falls <strong style="color:#f97316">59% short</strong> of the 5 GW 2029 UPRISE goal</div>';
    ch += '</div>';
    ch += '<div style="font-size:8px;color:#94a3b8;margin-top:8px;line-height:1.5;border-top:1px solid #f1f5f9;padding-top:6px">Source: NRC Expected Applications for Power Uprates (retrieved Apr 2026).</div>';
    // Click hint
    ch += '<div style="color:#94a3b8;font-size:10px;text-align:center;padding:16px 12px 4px;line-height:1.8">&#8679; Click any dashed ring on the map for plant-level details</div>';
    _uc.innerHTML = ch;
  }
}

function toggleUprateCard() {
  const bar = document.getElementById("uprateSummaryBar");
  const panel = document.getElementById("upratePanel");
  const on = cT === "uprate";
  if (bar) bar.style.display = on ? "block" : "none";
  if (panel) panel.style.display = on ? "block" : "none";
}

