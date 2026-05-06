const STK = ["Coal", "NG CC", "NG GT", "CCS", "Nuclear", "Advanced Nuclear", "Wind", "Offshore", "Hydro", "UPV", "DPV", "Geo/Bio", "UtilStorage"];
const SKC = ["#252A2B", "#6D7374", "#C0C6C8", "#D62728", "#814DB1", "#0DC3A8", "#2CA02C", "#98DF8A", "#003FFD", "#FFDE20", "#FF7F0E", "#8C564B", "#E82269"];

function initDash() {
  const sel = document.getElementById("stateSelect");
  Object.keys(SC[cS] || {}).sort().forEach(s => {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sel.appendChild(o)
  });
  sel.value = "California";
  sel.addEventListener("change", function() {
    cSt = this.value;
    uDash()
  });
  const lo = {
    responsive: true,
    maintainAspectRatio: false
  };
  ch1 = new Chart(document.getElementById("chartCap"), {
    type: "bar",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 8,
            font: {
              size: 9
            },
            padding: 4
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "GW",
            font: {
              size: 10
            }
          }
        }
      }
    }
  });

  ch3 = new Chart(document.getElementById("chartEmissions"), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 9
            },
            padding: 4
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "Million Tons CO\u2082",
            font: {
              size: 10
            }
          }
        }
      }
    }
  });
  ch4 = new Chart(document.getElementById("chartStateMix"), {
    type: "doughnut",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            boxWidth: 8,
            font: {
              size: 9
            },
            padding: 4
          }
        }
      }
    }
  });
  ch5 = new Chart(document.getElementById("chartStateTime"), {
    type: "bar",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "GW",
            font: {
              size: 10
            }
          }
        }
      }
    }
  });
  ch6 = new Chart(document.getElementById("chartDispatch"), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 8,
            font: {
              size: 8
            },
            padding: 4
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 7,
            font: {
              size: 9
            }
          }
        },
        y: {
          stacked: true,
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "GW",
            font: {
              size: 10
            }
          }
        }
      },
      elements: {
        point: {
          radius: 0
        },
        line: {
          borderWidth: 1
        }
      }
    }
  });
  ch7 = new Chart(document.getElementById("chartRetail"), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 8,
            font: {
              size: 10
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "$/MWh",
            font: {
              size: 10
            }
          },
          beginAtZero: false
        }
      }
    }
  });
  ch8 = new Chart(document.getElementById("chartSysCost"), {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      ...lo,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 8,
            font: {
              size: 10
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "$B/year",
            font: {
              size: 10
            }
          },
          beginAtZero: false
        }
      }
    }
  });
  chNucCap = new Chart(document.getElementById("chartNucCap"), {
    type: "line",
    data: {
      labels: YEARS,
      datasets: []
    },
    options: {
      ...lo,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "GW",
            font: {
              size: 10
            }
          },
          ticks: {
            callback: function(v) {
              return v + "GW"
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 9
            },
            padding: 6
          }
        }
      }
    }
  });
  chJobs = new Chart(document.getElementById("chartJobs"), {
    type: "line",
    data: {
      labels: YEARS,
      datasets: []
    },
    options: {
      ...lo,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "Jobs",
            font: {
              size: 10
            }
          },
          ticks: {
            callback: function(v) {
              return v >= 1000 ? (v / 1000).toFixed(0) + "K" : v;
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 9
            },
            padding: 6
          }
        }
      }
    }
  });
  chNucShare = new Chart(document.getElementById("chartNucShare"), {
    type: "line",
    data: {
      labels: YEARS,
      datasets: []
    },
    options: {
      ...lo,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "%",
            font: {
              size: 10
            }
          },
          ticks: {
            callback: function(v) {
              return v + "%";
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 9
            },
            padding: 6
          }
        }
      }
    }
  });
  chNucEnergy = new Chart(document.getElementById("chartNucEnergy"), {
    type: "line",
    data: {
      labels: YEARS,
      datasets: []
    },
    options: {
      ...lo,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#f1f5f9"
          },
          title: {
            display: true,
            text: "%",
            font: {
              size: 10
            }
          },
          ticks: {
            callback: function(v) {
              return v + "%";
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 9
            },
            padding: 6
          }
        }
      }
    }
  });
}

function getNucCapDatasets() {
  var sKeys = ["LowCost LowLR", "LowCost HighLR", "HighCost LowLR", "HighCost HighLR"];
  var sLabels = ["Low Cost / Low LR", "Low Cost / High LR", "High Cost / Low LR", "High Cost / High LR"];
  var sColors = ["#0DC3A8", "#0D4459", "#F8B944", "#EE5C36"];
  var ds = sKeys.map(function(s, i) {
    return {
      label: sLabels[i],
      borderColor: sColors[i],
      backgroundColor: "transparent",
      data: YEARS.map(function(y) {
        var cap = (NAT[s] || {
          cap: {}
        }).cap[y] || {};
        return Math.round(((cap.SMR || 0) + (cap.ARTES || 0) + (cap.HTGR || 0)) / 1000);
      }),
      pointRadius: 3,
      borderWidth: s === cS ? 3 : 1.5,
      tension: .3,
      borderDash: s === cS ? [] : [4, 4]
    };
  });
  ds.push({
    label: "Biden Goal: 200 GW by 2050",
    borderColor: "#3b82f6",
    backgroundColor: "#3b82f6",
    data: [null, null, null, null, null, null, 200],
    pointRadius: 8,
    pointHoverRadius: 12,
    hitRadius: 25,
    pointStyle: "circle",
    borderWidth: 0,
    showLine: false
  });
  ds.push({
    label: "Trump Goal: 300 GW by 2050",
    borderColor: "#ef4444",
    backgroundColor: "#ef4444",
    data: [null, null, null, null, null, null, 300],
    pointRadius: 8,
    pointHoverRadius: 12,
    hitRadius: 25,
    pointStyle: "circle",
    borderWidth: 0,
    showLine: false
  });
  ds.push({
    label: "COP Tripling Pledge: 35 GW by 2035",
    borderColor: "#64748b",
    backgroundColor: "#64748b",
    data: [null, null, null, 35, null, null, null],
    pointRadius: 8,
    pointHoverRadius: 12,
    hitRadius: 30,
    pointStyle: "circle",
    borderWidth: 0,
    showLine: false
  });
  return ds;
}

function uDash() {
  const nd = NAT[cS];
  if (!nd) return;
  const scenKeys = ["LowCost LowLR", "LowCost HighLR", "HighCost LowLR", "HighCost HighLR"];
  const scenColors = ["#0d9488", "#06b6d4", "#f59e0b", "#ef4444"];
  const scenLabels = ["Low/Low", "Low/High", "High/Low", "High/High"];
  ch1.data = {
    labels: YEARS,
    datasets: STK.map((t, i) => ({
      label: t,
      backgroundColor: SKC[i],
      data: YEARS.map(y => {
        const c = nd.cap[y] || {};
        const v = t === "Advanced Nuclear" ? (c.SMR || 0) + (c.ARTES || 0) + (c.HTGR || 0) : c[t] || 0;
        return Math.round(v / 1000);
      })
    })).filter(d => d.data.some(v => v > 0))
  };
  ch1.update();
  (function() {
    var _sf = {
      "LowCost LowLR": "Low Cost / Low LR",
      "LowCost HighLR": "Low Cost / High LR",
      "HighCost LowLR": "High Cost / Low LR",
      "HighCost HighLR": "High Cost / High LR"
    };
    var _sl = _sf[cS] || cS;
    var _e1 = document.getElementById("capScenLabel");
    if (_e1) _e1.textContent = _sl;
  })();
  ch3.data = {
    labels: YEARS,
    datasets: [{
      label: "All scenarios (carbon-constrained)",
      borderColor: "#64748b",
      backgroundColor: "rgba(100,116,139,0.1)",
      fill: true,
      data: YEARS.map(y => Math.round(((nd.emissions[y] || {}).CO2 || 0) / 1e6)),
      pointRadius: 3,
      borderWidth: 2,
      tension: .3
    }]
  };
  ch3.update();
  // Dispatch profile
  const dp = DISP[cS] || [];
  const dTechs = ["UPV", "DPV", "Wind", "Offshore", "ARTES", "SMR", "HTGR", "Nuclear", "CCS", "Hydro", "Geo/Bio", "Storage", "NG CC", "NG GT", "Coal"];
  const dColors = ["#FFDE20", "#FF7F0E", "#2CA02C", "#98DF8A", "#0DC3A8", "#0D4459", "#56A9D5", "#814DB1", "#D62728", "#003FFD", "#8C564B", "#E82269", "#6D7374", "#C0C6C8", "#252A2B"];
  const dLabels = dp.map((_, i) => {
    const d = Math.floor(i / 24) + 1;
    const h = i % 24;
    return d === 1 || h === 0 ? "Day " + d : ""
  });
  ch6.data = {
    labels: dLabels,
    datasets: dTechs.map((t, i) => ({
      label: t,
      backgroundColor: dColors[i] + "cc",
      borderColor: dColors[i],
      fill: i === 0 ? "origin" : "-1",
      data: dp.map(h => h[t] || 0)
    }))
  };
  ch6.update();
  var _dSub = document.getElementById("dispatchSubtitle");
  if (_dSub) {
    var _scenFull = {
      "LowCost LowLR": "Low Cost / Low Learning Rate",
      "LowCost HighLR": "Low Cost / High Learning Rate",
      "HighCost LowLR": "High Cost / Low Learning Rate",
      "HighCost HighLR": "High Cost / High Learning Rate"
    };
    _dSub.textContent = "Hourly generation (GW) for one summer week — Scenario: " + (_scenFull[cS] || cS) + ". Shows how dispatchable sources balance solar & wind.";
  }
  // Retail rates - show all scenarios
  ch7.data = {
    labels: YEARS,
    datasets: scenKeys.map((s, i) => ({
      label: scenLabels[i],
      borderColor: scenColors[i],
      backgroundColor: "transparent",
      data: YEARS.map(y => (RETAIL[s] || {})[y] || null),
      pointRadius: 3,
      borderWidth: s === cS ? 3 : 1.5,
      tension: .3,
      borderDash: s === cS ? [] : [4, 4]
    }))
  };
  ch7.update();
  // System cost - show all scenarios
  ch8.data = {
    labels: YEARS,
    datasets: scenKeys.map((s, i) => ({
      label: scenLabels[i],
      borderColor: scenColors[i],
      backgroundColor: "transparent",
      data: YEARS.map(y => (SYSCOST[s] || {})[y] || null),
      pointRadius: 3,
      borderWidth: s === cS ? 3 : 1.5,
      tension: .3,
      borderDash: s === cS ? [] : [4, 4]
    }))
  };
  ch8.update();
  if (chNucCap) {
    chNucCap.data = {
      labels: YEARS,
      datasets: getNucCapDatasets()
    };
    chNucCap.update();
  }
  if (chJobs) {
    chJobs.data = {
      labels: YEARS,
      datasets: scenKeys.map((s, i) => ({
        label: scenLabels[i],
        borderColor: scenColors[i],
        backgroundColor: "transparent",
        data: YEARS.map(y => NAT_JOBS[s] ? NAT_JOBS[s][y] || 0 : 0),
        pointRadius: 3,
        borderWidth: s === cS ? 3 : 1.5,
        tension: .3,
        borderDash: s === cS ? [] : [4, 4]
      }))
    };
    chJobs.update();
    if (chNucShare) {
      chNucShare.data = {
        labels: YEARS,
        datasets: scenKeys.map((s, i) => ({
          label: scenLabels[i],
          borderColor: scenColors[i],
          backgroundColor: "transparent",
          data: YEARS.map(y => {
            const cap = (NAT[s] || {
              cap: {}
            }).cap[y] || {};
            const nuc = (cap.Nuclear || 0) + (cap.SMR || 0) + (cap.ARTES || 0) + (cap.HTGR || 0);
            const tot = Object.values(cap).reduce((a, b) => a + b, 0);
            return tot > 0 ? Math.round(nuc / tot * 1000) / 10 : 0;
          }),
          pointRadius: 2,
          borderWidth: s === cS ? 2.5 : 1.5,
          tension: .3,
          borderDash: s === cS ? [] : [4, 4]
        }))
      };
      chNucShare.update();
    }
    if (chNucEnergy) {
      const _CF = {
        "Coal": 0.40,
        "NG CC": 0.50,
        "NG GT": 0.15,
        "CCS": 0.50,
        "Nuclear": 0.90,
        "SMR": 0.90,
        "ARTES": 0.90,
        "HTGR": 0.90,
        "Wind": 0.35,
        "Offshore": 0.45,
        "UPV": 0.22,
        "DPV": 0.15,
        "Hydro": 0.40,
        "Geo/Bio": 0.80,
        "UtilStorage": 0
      };
      chNucEnergy.data = {
        labels: YEARS,
        datasets: scenKeys.map((s, i) => ({
          label: scenLabels[i],
          borderColor: scenColors[i],
          backgroundColor: "transparent",
          data: YEARS.map(y => {
            const cap = (NAT[s] || {
              cap: {}
            }).cap[y] || {};
            const nucGwh = ((cap.Nuclear || 0) * 0.90 + (cap.SMR || 0) * 0.90 + (cap.ARTES || 0) * 0.90 + (cap.HTGR || 0) * 0.90) * 8.76;
            const totGwh = Object.entries(cap).reduce((a, [t, mw]) => a + (mw * (_CF[t] || 0.30) * 8.76), 0);
            return totGwh > 0 ? Math.round(nucGwh / totGwh * 1000) / 10 : 0;
          }),
          pointRadius: 2,
          borderWidth: s === cS ? 2.5 : 1.5,
          tension: .3,
          borderDash: s === cS ? [] : [4, 4]
        }))
      };
      chNucEnergy.update();
    }
  }
  uSD()
}

function uSD() {
  const sc = (SC[cS] || {})[cSt] || {},
    mix = sc[cY] || {};
  const sd = (SD[cS] || {})[N2A[cSt] || ""] || {},
    d = sd[cY] || {},
    r = d.reactors || {};
  document.getElementById("stateMixTitle").textContent = cSt + " Energy Mix \u2014 " + cY;
  const _MIX_TECHS = new Set(["Coal", "NG CC", "NG GT", "CCS", "Nuclear", "SMR", "ARTES", "HTGR", "Wind", "Offshore", "Hydro", "UPV", "DPV", "Geo/Bio", "UtilStorage"]);
  const advNuc = (mix.SMR || 0) + (mix.ARTES || 0) + (mix.HTGR || 0);
  const mixMerged = {};
  for (const [k, v] of Object.entries(mix)) {
    if (_MIX_TECHS.has(k)) mixMerged[k] = v;
  }
  delete mixMerged.SMR;
  delete mixMerged.ARTES;
  delete mixMerged.HTGR;
  if (advNuc > 0) mixMerged["Advanced Nuclear"] = advNuc;
  const me = Object.entries(mixMerged).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  ch4.data = {
    labels: me.map(([t]) => t),
    datasets: [{
      data: me.map(([_, v]) => v),
      backgroundColor: me.map(([t]) => CC[t] || "#94a3b8"),
      borderWidth: 1
    }]
  };
  ch4.update();
  ch5.data = {
    labels: YEARS,
    datasets: STK.map((t, i) => ({
      label: t,
      backgroundColor: SKC[i],
      data: YEARS.map(y => {
        const c = sc[y] || {};
        const v = t === "Advanced Nuclear" ? (c.SMR || 0) + (c.ARTES || 0) + (c.HTGR || 0) : c[t] || 0;
        return Math.round(v / 1000);
      })
    })).filter(d => d.data.some(v => v > 0))
  };
  ch5.update();
  // Nuclear breakdown table
  const abbr = N2A[cSt] || "";
  const nd = (ND[cS] || {})[abbr] || {};
  const yd = nd[cY] || {};
  const advR = (r.SMR || 0) + (r.ARTES || 0) + (r.HTGR || 0);
  const advJ = ((yd.SMR || {}).jobs || 0) + ((yd.ARTES || {}).jobs || 0) + ((yd.HTGR || {}).jobs || 0);
  const advRv = ((yd.SMR || {}).rev || 0) + ((yd.ARTES || {}).rev || 0) + ((yd.HTGR || {}).rev || 0);
  const tR = advR,
    tJ = advJ,
    tRv = advRv;
  const _roiW = (((yd.SMR || {}).roi || 0) * ((yd.SMR || {}).rev || 0)) + (((yd.ARTES || {}).roi || 0) * ((yd.ARTES || {}).rev || 0)) + (((yd.HTGR || {}).roi || 0) * ((yd.HTGR || {}).rev || 0));
  const advRoi = advRv > 0 ? _roiW / advRv : 0;
  let h = '<div class="stat-grid">';
  h += '<div class="stat-item"><span class="stat-label">Reactors</span><span class="stat-value"><span class="stat-dot"></span>' + tR + '</span></div>';
  h += '<div class="stat-item"><span class="stat-label">Jobs</span><span class="stat-value">' + (tJ ? tJ.toLocaleString() : "\u2014") + '</span></div>';
  h += '<div class="stat-item"><span class="stat-label">Revenue</span><span class="stat-value">' + fD(tRv) + '</span></div>';
  h += '<div class="stat-item"><span class="stat-label">ROI</span><span class="stat-value">' + (advRoi ? advRoi.toFixed(1) + "%" : "\u2014") + '</span></div>';
  h += '</div>';
  document.getElementById("nukeTable").innerHTML = h;
  document.getElementById("nukeTableTitle").textContent = "Advanced Nuclear Statistics \u2014 " + cY;
  // Summary text
  const totalCap = Object.values(mixMerged).reduce((s, v) => s + v, 0);
  const topTech = me.length ? me[0][0] : "";
  const topPct = totalCap > 0 ? Math.round(me[0][1] / totalCap * 100) : 0;
  const nukePct = totalCap > 0 ? Math.round(((mixMerged["Advanced Nuclear"] || 0) + (mixMerged.Nuclear || 0)) / totalCap * 100) : 0;
  const _CF2 = {
    "Coal": 0.40,
    "NG CC": 0.50,
    "NG GT": 0.15,
    "CCS": 0.50,
    "Nuclear": 0.90,
    "Advanced Nuclear": 0.90,
    "Wind": 0.35,
    "Offshore": 0.45,
    "UPV": 0.22,
    "DPV": 0.15,
    "Hydro": 0.40,
    "Geo/Bio": 0.80,
    "UtilStorage": 0
  };
  const totEnergy = Object.entries(mixMerged).reduce((s, [t, v]) => s + (v * (_CF2[t] || 0.30)), 0);
  const nukeEnergy = ((mixMerged["Advanced Nuclear"] || 0) * 0.90 + (mixMerged.Nuclear || 0) * 0.90);
  const nukeEnergyPct = totEnergy > 0 ? Math.round(nukeEnergy / totEnergy * 100) : 0;
  var _sAbbr = N2A[cSt] || "";
  var _sr2 = SR[cSt];
  // Line 1: deployment facts
  var sm1 = '<strong>' + cSt + '</strong> in <strong>' + cY + '</strong>: ';
  if (tR > 0) {
    sm1 += 'deploys <strong>' + tR + ' advanced nuclear reactors</strong>, creating <strong>' + tJ.toLocaleString() + ' nuclear power plant jobs</strong>. ';
    sm1 += 'Nuclear provides <strong>' + nukePct + '%</strong> of installed capacity and <strong>' + nukeEnergyPct + '%</strong> of total electricity generation. ';
  } else {
    sm1 += 'no advanced nuclear deployment yet. ';
  }
  if (totalCap > 0) sm1 += '<strong>' + (totalCap / 1000).toFixed(0) + ' GW</strong> total grid capacity, led by ' + topTech + ' (' + topPct + '%).';
  // Line 2: policy context as badges + investment
  var sm2 = '';
  if (_sr2) {
    var _envColor = _sr2.env === "Clear" ? "#16a34a" : _sr2.env === "Mixed" ? "#ca8a04" : "#dc2626";
    var _envBg = _sr2.env === "Clear" ? "#dcfce7" : _sr2.env === "Mixed" ? "#fef9c3" : "#fee2e2";
    var _mktColor = _sr2.mkt === "Merchant Generator" ? "#1d4ed8" : "#c2410c";
    var _mktBg = _sr2.mkt === "Merchant Generator" ? "#dbeafe" : "#ffedd5";
    var _badge = 'border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;display:inline-block;margin-right:6px;';
    sm2 += '<span style="' + _badge + 'color:' + _mktColor + ';background:' + _mktBg + '">' + _sr2.mkt + '</span>';
    sm2 += '<span style="' + _badge + 'color:' + _envColor + ';background:' + _envBg + '">' + (_sr2.env === "Clear" ? "Permissive" : _sr2.env === "Mixed" ? "Mixed" : "Restricted") + '</span>';
  }
  if (_sAbbr && STATE_INV[_sAbbr] && STATE_INV[_sAbbr][cS]) {
    var _inv = STATE_INV[_sAbbr][cS][String(cY)] || 0;
    var _isBan = BAN_STATES.indexOf(_sAbbr) >= 0;
    if (_inv > 0) {
      var _invColor = _isBan ? "#dc2626" : "#0d9488";
      var _invBg = _isBan ? "#fee2e2" : "#ccfbf1";
      var _badge2 = 'border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;display:inline-block;color:' + _invColor + ';background:' + _invBg + ';';
      var _invLabel = _isBan ? "Unrealized Investment" : "Projected Investment";
      sm2 += '<span style="' + _badge2 + '">' + _invLabel + ': $' + _inv.toFixed(1) + 'B cumulative through ' + cY + '</span>';
    }
  }
  document.getElementById("stateSummary").innerHTML = '<p style="margin:0 0 6px">' + sm1 + '</p>' + (sm2 ? '<p style="margin:0">' + sm2 + '</p>' : '');
}

function uU() {
  gL.clearLayers();
  uL.clearLayers();
  cL.clearLayers();
  // Render directly from uprate.json — no WISdom dependency, no ORPHAN fallback needed.
  Object.entries(UR).forEach(([pnK, ur]) => {
    // Skip permanently retired plants (not restarts)
    if (ur.retYear && !ur.restart) return;
    const [latS, lonS] = pnK.split(",");
    const lat = parseFloat(latS), lon = parseFloat(lonS);
    const pNm = PN[pnK] || null;
    const isRestart = !!ur.restart;
    const _dotMWe = Math.round(ur.mwt / 3);
    const _capPct = !isRestart ? getCapPct(ur.d) : null;
    const _origMWe = !isRestart
      ? (ur.doneMWt != null
          ? Math.round((ur.mwt - ur.doneMWt) / 3)
          : (_capPct !== null && ur.add > 0)
            ? Math.round((ur.mwt + ur.add) / (1 + _capPct) / 3)
            : null)
      : null;
    const _hasDone = _origMWe && _origMWe < _dotMWe;
    const _pctDone = _hasDone ? (_dotMWe - _origMWe) / _dotMWe : 0;
    const _strokeCol = isRestart ? "#0d9488" : (_hasDone ? "#4a1d7a" : "#fff");
    const _strokeW = _hasDone ? Math.round((1.5 + _pctDone * 2.5) * 10) / 10 : 1;
    const ci = L.circleMarker([lat, lon], {
      radius: gR(_dotMWe),
      fillColor: isRestart ? "#0d9488" : "#814DB1",
      fillOpacity: .8,
      color: _strokeCol,
      weight: _strokeW,
      opacity: 1
    });
    ci.on('click', function(e) {
      L.DomEvent.stopPropagation(e);
      showUprateDetail(ur, pNm, PSTATE[pnK]);
    });
    if (isRestart) {
      const _r = gR(_dotMWe) * 2;
      uL.addLayer(L.marker([lat, lon], {
        interactive: false,
        icon: L.divIcon({
          className: '',
          html: '<div style="width:' + _r + 'px;height:' + _r + 'px;border-radius:50%;background:#0d9488;opacity:.85;border:2px dotted rgba(255,255,255,.9);box-shadow:0 0 0 3px rgba(13,148,136,.5),0 0 8px 2px rgba(13,148,136,.4);box-sizing:border-box"></div>',
          iconSize: [_r, _r],
          iconAnchor: [_r / 2, _r / 2]
        })
      }));
    } else if (ur.proposed) {
      const rad = ur.add > 0 ? gUpR(Math.round(ur.add / 3), _dotMWe) : Math.max(gR(_dotMWe) + 5, 12);
      const ring = L.circleMarker([lat, lon], {
        radius: rad, fillOpacity: 0, color: "#22c55e", weight: 2.5, opacity: .9, dashArray: "5,3"
      });
      ring.on('click', function(e) { L.DomEvent.stopPropagation(e); showUprateDetail(ur, pNm, PSTATE[pnK]); });
      uL.addLayer(ring);
    } else if (ur.add > 0) {
      const ring = L.circleMarker([lat, lon], {
        radius: gUpR(Math.round(ur.add / 3), _dotMWe),
        fillOpacity: 0, color: "#f59e0b", weight: 2, opacity: .9, dashArray: "6,4"
      });
      ring.on('click', function(e) { L.DomEvent.stopPropagation(e); showUprateDetail(ur, pNm, PSTATE[pnK]); });
      uL.addLayer(ring);
    }
    gL.addLayer(ci);
  });
}

function swT(t) {
  cT = t;
  const _mv = t === "map" || t === "uprate";
  document.getElementById("mapView").style.display = _mv ? "flex" : "none";
  document.getElementById("dashboard").style.display = t === "dashboard" ? "block" : "none";
  document.getElementById("mapControls").style.display = t === "map" ? "flex" : "none";
  const _mc = document.getElementById("mainControls");
  if (_mc) _mc.style.display = t === "uprate" ? "none" : "";
  const _st = document.getElementById("scenarioTabs");
  if (_st) _st.style.display = t === "uprate" ? "none" : "flex";
  const _ml = document.getElementById("legend");
  if (_ml) _ml.style.display = t === "uprate" ? "none" : "";
  if (_mv) {
    setTimeout(() => {
      map.invalidateSize();
      // Uprate tab has 300px right panel — zoom out slightly and shift center east
      if (t === "uprate") map.setView([38, -96], 4.8);
    }, 100);
    if (t === "map") {
      uM();
    } else {
      uU();
      applyStateOverlay();
      const _ol = document.getElementById("overlayLegend");
      if (_ol) _ol.innerHTML = '';
    }
  } else {
    uDash();
    // Chart.js calculates canvas size at init time; if the section was hidden,
    // dimensions are wrong. Force a resize now that dashboard is visible.
    setTimeout(() => {
      Object.values(Chart.instances).forEach(c => c.resize());
    }, 100);
  }
  toggleUprateCard();
}

function tgA() {
  const b = document.getElementById("playBtn");
  if (aI) {
    clearInterval(aI);
    aI = null;
    b.innerHTML = "\u25b6";
    return
  }
  b.innerHTML = "\u25a0";
  aI = setInterval(() => {
    const sl = document.getElementById("yearSlider");
    let v = (parseInt(sl.value) + 1) % 7;
    sl.value = v;
    cY = String(YEARS[v]);
    document.getElementById("yearDisplay").textContent = cY;
    if (cT === "map") uM();
    else {
      uSD()
    }
  }, 1500)
}

function initApp() {
  document.querySelectorAll(".main-tab").forEach(b => {
    b.addEventListener("click", function() {
      document.querySelectorAll(".main-tab").forEach(x => x.classList.remove("active"));
      this.classList.add("active");
      swT(this.dataset.tab)
    })
  });
  document.querySelectorAll(".scenario-tab").forEach(b => {
    b.addEventListener("click", function() {
      document.querySelectorAll(".scenario-tab").forEach(x => x.classList.remove("active"));
      this.classList.add("active");
      cS = this.dataset.scen;
      if (cT === "map") uM();
      else uDash()
    })
  });
  document.getElementById("yearSlider").addEventListener("input", function() {
    cY = String(YEARS[this.value]);
    document.getElementById("yearDisplay").textContent = cY;
    if (cT === "map") uM();
    else {
      uSD()
    }
  });
  document.getElementById("playBtn").addEventListener("click", tgA);
  initMap();
  initDash();
  uM();
  buildUprateCard();
  toggleUprateCard();
  window.addEventListener("load", function() {
    if (map) map.invalidateSize();
  });
}
