// data_loader.js — Async JSON data loader
// Replaces the synchronous data.js + scenario-data.js <script> tags.
// Fetches all data files in parallel, assigns to globals, then calls initApp().

// ── Global data variables (populated by loadAllData) ──────────────────────
let PN, UR, ORPHAN, PSTATE, SR, DATA, SC;
let SD, GD, NAT, NAT_JOBS, RETAIL, SYSCOST, ND, STATE_INV, DISP;
let NRC_PIPELINE;

async function loadAllData() {
  const base = './data/';
  const [
    plantMeta, uprate, orphan, statePolicy,
    plants, coalSites, stateCapacity,
    stateScenarios, geodata, national,
    nuclearDetail, stateInvestment, dispatch,
    nrcPipeline
  ] = await Promise.all([
    fetch(base + 'plant_meta.json').then(r => r.json()),
    fetch(base + 'uprate.json').then(r => r.json()),
    fetch(base + 'orphan.json').then(r => r.json()),
    fetch(base + 'state_policy.json').then(r => r.json()),
    fetch(base + 'plants.json').then(r => r.json()),
    fetch(base + 'coal_sites.json').then(r => r.json()),
    fetch(base + 'state_capacity.json').then(r => r.json()),
    fetch(base + 'state_scenarios.json').then(r => r.json()),
    fetch(base + 'geodata.json').then(r => r.json()),
    fetch(base + 'national.json').then(r => r.json()),
    fetch(base + 'nuclear_detail.json').then(r => r.json()),
    fetch(base + 'state_investment.json').then(r => r.json()),
    fetch(base + 'dispatch.json').then(r => r.json()),
    fetch(base + 'nrc_pipeline.json').then(r => r.json()),
  ]);

  // Assign to globals — same names as the old data.js / scenario-data.js
  PN     = plantMeta.names;
  PSTATE = plantMeta.states;
  UR     = uprate;
  ORPHAN = orphan;
  SR     = statePolicy;
  DATA   = { g: plants, c: coalSites };
  SC     = stateCapacity;

  SD       = stateScenarios;
  GD       = geodata;
  NAT      = national.capacity;
  NAT_JOBS = national.adv_nuke_jobs;
  RETAIL   = national.retail_price;
  SYSCOST  = national.system_cost;
  ND          = nuclearDetail;
  STATE_INV   = stateInvestment;
  DISP        = dispatch;
  NRC_PIPELINE = nrcPipeline;
}

window.addEventListener('DOMContentLoaded', async function () {
  const overlay = document.getElementById('loadingOverlay');
  try {
    await loadAllData();
    if (overlay) overlay.style.display = 'none';
    initApp();
  } catch (e) {
    console.error('Data load failed:', e);
    if (overlay) overlay.innerHTML =
      '<div style="text-align:center;padding:40px;color:#dc2626">' +
      '<div style="font-size:18px;font-weight:700;margin-bottom:8px">Failed to load data</div>' +
      '<div style="font-size:13px;color:#64748b">' + e.message + '</div></div>';
  }
});
