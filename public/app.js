"use strict";

/* ---------------- Datenmodell ---------------- */
const ORGS = {
  FW:  { short:"FW",  label:"Feuerwehr", cssVar:"--fw"  },
  BRK: { short:"BRK", label:"BRK / RD",  cssVar:"--brk" },
  POL: { short:"POL", label:"Polizei",   cssVar:"--pol" },
  THW: { short:"THW", label:"THW",       cssVar:"--thw" },
  SON: { short:"SON", label:"Sonstige",  cssVar:"--son" },
};
/* Fahrzeugkatalog – übernommen vom Fuhrpark der FF Weiden (schelltom.github.io/feuerwehrweiden/fuhrpark).
   Stärke/AGT sind typische Vorbelegungen je Fahrzeugtyp und werden bei der Erfassung angepasst.
   Im Endausbau je Mandant in den Einstellungen pflegbar. */
const FZG_KATALOG = [
  { grp:"Einsatzleitwagen", typ:"KdoW",          name:"Florian Weiden", kennung:"1/10/1", f:1,u:0,m:1, agt:0 },
  { grp:"Einsatzleitwagen", typ:"KdoW 2",        name:"Florian Weiden", kennung:"1/10/2", f:1,u:0,m:1, agt:0 },
  { grp:"Einsatzleitwagen", typ:"ELW 1,5",       name:"Kater Weiden",   kennung:"1/12/1", f:0,u:1,m:2, agt:0 },
  { grp:"Löschfahrzeuge",   typ:"HLF 20",        name:"Florian Weiden", kennung:"1/40/1", f:0,u:1,m:8, agt:4 },
  { grp:"Löschfahrzeuge",   typ:"LF 16-TS",      name:"Florian Weiden", kennung:"1/48/1", f:0,u:1,m:8, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TLF 20/40-SL",  name:"Florian Weiden", kennung:"1/23/1", f:0,u:1,m:2, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Frauenricht",   kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Mallersricht",  kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"TSF-W",         name:"Florian Muglhof",       kennung:"46/1", f:0,u:1,m:5, agt:2 },
  { grp:"Löschfahrzeuge",   typ:"HLF 20",        name:"Florian Neunkirchen",   kennung:"40/1", f:0,u:1,m:8, agt:4 },
  { grp:"Löschfahrzeuge",   typ:"LF 20",         name:"Florian Rothenstadt",   kennung:"41/1", f:0,u:1,m:8, agt:4 },
  { grp:"Hubrettung",       typ:"DLAK M32 L-AT", name:"Florian Weiden", kennung:"1/30/1", f:0,u:1,m:1, agt:0 },
  { grp:"Hubrettung",       typ:"DLK 23/12",     name:"Florian Weiden", kennung:"2/30/1", f:0,u:1,m:1, agt:0 },
  { grp:"Rüst-/Gerätewagen",typ:"RW 3",          name:"Florian Weiden", kennung:"1/61/1", f:0,u:1,m:2, agt:2 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Logistik",   name:"Florian Weiden", kennung:"1/55/1", f:0,u:1,m:2, agt:0 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Gefahrgut",  name:"Florian Weiden", kennung:"2/52/1", f:0,u:1,m:2, agt:2 },
  { grp:"Rüst-/Gerätewagen",typ:"GW-Strom",      name:"Florian Weiden", kennung:"2/56/1", f:0,u:1,m:2, agt:0 },
  { grp:"Sonstige",         typ:"Dekon-P",       name:"Florian Weiden", kennung:"2/97/1", f:0,u:1,m:5, agt:0 },
  { grp:"Sonstige",         typ:"SW 2000",       name:"Florian Weiden", kennung:"2/58/1", f:0,u:1,m:2, agt:0 },
  { grp:"Sonstige",         typ:"MZF",           name:"Florian Weiden", kennung:"1/11/1", f:1,u:1,m:1, agt:0 },
  { grp:"Sonstige",         typ:"MZF",           name:"Florian Neunkirchen",  kennung:"1/11/1", f:1,u:1,m:1, agt:0 },
  { grp:"Sonstige",         typ:"MTW",           name:"Florian Rothenstadt",  kennung:"14/1",   f:0,u:1,m:5, agt:0 },
];
const FUNKTIONEN = ["Einsatzleiter","Örtlicher Einsatzleiter","Abschnittsleiter","Zugführer",
  "Gruppenführer","Organisatorischer Leiter","Einsatzleiter Rettungsdienst","Fachberater THW","Zugtruppführer","Polizeiführer"];
const STORE_KEY = "kraefteerfassung-proto-v1";

const TABS = [
  { id:"einsatz",  label:"Einsatz",
    icon:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5"/>' },
  { id:"kraefte",  label:"Kräfte",
    icon:'<path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M8.5 17h6.5M2.5 15v2h2"/>' },
  { id:"funk",     label:"Funk",
    icon:'<circle cx="12" cy="7" r="2.2"/><path d="M12 9.2V21M8.5 21h7"/><path d="M7.2 2.6a7.4 7.4 0 0 0 0 8.8M16.8 2.6a7.4 7.4 0 0 1 0 8.8"/>' },
  { id:"skizze",   label:"Funkskizze", nurGross:true,
    icon:'<rect x="8.5" y="3" width="7" height="5" rx="1"/><rect x="2.5" y="16" width="7" height="5" rx="1"/><rect x="14.5" y="16" width="7" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>' },
  { id:"bespr",    label:"Besprechung",
    icon:'<path d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"/><path d="M7.5 8.5h9M7.5 12h6"/>' },
  { id:"listen",   label:"Checklisten",
    icon:'<path d="M4 6.5 5.5 8 8 5M4 12.5 5.5 14 8 11M4 18.5 5.5 20 8 17"/><path d="M11 6.5h9M11 12.5h9M11 18.5h9"/>' },
  { id:"atemschutz",label:"Atemschutz",
    icon:'<path d="M12 3v8"/><path d="M9.5 11a4.5 4.5 0 0 0-4.5 4.5V18a2 2 0 0 0 4 0v-7"/><path d="M14.5 11a4.5 4.5 0 0 1 4.5 4.5V18a2 2 0 0 1-4 0v-7"/>' },
  { id:"monitor",  label:"Monitor", nurGross:true,
    icon:'<rect x="3" y="4.5" width="18" height="12.5" rx="1.5"/><path d="M9 21h6M12 17v4"/>' },
  { id:"lagekarte",label:"Lagekarte", nurGross:true,
    icon:'<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/>' },
];
// Auf kleinen Geräten (Handy) geht es nur um die Kräfteerfassung – Monitor, Lagekarte
// und Funkskizze brauchen mindestens ein 10-Zoll-Gerät.
function istGrossesGeraet(){ return window.matchMedia("(min-width:900px)").matches; }
function sichtbareTabs(){ return istGrossesGeraet() ? TABS : TABS.filter(t => !t.nurGross); }

function defaultConfig(){
  return {
    ugName:"UG-Weiden",
    prefixes:{ FW:"Florian", BRK:"RK", POL:"Donau", THW:"Heros", SON:"" },
    ilsName:"ILS Nordoberpfalz",
    ilsGruppe:"",
  };
}
function defaultState(){
  return {
    einsatzId: uid(),                      // Identität für den Sync (welcher Einsatz?)
    einsatzStart: new Date().toISOString(),
    einsatz: { stichwort:"", ort:"", beginn:"", leiter:"", bemerkung:"" },
    einheiten: [], fuehrung: [], abschnitte: [], archiv: [],
    lage: { items: [], bg: "", snapshots: [], mode: "raster", mapView: null, mapLayer: "luftbild" },
    funk: [], besprechungen: [], anforderungen: [], checks: [], fotos: [],
    asTraeger: [], asTrupps: [], asSub: "sammelstelle",
    monHide: { panels: {}, ab: {} },
    config: defaultConfig(),
    wlan:false, pending:0, view:"einsatz", ksub:"einheiten",
  };
}
const stored = load() || {};
let state = Object.assign(defaultState(), stored);
state.config = Object.assign(defaultConfig(), stored.config || {});
state.config.prefixes = Object.assign(defaultConfig().prefixes, (stored.config||{}).prefixes || {});
if(!state.lage || !Array.isArray(state.lage.items)) state.lage = { items: [], bg: "" };
if(!Array.isArray(state.lage.snapshots)) state.lage.snapshots = [];
if(!state.lage.mode) state.lage.mode = state.lage.bg ? "bild" : "raster";
if(!state.lage.mapLayer) state.lage.mapLayer = "luftbild";
if(!Array.isArray(state.funk)) state.funk = [];
if(!Array.isArray(state.besprechungen)) state.besprechungen = [];
if(!Array.isArray(state.anforderungen)) state.anforderungen = [];
if(!Array.isArray(state.checks)) state.checks = [];
if(!Array.isArray(state.fotos)) state.fotos = [];
if(!Array.isArray(state.asTraeger)) state.asTraeger = [];
if(!Array.isArray(state.asTrupps)) state.asTrupps = [];
if(!state.asSub) state.asSub = "sammelstelle";
if(!state.monHide || typeof state.monHide !== "object") state.monHide = { panels: {}, ab: {} };
state.monHide.panels = state.monHide.panels || {};
state.monHide.ab = state.monHide.ab || {};
if(!state.einsatzId){
  state.einsatzId = uid();
  const b = state.einsatz && state.einsatz.beginn ? new Date(state.einsatz.beginn) : null;
  state.einsatzStart = (b && !isNaN(b)) ? b.toISOString() : new Date().toISOString();
}
// Bestehende Fahrzeug-Symbole ohne Nummer nachnummerieren
{
  let maxCar = state.lage.items.reduce((m,i) => i.type==="car" ? Math.max(m, i.num||0) : m, 0);
  state.lage.items.forEach(i => { if(i.type === "car" && !i.num) i.num = ++maxCar; });
}
let syncing = false;
let editing = null;   // { unit, isNew } – Einheit
let editingFk = null; // { fk, isNew }  – Führungskraft

function load(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY)); }catch(e){ return null; }
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function markChange(){ if(!state.wlan) state.pending++; save(); }
function pfx(org){ return state.config.prefixes[org] ?? ""; }

/* ---------------- Hilfsfunktionen ---------------- */
const $ = sel => document.querySelector(sel);
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------------- Dialoge (statt Browser-alert/confirm) ---------------- */
function modal(opts){
  return new Promise(resolve => {
    const host = $("#modalHost");
    host.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal" role="alertdialog" aria-modal="true">
      ${opts.titel ? `<h2>${esc(opts.titel)}</h2>` : ""}
      <p>${esc(opts.text)}</p>
      <div class="modal-btns">
        ${opts.abbrechen ? `<button class="btn btn-ghost" data-md="0">${esc(opts.abbrechen)}</button>` : ""}
        <button class="btn btn-primary" data-md="1">${esc(opts.ok || "OK")}</button>
      </div>
    </div>`;
    const fertig = v => { host.innerHTML = ""; resolve(v); };
    host.querySelectorAll("[data-md]").forEach(b =>
      b.addEventListener("click", () => fertig(b.dataset.md === "1")));
    host.querySelector(".modal-backdrop").addEventListener("click", () => {
      if(opts.abbrechen) fertig(false);
    });
    const okBtn = host.querySelector('[data-md="1"]');
    if(okBtn) okBtn.focus();
  });
}
function modalConfirm(text, ok = "Ja", abbrechen = "Abbrechen"){
  return modal({ text, ok, abbrechen });
}
function modalInfo(text){ return modal({ text, ok: "OK" }); }
function gesamt(u){ return (u.f|0)+(u.u|0)+(u.m|0); }
function staerkeStr(u){ return `${u.f}/${u.u}/${u.m}/${gesamt(u)}`; }
function fullName(u){ return [u.name, u.kennung].filter(Boolean).join(" ").trim(); }
function abNameOf(id, list){
  if(id === "BR") return "Bereitstellungsraum";
  const a = (list || state.abschnitte).find(x => x.id === id);
  return a ? a.name : "";
}
function fmtZeit(iso){
  if(!iso) return "–";
  const d = new Date(iso);
  return isNaN(d) ? "–" : d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
}
function fmtDatum(iso){
  if(!iso) return "–";
  const d = new Date(iso);
  return isNaN(d) ? "–" : d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function fmtTagKurz(iso){
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}) + ".";
}
function istHeute(iso){
  const d = new Date(iso);
  return !isNaN(d) && d.toDateString() === new Date().toDateString();
}
function fmtDateInput(iso){
  const d = iso ? new Date(iso) : new Date();
  const x = isNaN(d) ? new Date() : d;
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
}
function nowLocalInput(){
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
}
function aktive(){ return state.einheiten.filter(u => !u.abgerueckt); }
function summen(units){
  return units.reduce((a,u)=>({ f:a.f+(u.f|0), u:a.u+(u.u|0), m:a.m+(u.m|0), agt:a.agt+(u.agt|0) }),{f:0,u:0,m:0,agt:0});
}
/* Bilder clientseitig verkleinern, damit der lokale Speicher reicht */
function resizeImage(file, maxDim, cb){
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL("image/jpeg", .72));
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}
/* Sprachdiktat (Web Speech API) – Komfortfunktion am ELW, braucht Browser-Unterstützung */
function attachDictation(btn, target){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ btn.style.display = "none"; return; }
  let rec = null;
  btn.addEventListener("click", () => {
    if(rec){ rec.stop(); return; }
    rec = new SR();
    rec.lang = "de-DE"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = ev => {
      const t = [...ev.results].slice(ev.resultIndex).map(r => r[0].transcript).join(" ").trim();
      if(t) target.value = (target.value ? target.value + " " : "") + t;
      target.dispatchEvent(new Event("input"));
    };
    rec.onend = () => { rec = null; btn.classList.remove("rec"); };
    rec.onerror = e => {
      rec = null; btn.classList.remove("rec");
      if(e.error === "not-allowed" || e.error === "service-not-allowed")
        modalInfo("Spracheingabe nicht verfügbar – Mikrofonberechtigung fehlt oder wird in dieser Umgebung blockiert.");
    };
    btn.classList.add("rec");
    try{ rec.start(); }catch(err){ rec = null; btn.classList.remove("rec"); }
  });
}
function dauerStr(vonIso, bisIso){
  const von = vonIso ? new Date(vonIso) : null;
  if(!von || isNaN(von)) return "";
  const bis = bisIso ? new Date(bisIso) : new Date();
  const min = Math.max(0, Math.floor((bis - von)/60000));
  return `${Math.floor(min/60)}:${String(min%60).padStart(2,"0")} h`;
}

/* ---------------- Splashscreen ---------------- */
(function(){
  const sp = $("#splash");
  $("#splashUg").textContent = state.config.ugName || "";
  const go = () => { sp.classList.add("out"); setTimeout(()=>sp.remove(), 500); };
  const t = setTimeout(go, 5000);
  sp.addEventListener("click", () => { clearTimeout(t); go(); });
})();

/* ---------------- Kopfzeile / Sync ---------------- */
function renderHeader(){
  $("#appSub").textContent = state.config.ugName || "";
  const pill = $("#syncPill"), txt = $("#syncText"), sw = $("#wlanSwitch");
  sw.setAttribute("aria-checked", state.wlan ? "true" : "false");
  pill.classList.toggle("busy", syncing);
  if(syncing){
    pill.classList.remove("good");
    txt.textContent = `Synchronisiere ${state.pending} Änderung${state.pending===1?"":"en"} …`;
  }else if(state.wlan){
    pill.classList.add("good");
    txt.textContent = "Synchron";
  }else{
    pill.classList.remove("good");
    txt.textContent = state.pending > 0 ? `Offline · ${state.pending} lokal` : "Offline · bereit";
  }
}
$("#wlanSwitch").addEventListener("click", () => {
  state.wlan = !state.wlan;
  if(state.wlan && state.pending > 0){
    syncing = true; save(); render();
    setTimeout(() => { syncing = false; state.pending = 0; save(); render(); }, 1400);
    return;
  }
  save(); render();
});
$("#btnSettings").addEventListener("click", renderSettingsSheet);

/* ---------------- Navigation ---------------- */
function buildNav(){
  // Seitenleiste (ab 10 Zoll): alle Ansichten
  const btn = t => `
    <button data-tab="${t.id}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>${t.label}
    </button>`;
  document.querySelector("nav.rail").insertAdjacentHTML("beforeend", TABS.map(btn).join(""));
  document.querySelectorAll("nav.rail [data-tab]").forEach(b =>
    b.addEventListener("click", () => { state.view = b.dataset.tab; save(); render(); }));
}
buildNav();

/* Burger-Menü (Handy) – nur die auf kleinen Geräten sinnvollen Ansichten */
function openMenu(){
  const tabs = sichtbareTabs();
  $("#menuHost").innerHTML = `
  <div class="drawer-backdrop" data-menuclose="1"></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-label="Menü">
    <div class="drawer-head">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" style="width:22px;height:22px;stroke:#fff;fill:none;stroke-width:5;stroke-linecap:round">
          <path d="M32 28v22M21 50h22"></path><path d="M20.5 12a16 16 0 0 0 0 20M43.5 12a16 16 0 0 1 0 20"></path>
          <circle cx="32" cy="21" r="5.5" fill="#fff" stroke="none"></circle></svg>
      </div>
      <h2><span class="n-elw">ELW</span><span class="n-is">IS</span></h2>
    </div>
    ${tabs.map(t => `
      <button data-tab="${t.id}" class="${state.view===t.id?"active":""}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>${t.label}
      </button>`).join("")}
  </div>`;
  const close = () => { $("#menuHost").innerHTML = ""; };
  $("#menuHost").querySelector("[data-menuclose]").addEventListener("click", close);
  $("#menuHost").querySelectorAll("[data-tab]").forEach(b =>
    b.addEventListener("click", () => { state.view = b.dataset.tab; close(); save(); render(); }));
}
$("#btnMenu").addEventListener("click", openMenu);

/* ---------------- Einstellungen (mandantenfähig) ---------------- */
function renderSettingsSheet(){
  const c = state.config;
  const prefFields = Object.entries(ORGS).map(([key,o]) => `
    <div class="field">
      <label for="cfg-p-${key}">Präfix ${esc(o.label)}</label>
      <input id="cfg-p-${key}" data-pfx="${key}" class="mono" value="${esc(c.prefixes[key]||"")}"
        placeholder="${key==='SON'?'(leer)':''}" autocomplete="off">
    </div>`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Einstellungen">
    <div class="sheet-head">
      <h2>Einstellungen</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <label for="cfg-ug">Name der Einheit / Organisation</label>
        <input id="cfg-ug" value="${esc(c.ugName)}" placeholder="z. B. UG-Weiden" autocomplete="off">
        <p class="hint">Erscheint auf Startbildschirm, Kopfzeile und Einsatzbericht – so ist die Anwendung je Installation anpassbar (UG, Feuerwehr, Landkreis …).</p>
      </div>
      <div class="field"><label style="margin-bottom:10px">Funkskizze / Leitstelle</label>
        <div class="form-grid">
          <div class="field"><label for="cfg-ils">Leitstelle</label>
            <input id="cfg-ils" value="${esc(c.ilsName||"")}" placeholder="z. B. ILS Nordoberpfalz" autocomplete="off"></div>
          <div class="field"><label for="cfg-ilsgrp">TMO-Betriebsgruppe zur Leitstelle</label>
            <input id="cfg-ilsgrp" class="mono" value="${esc(c.ilsGruppe||"")}" placeholder="z. B. NOP 1" autocomplete="off"></div>
        </div>
      </div>
      <div class="field"><label style="margin-bottom:10px">Funkrufnamen-Präfixe je Organisation</label>
        <div class="form-grid">${prefFields}</div>
        <p class="hint">Wird bei der Erfassung vorbelegt und kann dort jederzeit überschrieben werden.</p>
      </div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="cfg-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#cfg-save").addEventListener("click", () => {
    state.config.ugName = $("#cfg-ug").value.trim();
    state.config.ilsName = $("#cfg-ils").value.trim();
    state.config.ilsGruppe = $("#cfg-ilsgrp").value.trim();
    document.querySelectorAll("[data-pfx]").forEach(inp => {
      state.config.prefixes[inp.dataset.pfx] = inp.value.trim();
    });
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Einsatz ---------------- */
function renderEinsatz(){
  const e = state.einsatz;
  const abRows = state.abschnitte.map(a => {
    const n = state.einheiten.filter(u => u.abschnitt === a.id).length;
    const funk = [a.ansprechpartner ? `AP ${a.ansprechpartner}` : "",
      a.tmo ? `TMO ${a.tmo}` : "", a.dmo ? `DMO ${a.dmo}` : ""].filter(Boolean).join(" · ");
    return `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">${esc(a.name)}</div>
        <div class="a-s">${n} Einheit${n===1?"":"en"}${funk ? " · " + esc(funk) : ""}</div>
      </div>
      <button class="btn btn-ghost" data-abedit="${esc(a.id)}">Bearbeiten</button>
    </div>`;
  }).join("");
  const archiv = [...state.archiv].sort((a,b) => (b.ende||"").localeCompare(a.ende||""));
  const archList = archiv.length ? archiv.map(a => `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">${esc(a.einsatz.stichwort) || "Ohne Stichwort"}</div>
        <div class="a-s">${fmtDatum(a.ende)} · ${a.einheiten.length} Einheiten · ${a.fuehrung.length} Führungskräfte</div>
      </div>
      <button class="btn btn-ghost" data-aakt="${esc(a.id)}">Aktivieren</button>
      <button class="btn btn-ghost" data-aprint="${esc(a.id)}">Drucken</button>
      <button class="btn btn-danger-ghost" data-adel="${esc(a.id)}" aria-label="Archiveintrag löschen">✕</button>
    </div>`).join("") : `<p class="hint" style="margin:0">Noch keine abgeschlossenen Einsätze.</p>`;
  return `
  <div class="card">
    <h2>Einsatzstammdaten</h2>
    <div class="form-grid">
      <div class="field span2"><label for="f-stw">Einsatzstichwort</label>
        <input id="f-stw" data-ez="stichwort" value="${esc(e.stichwort)}" placeholder="z. B. B4 – Brand Gewerbeanlage"></div>
      <div class="field"><label for="f-ort">Einsatzort</label>
        <input id="f-ort" data-ez="ort" value="${esc(e.ort)}" placeholder="Straße, Ort"></div>
      <div class="field"><label for="f-beg">Alarmzeit</label>
        <input id="f-beg" data-ez="beginn" type="datetime-local" value="${esc(e.beginn)}"></div>
      <div class="field"><label for="f-lb">Nächste Lagebesprechung</label>
        <input id="f-lb" data-ez="lagebespr" type="time" class="mono" value="${esc(e.lagebespr||"")}"></div>
      <div class="field span2"><label for="f-el">Einsatzleiter</label>
        <input id="f-el" data-ez="leiter" value="${esc(e.leiter)}" placeholder="Name / Funktion"></div>
      <div class="field span2" style="margin-bottom:0"><label for="f-bem">Bemerkungen</label>
        <textarea id="f-bem" data-ez="bemerkung" placeholder="Lage, Abschnitte, Besonderheiten …">${esc(e.bemerkung)}</textarea></div>
    </div>
  </div>
  <div class="card">
    <h2>Einsatzabschnitte</h2>
    ${abRows || `<p class="hint" style="margin:0 0 12px">Noch keine Abschnitte – Einheiten lassen sich bei der Erfassung einem Abschnitt zuordnen.</p>`}
    <button class="btn btn-ghost btn-block" id="abAdd" style="margin-top:${abRows?"12px":"0"}">＋&nbsp; Abschnitt anlegen</button>
  </div>
  <div class="card">
    <h2>Fotodokumentation</h2>
    ${state.fotos.length ? `<div class="foto-grid">
      ${state.fotos.map(f => `<img src="${f.data}" alt="Einsatzfoto ${fmtZeit(f.zeit)}" data-foto="${esc(f.id)}">`).join("")}
    </div>` : ""}
    <button class="btn btn-ghost btn-block" id="fotoAdd">＋&nbsp; Foto aufnehmen / auswählen</button>
    <input type="file" id="fotoFile" accept="image/*" capture="environment" style="display:none">
    <p class="hint">Fotos werden mit Zeitstempel am Einsatz gespeichert (Schadenslage, Zwischenstände, Beweissicherung). Antippen für Notiz oder Löschen.</p>
  </div>
  <div class="card">
    <h2>Einsatzende</h2>
    <button class="btn btn-ghost btn-block" id="btnPrintNow" style="margin-bottom:10px">Bericht drucken (Zwischenstand)</button>
    <button class="btn btn-primary btn-block" id="btnEnde">Einsatz beenden &amp; archivieren</button>
    <p class="hint">Beim Beenden wird der Einsatz mit allen Einheiten und Führungskräften gespeichert und kann gedruckt werden (Browser-Druck → auch als PDF).</p>
  </div>
  <div class="card">
    <h2>Abgeschlossene Einsätze</h2>
    ${archList}
  </div>
  <div class="card">
    <h2>Sichern &amp; Übertragen</h2>
    <button class="btn btn-ghost btn-block" id="btnExport" style="margin-bottom:10px">Einsatz exportieren (Datei)</button>
    <button class="btn btn-ghost btn-block" id="btnImport">Einsatz importieren (Datei)</button>
    <input type="file" id="importFile" accept=".json,application/json" style="display:none">
    <p class="hint">Der komplette Einsatz (Kräfte, Abschnitte, Lagekarte, Funk, Besprechungen, Checklisten, Fotos)
    als Datei – für Backup, Gerätewechsel oder die Übergabe per USB-Stick vom Tablet zum ELW-Rechner.
    Beim Import wird der aktuell erfasste Einsatz ersetzt; Archiv und Einstellungen bleiben unberührt.</p>
  </div>
  <div class="card">
    <h2>Prototyp-Werkzeuge</h2>
    <button class="btn btn-ghost btn-block" id="btnDemo" style="margin-bottom:10px">Beispieldaten laden</button>
    <button class="btn btn-danger-ghost btn-block" id="btnReset">Aktuellen Einsatz verwerfen (ohne Archiv)</button>
  </div>`;
}
function wireEinsatz(){
  document.querySelectorAll("[data-ez]").forEach(inp => {
    inp.addEventListener("change", () => {
      state.einsatz[inp.dataset.ez] = inp.value;
      markChange(); renderHeader();
    });
  });
  $("#abAdd").addEventListener("click", () => openAbEditor(null));
  document.querySelectorAll("[data-abedit]").forEach(b =>
    b.addEventListener("click", () => openAbEditor(b.dataset.abedit)));
  $("#btnExport").addEventListener("click", exportEinsatz);
  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(file) importEinsatz(file);
    e.target.value = "";
  });
  $("#fotoAdd").addEventListener("click", () => $("#fotoFile").click());
  $("#fotoFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    resizeImage(file, 1280, data => {
      state.fotos.push({ id:uid(), zeit:new Date().toISOString(), data, notiz:"" });
      try{ markChange(); }catch(err){ modalInfo("Speicher voll – bitte alte Fotos löschen."); state.fotos.pop(); }
      render();
    });
  });
  document.querySelectorAll("[data-foto]").forEach(img =>
    img.addEventListener("click", () => openFotoSheet(img.dataset.foto)));
  $("#btnDemo").addEventListener("click", loadDemo);
  $("#btnReset").addEventListener("click", () => {
    modalConfirm("Aktuellen Einsatz wirklich verwerfen? Alle erfassten Kräfte gehen verloren (Archiv bleibt).").then(ok => { if(!ok) return;
      const keepArchiv = state.archiv, keepCfg = state.config;
      state = defaultState(); state.archiv = keepArchiv; state.config = keepCfg;
      state.einsatz.beginn = nowLocalInput();
      save(); render();
    });
  });
  $("#btnPrintNow").addEventListener("click", () =>
    doPrint({ einsatz:state.einsatz, einheiten:state.einheiten, fuehrung:state.fuehrung,
      abschnitte:state.abschnitte, funk:state.funk, besprechungen:state.besprechungen,
      anforderungen:state.anforderungen, checks:state.checks,
      asTraeger:state.asTraeger, asTrupps:state.asTrupps,
      lage:state.lage, fotos:state.fotos, ende:null }));
  $("#btnEnde").addEventListener("click", endeEinsatz);
  document.querySelectorAll("[data-aakt]").forEach(b =>
    b.addEventListener("click", () => aktiviereArchiv(b.dataset.aakt)));
  document.querySelectorAll("[data-aprint]").forEach(b => b.addEventListener("click", () => {
    const a = state.archiv.find(x => x.id === b.dataset.aprint);
    if(a) doPrint(a);
  }));
  document.querySelectorAll("[data-adel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diesen Archiveintrag wirklich löschen?").then(ok => { if(!ok) return;
      state.archiv = state.archiv.filter(x => x.id !== b.dataset.adel);
      markChange(); render();
    });
  }));
}
/* Einsatz als Datei sichern / einlesen – Backup, Gerätewechsel, „Sync per USB-Stick“ */
function exportEinsatz(){
  const data = {
    elwis: 1, exportiert: new Date().toISOString(), ugName: state.config.ugName,
    einsatz: state.einsatz, einheiten: state.einheiten, fuehrung: state.fuehrung,
    abschnitte: state.abschnitte, lage: state.lage, funk: state.funk,
    besprechungen: state.besprechungen, anforderungen: state.anforderungen,
    checks: state.checks, fotos: state.fotos,
    asTraeger: state.asTraeger, asTrupps: state.asTrupps,
  };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const stw = (state.einsatz.stichwort || "einsatz").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 40);
  a.download = `ELWIS_${stw}_${fmtDateInput(new Date().toISOString())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}
function importEinsatz(file){
  const rd = new FileReader();
  rd.onload = async () => {
    try{
      const d = JSON.parse(rd.result);
      if(!d || d.elwis !== 1 || !d.einsatz) throw new Error("kein ELWIS-Export");
      const wer = [d.einsatz.stichwort || "ohne Stichwort", d.ugName ? `(${d.ugName})` : "",
        d.exportiert ? `– exportiert ${fmtDatum(d.exportiert)} ${fmtZeit(d.exportiert)} Uhr` : ""].join(" ");
      if(!(await modalConfirm(`Einsatz „${wer}“ importieren?\nDer aktuell erfasste Einsatz wird ersetzt (Archiv und Einstellungen bleiben).`))) return;
      state.einsatz = d.einsatz;
      state.einheiten = d.einheiten || [];
      state.fuehrung = d.fuehrung || [];
      state.abschnitte = d.abschnitte || [];
      state.lage = (d.lage && Array.isArray(d.lage.items)) ? d.lage : { items: [], bg: "", snapshots: [] };
      state.lage.snapshots = state.lage.snapshots || [];
      state.funk = d.funk || [];
      state.besprechungen = d.besprechungen || [];
      state.anforderungen = d.anforderungen || [];
      state.checks = d.checks || [];
      state.fotos = d.fotos || [];
      state.asTraeger = d.asTraeger || [];
      state.asTrupps = d.asTrupps || [];
      state.einsatzId = uid(); state.einsatzStart = new Date().toISOString();
      try{ markChange(); }catch(err){
        state.fotos = []; state.lage.bg = "";
        markChange();
        modalInfo("Import gelungen, aber Fotos/Kartenhintergrund passten nicht in den lokalen Speicher und wurden weggelassen.");
      }
      render();
    }catch(err){
      modalInfo("Datei konnte nicht gelesen werden – ist das ein ELWIS-Export (.json)?");
    }
  };
  rd.readAsText(file);
}
function openFotoSheet(id){
  const f = state.fotos.find(x => x.id === id);
  if(!f) return;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Einsatzfoto">
    <div class="sheet-head">
      <h2>Foto · ${fmtDatum(f.zeit)} ${fmtZeit(f.zeit)} Uhr</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <img src="${f.data}" alt="Einsatzfoto" style="width:100%;border-radius:12px;margin-bottom:14px">
      <div class="field"><label for="foto-notiz">Notiz</label>
        <input id="foto-notiz" value="${esc(f.notiz||"")}" placeholder="z. B. Giebelwand Ostseite, Riss sichtbar" autocomplete="off"></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="foto-del">Löschen</button>
      <button class="btn btn-primary" id="foto-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#foto-del").addEventListener("click", () => {
    modalConfirm("Dieses Foto wirklich löschen?").then(ok => { if(!ok) return;
      state.fotos = state.fotos.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#foto-save").addEventListener("click", () => {
    f.notiz = $("#foto-notiz").value.trim();
    markChange(); closeEditor(); render();
  });
}
function baueArchivEintrag(){
  return {
    id: uid(), ende: new Date().toISOString(),
    einsatz: {...state.einsatz},
    einheiten: state.einheiten.map(u => ({...u})),
    fuehrung: state.fuehrung.map(f => ({...f})),
    abschnitte: state.abschnitte.map(a => ({...a})),
    funk: state.funk.map(f => ({...f})),
    besprechungen: state.besprechungen.map(b => ({...b})),
    anforderungen: state.anforderungen.map(a => ({...a})),
    checks: state.checks.map(c => ({...c, punkte:c.punkte.map(p => ({...p}))})),
    asTraeger: state.asTraeger.map(t => ({...t})),
    asTrupps: state.asTrupps.map(t => ({...t, memberIds:[...(t.memberIds||[])]})),
    lage: { bg: state.lage.bg, mode: state.lage.mode, mapView: state.lage.mapView, mapLayer: state.lage.mapLayer,
      items: state.lage.items.map(i => ({...i})),
      snapshots: state.lage.snapshots.map(s => ({...s, items: s.items.map(i => ({...i}))})) },
    fotos: state.fotos.map(f => ({...f})),
  };
}
/* Archivierten Einsatz wieder aktiv machen (aktueller Einsatz wird vorher archiviert) */
async function aktiviereArchiv(id){
  const a = state.archiv.find(x => x.id === id);
  if(!a) return;
  const hatInhalt = state.einheiten.length || state.funk.length || state.besprechungen.length ||
    state.lage.items.length || state.einsatz.stichwort;
  const frage = `Einsatz „${a.einsatz.stichwort || "ohne Stichwort"}“ wieder aktivieren?` +
    (hatInhalt ? "\nDer aktuell erfasste Einsatz wird dabei automatisch archiviert." : "");
  if(!(await modalConfirm(frage, "Aktivieren"))) return;
  if(hatInhalt) state.archiv.push(baueArchivEintrag());
  state.archiv = state.archiv.filter(x => x.id !== id);
  state.einsatz = {...a.einsatz};
  state.einheiten = (a.einheiten || []).map(x => ({...x}));
  state.fuehrung = (a.fuehrung || []).map(x => ({...x}));
  state.abschnitte = (a.abschnitte || []).map(x => ({...x}));
  state.funk = (a.funk || []).map(x => ({...x}));
  state.besprechungen = (a.besprechungen || []).map(x => ({...x}));
  state.anforderungen = (a.anforderungen || []).map(x => ({...x}));
  state.checks = (a.checks || []).map(c => ({...c, punkte:(c.punkte || []).map(p => ({...p}))}));
  state.lage = a.lage
    ? { bg: a.lage.bg || "", items: (a.lage.items || []).map(x => ({...x})),
        snapshots: (a.lage.snapshots || []).map(s => ({...s, items:(s.items || []).map(x => ({...x}))})) }
    : { items: [], bg: "", snapshots: [] };
  state.fotos = (a.fotos || []).map(x => ({...x}));
  state.asTraeger = (a.asTraeger || []).map(x => ({...x}));
  state.asTrupps = (a.asTrupps || []).map(x => ({...x, memberIds:[...(x.memberIds||[])]}));
  // Neue Sync-Identität: der reaktivierte Einsatz wird zum aktuellen (auch am Server)
  state.einsatzId = uid();
  state.einsatzStart = new Date().toISOString();
  markChange(); render();
}
async function endeEinsatz(){
  if(!state.einheiten.length && !state.einsatz.stichwort){
    modalInfo("Es ist kein Einsatz mit Daten vorhanden."); return;
  }
  if(!(await modalConfirm("Einsatz jetzt beenden? Er wird archiviert und die Erfassung geleert."))) return;
  const entry = baueArchivEintrag();
  state.archiv.push(entry);
  state.einsatzId = uid(); state.einsatzStart = new Date().toISOString();
  state.einsatz = { stichwort:"", ort:"", beginn:nowLocalInput(), leiter:"", bemerkung:"" };
  state.einheiten = []; state.fuehrung = []; state.abschnitte = [];
  state.lage = { items: [], bg: "", snapshots: [], mode: "raster", mapView: null, mapLayer: "luftbild" };
  state.funk = []; state.besprechungen = [];
  state.anforderungen = []; state.checks = []; state.fotos = [];
  state.asTraeger = []; state.asTrupps = [];
  try{ markChange(); }catch(err){
    // Speicher voll: Bilder aus dem Archiveintrag entfernen und erneut versuchen
    entry.fotos = []; entry.lage.bg = ""; entry.lage.snapshots = [];
    try{ markChange(); modalInfo("Archiviert – Fotos/Kartenbilder passten nicht in den lokalen Speicher und wurden im Archiv weggelassen (vorher exportieren sichert alles)."); }
    catch(e2){ state.archiv.pop(); markChange(); modalInfo("Lokaler Speicher voll – Einsatz konnte nicht archiviert werden. Bitte erst exportieren oder alte Archiveinträge löschen."); return; }
  }
  render();
  if(await modalConfirm("Einsatz archiviert. Bericht jetzt drucken?", "Drucken", "Später")) doPrint(entry);
}
function loadDemo(){
  const t = (minAgo) => new Date(Date.now() - minAgo*60000).toISOString();
  const a1 = uid(), a2 = uid();
  const lbT = new Date(Date.now() + 30*60000);
  state.einsatz = {
    stichwort:"B4 – Brand Lagerhalle", ort:"Industriestraße 12, Weiden",
    beginn: nowLocalInput(), leiter:"KBI Mustermann", bemerkung:"Zwei Abschnitte gebildet",
    lagebespr: `${String(lbT.getHours()).padStart(2,"0")}:${String(lbT.getMinutes()).padStart(2,"0")}`,
  };
  state.abschnitte = [
    { id:a1, name:"Abschnitt 1 – Brandbekämpfung",  ansprechpartner:"Florian Weiden 3/1",      tmo:"2901", dmo:"307_F" },
    { id:a2, name:"Abschnitt 2 – Wasserversorgung", ansprechpartner:"Florian Rothenstadt 10/1", tmo:"2902", dmo:"308_F" },
  ];
  state.einheiten = [
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"40/1", f:0,u:1,m:8, agt:4, ankunft:t(42), abgerueckt:false, abschnitt:a1 },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"30/1", f:1,u:0,m:2, agt:0, ankunft:t(40), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"FW",  name:"Florian Rothenstadt", kennung:"42/1", f:0,u:1,m:5, agt:2, ankunft:t(31), abgerueckt:false, abschnitt:a2 },
    { id:uid(), org:"BRK", name:"RK Weiden",           kennung:"71/1", f:0,u:1,m:1, agt:0, ankunft:t(28), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"POL", name:"Donau",               kennung:"23/1", f:0,u:0,m:2, agt:0, ankunft:t(25), abgerueckt:false, abschnitt:"" },
    { id:uid(), org:"THW", name:"Heros Weiden",        kennung:"21/25",f:0,u:1,m:3, agt:0, ankunft:t(12), abgerueckt:false, abschnitt:a2 },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"11/1", f:1,u:1,m:1, agt:0, ankunft:t(45), abgerueckt:true,  abschnitt:"" },
    { id:uid(), org:"FW",  name:"Florian Weiden",      kennung:"1/23/1", f:0,u:1,m:2, agt:2, ankunft:t(6), abgerueckt:false, abschnitt:"BR" },
  ];
  state.anforderungen = [
    { id:uid(), was:"DLK 23/12",              status:"alarmiert",   angefordert:t(28), alarmiert:t(24), eingetroffen:"" },
    { id:uid(), was:"Löschzug FF Nachbarort", status:"angefordert", angefordert:t(10), alarmiert:"",    eingetroffen:"" },
  ];
  state.checks = [
    { id:uid(), name:"Einsatzleiter – Erstmaßnahmen", punkte:[
      { text:"Lage erkunden",                     done:true,  zeit:t(41) },
      { text:"Rückmeldung an Leitstelle",         done:true,  zeit:t(38) },
      { text:"Einsatzstelle absichern",           done:true,  zeit:t(35) },
      { text:"Bereitstellungsraum festlegen",     done:true,  zeit:t(26) },
      { text:"Abschnitte bilden",                 done:true,  zeit:t(24) },
      { text:"Atemschutzüberwachung sicherstellen", done:false, zeit:"" },
      { text:"Lagekarte anlegen",                 done:true,  zeit:t(18) },
      { text:"Presse/Behörden informieren",       done:false, zeit:"" },
      { text:"Lagebesprechung ansetzen",          done:true,  zeit:t(21) },
    ]},
  ];
  state.fotos = [];
  state.fuehrung = [
    { id:uid(), org:"FW",  name:"KBI Mustermann", funktion:"Einsatzleiter",            einheit:"" },
    { id:uid(), org:"FW",  name:"ZF Huber",       funktion:"Abschnittsleiter",         einheit:"Abschnitt 1" },
    { id:uid(), org:"BRK", name:"H. Meier",       funktion:"Organisatorischer Leiter", einheit:"" },
    { id:uid(), org:"THW", name:"S. Schmidt",     funktion:"Fachberater THW",          einheit:"" },
  ];
  const lf = state.einheiten[0], tlf = state.einheiten[2];
  state.lage = { bg:"", snapshots:[], items: [
    { id:uid(), type:"sym", sym:"brand3", label:"Lagerhalle", x:50, y:34 },
    { id:uid(), type:"car",     num:1, unitId:lf.id,  x:34, y:52 },
    { id:uid(), type:"car",     num:2, unitId:tlf.id, x:66, y:56 },
    { id:uid(), type:"el",      label:"ELW 1",       x:16, y:82 },
    { id:uid(), type:"wasser",  label:"Hydrant",     x:82, y:22 },
    { id:uid(), type:"gefahr",  label:"Gasflaschen", x:60, y:24 },
    { id:uid(), type:"num", num:1, text:"Faltbehälter 10.000 Liter",        x:24, y:30 },
    { id:uid(), type:"num", num:2, text:"Bereitstellungsraum Parkplatz Süd", x:78, y:78 },
  ]};
  state.funk = [
    { id:uid(), zeit:t(38), von:"Florian Weiden 40/1", an:"ELW",
      text:"Ankunft Einsatzstelle, Erkundung läuft.", wichtig:false },
    { id:uid(), zeit:t(30), von:"Florian Weiden 40/1", an:"ELW",
      text:"Lagemeldung: Vollbrand Lagerhalle, zwei Trupps unter PA im Innenangriff. Nachforderung: 1 Löschzug, Drehleiter.", wichtig:true },
    { id:uid(), zeit:t(22), von:"ELW", an:"Leitstelle",
      text:"Nachforderung Löschzug + DLK 23/12 bestätigt, Abschnittsbildung eingeleitet.", wichtig:false },
    { id:uid(), zeit:t(8),  von:"Heros Weiden 21/25", an:"ELW",
      text:"Bereitstellungsraum Parkplatz Süd bezogen.", wichtig:false },
  ];
  state.besprechungen = [
    { id:uid(), zeit:t(20), teilnehmer:"EL, AL 1, AL 2, OrgL",
      protokoll:"Lage: Vollbrand Lagerhalle, Ausbreitung auf Nachbargebäude verhindert.\nBeschluss: Abschnitt 2 verstärkt Wasserversorgung über Faltbehälter.\nAuftrag: THW prüft Statik Giebelwand.\nNächste Besprechung 30 min." },
  ];
  markChange(); render();
}

/* ---------------- Ansicht: Kräfte ---------------- */
function renderKraefte(){
  const act = aktive(), s = summen(act);
  const offeneAf = state.anforderungen.filter(a => a.status !== "eingetroffen").length;
  const seg = `
  <div class="seg" role="tablist">
    <button role="tab" data-ksub="einheiten" class="${state.ksub==="einheiten"?"active":""}">Einheiten (${state.einheiten.length})</button>
    <button role="tab" data-ksub="fuehrung" class="${state.ksub==="fuehrung"?"active":""}">Führungskräfte (${state.fuehrung.length})</button>
    <button role="tab" data-ksub="anford" class="${state.ksub==="anford"?"active":""}">Anforderungen (${offeneAf})</button>
  </div>`;
  if(state.ksub === "anford"){
    const list = [...state.anforderungen].sort((a,b) =>
      (a.status==="eingetroffen"?1:0)-(b.status==="eingetroffen"?1:0) ||
      (b.angefordert||"").localeCompare(a.angefordert||""));
    const items = list.length ? `<div class="fs-list">${list.map(a => `
      <button class="fs-item ${a.status!=="eingetroffen"?"imp":""}" data-editaf="${esc(a.id)}" ${a.status==="eingetroffen"?'style="opacity:.55"':""}>
        <div class="fs-head">
          <span class="fs-zeit mono">${fmtZeit(a.angefordert)}</span>
          <span class="chip chip-st-${esc(a.status)}">${esc(a.status)}</span>
          ${a.alarmiert ? `<span class="mono">alarmiert ${fmtZeit(a.alarmiert)}</span>` : ""}
          ${a.eingetroffen ? `<span class="mono">eingetroffen ${fmtZeit(a.eingetroffen)}</span>` : ""}
        </div>
        <div class="fs-text">${esc(a.was)}</div>
      </button>`).join("")}</div>`
    : `<div class="empty"><p>Keine offenen Anforderungen.<br>Nachgeforderte Kräfte hier verfolgen: angefordert → alarmiert → eingetroffen.</p></div>`;
    return `${seg}
      <button class="btn btn-primary btn-block" id="btnAddAf" style="margin-bottom:16px">＋&nbsp; Kräfte nachfordern</button>
      ${items}`;
  }
  if(state.ksub === "fuehrung"){
    const list = state.fuehrung.length
      ? `<div class="unit-list">${state.fuehrung.map(fkCard).join("")}</div>`
      : `<div class="empty"><p>Noch keine Führungskräfte erfasst.<br>Einsatzleiter, Abschnittsleiter, Zugführer … aller Organisationen.</p></div>`;
    return `${seg}
      <button class="btn btn-primary btn-block" id="btnAddFk" style="margin-bottom:16px">＋&nbsp; Führungskraft erfassen</button>
      ${list}`;
  }
  const sorted = [...state.einheiten].sort((a,b) =>
    (a.abgerueckt?1:0)-(b.abgerueckt?1:0) || (b.ankunft||"").localeCompare(a.ankunft||""));
  let list;
  if(!sorted.length){
    list = `<div class="empty">
      <p>Noch keine Kräfte erfasst.<br>Mit dem Tablet von Fahrzeug zu Fahrzeug – auch komplett offline.</p>
      <button class="btn btn-ghost" id="btnDemo2">Beispieldaten laden</button>
    </div>`;
  }else if(state.abschnitte.length || sorted.some(u => u.abschnitt === "BR")){
    const groups = [...state.abschnitte, { id:"BR", name:"Bereitstellungsraum" }, { id:"", name:"Ohne Abschnitt" }];
    list = groups.map(g => {
      const us = sorted.filter(u => (u.abschnitt||"") === g.id);
      if(!us.length) return "";
      const funk = [g.tmo ? `TMO ${g.tmo}` : "", g.dmo ? `DMO ${g.dmo}` : ""].filter(Boolean).join(" · ");
      return `<h3 class="group-h">${esc(g.name)} <span>· ${us.length}${funk ? " · " + esc(funk) : ""}</span></h3>
        <div class="unit-list">${us.map(unitCard).join("")}</div>`;
    }).join("");
  }else{
    list = `<div class="unit-list">${sorted.map(unitCard).join("")}</div>`;
  }
  return `
  <div class="statstrip" role="status" aria-label="Summen">
    <div class="stat"><div class="k">Gesamtstärke</div><div class="v mono">${s.f+s.u+s.m}</div><div class="s mono">${s.f}/${s.u}/${s.m}</div></div>
    <div class="stat"><div class="k">AGT</div><div class="v mono">${s.agt}</div><div class="s">Atemschutz</div></div>
    <div class="stat"><div class="k">Einheiten</div><div class="v mono">${act.length}</div><div class="s">an E-Stelle</div></div>
  </div>
  ${seg}
  <button class="btn btn-primary btn-block" id="btnAdd" style="margin-bottom:16px">＋&nbsp; Kraft erfassen</button>
  ${list}`;
}
function unitCard(u){
  const org = ORGS[u.org] || ORGS.SON;
  return `
  <button class="unit org-${esc(u.org)} ${u.abgerueckt?"left":""}" data-edit="${esc(u.id)}">
    <div class="u-main">
      <div class="u-name">${esc(fullName(u)) || "<span style='color:var(--ink3)'>ohne Rufname</span>"}</div>
      <div class="u-meta">
        <span class="chip chip-${esc(u.org)}">${esc(org.short)}</span>
        ${u.agt>0 ? `<span class="badge-agt">AGT ${u.agt}</span>` : ""}
        <span class="mono">${fmtZeit(u.ankunft)}</span>
        ${u.abgerueckt ? "<span>abgerückt</span>" : ""}
      </div>
    </div>
    <div class="u-staerke mono">${staerkeStr(u)}<span class="lbl">Stärke</span></div>
  </button>`;
}
function fkCard(f){
  const org = ORGS[f.org] || ORGS.SON;
  return `
  <button class="unit org-${esc(f.org)}" data-editfk="${esc(f.id)}">
    <div class="u-main">
      <div class="u-name sans">${esc(f.name) || "<span style='color:var(--ink3)'>ohne Name</span>"}</div>
      <div class="u-meta">
        <span class="chip chip-${esc(f.org)}">${esc(org.short)}</span>
        <span>${esc(f.funktion)}</span>
        ${f.einheit ? `<span>· ${esc(f.einheit)}</span>` : ""}
      </div>
    </div>
  </button>`;
}
function wireKraefte(){
  document.querySelectorAll("[data-ksub]").forEach(b =>
    b.addEventListener("click", () => { state.ksub = b.dataset.ksub; save(); render(); }));
  const add = $("#btnAdd");   if(add) add.addEventListener("click", () => openEditor(null));
  const addFk = $("#btnAddFk"); if(addFk) addFk.addEventListener("click", () => openFkEditor(null));
  const addAf = $("#btnAddAf"); if(addAf) addAf.addEventListener("click", () => openAfEditor(null));
  document.querySelectorAll("[data-editaf]").forEach(el =>
    el.addEventListener("click", () => openAfEditor(el.dataset.editaf)));
  const demo = $("#btnDemo2"); if(demo) demo.addEventListener("click", loadDemo);
  document.querySelectorAll("[data-edit]").forEach(el =>
    el.addEventListener("click", () => openEditor(el.dataset.edit)));
  document.querySelectorAll("[data-editfk]").forEach(el =>
    el.addEventListener("click", () => openFkEditor(el.dataset.editfk)));
}

/* ---------------- Editor: Einheit ---------------- */
function openEditor(id){
  if(id){
    const u = state.einheiten.find(x => x.id === id);
    if(!u) return;
    editing = { unit: {...u}, isNew:false };
  }else{
    editing = { unit: { id:uid(), org:"FW", name:pfx("FW"), kennung:"", f:0, u:1, m:8, agt:0,
      ankunft:new Date().toISOString(), abgerueckt:false, abschnitt:"" }, isNew:true };
  }
  renderSheet();
}
function closeEditor(){ editing = null; editingFk = null; editingAb = null; $("#sheetHost").innerHTML = ""; }

function orgPickHtml(current){
  return Object.entries(ORGS).map(([key,o]) => `
    <button data-org="${key}" style="--oc:var(${o.cssVar})" aria-pressed="${current===key}">
      ${o.short}<small>${esc(o.label)}</small>
    </button>`).join("");
}
function renderSheet(){
  if(!editing){ $("#sheetHost").innerHTML = ""; return; }
  const u = editing.unit;
  const stepper = (field, label, sub) => `
    <div class="stepper">
      <div class="st-label">${label}<small>${sub}</small></div>
      <button data-step="${field}:-1" aria-label="${label} verringern">−</button>
      <div class="st-val mono" data-val="${field}">${u[field]}</div>
      <button data-step="${field}:1" aria-label="${label} erhöhen">＋</button>
    </div>`;
  const abField = `
    <div class="field"><label>Einsatzabschnitt / Bereitstellung</label>
      <div class="abpick">
        <button data-ab="" aria-pressed="${!u.abschnitt}">Kein Abschnitt</button>
        <button data-ab="BR" aria-pressed="${u.abschnitt==="BR"}">Bereitstellungsraum</button>
        ${state.abschnitte.map(a => `
          <button data-ab="${esc(a.id)}" aria-pressed="${u.abschnitt===a.id}">${esc(a.name)}</button>`).join("")}
      </div>
    </div>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editing.isNew?"Kraft erfassen":"Kraft bearbeiten"}">
    <div class="sheet-head">
      <h2>${editing.isNew ? "Kraft erfassen" : "Kraft bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="e-katalog">Fahrzeugkatalog (Fuhrpark)</label>
        <select id="e-katalog">
          <option value="">– Fahrzeug wählen, füllt alles vor –</option>
          ${[...new Set(FZG_KATALOG.map(k => k.grp))].map(grp => `
            <optgroup label="${esc(grp)}">
              ${FZG_KATALOG.map((k,idx) => k.grp===grp
                ? `<option value="${idx}">${esc(k.typ)} – ${esc(k.name)} ${esc(k.kennung)}</option>` : "").join("")}
            </optgroup>`).join("")}
        </select>
      </div>
      <div class="field"><label>Organisation</label><div class="orgpick">${orgPickHtml(u.org)}</div></div>
      <div class="field">
        <div class="rufname-row">
          <div><label for="e-name">Funkrufname</label>
            <input id="e-name" class="mono" value="${esc(u.name)}" placeholder="z. B. ${esc(pfx("FW"))} Weiden" autocomplete="off"></div>
          <div><label for="e-kennung">Kennung</label>
            <div class="kennung-wrap">
              <input id="e-kennung" class="mono" inputmode="decimal" value="${esc(u.kennung||"")}" placeholder="40,1" autocomplete="off">
              <button class="slashbtn" id="e-slash" aria-label="Schrägstrich einfügen">/</button>
            </div>
          </div>
        </div>
        <div class="ruf-preview mono" id="e-preview"></div>
        <p class="hint">Kennung nur mit Ziffern tippen – Komma oder Punkt wird automatisch zu „/“ (40,1 → 40/1 · 1,40,1 → 1/40/1).</p>
      </div>
      ${abField}
      <div class="field"><label>Stärke (Führer / Unterführer / Mannschaft)</label>
        <div class="steppers">
          ${stepper("f","Führer","Verbands-/Zugführer")}
          ${stepper("u","Unterführer","Gruppen-/Truppführer")}
          ${stepper("m","Mannschaft","")}
        </div>
        <div class="gesamt-row"><span class="g-lbl">Stärke</span>
          <span class="g-not mono" id="e-gesamt">${staerkeStr(u)}</span></div>
      </div>
      <div class="field"><label>Atemschutzgeräteträger (AGT)</label>
        <div class="steppers">${stepper("agt","AGT","einsatzbereit an Bord")}</div></div>
      <div class="field"><label for="e-zeit">Ankunft an Einsatzstelle</label>
        <input id="e-zeit" type="time" class="mono" value="${fmtZeit(u.ankunft)==="–"?"":fmtZeit(u.ankunft)}"></div>
      ${editing.isNew ? "" : `
      <div class="field">
        <button class="leave-toggle" id="e-left" aria-pressed="${u.abgerueckt}">
          <span class="track"></span>
          <span>Abgerückt <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">zählt nicht mehr zur Stärke an der Einsatzstelle</small></span>
        </button>
      </div>`}
    </div>
    <div class="sheet-foot">
      ${editing.isNew ? "" : `<button class="btn btn-danger-ghost" id="e-del">Löschen</button>`}
      <button class="btn btn-primary" id="e-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  wireSheet();
}
function wireSheet(){
  const u = editing.unit;
  const updatePreview = () => {
    const el = $("#e-preview");
    const n = fullName(u);
    el.innerHTML = n ? esc(n) : `<span class="ph">Vorschau Funkrufname</span>`;
  };
  updatePreview();
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#e-katalog").addEventListener("change", e => {
    const k = FZG_KATALOG[Number(e.target.value)];
    if(!k) return;
    u.org = "FW"; u.name = k.name; u.kennung = k.kennung;
    u.f = k.f; u.u = k.u; u.m = k.m; u.agt = k.agt;
    renderSheet(); // alle Felder mit den Katalogwerten neu aufbauen
  });
  document.querySelectorAll("[data-org]").forEach(b => b.addEventListener("click", () => {
    const prevDefault = pfx(u.org);
    u.org = b.dataset.org;
    // Präfix nur ersetzen, wenn der Nutzer noch nichts Eigenes geschrieben hat
    if(!u.name.trim() || u.name.trim() === prevDefault){
      u.name = pfx(u.org);
      $("#e-name").value = u.name;
    }
    document.querySelectorAll("[data-org]").forEach(x => x.setAttribute("aria-pressed", x.dataset.org===u.org));
    updatePreview();
  }));
  document.querySelectorAll("[data-ab]").forEach(b => b.addEventListener("click", () => {
    u.abschnitt = b.dataset.ab;
    document.querySelectorAll("[data-ab]").forEach(x => x.setAttribute("aria-pressed", x.dataset.ab===u.abschnitt));
  }));
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
    const [field, d] = b.dataset.step.split(":");
    u[field] = Math.max(0, Math.min(99, (u[field]|0) + Number(d)));
    document.querySelector(`[data-val="${field}"]`).textContent = u[field];
    $("#e-gesamt").textContent = staerkeStr(u);
  }));
  $("#e-name").addEventListener("input", e => { u.name = e.target.value; updatePreview(); });
  const ken = $("#e-kennung");
  ken.addEventListener("input", () => {
    const clean = ken.value.replace(/[.,\s]+/g,"/").replace(/\/{2,}/g,"/");
    if(clean !== ken.value) ken.value = clean;
    u.kennung = clean; updatePreview();
  });
  $("#e-slash").addEventListener("click", () => {
    if(ken.value && !ken.value.endsWith("/")) ken.value += "/";
    u.kennung = ken.value; ken.focus(); updatePreview();
  });
  $("#e-zeit").addEventListener("change", e => {
    if(!e.target.value) return;
    const [h,m] = e.target.value.split(":").map(Number);
    const d = u.ankunft ? new Date(u.ankunft) : new Date();
    d.setHours(h, m, 0, 0); u.ankunft = d.toISOString();
  });
  const left = $("#e-left");
  if(left) left.addEventListener("click", () => {
    u.abgerueckt = !u.abgerueckt;
    left.setAttribute("aria-pressed", u.abgerueckt);
  });
  const del = $("#e-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Kraft wirklich löschen?").then(ok => { if(!ok) return;
      state.einheiten = state.einheiten.filter(x => x.id !== u.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#e-save").addEventListener("click", () => {
    u.kennung = (u.kennung||"").replace(/\/+$/,"");
    const idx = state.einheiten.findIndex(x => x.id === u.id);
    if(idx >= 0) state.einheiten[idx] = u; else state.einheiten.push(u);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Anforderung (Nachforderungs-Tracker) ---------------- */
let editingAf = null;
function openAfEditor(id){
  if(id){
    const a = state.anforderungen.find(x => x.id === id);
    if(!a) return;
    editingAf = { af: {...a}, isNew:false };
  }else{
    editingAf = { af: { id:uid(), was:"", status:"angefordert",
      angefordert:new Date().toISOString(), alarmiert:"", eingetroffen:"" }, isNew:true };
  }
  const a = editingAf.af;
  const zeile = (label, iso) => iso ? `<div class="fkrow"><span class="fk-n">${label}</span><span class="fk-f mono">${fmtZeit(iso)} Uhr</span></div>` : "";
  const nextBtn = a.status === "angefordert"
    ? `<button class="btn btn-ghost btn-block" id="af-next" style="margin-bottom:10px">Jetzt: alarmiert</button>`
    : a.status === "alarmiert"
    ? `<button class="btn btn-ghost btn-block" id="af-next" style="margin-bottom:10px">Jetzt: eingetroffen</button>`
    : `<p class="hint" style="margin-bottom:10px">Eingetroffen – jetzt unter „Einheiten“ erfassen (Fahrzeugkatalog nutzen).</p>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Anforderung">
    <div class="sheet-head">
      <h2>${editingAf.isNew ? "Kräfte nachfordern" : "Anforderung"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="af-was">Was wird angefordert?</label>
        <input id="af-was" value="${esc(a.was)}" placeholder="z. B. Löschzug FF Nachbarort, DLK 23/12, 2 RTW" autocomplete="off"></div>
      <div class="field"><label>Status</label>
        <div style="margin-bottom:10px"><span class="chip chip-st-${esc(a.status)}">${esc(a.status)}</span></div>
        ${nextBtn}
        ${zeile("Angefordert", a.angefordert)}
        ${zeile("Alarmiert", a.alarmiert)}
        ${zeile("Eingetroffen", a.eingetroffen)}
      </div>
    </div>
    <div class="sheet-foot">
      ${editingAf.isNew ? "" : `<button class="btn btn-danger-ghost" id="af-del">Löschen</button>`}
      <button class="btn btn-primary" id="af-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const next = $("#af-next");
  if(next) next.addEventListener("click", () => {
    if(a.status === "angefordert"){ a.status = "alarmiert"; a.alarmiert = new Date().toISOString(); }
    else if(a.status === "alarmiert"){ a.status = "eingetroffen"; a.eingetroffen = new Date().toISOString(); }
    a.was = $("#af-was").value.trim();
    const idx = state.anforderungen.findIndex(x => x.id === a.id);
    if(idx >= 0) state.anforderungen[idx] = {...a}; else state.anforderungen.push({...a});
    markChange();
    openAfEditor(a.id); // Sheet mit neuem Status neu aufbauen
  });
  const del = $("#af-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Anforderung wirklich löschen?").then(ok => { if(!ok) return;
      state.anforderungen = state.anforderungen.filter(x => x.id !== a.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#af-save").addEventListener("click", () => {
    a.was = $("#af-was").value.trim();
    if(!a.was){ $("#af-was").focus(); return; }
    const idx = state.anforderungen.findIndex(x => x.id === a.id);
    if(idx >= 0) state.anforderungen[idx] = a; else state.anforderungen.push(a);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Einsatzabschnitt ---------------- */
let editingAb = null; // { ab, isNew }
function openAbEditor(id){
  if(id){
    const a = state.abschnitte.find(x => x.id === id);
    if(!a) return;
    editingAb = { ab: {...a}, isNew:false };
  }else{
    editingAb = { ab: { id:uid(), name:"", ansprechpartner:"", tmo:"", dmo:"" }, isNew:true };
  }
  renderAbSheet();
}
function renderAbSheet(){
  if(!editingAb){ $("#sheetHost").innerHTML = ""; return; }
  const a = editingAb.ab;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingAb.isNew?"Abschnitt anlegen":"Abschnitt bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingAb.isNew ? "Abschnitt anlegen" : "Abschnitt bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="ab-name">Abschnittsname</label>
        <input id="ab-name" value="${esc(a.name)}" placeholder="z. B. Abschnitt 1 – Brandbekämpfung" autocomplete="off"></div>
      <div class="field"><label for="ab-ap">Ansprechpartner</label>
        <input id="ab-ap" class="mono" value="${esc(a.ansprechpartner||"")}" placeholder="z. B. Florian Weiden 3/1" autocomplete="off">
        <p class="hint">Funkrufname oder Name des Abschnittsleiters / Ansprechpartners.</p></div>
      <div class="field"><label style="margin-bottom:10px">Erreichbarkeit (Digitalfunk)</label>
        <div class="form-grid">
          <div class="field"><label for="ab-tmo">TMO-Gruppe</label>
            <input id="ab-tmo" class="mono" value="${esc(a.tmo||"")}" placeholder="z. B. 2901" autocomplete="off"></div>
          <div class="field"><label for="ab-dmo">DMO-Gruppe</label>
            <input id="ab-dmo" class="mono" value="${esc(a.dmo||"")}" placeholder="z. B. 307_F" autocomplete="off"></div>
        </div>
        <p class="hint">TMO z. B. Sondergruppe „2901“ (SoGr 1), DMO z. B. „307_F“. Wird auf dem Einsatzmonitor beim Abschnitt angezeigt.</p>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingAb.isNew ? "" : `<button class="btn btn-danger-ghost" id="ab-del">Löschen</button>`}
      <button class="btn btn-primary" id="ab-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const del = $("#ab-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm(`Abschnitt „${a.name}“ löschen? Zugeordnete Einheiten bleiben erhalten (ohne Abschnitt).`).then(ok => { if(!ok) return;
      state.abschnitte = state.abschnitte.filter(x => x.id !== a.id);
      state.einheiten.forEach(u => { if(u.abschnitt === a.id) u.abschnitt = ""; });
      markChange(); closeEditor(); render();
    });
  });
  $("#ab-save").addEventListener("click", () => {
    a.name = $("#ab-name").value.trim();
    if(!a.name){ $("#ab-name").focus(); return; }
    a.ansprechpartner = $("#ab-ap").value.trim();
    a.tmo = $("#ab-tmo").value.trim();
    a.dmo = $("#ab-dmo").value.trim();
    const idx = state.abschnitte.findIndex(x => x.id === a.id);
    if(idx >= 0) state.abschnitte[idx] = a; else state.abschnitte.push(a);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Editor: Führungskraft ---------------- */
function openFkEditor(id){
  if(id){
    const f = state.fuehrung.find(x => x.id === id);
    if(!f) return;
    editingFk = { fk: {...f}, isNew:false };
  }else{
    editingFk = { fk: { id:uid(), org:"FW", name:"", funktion:"", einheit:"" }, isNew:true };
  }
  renderFkSheet();
}
function renderFkSheet(){
  if(!editingFk){ $("#sheetHost").innerHTML = ""; return; }
  const f = editingFk.fk;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingFk.isNew?"Führungskraft erfassen":"Führungskraft bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingFk.isNew ? "Führungskraft erfassen" : "Führungskraft bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Organisation</label><div class="orgpick">${orgPickHtml(f.org)}</div></div>
      <div class="field"><label for="fk-name">Name</label>
        <input id="fk-name" value="${esc(f.name)}" placeholder="Name, Dienstgrad" autocomplete="off"></div>
      <div class="field"><label for="fk-funktion">Funktion</label>
        <input id="fk-funktion" value="${esc(f.funktion)}" list="fk-funktionen" placeholder="z. B. Abschnittsleiter" autocomplete="off">
        <datalist id="fk-funktionen">${FUNKTIONEN.map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="field"><label for="fk-einheit">Einheit / Abschnitt <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="fk-einheit" value="${esc(f.einheit||"")}" placeholder="z. B. Abschnitt 1, ${esc(pfx("FW"))} Weiden 40/1" autocomplete="off"></div>
    </div>
    <div class="sheet-foot">
      ${editingFk.isNew ? "" : `<button class="btn btn-danger-ghost" id="fk-del">Löschen</button>`}
      <button class="btn btn-primary" id="fk-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-org]").forEach(b => b.addEventListener("click", () => {
    f.org = b.dataset.org;
    document.querySelectorAll("[data-org]").forEach(x => x.setAttribute("aria-pressed", x.dataset.org===f.org));
  }));
  $("#fk-name").addEventListener("input", e => { f.name = e.target.value; });
  $("#fk-funktion").addEventListener("input", e => { f.funktion = e.target.value; });
  $("#fk-einheit").addEventListener("input", e => { f.einheit = e.target.value; });
  const del = $("#fk-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diese Führungskraft wirklich löschen?").then(ok => { if(!ok) return;
      state.fuehrung = state.fuehrung.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#fk-save").addEventListener("click", () => {
    const idx = state.fuehrung.findIndex(x => x.id === f.id);
    if(idx >= 0) state.fuehrung[idx] = f; else state.fuehrung.push(f);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Funk (Einsatztagebuch) ---------------- */
let editingFs = null; // { fs, isNew }
function fsSuggestions(){
  const s = new Set(["Leitstelle", "ELW", state.config.ugName]);
  state.abschnitte.forEach(a => { if(a.name) s.add(a.name); if(a.ansprechpartner) s.add(a.ansprechpartner); });
  state.einheiten.forEach(u => { const n = fullName(u); if(n) s.add(n); });
  state.fuehrung.forEach(f => { if(f.name) s.add(f.name); });
  return [...s].filter(Boolean);
}
function renderFunk(){
  const list = [...state.funk].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""));
  const items = list.length ? `<div class="fs-list">${list.map(f => `
    <button class="fs-item ${f.wichtig?"imp":""}" data-editfs="${esc(f.id)}">
      <div class="fs-head">
        <span class="fs-zeit mono">${istHeute(f.zeit) ? "" : fmtTagKurz(f.zeit) + " "}${fmtZeit(f.zeit)}</span>
        <span class="fs-route"><strong>${esc(f.von)}</strong> → <strong>${esc(f.an)}</strong></span>
        ${f.wichtig ? `<span class="chip chip-imp">WICHTIG</span>` : ""}
      </div>
      <div class="fs-text">${esc(f.text)}</div>
    </button>`).join("")}</div>`
  : `<div class="empty"><p>Noch keine Funksprüche erfasst.<br>Sender, Empfänger, Inhalt – Zeitstempel kommt automatisch.</p></div>`;
  return `
  <div class="statstrip" role="status">
    <div class="stat"><div class="k">Funksprüche</div><div class="v mono">${state.funk.length}</div><div class="s">gesamt</div></div>
    <div class="stat"><div class="k">Wichtig</div><div class="v mono">${state.funk.filter(f=>f.wichtig).length}</div><div class="s">markiert</div></div>
    <div class="stat"><div class="k">Zuletzt</div><div class="v mono">${list.length?fmtZeit(list[0].zeit):"–"}</div><div class="s">Uhrzeit</div></div>
  </div>
  <button class="btn btn-primary btn-block" id="btnAddFs" style="margin-bottom:10px">＋&nbsp; Funkspruch erfassen</button>
  ${state.funk.length ? `<button class="btn btn-ghost btn-block" id="btnPrintFs" style="margin-bottom:16px">Funksprüche drucken (Einsatztagebuch)</button>` : ""}
  ${items}`;
}
function wireFunk(){
  $("#btnAddFs").addEventListener("click", () => openFsEditor(null));
  const pr = $("#btnPrintFs");
  if(pr) pr.addEventListener("click", doPrintFunk);
  document.querySelectorAll("[data-editfs]").forEach(el =>
    el.addEventListener("click", () => openFsEditor(el.dataset.editfs)));
}
function doPrintFunk(){
  const e = state.einsatz;
  const sorted = [...state.funk].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""));
  const mehrtaegig = new Set(sorted.map(f => new Date(f.zeit).toDateString())).size > 1;
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Einsatztagebuch · Funksprüche</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}${e.beginn ? " · Alarm " + fmtDatum(e.beginn) + " " + fmtZeit(e.beginn) + " Uhr" : ""}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    <table><thead><tr><th>Nr.</th><th>Zeit</th><th>Von</th><th>An</th><th>Inhalt</th></tr></thead><tbody>
      ${sorted.map((f,idx) => `
      <tr>
        <td class="p-mono">${idx+1}${f.wichtig ? " !" : ""}</td>
        <td class="p-mono">${mehrtaegig ? fmtTagKurz(f.zeit) + " " : ""}${fmtZeit(f.zeit)}</td>
        <td>${esc(f.von)}</td>
        <td>${esc(f.an)}</td>
        <td>${f.wichtig ? `<strong>${esc(f.text)}</strong>` : esc(f.text)}</td>
      </tr>`).join("")}
    </tbody></table>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Unterschrift</div>
    </div>
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}
function openFsEditor(id){
  if(id){
    const f = state.funk.find(x => x.id === id);
    if(!f) return;
    editingFs = { fs: {...f}, isNew:false };
  }else{
    editingFs = { fs: { id:uid(), zeit:new Date().toISOString(), von:"", an:state.config.ugName||"ELW",
      text:"", wichtig:false }, isNew:true };
  }
  renderFsSheet();
}
function renderFsSheet(){
  if(!editingFs){ $("#sheetHost").innerHTML = ""; return; }
  const f = editingFs.fs;
  const sugg = fsSuggestions().map(x => `<option value="${esc(x)}">`).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingFs.isNew?"Funkspruch erfassen":"Funkspruch bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingFs.isNew ? "Funkspruch erfassen" : "Funkspruch bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="width:190px"><label for="fs-datum">Datum</label>
            <input id="fs-datum" type="date" class="mono" value="${fmtDateInput(f.zeit)}"></div>
          <div style="width:150px"><label for="fs-zeit">Uhrzeit</label>
            <input id="fs-zeit" type="time" class="mono" step="60" value="${fmtZeit(f.zeit)==="–"?"":fmtZeit(f.zeit)}"></div>
        </div>
        <p class="hint">Vorbelegt mit jetzt – bei Einsätzen über Mitternacht Datum anpassen.</p>
      </div>
      <div class="field">
        <div class="swap-row">
          <div><label for="fs-von">Von (Sender)</label>
            <input id="fs-von" value="${esc(f.von)}" list="fs-sugg" placeholder="z. B. Florian Weiden 40/1" autocomplete="off"></div>
          <button class="swapbtn" id="fs-swap" title="Sender und Empfänger tauschen" aria-label="Sender und Empfänger tauschen">⇄</button>
          <div><label for="fs-an">An (Empfänger)</label>
            <input id="fs-an" value="${esc(f.an)}" list="fs-sugg" placeholder="z. B. ELW" autocomplete="off"></div>
        </div>
        <datalist id="fs-sugg">${sugg}</datalist>
      </div>
      <div class="field"><label for="fs-text">Inhalt</label>
        <div style="display:flex;gap:8px;align-items:stretch">
          <textarea id="fs-text" style="flex:1" placeholder="Wortlaut / Zusammenfassung des Funkspruchs …">${esc(f.text)}</textarea>
          <button class="micbtn" id="fs-mic" aria-label="Diktieren" title="Diktieren">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
          </button>
        </div></div>
      <div class="field">
        <button class="leave-toggle" id="fs-imp" aria-pressed="${f.wichtig}">
          <span class="track"></span>
          <span>Wichtig <small style="display:block;font-size:.75rem;font-weight:500;color:var(--ink3)">wird hervorgehoben – z. B. Lagemeldung, Anforderung, Freigabe</small></span>
        </button>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingFs.isNew ? "" : `<button class="btn btn-danger-ghost" id="fs-del">Löschen</button>`}
      <button class="btn btn-primary" id="fs-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  attachDictation($("#fs-mic"), $("#fs-text"));
  $("#fs-swap").addEventListener("click", () => {
    const v = $("#fs-von").value;
    $("#fs-von").value = $("#fs-an").value;
    $("#fs-an").value = v;
  });
  $("#fs-imp").addEventListener("click", () => {
    f.wichtig = !f.wichtig;
    $("#fs-imp").setAttribute("aria-pressed", f.wichtig);
  });
  const del = $("#fs-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Diesen Funkspruch wirklich löschen?").then(ok => { if(!ok) return;
      state.funk = state.funk.filter(x => x.id !== f.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#fs-save").addEventListener("click", () => {
    const dv = $("#fs-datum").value, tv = $("#fs-zeit").value;
    if(dv && tv){
      const d = new Date(`${dv}T${tv}:00`);
      if(!isNaN(d)) f.zeit = d.toISOString();
    }else if(tv){
      const [h,m] = tv.split(":").map(Number);
      const d = f.zeit ? new Date(f.zeit) : new Date();
      d.setHours(h, m, 0, 0); f.zeit = d.toISOString();
    }
    f.von = $("#fs-von").value.trim();
    f.an = $("#fs-an").value.trim();
    f.text = $("#fs-text").value.trim();
    if(!f.text && !f.von){ $("#fs-von").focus(); return; }
    const idx = state.funk.findIndex(x => x.id === f.id);
    if(idx >= 0) state.funk[idx] = f; else state.funk.push(f);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Checklisten ---------------- */
/* Vorlagen – im Endausbau je Mandant in den Einstellungen pflegbar */
const CHECK_VORLAGEN = [
  { name:"Einsatzleiter – Erstmaßnahmen", punkte:[
    "Lage erkunden", "Rückmeldung an Leitstelle", "Einsatzstelle absichern",
    "Bereitstellungsraum festlegen", "Abschnitte bilden", "Atemschutzüberwachung sicherstellen",
    "Lagekarte anlegen", "Presse/Behörden informieren", "Lagebesprechung ansetzen" ] },
  { name:"MANV", punkte:[
    "MANV-Stufe festlegen", "Patientenablage einrichten", "ELRD / OrgL anfordern",
    "Sichtung veranlassen", "Transportorganisation aufbauen", "Betreuung anfordern" ] },
  { name:"Gefahrgut", punkte:[
    "Gefahr erkennen (Kennzeichnung)", "Absperrbereich 50/100 m", "Anfahrt mit Wind beachten",
    "GW-Gefahrgut anfordern", "Dekon-Platz einrichten", "Fachberater hinzuziehen" ] },
];
function renderListen(){
  const cards = state.checks.map(c => {
    const done = c.punkte.filter(p => p.done).length;
    return `
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 style="margin:0;flex:1">${esc(c.name)} · <span class="mono">${done}/${c.punkte.length}</span></h2>
        <button class="btn btn-danger-ghost" data-checkdel="${esc(c.id)}" style="min-height:40px;padding:6px 12px;font-size:.8rem">✕</button>
      </div>
      <div class="check-progress"><i style="width:${Math.round(done/c.punkte.length*100)}%"></i></div>
      ${c.punkte.map((p,idx) => `
      <button class="check-item ${p.done ? "done" : ""}" data-check="${esc(c.id)}:${idx}">
        <span class="check-box">✓</span>
        <span class="check-text">${esc(p.text)}</span>
        ${p.zeit ? `<span class="check-zeit mono">${fmtZeit(p.zeit)}</span>` : ""}
      </button>`).join("")}
    </div>`;
  }).join("");
  return `
  <div class="card">
    <h2>Checkliste starten</h2>
    <div class="addrow">
      <select id="checkVorlage">
        ${CHECK_VORLAGEN.map((v,idx) => `<option value="${idx}">${esc(v.name)} (${v.punkte.length} Punkte)</option>`).join("")}
      </select>
      <button class="btn btn-ghost" id="checkStart">Starten</button>
    </div>
    <p class="hint">Jeder Haken bekommt einen Zeitstempel – so ist später belegbar, wann was veranlasst wurde. Vorlagen werden im Endausbau je Organisation pflegbar sein.</p>
  </div>
  ${cards || `<div class="empty"><p>Noch keine Checkliste aktiv.</p></div>`}`;
}
function wireListen(){
  $("#checkStart").addEventListener("click", () => {
    const v = CHECK_VORLAGEN[Number($("#checkVorlage").value)];
    if(!v) return;
    state.checks.push({ id:uid(), name:v.name,
      punkte: v.punkte.map(text => ({ text, done:false, zeit:"" })) });
    markChange(); render();
  });
  document.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => {
    const [cid, idx] = b.dataset.check.split(":");
    const c = state.checks.find(x => x.id === cid);
    const p = c && c.punkte[Number(idx)];
    if(!p) return;
    p.done = !p.done;
    p.zeit = p.done ? new Date().toISOString() : "";
    markChange(); render();
  }));
  document.querySelectorAll("[data-checkdel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diese Checkliste wirklich entfernen?").then(ok => { if(!ok) return;
      state.checks = state.checks.filter(x => x.id !== b.dataset.checkdel);
      markChange(); render();
    });
  }));
}

/* ---------------- Ansicht: Atemschutz (Sammelstelle + Überwachung) ---------------- */
const AS_GERAETETYPEN = ["200/300 bar", "2×300 bar (Langzeit)"];
let editingTraeger = null, editingTrupp = null;

function asNextTruppNr(){
  // AST beginnt bei 10; jeder (auch wiederholte) Einsatz bekommt eine neue Nummer
  return state.asTrupps.reduce((m,t) => Math.max(m, t.nr||0), 9) + 1;
}
function asTraegerName(id){ const t = state.asTraeger.find(x => x.id === id); return t ? t.name : "?"; }
function asTruppOf(traegerId){
  return state.asTrupps.find(t => t.status !== "zurueck" && (t.memberIds||[]).includes(traegerId));
}
function asFreieTraeger(){ return state.asTraeger.filter(t => !asTruppOf(t.id)); }

function renderAtemschutz(){
  const seg = `
  <div class="seg" role="tablist">
    <button role="tab" data-assub="sammelstelle" class="${state.asSub==="sammelstelle"?"active":""}">Sammelstelle</button>
    <button role="tab" data-assub="ueberwachung" class="${state.asSub==="ueberwachung"?"active":""}">Überwachung (${state.asTrupps.filter(t=>t.status==="einsatz").length})</button>
  </div>`;
  return seg + (state.asSub === "ueberwachung" ? renderASUeberwachung() : renderASSammelstelle());
}

function asNrBadge(t, big){
  return `<span class="as-nr ${t.status} ${big?"big":""}">${t.nr}</span>`;
}
function truppCard(t){
  const mitglieder = (t.memberIds||[]).map(id => {
    const tr = state.asTraeger.find(x => x.id === id);
    if(!tr) return "?";
    const d = (t.druck||{})[id] || {};
    const dr = (d.start || d.end) ? ` <span class="as-druck">${d.start?esc(d.start):"–"}${d.end?"→"+esc(d.end):""} bar</span>` : "";
    return `${esc(tr.name)}${tr.geraetetyp?` <span class="as-typ">${esc(tr.geraetetyp)}</span>`:""}${dr}`;
  }).join("<br>");
  const zeile = [
    t.abschnitt ? `Abschnitt: <strong>${esc(t.abschnitt)}</strong>` : "",
    t.funkruf ? `Funk: <strong>${esc(t.funkruf)}</strong>` : "",
    t.ausgerueckt ? `ab ${fmtZeit(t.ausgerueckt)}` : "",
    t.rueckkehr ? `zurück ${fmtZeit(t.rueckkehr)}` : "",
  ].filter(Boolean).join(" · ");
  const aktionen = t.status === "registriert"
    ? `<button class="btn btn-primary" data-asein="${t.id}">Ausrücken</button>
       <button class="btn btn-ghost" data-astruppedit="${t.id}">Bearbeiten</button>
       <button class="btn btn-danger-ghost" data-astruppdel="${t.id}" aria-label="Trupp auflösen">✕</button>`
    : t.status === "einsatz"
    ? `<button class="btn btn-primary" data-aszurueck="${t.id}">Zurückgemeldet</button>
       <button class="btn btn-ghost" data-astruppedit="${t.id}">Bearbeiten</button>`
    : `<button class="btn btn-ghost" data-aswieder="${t.id}">Erneut einsetzen</button>
       <button class="btn btn-danger-ghost" data-astruppdel="${t.id}" aria-label="Löschen">✕</button>`;
  return `
  <div class="as-trupp status-${t.status}">
    <div class="as-trupp-head">
      ${asNrBadge(t)}
      <div style="flex:1;min-width:0">
        <div class="as-mit">${mitglieder || "<span style='color:var(--ink3)'>keine Mitglieder</span>"}</div>
        ${zeile ? `<div class="as-sub2">${zeile}</div>` : ""}
        ${t.zusatz ? `<div class="as-sub2">Zusatz: ${esc(t.zusatz)}</div>` : ""}
      </div>
    </div>
    <div class="as-actions">${aktionen}</div>
  </div>`;
}
function renderASSammelstelle(){
  const trupps = [...state.asTrupps].sort((a,b) =>
    ({registriert:0,einsatz:1,zurueck:2}[a.status]) - ({registriert:0,einsatz:1,zurueck:2}[b.status]) || (a.nr-b.nr));
  const frei = asFreieTraeger();
  const truppList = trupps.length ? trupps.map(truppCard).join("")
    : `<div class="empty"><p>Noch keine Trupps gebildet.<br>Träger registrieren, dann zu einem Trupp (2–3 Mann) zusammenführen.</p></div>`;
  const traegerList = state.asTraeger.length ? `<div class="as-traeger-list">${state.asTraeger.map(tr => {
    const trupp = asTruppOf(tr.id);
    return `
    <button class="as-traeger ${trupp?"gebunden":""}" data-astraegeredit="${tr.id}">
      <div style="flex:1;min-width:0">
        <div class="as-tr-name">${esc(tr.name) || "<span style='color:var(--ink3)'>ohne Name</span>"}</div>
        <div class="as-sub2">${esc(tr.feuerwehr||"")}${tr.geraetetyp?` · ${esc(tr.geraetetyp)}`:""}${tr.geraeteNr?` · Gerät ${esc(tr.geraeteNr)}`:""}${tr.maskeNr?` · Maske ${esc(tr.maskeNr)}`:""}${tr.zusatz?` · ${esc(tr.zusatz)}`:""}</div>
      </div>
      ${trupp ? `<span class="chip">Trupp ${trupp.nr}</span>` : `<span class="chip chip-POL">frei</span>`}
    </button>`;
  }).join("")}</div>` : `<p class="hint" style="margin:0">Noch keine Geräteträger registriert.</p>`;
  return `
  <div class="statstrip" role="status">
    <div class="stat"><div class="k">Träger</div><div class="v mono">${state.asTraeger.length}</div><div class="s">${frei.length} frei</div></div>
    <div class="stat"><div class="k">Trupps</div><div class="v mono">${state.asTrupps.length}</div><div class="s">gesamt</div></div>
    <div class="stat"><div class="k">Im Einsatz</div><div class="v mono">${state.asTrupps.filter(t=>t.status==="einsatz").length}</div><div class="s">unter PA</div></div>
  </div>
  <div class="card">
    <h2>Trupps</h2>
    <button class="btn btn-primary btn-block" id="btnTruppBilden" style="margin-bottom:14px" ${frei.length<2?"disabled":""}>＋&nbsp; Trupp bilden${frei.length<2?" (min. 2 freie Träger)":""}</button>
    ${truppList}
  </div>
  <div class="card">
    <h2>Geräteträger</h2>
    <button class="btn btn-ghost btn-block" id="btnTraegerReg" style="margin-bottom:14px">＋&nbsp; Träger registrieren</button>
    ${traegerList}
  </div>`;
}
function renderASUeberwachung(){
  const aktiv = state.asTrupps.filter(t => t.status === "einsatz").sort((a,b) => a.nr-b.nr);
  if(!aktiv.length) return `<div class="empty"><p>Kein Trupp im Einsatz.<br>Trupps unter PA erscheinen hier mit laufender Einsatzzeit.</p></div>`;
  const cards = aktiv.map(t => {
    const mit = (t.memberIds||[]).map(id => {
      const d = (t.druck||{})[id] || {};
      return esc(asTraegerName(id)) + (d.start ? ` <span class="as-druck">${esc(d.start)} bar</span>` : "");
    }).join("<br>");
    const typ = (t.memberIds||[]).map(id => (state.asTraeger.find(x=>x.id===id)||{}).geraetetyp).filter(Boolean)[0] || "";
    return `
    <div class="as-ueber">
      ${asNrBadge(t, true)}
      <div style="flex:1;min-width:0">
        <div class="as-mit">${mit}</div>
        <div class="as-sub2">${typ?esc(typ)+" · ":""}Abschnitt ${esc(t.abschnitt||"–")}${t.funkruf?` · Funk ${esc(t.funkruf)}`:""}</div>
      </div>
      <div class="as-timer"><span class="mono" data-as-elapsed="${esc(t.ausgerueckt||"")}">–</span>
        <button class="btn btn-primary" data-aszurueck="${t.id}" style="min-height:44px">Zurück</button></div>
    </div>`;
  }).join("");
  return `
  <p class="hint" style="margin:0 0 12px">Laufende Einsatzzeit seit Ausrücken. <strong>Ersetzt keine normgerechte Atemschutzüberwachung</strong> – dient der Übersicht an der Sammelstelle.</p>
  <div class="as-ueber-list">${cards}</div>`;
}
function asElapsedStr(iso){
  const d = iso ? new Date(iso) : null;
  if(!d || isNaN(d)) return "–";
  const s = Math.max(0, Math.floor((Date.now()-d.getTime())/1000));
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")} min`;
}
function asTick(){
  document.querySelectorAll("[data-as-elapsed]").forEach(el => {
    el.textContent = asElapsedStr(el.dataset.asElapsed);
    const min = el.dataset.asElapsed ? (Date.now()-new Date(el.dataset.asElapsed).getTime())/60000 : 0;
    el.classList.toggle("warn", min >= 20);   // Orientierungswarnung (kein Ersatz für echte Überwachung)
    el.classList.toggle("krit", min >= 30);
  });
}
setInterval(() => { if(state.view === "atemschutz" && state.asSub === "ueberwachung") asTick(); }, 1000);

function wireAtemschutz(){
  document.querySelectorAll("[data-assub]").forEach(b =>
    b.addEventListener("click", () => { state.asSub = b.dataset.assub; save(); render(); }));
  const reg = $("#btnTraegerReg"); if(reg) reg.addEventListener("click", () => openTraegerEditor(null));
  const bild = $("#btnTruppBilden"); if(bild) bild.addEventListener("click", () => openTruppEditor(null));
  document.querySelectorAll("[data-astraegeredit]").forEach(b =>
    b.addEventListener("click", () => openTraegerEditor(b.dataset.astraegeredit)));
  document.querySelectorAll("[data-astruppedit]").forEach(b =>
    b.addEventListener("click", () => openTruppEditor(b.dataset.astruppedit)));
  document.querySelectorAll("[data-asein]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.asein);
    if(t){ t.status = "einsatz"; t.ausgerueckt = new Date().toISOString(); markChange(); render(); }
  }));
  document.querySelectorAll("[data-aszurueck]").forEach(b =>
    b.addEventListener("click", () => openRueckmeldung(b.dataset.aszurueck)));
  document.querySelectorAll("[data-aswieder]").forEach(b => b.addEventListener("click", () => {
    const t = state.asTrupps.find(x => x.id === b.dataset.aswieder);
    if(!t) return;
    openTruppEditor(null, t.memberIds);   // neuer Trupp, neue Nummer, Mitglieder vorbelegt
  }));
  document.querySelectorAll("[data-astruppdel]").forEach(b => b.addEventListener("click", () => {
    modalConfirm("Diesen Trupp wirklich entfernen? Die Träger werden wieder frei.").then(ok => { if(!ok) return;
      state.asTrupps = state.asTrupps.filter(x => x.id !== b.dataset.astruppdel);
      markChange(); render();
    });
  }));
  if(state.asSub === "ueberwachung") asTick();
}

function openRueckmeldung(id){
  const t = state.asTrupps.find(x => x.id === id);
  if(!t) return;
  const jetzt = fmtZeit(new Date().toISOString());
  const rows = (t.memberIds||[]).map(mid => {
    const tr = state.asTraeger.find(x => x.id === mid) || {};
    const d = t.druck[mid] || {};
    return `<div class="as-druckrow">
      <span>${esc(tr.name||"?")}<br><small class="mono" style="color:var(--ink3)">Start ${d.start?esc(d.start)+" bar":"–"}</small></span>
      <input data-endd="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d.end||"")}" placeholder="Enddruck bar"></div>`;
  }).join("");
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Trupp zurückgemeldet">
    <div class="sheet-head"><h2>Trupp ${t.nr} zurückgemeldet</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field" style="max-width:170px"><label for="rm-zeit">Rückkehr-Uhrzeit</label>
        <input id="rm-zeit" type="time" class="mono" value="${jetzt}"></div>
      <div class="field"><label>Enddruck je Träger (bar)</label><div>${rows}</div></div>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" id="rm-save" style="flex:1">Rückmeldung speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  $("#rm-save").addEventListener("click", () => {
    document.querySelectorAll("[data-endd]").forEach(inp => {
      t.druck[inp.dataset.endd] = t.druck[inp.dataset.endd] || {};
      t.druck[inp.dataset.endd].end = inp.value.trim();
    });
    const tv = $("#rm-zeit").value;
    const d = new Date();
    if(tv){ const [h,m] = tv.split(":").map(Number); d.setHours(h,m,0,0); }
    t.status = "zurueck"; t.rueckkehr = d.toISOString();
    markChange(); closeEditor(); render();
  });
}
function openTraegerEditor(id){
  const neu = !id;
  const tr = id ? {...state.asTraeger.find(x => x.id === id)}
    : { id:uid(), name:"", feuerwehr:"", geraetetyp:AS_GERAETETYPEN[0], geraeteNr:"", maskeNr:"", zusatz:"" };
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${neu?"Träger registrieren":"Träger bearbeiten"}">
    <div class="sheet-head"><h2>${neu?"Geräteträger registrieren":"Geräteträger"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label for="tr-name">Name</label>
        <input id="tr-name" value="${esc(tr.name)}" placeholder="Nachname, Vorname" autocomplete="off"></div>
      <div class="field"><label for="tr-fw">Feuerwehr</label>
        <input id="tr-fw" value="${esc(tr.feuerwehr)}" list="tr-fw-list" placeholder="Name der Feuerwehr" autocomplete="off">
        <datalist id="tr-fw-list">${[...new Set(state.asTraeger.map(x=>x.feuerwehr).filter(Boolean))].map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div>
      <div class="field"><label>Gerätetyp</label>
        <div class="seg" style="max-width:none">
          ${AS_GERAETETYPEN.map(g => `<button type="button" data-tr-typ="${esc(g)}" class="${tr.geraetetyp===g?"active":""}">${esc(g)}</button>`).join("")}
        </div>
        <p class="hint">2×300 = Langzeitatmer (doppelte Einsatzzeit).</p></div>
      <div class="field"><label style="margin-bottom:8px">Gerät &amp; Maske</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:130px"><label for="tr-gnr" style="font-size:.72rem">Gerätenummer</label>
            <input id="tr-gnr" class="mono" value="${esc(tr.geraeteNr||"")}" placeholder="PA-Nr." autocomplete="off"></div>
          <div style="flex:1;min-width:130px"><label for="tr-mnr" style="font-size:.72rem">Maskennummer</label>
            <input id="tr-mnr" class="mono" value="${esc(tr.maskeNr||"")}" placeholder="Masken-Nr." autocomplete="off"></div>
        </div></div>
      <div class="field"><label for="tr-zusatz">Zusatz / Sonderausbildung <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="tr-zusatz" value="${esc(tr.zusatz)}" placeholder="z. B. Rettungstrupp, Absturzsicherung, Zusatzmaterial" autocomplete="off"></div>
    </div>
    <div class="sheet-foot">
      ${neu?"":`<button class="btn btn-danger-ghost" id="tr-del">Löschen</button>`}
      <button class="btn btn-primary" id="tr-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-tr-typ]").forEach(b => b.addEventListener("click", () => {
    tr.geraetetyp = b.dataset.trTyp;
    document.querySelectorAll("[data-tr-typ]").forEach(x => x.classList.toggle("active", x.dataset.trTyp===tr.geraetetyp));
  }));
  const del = $("#tr-del");
  if(del) del.addEventListener("click", () => {
    const trupp = asTruppOf(tr.id);
    if(trupp){ modalInfo(`Träger ist in Trupp ${trupp.nr} eingeteilt – erst dort entfernen.`); return; }
    state.asTraeger = state.asTraeger.filter(x => x.id !== tr.id);
    markChange(); closeEditor(); render();
  });
  $("#tr-save").addEventListener("click", () => {
    tr.name = $("#tr-name").value.trim();
    tr.feuerwehr = $("#tr-fw").value.trim();
    tr.geraeteNr = $("#tr-gnr").value.trim();
    tr.maskeNr = $("#tr-mnr").value.trim();
    tr.zusatz = $("#tr-zusatz").value.trim();
    if(!tr.name){ $("#tr-name").focus(); return; }
    const i = state.asTraeger.findIndex(x => x.id === tr.id);
    if(i>=0) state.asTraeger[i] = tr; else state.asTraeger.push(tr);
    markChange(); closeEditor(); render();
  });
}

function openTruppEditor(id, vorbelegt){
  const neu = !id;
  const src = id ? state.asTrupps.find(x => x.id === id) : null;
  const t = id ? {...src, memberIds:[...(src.memberIds||[])], druck: JSON.parse(JSON.stringify(src.druck||{}))}
    : { id:uid(), nr:asNextTruppNr(), memberIds:[...(vorbelegt||[])], abschnitt:"", funkruf:"", zusatz:"",
        status:"registriert", ausgerueckt:"", rueckkehr:"", druck:{} };
  // Auswählbare Träger: freie + die bereits in diesem Trupp
  const waehlbar = state.asTraeger.filter(tr => {
    const trupp = asTruppOf(tr.id);
    return !trupp || trupp.id === t.id || t.memberIds.includes(tr.id);
  });
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${neu?"Trupp bilden":"Trupp bearbeiten"}">
    <div class="sheet-head"><h2>Trupp ${t.nr}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button></div>
    <div class="sheet-body">
      <div class="field"><label>Mitglieder (2–3 Träger)</label>
        <div class="as-pick">
          ${waehlbar.length ? waehlbar.map(tr => `
            <button type="button" data-pick="${tr.id}" class="${t.memberIds.includes(tr.id)?"active":""}">
              <span>${esc(tr.name)}</span><small>${esc(tr.feuerwehr||"")}${tr.geraetetyp?` · ${esc(tr.geraetetyp)}`:""}</small>
            </button>`).join("") : `<p class="hint" style="margin:0">Keine freien Träger – erst welche registrieren.</p>`}
        </div>
        <p class="hint" id="tr-count">${t.memberIds.length} ausgewählt</p></div>
      <div class="field" id="tp-druck-feld"><label>Startdruck je Träger (bar)</label>
        <div id="tp-druck"></div></div>
      <div class="field"><label for="tp-ab">Einsatzabschnitt</label>
        <input id="tp-ab" value="${esc(t.abschnitt)}" list="tp-ab-list" placeholder="Abschnitt, der den Trupp angefordert hat" autocomplete="off">
        <datalist id="tp-ab-list">${state.abschnitte.map(a=>`<option value="${esc(a.name)}">`).join("")}</datalist></div>
      <div class="field"><label for="tp-funk">Funkruf Abschnitt</label>
        <input id="tp-funk" class="mono" value="${esc(t.funkruf)}" placeholder="Funkrufname des Abschnittsleiters" autocomplete="off"></div>
      <div class="field"><label for="tp-zusatz">Auftrag / Bemerkung <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="tp-zusatz" value="${esc(t.zusatz)}" placeholder="Einsatzauftrag" autocomplete="off"></div>
      ${!neu ? `<div class="field" style="display:flex;gap:10px;flex-wrap:wrap">
        <div style="width:150px"><label for="tp-aus">Ausgerückt</label><input id="tp-aus" type="time" class="mono" value="${fmtZeit(t.ausgerueckt)==="–"?"":fmtZeit(t.ausgerueckt)}"></div>
        <div style="width:150px"><label for="tp-ret">Zurück</label><input id="tp-ret" type="time" class="mono" value="${fmtZeit(t.rueckkehr)==="–"?"":fmtZeit(t.rueckkehr)}"></div>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary" id="tp-save" style="flex:1">${neu?"Trupp bilden":"Speichern"}</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const leseDruck = () => document.querySelectorAll("[data-druck]").forEach(inp => {
    t.druck[inp.dataset.druck] = t.druck[inp.dataset.druck] || {};
    t.druck[inp.dataset.druck].start = inp.value.trim();
  });
  const baueDruck = () => {
    $("#tp-druck-feld").style.display = t.memberIds.length ? "" : "none";
    $("#tp-druck").innerHTML = t.memberIds.map(mid => {
      const tr = state.asTraeger.find(x => x.id === mid) || {};
      const d = (t.druck[mid]||{}).start || "";
      return `<div class="as-druckrow">
        <span>${esc(tr.name||"?")}${tr.geraeteNr?` <small class="mono">(${esc(tr.geraeteNr)})</small>`:""}</span>
        <input data-druck="${esc(mid)}" class="mono" inputmode="numeric" value="${esc(d)}" placeholder="bar"></div>`;
    }).join("");
  };
  baueDruck();
  document.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => {
    leseDruck();  // aktuelle Eingaben sichern, bevor neu aufgebaut wird
    const pid = b.dataset.pick;
    if(t.memberIds.includes(pid)) t.memberIds = t.memberIds.filter(x => x !== pid);
    else if(t.memberIds.length < 3) t.memberIds.push(pid);
    document.querySelectorAll("[data-pick]").forEach(x => x.classList.toggle("active", t.memberIds.includes(x.dataset.pick)));
    $("#tr-count").textContent = `${t.memberIds.length} ausgewählt`;
    baueDruck();
  }));
  const setTime = (field, val) => {
    if(!val) return;
    const [h,m] = val.split(":").map(Number);
    const d = t[field] ? new Date(t[field]) : new Date();
    d.setHours(h,m,0,0); t[field] = d.toISOString();
  };
  $("#tp-save").addEventListener("click", () => {
    if(t.memberIds.length < 2){ modalInfo("Ein Trupp braucht mindestens 2 Träger."); return; }
    leseDruck();
    // Druck-Einträge auf aktuelle Mitglieder begrenzen
    Object.keys(t.druck).forEach(k => { if(!t.memberIds.includes(k)) delete t.druck[k]; });
    t.abschnitt = $("#tp-ab").value.trim();
    t.funkruf = $("#tp-funk").value.trim();
    t.zusatz = $("#tp-zusatz").value.trim();
    if($("#tp-aus")) setTime("ausgerueckt", $("#tp-aus").value);
    if($("#tp-ret")) setTime("rueckkehr", $("#tp-ret").value);
    const i = state.asTrupps.findIndex(x => x.id === t.id);
    if(i>=0) state.asTrupps[i] = t; else state.asTrupps.push(t);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Lagebesprechungen ---------------- */
let editingBespr = null; // { b, isNew }
function renderBespr(){
  const list = [...state.besprechungen].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""));
  const items = list.length ? `<div class="fs-list">${list.map(b => {
    const snap = b.snapshotId ? (state.lage.snapshots||[]).find(s => s.id === b.snapshotId) : null;
    return `
    <div class="fs-item" role="button" tabindex="0" style="cursor:pointer" data-editbespr="${esc(b.id)}">
      <div class="fs-head">
        <span class="fs-zeit mono">${istHeute(b.zeit) ? "" : fmtTagKurz(b.zeit) + " "}${fmtZeit(b.zeit)} Uhr</span>
        <span class="fs-route"><strong>Lagebesprechung</strong></span>
        ${b.teilnehmer ? `<span>· ${esc(b.teilnehmer)}</span>` : ""}
      </div>
      <div class="fs-text" style="white-space:pre-wrap">${esc(b.protokoll)}</div>
      ${snap ? `<button class="btn btn-ghost" data-viewsnap="${esc(snap.id)}" style="min-height:40px;padding:6px 12px;font-size:.8rem;margin-top:8px">Lagebild ${fmtZeit(snap.zeit)} Uhr ansehen</button>` : ""}
    </div>`;
  }).join("")}</div>`
  : `<div class="empty"><p>Noch keine Lagebesprechung protokolliert.<br>Beschlüsse, Aufträge und Lageeinschätzung je Besprechung festhalten – die Zeitpunkte bleiben als Historie erhalten.</p></div>`;
  return `
  <div class="card">
    <h2>Nächste Lagebesprechung</h2>
    <div class="form-grid">
      <div class="field" style="margin-bottom:0;max-width:200px"><label for="b-next">Uhrzeit</label>
        <input id="b-next" data-ez="lagebespr" type="time" class="mono" value="${esc(state.einsatz.lagebespr||"")}"></div>
    </div>
    <p class="hint">Wird auf dem Einsatzmonitor mit Countdown angezeigt.</p>
  </div>
  <button class="btn btn-primary btn-block" id="btnAddBespr" style="margin-bottom:16px">＋&nbsp; Lagebesprechung protokollieren</button>
  ${items}`;
}
function wireBespr(){
  $("#b-next").addEventListener("change", e => {
    state.einsatz.lagebespr = e.target.value;
    markChange(); renderHeader();
  });
  $("#btnAddBespr").addEventListener("click", () => openBesprEditor(null));
  document.querySelectorAll("[data-editbespr]").forEach(el =>
    el.addEventListener("click", e => {
      if(e.target.closest("[data-viewsnap]")) return; // Lagebild-Knopf nicht als Bearbeiten werten
      openBesprEditor(el.dataset.editbespr);
    }));
  document.querySelectorAll("[data-viewsnap]").forEach(b =>
    b.addEventListener("click", () => openLgSnapshot(b.dataset.viewsnap)));
}
function openBesprEditor(id){
  if(id){
    const b = state.besprechungen.find(x => x.id === id);
    if(!b) return;
    editingBespr = { b: {...b}, isNew:false };
  }else{
    editingBespr = { b: { id:uid(), zeit:new Date().toISOString(), teilnehmer:"", protokoll:"" }, isNew:true };
  }
  const b = editingBespr.b;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${editingBespr.isNew?"Lagebesprechung protokollieren":"Protokoll bearbeiten"}">
    <div class="sheet-head">
      <h2>${editingBespr.isNew ? "Lagebesprechung protokollieren" : "Protokoll bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div style="width:190px"><label for="b-datum">Datum</label>
            <input id="b-datum" type="date" class="mono" value="${fmtDateInput(b.zeit)}"></div>
          <div style="width:150px"><label for="b-zeit">Uhrzeit</label>
            <input id="b-zeit" type="time" class="mono" value="${fmtZeit(b.zeit)==="–"?"":fmtZeit(b.zeit)}"></div>
        </div>
      </div>
      <div class="field"><label for="b-teiln">Teilnehmer <span style="text-transform:none;font-weight:500">(optional)</span></label>
        <input id="b-teiln" value="${esc(b.teilnehmer||"")}" placeholder="z. B. EL, Abschnittsleiter 1+2, OrgL" autocomplete="off"></div>
      <div class="field"><label for="b-prot">Protokoll</label>
        <div style="display:flex;gap:8px;align-items:stretch">
          <textarea id="b-prot" style="flex:1;min-height:180px" placeholder="Lage, Beschlüsse, Aufträge, nächste Schritte …">${esc(b.protokoll)}</textarea>
          <button class="micbtn" id="b-mic" aria-label="Diktieren" title="Diktieren">
            <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
          </button>
        </div></div>
      <div class="field">
        <button class="btn btn-ghost btn-block" id="b-freeze">Lagekarte jetzt einfrieren</button>
        <p class="hint" id="b-freeze-info">${b.snapshotId ? "Lagebild ist mit dieser Besprechung verknüpft – ansehen über den Knopf in der Liste." : "Friert den aktuellen Kartenstand ein und verknüpft das Lagebild mit dieser Besprechung."}</p>
      </div>
    </div>
    <div class="sheet-foot">
      ${editingBespr.isNew ? "" : `<button class="btn btn-danger-ghost" id="b-del">Löschen</button>`}
      <button class="btn btn-primary" id="b-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  attachDictation($("#b-mic"), $("#b-prot"));
  $("#b-freeze").addEventListener("click", () => {
    const s = lgFreeze();
    b.snapshotId = s.id;
    $("#b-freeze-info").textContent = `Lagebild ${fmtZeit(s.zeit)} Uhr eingefroren und mit dieser Besprechung verknüpft.`;
  });
  const del = $("#b-del");
  if(del) del.addEventListener("click", () => {
    modalConfirm("Dieses Protokoll wirklich löschen?").then(ok => { if(!ok) return;
      state.besprechungen = state.besprechungen.filter(x => x.id !== b.id);
      markChange(); closeEditor(); render();
    });
  });
  $("#b-save").addEventListener("click", () => {
    const dv = $("#b-datum").value, tv = $("#b-zeit").value;
    if(dv && tv){
      const d = new Date(`${dv}T${tv}:00`);
      if(!isNaN(d)) b.zeit = d.toISOString();
    }
    b.teilnehmer = $("#b-teiln").value.trim();
    b.protokoll = $("#b-prot").value.trim();
    if(!b.protokoll){ $("#b-prot").focus(); return; }
    const idx = state.besprechungen.findIndex(x => x.id === b.id);
    if(idx >= 0) state.besprechungen[idx] = b; else state.besprechungen.push(b);
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Ansicht: Monitor ---------------- */
let monAbPage = 0;                 // aktuelle Abschnitts-Seite (3 Kacheln je Seite)
let monAbLast = Date.now();        // Zeitpunkt des letzten Seitenwechsels
let monAbPaused = false;           // Rotation per Play/Pause anhaltbar
function rotateAbschnitte(){
  if(monAbPaused) return;
  const pages = monAbPagesCount();
  if(pages <= 1){ monAbPage = 0; return; }
  if(Date.now() - monAbLast >= 30000){
    monAbLast = Date.now();
    monAbPage = (monAbPage + 1) % pages;
    render();
  }
}
function renderMonitor(){
  const e = state.einsatz;
  const act = aktive(), s = summen(act);
  const byOrg = Object.keys(ORGS).map(key => {
    const units = act.filter(u => u.org === key);
    return { key, ...ORGS[key], units, sum: summen(units) };
  }).filter(o => o.units.length);
  const maxG = Math.max(1, ...byOrg.map(o => o.sum.f+o.sum.u+o.sum.m));
  const orgRows = byOrg.map(o => {
    const g = o.sum.f+o.sum.u+o.sum.m;
    return `
    <div class="orgrow">
      <span class="chip chip-${o.key}">${o.short}</span>
      <div class="bar-wrap"><div class="bar" style="width:${Math.round(g/maxG*100)}%;background:var(${o.cssVar})"></div></div>
      <span class="num mono">${o.sum.f}/${o.sum.u}/${o.sum.m}/${g} <small>· ${o.units.length} Einh.</small></span>
    </div>`;
  }).join("") || `<p class="hint">Noch keine Kräfte an der Einsatzstelle.</p>`;

  const fkRows = state.fuehrung.map(f => `
    <div class="fkrow">
      <span class="chip chip-${esc(f.org)}">${esc((ORGS[f.org]||ORGS.SON).short)}</span>
      <span class="fk-n">${esc(f.name)}</span>
      <span class="fk-f">${esc(f.funktion)}${f.einheit?` · ${esc(f.einheit)}`:""}</span>
    </div>`).join("");

  const fsMonRows = [...state.funk].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||""))
    .slice(0, 6).map(f => `
    <div class="fsm">
      <div class="fsm-top">
        ${f.wichtig ? `<span class="imp-dot" title="Wichtig"></span>` : ""}
        <span class="z mono">${istHeute(f.zeit) ? "" : fmtTagKurz(f.zeit) + " "}${fmtZeit(f.zeit)}</span>
        <span>${esc(f.von)} → ${esc(f.an)}</span>
      </div>
      <div class="fsm-text">${esc(f.text)}</div>
    </div>`).join("");

  // Abschnitts-Kacheln: Stärke, Erreichbarkeit, Fahrzeuge ausgeschrieben & alphabetisch
  const abCard = (title, units, opts) => {
    const su = summen(units);
    const g = su.f+su.u+su.m;
    // Kacheln wachsen nach unten – bei Großlagen stehen viele Fahrzeuge im Abschnitt
    const sorted = [...units].sort((x,y) => fullName(x).localeCompare(fullName(y), "de"));
    const rows = sorted.map(u => `
      <tr>
        <td><span class="chip chip-${esc(u.org)}">${esc((ORGS[u.org]||ORGS.SON).short)}</span></td>
        <td class="name mono">${esc(fullName(u))}</td>
        <td class="num mono">${staerkeStr(u)}</td>
        <td class="num mono">${u.agt||"–"}</td>
      </tr>`).join("");
    const funk = [
      opts.tmo ? `<span class="funk-badge"><small>TMO</small>${esc(opts.tmo)}</span>` : "",
      opts.dmo ? `<span class="funk-badge"><small>DMO</small>${esc(opts.dmo)}</span>` : "",
    ].join("");
    return `
    <div class="ab-card ${opts.none ? "none" : ""} ${opts.br ? "br" : ""}">
      <div class="ab-head">
        <h4>${esc(title)}</h4>
        <div class="ab-staerke mono">${su.f}/${su.u}/${su.m}/${g}</div>
      </div>
      <div class="ab-sub">
        <span><strong class="mono">${units.length}</strong> Einheiten</span>
        <span>AGT <strong class="mono">${su.agt}</strong></span>
        ${opts.ansprechpartner ? `<span>Ansprechpartner <strong class="mono">${esc(opts.ansprechpartner)}</strong></span>` : ""}
      </div>
      ${funk ? `<div class="funkrow">${funk}</div>` : ""}
      ${rows ? `
      <div class="mon-tablewrap" style="margin-top:8px">
        <table class="mon-table ab-table">
          <thead><tr><th>Org.</th><th>Fahrzeug</th><th>Stärke</th><th>AGT</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>` : `<p class="hint" style="margin-top:12px">Keine Einheiten zugeordnet.</p>`}
    </div>`;
  };
  // Kachel-Daten sammeln (gefiltert um ausgeblendete); Rotation seitenweise
  const brUnits = act.filter(u => u.abschnitt === "BR");
  const cardsData = monCardsData();
  const AB_PER_PAGE = 3;
  const abPages = Math.max(1, Math.ceil(cardsData.length / AB_PER_PAGE));
  const specials = monSpecialPages();
  const totalPages = abPages + specials.length;
  if(monAbPage >= totalPages) monAbPage = 0;
  const specialKey = monAbPage >= abPages ? specials[monAbPage - abPages] : null;
  const isLagePage = specialKey === "karte";
  const isSkizzePage = specialKey === "skizze";
  const visible = specialKey ? [] : cardsData.slice(monAbPage*AB_PER_PAGE, monAbPage*AB_PER_PAGE + AB_PER_PAGE);
  const abCards = visible.map(c => abCard(c.title, c.units, c.opts)).join("");
  const pagerLabel = isLagePage ? "Lagekarte" : isSkizzePage ? "Funkskizze"
    : `${monAbPage*AB_PER_PAGE+1}–${Math.min((monAbPage+1)*AB_PER_PAGE, cardsData.length)} von ${cardsData.length}`;
  const abPager = totalPages > 1 ? `
    <div class="ab-pager" title="${monAbPaused ? "Rotation angehalten" : "Wechselt alle 30 Sekunden"}">
      <span>${pagerLabel}</span>
      ${Array.from({length:totalPages}, (_,i) => `<span class="dot ${i===monAbPage?"on":""}"></span>`).join("")}
      <span class="ab-cd mono" id="monAbCd">${monAbPaused ? "Pause" : ""}</span>
      ${specials.includes("karte") ? `
      <button class="ab-jump" id="monAbKarte" aria-label="${isLagePage ? "Zur Kräfteansicht" : "Zur Lagekarte"}">
        ${isLagePage
          ? `<svg viewBox="0 0 24 24"><path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>Kräfte`
          : `<svg viewBox="0 0 24 24"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14"/></svg>Karte`}
      </button>` : ""}
      <button class="ab-play" id="monAbPrev" aria-label="Vorherige Seite">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5z"/></svg>
      </button>
      <button class="ab-play" id="monAbNext" aria-label="Nächste Abschnitte">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5z"/></svg>
      </button>
      <button class="ab-play" id="monAbToggle" aria-label="${monAbPaused ? "Rotation fortsetzen" : "Rotation anhalten"}">
        ${monAbPaused
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`
          : `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>`}
      </button>
    </div>` : "";

  return `
  <div class="theme-dark">
    <div class="mon-toolbar">
      <button class="btn btn-ghost" id="btnMonHide" style="margin-right:8px">Kacheln ein-/ausblenden</button>
      <button class="btn btn-ghost" id="btnFull">Vollbild</button>
    </div>
    <div class="monitor">
      <div class="mon-head">
        <div>
          <div class="eyebrow"><span style="color:var(--accent)">ELW</span><span style="color:var(--ink)">IS</span> · ${esc(state.config.ugName)} · Kräfteübersicht</div>
          <h2>${esc(e.stichwort) || "Kein Einsatz angelegt"}</h2>
          <div class="ort">${esc(e.ort)}${e.leiter ? " · EL: " + esc(e.leiter) : ""}</div>
        </div>
        <div class="mon-clockbox">
          <div class="mon-clock mono" id="monClock">--:--</div>
          <div class="mon-dauer" id="monDauer"></div>
        </div>
      </div>
      <div class="kpis-compact">
        <div class="kpic accent"><span class="k">Gesamtstärke</span><span class="v mono">${s.f+s.u+s.m}</span><span class="s mono">${s.f}/${s.u}/${s.m}</span></div>
        <div class="kpic"><span class="k">AGT</span><span class="v mono">${s.agt}</span></div>
        <div class="kpic"><span class="k">Einheiten</span><span class="v mono">${act.length}</span><span class="s">${state.einheiten.length - act.length} abgerückt</span></div>
        <div class="kpic"><span class="k">Führungskräfte</span><span class="v mono">${state.fuehrung.length}</span></div>
        ${brUnits.length ? `<div class="kpic"><span class="k">Bereitstellung</span><span class="v mono">${brUnits.length}</span><span class="s">Einheiten</span></div>` : ""}
        ${state.anforderungen.some(a => a.status !== "eingetroffen") ? `<div class="kpic warn"><span class="k">Anrollend</span><span class="v mono">${state.anforderungen.filter(a => a.status !== "eingetroffen").length}</span><span class="s">nachgefordert</span></div>` : ""}
        ${e.lagebespr ? `<div class="kpic warn"><span class="k">Nächste Lagebesprechung</span><span class="v mono">${esc(e.lagebespr)}</span><span class="s" id="monLbRel"></span></div>` : ""}
      </div>
      ${isLagePage ? (() => {
        const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
        const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
        const legRows = [
          ...nums.map(i => `<div class="fkrow"><span class="lg-leg-num">${esc(i.num)}</span><span class="fk-n">${esc(i.text||"")}</span></div>`),
          ...cars.map(i => {
            const u = state.einheiten.find(x => x.id === i.unitId);
            const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
            return `<div class="fkrow"><span class="lg-car" style="color:${color};width:36px;height:28px">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></span><span class="fk-n">${u ? esc(fullName(u)) : "nicht zugeordnet"}</span></div>`;
          }),
        ].join("");
        return `
      <div class="mon-grid">
        <div class="panel" style="grid-column:1/-1;display:grid;grid-template-columns:2.6fr 1fr;gap:16px">
          <div>
            <div class="panel-head"><h3>Lagekarte</h3>
              <button class="ab-jump" id="monLgEdit" style="margin-left:10px">Karte bearbeiten</button>
              ${abPager}</div>
            ${state.lage.mode === "karte" ? `
            <div class="lg-wrap" style="display:grid;place-items:center;text-align:center;padding:30px;pointer-events:none">
              <p class="hint" style="margin:0">Online-Kartenmodus aktiv – Live-Karte über „Karte bearbeiten“.</p>
            </div>` : `
            <div class="lg-wrap" style="pointer-events:none;overflow:hidden">
              <div class="lg-canvas ${state.lage.bg ? "hasbg" : ""}" ${state.lage.bg ? `style="background-image:url('${state.lage.bg}')"` : ""}>
                ${lgShapesSvg(state.lage.items, null)}
                ${state.lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
              </div>
            </div>`}
          </div>
          <div><h3 style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin:0 0 10px">Legende</h3>
            ${legRows || `<p class="hint">Noch keine Symbole auf der Karte.</p>`}
          </div>
        </div>
      </div>`;
      })() : isSkizzePage ? `
      <div class="mon-grid" style="grid-template-columns:1fr">
        <div class="panel">
          <div class="panel-head"><h3>Funkskizze</h3>
            <button class="ab-jump" id="monSkEdit" style="margin-left:10px">Öffnen</button>
            ${abPager}</div>
          ${renderFunkskizze()}
        </div>
      </div>` : (() => {
        const hp = state.monHide.panels;
        const leftPanels = [
          !hp.org ? `<div class="panel"><h3>Stärke nach Organisation</h3>${orgRows}</div>` : "",
          !hp.fk ? `<div class="panel"><h3>Führungskräfte</h3>${fkRows || `<p class="hint">Noch keine erfasst.</p>`}</div>` : "",
          !hp.funk ? `<div class="panel"><h3>Letzte Funksprüche</h3>${fsMonRows || `<p class="hint">Noch keine erfasst.</p>`}</div>` : "",
          (!hp.checks && state.checks.length) ? `<div class="panel"><h3>Checklisten</h3>
            ${state.checks.map(c => {
              const done = c.punkte.filter(p => p.done).length;
              return `<div class="fkrow"><span class="fk-n">${esc(c.name)}</span><span class="fk-f mono">${done}/${c.punkte.length}</span></div>`;
            }).join("")}
          </div>` : "",
        ].join("");
        return `
      <div class="mon-grid" ${leftPanels ? "" : `style="grid-template-columns:1fr"`}>
        ${leftPanels ? `<div class="mon-col">${leftPanels}</div>` : ""}
        <div class="panel">
          <div class="panel-head"><h3>Einsatzabschnitte</h3>${abPager}</div>
          <div class="ab-grid">${abCards}</div>
        </div>
      </div>`;
      })()}
    </div>
  </div>`;
}
/* Kachel-Daten des Monitors – ausgeblendete Abschnitte fliegen auch aus der Rotation */
function monCardsData(){
  const act = aktive();
  const hid = state.monHide.ab;
  const cards = [];
  const brUnits = act.filter(u => u.abschnitt === "BR");
  if(state.abschnitte.length){
    state.abschnitte.forEach(a => { if(!hid[a.id]) cards.push({
      key:a.id, title:a.name, units:act.filter(u => u.abschnitt === a.id),
      opts:{ tmo:a.tmo, dmo:a.dmo, ansprechpartner:a.ansprechpartner } }); });
    const rest = act.filter(u => u.abschnitt !== "BR" &&
      (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
    if(rest.length && !hid.rest) cards.push({ key:"rest", title:"Ohne Abschnitt", units:rest, opts:{ none:true } });
  }else{
    cards.push({ key:"all", title:"Alle Einheiten an der Einsatzstelle",
      units:act.filter(u => u.abschnitt !== "BR"), opts:{ none:true } });
  }
  if(brUnits.length && !hid.BR) cards.push({ key:"BR", title:"Bereitstellungsraum", units:brUnits, opts:{ br:true } });
  return cards;
}
/* Sonderseiten des Monitors (Lagekarte, Funkskizze) – über den Kacheln-Dialog abschaltbar */
function monSpecialPages(){
  const hp = state.monHide.panels;
  const s = [];
  if(!hp.karte) s.push("karte");
  if(!hp.skizze) s.push("skizze");
  return s;
}
function monAbPagesCount(){
  return Math.max(1, Math.ceil(Math.max(1, monCardsData().length) / 3)) + monSpecialPages().length;
}
function openMonHideSheet(){
  const hp = state.monHide.panels, ha = state.monHide.ab;
  const row = (label, hidden, key) => `
    <button class="check-item ${hidden ? "" : "done"}" data-monhide="${esc(key)}">
      <span class="check-box">✓</span>
      <span class="check-text" style="text-decoration:none;color:${hidden ? "var(--ink3)" : "var(--ink)"}">${esc(label)}</span>
      <span class="check-zeit">${hidden ? "ausgeblendet" : "sichtbar"}</span>
    </button>`;
  const act = aktive();
  const hatBR = act.some(u => u.abschnitt === "BR");
  const hatRest = state.abschnitte.length > 0 && act.some(u => u.abschnitt !== "BR" &&
    (!u.abschnitt || !state.abschnitte.some(a => a.id === u.abschnitt)));
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Monitor-Kacheln">
    <div class="sheet-head">
      <h2>Monitor-Kacheln</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Info-Kacheln</label>
        ${row("Stärke nach Organisation", hp.org, "p:org")}
        ${row("Führungskräfte", hp.fk, "p:fk")}
        ${row("Letzte Funksprüche", hp.funk, "p:funk")}
        ${row("Checklisten", hp.checks, "p:checks")}
      </div>
      <div class="field"><label>Rotierende Seiten</label>
        ${row("Lagekarte", hp.karte, "p:karte")}
        ${row("Funkskizze", hp.skizze, "p:skizze")}
      </div>
      <div class="field"><label>Einsatzabschnitte</label>
        ${state.abschnitte.map(a => row(a.name, ha[a.id], "a:" + a.id)).join("")}
        ${hatBR ? row("Bereitstellungsraum", ha.BR, "a:BR") : ""}
        ${hatRest ? row("Ohne Abschnitt", ha.rest, "a:rest") : ""}
        ${!state.abschnitte.length && !hatBR ? `<p class="hint">Noch keine Abschnitte angelegt.</p>` : ""}
      </div>
      <p class="hint">Ausgeblendete Abschnitte laufen auch nicht in der Rotation mit. Die Einstellung gilt nur für die Anzeige – erfasst bleibt alles.</p>
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" data-close="1" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el =>
    el.addEventListener("click", () => { closeEditor(); render(); }));
  document.querySelectorAll("[data-monhide]").forEach(b => b.addEventListener("click", () => {
    const [typ, key] = b.dataset.monhide.split(":");
    if(typ === "p") state.monHide.panels[key] = !state.monHide.panels[key];
    else state.monHide.ab[key] = !state.monHide.ab[key];
    save();
    openMonHideSheet(); // Dialog mit neuem Stand neu aufbauen
  }));
}
function wireMonitor(){
  const hideBtn = $("#btnMonHide");
  if(hideBtn) hideBtn.addEventListener("click", openMonHideSheet);
  const abToggle = $("#monAbToggle");
  if(abToggle) abToggle.addEventListener("click", () => {
    monAbPaused = !monAbPaused;
    if(!monAbPaused) monAbLast = Date.now(); // frisch starten, nicht sofort springen
    render();
  });
  const step = dir => {
    const pages = monAbPagesCount();
    monAbPage = (monAbPage + dir + pages) % pages;
    monAbLast = Date.now(); // manueller Wechsel setzt die 30 s neu
    render();
  };
  const prev = $("#monAbPrev"), next = $("#monAbNext");
  if(prev) prev.addEventListener("click", () => step(-1));
  if(next) next.addEventListener("click", () => step(1));
  const jump = $("#monAbKarte");
  if(jump) jump.addEventListener("click", () => {
    const specials = monSpecialPages();
    const abPages = monAbPagesCount() - specials.length;
    const lagePage = abPages + specials.indexOf("karte");
    monAbPage = (monAbPage === lagePage) ? 0 : lagePage;
    monAbLast = Date.now();
    render();
  });
  const lgEdit = $("#monLgEdit");
  if(lgEdit) lgEdit.addEventListener("click", () => { state.view = "lagekarte"; save(); render(); });
  const skEdit = $("#monSkEdit");
  if(skEdit) skEdit.addEventListener("click", () => { state.view = "skizze"; save(); render(); });
  // Vollbild aufs ganze Dokument – überlebt so die Neuzeichnung bei der 30-s-Rotation
  $("#btnFull").addEventListener("click", () => {
    if(document.fullscreenElement) document.exitFullscreen();
    else{
      const rf = document.documentElement.requestFullscreen;
      if(rf) rf.call(document.documentElement).catch(() => {});
    }
  });
  tickClock();
}
function tickClock(){
  const c = $("#monClock");
  if(!c) return;
  c.textContent = new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const d = $("#monDauer");
  if(d && state.einsatz.beginn){
    d.innerHTML = `Einsatzdauer <strong class="mono">${dauerStr(state.einsatz.beginn)}</strong>`;
  }else if(d){ d.textContent = ""; }
  const lb = $("#monLbRel");
  if(lb && state.einsatz.lagebespr){
    const [h,m] = state.einsatz.lagebespr.split(":").map(Number);
    const t = new Date(); t.setHours(h, m, 0, 0);
    const diff = Math.round((t - Date.now())/60000);
    lb.textContent = diff >= 0 ? `in ${diff} min` : `vor ${-diff} min`;
  }
  const cd = $("#monAbCd");
  if(cd) cd.textContent = monAbPaused ? "Pause"
    : `${Math.max(0, Math.ceil((30000 - (Date.now() - monAbLast))/1000))} s`;
}
setInterval(() => { if(state.view === "monitor"){ tickClock(); rotateAbschnitte(); } }, 1000);

/* ---------------- Ansicht: Lagekarte ---------------- */
let lgTool = null;        // aktives Symbol-Werkzeug
let lgBig = false;        // Großansicht (Karte gemalt auf großem Gerät)
let lgZoom = 1;           // Zoomstufe 1–4, Verschieben per Wischgeste (Scroll)
let lgDraw = null;        // laufende Linien-/Flächen-Zeichnung {type, points}
const LG_CAR_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M2.5 15V9.5A1.5 1.5 0 0 1 4 8h9.5v7"/><path d="M13.5 9.5H18l3.5 3.5v2h-8"/>
  <circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M8.5 17h6.5M2.5 15v2h2"/>
</svg>`;
const LG_TOOLS = [
  { t:"num",     n:"Marker 1·2·3",    preview:'<span class="lg-num">1</span>' },
  { t:"car",     n:"Fahrzeug",        preview:`<span class="lg-car" style="color:var(--fw)">${LG_CAR_SVG}</span>` },
  { t:"el",      n:"Einsatzleitung",  preview:'<span class="lg-rect" style="--oc:var(--warn)">EL</span>' },
  { t:"brand",   n:"Brandstelle",     preview:lgFlameSvg() },
  { t:"gefahr",  n:"Gefahr",          preview:'<span class="lg-tri">!</span>' },
  { t:"wasser",  n:"Wasserentnahme",  preview:'<span class="lg-circle">W</span>' },
  { t:"text",    n:"Text",            preview:'<span class="lg-text">Abc</span>' },
  { t:"line",    n:"Linie",           preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><polyline points="4,24 16,10 26,18 36,6" style="fill:none;stroke:var(--thw);stroke-width:3;stroke-linecap:round;stroke-linejoin:round"/></svg>' },
  { t:"area",    n:"Fläche",          preview:'<svg viewBox="0 0 40 30" style="width:38px;height:28px"><polygon points="5,25 12,6 33,8 36,22 20,27" style="fill:var(--brk);fill-opacity:.3;stroke:var(--brk);stroke-width:2.5;stroke-linejoin:round"/></svg>' },
  { t:"symsearch", n:"Taktische Zeichen", preview:'<svg viewBox="0 0 24 24" style="width:30px;height:30px;stroke:var(--ink2);fill:none;stroke-width:2;stroke-linecap:round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>' },
];
const LG_SHAPE_COLORS = ["fw","thw","brk","pol"];

/* Taktische Zeichen nach DV 102 (vereinfachte Darstellung) – Brandstufen als 1–3 Flammen */
function symFlames(n){
  const fl = `<svg viewBox="0 0 24 24" style="width:13px;height:17px;fill:currentColor;stroke:none">
    <path d="M12 2c1.2 3.6-3.8 6-3.8 10.4a3.8 3.8 0 0 0 7.6 0c0-1.5-.8-2.6-.8-2.6s3.4 1.4 3.4 5A6.4 6.4 0 0 1 5.6 15C5.6 8.4 10.8 7.2 12 2z"/></svg>`;
  return fl.repeat(n);
}
const SYM_KATALOG = [
  { key:"brand1",   name:"Kleinbrand / Entstehungsbrand", color:"var(--fw)",  flames:1 },
  { key:"brand2",   name:"Mittelbrand / fortgeschrittener Brand", color:"var(--fw)", flames:2 },
  { key:"brand3",   name:"Großbrand / Vollbrand",         color:"var(--fw)",  flames:3 },
  { key:"expl",     name:"Explosionsgefahr",              color:"var(--fw)",  kurz:"EXPL" },
  { key:"gefstoff", name:"Gefährliche Stoffe / Gefahrgut",color:"var(--brk)", kurz:"GG" },
  { key:"strom",    name:"Gefahr durch Elektrizität",     color:"var(--brk)", kurz:"⚡" },
  { key:"einsturz", name:"Einsturzgefahr / Gebäudeschaden",color:"var(--fw)", kurz:"EINST" },
  { key:"wasser2",  name:"Überschwemmung / Hochwasser",   color:"var(--thw)", kurz:"≈≈" },
  { key:"hydrant",  name:"Hydrant (Unterflur)",           color:"var(--thw)", kurz:"H", circle:true },
  { key:"hydrantO", name:"Hydrant (Überflur)",            color:"var(--thw)", kurz:"ÜH", circle:true },
  { key:"gewaesser",name:"Offenes Gewässer (Entnahme)",   color:"var(--thw)", kurz:"OG" },
  { key:"zisterne", name:"Löschwasserbehälter / Zisterne",color:"var(--thw)", kurz:"Z", circle:true },
  { key:"bhp",      name:"Behandlungsplatz",              color:"var(--fw)",  kurz:"BHP" },
  { key:"vablage",  name:"Verletztenablage",              color:"var(--fw)",  kurz:"V-ABL" },
  { key:"sammel",   name:"Sammelplatz Betroffene",        color:"var(--pol)", kurz:"SP" },
  { key:"vermisst", name:"Person vermisst / verschüttet", color:"var(--son)", kurz:"?" , circle:true },
  { key:"hlp",      name:"Hubschrauberlandeplatz",        color:"var(--thw)", kurz:"HLP" },
  { key:"dekon",    name:"Dekon-Platz",                   color:"var(--brk)", kurz:"DEK" },
];
function symTile(s, small){
  const inner = s.flames ? symFlames(s.flames) : esc(s.kurz);
  return `<span class="lg-sym ${s.circle ? "circle" : ""}" style="--sc:${s.color};${small ? "transform:scale(.85)" : ""}">${inner}</span>`;
}
function lgShapesSvg(items, draw){
  items = items.filter(i => i.type === "line" || i.type === "area");
  const shape = i => {
    if(!Array.isArray(i.points)) return "";   // Geo-Flächen (Kartenmodus) hier überspringen
    const pts = i.points.map(p => `${p.x},${p.y}`).join(" ");
    const col = `var(--${LG_SHAPE_COLORS.includes(i.color) ? i.color : "fw"})`;
    return i.type === "area"
      ? `<polygon data-shape="${esc(i.id)}" points="${pts}" style="fill:${col};fill-opacity:.22;stroke:${col}"></polygon>`
      : `<polyline data-shape="${esc(i.id)}" points="${pts}" style="stroke:${col}"></polyline>`;
  };
  let tmp = "";
  if(draw && draw.points.length){
    const pts = draw.points.map(p => `${p.x},${p.y}`).join(" ");
    tmp = `<${draw.type === "area" ? "polygon" : "polyline"} class="tmp" points="${pts}"></${draw.type === "area" ? "polygon" : "polyline"}>`
      + draw.points.map(p => `<circle class="tmp-dot" cx="${p.x}" cy="${p.y}" r="1.1"></circle>`).join("");
  }
  const svg = `<svg class="lg-shapes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    ${items.filter(i => i.type === "line" || i.type === "area").map(shape).join("")}${tmp}
  </svg>`;
  // Beschriftung verknüpfter Abschnittsflächen (HTML-Overlay, damit Text nicht verzerrt)
  const labels = items.filter(i => i.type === "area" && i.abschnittId && Array.isArray(i.points)).map(i => {
    const a = state.abschnitte.find(x => x.id === i.abschnittId);
    if(!a) return "";
    const cx = i.points.reduce((s,p) => s + p.x, 0) / i.points.length;
    const cy = i.points.reduce((s,p) => s + p.y, 0) / i.points.length;
    return `<span class="lg-arealbl" style="left:${cx}%;top:${cy}%">${esc(a.name)}</span>`;
  }).join("");
  return svg + labels;
}
const LG_ORG_OF = { fw:"--fw", thw:"--thw", brk:"--brk", pol:"--pol" };
function lgFlameSvg(){
  return `<span class="lg-flame"><svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2c1.2 3.6-3.8 6-3.8 10.4a3.8 3.8 0 0 0 7.6 0c0-1.5-.8-2.6-.8-2.6s3.4 1.4 3.4 5A6.4 6.4 0 0 1 5.6 15C5.6 8.4 10.8 7.2 12 2z"/>
  </svg></span>`;
}
function lgDefaultLabel(t){
  return { el:"Einsatzleitung", brand:"Brand", gefahr:"Gefahr", wasser:"Wasser",
    patient:"V-Ablage", text:"Text", fw:"", thw:"", brk:"", pol:"" }[t] ?? "";
}
/* Symbol + Beschriftung eines Markers (ohne Positionierung) – für Prozent-Canvas UND Leaflet-DivIcon */
function lgMarkerInner(i){
  let sym, lbl = "";
  if(i.type === "car"){
    const u = state.einheiten.find(x => x.id === i.unitId);
    const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
    const kurz = u ? (u.kennung || u.name) : "";
    sym = `<span class="lg-car" style="color:${color}">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></span>`;
    if(kurz) lbl = `<span class="lg-lbl">${esc(kurz)}</span>`;
    return sym + lbl;
  }
  if(i.type === "unit"){
    sym = `<span class="lg-rect" style="--oc:var(${(ORGS[i.org]||ORGS.SON).cssVar})">${esc(i.kurz || "?")}</span>`;
  }else if(LG_ORG_OF[i.type]){
    sym = `<span class="lg-rect" style="--oc:var(${LG_ORG_OF[i.type]})">${esc(i.type.toUpperCase())}</span>`;
  }else if(i.type === "el"){
    sym = `<span class="lg-rect" style="--oc:var(--warn)">EL</span>`;
  }else if(i.type === "brand"){ sym = lgFlameSvg(); }
  else if(i.type === "gefahr"){ sym = `<span class="lg-tri">!</span>`; }
  else if(i.type === "wasser"){ sym = `<span class="lg-circle">W</span>`; }
  else if(i.type === "patient"){ sym = `<span class="lg-cross">+</span>`; }
  else if(i.type === "num"){ sym = `<span class="lg-num">${esc(i.num)}</span>`; }
  else if(i.type === "sym"){
    const s = SYM_KATALOG.find(x => x.key === i.sym);
    sym = s ? symTile(s) : `<span class="lg-text">?</span>`;
  }
  else { sym = `<span class="lg-text">${esc(i.label || "Text")}</span>`; }
  // Nummern-Marker bewusst ohne Beschriftung auf der Karte – Text steht in der Legende
  if(i.type !== "text" && i.type !== "num" && i.label) lbl = `<span class="lg-lbl">${esc(i.label)}</span>`;
  return sym + lbl;
}
function lgMarkerHtml(i){
  return `<div class="lg-item" data-id="${esc(i.id)}" style="left:${i.x}%;top:${i.y}%">${lgMarkerInner(i)}</div>`;
}
function lgCarOptions(currentUnitId){
  const usedIds = new Set(state.lage.items
    .filter(i => i.type === "car" && i.unitId && i.unitId !== currentUnitId)
    .map(i => i.unitId));
  const opts = aktive().filter(u => !usedIds.has(u.id))
    .sort((a,b) => fullName(a).localeCompare(fullName(b), "de"))
    .map(u => `<option value="${esc(u.id)}" ${u.id===currentUnitId?"selected":""}>${esc(fullName(u))}</option>`)
    .join("");
  return `<option value="" ${!currentUnitId?"selected":""}>– Fahrzeug wählen –</option>${opts}`;
}
function renderLagekarte(){
  const tools = LG_TOOLS.map(t => `
    <button class="lg-tool" data-lgtool="${t.t}" aria-pressed="${lgTool===t.t}">
      ${t.preview}<span>${t.n}</span>
    </button>`).join("");
  let statusText = "", drawButtons = "";
  if(lgDraw){
    const need = lgDraw.type === "area" ? 3 : 2;
    statusText = `${lgDraw.type === "area" ? "Fläche" : "Linie"}: Punkte antippen (${lgDraw.points.length} gesetzt${lgDraw.points.length < need ? `, mind. ${need}` : ""})`;
    drawButtons = lgDraw.points.length >= need ? `<button id="lgDrawDone" style="margin-right:14px">Fertig</button>` : "";
  }else if(lgTool && lgTool.startsWith("sym:")){
    const s = SYM_KATALOG.find(x => x.key === lgTool.slice(4));
    statusText = s ? `Auf die Karte tippen, um „${s.name}“ zu platzieren` : "";
  }else if(lgTool){
    const t = LG_TOOLS.find(x => x.t === lgTool);
    statusText = (lgTool === "line" || lgTool === "area")
      ? `${t.n}: Punkte nacheinander auf die Karte tippen`
      : `Auf die Karte tippen, um „${t.n}“ zu platzieren`;
  }
  const nums = state.lage.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  const cars = state.lage.items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
  const carRows = cars.map(i => {
    const u = state.einheiten.find(x => x.id === i.unitId);
    const color = u ? `var(${(ORGS[u.org]||ORGS.SON).cssVar})` : "var(--ink3)";
    return `
    <div class="lg-leg-car">
      <span class="lg-car" style="color:${color}">${LG_CAR_SVG}<b class="car-num">${esc(i.num||"?")}</b></span>
      <select data-lgcar="${esc(i.id)}" aria-label="Fahrzeug ${esc(i.num||"")} zuordnen">${lgCarOptions(i.unitId)}</select>
    </div>`;
  }).join("");
  const legend = `
    <div class="lg-legend">
      <h3>Legende</h3>
      <div class="lg-leg-cols">
      ${nums.length ? nums.map(i => `
        <button class="lg-leg-item" data-lgedit="${esc(i.id)}">
          <span class="lg-leg-num">${esc(i.num)}</span>
          <span class="lg-leg-text">${i.text ? esc(i.text) : `<span class="ph">Beschreibung antippen …</span>`}</span>
        </button>`).join("")
      : `<p class="hint" style="margin:0">Noch keine Marker gesetzt.<br>Werkzeug „Marker 1·2·3“ wählen und auf die Karte tippen – die Beschreibung (z. B. „Faltbehälter 10.000 Liter“) steht dann hier, damit die Karte selbst übersichtlich bleibt.</p>`}
      </div>
      ${cars.length ? `
      <h3 style="margin-top:16px">Fahrzeuge</h3>
      ${carRows}
      <p class="hint">Auto auf der Karte platzieren, hier das Fahrzeug aus den erfassten Einheiten zuordnen – Symbol färbt sich nach Organisation.</p>` : ""}
    </div>`;
  return `
  <div class="card">
    <h2>Lagekarte – taktische Skizze</h2>
    <div class="lg-headrow">
      <div class="lg-zoom" role="group" aria-label="Zoom">
        <button id="lgZoomOut" aria-label="Herauszoomen">−</button>
        <span class="z-val mono">${Math.round(lgZoom*100)} %</span>
        <button id="lgZoomIn" aria-label="Hineinzoomen">＋</button>
      </div>
      <button class="btn btn-ghost" id="lgSnapBtn" style="margin-right:8px">Snapshot einfrieren</button>
      <button class="btn btn-ghost" id="lgBigBtn" style="margin-right:8px">${lgBig ? "Großansicht beenden" : "Großansicht / Vollbild"}</button>
      <button class="btn btn-primary" id="lgToMonitor">Zum Monitor</button>
    </div>
    <div class="lg-modes">
      <div class="seg" role="tablist" style="max-width:420px;margin:0">
        <button role="tab" data-lgmode="raster" class="${state.lage.mode==="raster"?"active":""}">Raster</button>
        <button role="tab" data-lgmode="bild" class="${state.lage.mode==="bild"?"active":""}">Bild</button>
        <button role="tab" data-lgmode="karte" class="${state.lage.mode==="karte"?"active":""}">Karte (online)</button>
      </div>
      ${state.lage.mode === "karte" ? `
      <div class="lg-layerpick" role="group" aria-label="Kartengrundlage">
        <button data-lglayer="luftbild" class="${state.lage.mapLayer==="luftbild"?"active":""}">Luftbild</button>
        <button data-lglayer="basis" class="${state.lage.mapLayer==="basis"?"active":""}">Bayern-Karte</button>
        <button data-lglayer="strasse" class="${state.lage.mapLayer==="strasse"?"active":""}">Straße</button>
      </div>` : ""}
    </div>
    <div class="lg-toolbar">${tools}</div>
    ${statusText ? `<div class="lg-status">${esc(statusText)}<span style="margin-left:auto">${drawButtons}</span><button id="lgCancel">Abbrechen</button></div>` : ""}
    ${state.lage.mode === "karte" ? `
    <div class="lg-layout ${lgBig ? "big" : ""}">
      <div class="lg-wrap" id="lgWrap" style="overflow:hidden">
        <div id="lgMap"></div>
      </div>
      ${legend}
    </div>` : `
    <div class="lg-layout ${lgBig ? "big" : ""}">
      <div class="lg-wrap" id="lgWrap">
        <div class="lg-canvas ${(state.lage.mode==="bild" && state.lage.bg) ? "hasbg" : ""}" id="lgCanvas"
          style="width:${lgZoom*100}%;height:${lgZoom*100}%;${(state.lage.mode==="bild" && state.lage.bg) ? `background-image:url('${state.lage.bg}')` : ""}">
          ${lgShapesSvg(state.lage.items, lgDraw)}
          ${state.lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
        </div>
      </div>
      ${legend}
    </div>`}
    <p class="hint">Symbol wählen und auf die Karte tippen · Symbole mit dem Finger verschieben · Antippen zum Beschriften oder Löschen · Nummern-Marker halten die Karte frei, der Text steht in der Legende.</p>
    <div class="lg-bgrow">
      <button class="btn btn-ghost" id="lgBgBtn">Foto / Lageplan als Hintergrund</button>
      <button class="btn btn-ghost" id="lgBgPaste" title="z. B. Screenshot aus dem BayernAtlas – auch mit Strg+V">Aus Zwischenablage einfügen</button>
      ${state.lage.bg ? `<button class="btn btn-ghost" id="lgBgDel">Hintergrund entfernen</button>` : ""}
      ${state.lage.items.length ? `<button class="btn btn-danger-ghost" id="lgClear">Karte leeren</button>` : ""}
      <input type="file" id="lgBgFile" accept="image/*" style="display:none">
    </div>
  </div>
  ${(state.lage.snapshots||[]).length ? `
  <div class="card">
    <h2>Lagebilder (eingefrorene Stände)</h2>
    ${[...state.lage.snapshots].sort((a,b) => (b.zeit||"").localeCompare(a.zeit||"")).map(s => `
    <div class="arch">
      <div class="a-main">
        <div class="a-t">Lagebild ${fmtZeit(s.zeit)} Uhr</div>
        <div class="a-s">${fmtDatum(s.zeit)} · ${s.items.length} Symbole</div>
      </div>
      <button class="btn btn-ghost" data-lgsnap="${esc(s.id)}">Ansehen</button>
      <button class="btn btn-danger-ghost" data-lgsnapdel="${esc(s.id)}" aria-label="Lagebild löschen">✕</button>
    </div>`).join("")}
    <p class="hint">Ein Snapshot friert den aktuellen Kartenstand ein – die Lagekarte entwickelt sich danach normal weiter (z. B. für die Dokumentation je Lagebesprechung).</p>
  </div>` : ""}
  `;
}
function setLgBg(data){
  state.lage.bg = data;
  state.lage.mode = "bild";
  try{ markChange(); }catch(err){ modalInfo("Bild zu groß für den lokalen Speicher."); state.lage.bg = ""; }
  render();
}
/* Strg+V / Cmd+V auf der Lagekarte: Bild aus der Zwischenablage als Hintergrund */
document.addEventListener("paste", e => {
  if(state.view !== "lagekarte") return;
  const t = e.target;
  if(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return; // Textfelder nicht kapern
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
  if(!item) return;
  const file = item.getAsFile();
  if(file){
    e.preventDefault();
    resizeImage(file, 1920, data => setLgBg(data));
  }
});
function lgFreeze(){
  const s = { id:uid(), zeit:new Date().toISOString(),
    bg: state.lage.bg, items: state.lage.items.map(i => ({...i})) };
  state.lage.snapshots.push(s);
  markChange();
  return s;
}
/* ---------------- Ansicht: Funkskizze (Kommunikationsskizze) ---------------- */
function renderSkizzeView(){
  return `
  <div class="card">
    <h2>Funkskizze / Kommunikationsskizze</h2>
    ${renderFunkskizze()}
    <p class="hint">Wird automatisch aus den Einsatzabschnitten und deren TMO-/DMO-Rufgruppen erzeugt
    (Abschnitte pflegen im Tab „Einsatz“). Leitstelle und Betriebsgruppe stehen in den Einstellungen (Zahnrad).</p>
  </div>`;
}
/* Kommunikationsskizze: ILS → Einsatzleitung → Abschnitte, Rufgruppen an den Linien */
function renderFunkskizze(){
  const c = state.config;
  const act = aktive();
  const elBox = `
    <div class="fkbox el">
      <strong>Einsatzleitung</strong>
      <small>${esc(c.ugName)} · ELW${state.einsatz.leiter ? " · EL: " + esc(state.einsatz.leiter) : ""}</small>
    </div>`;
  const ilsTeil = `
    <div class="fkbox ils"><strong>${esc(c.ilsName || "Leitstelle")}</strong><small>Leitstelle</small></div>
    <div class="fk-vline"><span class="fk-grp">TMO ${esc(c.ilsGruppe || "—")}</span></div>`;
  if(!state.abschnitte.length){
    return `<div class="fk-skizze">${ilsTeil}${elBox}</div>
      <p class="hint" style="text-align:center">Noch keine Einsatzabschnitte angelegt – die Skizze wächst automatisch mit (Tab „Einsatz“).</p>`;
  }
  const n = state.abschnitte.length;
  const branches = state.abschnitte.map(a => {
    const units = act.filter(u => u.abschnitt === a.id);
    return `
    <div class="fk-branch">
      <div class="fk-vline"><span class="fk-grp">${a.tmo ? "TMO " + esc(a.tmo) : "—"}</span></div>
      <div class="fkbox">
        <strong>${esc(a.name)}</strong>
        ${a.ansprechpartner ? `<small class="mono">${esc(a.ansprechpartner)}</small>` : ""}
        <small>${units.length} Einheit${units.length===1?"":"en"}</small>
        <div class="fk-badges">
          ${a.dmo ? `<span class="funk-badge"><small>DMO</small>${esc(a.dmo)}</span>` : `<span class="hint" style="margin:0">keine DMO-Gruppe</span>`}
        </div>
      </div>
    </div>`;
  }).join("");
  return `
  <div class="fk-skizze">
    ${ilsTeil}
    ${elBox}
    ${n > 1 ? `<div class="fk-vline" style="height:22px"></div>
    <div class="fk-hline" style="width:calc(100% - 100%/${n} - 14px)"></div>` : ""}
    <div class="fk-hwrap">${branches}</div>
  </div>`;
}
/* ==================== Lagekarte: Online-Karten-Modus (Leaflet) ==================== */
let lgMapObj = null, lgMapLayer = null;
function lgMapTeardown(){
  if(lgMapObj){ try{ lgMapObj.remove(); }catch(e){} }
  lgMapObj = null; lgMapLayer = null;
}
function lgAccentHex(name){
  const v = getComputedStyle(document.documentElement).getPropertyValue("--" + (LG_SHAPE_COLORS.includes(name)?name:"fw")).trim();
  return v || "#C4232B";
}
function lgMapSetup(){
  const el = document.getElementById("lgMap");
  if(!el || typeof L === "undefined") return;
  lgMapTeardown();
  const v = state.lage.mapView || { center:[49.6767, 12.1625], zoom:14 };
  lgMapObj = L.map(el, { zoomControl:true }).setView(v.center, v.zoom);

  // Wählbare Kartengrundlagen (alle OpenData)
  const bayVV = "Bayerische Vermessungsverwaltung – geodaten.bayern.de";
  const bases = {
    luftbild: { name:"Luftbild (Bayern)", layer: L.tileLayer.wms(
      "https://geoservices.bayern.de/od/wms/dop/v1/dop40",
      { layers:"by_dop40c", format:"image/png", version:"1.3.0", maxZoom:20, attribution:"Luftbild: " + bayVV }) },
    basis: { name:"Bayern-Karte", layer: L.tileLayer(
      "https://wmtsod{s}.bayernwolke.de/wmts/by_webkarte/smerc/{z}/{x}/{y}",
      { subdomains:["1","2","3","4","5","6","7"], maxZoom:20, attribution:bayVV }) },
    strasse: { name:"Straßenkarte", layer: L.tileLayer(
      "https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web/default/WEBMERCATOR/{z}/{y}/{x}.png",
      { maxZoom:18, attribution:"© Bundesamt für Kartographie und Geodäsie (TopPlusOpen)" }) },
  };
  const cur = bases[state.lage.mapLayer] ? state.lage.mapLayer : "luftbild";
  bases[cur].layer.addTo(lgMapObj);   // Umschaltung über die kleine App-Auswahl oben (nicht über eine Karten-Steuerung)

  lgMapLayer = L.layerGroup().addTo(lgMapObj);
  lgMapObj.on("moveend zoomend", () => {
    if(!lgMapObj) return;
    const c = lgMapObj.getCenter();
    state.lage.mapView = { center:[c.lat, c.lng], zoom: lgMapObj.getZoom() };
    save();
  });
  lgMapObj.on("click", e => lgMapClick(e.latlng));
  setTimeout(() => { if(lgMapObj) lgMapObj.invalidateSize(); }, 60);
  lgMapRenderLayers();
}
function lgDivIcon(inner){
  return L.divIcon({ html:`<div class="lg-mk">${inner}</div>`, className:"lg-divicon", iconSize:[0,0] });
}
function lgMapRenderLayers(){
  if(!lgMapLayer) return;
  lgMapLayer.clearLayers();
  // Linien & Flächen (Geo)
  for(const i of state.lage.items){
    if((i.type === "line" || i.type === "area") && Array.isArray(i.llpoints)){
      const col = lgAccentHex(i.color);
      const ll = i.llpoints.map(p => [p.lat, p.lng]);
      const shp = i.type === "area"
        ? L.polygon(ll, { color:col, weight:3.5, fillOpacity:0.22 })
        : L.polyline(ll, { color:col, weight:3.5 });
      shp.on("click", ev => { L.DomEvent.stop(ev); openLgShapeEdit(i.id); });
      shp.addTo(lgMapLayer);
      if(i.type === "area" && i.abschnittId){
        const a = state.abschnitte.find(x => x.id === i.abschnittId);
        if(a) L.marker(shp.getBounds().getCenter(),
          { interactive:false, icon: lgDivIcon(`<span class="lg-arealbl" style="position:static;transform:none">${esc(a.name)}</span>`) }).addTo(lgMapLayer);
      }
    }
  }
  // Marker (Geo)
  for(const i of state.lage.items){
    if(!i.ll) continue;
    const m = L.marker(i.ll, { draggable:true, icon: lgDivIcon(lgMarkerInner(i)) });
    m.on("click", () => openLgEdit(i.id));
    m.on("dragend", () => { const p = m.getLatLng(); i.ll = [p.lat, p.lng]; markChange(); });
    m.addTo(lgMapLayer);
  }
  // Zeichnung in Arbeit
  if(lgDraw && lgDraw.geo && lgDraw.points.length){
    const pts = lgDraw.points.map(p => [p.lat, p.lng]);
    L.polyline(pts, { color:"#C4232B", dashArray:"6 6", weight:3 }).addTo(lgMapLayer);
    for(const p of pts) L.circleMarker(p, { radius:4, color:"#C4232B", fillColor:"#C4232B", fillOpacity:1 }).addTo(lgMapLayer);
  }
  lgDrawbar();
}
function lgDrawbar(){
  const el = document.getElementById("lgMap");
  if(!el) return;
  let bar = el.querySelector(".lg-drawbar");
  if(!(lgDraw && lgDraw.geo)){ if(bar) bar.remove(); return; }
  const need = lgDraw.type === "area" ? 3 : 2;
  if(!bar){ bar = document.createElement("div"); bar.className = "lg-drawbar"; el.appendChild(bar); }
  bar.innerHTML = `<span>${lgDraw.type === "area" ? "Fläche" : "Linie"}: ${lgDraw.points.length} Punkt${lgDraw.points.length===1?"":"e"}${lgDraw.points.length<need?` (mind. ${need})`:""}</span>
    ${lgDraw.points.length>=need?`<button data-dr="ok">Fertig</button>`:""}
    <button data-dr="x">Abbrechen</button>`;
  bar.querySelectorAll("[data-dr]").forEach(b => b.addEventListener("click", ev => {
    ev.stopPropagation();
    if(b.dataset.dr === "x"){ lgDraw = null; lgTool = null; render(); return; }
    const it = { id:uid(), type:lgDraw.type, llpoints:lgDraw.points.slice(), color:"fw" };
    state.lage.items.push(it); const nid = it.id;
    lgDraw = null; lgTool = null; markChange(); render(); openLgShapeEdit(nid);
  }));
}
function lgMapClick(latlng){
  const ll = [latlng.lat, latlng.lng];
  if(lgTool === "line" || lgTool === "area"){
    if(!lgDraw || !lgDraw.geo) lgDraw = { type:lgTool, geo:true, points:[] };
    lgDraw.points.push({ lat:latlng.lat, lng:latlng.lng });
    lgMapRenderLayers();
    return;
  }
  if(!lgTool) return;
  if(lgTool === "car"){
    const num = state.lage.items.filter(i => i.type==="car").reduce((m,i)=>Math.max(m,i.num||0),0)+1;
    const it = { id:uid(), type:"car", num, unitId:"", ll };
    state.lage.items.push(it); lgTool = null; markChange(); render(); openLgEdit(it.id); return;
  }
  if(lgTool === "num"){
    const num = state.lage.items.filter(i => i.type==="num").reduce((m,i)=>Math.max(m,i.num||0),0)+1;
    const it = { id:uid(), type:"num", num, text:"", ll };
    state.lage.items.push(it); lgTool = null; markChange(); render(); openLgEdit(it.id); return;
  }
  if(lgTool.startsWith("sym:")){
    state.lage.items.push({ id:uid(), type:"sym", sym:lgTool.slice(4), label:"", ll });
    lgTool = null; markChange(); render(); return;
  }
  state.lage.items.push({ id:uid(), type:lgTool, label:lgDefaultLabel(lgTool), ll });
  lgTool = null; markChange(); render();
}

function wireLagekarte(){
  $("#lgToMonitor").addEventListener("click", () => { state.view = "monitor"; save(); render(); });
  if(state.lage.mode === "karte") lgMapSetup();
  document.querySelectorAll("[data-lgmode]").forEach(b => b.addEventListener("click", () => {
    state.lage.mode = b.dataset.lgmode;
    lgTool = null; lgDraw = null;
    markChange(); render();
  }));
  document.querySelectorAll("[data-lglayer]").forEach(b => b.addEventListener("click", () => {
    state.lage.mapLayer = b.dataset.lglayer;
    markChange(); render();
  }));
  $("#lgSnapBtn").addEventListener("click", () => { lgFreeze(); render(); });
  document.querySelectorAll("[data-lgsnap]").forEach(b =>
    b.addEventListener("click", () => openLgSnapshot(b.dataset.lgsnap)));
  document.querySelectorAll("[data-lgsnapdel]").forEach(b =>
    b.addEventListener("click", () => {
      modalConfirm("Dieses Lagebild wirklich löschen?").then(ok => { if(!ok) return;
        state.lage.snapshots = state.lage.snapshots.filter(s => s.id !== b.dataset.lgsnapdel);
        markChange(); render();
      });
    }));
  $("#lgBigBtn").addEventListener("click", () => {
    lgBig = !lgBig;
    if(lgBig){
      const rf = document.documentElement.requestFullscreen;
      if(rf) rf.call(document.documentElement).catch(() => {});
    }else if(document.fullscreenElement){
      document.exitFullscreen();
    }
    render();
  });
  document.querySelectorAll("[data-lgtool]").forEach(b => b.addEventListener("click", () => {
    if(b.dataset.lgtool === "symsearch"){ openSymSearch(); return; }
    lgTool = (lgTool === b.dataset.lgtool) ? null : b.dataset.lgtool;
    lgDraw = null;
    render();
  }));
  const cancel = $("#lgCancel");
  if(cancel) cancel.addEventListener("click", () => { lgTool = null; lgDraw = null; render(); });
  const drawDone = $("#lgDrawDone");
  if(drawDone) drawDone.addEventListener("click", () => {
    if(lgDraw && lgDraw.points.length >= (lgDraw.type === "area" ? 3 : 2)){
      state.lage.items.push({ id:uid(), type:lgDraw.type, points:lgDraw.points, color:"fw" });
      const newId = state.lage.items[state.lage.items.length-1].id;
      lgDraw = null; lgTool = null;
      markChange(); render();
      openLgShapeEdit(newId); // direkt Farbe wählen
    }
  });
  document.querySelectorAll("[data-lgedit]").forEach(b =>
    b.addEventListener("click", () => openLgEdit(b.dataset.lgedit)));
  document.querySelectorAll("select[data-lgcar]").forEach(sel =>
    sel.addEventListener("change", () => {
      const it = state.lage.items.find(i => i.id === sel.dataset.lgcar);
      if(it){ it.unitId = sel.value; markChange(); render(); }
    }));
  $("#lgBgBtn").addEventListener("click", () => $("#lgBgFile").click());
  $("#lgBgFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    resizeImage(file, 1920, data => {
      state.lage.bg = data;
      state.lage.mode = "bild";
      try{ markChange(); }catch(err){ modalInfo("Bild zu groß für den lokalen Speicher – bitte kleineres Foto wählen."); state.lage.bg = ""; }
      render();
    });
  });
  const bgDel = $("#lgBgDel");
  if(bgDel) bgDel.addEventListener("click", () => { state.lage.bg = ""; state.lage.mode = "raster"; markChange(); render(); });
  $("#lgBgPaste").addEventListener("click", async () => {
    try{
      const items = await navigator.clipboard.read();
      for(const it of items){
        const type = it.types.find(t => t.startsWith("image/"));
        if(type){
          const blob = await it.getType(type);
          resizeImage(blob, 1920, data => { setLgBg(data); });
          return;
        }
      }
      modalInfo("Kein Bild in der Zwischenablage gefunden – erst einen Screenshot kopieren (z. B. aus dem BayernAtlas).");
    }catch(err){
      modalInfo("Zugriff auf die Zwischenablage nicht möglich. Alternativ: Strg+V direkt auf der Lagekarte, oder den Foto-Knopf nutzen.");
    }
  });
  const clear = $("#lgClear");
  if(clear) clear.addEventListener("click", () => {
    modalConfirm("Alle Symbole von der Lagekarte entfernen?").then(ok => { if(!ok) return;
      state.lage.items = []; markChange(); render();
    });
  });

  // Zoom + Zeichnen nur im Raster-/Bild-Modus (im Karten-Modus gibt es keine Canvas)
  const wrap = $("#lgWrap");
  const canvas = $("#lgCanvas");
  if(!wrap || !canvas) return;
  const setZoom = z => {
    const old = lgZoom;
    lgZoom = Math.min(4, Math.max(1, z));
    if(lgZoom === old) return;
    // Bildmitte beim Zoomen beibehalten
    const cx = (wrap.scrollLeft + wrap.clientWidth/2) / canvas.offsetWidth;
    const cy = (wrap.scrollTop + wrap.clientHeight/2) / canvas.offsetHeight;
    render();
    const w2 = $("#lgWrap"), c2 = $("#lgCanvas");
    w2.scrollLeft = cx * c2.offsetWidth - w2.clientWidth/2;
    w2.scrollTop  = cy * c2.offsetHeight - w2.clientHeight/2;
  };
  $("#lgZoomIn").addEventListener("click", () => setZoom(lgZoom + 0.5));
  $("#lgZoomOut").addEventListener("click", () => setZoom(lgZoom - 0.5));

  // Platzieren, Verschieben, Bearbeiten
  let drag = null;
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.min(98, Math.max(2, (e.clientX - r.left) / r.width * 100)),
      y: Math.min(96, Math.max(4, (e.clientY - r.top) / r.height * 100)),
    };
  };
  wrap.addEventListener("pointerdown", e => {
    const el = e.target.closest(".lg-item");
    drag = { el, id: el ? el.dataset.id : null, sx:e.clientX, sy:e.clientY, moved:false };
    if(el){ wrap.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  wrap.addEventListener("pointermove", e => {
    if(!drag || !drag.el) return;
    if(Math.abs(e.clientX-drag.sx) + Math.abs(e.clientY-drag.sy) > 6) drag.moved = true;
    if(!drag.moved) return;
    const p = pos(e);
    drag.el.style.left = p.x + "%"; drag.el.style.top = p.y + "%";
    drag.x = p.x; drag.y = p.y;
  });
  wrap.addEventListener("pointercancel", () => { drag = null; });
  wrap.addEventListener("pointerup", e => {
    const d = drag; drag = null;
    if(!d) return;
    if(d.el){
      const it = state.lage.items.find(i => i.id === d.id);
      if(!it) return;
      if(d.moved){ it.x = d.x; it.y = d.y; markChange(); }
      else openLgEdit(it.id);
      return;
    }
    // Wischen/Pannen nicht als Platzieren werten
    if(Math.abs(e.clientX-d.sx) + Math.abs(e.clientY-d.sy) > 6) return;
    // Tipp auf Linie/Fläche (ohne aktives Werkzeug) → bearbeiten
    const sh = e.target.closest("[data-shape]");
    if(sh && !lgTool && !lgDraw){ openLgShapeEdit(sh.dataset.shape); return; }
    if(lgTool === "line" || lgTool === "area"){
      const p = pos(e);
      if(!lgDraw) lgDraw = { type: lgTool, points: [] };
      lgDraw.points.push({ x:p.x, y:p.y });
      render();
      return;
    }
    if(lgTool && lgTool.startsWith("sym:")){
      const p = pos(e);
      state.lage.items.push({ id:uid(), type:"sym", sym:lgTool.slice(4), label:"", x:p.x, y:p.y });
      lgTool = null;
      markChange(); render();
      return;
    }
    if(lgTool){
      const p = pos(e);
      if(lgTool === "car"){
        const nextCarNum = state.lage.items.filter(i => i.type === "car")
          .reduce((m,i) => Math.max(m, i.num||0), 0) + 1;
        const item = { id:uid(), type:"car", num:nextCarNum, unitId:"", x:p.x, y:p.y };
        state.lage.items.push(item);
        lgTool = null;
        markChange(); render();
        openLgEdit(item.id); // direkt Fahrzeug zuordnen
      }else if(lgTool === "num"){
        const nextNum = state.lage.items.filter(i => i.type === "num")
          .reduce((m,i) => Math.max(m, i.num||0), 0) + 1;
        const item = { id:uid(), type:"num", num:nextNum, text:"", x:p.x, y:p.y };
        state.lage.items.push(item);
        lgTool = null;
        markChange(); render();
        openLgEdit(item.id); // direkt Beschreibung eintragen
      }else{
        state.lage.items.push({ id:uid(), type:lgTool, label:lgDefaultLabel(lgTool), x:p.x, y:p.y });
        lgTool = null;
        markChange(); render();
      }
    }
  });
}
function openLgSnapshot(id){
  const s = (state.lage.snapshots||[]).find(x => x.id === id);
  if(!s) return;
  const nums = s.items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Lagebild ${fmtZeit(s.zeit)} Uhr">
    <div class="sheet-head">
      <h2>Lagebild ${fmtZeit(s.zeit)} Uhr <span style="font-weight:500;color:var(--ink3);font-size:.85rem">· eingefroren, ${fmtDatum(s.zeit)}</span></h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="lg-wrap" style="pointer-events:none;overflow:hidden">
        <div class="lg-canvas ${s.bg ? "hasbg" : ""}" ${s.bg ? `style="background-image:url('${s.bg}')"` : ""}>
          ${lgShapesSvg(s.items, null)}
          ${s.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
        </div>
      </div>
      ${nums.length ? `
      <div class="lg-legend" style="margin-top:12px">
        <h3>Legende</h3>
        <div class="lg-leg-cols">
          ${nums.map(i => `
          <div class="lg-leg-item">
            <span class="lg-leg-num">${esc(i.num)}</span>
            <span class="lg-leg-text">${esc(i.text || "")}</span>
          </div>`).join("")}
        </div>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-primary btn-block" data-close="1" style="flex:1">Schließen</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
}
/* Symbolsuche: die gängigsten taktischen Zeichen (DV 102) mit Filterfeld */
function openSymSearch(){
  const rows = q => SYM_KATALOG
    .filter(s => !q || s.name.toLowerCase().includes(q))
    .map(s => `
      <button class="sym-row" data-symkey="${esc(s.key)}">
        ${symTile(s, true)}<span class="sym-name">${esc(s.name)}</span>
      </button>`).join("") || `<p class="hint" style="padding:14px 4px">Kein Zeichen gefunden.</p>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Taktische Zeichen">
    <div class="sheet-head">
      <h2>Taktische Zeichen (DV 102)</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label for="symSearch">Suchen</label>
        <input id="symSearch" placeholder="z. B. Brand, Hydrant, Behandlungsplatz …" autocomplete="off"></div>
      <div id="symList">${rows("")}</div>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const wireRows = () => document.querySelectorAll("[data-symkey]").forEach(b =>
    b.addEventListener("click", () => {
      lgTool = "sym:" + b.dataset.symkey;
      lgDraw = null;
      closeEditor(); render();
    }));
  wireRows();
  const inp = $("#symSearch");
  inp.focus();
  inp.addEventListener("input", () => {
    $("#symList").innerHTML = rows(inp.value.trim().toLowerCase());
    wireRows();
  });
}
function openLgShapeEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  const names = { fw:"Rot", thw:"Blau", brk:"Gold", pol:"Grün" };
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${it.type==="area"?"Fläche":"Linie"} bearbeiten" style="top:auto;max-height:55vh">
    <div class="sheet-head">
      <h2>${it.type === "area" ? "Fläche" : "Linie"} bearbeiten</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">
      <div class="field"><label>Farbe</label>
        <div class="swatches">
          ${LG_SHAPE_COLORS.map(c => `
            <button data-shcolor="${c}" style="--sc:var(--${c})" aria-pressed="${(it.color||"fw")===c}" aria-label="${names[c]}"></button>`).join("")}
        </div>
        <p class="hint">z. B. Blau = Schlauchleitung/Wasser, Rot = Absperrung, Gold = Fläche/Bereitstellung, Grün = Abschnitt.</p>
      </div>
      ${it.type === "area" ? `
      <div class="field"><label for="sh-abschnitt">Einsatzabschnitt</label>
        <select id="sh-abschnitt">
          <option value="">– keiner –</option>
          ${state.abschnitte.map(a => `<option value="${esc(a.id)}" ${it.abschnittId===a.id?"selected":""}>${esc(a.name)}</option>`).join("")}
        </select>
        <p class="hint">${state.abschnitte.length ? "Die Fläche wird mit dem Abschnitt verknüpft und dessen Name auf der Karte angezeigt." : "Noch keine Abschnitte angelegt (Tab „Einsatz“)."}</p>
      </div>` : ""}
    </div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="sh-del">Entfernen</button>
      <button class="btn btn-primary" id="sh-save" style="flex:1">Fertig</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  document.querySelectorAll("[data-shcolor]").forEach(b => b.addEventListener("click", () => {
    it.color = b.dataset.shcolor;
    document.querySelectorAll("[data-shcolor]").forEach(x =>
      x.setAttribute("aria-pressed", x.dataset.shcolor === it.color));
    markChange();
  }));
  const abSel = $("#sh-abschnitt");
  if(abSel) abSel.addEventListener("change", () => {
    it.abschnittId = abSel.value || "";
    // Fläche in der Abschnittsfarbe (rot=Accent) einfärben, wenn verknüpft
    if(it.abschnittId){ it.color = "fw"; }
    markChange();
  });
  $("#sh-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#sh-save").addEventListener("click", () => { markChange(); closeEditor(); render(); });
}
function openLgEdit(id){
  const it = state.lage.items.find(i => i.id === id);
  if(!it) return;
  const isNum = it.type === "num", isCar = it.type === "car";
  const fields = isNum ? `
      <div class="field" style="max-width:140px"><label for="lg-num">Nummer</label>
        <input id="lg-num" class="mono" type="number" min="1" max="99" value="${esc(it.num)}"></div>
      <div class="field"><label for="lg-label">Beschreibung (steht in der Legende)</label>
        <input id="lg-label" value="${esc(it.text||"")}" placeholder="z. B. Faltbehälter 10.000 Liter" autocomplete="off"></div>`
    : isCar ? `
      <div class="field"><label for="lg-unit">Fahrzeug (aus den erfassten Einheiten)</label>
        <select id="lg-unit">${lgCarOptions(it.unitId)}</select>
        <p class="hint">Die Zuordnung geht auch jederzeit über die Dropdown-Liste in der Legende.</p></div>`
    : `
      <div class="field"><label for="lg-label">Beschriftung</label>
        <input id="lg-label" value="${esc(it.label||"")}" autocomplete="off"></div>`;
  $("#sheetHost").innerHTML = `
  <div class="sheet-backdrop" data-close="1"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Symbol bearbeiten" style="top:auto;max-height:70vh">
    <div class="sheet-head">
      <h2>${isNum ? `Marker ${esc(it.num)}` : isCar ? `Fahrzeug ${esc(it.num||"")}` : "Symbol bearbeiten"}</h2>
      <button class="sheet-close" data-close="1" aria-label="Schließen">×</button>
    </div>
    <div class="sheet-body">${fields}</div>
    <div class="sheet-foot">
      <button class="btn btn-danger-ghost" id="lg-del">Entfernen</button>
      <button class="btn btn-primary" id="lg-save" style="flex:1">Speichern</button>
    </div>
  </div>`;
  document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeEditor));
  const inp = $("#lg-label");
  if(inp){
    inp.focus();
    inp.addEventListener("keydown", e => { if(e.key === "Enter") $("#lg-save").click(); });
  }
  $("#lg-del").addEventListener("click", () => {
    state.lage.items = state.lage.items.filter(i => i.id !== it.id);
    markChange(); closeEditor(); render();
  });
  $("#lg-save").addEventListener("click", () => {
    if(isNum){
      it.num = Math.max(1, Math.min(99, parseInt($("#lg-num").value, 10) || it.num));
      it.text = inp.value.trim();
    }else if(isCar){
      it.unitId = $("#lg-unit").value;
    }else{
      it.label = inp.value.trim();
    }
    markChange(); closeEditor(); render();
  });
}

/* ---------------- Druck: Einsatzbericht ---------------- */
function printMapHtml(lage){
  if(lage.mode === "karte"){
    return `<p style="font-size:10pt">Lagekarte im Online-Kartenmodus – für den Ausdruck bitte am Gerät
      einen Screenshot der Karte erstellen und als Bild-Hintergrund einfügen. Die Legende steht unten.</p>`;
  }
  return `<div class="p-map">
    <div class="lg-canvas ${lage.bg ? "hasbg" : ""}" ${lage.bg ? `style="background-image:url('${lage.bg}')"` : ""}>
      ${lgShapesSvg(lage.items, null)}
      ${lage.items.filter(i => i.x != null).map(lgMarkerHtml).join("")}
    </div>
  </div>`;
}
function printLegendHtml(items, units){
  const nums = items.filter(i => i.type === "num").sort((a,b) => a.num - b.num);
  const cars = items.filter(i => i.type === "car").sort((a,b) => (a.num||0)-(b.num||0));
  const rows = [
    ...nums.map(i => `<div><strong class="p-mono">▲ ${esc(i.num)}</strong> ${esc(i.text||"")}</div>`),
    ...cars.map(i => {
      const u = (units || []).find(x => x.id === i.unitId);
      return `<div><strong class="p-mono">Fzg ${esc(i.num||"?")}</strong> ${u ? esc(fullName(u)) : "nicht zugeordnet"}</div>`;
    }),
  ].join("");
  return rows ? `<div class="p-legend">${rows}</div>` : "";
}
function doPrint(data){
  const e = data.einsatz;
  const abs = data.abschnitte || [];
  const showAb = abs.length > 0;
  const s = summen(data.einheiten.filter(u => !u.abgerueckt));
  const sAll = summen(data.einheiten);
  const units = [...data.einheiten].sort((a,b) => (a.ankunft||"").localeCompare(b.ankunft||""));
  const unitRows = units.map(u => `
    <tr>
      <td class="p-mono">${fmtZeit(u.ankunft)}</td>
      <td>${esc((ORGS[u.org]||ORGS.SON).label)}</td>
      <td class="p-mono">${esc(fullName(u))}</td>
      ${showAb ? `<td>${esc(abNameOf(u.abschnitt, abs)) || "–"}</td>` : ""}
      <td class="p-mono" style="text-align:right">${staerkeStr(u)}</td>
      <td class="p-mono" style="text-align:right">${u.agt||"–"}</td>
      <td>${u.abgerueckt?"abgerückt":"vor Ort"}</td>
    </tr>`).join("");
  const fkRows = data.fuehrung.map(f => `
    <tr>
      <td>${esc(f.name)}</td>
      <td>${esc(f.funktion)}</td>
      <td>${esc((ORGS[f.org]||ORGS.SON).label)}</td>
      <td>${esc(f.einheit||"–")}</td>
    </tr>`).join("");
  $("#printArea").innerHTML = `
    <div class="p-head">
      <div>
        <div class="p-sub">${esc(state.config.ugName)} · Einsatzbericht · Kräfteübersicht${data.ende ? "" : " · Zwischenstand"}</div>
        <h1>${esc(e.stichwort) || "Ohne Stichwort"}</h1>
        <div>${esc(e.ort)}</div>
      </div>
      <div class="p-mark">ELWIS</div>
    </div>
    <table class="meta">
      <tr><td>Alarmzeit</td><td>${e.beginn ? fmtDatum(e.beginn)+" "+fmtZeit(e.beginn)+" Uhr" : "–"}</td></tr>
      <tr><td>Einsatzende</td><td>${data.ende ? fmtDatum(data.ende)+" "+fmtZeit(data.ende)+" Uhr" : "– (Einsatz läuft)"}</td></tr>
      <tr><td>Einsatzdauer</td><td>${dauerStr(e.beginn, data.ende) || "–"}</td></tr>
      <tr><td>Einsatzleiter</td><td>${esc(e.leiter) || "–"}</td></tr>
      ${(!data.ende && e.lagebespr) ? `<tr><td>Nächste Lagebesprechung</td><td>${esc(e.lagebespr)} Uhr</td></tr>` : ""}
      ${showAb ? `<tr><td>Abschnitte</td><td>${abs.map(a=>{
        const funk=[a.ansprechpartner?`AP ${a.ansprechpartner}`:"",
          a.tmo?`TMO ${a.tmo}`:"",a.dmo?`DMO ${a.dmo}`:""].filter(Boolean).join(", ");
        return esc(a.name)+(funk?` (${esc(funk)})`:"");
      }).join(" · ")}</td></tr>` : ""}
      ${e.bemerkung ? `<tr><td>Bemerkungen</td><td>${esc(e.bemerkung)}</td></tr>` : ""}
    </table>
    <h2>Führungskräfte (${data.fuehrung.length})</h2>
    ${fkRows ? `<table><thead><tr><th>Name</th><th>Funktion</th><th>Organisation</th><th>Einheit / Abschnitt</th></tr></thead><tbody>${fkRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    <h2>Einheiten (${data.einheiten.length})</h2>
    ${unitRows ? `<table><thead><tr><th>Ankunft</th><th>Organisation</th><th>Funkrufname</th>${showAb?"<th>Abschnitt</th>":""}<th>Stärke</th><th>AGT</th><th>Status</th></tr></thead><tbody>${unitRows}</tbody></table>` : "<p>Keine erfasst.</p>"}
    ${(data.asTrupps||[]).length ? `
    <h2>Atemschutz – Trupps (${data.asTrupps.length})</h2>
    <table><thead><tr><th>Nr.</th><th>Träger</th><th>Feuerwehr</th><th>Gerät</th><th>Maske</th><th>Typ</th><th>Start</th><th>Ende</th><th>Abschnitt / Funk</th><th>ab</th><th>zurück</th></tr></thead><tbody>
      ${[...data.asTrupps].sort((a,b)=>a.nr-b.nr).map(t => {
        const ids = t.memberIds||[];
        return ids.map((id,idx) => {
          const tr = (data.asTraeger||[]).find(x=>x.id===id) || {};
          const d = (t.druck||{})[id] || {};
          return `<tr>
            <td class="p-mono">${idx===0?t.nr:""}</td>
            <td>${esc(tr.name||"?")}</td><td>${esc(tr.feuerwehr||"")}</td>
            <td class="p-mono">${esc(tr.geraeteNr||"")}</td><td class="p-mono">${esc(tr.maskeNr||"")}</td>
            <td>${esc(tr.geraetetyp||"")}</td>
            <td class="p-mono">${d.start?esc(d.start):""}</td><td class="p-mono">${d.end?esc(d.end):""}</td>
            <td>${idx===0?esc(t.abschnitt||"–")+(t.funkruf?" / "+esc(t.funkruf):""):""}</td>
            <td class="p-mono">${idx===0&&t.ausgerueckt?fmtZeit(t.ausgerueckt):""}</td>
            <td class="p-mono">${idx===0&&t.rueckkehr?fmtZeit(t.rueckkehr):""}</td>
          </tr>`;
        }).join("");
      }).join("")}
    </tbody></table>` : ""}
    <h2>Nachforderungen (${(data.anforderungen||[]).length})</h2>
    ${(data.anforderungen||[]).length ? `<table><thead><tr><th>Was</th><th>Status</th><th>Angefordert</th><th>Alarmiert</th><th>Eingetroffen</th></tr></thead><tbody>
      ${[...data.anforderungen].sort((a,b) => (a.angefordert||"").localeCompare(b.angefordert||"")).map(a => `
      <tr>
        <td>${esc(a.was)}</td><td>${esc(a.status)}</td>
        <td class="p-mono">${fmtZeit(a.angefordert)}</td>
        <td class="p-mono">${a.alarmiert ? fmtZeit(a.alarmiert) : "–"}</td>
        <td class="p-mono">${a.eingetroffen ? fmtZeit(a.eingetroffen) : "–"}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine.</p>"}
    <h2>Checklisten (${(data.checks||[]).length})</h2>
    ${(data.checks||[]).length ? (data.checks).map(c => `
      <p style="margin:8px 0 4px"><strong>${esc(c.name)}</strong> – ${c.punkte.filter(p=>p.done).length}/${c.punkte.length} erledigt</p>
      <table><tbody>
        ${c.punkte.map(p => `<tr>
          <td style="width:24px">${p.done ? "☑" : "☐"}</td>
          <td>${esc(p.text)}</td>
          <td class="p-mono" style="width:70px;text-align:right">${p.zeit ? fmtZeit(p.zeit) : ""}</td>
        </tr>`).join("")}
      </tbody></table>`).join("") : "<p>Keine.</p>"}
    <h2>Lagebesprechungen (${(data.besprechungen||[]).length})</h2>
    ${(data.besprechungen||[]).length ? `<table><thead><tr><th style="width:110px">Zeit</th><th style="width:180px">Teilnehmer</th><th>Protokoll</th></tr></thead><tbody>
      ${[...data.besprechungen].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(b => `
      <tr>
        <td class="p-mono">${fmtTagKurz(b.zeit)} ${fmtZeit(b.zeit)}</td>
        <td>${esc(b.teilnehmer||"–")}</td>
        <td style="white-space:pre-wrap">${esc(b.protokoll)}</td>
      </tr>`).join("")}
    </tbody></table>` : "<p>Keine protokolliert.</p>"}
    <h2>Funksprüche / Einsatztagebuch (${(data.funk||[]).length})</h2>
    ${(data.funk||[]).length ? (() => {
      const sorted = [...data.funk].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""));
      // Datum nur anzeigen, wenn das Tagebuch über einen Tageswechsel geht
      const mehrtaegig = new Set(sorted.map(f => new Date(f.zeit).toDateString())).size > 1;
      return `<table><thead><tr><th>Nr.</th><th>Zeit</th><th>Von</th><th>An</th><th>Inhalt</th></tr></thead><tbody>
      ${sorted.map((f,idx) => `
      <tr>
        <td class="p-mono">${idx+1}${f.wichtig ? " !" : ""}</td>
        <td class="p-mono">${mehrtaegig ? fmtTagKurz(f.zeit) + " " : ""}${fmtZeit(f.zeit)}</td>
        <td>${esc(f.von)}</td>
        <td>${esc(f.an)}</td>
        <td>${f.wichtig ? `<strong>${esc(f.text)}</strong>` : esc(f.text)}</td>
      </tr>`).join("")}
    </tbody></table>`;})() : "<p>Keine erfasst.</p>"}
    ${(data.lage && data.lage.items && data.lage.items.length) ? `
    <h2>Lagekarte${data.ende ? " (Stand Einsatzende)" : " (aktueller Stand)"}</h2>
    ${printMapHtml(data.lage)}
    ${printLegendHtml(data.lage.items, data.einheiten)}
    ${(data.lage.snapshots||[]).length ? [...data.lage.snapshots]
      .sort((a,b) => (a.zeit||"").localeCompare(b.zeit||""))
      .map(s => `
      <h2>Lagebild ${fmtZeit(s.zeit)} Uhr (${fmtDatum(s.zeit)})</h2>
      ${printMapHtml(s)}
      ${printLegendHtml(s.items, data.einheiten)}`).join("") : ""}` : ""}
    ${(data.fotos||[]).length ? `
    <h2>Fotodokumentation (${data.fotos.length})</h2>
    <div class="p-fotos">
      ${[...data.fotos].sort((a,b) => (a.zeit||"").localeCompare(b.zeit||"")).map(f => `
      <figure>
        <img src="${f.data}" alt="Einsatzfoto">
        <figcaption class="p-mono">${fmtZeit(f.zeit)} Uhr${f.notiz ? " – " + esc(f.notiz) : ""}</figcaption>
      </figure>`).join("")}
    </div>` : ""}
    <p class="p-sum">
      Gesamtstärke über den Einsatz: <span class="p-mono">${sAll.f}/${sAll.u}/${sAll.m}/${sAll.f+sAll.u+sAll.m}</span> · AGT: ${sAll.agt}
      ${data.ende ? "" : ` &nbsp;|&nbsp; aktuell vor Ort: <span class="p-mono">${s.f}/${s.u}/${s.m}/${s.f+s.u+s.m}</span>`}
    </p>
    <div class="p-foot">
      <div class="p-sign">Ort, Datum</div>
      <div class="p-sign">Unterschrift Einsatzleiter</div>
    </div>
    <p style="font-size:8pt;color:#666;margin-top:16px">Gedruckt am ${new Date().toLocaleString("de-DE")} · ELWIS – Kräfteerfassung (Prototyp) · ${esc(state.config.ugName)}</p>`;
  window.print();
}

/* ---------------- Render-Hauptschleife ---------------- */
function render(){
  lgMapTeardown();  // Leaflet-Karte vor dem Neuaufbau des DOM sauber entfernen
  // Auf kleinen Geräten sind Monitor/Lagekarte/Funkskizze nicht verfügbar
  if(!istGrossesGeraet() && (TABS.find(t => t.id === state.view) || {}).nurGross){
    state.view = "kraefte";
  }
  renderHeader();
  document.querySelectorAll("nav [data-tab]").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === state.view));
  const main = $("#view");
  main.classList.toggle("wide", state.view === "monitor" || state.view === "lagekarte");
  main.classList.toggle("w-tablet", state.view === "kraefte");
  main.classList.toggle("w-desk", ["einsatz","funk","bespr","listen","skizze"].includes(state.view));
  $("#footNote").style.display = state.view === "monitor" ? "none" : "";
  if(state.view === "einsatz"){ main.innerHTML = renderEinsatz(); wireEinsatz(); }
  else if(state.view === "kraefte"){ main.innerHTML = renderKraefte(); wireKraefte(); }
  else if(state.view === "funk"){ main.innerHTML = renderFunk(); wireFunk(); }
  else if(state.view === "bespr"){ main.innerHTML = renderBespr(); wireBespr(); }
  else if(state.view === "listen"){ main.innerHTML = renderListen(); wireListen(); }
  else if(state.view === "atemschutz"){ main.innerHTML = renderAtemschutz(); wireAtemschutz(); }
  else if(state.view === "skizze"){ main.innerHTML = renderSkizzeView(); }
  else if(state.view === "lagekarte"){ main.innerHTML = renderLagekarte(); wireLagekarte(); }
  else { main.innerHTML = renderMonitor(); wireMonitor(); }
}
if(!state.einsatz.beginn) state.einsatz.beginn = nowLocalInput();
if(!TABS.some(t => t.id === state.view)) state.view = "einsatz";
render();

// Bei Größenwechsel (Drehen/Fenster) neu bewerten, falls die aktive Ansicht wegfällt
window.matchMedia("(min-width:900px)").addEventListener("change", () => {
  if(!istGrossesGeraet() && (TABS.find(t => t.id === state.view) || {}).nurGross){ render(); }
});

/* ---------------- PWA: Service Worker registrieren ---------------- */
if("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* ================================================================
   Echter Sync mit dem ELW-Server (server/elwis-server.mjs)
   ----------------------------------------------------------------
   Läuft die App vom ELW-Server (gleiche Adresse), wird der Sync
   automatisch aktiv: alle 3 s werden lokale Änderungen gepusht und
   der zusammengeführte Serverstand übernommen (last-write-wins je
   Datensatz, Löschungen über Tombstones). Gesynct wird ALLES zum
   Einsatz; gerätelokal bleiben: Einstellungen, Monitor-Kacheln, Archiv.
   ================================================================ */
const SYNC = { aktiv:false, verbunden:false, seq:0, urls:[], clients:1, pending:0, busy:false };
const SYNC_COLS = ["einheiten","fuehrung","abschnitte","funk","besprechungen",
  "anforderungen","checks","fotos","asTraeger","asTrupps","lageItems","lageSnapshots"];

function syncClientId(){
  let id = localStorage.getItem("elwis-client-id");
  if(!id){ id = uid(); localStorage.setItem("elwis-client-id", id); }
  return id;
}
function syncColOf(name){
  if(name === "lageItems") return state.lage.items;
  if(name === "lageSnapshots") return state.lage.snapshots;
  return state[name];
}
function syncSnapLoad(){
  try{ return JSON.parse(localStorage.getItem("elwis-sync-snap")) || null; }catch(e){ return null; }
}
function syncSnapSave(s){
  try{ localStorage.setItem("elwis-sync-snap", JSON.stringify(s)); }catch(e){}
}
function syncSnapshotVomZustand(){
  const snap = { einsatzId: state.einsatzId,
    singletons: { einsatz: JSON.stringify(state.einsatz), lageBg: JSON.stringify(state.lage.bg) },
    collections: {} };
  for(const name of SYNC_COLS){
    const col = {};
    for(const rec of (syncColOf(name) || [])) col[rec.id] = JSON.stringify(rec);
    snap.collections[name] = col;
  }
  return snap;
}
/* Änderungen seit dem letzten Abgleich ermitteln (Diff gegen Snapshot) */
function syncDiff(){
  const snap = syncSnapLoad();
  const passt = snap && snap.einsatzId === state.einsatzId;
  const now = Date.now();
  const out = { clientId: syncClientId(), einsatzId: state.einsatzId, einsatzStart: state.einsatzStart,
    seq: SYNC.seq, singletons: {}, collections: {}, tombstones: {} };
  let pending = 0;
  const singles = { einsatz: state.einsatz, lageBg: state.lage.bg };
  for(const k of Object.keys(singles)){
    const j = JSON.stringify(singles[k]);
    if(!passt || !snap.singletons || snap.singletons[k] !== j){
      out.singletons[k] = { v: singles[k], _m: now };
      pending++;
    }
  }
  for(const name of SYNC_COLS){
    const arr = syncColOf(name) || [];
    const snapCol = (passt && snap.collections && snap.collections[name]) || {};
    const changed = [];
    const ids = new Set();
    for(const rec of arr){
      ids.add(String(rec.id));
      if(snapCol[rec.id] !== JSON.stringify(rec)){
        rec._m = now;
        changed.push(rec);
      }
    }
    const tomb = {};
    for(const id of Object.keys(snapCol)){
      if(!ids.has(id)){ tomb[id] = now; pending++; }
    }
    if(changed.length) out.collections[name] = changed;
    if(Object.keys(tomb).length) out.tombstones[name] = tomb;
    pending += changed.length;
  }
  return { out, pending };
}
/* Zusammengeführten Serverstand übernehmen (eigene Änderungen waren im Push enthalten) */
function syncApply(server){
  state.einsatzId = server.einsatzId;
  state.einsatzStart = server.einsatzStart;
  if(server.singletons && server.singletons.einsatz) state.einsatz = server.singletons.einsatz.v;
  if(server.singletons && server.singletons.lageBg) state.lage.bg = server.singletons.lageBg.v || "";
  for(const name of SYNC_COLS){
    const arr = (server.collections && server.collections[name]) || [];
    if(name === "lageItems") state.lage.items = arr;
    else if(name === "lageSnapshots") state.lage.snapshots = arr;
    else state[name] = arr;
  }
  syncSnapSave(syncSnapshotVomZustand());
  save();
}
function syncTipptGerade(){
  const a = document.activeElement;
  return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT");
}
async function syncTick(){
  if(SYNC.busy) return;
  SYNC.busy = true;
  try{
    const { out, pending } = syncDiff();
    SYNC.pending = pending;
    const vorher = JSON.stringify(syncSnapshotVomZustand());
    const res = await fetch("./api/sync", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out),
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();
    SYNC.verbunden = true;
    SYNC.clients = d.clients || 1;
    SYNC.seq = d.seq;
    if(!d.unchanged){
      syncApply(d);
      SYNC.pending = 0;
      // Nur neu zeichnen, wenn sich wirklich etwas geändert hat und niemand gerade tippt
      if(JSON.stringify(syncSnapshotVomZustand()) !== vorher && !syncTipptGerade()) render();
      else renderHeader();
    }else{
      if(pending === 0) SYNC.pending = 0;
      renderHeader();
    }
  }catch(err){
    SYNC.verbunden = false;
    renderHeader();
  }finally{
    SYNC.busy = false;
  }
}
function syncPill(){
  if(!SYNC.aktiv) return;
  const pill = $("#syncPill"), txt = $("#syncText"), sw = $("#wlanSwitch");
  if(sw) sw.style.display = "none"; // Simulations-Schalter weg, der Sync ist echt
  if(!pill || !txt) return;
  pill.classList.remove("busy");
  if(SYNC.verbunden){
    pill.classList.add("good");
    txt.textContent = `Synchron · ${SYNC.clients} Gerät${SYNC.clients === 1 ? "" : "e"}`;
  }else{
    pill.classList.remove("good");
    txt.textContent = `Offline · ${SYNC.pending} lokal`;
  }
  const fn = $("#footNote");
  if(fn && SYNC.urls.length){
    fn.textContent = "ELWIS-Sync aktiv · Tablets im gleichen WLAN verbinden über: " + SYNC.urls.join("  ·  ");
  }
}
const _origRenderHeader = renderHeader;
renderHeader = function(){ _origRenderHeader(); syncPill(); };

(async function syncInit(){
  try{
    const res = await fetch("./api/info", { cache: "no-store" });
    if(!res.ok) return;
    const d = await res.json();
    if(!d || !d.elwis) return;
    SYNC.aktiv = true;
    SYNC.urls = d.urls || [];
    syncTick();
    setInterval(syncTick, 3000);
    render();
  }catch(e){ /* kein ELW-Server erreichbar → App läuft eigenständig weiter */ }
})();
