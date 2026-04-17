function fD(v) {
  if (!v || v <= 0) return "$0";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return "$" + Math.round(v / 1e6) + "M";
  return "$" + Math.round(v / 1e3) + "K"
}

function gR(m) {
  if (m >= 5000) return 12;
  if (m >= 2000) return 9;
  if (m >= 1000) return 7;
  if (m >= 500) return 5.5;
  if (m >= 100) return 4;
  return 2.5
}

function gUpR(addMWe, dotMWe) {
  const dotR = gR(dotMWe);
  return dotR + Math.max(3, Math.round(addMWe * 0.012));
}
// Use dark stroke for light-filled dots so they're visible on the light basemap
const _DARK_STROKE = new Set(["NGCC", "NGCT", "NG CC", "NG GT", "UPV", "CSP", "Offshore"]);

function dotStroke(dom) {
  return _DARK_STROKE.has(dom) ? "#64748b" : "#fff";
}

function findUR(lat, lon) {
  const k = lat.toFixed(3) + ',' + lon.toFixed(3);
  if (UR[k]) return UR[k];
  let best = null,
    bestD = 0.0025; // ~5.5km tolerance
  for (const uk in UR) {
    const p = uk.split(',');
    const d = (p[0] - lat) * (p[0] - lat) + (p[1] - lon) * (p[1] - lon);
    if (d < bestD) {
      bestD = d;
      best = UR[uk];
    }
  }
  return best;
}

function getCapPct(d) {
  if (!d) return null;
  if (d.includes("AP1000")) return 0.0;
  if (d.includes("System 80")) return 0.05;
  if (/B&W/.test(d)) return 0.016;
  if (/GE|BWR/.test(d)) return 0.20;
  if (/W 4-Loop/.test(d)) return 0.09;
  if (/W 3-Loop/.test(d)) return 0.20;
  if (/W 2-Loop/.test(d)) return 0.185;
  if (/CE/.test(d)) return 0.18;
  return null;
}

