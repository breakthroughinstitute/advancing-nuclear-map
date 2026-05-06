function initMap() {
  map = L.map("map", {
    zoomControl: true,
    attributionControl: false,
    maxBounds: [
      [18, -135],
      [55, -60]
    ],
    maxBoundsViscosity: 1.0,
    minZoom: 3,
    zoomSnap: 0.1
  }).setView([38, -108], 5);
  map.createPane('labelsPane');
  map.getPane('labelsPane').style.zIndex = 250;
  map.getPane('labelsPane').style.pointerEvents = 'none';
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    maxZoom: 18
  }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
    maxZoom: 18,
    pane: "labelsPane"
  }).addTo(map);

  var GD_CONUS = {
    type: "FeatureCollection",
    features: GD.features.filter(function(f) {
      return f.properties.name !== "Alaska" && f.properties.name !== "Hawaii";
    })
  };
  sL = L.geoJSON(GD_CONUS, {
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      weight: .8,
      color: "#cbd5e1",
      opacity: .3
    },
    bubblingMouseEvents: true,
    onEachFeature: function(f, l) {
      const a = N2A[f.properties.name] || "";
      l.bindTooltip(function() {
        return bST(a, f.properties.name)
      }, {
        className: "state-tip",
        sticky: true,
        opacity: 1,
        direction: "top",
        offset: [0, -12]
      });
      l.on("mouseover", function() {
        var bs = getStateOverlayStyle(f);
        var fc = bs.fillColor === "transparent" ? "#1e293b" : bs.fillColor;
        this.setStyle({
          fillColor: fc,
          fillOpacity: (bs.fillOpacity || 0) + .15,
          weight: 2,
          color: "#475569",
          opacity: .7
        })
      });
      l.on("mouseout", function() {
        this.setStyle(getStateOverlayStyle(f))
      });
      l.on("dblclick", function() {
        var sn = f.properties.name;
        if (sn && SC[cS] && SC[cS][sn]) {
          cSt = sn;
          document.getElementById("stateSelect").value = sn;
          document.querySelectorAll(".main-tab").forEach(function(x) {
            x.classList.remove("active");
            if (x.dataset.tab === "dashboard") x.classList.add("active")
          });
          swT("dashboard")
        }
      })
    }
  }).addTo(map);
  gL = L.layerGroup().addTo(map);
  uL = L.layerGroup().addTo(map);
  cL = L.layerGroup().addTo(map);
  bTg();
  bLg()
}

function getStateOverlayStyle(feature) {
  if (cT === "uprate") return {
    fillColor: "transparent",
    fillOpacity: 0,
    weight: .8,
    color: "#cbd5e1",
    opacity: .3
  };
  var sn = feature && feature.properties && feature.properties.name;
  var rd = SR[sn];
  var showReg = document.getElementById("showRegulatory") && document.getElementById("showRegulatory").checked;
  var showMkt = document.getElementById("showMarket") && document.getElementById("showMarket").checked;
  if (showReg && rd) {
    var fc = rd.env === "Clear" ? "#bbf7d0" : rd.env === "Mixed" ? "#fef08a" : "#fecaca";
    return {
      fillColor: fc,
      fillOpacity: .4,
      weight: .8,
      color: "#cbd5e1",
      opacity: .3
    };
  }
  if (showMkt && rd) {
    var fc = rd.mkt === "Merchant Generator" ? "#bfdbfe" : "#fde8dd";
    return {
      fillColor: fc,
      fillOpacity: .4,
      weight: .8,
      color: "#cbd5e1",
      opacity: .3
    };
  }
  return {
    fillColor: "transparent",
    fillOpacity: 0,
    weight: .8,
    color: "#cbd5e1",
    opacity: .3
  };
}

function applyStateOverlay() {
  if (!sL) return;
  sL.setStyle(getStateOverlayStyle);
  var showReg = document.getElementById("showRegulatory") && document.getElementById("showRegulatory").checked;
  var showMkt = document.getElementById("showMarket") && document.getElementById("showMarket").checked;
  var el = document.getElementById("overlayLegend");
  if (!el) return;
  if (showReg) {
    el.innerHTML = '<div class="legend-section"><h3>Policy Climate</h3><div class="legend-grid">' +
      '<div class="legend-item"><span class="legend-dot" style="background:#bbf7d0;border:1px solid #86efac;border-radius:2px;width:14px;height:14px"></span>Permissive</div>' +
      '<div class="legend-item"><span class="legend-dot" style="background:#fef08a;border:1px solid #fde047;border-radius:2px;width:14px;height:14px"></span>Mixed</div>' +
      '<div class="legend-item"><span class="legend-dot" style="background:#fecaca;border:1px solid #fca5a5;border-radius:2px;width:14px;height:14px"></span>Restricted</div>' +
      '</div></div>';
  } else if (showMkt) {
    el.innerHTML = '<div class="legend-section"><h3>Electricity Market</h3><div class="legend-grid">' +
      '<div class="legend-item"><span class="legend-dot" style="background:#bfdbfe;border:1px solid #93c5fd;border-radius:2px;width:14px;height:14px"></span>Merchant Generator</div>' +
      '<div class="legend-item"><span class="legend-dot" style="background:#fde8dd;border:1px solid #EE5C36;border-radius:2px;width:14px;height:14px"></span>Cost Recovery</div>' +
      '</div></div>';
  } else {
    el.innerHTML = '';
  }
}

function toggleRegLayer() {
  var cb = document.getElementById("showMarket");
  if (cb && document.getElementById("showRegulatory").checked) cb.checked = false;
  applyStateOverlay();
}

function toggleMarketLayer() {
  var cb = document.getElementById("showRegulatory");
  if (cb && document.getElementById("showMarket").checked) cb.checked = false;
  applyStateOverlay();
}

function bUprateST(stateName) {
  var abbr = N2A[stateName] || stateName;
  var totalMWe = 0,
    plants = 0,
    restarts = 0;
  var seen = new Set();
  for (var k in UR) {
    if (PSTATE[k] !== stateName) continue;
    var ur = UR[k];
    if (ur.restart) {
      restarts++;
      continue;
    }
    var site = k.split(',').map(function(x) {
      return Math.round(parseFloat(x) * 10) / 10;
    }).join(',');
    if (seen.has(site)) continue;
    seen.add(site);
    if (ur.add > 0) {
      totalMWe += Math.round(ur.add / 3);
      plants++;
    }
  }
  var sr = SR[stateName] || null;
  var h = '<div class="stt"><h4>' + abbr + ' \u2014 Uprate Potential</h4>';
  h += '<div class="stt-section">';
  if (plants > 0) {
    h += '<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#814DB1"></span>Headroom</span><span class="v" style="color:#814DB1;font-weight:700">~' + totalMWe.toLocaleString() + ' MWe</span></div>';
    h += '<div class="stt-row"><span class="k">Plants w/ headroom</span><span class="v">' + plants + '</span></div>';
  } else {
    h += '<div style="font-size:11px;color:#94a3b8">No remaining headroom</div>';
  }
  if (restarts > 0) h += '<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#0d9488"></span>Restart plants</span><span class="v">' + restarts + '</span></div>';
  h += '</div>';
  h += '</div>';
  return h;
}

function bST(a, stateName) {
  if (cT === "uprate") return bUprateST(stateName);
  const sd = (SD[cS] || {})[a] || {},
    d = sd[cY] || {},
    r = d.reactors || {},
    rt = (r.SMR || 0) + (r.ARTES || 0) + (r.HTGR || 0);
  let h = '<div class="stt"><h4>' + a + " \u2014 " + cY + "</h4><div class=\"stt-section\"><div class=\"stt-label\">Advanced Nuclear Reactors</div>";
  if (rt > 0) {
    h += '<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#0DC3A8"></span>Advanced Nuclear</span><span class="v">' + rt + "</span></div>";
  } else h += '<div style="font-size:11px;color:#94a3b8">None</div>';
  h += '</div><div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Capital Investment</div>';
  h += '<div class="stt-row"><span class="k">Adv Nuclear</span><span class="v">' + fD(d.capNuke) + '</span></div>';
  h += '<div class="stt-row"><span class="k">All Energy</span><span class="v">' + fD(d.capTotal) + '</span></div></div>';
  h += '<div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Energy Jobs</div>';
  h += '<div class="stt-row"><span class="k">Adv Nuclear</span><span class="v">' + (d.jobsNuke || 0).toLocaleString() + '</span></div>';
  h += '<div class="stt-row"><span class="k">All Energy</span><span class="v">' + (d.jobsTotal || 0).toLocaleString() + "</span></div></div>";
  var _sr = SR[stateName] || SR[a];
  if (_sr) {
    var _ec = _sr.env === "Clear" ? "#4ade80" : _sr.env === "Mixed" ? "#fbbf24" : "#f87171";
    var _mc = _sr.mkt === "Merchant Generator" ? "#93c5fd" : "#EE5C36";
    h += '<div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Policy &amp; Market</div><div class="stt-row"><span class="k">Electricity Market</span><span class="v" style="color:' + _mc + '">' + _sr.mkt + '</span></div><div class="stt-row"><span class="k">Policy Climate</span><span class="v" style="color:' + _ec + '">' + (_sr.env === "Clear" ? "Permissive" : _sr.env === "Mixed" ? "Mixed" : "Restricted") + '</span></div>';
    if (_sr.mor && _sr.mor !== "None") h += '<div class="stt-row"><span class="k">Restriction</span><span class="v" style="color:#f87171">' + _sr.mor + '</span></div>';
    if (_sr.waste && _sr.waste !== "None") h += '<div class="stt-row"><span class="k">Waste Policy</span><span class="v" style="color:#fbbf24">' + _sr.waste + '</span></div>';
    h += '</div>';
  }
  h += "</div>";
  return h
}

function mkBtn(c, lbl, col, onClick, on) {
  const b = document.createElement("button");
  b.className = "layer-btn" + (on !== false ? " active" : "");
  b.textContent = lbl;
  b.style.borderColor = col;
  b.style.backgroundColor = on !== false ? col : "#fff";
  b.style.color = on !== false ? "#fff" : col;
  b.addEventListener("click", onClick);
  c.appendChild(b);
  return b;
}

function bTg() {
  const c = document.getElementById("layerToggles");
  // Nuclear — on by default
  mkBtn(c, "Nuclear", "#814DB1", function() {
    const ts = ["Nuclear", "SMR", "ARTES", "HTGR"],
      cl = "#814DB1",
      aa = ts.every(t => aT.has(t));
    ts.forEach(t => aa ? aT.delete(t) : aT.add(t));
    if (!aa) {
      this.classList.add("active");
      this.style.backgroundColor = cl;
      this.style.color = "#fff"
    } else {
      this.classList.remove("active");
      this.style.backgroundColor = "#fff";
      this.style.color = cl
    }
    uM();
  }, true);
  // Conversion — on by default
  mkBtn(c, "Conversion", "#0DC3A8", function() {
    showConvert = !showConvert;
    if (showConvert) {
      this.classList.add("active");
      this.style.backgroundColor = "#0DC3A8";
      this.style.color = "#fff"
    } else {
      this.classList.remove("active");
      this.style.backgroundColor = "#fff";
      this.style.color = "#0DC3A8"
    }
    uM();
  }, true);
  // Helper: build a sub-dropdown for a group button
  function mkSubDrop(anchorBtn, items) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;display:inline-block";
    const panel = document.createElement("div");
    panel.style.cssText = "display:none;position:absolute;top:100%;left:0;margin-top:3px;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 4px;z-index:2000;min-width:130px;box-shadow:0 4px 12px rgba(0,0,0,.12)";
    items.forEach(g => {
      const row = document.createElement("label");
      row.style.cssText = "display:flex;align-items:center;gap:7px;padding:4px 8px;cursor:pointer;border-radius:5px;font-size:11px;font-weight:600;color:#334155;white-space:nowrap";
      row.onmouseenter = () => row.style.background = "#f1f5f9";
      row.onmouseleave = () => row.style.background = "";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.style.cssText = "accent-color:" + g.c + ";width:13px;height:13px;cursor:pointer";
      cb.checked = false;
      cb.addEventListener("change", function() {
        this.checked ? aT.add(g.t) : aT.delete(g.t);
        uM();
      });
      const dot = document.createElement("span");
      dot.style.cssText = "width:9px;height:9px;border-radius:50%;background:" + g.c + ";flex-shrink:0;border:1px solid #64748b";
      row.appendChild(cb);
      row.appendChild(dot);
      row.appendChild(document.createTextNode(g.l));
      panel.appendChild(row);
    });
    wrap.appendChild(anchorBtn);
    wrap.appendChild(panel);
    document.addEventListener("click", function(e) {
      if (!wrap.contains(e.target)) panel.style.display = "none";
    });
    anchorBtn._panel = panel;
    return wrap;
  }
  // Fossil
  const fItems = [{
    l: "Coal",
    t: "Coal",
    c: "#252A2B"
  }, {
    l: "NG CC",
    t: "NG CC",
    c: "#6D7374"
  }, {
    l: "NG GT",
    t: "NG GT",
    c: "#C0C6C8"
  }, {
    l: "CCS (w/ gas)",
    t: "CCS",
    c: "#D62728"
  }];
  const fBtnEl = document.createElement("button");
  fBtnEl.className = "layer-btn";
  fBtnEl.textContent = "Fossil";
  fBtnEl.style.cssText = "border-color:#252A2B;background:#fff;color:#252A2B";
  fBtnEl.addEventListener("click", function(e) {
    e.stopPropagation();
    const p = this._panel;
    const open = p.style.display === "block";
    const ts = ["Coal", "NG CC", "NG GT", "CCS"],
      aa = ts.every(t => aT.has(t));
    if (aa) {
      ts.forEach(t => aT.delete(t));
      p.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
      p.style.display = "none";
      this.classList.remove("active");
      this.style.backgroundColor = "#fff";
      this.style.color = "#252A2B";
      uM();
    } else {
      ts.forEach(t => aT.add(t));
      p.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
      p.style.display = open ? "none" : "block";
      this.classList.add("active");
      this.style.backgroundColor = "#252A2B";
      this.style.color = "#fff";
      uM();
    }
  });
  c.appendChild(mkSubDrop(fBtnEl, fItems));
  // Renew
  const rItems = [{
    l: "Onshore Wind",
    t: "Wind",
    c: "#2CA02C"
  }, {
    l: "Offshore Wind",
    t: "Offshore",
    c: "#98DF8A"
  }, {
    l: "Utility Solar",
    t: "UPV",
    c: "#FFDE20"
  }, {
    l: "Rooftop Solar",
    t: "DPV",
    c: "#FF7F0E"
  }, {
    l: "Hydro",
    t: "Hydro",
    c: "#003FFD"
  }, {
    l: "Geo/Bio",
    t: "Geo/Bio",
    c: "#8C564B"
  }];
  const rBtnEl = document.createElement("button");
  rBtnEl.className = "layer-btn";
  rBtnEl.textContent = "Renew";
  rBtnEl.style.cssText = "border-color:#2CA02C;background:#fff;color:#2CA02C";
  rBtnEl.addEventListener("click", function(e) {
    e.stopPropagation();
    const p = this._panel;
    const open = p.style.display === "block";
    const ts = ["Wind", "Offshore", "UPV", "DPV", "CSP", "Hydro", "Geo/Bio"],
      aa = ts.every(t => aT.has(t));
    if (aa) {
      ts.forEach(t => aT.delete(t));
      p.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
      p.style.display = "none";
      this.classList.remove("active");
      this.style.backgroundColor = "#fff";
      this.style.color = "#2CA02C";
      uM();
    } else {
      ts.forEach(t => aT.add(t));
      p.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
      p.style.display = open ? "none" : "block";
      this.classList.add("active");
      this.style.backgroundColor = "#2CA02C";
      this.style.color = "#fff";
      uM();
    }
  });
  c.appendChild(mkSubDrop(rBtnEl, rItems));
  // Storage
  mkBtn(c, "Storage", "#E82269", function() {
    const aa = aT.has("UtilStorage");
    ["Storage", "UtilStorage"].forEach(t => aa ? aT.delete(t) : aT.add(t));
    if (!aa) {
      this.classList.add("active");
      this.style.backgroundColor = "#E82269";
      this.style.color = "#fff"
    } else {
      this.classList.remove("active");
      this.style.backgroundColor = "#fff";
      this.style.color = "#E82269"
    }
    uM();
  }, false);
}

function uM() {
  gL.clearLayers();
  uL.clearLayers();
  cL.clearLayers();
  const sd = DATA.g[cS];
  if (!sd) return;
  (sd[cY] || []).forEach(p => {
    const [lat, lon, total, dom, techs] = p;
    if (!aT.has(dom)) return;
    const ci = L.circleMarker([lat, lon], {
      radius: gR(total),
      fillColor: COLORS[dom],
      fillOpacity: .8,
      stroke: false
    });
    var isNk = ["Nuclear", "SMR", "ARTES", "HTGR"].indexOf(dom) >= 0;
    var pnK = lat.toFixed(3) + "," + lon.toFixed(3);
    var pNm = isNk && PN[pnK] ? PN[pnK] : null;
    let ph = '<div class="popup-content"><h4>' + (pNm || "Plant Location") + '</h4><div style="font-size:11px;color:#94a3b8;margin-bottom:6px">' + lat.toFixed(3) + ", " + lon.toFixed(3) + " \u2022 " + Math.round(total) + ' MW</div><table>';
    const mTechs = {};
    Object.entries(techs).forEach(([t, mw]) => {
      const k = (t === "SMR" || t === "ARTES" || t === "HTGR") ? "Advanced Nuclear" : t;
      mTechs[k] = (mTechs[k] || 0) + mw;
    });
    Object.entries(mTechs).sort((a, b) => b[1] - a[1]).forEach(([t, mw]) => {
      ph += '<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (COLORS[t] || "#0DC3A8") + '"></span> ' + (TN[t] || t) + "</td><td class=\"mw\">" + Math.round(mw) + " MW</td></tr>";
    });
    ph += "</table>";
    if (dom === "Nuclear" && UR[pnK]) {
      var ur = UR[pnK];
      if (ur.retYear && parseInt(cY) >= ur.retYear && (!ur.restartYear || parseInt(cY) < ur.restartYear)) return;
    }
    ph += "</div>";
    ci.bindPopup(ph, {
      className: "info-popup",
      maxWidth: 280
    });
    gL.addLayer(ci)
  });
  // Orphan nuclear plants: in UR data but absent from DATA.g (rendered separately)
  if (aT.has("Nuclear")) {
    const _rendK = new Set((sd[cY] || []).filter(p => p[3] === "Nuclear").map(p => p[0].toFixed(3) + "," + p[1].toFixed(3)));
    Object.entries(ORPHAN).forEach(([pnK, od]) => {
      if (_rendK.has(pnK)) return;
      const ur = UR[pnK];
      if (!ur) return;
      const mwe = od.mwe;
      const _yr = parseInt(cY);
      if (od.fromYear && _yr < od.fromYear) return;
      if (od.toYear && _yr > od.toYear) return;
      const [latS, lonS] = pnK.split(",");
      const lat = parseFloat(latS),
        lon = parseFloat(lonS);
      const pNm = PN[pnK] || null;
      if (ur && ur.restart) return;
      const ci2 = L.circleMarker([lat, lon], {
        radius: gR(mwe),
        fillColor: COLORS["Nuclear"],
        fillOpacity: .8,
        stroke: false
      });
      ci2.bindPopup('<div class="popup-content"><h4>' + (pNm || "Nuclear Plant") + '</h4><div style="font-size:11px;color:#94a3b8">' + lat.toFixed(3) + ", " + lon.toFixed(3) + " \u2022 " + mwe + ' MWe</div></div>', {
        className: "info-popup",
        maxWidth: 280
      });
      gL.addLayer(ci2);
    });
  }
  if (showConvert) {
    const yi = parseInt(cY);
    (DATA.c[cS] || []).forEach(c => {
      const [lat, lon, name, state, origCap, newCap, origTech, newTech, decom, conv] = c;
      if (!aT.has(newTech) || parseFloat(conv) > yi) return;
      const col = "#0DC3A8";
      const dispNew = (["SMR", "ARTES", "HTGR"].indexOf(newTech) >= 0) ? "Advanced Nuclear" : newTech;
      const sz = Math.max(10, Math.min(22, gR(newCap) * 2));
      const m = L.marker([lat, lon], {
        icon: L.divIcon({
          className: "",
          html: '<div style="width:' + sz + 'px;height:' + sz + 'px;transform:rotate(45deg);background:' + col + ';border:2px solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.4);opacity:.92"></div>',
          iconSize: [sz, sz],
          iconAnchor: [sz / 2, sz / 2],
          popupAnchor: [0, -sz / 2]
        })
      });
      m.bindPopup('<div class="popup-content"><h4>' + name + '</h4><div style="font-size:11px;color:#94a3b8;margin-bottom:6px">' + state + " \u2022 Repowered in " + Math.round(parseFloat(conv)) + '</div><table><tr><td style="color:#94a3b8">Original</td><td class="mw">' + origTech + '</td><td class="mw">' + Math.round(origCap) + ' MW</td></tr><tr><td style="color:' + col + ';font-weight:700">\u2192 ' + dispNew + '</td><td></td><td class="mw" style="color:' + col + '">' + Math.round(newCap) + " MW</td></tr></table></div>", {
        className: "info-popup",
        maxWidth: 280
      });
      cL.addLayer(m)
    });
  }
}

function bLg() {
  const p = document.getElementById("legend");
  // dot swatch — matches actual map dot appearance (opacity + border)
  function sw(col, dark) {
    const b = dark ? "1px solid #64748b" : "1px solid rgba(255,255,255,.8)";
    return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + col + ';opacity:.85;border:' + b + ';flex-shrink:0"></span>';
  }

  function grp(label, col, rows) {
    return '<div class="legend-section"><div style="font-size:10px;font-weight:700;color:' + col + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">' + label + '</div>' +
      '<div class="legend-grid">' + rows.map(([c, lbl, dark]) => '<div class="legend-item">' + sw(c, dark) + ' ' + lbl + '</div>').join('') + '</div></div>';
  }
  let h = '';
  h += grp('Nuclear', '#814DB1', [
    ['#814DB1', 'Conventional Nuclear'],
    ['#0DC3A8', 'Advanced Nuclear']
  ]);
  h += grp('Fossil', '#252A2B', [
    ['#252A2B', 'Coal'],
    ['#6D7374', 'Natural Gas CC', true],
    ['#C0C6C8', 'Natural Gas CT', true],
    ['#D62728', 'NG w/ CCS']
  ]);
  h += grp('Renewables', '#2CA02C', [
    ['#2CA02C', 'Onshore Wind'],
    ['#98DF8A', 'Offshore Wind', true],
    ['#FFDE20', 'Utility Solar', true],
    ['#FF7F0E', 'Rooftop Solar'],
    ['#FDFD4D', 'CSP', true],
    ['#003FFD', 'Hydro'],
    ['#8C564B', 'Geo / Bio']
  ]);
  h += grp('Storage', '#E82269', [
    ['#E82269', 'Utility Storage']
  ]);
  h += '<div class="legend-section"><h3>Circle Size (MW)</h3><div class="size-legend">';
  [{
    m: 100,
    r: 4
  }, {
    m: 500,
    r: 5.5
  }, {
    m: 1e3,
    r: 7
  }, {
    m: 2e3,
    r: 9
  }, {
    m: 5e3,
    r: 12
  }].forEach(s => {
    h += '<div style="text-align:center"><div class="size-circle" style="width:' + s.r * 2 + 'px;height:' + s.r * 2 + 'px;margin:0 auto"></div><div class="size-label">' + s.m + '</div></div>';
  });
  h += '</div></div>';
  h += '<div class="legend-section"><div style="font-size:11px;color:#475569;display:flex;align-items:center;gap:7px"><span style="display:inline-block;width:13px;height:13px;transform:rotate(45deg);background:#0DC3A8;border:2px solid rgba(255,255,255,.9)"></span>Conversion site (coal→nuclear)</div></div>';
  h += '<div class="legend-section" style="font-size:10px;color:#94a3b8">Double-click state → Dashboard</div>';
  h += '<div id="overlayLegend"></div>';
  p.innerHTML = h;
}

