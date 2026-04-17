const COLORS={"Coal":"#252A2B","NGCC":"#6D7374","NGCT":"#C0C6C8","NG CC":"#6D7374","NG GT":"#C0C6C8","Storage":"#E82269","UtilStorage":"#E82269","Nuclear":"#814DB1","Hydro":"#003FFD","Wind":"#2CA02C","Offshore":"#98DF8A","DPV":"#FF7F0E","UPV":"#FFDE20","CSP":"#FDFD4D","Geo/Bio":"#8C564B","CCS":"#D62728","SMR":"#0DC3A8","ARTES":"#0DC3A8","HTGR":"#0DC3A8"};
const TN={"Coal":"Coal","NGCC":"Natural Gas CC","NGCT":"Natural Gas CT","NG CC":"Natural Gas CC","NG GT":"Natural Gas CT","Storage":"Battery Storage","UtilStorage":"Battery Storage","Nuclear":"Nuclear","Hydro":"Hydro","Wind":"Onshore Wind","Offshore":"Offshore Wind","DPV":"Rooftop Solar","UPV":"Utility Solar","CSP":"CSP","Geo/Bio":"Geo/Bio","CCS":"CCS","SMR":"Advanced Nuclear","ARTES":"Advanced Nuclear","HTGR":"Advanced Nuclear"};
const CC={"NG CC":"#6D7374","NG GT":"#C0C6C8",UtilStorage:"#E82269",Nuclear:"#814DB1",Hydro:"#003FFD",Wind:"#2CA02C",Offshore:"#98DF8A",DPV:"#FF7F0E",UPV:"#FFDE20","Geo/Bio":"#8C564B",CCS:"#D62728",SMR:"#0DC3A8",ARTES:"#0DC3A8",HTGR:"#0DC3A8","Advanced Nuclear":"#0DC3A8",Coal:"#252A2B"};
const YEARS=[2020,2025,2030,2035,2040,2045,2050],AT=Object.keys(COLORS);
const N2A={"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","District of Columbia":"DC","Puerto Rico":"PR"};

const BAN_STATES=["CA","CT","HI","MA","ME","MN","NJ","OR","RI","VT"];

let map,gL,uL,cL,sL,cY="2020",cS="LowCost LowLR",cT="map",cSt="California",aT=new Set(["Nuclear","SMR","ARTES","HTGR"]),aI=null,showUprate=true,showConvert=true;
let ch1,ch2,ch3,ch4,ch5,ch6,ch7,ch8,chNucCap,chJobs,chNucShare,chNucEnergy,sC="reactors",sA=false;
function fD(v){if(!v||v<=0)return"$0";if(v>=1e9)return"$"+(v/1e9).toFixed(1)+"B";if(v>=1e6)return"$"+Math.round(v/1e6)+"M";return"$"+Math.round(v/1e3)+"K"}
function gR(m){if(m>=5000)return 12;if(m>=2000)return 9;if(m>=1000)return 7;if(m>=500)return 5.5;if(m>=100)return 4;return 2.5}
function gUpR(addMWe,dotMWe){const dotR=gR(dotMWe);return dotR+Math.max(3,Math.round(addMWe*0.012));}
// Use dark stroke for light-filled dots so they're visible on the light basemap
const _DARK_STROKE=new Set(["NGCC","NGCT","NG CC","NG GT","UPV","CSP","Offshore"]);
function dotStroke(dom){return _DARK_STROKE.has(dom)?"#64748b":"#fff";}

function findUR(lat,lon){
  const k=lat.toFixed(3)+','+lon.toFixed(3);
  if(UR[k])return UR[k];
  let best=null,bestD=0.0025; // ~5.5km tolerance
  for(const uk in UR){const p=uk.split(',');const d=(p[0]-lat)*(p[0]-lat)+(p[1]-lon)*(p[1]-lon);if(d<bestD){bestD=d;best=UR[uk];}}
  return best;
}
function getCapPct(d){
  if(!d)return null;
  if(d.includes("AP1000"))return 0.0;
  if(d.includes("System 80"))return 0.05;
  if(/B&W/.test(d))return 0.016;
  if(/GE|BWR/.test(d))return 0.20;
  if(/W 4-Loop/.test(d))return 0.09;
  if(/W 3-Loop/.test(d))return 0.20;
  if(/W 2-Loop/.test(d))return 0.185;
  if(/CE/.test(d))return 0.18;
  return null;
}
function showUprateDetail(ur,pNm,stateName){
  const siteD=ur.d;
  const _units=ur.units||(function(){const pm=Math.round(ur.mwt/ur.u),pa=Math.round(ur.add/ur.u);const a=[];for(let i=0;i<ur.u;i++)a.push({mwt:pm,add:pa});return a;})();
  const capPct=getCapPct(siteD);
  let h='<div style="font-size:10px;color:#814DB1;cursor:pointer;margin-bottom:8px;font-weight:600" onclick="buildUprateCard()">\u2190 All plants</div>';
  h+='<div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:2px">'+(pNm||"Nuclear Plant")+'</div>';
  if(ur.restart){h+='<div style="font-size:13px;font-weight:700;color:#0d9488;line-height:1.1;margin-bottom:1px">Restarting</div>';}
  else if(ur.add>0){h+='<div style="font-size:22px;font-weight:800;color:#814DB1;line-height:1.1;margin-bottom:1px">+'+Math.round(ur.add/3).toLocaleString()+' <span style="font-size:13px;font-weight:600">MWe potential</span></div>';}
  h+='<div style="font-size:11px;color:#94a3b8;margin-bottom:6px">'+siteD+(ur.u>1?' &mdash; '+ur.u+' units':'')+'</div>';
  if(capPct!==null)h+='<div style="font-size:10px;color:#64748b;margin-bottom:8px">Max uprate cap: <strong>'+(capPct*100)+'%</strong></div>';
  var _isRestart=!!ur.restart;
  h+='<table style="width:100%;font-size:10px;border-collapse:collapse">';
  h+='<tr style="border-bottom:1px solid #e2e8f0">';
  h+='<th style="text-align:left;padding:2px 3px;color:#64748b">Unit</th>';
  h+='<th style="text-align:right;padding:2px 3px;color:#64748b">Orig. MWt</th>';
  h+='<th style="text-align:right;padding:2px 3px;color:#94a3b8">Done MWt</th>';
  h+='<th style="text-align:right;padding:2px 3px;color:#1e293b">Now MWt</th>';
  if(!_isRestart)h+='<th style="text-align:right;padding:2px 3px;color:#4ade80">Left MWt</th>';
  h+='</tr>';
  var tRef=0,tDone=0,tNow=0,tLeft=0;
  _units.forEach(function(u,i){
    var uD=u.d||siteD;
    var cap=getCapPct(uD);
    var max=u.mwt+u.add;
    var ref=(cap!==null&&cap>0)?Math.round(max/(1+cap)):u.mwt;
    var done=u.mwt-ref;
    var donePct=ref>0?Math.round(done/ref*1000)/10:0;
    var remPct=ref>0?Math.round(u.add/ref*1000)/10:0;
    tRef+=ref;tDone+=done;tNow+=u.mwt;tLeft+=u.add;
    h+='<tr style="border-bottom:1px solid #f1f5f9">';
    h+='<td style="padding:2px 3px;color:#334155">'+(u.name||"Unit "+(i+1))+'</td>';
    h+='<td style="text-align:right;padding:2px 3px;color:#64748b">'+ref.toLocaleString()+'</td>';
    h+='<td style="text-align:right;padding:2px 3px;color:#94a3b8">'+(done>0?'+'+done.toLocaleString()+' <span style="font-size:9px">('+donePct+'%)</span>':'—')+'</td>';
    h+='<td style="text-align:right;padding:2px 3px;font-weight:600">'+u.mwt.toLocaleString()+'</td>';
    if(!_isRestart)h+='<td style="text-align:right;padding:2px 3px">'+(u.add>0?'<span style="color:#4ade80">+'+u.add.toLocaleString()+' <span style="font-size:9px">('+remPct+'%)</span></span>':'<span style="color:#f87171">maxed</span>')+'</td>';
    h+='</tr>';
  });
  var tDonePct=tRef>0?Math.round(tDone/tRef*1000)/10:0;
  var tRemPct=tRef>0?Math.round(tLeft/tRef*1000)/10:0;
  h+='<tr style="font-weight:700;border-top:2px solid #e2e8f0">';
  h+='<td style="padding:3px 3px;color:#1e293b">Total</td>';
  h+='<td style="text-align:right;padding:3px 3px;color:#64748b">'+tRef.toLocaleString()+'</td>';
  h+='<td style="text-align:right;padding:3px 3px;color:#94a3b8">'+(tDone>0?'+'+tDone.toLocaleString()+' <span style="font-size:9px">('+tDonePct+'%)</span>':'—')+'</td>';
  h+='<td style="text-align:right;padding:3px 3px">'+tNow.toLocaleString()+'</td>';
  if(!_isRestart)h+='<td style="text-align:right;padding:3px 3px;color:#4ade80">+'+tLeft.toLocaleString()+' <span style="font-size:9px">('+tRemPct+'%)</span></td>';
  h+='</tr></table>';
  if(ur.note)h+='<div style="font-size:10px;color:#fbbf24;margin-top:3px">'+ur.note+'</div>';
  h+='<div class="uc-note">Plant-level headroom in MWt (thermal). MWe headline = MWt &divide; 3 (assumes ~33% thermal efficiency, per DOE/INL methodology).<br>Source: FAI State Permitting Playbook (Nov 2025) &bull; INL/EXT-24-78810 &bull; NRC</div>';
  document.getElementById("uprate-card-content").innerHTML=h;
}
function buildUprateCard(){
  const _seen=new Set();let grandMWt=0,upSites=0,upUnits=0,restartMWt=0,doneMWt=0;
  Object.entries(UR).forEach(([k,ur])=>{
    const rk=parseFloat(k.split(',')[0]).toFixed(1)+','+parseFloat(k.split(',')[1]).toFixed(1);
    if(_seen.has(rk))return;_seen.add(rk);
    if(ur.retYear&&ur.retYear<=2025&&!ur.restart)return;
    if(ur.restart)return;
    if(ur.doneMWt)doneMWt+=ur.doneMWt;
    if(!ur.add||ur.add<=0)return;
    upSites++;
    upUnits+=ur.units?ur.units.filter(function(x){return x.add>0;}).length:(ur.u||1);
    grandMWt+=ur.add;
  });
  // Also count restartMWt separately (restarts excluded from done total)
  Object.entries(UR).forEach(([k,ur])=>{if(ur.restart)restartMWt+=ur.mwt;});
  const grandMWe=Math.round(grandMWt/3);
  const restartMWe=Math.round(restartMWt/3);
  const doneMWe=Math.round(doneMWt/3);
  // Summary bar — 3 groups: Already Done | Potential | Policy Targets
  let sb='<div class="usb-row">';
  // Group 1: Already Done
  sb+='<div class="usb-group">';
  sb+='<div class="usb-group-hdr">Already Done</div>';
  sb+='<div class="usb-group-stats"><div class="usb-stat"><div class="usb-val" style="color:#64748b">+'+doneMWe.toLocaleString()+' MWe</div><div class="usb-lbl">NRC approved uprates</div></div></div>';
  sb+='</div>';
  sb+='<div class="usb-div"></div>';
  // Group 2: Potential
  sb+='<div class="usb-group">';
  sb+='<div class="usb-group-hdr">Potential</div>';
  sb+='<div class="usb-group-stats">';
  sb+='<div class="usb-stat"><div class="usb-val">+'+grandMWe.toLocaleString()+' MWe</div><div class="usb-lbl">Uprate headroom &bull; '+upSites+' sites &bull; '+upUnits+' units</div></div>';
  if(restartMWe>0)sb+='<div class="usb-stat"><div class="usb-val" style="color:#0d9488">&#8635; +'+restartMWe.toLocaleString()+' MWe</div><div class="usb-lbl">Restarts (Palisades &bull; Crane &bull; Duane Arnold)</div></div>';
  sb+='</div></div>';
  sb+='<div class="usb-div"></div>';
  // Group 3: Planned
  sb+='<div class="usb-group">';
  sb+='<div class="usb-group-hdr">Planned</div>';
  sb+='<div class="usb-group-stats">';
  sb+='<div class="usb-stat"><div class="usb-val" style="color:#0ea5e9">2,422 MWe</div><div class="usb-lbl">Expected uprate applications to 2032</div></div>';
  sb+='</div></div>';
  sb+='<div class="usb-div"></div>';
  // Group 4: Policy Targets
  sb+='<div class="usb-group">';
  sb+='<div class="usb-group-hdr">Policy Targets</div>';
  sb+='<div class="usb-group-stats">';
  sb+='<div class="usb-stat"><div class="usb-val" style="color:#818cf8">~8,000 MWe<sup style="font-size:8px;font-weight:400">*</sup></div><div class="usb-lbl">NEI 2025 Survey</div></div>';
  sb+='<div class="usb-stat"><div class="usb-val" style="color:#fb923c">5,000 MWe</div><div class="usb-lbl">DOE UPRISE Target</div></div>';
  sb+='</div></div>';
  sb+='<div style="margin-left:auto;align-self:center;font-size:8px;color:#94a3b8;text-align:right;line-height:1.5">Plant-level headroom in MWt (thermal). MWe = MWt &divide; 3 (~33% thermal efficiency, per DOE/INL).<br>Source: FAI State Permitting Playbook (Nov 2025) &bull; INL/EXT-24-78810 &bull; NRC &bull; NRC Expected Uprate Applications &bull; Double-click state &rarr; Dashboard<br><sup>*</sup>NEI 2025 survey covers uprates, restarts, <em>and</em> fuel-cycle extensions; this map shows uprates and restarts only.</div>';
  sb+='</div>';
  // Legend row
  sb+='<div class="usb-legend">';
  sb+='<span class="usb-legend-hdr">Map Symbols</span>';
  sb+='<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;background:#814DB1;border:2px solid #4a1d7a;flex-shrink:0;box-sizing:border-box"></div>Uprates done</div>';

  sb+='<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;border:2px dashed #f59e0b;flex-shrink:0"></div>Uprate potential</div>';
  sb+='<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;border:2px dashed #22c55e;flex-shrink:0"></div>EPU planned</div>';
  sb+='<div class="usb-legend-item"><div style="width:11px;height:11px;border-radius:50%;background:#0d9488;border:2px dotted rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(13,148,136,.5);flex-shrink:0"></div>Restart</div>';
  sb+='<span class="usb-legend-hdr" style="margin-left:8px">Plant Size (MWe)</span>';
  [[8,'500'],[18,'2k'],[24,'5k']].forEach(function(s){sb+='<div class="usb-legend-item"><div style="width:'+s[0]+'px;height:'+s[0]+'px;border-radius:50%;background:rgba(129,77,177,.2);border:1.5px solid #814DB1;flex-shrink:0"></div>'+s[1]+'</div>';});
  sb+='<span class="usb-legend-hdr" style="margin-left:8px">Headroom (MWe)</span>';
  [[14,'50'],[21,'150'],[28,'300']].forEach(function(s){sb+='<div class="usb-legend-item"><div style="width:'+s[0]+'px;height:'+s[0]+'px;border-radius:50%;border:1.5px dashed #f59e0b;flex-shrink:0"></div>'+s[1]+'</div>';});
  sb+='</div>';
  document.getElementById("uprate-summary-content").innerHTML=sb;
  // Show charts in panel
  const _uc=document.getElementById("uprate-card-content");
  if(_uc){
    _uc.style.display="block";
    // Chart A: stacked bar — Done | Planned-to-2029 | Unplanned | Restarts vs DOE 5 GW goal
    // Values: done=doneMWe, planned2029=2042, unplanned=(grandMWe-2042), restarts=restartMWe
    // DOE goal marker at done+5000 relative to total
    const _planned2029=2042;
    const _unplannedMWe=Math.max(0,grandMWe-_planned2029);
    const _totalA=doneMWe+grandMWe+restartMWe; // grandMWe already includes planned2029
    const _doeX=doneMWe+5000;
    const _doePct=Math.min(100,(_doeX/_totalA)*100).toFixed(1);
    const _donePct=(doneMWe/_totalA*100).toFixed(1);
    const _plan2029Pct=(_planned2029/_totalA*100).toFixed(1);
    const _unplanPct=(_unplannedMWe/_totalA*100).toFixed(1);
    const _restartPct=(restartMWe/_totalA*100).toFixed(1);
    // Chart B: timeline SVG — cumulative NRC pipeline vs DOE UPRISE goals
    // Scale: 0–5500, SVG height 150px. y = 150-(val/5500*150)
    // Cumulative: 335,1210,1845,2042,2291,2357,2422
    // X: 15,51.7,88.3,125,161.7,198.3,235
    const _pts=[{x:15,y:(150-335/5500*150).toFixed(1),v:'335'},{x:51.7,y:(150-1210/5500*150).toFixed(1),v:'1,210'},{x:88.3,y:(150-1845/5500*150).toFixed(1),v:'1,845'},{x:125,y:(150-2042/5500*150).toFixed(1),v:'2,042'},{x:161.7,y:(150-2291/5500*150).toFixed(1),v:'2,291'},{x:198.3,y:(150-2357/5500*150).toFixed(1),v:'2,357'},{x:235,y:(150-2422/5500*150).toFixed(1),v:'2,422'}];
    const _yrs=['2026','2027','2028','2029','2030','2031','2032'];
    const _doe25y=(150-2500/5500*150).toFixed(1); // 2.5 GW at 2027
    const _doe5y=(150-5000/5500*150).toFixed(1);  // 5 GW at 2029
    let ch='';
    // ── Chart A ──
    ch+='<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:2px">How much more can we add?</div>';
    ch+='<div style="font-size:9px;color:#64748b;margin-bottom:14px">All figures in MWe &bull; additional capacity vs. DOE UPRISE goal</div>';
    ch+='<div style="position:relative;margin-bottom:10px">';
    // DOE 5 GW label
    ch+='<div style="position:absolute;top:-16px;left:'+_doePct+'%;transform:translateX(-50%);white-space:nowrap;text-align:center"><span style="font-size:8px;font-weight:700;color:#fb923c">5 GW goal</span></div>';
    // Stacked bar
    ch+='<div style="display:flex;height:30px;border-radius:4px;overflow:hidden;width:100%">';
    ch+='<div style="width:'+_donePct+'%;background:#94a3b8;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Already done: '+doneMWe.toLocaleString()+' MWe">'+doneMWe.toLocaleString()+'</div>';
    ch+='<div style="width:'+_plan2029Pct+'%;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Planned to 2029: 2,042 MWe">2,042</div>';
    ch+='<div style="width:'+_unplanPct+'%;background:#814DB1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Unplanned potential: '+_unplannedMWe.toLocaleString()+' MWe">'+(_unplannedMWe>200?_unplannedMWe.toLocaleString():'')+'</div>';
    ch+='<div style="width:'+_restartPct+'%;background:#0d9488;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0" title="Restarts: '+restartMWe.toLocaleString()+' MWe">'+restartMWe.toLocaleString()+'</div>';
    ch+='</div>';
    // DOE marker line
    ch+='<div style="position:absolute;top:0;left:'+_doePct+'%;transform:translateX(-50%);width:2px;height:30px;background:#fb923c"></div>';
    ch+='</div>';
    // Legend
    ch+='<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin-bottom:10px">';
    ch+='<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#94a3b8;flex-shrink:0"></div>Already done</div>';
    ch+='<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#0ea5e9;flex-shrink:0"></div>Planned (NRC, to 2029)</div>';
    ch+='<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#814DB1;flex-shrink:0"></div>Unplanned potential</div>';
    ch+='<div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#475569"><div style="width:8px;height:8px;border-radius:2px;background:#0d9488;flex-shrink:0"></div>Restarts</div>';
    ch+='</div>';
    // Analysis
    ch+='<div style="border-top:1px solid #f1f5f9;padding-top:8px;font-size:9px;color:#475569;line-height:1.7;margin-bottom:6px">';
    ch+='<div>&#8594; NRC planned covers only <strong style="color:#0ea5e9">'+Math.round(_planned2029/5000*100)+'%</strong> of the DOE UPRISE 5 GW goal</div>';
    ch+='</div>';
    ch+='<div style="font-size:8px;color:#94a3b8;line-height:1.5;border-top:1px solid #f1f5f9;padding-top:6px;margin-bottom:20px">Planned (2,042 MWe) = NRC expected applications to 2029. Restarts = Palisades, Crane, Duane Arnold. MWe &asymp; MWt &divide; 3.</div>';
    // ── Chart B ──
    ch+='<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:2px">Uprate Timeline: Planned vs. UPRISE Goal</div>';
    ch+='<div style="font-size:9px;color:#64748b;margin-bottom:8px">Cumulative planned MWe (NRC pipeline) vs. DOE targets</div>';
    ch+='<div style="display:flex;gap:6px">';
    // Y-axis labels
    ch+='<div style="display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;padding-right:2px;height:150px">';
    ['5k','4k','3k','2k','1k','0'].forEach(function(l){ch+='<span style="font-size:7px;color:#94a3b8;line-height:1">'+l+'</span>';});
    ch+='</div>';
    // SVG
    ch+='<div style="flex:1"><svg viewBox="0 0 250 160" style="width:100%;height:170px;overflow:visible">';
    // Gridlines
    ch+='<line x1="0" y1="150" x2="250" y2="150" stroke="#e2e8f0" stroke-width="1"/>';
    [122.7,95.5,68.2,40.9].forEach(function(y){ch+='<line x1="0" y1="'+y+'" x2="250" y2="'+y+'" stroke="#f1f5f9" stroke-width="1"/>';});
    // DOE 2.5 GW marker at 2027 (x=51.7)
    ch+='<line x1="33" y1="'+_doe25y+'" x2="71" y2="'+_doe25y+'" stroke="#fb923c" stroke-width="2" stroke-dasharray="4,2"/>';
    ch+='<text x="51.7" y="'+(parseFloat(_doe25y)-4.5)+'" text-anchor="middle" fill="#fb923c" font-size="7.5" font-weight="700">2.5 GW goal</text>';
    // DOE 5 GW marker at 2029 (x=125)
    ch+='<line x1="107" y1="'+_doe5y+'" x2="143" y2="'+_doe5y+'" stroke="#f97316" stroke-width="2" stroke-dasharray="4,2"/>';
    ch+='<text x="125" y="'+(parseFloat(_doe5y)-4.5)+'" text-anchor="middle" fill="#f97316" font-size="7.5" font-weight="700">5 GW goal</text>';
    // Connecting polyline
    ch+='<polyline points="'+_pts.map(function(p){return p.x+','+p.y;}).join(' ')+'" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-linejoin="round"/>';
    // Dots and labels
    _pts.forEach(function(p,i){
      ch+='<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#0ea5e9" stroke="#fff" stroke-width="1.5"/>';
      ch+='<text x="'+p.x+'" y="'+(parseFloat(p.y)-7)+'" text-anchor="middle" fill="#475569" font-size="7">'+p.v+'</text>';
      ch+='<text x="'+p.x+'" y="168" text-anchor="middle" fill="#64748b" font-size="8">'+_yrs[i]+'</text>';
    });
    ch+='</svg></div></div>';
    // Analysis
    ch+='<div style="border-top:1px solid #f1f5f9;padding-top:8px;margin-top:2px;font-size:9px;color:#475569;line-height:1.7">';
    ch+='<div>&#8594; Falls <strong style="color:#fb923c">52% short</strong> of the 2.5 GW 2027 UPRISE goal</div>';
    ch+='<div>&#8594; Falls <strong style="color:#f97316">59% short</strong> of the 5 GW 2029 UPRISE goal</div>';
    ch+='</div>';
    ch+='<div style="font-size:8px;color:#94a3b8;margin-top:8px;line-height:1.5;border-top:1px solid #f1f5f9;padding-top:6px">Source: NRC Expected Applications for Power Uprates (retrieved Apr 2026).</div>';
    // Click hint
    ch+='<div style="color:#94a3b8;font-size:10px;text-align:center;padding:16px 12px 4px;line-height:1.8">&#8679; Click any dashed ring on the map for plant-level details</div>';
    _uc.innerHTML=ch;
  }
}
function toggleUprateCard(){
  const bar=document.getElementById("uprateSummaryBar");
  const panel=document.getElementById("upratePanel");
  const on=cT==="uprate";
  if(bar)bar.style.display=on?"block":"none";
  if(panel)panel.style.display=on?"block":"none";
}
function initMap(){
  map=L.map("map",{zoomControl:true,attributionControl:false,maxBounds:[[18,-135],[55,-60]],maxBoundsViscosity:1.0,minZoom:3}).setView([39,-96],4.5);
  map.createPane('labelsPane');map.getPane('labelsPane').style.zIndex=250;map.getPane('labelsPane').style.pointerEvents='none';
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",{maxZoom:18}).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",{maxZoom:18,pane:"labelsPane"}).addTo(map);
  
var GD_CONUS={type:"FeatureCollection",features:GD.features.filter(function(f){return f.properties.name!=="Alaska"&&f.properties.name!=="Hawaii";})};sL=L.geoJSON(GD_CONUS,{style:{fillColor:"transparent",fillOpacity:0,weight:.8,color:"#cbd5e1",opacity:.3},bubblingMouseEvents:true,
    onEachFeature:function(f,l){const a=N2A[f.properties.name]||"";
      l.bindTooltip(function(){return bST(a,f.properties.name)},{className:"state-tip",sticky:true,opacity:1,direction:"top",offset:[0,-12]});
      l.on("mouseover",function(){var bs=getStateOverlayStyle(f);var fc=bs.fillColor==="transparent"?"#1e293b":bs.fillColor;this.setStyle({fillColor:fc,fillOpacity:(bs.fillOpacity||0)+.15,weight:2,color:"#475569",opacity:.7})});
      l.on("mouseout",function(){this.setStyle(getStateOverlayStyle(f))});
      l.on("dblclick",function(){var sn=f.properties.name;if(sn&&SC[cS]&&SC[cS][sn]){cSt=sn;document.getElementById("stateSelect").value=sn;document.querySelectorAll(".main-tab").forEach(function(x){x.classList.remove("active");if(x.dataset.tab==="dashboard")x.classList.add("active")});swT("dashboard")}})}}).addTo(map);
  gL=L.layerGroup().addTo(map);uL=L.layerGroup().addTo(map);cL=L.layerGroup().addTo(map);
  bTg();bLg()}
function getStateOverlayStyle(feature){
  if(cT==="uprate")return{fillColor:"transparent",fillOpacity:0,weight:.8,color:"#cbd5e1",opacity:.3};
  var sn=feature&&feature.properties&&feature.properties.name;
  var rd=SR[sn];
  var showReg=document.getElementById("showRegulatory")&&document.getElementById("showRegulatory").checked;
  var showMkt=document.getElementById("showMarket")&&document.getElementById("showMarket").checked;
  if(showReg&&rd){var fc=rd.env==="Clear"?"#bbf7d0":rd.env==="Mixed"?"#fef08a":"#fecaca";return{fillColor:fc,fillOpacity:.4,weight:.8,color:"#cbd5e1",opacity:.3};}
  if(showMkt&&rd){var fc=rd.mkt==="Merchant Generator"?"#bfdbfe":"#fde8dd";return{fillColor:fc,fillOpacity:.4,weight:.8,color:"#cbd5e1",opacity:.3};}
  return{fillColor:"transparent",fillOpacity:0,weight:.8,color:"#cbd5e1",opacity:.3};
}
function applyStateOverlay(){
  if(!sL)return;
  sL.setStyle(getStateOverlayStyle);
  var showReg=document.getElementById("showRegulatory")&&document.getElementById("showRegulatory").checked;
  var showMkt=document.getElementById("showMarket")&&document.getElementById("showMarket").checked;
  var el=document.getElementById("overlayLegend");
  if(!el)return;
  if(showReg){
    el.innerHTML='<div class="legend-section"><h3>Policy Climate</h3><div class="legend-grid">'+
      '<div class="legend-item"><span class="legend-dot" style="background:#bbf7d0;border:1px solid #86efac;border-radius:2px;width:14px;height:14px"></span>Permissive</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:#fef08a;border:1px solid #fde047;border-radius:2px;width:14px;height:14px"></span>Mixed</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:#fecaca;border:1px solid #fca5a5;border-radius:2px;width:14px;height:14px"></span>Restricted</div>'+
      '</div></div>';
  } else if(showMkt){
    el.innerHTML='<div class="legend-section"><h3>Electricity Market</h3><div class="legend-grid">'+
      '<div class="legend-item"><span class="legend-dot" style="background:#bfdbfe;border:1px solid #93c5fd;border-radius:2px;width:14px;height:14px"></span>Merchant Generator</div>'+
      '<div class="legend-item"><span class="legend-dot" style="background:#fde8dd;border:1px solid #EE5C36;border-radius:2px;width:14px;height:14px"></span>Cost Recovery</div>'+
      '</div></div>';
  } else {
    el.innerHTML='';
  }
}
function toggleRegLayer(){var cb=document.getElementById("showMarket");if(cb&&document.getElementById("showRegulatory").checked)cb.checked=false;applyStateOverlay();}
function toggleMarketLayer(){var cb=document.getElementById("showRegulatory");if(cb&&document.getElementById("showMarket").checked)cb.checked=false;applyStateOverlay();}


function bUprateST(stateName){
  var abbr=N2A[stateName]||stateName;
  var totalMWe=0,plants=0,restarts=0;
  var seen=new Set();
  for(var k in UR){
    if(PSTATE[k]!==stateName)continue;
    var ur=UR[k];
    if(ur.restart){restarts++;continue;}
    var site=k.split(',').map(function(x){return Math.round(parseFloat(x)*10)/10;}).join(',');
    if(seen.has(site))continue;
    seen.add(site);
    if(ur.add>0){totalMWe+=Math.round(ur.add/3);plants++;}
  }
  var sr=SR[stateName]||null;
  var h='<div class="stt"><h4>'+abbr+' \u2014 Uprate Potential</h4>';
  h+='<div class="stt-section">';
  if(plants>0){
    h+='<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#814DB1"></span>Headroom</span><span class="v" style="color:#814DB1;font-weight:700">~'+totalMWe.toLocaleString()+' MWe</span></div>';
    h+='<div class="stt-row"><span class="k">Plants w/ headroom</span><span class="v">'+plants+'</span></div>';
  }else{
    h+='<div style="font-size:11px;color:#94a3b8">No remaining headroom</div>';
  }
  if(restarts>0)h+='<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#0d9488"></span>Restart plants</span><span class="v">'+restarts+'</span></div>';
  h+='</div>';
  h+='</div>';
  return h;
}
function bST(a,stateName){
  if(cT==="uprate")return bUprateST(stateName);
  const sd=(SD[cS]||{})[a]||{},d=sd[cY]||{},r=d.reactors||{},rt=(r.SMR||0)+(r.ARTES||0)+(r.HTGR||0);
  let h='<div class="stt"><h4>'+a+" \u2014 "+cY+"</h4><div class=\"stt-section\"><div class=\"stt-label\">Advanced Nuclear Reactors</div>";
  if(rt>0){h+='<div class="stt-row"><span class="k"><span class="stt-dot" style="background:#0DC3A8"></span>Advanced Nuclear</span><span class="v">'+rt+"</span></div>";
  }else h+='<div style="font-size:11px;color:#94a3b8">None</div>';
  h+='</div><div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Capital Investment</div>';
  h+='<div class="stt-row"><span class="k">Adv Nuclear</span><span class="v">'+fD(d.capNuke)+'</span></div>';
  h+='<div class="stt-row"><span class="k">All Energy</span><span class="v">'+fD(d.capTotal)+'</span></div></div>';
  h+='<div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Energy Jobs</div>';
  h+='<div class="stt-row"><span class="k">Adv Nuclear</span><span class="v">'+(d.jobsNuke||0).toLocaleString()+'</span></div>';
  h+='<div class="stt-row"><span class="k">All Energy</span><span class="v">'+(d.jobsTotal||0).toLocaleString()+"</span></div></div>";var _sr=SR[stateName]||SR[a];if(_sr){var _ec=_sr.env==="Clear"?"#4ade80":_sr.env==="Mixed"?"#fbbf24":"#f87171";var _mc=_sr.mkt==="Merchant Generator"?"#93c5fd":"#EE5C36";h+='<div class="stt-divider"></div><div class="stt-section"><div class="stt-label">Policy &amp; Market</div><div class="stt-row"><span class="k">Electricity Market</span><span class="v" style="color:'+_mc+'">'+_sr.mkt+'</span></div><div class="stt-row"><span class="k">Policy Climate</span><span class="v" style="color:'+_ec+'">'+(_sr.env==="Clear"?"Permissive":_sr.env==="Mixed"?"Mixed":"Restricted")+'</span></div>';if(_sr.mor&&_sr.mor!=="None")h+='<div class="stt-row"><span class="k">Restriction</span><span class="v" style="color:#f87171">'+_sr.mor+'</span></div>';if(_sr.waste&&_sr.waste!=="None")h+='<div class="stt-row"><span class="k">Waste Policy</span><span class="v" style="color:#fbbf24">'+_sr.waste+'</span></div>';h+='</div>';}h+="</div>";return h}

function mkBtn(c,lbl,col,onClick,on){const b=document.createElement("button");b.className="layer-btn"+(on!==false?" active":"");b.textContent=lbl;b.style.borderColor=col;b.style.backgroundColor=on!==false?col:"#fff";b.style.color=on!==false?"#fff":col;b.addEventListener("click",onClick);c.appendChild(b);return b;}
function bTg(){const c=document.getElementById("layerToggles");
  // Nuclear — on by default
  mkBtn(c,"Nuclear","#814DB1",function(){const ts=["Nuclear","SMR","ARTES","HTGR"],cl="#814DB1",aa=ts.every(t=>aT.has(t));ts.forEach(t=>aa?aT.delete(t):aT.add(t));if(!aa){this.classList.add("active");this.style.backgroundColor=cl;this.style.color="#fff"}else{this.classList.remove("active");this.style.backgroundColor="#fff";this.style.color=cl}uM();},true);
  // Conversion — on by default
  mkBtn(c,"Conversion","#0DC3A8",function(){showConvert=!showConvert;if(showConvert){this.classList.add("active");this.style.backgroundColor="#0DC3A8";this.style.color="#fff"}else{this.classList.remove("active");this.style.backgroundColor="#fff";this.style.color="#0DC3A8"}uM();},true);
  // Helper: build a sub-dropdown for a group button
  function mkSubDrop(anchorBtn,items){
    const wrap=document.createElement("div");wrap.style.cssText="position:relative;display:inline-block";
    const panel=document.createElement("div");
    panel.style.cssText="display:none;position:absolute;top:100%;left:0;margin-top:3px;background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 4px;z-index:2000;min-width:130px;box-shadow:0 4px 12px rgba(0,0,0,.12)";
    items.forEach(g=>{
      const row=document.createElement("label");
      row.style.cssText="display:flex;align-items:center;gap:7px;padding:4px 8px;cursor:pointer;border-radius:5px;font-size:11px;font-weight:600;color:#334155;white-space:nowrap";
      row.onmouseenter=()=>row.style.background="#f1f5f9";
      row.onmouseleave=()=>row.style.background="";
      const cb=document.createElement("input");cb.type="checkbox";cb.style.cssText="accent-color:"+g.c+";width:13px;height:13px;cursor:pointer";
      cb.checked=false;
      cb.addEventListener("change",function(){this.checked?aT.add(g.t):aT.delete(g.t);uM();});
      const dot=document.createElement("span");dot.style.cssText="width:9px;height:9px;border-radius:50%;background:"+g.c+";flex-shrink:0;border:1px solid #64748b";
      row.appendChild(cb);row.appendChild(dot);row.appendChild(document.createTextNode(g.l));
      panel.appendChild(row);
    });
    wrap.appendChild(anchorBtn);wrap.appendChild(panel);
    document.addEventListener("click",function(e){if(!wrap.contains(e.target))panel.style.display="none";});
    anchorBtn._panel=panel;
    return wrap;
  }
  // Fossil
  const fItems=[{l:"Coal",t:"Coal",c:"#252A2B"},{l:"NG CC",t:"NG CC",c:"#6D7374"},{l:"NG GT",t:"NG GT",c:"#C0C6C8"},{l:"CCS (w/ gas)",t:"CCS",c:"#D62728"}];
  const fBtnEl=document.createElement("button");fBtnEl.className="layer-btn";fBtnEl.textContent="Fossil";fBtnEl.style.cssText="border-color:#252A2B;background:#fff;color:#252A2B";
  fBtnEl.addEventListener("click",function(e){e.stopPropagation();const p=this._panel;const open=p.style.display==="block";const ts=["Coal","NG CC","NG GT","CCS"],aa=ts.every(t=>aT.has(t));if(aa){ts.forEach(t=>aT.delete(t));p.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=false);p.style.display="none";this.classList.remove("active");this.style.backgroundColor="#fff";this.style.color="#252A2B";uM();}else{ts.forEach(t=>aT.add(t));p.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=true);p.style.display=open?"none":"block";this.classList.add("active");this.style.backgroundColor="#252A2B";this.style.color="#fff";uM();}});
  c.appendChild(mkSubDrop(fBtnEl,fItems));
  // Renew
  const rItems=[{l:"Onshore Wind",t:"Wind",c:"#2CA02C"},{l:"Offshore Wind",t:"Offshore",c:"#98DF8A"},{l:"Utility Solar",t:"UPV",c:"#FFDE20"},{l:"Rooftop Solar",t:"DPV",c:"#FF7F0E"},{l:"Hydro",t:"Hydro",c:"#003FFD"},{l:"Geo/Bio",t:"Geo/Bio",c:"#8C564B"}];
  const rBtnEl=document.createElement("button");rBtnEl.className="layer-btn";rBtnEl.textContent="Renew";rBtnEl.style.cssText="border-color:#2CA02C;background:#fff;color:#2CA02C";
  rBtnEl.addEventListener("click",function(e){e.stopPropagation();const p=this._panel;const open=p.style.display==="block";const ts=["Wind","Offshore","UPV","DPV","CSP","Hydro","Geo/Bio"],aa=ts.every(t=>aT.has(t));if(aa){ts.forEach(t=>aT.delete(t));p.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=false);p.style.display="none";this.classList.remove("active");this.style.backgroundColor="#fff";this.style.color="#2CA02C";uM();}else{ts.forEach(t=>aT.add(t));p.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked=true);p.style.display=open?"none":"block";this.classList.add("active");this.style.backgroundColor="#2CA02C";this.style.color="#fff";uM();}});
  c.appendChild(mkSubDrop(rBtnEl,rItems));
  // Storage
  mkBtn(c,"Storage","#E82269",function(){const aa=aT.has("UtilStorage");["Storage","UtilStorage"].forEach(t=>aa?aT.delete(t):aT.add(t));if(!aa){this.classList.add("active");this.style.backgroundColor="#E82269";this.style.color="#fff"}else{this.classList.remove("active");this.style.backgroundColor="#fff";this.style.color="#E82269"}uM();},false);}

function uM(){gL.clearLayers();uL.clearLayers();cL.clearLayers();const sd=DATA.g[cS];if(!sd)return;
  (sd[cY]||[]).forEach(p=>{const[lat,lon,total,dom,techs]=p;if(!aT.has(dom))return;
    const ci=L.circleMarker([lat,lon],{radius:gR(total),fillColor:COLORS[dom],fillOpacity:.8,stroke:false});
    var isNk=["Nuclear","SMR","ARTES","HTGR"].indexOf(dom)>=0;var pnK=lat.toFixed(3)+","+lon.toFixed(3);var pNm=isNk&&PN[pnK]?PN[pnK]:null;
    let ph='<div class="popup-content"><h4>'+(pNm||"Plant Location")+'</h4><div style="font-size:11px;color:#94a3b8;margin-bottom:6px">'+lat.toFixed(3)+", "+lon.toFixed(3)+" \u2022 "+Math.round(total)+' MW</div><table>';
    const mTechs={};Object.entries(techs).forEach(([t,mw])=>{const k=(t==="SMR"||t==="ARTES"||t==="HTGR")?"Advanced Nuclear":t;mTechs[k]=(mTechs[k]||0)+mw;});Object.entries(mTechs).sort((a,b)=>b[1]-a[1]).forEach(([t,mw])=>{ph+='<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+(COLORS[t]||"#0DC3A8")+'"></span> '+(TN[t]||t)+"</td><td class=\"mw\">"+Math.round(mw)+" MW</td></tr>";});
    ph+="</table>";
    if(dom==="Nuclear"&&UR[pnK]){var ur=UR[pnK];if(ur.retYear&&parseInt(cY)>=ur.retYear&&(!ur.restartYear||parseInt(cY)<ur.restartYear))return;}
    ph+="</div>";ci.bindPopup(ph,{className:"info-popup",maxWidth:280});
    gL.addLayer(ci)});
  // Orphan nuclear plants: in UR data but absent from DATA.g (rendered separately)
  if(aT.has("Nuclear")){const _rendK=new Set((sd[cY]||[]).filter(p=>p[3]==="Nuclear").map(p=>p[0].toFixed(3)+","+p[1].toFixed(3)));Object.entries(ORPHAN).forEach(([pnK,od])=>{if(_rendK.has(pnK))return;const ur=UR[pnK];if(!ur)return;const mwe=od.mwe;const _yr=parseInt(cY);if(od.fromYear&&_yr<od.fromYear)return;if(od.toYear&&_yr>od.toYear)return;const[latS,lonS]=pnK.split(",");const lat=parseFloat(latS),lon=parseFloat(lonS);const pNm=PN[pnK]||null;if(ur&&ur.restart)return;const ci2=L.circleMarker([lat,lon],{radius:gR(mwe),fillColor:COLORS["Nuclear"],fillOpacity:.8,stroke:false});ci2.bindPopup('<div class="popup-content"><h4>'+(pNm||"Nuclear Plant")+'</h4><div style="font-size:11px;color:#94a3b8">'+lat.toFixed(3)+", "+lon.toFixed(3)+" \u2022 "+mwe+' MWe</div></div>',{className:"info-popup",maxWidth:280});gL.addLayer(ci2);});}
  if(showConvert){const yi=parseInt(cY);(DATA.c[cS]||[]).forEach(c=>{const[lat,lon,name,state,origCap,newCap,origTech,newTech,decom,conv]=c;
    if(!aT.has(newTech)||parseFloat(conv)>yi)return;const col="#0DC3A8";const dispNew=(["SMR","ARTES","HTGR"].indexOf(newTech)>=0)?"Advanced Nuclear":newTech;
    const sz=Math.max(10,Math.min(22,gR(newCap)*2));
    const m=L.marker([lat,lon],{icon:L.divIcon({className:"",html:'<div style="width:'+sz+'px;height:'+sz+'px;transform:rotate(45deg);background:'+col+';border:2px solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.4);opacity:.92"></div>',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2],popupAnchor:[0,-sz/2]})});
    m.bindPopup('<div class="popup-content"><h4>'+name+'</h4><div style="font-size:11px;color:#94a3b8;margin-bottom:6px">'+state+" \u2022 Repowered in "+Math.round(parseFloat(conv))+'</div><table><tr><td style="color:#94a3b8">Original</td><td class="mw">'+origTech+'</td><td class="mw">'+Math.round(origCap)+' MW</td></tr><tr><td style="color:'+col+';font-weight:700">\u2192 '+dispNew+'</td><td></td><td class="mw" style="color:'+col+'">'+Math.round(newCap)+" MW</td></tr></table></div>",{className:"info-popup",maxWidth:280});cL.addLayer(m)});}}
function bLg(){
  const p=document.getElementById("legend");
  // dot swatch — matches actual map dot appearance (opacity + border)
  function sw(col,dark){const b=dark?"1px solid #64748b":"1px solid rgba(255,255,255,.8)";return'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+col+';opacity:.85;border:'+b+';flex-shrink:0"></span>';}
  function grp(label,col,rows){
    return'<div class="legend-section"><div style="font-size:10px;font-weight:700;color:'+col+';text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">'+label+'</div>'
      +'<div class="legend-grid">'+rows.map(([c,lbl,dark])=>'<div class="legend-item">'+sw(c,dark)+' '+lbl+'</div>').join('')+'</div></div>';
  }
  let h='';
  h+=grp('Nuclear','#814DB1',[['#814DB1','Conventional Nuclear'],['#0DC3A8','Advanced Nuclear']]);
  h+=grp('Fossil','#252A2B',[['#252A2B','Coal'],['#6D7374','Natural Gas CC',true],['#C0C6C8','Natural Gas CT',true],['#D62728','NG w/ CCS']]);
  h+=grp('Renewables','#2CA02C',[['#2CA02C','Onshore Wind'],['#98DF8A','Offshore Wind',true],['#FFDE20','Utility Solar',true],['#FF7F0E','Rooftop Solar'],['#FDFD4D','CSP',true],['#003FFD','Hydro'],['#8C564B','Geo / Bio']]);
  h+=grp('Storage','#E82269',[['#E82269','Utility Storage']]);
  h+='<div class="legend-section"><h3>Circle Size (MW)</h3><div class="size-legend">';
  [{m:100,r:4},{m:500,r:5.5},{m:1e3,r:7},{m:2e3,r:9},{m:5e3,r:12}].forEach(s=>{h+='<div style="text-align:center"><div class="size-circle" style="width:'+s.r*2+'px;height:'+s.r*2+'px;margin:0 auto"></div><div class="size-label">'+s.m+'</div></div>';});
  h+='</div></div>';
  h+='<div class="legend-section"><div style="font-size:11px;color:#475569;display:flex;align-items:center;gap:7px"><span style="display:inline-block;width:13px;height:13px;transform:rotate(45deg);background:#0DC3A8;border:2px solid rgba(255,255,255,.9)"></span>Conversion site (coal→nuclear)</div></div>';
  h+='<div class="legend-section" style="font-size:10px;color:#94a3b8">Double-click state → Dashboard</div>';
  h+='<div id="overlayLegend"></div>';
  p.innerHTML=h;
}

const STK=["Coal","NG CC","NG GT","CCS","Nuclear","Advanced Nuclear","Wind","Offshore","Hydro","UPV","DPV","Geo/Bio","UtilStorage"];
const SKC=["#252A2B","#6D7374","#C0C6C8","#D62728","#814DB1","#0DC3A8","#2CA02C","#98DF8A","#003FFD","#FFDE20","#FF7F0E","#8C564B","#E82269"];

function initDash(){
  const sel=document.getElementById("stateSelect");Object.keys(SC[cS]||{}).sort().forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;sel.appendChild(o)});
  sel.value="California";sel.addEventListener("change",function(){cSt=this.value;uDash()});
  const lo={responsive:true,maintainAspectRatio:false};
  ch1=new Chart(document.getElementById("chartCap"),{type:"bar",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:8,font:{size:9},padding:4}}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,grid:{color:"#f1f5f9"},title:{display:true,text:"GW",font:{size:10}}}}}});

  ch3=new Chart(document.getElementById("chartEmissions"),{type:"line",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,font:{size:9},padding:4}}},scales:{x:{grid:{display:false}},y:{grid:{color:"#f1f5f9"},title:{display:true,text:"Million Tons CO\u2082",font:{size:10}}}}}});
  ch4=new Chart(document.getElementById("chartStateMix"),{type:"doughnut",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"right",labels:{boxWidth:8,font:{size:9},padding:4}}}}});
  ch5=new Chart(document.getElementById("chartStateTime"),{type:"bar",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:false}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,grid:{color:"#f1f5f9"},title:{display:true,text:"GW",font:{size:10}}}}}});
  ch6=new Chart(document.getElementById("chartDispatch"),{type:"line",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:8,font:{size:8},padding:4}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:7,font:{size:9}}},y:{stacked:true,grid:{color:"#f1f5f9"},title:{display:true,text:"GW",font:{size:10}}}},elements:{point:{radius:0},line:{borderWidth:1}}}});
  ch7=new Chart(document.getElementById("chartRetail"),{type:"line",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:8,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{grid:{color:"#f1f5f9"},title:{display:true,text:"$/MWh",font:{size:10}},beginAtZero:false}}}});
  ch8=new Chart(document.getElementById("chartSysCost"),{type:"line",data:{labels:[],datasets:[]},options:{...lo,plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:8,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{grid:{color:"#f1f5f9"},title:{display:true,text:"$B/year",font:{size:10}},beginAtZero:false}}}});
  chNucCap=new Chart(document.getElementById("chartNucCap"),{type:"line",data:{labels:YEARS,datasets:[]},options:{...lo,scales:{x:{grid:{display:false}},y:{grid:{color:"#f1f5f9"},title:{display:true,text:"GW",font:{size:10}},ticks:{callback:function(v){return v+"GW"}}}},plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,font:{size:9},padding:6}}}}});
  chJobs=new Chart(document.getElementById("chartJobs"),{type:"line",data:{labels:YEARS,datasets:[]},options:{...lo,scales:{x:{grid:{display:false}},y:{grid:{color:"#f1f5f9"},title:{display:true,text:"Jobs",font:{size:10}},ticks:{callback:function(v){return v>=1000?(v/1000).toFixed(0)+"K":v;}}}},plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,font:{size:9},padding:6}}}}});
chNucShare=new Chart(document.getElementById("chartNucShare"),{type:"line",data:{labels:YEARS,datasets:[]},options:{...lo,scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#f1f5f9"},title:{display:true,text:"%",font:{size:10}},ticks:{callback:function(v){return v+"%";}}}},plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,font:{size:9},padding:6}}}}});
chNucEnergy=new Chart(document.getElementById("chartNucEnergy"),{type:"line",data:{labels:YEARS,datasets:[]},options:{...lo,scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#f1f5f9"},title:{display:true,text:"%",font:{size:10}},ticks:{callback:function(v){return v+"%";}}}},plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:10,font:{size:9},padding:6}}}}});
}

function getNucCapDatasets(){var sKeys=["LowCost LowLR","LowCost HighLR","HighCost LowLR","HighCost HighLR"];var sLabels=["Low Cost / Low LR","Low Cost / High LR","High Cost / Low LR","High Cost / High LR"];var sColors=["#0DC3A8","#0D4459","#F8B944","#EE5C36"];var ds=sKeys.map(function(s,i){return {label:sLabels[i],borderColor:sColors[i],backgroundColor:"transparent",data:YEARS.map(function(y){var cap=(NAT[s]||{cap:{}}).cap[y]||{};return Math.round(((cap.SMR||0)+(cap.ARTES||0)+(cap.HTGR||0))/1000);}),pointRadius:3,borderWidth:s===cS?3:1.5,tension:.3,borderDash:s===cS?[]:[4,4]};});ds.push({label:"Biden Goal: 200 GW by 2050",borderColor:"#3b82f6",backgroundColor:"#3b82f6",data:[null,null,null,null,null,null,200],pointRadius:8,pointHoverRadius:12,hitRadius:25,pointStyle:"circle",borderWidth:0,showLine:false});ds.push({label:"Trump Goal: 300 GW by 2050",borderColor:"#ef4444",backgroundColor:"#ef4444",data:[null,null,null,null,null,null,300],pointRadius:8,pointHoverRadius:12,hitRadius:25,pointStyle:"circle",borderWidth:0,showLine:false});ds.push({label:"COP Tripling Pledge: 35 GW by 2035",borderColor:"#64748b",backgroundColor:"#64748b",data:[null,null,null,35,null,null,null],pointRadius:8,pointHoverRadius:12,hitRadius:30,pointStyle:"circle",borderWidth:0,showLine:false});return ds;}
function uDash(){const nd=NAT[cS];if(!nd)return;
  const scenKeys=["LowCost LowLR","LowCost HighLR","HighCost LowLR","HighCost HighLR"];
  const scenColors=["#0d9488","#06b6d4","#f59e0b","#ef4444"];
  const scenLabels=["Low/Low","Low/High","High/Low","High/High"];
  ch1.data={labels:YEARS,datasets:STK.map((t,i)=>({label:t,backgroundColor:SKC[i],data:YEARS.map(y=>{const c=nd.cap[y]||{};const v=t==="Advanced Nuclear"?(c.SMR||0)+(c.ARTES||0)+(c.HTGR||0):c[t]||0;return Math.round(v/1000);})})).filter(d=>d.data.some(v=>v>0))};ch1.update();
  (function(){var _sf={"LowCost LowLR":"Low Cost / Low LR","LowCost HighLR":"Low Cost / High LR","HighCost LowLR":"High Cost / Low LR","HighCost HighLR":"High Cost / High LR"};var _sl=_sf[cS]||cS;var _e1=document.getElementById("capScenLabel");if(_e1)_e1.textContent=_sl;})();
  ch3.data={labels:YEARS,datasets:[{label:"All scenarios (carbon-constrained)",borderColor:"#64748b",backgroundColor:"rgba(100,116,139,0.1)",fill:true,data:YEARS.map(y=>Math.round(((nd.emissions[y]||{}).CO2||0)/1e6)),pointRadius:3,borderWidth:2,tension:.3}]};ch3.update();
  // Dispatch profile
  const dp=DISP[cS]||[];
  const dTechs=["UPV","DPV","Wind","Offshore","ARTES","SMR","HTGR","Nuclear","CCS","Hydro","Geo/Bio","Storage","NG CC","NG GT","Coal"];
  const dColors=["#FFDE20","#FF7F0E","#2CA02C","#98DF8A","#0DC3A8","#0D4459","#56A9D5","#814DB1","#D62728","#003FFD","#8C564B","#E82269","#6D7374","#C0C6C8","#252A2B"];
  const dLabels=dp.map((_,i)=>{const d=Math.floor(i/24)+1;const h=i%24;return d===1||h===0?"Day "+d:""});
  ch6.data={labels:dLabels,datasets:dTechs.map((t,i)=>({label:t,backgroundColor:dColors[i]+"cc",borderColor:dColors[i],fill:i===0?"origin":"-1",data:dp.map(h=>h[t]||0)}))};ch6.update();
  var _dSub=document.getElementById("dispatchSubtitle");if(_dSub){var _scenFull={"LowCost LowLR":"Low Cost / Low Learning Rate","LowCost HighLR":"Low Cost / High Learning Rate","HighCost LowLR":"High Cost / Low Learning Rate","HighCost HighLR":"High Cost / High Learning Rate"};_dSub.textContent="Hourly generation (GW) for one summer week — Scenario: "+(_scenFull[cS]||cS)+". Shows how dispatchable sources balance solar & wind.";}
  // Retail rates - show all scenarios
  ch7.data={labels:YEARS,datasets:scenKeys.map((s,i)=>({label:scenLabels[i],borderColor:scenColors[i],backgroundColor:"transparent",data:YEARS.map(y=>(RETAIL[s]||{})[y]||null),pointRadius:3,borderWidth:s===cS?3:1.5,tension:.3,borderDash:s===cS?[]:[4,4]}))};ch7.update();
  // System cost - show all scenarios
  ch8.data={labels:YEARS,datasets:scenKeys.map((s,i)=>({label:scenLabels[i],borderColor:scenColors[i],backgroundColor:"transparent",data:YEARS.map(y=>(SYSCOST[s]||{})[y]||null),pointRadius:3,borderWidth:s===cS?3:1.5,tension:.3,borderDash:s===cS?[]:[4,4]}))};ch8.update();
  if(chNucCap){chNucCap.data={labels:YEARS,datasets:getNucCapDatasets()};chNucCap.update();}
  if(chJobs){chJobs.data={labels:YEARS,datasets:scenKeys.map((s,i)=>({label:scenLabels[i],borderColor:scenColors[i],backgroundColor:"transparent",data:YEARS.map(y=>NAT_JOBS[s]?NAT_JOBS[s][y]||0:0),pointRadius:3,borderWidth:s===cS?3:1.5,tension:.3,borderDash:s===cS?[]:[4,4]}))};chJobs.update();if(chNucShare){chNucShare.data={labels:YEARS,datasets:scenKeys.map((s,i)=>({label:scenLabels[i],borderColor:scenColors[i],backgroundColor:"transparent",data:YEARS.map(y=>{const cap=(NAT[s]||{cap:{}}).cap[y]||{};const nuc=(cap.Nuclear||0)+(cap.SMR||0)+(cap.ARTES||0)+(cap.HTGR||0);const tot=Object.values(cap).reduce((a,b)=>a+b,0);return tot>0?Math.round(nuc/tot*1000)/10:0;}),pointRadius:2,borderWidth:s===cS?2.5:1.5,tension:.3,borderDash:s===cS?[]:[4,4]}))};chNucShare.update();}
  if(chNucEnergy){const _CF={"Coal":0.40,"NG CC":0.50,"NG GT":0.15,"CCS":0.50,"Nuclear":0.90,"SMR":0.90,"ARTES":0.90,"HTGR":0.90,"Wind":0.35,"Offshore":0.45,"UPV":0.22,"DPV":0.15,"Hydro":0.40,"Geo/Bio":0.80,"UtilStorage":0};chNucEnergy.data={labels:YEARS,datasets:scenKeys.map((s,i)=>({label:scenLabels[i],borderColor:scenColors[i],backgroundColor:"transparent",data:YEARS.map(y=>{const cap=(NAT[s]||{cap:{}}).cap[y]||{};const nucGwh=((cap.Nuclear||0)*0.90+(cap.SMR||0)*0.90+(cap.ARTES||0)*0.90+(cap.HTGR||0)*0.90)*8.76;const totGwh=Object.entries(cap).reduce((a,[t,mw])=>a+(mw*(_CF[t]||0.30)*8.76),0);return totGwh>0?Math.round(nucGwh/totGwh*1000)/10:0;}),pointRadius:2,borderWidth:s===cS?2.5:1.5,tension:.3,borderDash:s===cS?[]:[4,4]}))};chNucEnergy.update();}}
  uSD()}

function uSD(){const sc=(SC[cS]||{})[cSt]||{},mix=sc[cY]||{};
  const sd=(SD[cS]||{})[N2A[cSt]||""]||{},d=sd[cY]||{},r=d.reactors||{};
  document.getElementById("stateMixTitle").textContent=cSt+" Energy Mix \u2014 "+cY;
  const _MIX_TECHS=new Set(["Coal","NG CC","NG GT","CCS","Nuclear","SMR","ARTES","HTGR","Wind","Offshore","Hydro","UPV","DPV","Geo/Bio","UtilStorage"]);
  const advNuc=(mix.SMR||0)+(mix.ARTES||0)+(mix.HTGR||0);const mixMerged={};for(const[k,v]of Object.entries(mix)){if(_MIX_TECHS.has(k))mixMerged[k]=v;}delete mixMerged.SMR;delete mixMerged.ARTES;delete mixMerged.HTGR;if(advNuc>0)mixMerged["Advanced Nuclear"]=advNuc;const me=Object.entries(mixMerged).filter(([_,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  ch4.data={labels:me.map(([t])=>t),datasets:[{data:me.map(([_,v])=>v),backgroundColor:me.map(([t])=>CC[t]||"#94a3b8"),borderWidth:1}]};ch4.update();
  ch5.data={labels:YEARS,datasets:STK.map((t,i)=>({label:t,backgroundColor:SKC[i],data:YEARS.map(y=>{const c=sc[y]||{};const v=t==="Advanced Nuclear"?(c.SMR||0)+(c.ARTES||0)+(c.HTGR||0):c[t]||0;return Math.round(v/1000);})})).filter(d=>d.data.some(v=>v>0))};ch5.update();
  // Nuclear breakdown table
  const abbr=N2A[cSt]||"";
  const nd=(ND[cS]||{})[abbr]||{};
  const yd=nd[cY]||{};
  const advR=(r.SMR||0)+(r.ARTES||0)+(r.HTGR||0);const advJ=((yd.SMR||{}).jobs||0)+((yd.ARTES||{}).jobs||0)+((yd.HTGR||{}).jobs||0);const advRv=((yd.SMR||{}).rev||0)+((yd.ARTES||{}).rev||0)+((yd.HTGR||{}).rev||0);
  const tR=advR,tJ=advJ,tRv=advRv;
  const _roiW=(((yd.SMR||{}).roi||0)*((yd.SMR||{}).rev||0))+(((yd.ARTES||{}).roi||0)*((yd.ARTES||{}).rev||0))+(((yd.HTGR||{}).roi||0)*((yd.HTGR||{}).rev||0));
  const advRoi=advRv>0?_roiW/advRv:0;
  let h='<div class="stat-grid">';
  h+='<div class="stat-item"><span class="stat-label">Reactors</span><span class="stat-value"><span class="stat-dot"></span>'+tR+'</span></div>';
  h+='<div class="stat-item"><span class="stat-label">Jobs</span><span class="stat-value">'+(tJ?tJ.toLocaleString():"\u2014")+'</span></div>';
  h+='<div class="stat-item"><span class="stat-label">Revenue</span><span class="stat-value">'+fD(tRv)+'</span></div>';
  h+='<div class="stat-item"><span class="stat-label">ROI</span><span class="stat-value">'+(advRoi?advRoi.toFixed(1)+"%":"\u2014")+'</span></div>';
  h+='</div>';
  document.getElementById("nukeTable").innerHTML=h;
  document.getElementById("nukeTableTitle").textContent="Advanced Nuclear Statistics \u2014 "+cY;
  // Summary text
  const totalCap=Object.values(mixMerged).reduce((s,v)=>s+v,0);
  const topTech=me.length?me[0][0]:"";
  const topPct=totalCap>0?Math.round(me[0][1]/totalCap*100):0;
  const nukePct=totalCap>0?Math.round(((mixMerged["Advanced Nuclear"]||0)+(mixMerged.Nuclear||0))/totalCap*100):0;
  const _CF2={"Coal":0.40,"NG CC":0.50,"NG GT":0.15,"CCS":0.50,"Nuclear":0.90,"Advanced Nuclear":0.90,"Wind":0.35,"Offshore":0.45,"UPV":0.22,"DPV":0.15,"Hydro":0.40,"Geo/Bio":0.80,"UtilStorage":0};
  const totEnergy=Object.entries(mixMerged).reduce((s,[t,v])=>s+(v*(_CF2[t]||0.30)),0);
  const nukeEnergy=((mixMerged["Advanced Nuclear"]||0)*0.90+(mixMerged.Nuclear||0)*0.90);
  const nukeEnergyPct=totEnergy>0?Math.round(nukeEnergy/totEnergy*100):0;
  var _sAbbr=N2A[cSt]||"";
  var _sr2=SR[cSt];
  // Line 1: deployment facts
  var sm1='<strong>'+cSt+'</strong> in <strong>'+cY+'</strong>: ';
  if(tR>0){
    sm1+='deploys <strong>'+tR+' advanced nuclear reactors</strong>, creating <strong>'+tJ.toLocaleString()+' nuclear power plant jobs</strong>. ';
    sm1+='Nuclear provides <strong>'+nukePct+'%</strong> of installed capacity and <strong>'+nukeEnergyPct+'%</strong> of total electricity generation. ';
  }else{
    sm1+='no advanced nuclear deployment yet. ';
  }
  if(totalCap>0)sm1+='<strong>'+(totalCap/1000).toFixed(0)+' GW</strong> total grid capacity, led by '+topTech+' ('+topPct+'%).';
  // Line 2: policy context as badges + investment
  var sm2='';
  if(_sr2){
    var _envColor=_sr2.env==="Clear"?"#16a34a":_sr2.env==="Mixed"?"#ca8a04":"#dc2626";
    var _envBg=_sr2.env==="Clear"?"#dcfce7":_sr2.env==="Mixed"?"#fef9c3":"#fee2e2";
    var _mktColor=_sr2.mkt==="Merchant Generator"?"#1d4ed8":"#c2410c";
    var _mktBg=_sr2.mkt==="Merchant Generator"?"#dbeafe":"#ffedd5";
    var _badge='border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;display:inline-block;margin-right:6px;';
    sm2+='<span style="'+_badge+'color:'+_mktColor+';background:'+_mktBg+'">'+_sr2.mkt+'</span>';
    sm2+='<span style="'+_badge+'color:'+_envColor+';background:'+_envBg+'">'+(_sr2.env==="Clear"?"Permissive":_sr2.env==="Mixed"?"Mixed":"Restricted")+'</span>';
  }
  if(_sAbbr&&STATE_INV[_sAbbr]&&STATE_INV[_sAbbr][cS]){
    var _inv=STATE_INV[_sAbbr][cS][String(cY)]||0;
    var _isBan=BAN_STATES.indexOf(_sAbbr)>=0;
    if(_inv>0){
      var _invColor=_isBan?"#dc2626":"#0d9488";
      var _invBg=_isBan?"#fee2e2":"#ccfbf1";
      var _badge2='border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;display:inline-block;color:'+_invColor+';background:'+_invBg+';';
      var _invLabel=_isBan?"Unrealized Investment":"Projected Investment";
      sm2+='<span style="'+_badge2+'">'+_invLabel+': $'+_inv.toFixed(1)+'B cumulative through '+cY+'</span>';
    }
  }
  document.getElementById("stateSummary").innerHTML='<p style="margin:0 0 6px">'+sm1+'</p>'+(sm2?'<p style="margin:0">'+sm2+'</p>':'');
}

function uU(){gL.clearLayers();uL.clearLayers();cL.clearLayers();const sd=DATA.g[cS];if(!sd)return;
  const _uY="2025"; // WISdom 2025 slice is closest available year to current fleet
  const _nkDoms=new Set(["Nuclear","SMR","ARTES","HTGR"]);
  (sd[_uY]||[]).forEach(p=>{const[lat,lon,total,dom]=p;if(!_nkDoms.has(dom))return;
    const pnK=lat.toFixed(3)+","+lon.toFixed(3);const pNm=PN[pnK]||null;const ur=findUR(lat,lon);
    if(ur&&!ur.restart&&ur.retYear&&parseInt(_uY)>=ur.retYear&&(!ur.restartYear||parseInt(_uY)<ur.restartYear))return;
    const isRestart=ur&&ur.restart;
    const _dotMWe=ur?Math.round(ur.mwt/3):Math.round(total);
    const _capPct=(!isRestart&&ur)?getCapPct(ur.d):null;
    const _origMWe=(!isRestart&&ur)?(ur.doneMWt!=null?Math.round((ur.mwt-ur.doneMWt)/3):(_capPct!==null&&ur.add>0)?Math.round((ur.mwt+ur.add)/(1+_capPct)/3):null):null;
    const _hasDone=_origMWe&&_origMWe<_dotMWe;
    const _pctDone=_hasDone?((_dotMWe-_origMWe)/_dotMWe):0;
    const _strokeCol=isRestart?"#0d9488":(_hasDone?"#4a1d7a":"#fff");
    const _strokeW=_hasDone?Math.round((1.5+_pctDone*2.5)*10)/10:1;
    const ci=L.circleMarker([lat,lon],{radius:gR(_dotMWe),fillColor:isRestart?"#0d9488":"#814DB1",fillOpacity:.8,color:_strokeCol,weight:_strokeW,opacity:1});
    if(ur)ci.on('click',function(e){L.DomEvent.stopPropagation(e);showUprateDetail(ur,pNm,PSTATE[pnK]);});
    if(isRestart){const _r=gR(_dotMWe)*2;uL.addLayer(L.marker([lat,lon],{interactive:false,icon:L.divIcon({className:'',html:'<div style="width:'+_r+'px;height:'+_r+'px;border-radius:50%;background:#0d9488;opacity:.85;border:2px dotted rgba(255,255,255,.9);box-shadow:0 0 0 3px rgba(13,148,136,.5),0 0 8px 2px rgba(13,148,136,.4);box-sizing:border-box"></div>',iconSize:[_r,_r],iconAnchor:[_r/2,_r/2]})}));}
    if(!isRestart&&ur){
      if(ur.proposed){const rad=ur.add>0?gUpR(Math.round(ur.add/3),_dotMWe):Math.max(gR(_dotMWe)+5,12);
        const ring=L.circleMarker([lat,lon],{radius:rad,fillOpacity:0,color:"#22c55e",weight:2.5,opacity:.9,dashArray:"5,3"});
        ring.on('click',function(e){L.DomEvent.stopPropagation(e);showUprateDetail(ur,pNm,PSTATE[pnK]);});uL.addLayer(ring);}
      else if(ur.add>0){const ring=L.circleMarker([lat,lon],{radius:gUpR(Math.round(ur.add/3),_dotMWe),fillOpacity:0,color:"#f59e0b",weight:2,opacity:.9,dashArray:"6,4"});
        ring.on('click',function(e){L.DomEvent.stopPropagation(e);showUprateDetail(ur,pNm,PSTATE[pnK]);});uL.addLayer(ring);}
    }
    gL.addLayer(ci);
    });
  const _rendK=new Set((sd[_uY]||[]).filter(p=>_nkDoms.has(p[3])).map(p=>p[0].toFixed(3)+","+p[1].toFixed(3)));
  Object.entries(ORPHAN).forEach(([pnK,od])=>{if(_rendK.has(pnK))return;const ur=UR[pnK];if(!ur)return;
    const _yr=parseInt(_uY);if(od.fromYear&&_yr<od.fromYear)return;if(od.toYear&&_yr>od.toYear)return;
    const[latS,lonS]=pnK.split(",");const lat=parseFloat(latS),lon=parseFloat(lonS);const pNm=PN[pnK]||null;
    const isRestart=ur.restart;const dotColor=isRestart?"#0d9488":"#814DB1";
    const ci2=L.circleMarker([lat,lon],{radius:gR(od.mwe),fillColor:dotColor,fillOpacity:.8,stroke:false});
    ci2.on('click',function(e){L.DomEvent.stopPropagation(e);showUprateDetail(ur,pNm,PSTATE[pnK]);});
    if(isRestart){const _r=gR(od.mwe)*2;uL.addLayer(L.marker([lat,lon],{interactive:false,icon:L.divIcon({className:'',html:'<div style="width:'+_r+'px;height:'+_r+'px;border-radius:50%;background:#0d9488;opacity:.85;border:2px dotted rgba(255,255,255,.9);box-shadow:0 0 0 3px rgba(13,148,136,.5),0 0 8px 2px rgba(13,148,136,.4);box-sizing:border-box"></div>',iconSize:[_r,_r],iconAnchor:[_r/2,_r/2]})}));}
    else if(ur.add>0){const ring2=L.circleMarker([lat,lon],{radius:gUpR(Math.round(ur.add/3),od.mwe),fillOpacity:0,color:ur.proposed?"#22c55e":"#f59e0b",weight:2,opacity:.9,dashArray:"6,4"});
      ring2.on('click',function(e){L.DomEvent.stopPropagation(e);showUprateDetail(ur,pNm,PSTATE[pnK]);});uL.addLayer(ring2);}
    gL.addLayer(ci2);});}

function swT(t){cT=t;const _mv=t==="map"||t==="uprate";document.getElementById("mapView").style.display=_mv?"flex":"none";document.getElementById("dashboard").style.display=t==="dashboard"?"block":"none";
  document.getElementById("mapControls").style.display=t==="map"?"flex":"none";
  const _mc=document.getElementById("mainControls");if(_mc)_mc.style.display=t==="uprate"?"none":"";
  const _st=document.getElementById("scenarioTabs");if(_st)_st.style.display=t==="uprate"?"none":"flex";
  const _ml=document.getElementById("legend");
  if(_ml)_ml.style.display=t==="uprate"?"none":"";
  if(_mv){setTimeout(()=>map.invalidateSize(),100);if(t==="map"){uM();}else{uU();applyStateOverlay();const _ol=document.getElementById("overlayLegend");if(_ol)_ol.innerHTML='';}}else uDash();toggleUprateCard();}
function tgA(){const b=document.getElementById("playBtn");if(aI){clearInterval(aI);aI=null;b.innerHTML="\u25b6";return}
  b.innerHTML="\u25a0";aI=setInterval(()=>{const sl=document.getElementById("yearSlider");let v=(parseInt(sl.value)+1)%7;sl.value=v;cY=String(YEARS[v]);document.getElementById("yearDisplay").textContent=cY;
    if(cT==="map")uM();else{uSD()}},1500)}

document.querySelectorAll(".main-tab").forEach(b=>{b.addEventListener("click",function(){document.querySelectorAll(".main-tab").forEach(x=>x.classList.remove("active"));this.classList.add("active");swT(this.dataset.tab)})});
document.querySelectorAll(".scenario-tab").forEach(b=>{b.addEventListener("click",function(){document.querySelectorAll(".scenario-tab").forEach(x=>x.classList.remove("active"));this.classList.add("active");cS=this.dataset.scen;if(cT==="map")uM();else uDash()})});
document.getElementById("yearSlider").addEventListener("input",function(){cY=String(YEARS[this.value]);document.getElementById("yearDisplay").textContent=cY;if(cT==="map")uM();else{uSD()}});
document.getElementById("playBtn").addEventListener("click",tgA);
initMap();initDash();uM();buildUprateCard();toggleUprateCard();
window.addEventListener("load",function(){if(map)map.invalidateSize();});
